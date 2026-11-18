import {benchmark} from './evaluation.js';

self.onmessage=({data})=>{
  try { self.postMessage({rows:benchmark(data)}); }
  catch(error) { self.postMessage({error:error.message}); }
};
