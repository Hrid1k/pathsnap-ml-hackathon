import {readFile,writeFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=async path=>(await readFile(new URL(path,root),'utf8')).replace(/^\uFEFF/,'');
async function concatenate(files) {
  const modules=await Promise.all(files.map(async name=>
    (await read('src/'+name+'.js')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')));
  return modules.join('\n');
}

const core=['roads','noise','data','matching','evaluation'];
const worker=await concatenate([...core,'experiment-worker']);
const ui=(await concatenate([...core,'export','visualization','ui'])).replace(
  "const worker=new Worker(new URL('./experiment-worker.js',import.meta.url),{type:'module'});",
  "const workerURL=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));\n"+
  "  const worker=new Worker(workerURL);\n"+
  "  const terminate=worker.terminate.bind(worker);\n"+
  "  worker.terminate=()=>{terminate();URL.revokeObjectURL(workerURL);};"
);
const script='const workerSource='+JSON.stringify(worker)+';\n'+ui;
const css=await read('style.css');
const html=(await read('index.html'))
  .replace('<link rel="stylesheet" href="style.css">',()=>'<style>\n'+css+'</style>')
  .replace('<script type="module" src="src/ui.js"></script>',()=>'<script type="module">\n'+script+'\n</script>');
await writeFile(new URL('PathSnap.html',root),html,'utf8');

