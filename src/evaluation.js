import {simulate} from './data.js';
import {Roads} from './roads.js';
import {match} from './matching.js';

function editDistance(a,b) {
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=0;i<a.length;i++) {
    const next=[i+1];
    for(let j=0;j<b.length;j++) {
      next.push(Math.min(row[j+1]+1,next[j]+1,row[j]+Number(a[i]!==b[j])));
    }
    row=next;
  }
  return row.at(-1);
}

export function evaluate(data,result) {
  const metrics={
    residual:result.matches.reduce((sum,p)=>sum+p.error,0)/result.matches.length,
    distance:result.length,ms:result.ms,gaps:result.gaps
  };
  if(!data.truthRoute) return metrics;
  const predicted=new Set(result.segments.filter(id=>id!==null));
  const truth=new Set(data.truthRoute);
  const overlap=[...truth].filter(id=>predicted.has(id)).length;
  return {...metrics,
    point:100*result.matches.filter((p,i)=>p.edge.id===data.truthIds[i]).length/result.matches.length,
    recall:100*overlap/truth.size,
    precision:predicted.size?100*overlap/predicted.size:0,
    similarity:100*(1-editDistance(data.truthRoute,result.segments)/Math.max(data.truthRoute.length,result.segments.length)),
    exact:Number(result.gaps===0 && JSON.stringify(data.truthRoute)===JSON.stringify(result.segments))*100
  };
}

export function compare(data) {
  return ['nearest','hmm'].map(algorithm=>{
    // Independent cold graph caches so neither algorithm gets precomputed routes.
    const result=match(new Roads(data.network),data.observations,{algorithm,sigma:Math.max(3,data.noise)});
    return {result,metrics:evaluate(data,result)};
  });
}

export function benchmark({noise=32,complexity=6,seed=42,trials=10}={}) {
  const rows=[];
  for(const [axis,levels] of [['noise',[0,10,20,30,45,60,80]],['interval',[2,4,6,10,15,30]]]) {
    for(const level of levels) {
      const interval=axis==='interval'?level:6;
      const sigma=axis==='noise'?level:noise;
      const tallies={nearest:{},hmm:{}};
      for(let i=0;i<trials;i++) {
        const data=simulate({noise:sigma,interval,count:120/interval+1,complexity,seed:seed+i});
        for(const {result,metrics} of compare(data)) {
          const tally=tallies[result.algorithm];
          for(const [key,value] of Object.entries(metrics)) tally[key]=(tally[key]??0)+value/trials;
        }
      }
      for(const [algorithm,metrics] of Object.entries(tallies))
        rows.push({axis,level,algorithm,trials,noise:sigma,interval,...metrics});
    }
  }
  return rows;
}
