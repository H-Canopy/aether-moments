import {validate,render,verify,patch,read} from './core.mjs';
import {doctor,init,preview} from './workflow.mjs';
try {
  const [cmd,file,arg]=process.argv.slice(2);
  let r;
  if(cmd==='doctor') {r=doctor(); if(!r.ready) process.exitCode=1;}
  else if(cmd==='init') r=init(file,arg);
  else if(cmd==='preview') r=preview(file);
  else if(cmd==='validate') {const {frames,warnings}=validate(file); r={valid:true,frames,warnings};}
  else if(cmd==='render') r=render(file);
  else if(cmd==='verify') {r=verify(file); if(!r.pass) process.exitCode=1;}
  else if(cmd==='patch') r=patch(file,read(arg));
  else throw Error('usage: node src/cli.mjs validate|render|verify project.json | patch project.json patch.json');
  console.log(JSON.stringify(r,null,2));
} catch(e) {console.error(e.message); process.exitCode=1;}
