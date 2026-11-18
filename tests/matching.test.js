import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,parseGPS} from '../src/data.js';
import {Roads,projection} from '../src/roads.js';
import {match} from '../src/matching.js';
import {benchmark,compare} from '../src/evaluation.js';
import {csv,fixRows} from '../src/export.js';

test('zero-noise simulation recovers the full ordered route',()=>{
  const data=simulate({noise:0});
  const [,hmm]=compare(data);
  assert.deepEqual(hmm.result.segments,data.truthRoute);
  // An exact junction fix can be assigned to either incident road.
  assert.ok(hmm.result.matches.every((fix,i)=>{
    if(fix.edge.id===data.truthIds[i]) return true;
    const p=data.roads.frame.toXY(data.truthPoints[i]);
    return data.roads.candidates(p,8).filter(c=>c.error<1e-6).some(c=>c.edge.id===fix.edge.id);
  }));
  assert.ok(Math.abs(hmm.result.length-data.truthDistance)<1e-5);
});

test('shortest path preserves partial edges and intermediate roads in either direction',()=>{
  const data=simulate();
  const first=data.roads.edges.get(data.truthRoute[0]);
  const third=data.roads.edges.get(data.truthRoute[2]);
  const middle=edge=>data.roads.candidates({x:(edge.a.x+edge.b.x)/2,y:(edge.a.y+edge.b.y)/2},1)[0];
  const a=middle(first),b=middle(third);
  const leg=data.roads.connect(a,b,true);
  assert.ok(Math.abs(leg.length-182.5)<1e-5);
  assert.deepEqual(leg.edges,data.truthRoute.slice(0,3));
  assert.deepEqual(data.roads.connect(b,a,true).edges,data.truthRoute.slice(0,3).reverse());
});

test('nearest reports gaps and HMM rejects impossible paths',()=>{
  const frame=projection(12,77);
  const nodes=[0,10,500,510].map((x,i)=>({id:String(i),...frame.toGPS({x,y:0})}));
  const roads=new Roads({nodes,edges:[{id:'a',from:'0',to:'1'},{id:'b',from:'2',to:'3'}]});
  const observations=[{...nodes[0],timestamp:'2026-01-01T00:00:00Z'},{...nodes[3],timestamp:'2026-01-01T00:00:10Z'}];
  assert.equal(match(roads,observations,{algorithm:'nearest'}).gaps,1);
  assert.throws(()=>match(roads,observations,{k:1}),/No connected path/);
});

test('generated data round-trips through GPS CSV and rejects invalid timestamps and missing values',()=>{
  const data=simulate();
  assert.deepEqual(parseGPS(csv(fixRows(data,compare(data)))),data.observations);
  assert.throws(()=>parseGPS('latitude,longitude,timestamp\n12,77,2026-01-01'),/Invalid/);
  assert.throws(()=>parseGPS('latitude,longitude,timestamp\n,77,2026-01-01T00:00:00Z'),/Invalid/);
  assert.throws(()=>parseGPS(csv([data.observations[1],data.observations[0]])),/strictly increasing/);
});

test('benchmark returns both methods for each level and finite metrics',()=>{
  const rows=benchmark({trials:1,complexity:5});
  assert.equal(rows.length,26);
  assert.ok(rows.every(r=>Number.isFinite(r.ms) && r.similarity>=0 && r.similarity<=100));
  assert.deepEqual(rows.filter(r=>r.noise===0).map(r=>r.similarity),[100,100]);
});

