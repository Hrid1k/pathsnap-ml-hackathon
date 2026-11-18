export function gaussian(seed) {
  let state=seed>>>0;
  const uniform=()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return (state+1)/4294967297;
  };
  return ()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
}

export function perturb(p,sigma,normal) {
  return {x:p.x+sigma*normal(),y:p.y+sigma*normal()};
}
