import {writeFile} from 'node:fs/promises';
import {simulate} from '../src/data.js';
import {benchmark,compare} from '../src/evaluation.js';
import {csv,fixRows,routeReport} from '../src/export.js';
import {drawMap,metricChart} from '../src/visualization.js';

const data=simulate();
const results=compare(data);
const sweep=benchmark();
const destination=new URL('./',import.meta.url);
const save=(file,content)=>writeFile(new URL(file,destination),content,'utf8');
const json=(value)=>JSON.stringify(value,null,2)+'\n';

// Minimal SVG writer for reproducible plots outside the browser.
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
class Element {
  constructor(tag) { this.tag=tag; this.attributes={}; this.children=[]; }
  setAttribute(key,value) { this.attributes[key]=value; }
  append(child) { this.children.push(child); }
  replaceChildren() { this.children=[]; }
  addEventListener() {}
  serialize() {
    const attributes=Object.entries(this.attributes).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('');
    return '<'+this.tag+attributes+'>'+escape(this.textContent??'')+
      this.children.map(c=>c.serialize()).join('')+'</'+this.tag+'>';
  }
}
globalThis.document={createElementNS:(_,tag)=>new Element(tag)};
function plot(viewBox,title,draw) {
  const root=new Element('svg');
  root.setAttribute('xmlns','http://www.w3.org/2000/svg');
  root.setAttribute('viewBox',viewBox);
  root.setAttribute('font-family','system-ui, sans-serif');
  draw(root);
  const label=new Element('title');
  label.textContent=title;
  root.children.unshift(label);
  return root.serialize();
}
const updates={
  'roads.json':json(data.network),
  'gps-noisy.csv':csv(data.observations),
  'gps-clean.csv':csv(data.truthPoints),
  'point-matches.csv':csv(fixRows(data,results)),
  'recovered-routes.json':json(routeReport(data,results)),
  'benchmark.csv':csv(sweep),
  'trajectory.svg':plot('0 0 860 440','Ground truth, raw GPS, nearest-road and HMM routes',root=>
    drawMap(root,data,results,{roads:true,truth:true,raw:true,nearest:true,hmm:true,residual:true},0,()=>{})),
  'noise-effect.svg':plot('0 0 390 190','Ordered route similarity versus GPS noise in metres',root=>metricChart(root,sweep,'noise','similarity')),
  'sampling-effect.svg':plot('0 0 390 190','Ordered route similarity versus sampling interval in seconds',root=>metricChart(root,sweep,'interval','similarity'))
};
await Promise.all(Object.entries(updates).map(([file,content])=>save(file,content)));
console.table(results.map(({result,metrics})=>({method:result.algorithm,...metrics})));
console.log('Ground truth:',data.truthRoute.join(' → '));
for(const {result} of results) console.log(result.algorithm+':',result.segments.join(' → '));
