import {simulate,parseGPS} from './data.js';
import {Roads} from './roads.js';
import {compare,evaluate} from './evaluation.js';
import {match} from './matching.js';
import {drawMap,metricChart} from './visualization.js';
import {csv,fixRows,routeReport} from './export.js';

const $=id=>document.getElementById(id);
const settings=()=>Object.fromEntries([...new FormData($('settings'))].map(([key,value])=>[key,Number(value)]));
const names={nearest:'Nearest road',hmm:'Context-aware HMM'};
const labels={point:'Point accuracy (%)',similarity:'Ordered route similarity (%)',recall:'Segment recall (%)',
  precision:'Segment precision (%)',exact:'Exact route (%)',residual:'Mean GPS residual (m)',
  distance:'Route distance (m)',gaps:'Disconnected gaps',ms:'Runtime (ms)'};
let data,results=[],selected=0,sweep=[];

function table(root,headers,rows) {
  const elem=document.createElement('table');
  const header=elem.createTHead().insertRow();
  for(const value of headers) {
    const cell=document.createElement('th');
    cell.scope='col';
    cell.textContent=value;
    header.append(cell);
  }
  const body=elem.createTBody();
  rows.forEach(row=>{
    const tr=body.insertRow();
    row.forEach(value=>tr.insertCell().textContent=value);
  });
  root.replaceChildren(elem);
}
const fmt=(n,places=1)=>Number.isFinite(n)?n.toFixed(places):'—';

function selectFix(index) {
  selected=index;
  $('fix').value=index+1;
  $('fix').max=data.observations.length;
  const fix=data.observations[index];
  const details=results.map(({result})=>names[result.algorithm]+' '+result.matches[index].edge.id+
    ' ('+fmt(result.matches[index].error)+' m)');
  if(data.truthIds) details.unshift('Truth '+data.truthIds[index]);
  $('fix-info').textContent=['Fix '+(index+1),fix.timestamp,fmt(fix.latitude,6)+', '+fmt(fix.longitude,6),...details].join(' · ');
  const layers=Object.fromEntries([...$('layers').querySelectorAll('input')].map(el=>[el.name,el.checked]));
  drawMap($('map'),data,results,layers,selected,selectFix);
}

function render() {
  $('map-meta').textContent=data.observations.length+' fixes · '+data.roads.edges.size+' road segments · '+
    (data.truthRoute?'Simulated trip':'Imported trip');
  $('export').disabled=!results.length;
  $('metrics').textContent='';
  $('routes').replaceChildren();
  if(results.length) {
    table($('metrics'),['Metric',...results.map(({result})=>names[result.algorithm])],
      Object.entries(labels).filter(([key])=>results.some(r=>key in r.metrics))
        .map(([key,label])=>[label,...results.map(r=>fmt(r.metrics[key],key==='ms'?2:key==='gaps'?0:1))]));
  }
  function route(label,ids,length) {
    const p=document.createElement('p');
    const name=document.createElement('strong');
    name.textContent=label+' · '+fmt(length)+' m · ';
    p.append(name,ids.map(id=>id??'gap').join(' → ') || 'no traversed road');
    $('routes').append(p);
  }
  if(data.truthRoute) route('Ground truth',data.truthRoute,data.truthDistance);
  results.forEach(({result})=>route(names[result.algorithm],result.segments,result.length));
  const rows=fixRows(data,results);
  const headers=Object.keys(rows[0]);
  table($('fix-table'),['Fix',...headers.map(h=>h.replaceAll('_',' '))],
    rows.map((row,i)=>[i+1,...headers.map(h=>typeof row[h]==='number'?fmt(row[h],h.endsWith('_m')?2:6):row[h]??'—')]));
  selectFix(selected);
}

function setData(next,message) {
  data=next;
  selected=0;
  results=[];
  $('status').textContent=message;
  render();
}

function run() {
  const algorithm=$('method').value;
  const sigma=Math.max(3,data.truthRoute?data.noise:settings().noise);
  try {
    if(algorithm==='both') {
      // Recover the baseline even if the HMM cannot connect the imported fixes.
      if(data.truthRoute) results=compare(data);
      else {
        const nearest=match(new Roads(data.network),data.observations,{algorithm:'nearest',sigma});
        results=[{result:nearest,metrics:evaluate(data,nearest)}];
        const hmm=match(new Roads(data.network),data.observations,{algorithm:'hmm',sigma});
        results.push({result:hmm,metrics:evaluate(data,hmm)});
      }
    } else {
      results=[];
      const result=match(new Roads(data.network),data.observations,{algorithm,sigma});
      results=[{result,metrics:evaluate(data,result)}];
    }
    $('status').textContent='Matching complete.';
  } catch(error) {
    $('status').textContent=error.message;
  }
  render();
}

function download(filename,content,type) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('settings').addEventListener('submit',event=>{
  event.preventDefault();
  setData(simulate(settings()),'Trajectory generated. Run map matching to compare.');
});
$('load').addEventListener('click',async()=>{
  try {
    const gps=$('gps-file').files[0],road=$('road-file').files[0];
    if(!gps || !road) throw new Error('Choose both a GPS CSV and a road JSON file.');
    const network=JSON.parse((await road.text()).replace(/^\uFEFF/,''));
    const roads=new Roads(network);
    const observations=parseGPS(await gps.text());
    setData({network,roads,observations},'Loaded. GPS noise is used as the HMM error estimate.');
  } catch(error) { $('status').textContent=error.message; }
});
$('run').addEventListener('click',()=>{if($('settings').reportValidity()) run();});
$('layers').addEventListener('change',()=>selectFix(selected));
$('fix').addEventListener('input',event=>selectFix(Number(event.target.value)-1));
$('export').addEventListener('click',()=>download('matched-trajectory.json',JSON.stringify({
  ...routeReport(data,results),fixes:fixRows(data,results)},null,2),'application/json'));

function charts() {
  $('charts').hidden=false;
  for(const axis of ['noise','interval']) metricChart($(axis+'-chart'),sweep,axis,$('chart-metric').value);
}
$('benchmark').addEventListener('click',()=>{
  if(!$('settings').reportValidity()) return;
  $('benchmark').disabled=true;
  $('experiment-status').textContent='Running 130 paired trials…';
  const worker=new Worker(new URL('./experiment-worker.js',import.meta.url),{type:'module'});
  function stop(message) {
    $('experiment-status').textContent=message;
    $('benchmark').disabled=false;
    worker.terminate();
  }
  worker.onmessage=({data:response})=>{
    if(response.error) {stop(response.error);return;}
    sweep=response.rows;
    charts();
    stop('130 paired trials complete.');
  };
  worker.onerror=()=>stop('The experiment worker could not start. Serve the app over HTTP.');
  worker.postMessage(settings());
});
$('chart-metric').addEventListener('change',charts);
$('export-benchmark').addEventListener('click',()=>download('benchmark.csv',csv(sweep),'text/csv'));

setData(simulate(settings()),'');
run();
