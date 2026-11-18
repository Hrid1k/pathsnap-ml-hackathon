const meters = Math.PI * 6371008.8 / 180;
export const distance = (a,b) => Math.hypot(b.x-a.x,b.y-a.y);
export const interpolate = (a,b,t) => ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export function projection(latitude,longitude) {
  const scale = meters * Math.cos(latitude*Math.PI/180);
  return {
    toXY: p => ({x:(p.longitude-longitude)*scale,y:(p.latitude-latitude)*meters}),
    toGPS: p => ({latitude:latitude+p.y/meters,longitude:longitude+p.x/scale})
  };
}

export class Roads {
  constructor({nodes,edges}) {
    if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length<2 || !edges.length)
      throw new Error('Provide a network with nodes and edges.');
    const validId = id => typeof id==='string' && id.trim();
    for (const p of nodes) {
      if (!validId(p.id) || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)
          || Math.abs(p.latitude)>=89 || Math.abs(p.longitude)>180)
        throw new Error('Invalid road node identifier or coordinates.');
    }
    this.frame = projection(nodes[0].latitude,nodes[0].longitude);
    this.nodes = new Map(nodes.map(p=>[p.id,this.frame.toXY(p)]));
    this.adjacency = new Map(nodes.map(p=>[p.id,[]]));
    this.edges = new Map();
    this.cache = new Map();
    if (this.nodes.size!==nodes.length) throw new Error('Duplicate node identifier.');
    for (const {id,from,to} of edges) {
      const a=this.nodes.get(from), b=this.nodes.get(to);
      if (!validId(id) || this.edges.has(id) || !a || !b || distance(a,b)<1e-6)
        throw new Error('Invalid road edge or duplicate identifier.');
      const edge={id,from,to,a,b,length:distance(a,b)};
      this.edges.set(id,edge);
      this.adjacency.get(from).push({node:to,edge});
      this.adjacency.get(to).push({node:from,edge});
    }
  }

  candidates(p,k) {
    return [...this.edges.values()].map(edge=>{
      const {a,b,length}=edge;
      const t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/length**2));
      const xy=interpolate(a,b,t);
      return {edge,xy,t,error:distance(p,xy)};
    }).sort((a,b)=>a.error-b.error).slice(0,k);
  }

  shortestTree(source) {
    if (this.cache.has(source)) return this.cache.get(source);
    const lengths=new Map([[source,0]]), previous=new Map(), pending=new Set([source]);
    while (pending.size) {
      let current;
      for (const node of pending) {
        if (current===undefined || lengths.get(node)<lengths.get(current)) current=node;
      }
      pending.delete(current);
      for (const {node,edge} of this.adjacency.get(current)) {
        const length=lengths.get(current)+edge.length;
        if (length >= (lengths.get(node) ?? Infinity)) continue;
        lengths.set(node,length);
        previous.set(node,{current,edge});
        pending.add(node);
      }
    }
    const tree={lengths,previous};
    this.cache.set(source,tree);
    return tree;
  }

  connect(a,b,geometry=false) {
    let best=a.edge===b.edge ? {length:distance(a.xy,b.xy)} : {length:Infinity};
    const ends=c=>[[c.edge.from,c.t*c.edge.length],[c.edge.to,(1-c.t)*c.edge.length]];
    for (const [from,first] of ends(a)) {
      const tree=this.shortestTree(from);
      for (const [to,last] of ends(b)) {
        const length=first+(tree.lengths.get(to)??Infinity)+last;
        if (length+1e-8<best.length) best={length,from,to,first,last,tree};
      }
    }
    if (!geometry || !Number.isFinite(best.length)) return best;
    if (!best.tree) return {...best,points:[a.xy,b.xy],edges:[a.edge.id]};
    const nodes=[best.to], edges=[];
    for (let node=best.to; node!==best.from;) {
      const {current,edge}=best.tree.previous.get(node);
      edges.push(edge.id);
      nodes.push(current);
      node=current;
    }
    edges.reverse();
    if (best.first>1e-7) edges.unshift(a.edge.id);
    if (best.last>1e-7) edges.push(b.edge.id);
    return {...best,edges,points:[a.xy,...nodes.reverse().map(id=>this.nodes.get(id)),b.xy]};
  }
}
