import {Roads,projection,interpolate} from './roads.js';
import {gaussian,perturb} from './noise.js';

export const collapse = ids => ids.filter((id,i)=>!i || ids[i-1]!==id);

export function simulate({noise=32,interval=5,count=24,complexity=6,seed=42}={}) {
  const frame=projection(12.97,77.59);
  const nodes=[],edges=[],lookup=new Map();
  const id=(x,y)=>x+':'+y;
  function add(from,to) {
    const edge={id:'R'+(edges.length+1),from,to};
    edges.push(edge);
    lookup.set(from+'>'+to,edge.id);
  }
  for(let y=0;y<complexity;y++) for(let x=0;x<complexity;x++) {
    nodes.push({id:id(x,y),...frame.toGPS({x:100*x,y:65*y})});
    if(x) add(id(x-1,y),id(x,y));
    if(y) add(id(x,y-1),id(x,y));
  }
  const path=[id(0,1),id(1,1),id(2,1),id(2,2),id(3,2),id(4,2),id(4,3),id(4,4)];
  for(let x=5;x<complexity;x++) path.push(id(x,4));
  const network={nodes,edges};
  const roads=new Roads(network);
  const route=path.slice(1).map((node,i)=>roads.edges.get(lookup.get(path[i]+'>'+node)));
  const total=route.reduce((sum,e)=>sum+e.length,0);
  const normal=gaussian(seed);
  const observations=[],truthPoints=[],truthIds=[];
  for(let i=0;i<count;i++) {
    let offset=total*i/(count-1), index=0;
    while(index<route.length-1 && offset>=route[index].length-1e-7) offset-=route[index++].length;
    const edge=route[index];
    const loc=interpolate(edge.a,edge.b,Math.max(0,Math.min(1,offset/edge.length)));
    const timestamp=new Date(Date.UTC(2026,0,1)+1000*i*interval).toISOString();
    observations.push({timestamp,...roads.frame.toGPS(perturb(loc,noise,normal))});
    truthPoints.push({timestamp,...roads.frame.toGPS(loc)});
    truthIds.push(edge.id);
  }
  return {network,roads,observations,truthPoints,truthIds,truthRoute:route.map(e=>e.id),
    truthGeometry:path.map(node=>roads.nodes.get(node)),truthDistance:total,noise};
}

export function parseGPS(text) {
  const lines=text.trim().split(/\r?\n/);
  const header=lines.shift().replace(/^\uFEFF/,'').split(',').map(s=>s.trim().toLowerCase());
  const indexes=['latitude','longitude','timestamp'].map(key=>header.indexOf(key));
  if(indexes.includes(-1)) throw new Error('CSV requires latitude, longitude and timestamp columns.');
  const rows=lines.filter(line=>line.trim()).map((line,i)=>{
    const fields=line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));
    const [lat,lon,time]=indexes.map(j=>fields[j]);
    const latitude=Number(lat),longitude=Number(lon);
    const ms=/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/i.test(time??'') ? Date.parse(time) : NaN;
    if(!lat || !lon || !Number.isFinite(latitude) || !Number.isFinite(longitude)
       || Math.abs(latitude)>=89 || Math.abs(longitude)>180 || !Number.isFinite(ms))
      throw new Error('Invalid coordinate or ISO 8601 timestamp on data row '+(i+1)+'.');
    return {latitude,longitude,timestamp:new Date(ms).toISOString()};
  });
  if(rows.length<2 || rows.length>1000) throw new Error('Provide 2 to 1,000 GPS fixes.');
  if(rows.some((p,i)=>i && p.timestamp<=rows[i-1].timestamp))
    throw new Error('GPS timestamps must be strictly increasing.');
  return rows;
}
