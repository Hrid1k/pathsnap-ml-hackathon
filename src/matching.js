import {collapse} from './data.js';

function transition(roads,a,b,observed,seconds,sigma) {
  const connected=roads.connect(a,b).length;
  const moved=Math.hypot(observed.x,observed.y);
  const dx=b.xy.x-a.xy.x, dy=b.xy.y-a.xy.y;
  const snapped=Math.hypot(dx,dy);
  const headingWeight=Math.min(1,2*moved/sigma);
  const heading=snapped>1 && moved>1 ? headingWeight*(1-(dx*observed.x+dy*observed.y)/(snapped*moved)) : 0;
  const excessSpeed=Math.max(0,connected-45*seconds-2*sigma);
  return Math.abs(connected-moved)/Math.max(5,0.55*sigma)+heading+excessSpeed/20;
}

function viterbi(roads,rows,xy,observations,sigma) {
  const emission=c=>0.5*(c.error/sigma)**2;
  let costs=rows[0].map(emission);
  const pointers=[];
  for(let i=1;i<rows.length;i++) {
    // Estimate local velocity across several fixes to reduce noise inflation.
    const radius=sigma>5?2:0;
    const lo=Math.max(0,i-1-radius), hi=Math.min(xy.length-1,i+radius);
    const span=Date.parse(observations[hi].timestamp)-Date.parse(observations[lo].timestamp);
    const fraction=(Date.parse(observations[i].timestamp)-Date.parse(observations[i-1].timestamp))/span;
    const observed={x:(xy[hi].x-xy[lo].x)*fraction,y:(xy[hi].y-xy[lo].y)*fraction};
    const seconds=(Date.parse(observations[i].timestamp)-Date.parse(observations[i-1].timestamp))/1000;
    const previous=[];
    const next=rows[i].map(b=>{
      let best=Infinity, index=-1;
      rows[i-1].forEach((a,j)=>{
        const cost=costs[j]+transition(roads,a,b,observed,seconds,sigma);
        if(cost<best) { best=cost; index=j; }
      });
      previous.push(index);
      return best+emission(b);
    });
    costs=next;
    pointers.push(previous);
  }
  const score=Math.min(...costs);
  if(!Number.isFinite(score)) throw new Error('No connected path through the candidate roads.');
  let index=costs.indexOf(score);
  const matches=[rows.at(-1)[index]];
  for(let i=rows.length-2;i>=0;i--) {
    index=pointers[i][index];
    matches.push(rows[i][index]);
  }
  return {matches:matches.reverse(),cost:score};
}

export function match(roads,observations,{algorithm='hmm',sigma=25,k=8}={}) {
  if(!['nearest','hmm'].includes(algorithm) || observations.length<2 || !(sigma>0) || !Number.isInteger(k) || k<1)
    throw new Error('Invalid matching options or trajectory.');
  const start=performance.now();
  const xy=observations.map(roads.frame.toXY);
  const rows=xy.map(p=>roads.candidates(p,algorithm==='nearest'?1:k));
  const {matches,cost=null}=algorithm==='nearest'
    ? {matches:rows.map(r=>r[0])} : viterbi(roads,rows,xy,observations,sigma);
  const segments=[],parts=[[matches[0].xy]];
  let length=0,gaps=0;
  for(let i=1;i<matches.length;i++) {
    const leg=roads.connect(matches[i-1],matches[i],true);
    if(!Number.isFinite(leg.length)) {
      gaps++;
      parts.push([matches[i].xy]);
      segments.push(null);
      continue;
    }
    parts.at(-1).push(...leg.points.slice(1));
    segments.push(...leg.edges);
    length+=leg.length;
  }
  return {algorithm,matches,segments:collapse(segments),parts,length,gaps,cost,ms:performance.now()-start};
}

