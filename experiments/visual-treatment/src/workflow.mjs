import fs from 'node:fs';
import path from 'node:path';
import {run,read,write,validate,asset} from './core.mjs';

export function doctor() {
  const checks={node:Number(process.versions.node.split('.')[0])>=22};
  for(const name of ['ffmpeg','ffprobe']) {try {run(name,['-version']); checks[name]=true;} catch {checks[name]=false;}}
  checks.font=fs.existsSync(process.env.AETHER_FONT || 'C:/Windows/Fonts/simhei.ttf');
  return {ready:Object.values(checks).every(Boolean),checks};
}

// Intake is supplied by the host Agent after relating each photo to supplied facts.
// The execution layer deliberately does not invent a story or interpret an image.
export function init(intakeFile,destination) {
  const input=read(intakeFile),base=path.dirname(path.resolve(intakeFile));
  if(!Array.isArray(input.scenes) || !input.scenes.length) throw Error('intake requires Agent-authored scenes');
  const root=path.resolve(destination);
  if(fs.existsSync(root)) throw Error('destination already exists; choose a new project directory');
  const photos=input.scenes.map(s=>{
    const file=path.resolve(base,s.asset);
    if(!/\.(png|jpe?g)$/i.test(file) || !fs.statSync(file).isFile()) throw Error('intake photo missing or unsupported');
    return file;
  });
  fs.mkdirSync(path.join(root,'assets'),{recursive:true});
  const p={...input,version:1,width:input.width??720,height:input.height??1280,fps:input.fps??24,scenes:input.scenes.map((s,i)=>({...s,asset:`assets/photo-${i+1}${path.extname(photos[i]).toLowerCase()}`}))};
  for(let i=0;i<photos.length;i++) fs.copyFileSync(photos[i],path.join(root,p.scenes[i].asset));
  if(input.audio!=null) {
    const audioSource=path.resolve(base,input.audio.asset);
    p.audio={...input.audio,asset:`assets/audio${path.extname(audioSource).toLowerCase()}`};
    fs.copyFileSync(audioSource,path.join(root,p.audio.asset));
  }
  const file=path.join(root,'project.json'); write(file,p);
  try {validate(file);} catch(e) {write(path.join(root,'intake-error.json'),{error:e.message,status:'invalid; not rendered'}); throw e;}
  write(path.join(root,'provenance.json'),{kind:input.exampleKind??'user-supplied',sources:input.sources??[],note:'Facts and permissions require host Agent review. Original source files were copied, not modified.'});
  return {project:file,scenes:p.scenes.length};
}

export function preview(file) {
  const {p,root}=validate(file);
  const media=p.scenes.map(s=>`data:image/${/\.png$/i.test(s.asset)?'png':'jpeg'};base64,${fs.readFileSync(asset(root,s.asset)).toString('base64')}`);
  const data=JSON.stringify({p,media}).replaceAll('<','\\u003c');
  const html=`<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AETHER Moments · 可编辑分镜</title><style>body{margin:0;background:#171b21;color:#faf2e8;font:16px system-ui}main{max-width:1000px;margin:auto;padding:32px}h1{font-family:Georgia;font-size:36px}p{color:#c6c2bb}article{display:grid;grid-template-columns:minmax(150px,1fr) 2fr;gap:24px;border-top:1px solid #454440;padding:24px 0}img{width:100%;height:240px;object-fit:contain;background:#101319}label{display:block;margin:12px 0}input,textarea,select,button{font:inherit;padding:10px;border-radius:6px;border:1px solid #777;background:#242a32;color:white}textarea{box-sizing:border-box;width:100%;height:80px}button{cursor:pointer;background:#b5d6c5;color:#151a1e;margin-right:12px}small{color:#c6c2bb}@media(max-width:600px){article{grid-template-columns:1fr}}</style><main><h1>AETHER Moments</h1><p>可编辑分镜 · 本地离线预览</p><p>修改字幕和时长后下载工程文件，替换原目录 project.json，再由 Agent 重新渲染。此页面展示分镜，视频效果以实际成片为准。</p><button id="save">下载修改后的 project.json</button><p id="status"></p><section id="scenes"></section></main><script>const {p,media}=${data};const section=document.getElementById('scenes');p.scenes.forEach((s,i)=>{const a=document.createElement('article'),im=document.createElement('img'),box=document.createElement('div'),heading=document.createElement('h2');im.src=media[i];im.alt='第'+(i+1)+'幕照片';heading.textContent='第 '+(i+1)+' 幕 · '+s.id;box.append(heading);const label=document.createElement('label');label.textContent='字幕';const text=document.createElement('textarea');text.value=s.caption;text.maxLength=36;text.oninput=()=>{s.caption=text.value};label.append(text);box.append(label);const timing=document.createElement('label');timing.textContent='停留秒数 ';const input=document.createElement('input');input.type='number';input.min=1;input.max=20;input.step=0.1;input.value=s.seconds;input.oninput=()=>s.seconds=Number(input.value);timing.append(input);box.append(timing);const motionLabel=document.createElement('label');motionLabel.textContent='照片运动 ';const motion=document.createElement('select');[['still','静止'],['push','缓慢推近'],['pull','缓慢拉远']].forEach(([value,title])=>{const option=document.createElement('option');option.value=value;option.textContent=title;motion.append(option)});motion.value=s.motion??'still';motion.onchange=()=>s.motion=motion.value;motionLabel.append(motion);box.append(motionLabel);const facts=document.createElement('small');facts.textContent=s.factIds.map(id=>p.facts.find(f=>f.id===id)?.text).join(' / ');box.append(facts);a.append(im,box);section.append(a)});document.getElementById('save').onclick=()=>{if(p.scenes.some(s=>!s.caption.trim()||[...s.caption].length>36||/[\\r\\n]/.test(s.caption)||!Number.isFinite(s.seconds)||s.seconds<1||s.seconds>20)){document.getElementById('status').textContent='请检查字幕（单行且最多36字）和时长（1–20秒）。';return}const url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)+'\\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('status').textContent='已下载。替换工程文件后，让 Agent 重新渲染与检查。'};</script></html>`;
  fs.writeFileSync(path.join(root,'preview.html'),html); return {preview:path.join(root,'preview.html')};
}
