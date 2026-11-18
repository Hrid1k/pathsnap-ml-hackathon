const ns='http://www.w3.org/2000/svg';
const palette={truth:'#158463',raw:'#ba4b2d',nearest:'#8256bd',hmm:'#1664cb'};
const W=860,H=440;
function svg(tag,attrs={},content) {
  const node=document.createElementNS(ns,tag);
  for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
  if(content!==undefined) node.textContent=content;
  return node;
}

export function drawMap(root,data,results,layers,selected,onSelect) {
  root.replaceChildren();
  const raw=data.observations.map(data.roads.frame.toXY);
  const points=[...data.roads.nodes.values(),...raw];
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const left=Math.min(...xs),right=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys);
  const scale=Math.min((W-74)/Math.max(1,right-left),(H-74)/Math.max(1,top-bottom));
  const x=p=>W/2+(p.x-(left+right)/2)*scale;
  const y=p=>H/2-(p.y-(bottom+top)/2)*scale;
  function trace(points,color,width,dash='none',arrows=false) {
    root.append(svg('polyline',{points:points.map(p=>x(p)+','+y(p)).join(' '),fill:'none',
      stroke:color,'stroke-width':width,'stroke-linejoin':'round','stroke-linecap':'round','stroke-dasharray':dash}));
    if(!arrows) return;
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i];
      const dx=x(b)-x(a),dy=y(b)-y(a);
      if(Math.hypot(dx,dy)<23) continue;
      root.append(svg('path',{d:'M -5 -4 L 3 0 L -5 4',fill:'none',stroke:color,'stroke-width':2,
        transform:'translate('+((x(a)+x(b))/2)+' '+((y(a)+y(b))/2)+') rotate('+Math.atan2(dy,dx)*180/Math.PI+')'}));
    }
  }
  if(layers.roads) for(const edge of data.roads.edges.values()) trace([edge.a,edge.b],'#d4dde0',3);
  if(layers.truth && data.truthGeometry) trace(data.truthGeometry,palette.truth,10,'none',true);
  for(const {result} of results) {
    const key=result.algorithm;
    if(layers[key]) for(const part of result.parts) trace(part,palette[key],key==='hmm'?3:5,key==='nearest'?'8 6':'none',true);
  }
  if(layers.residual) for(const {result} of results) {
    if(!layers[result.algorithm]) continue;
    result.matches.forEach((c,i)=>trace([raw[i],c.xy],i===selected?palette[result.algorithm]:'#91a1a9',i===selected?2:1,'3 4'));
  }
  if(layers.raw) {
    trace(raw,palette.raw,1.5,'3 4',true);
    raw.forEach((p,i)=>{
      const dot=svg('circle',{cx:x(p),cy:y(p),r:i===selected?7:4.5,fill:palette.raw,
        stroke:'white','stroke-width':1.5,tabindex:0,role:'button','aria-label':'Inspect GPS fix '+(i+1)});
      dot.append(svg('title',{},'Fix '+(i+1)+' · '+data.observations[i].timestamp));
      dot.addEventListener('click',()=>onSelect(i));
      dot.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)) {event.preventDefault();onSelect(i);}});
      root.append(dot);
      if(i===selected || i===0 || i===raw.length-1)
        root.append(svg('text',{x:x(p)+9,y:y(p)-7,fill:palette.raw,'font-size':12,'font-weight':700},i+1));
    });
  }
  root.append(svg('text',{x:24,y:414,fill:'#52646a','font-size':12},'↑ North'));
  root.append(svg('line',{x1:85,y1:410,x2:85+50*scale,y2:410,stroke:'#52646a','stroke-width':2}));
  root.append(svg('text',{x:92+50*scale,y:414,fill:'#52646a','font-size':12},'50 m'));
}

export function metricChart(root,rows,axis,key) {
  root.replaceChildren();
  const data=rows.filter(r=>r.axis===axis);
  const max=Math.max(...data.map(r=>r.level)),min=Math.min(...data.map(r=>r.level));
  const x=value=>53+(value-min)/(max-min)*305;
  const y=value=>164-value*1.41;
  for(const tick of [0,25,50,75,100]) {
    root.append(svg('line',{x1:49,y1:y(tick),x2:365,y2:y(tick),stroke:'#dce4e6'}));
    root.append(svg('text',{x:43,y:y(tick)+4,'text-anchor':'end',fill:'#52646a','font-size':10},tick+'%'));
  }
  for(const level of new Set(data.map(r=>r.level)))
    root.append(svg('text',{x:x(level),y:183,'text-anchor':'middle',fill:'#52646a','font-size':10},level));
  for(const method of ['nearest','hmm']) {
    const series=data.filter(r=>r.algorithm===method);
    root.append(svg('polyline',{points:series.map(r=>x(r.level)+','+y(r[key])).join(' '),
      fill:'none',stroke:palette[method],'stroke-width':2.5,'stroke-dasharray':method==='nearest'?'5 3':'none'}));
    for(const row of series) {
      const circle=svg('circle',{cx:x(row.level),cy:y(row[key]),r:4,fill:palette[method]});
      circle.append(svg('title',{},method+' · '+row[key].toFixed(1)+'%'));
      root.append(circle);
    }
  }
}
