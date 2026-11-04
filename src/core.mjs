import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {planTimeline,renderCinematic,verifyCinematic} from './cinematic.mjs';
import {validateLayers} from './layers.mjs';
export const hash = x => crypto.createHash('sha256').update(x).digest('hex');
export const read = p => JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
export const write = (p,x) => {fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
export function run(cmd,args,cwd) {
  if(cmd==='ffmpeg'&&!args.includes('-version'))args=['-xerror','-threads','2','-filter_threads','1','-filter_complex_threads','1',...args.slice(0,-1),'-threads','2',args.at(-1)];
  if(cmd==='ffprobe'&&!args.includes('-version'))args=['-threads','2',...args];
  const r=spawnSync(cmd,args,{cwd,encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true});
  if(r.error || r.status!==0) throw new Error(`${cmd}: ${r.error?.message || r.stderr}`);
  return r.stdout;
}
export function asset(root,p,kind='photo') {
  if(typeof p!=='string' || path.isAbsolute(p)) throw Error('asset must be relative');
  const real=fs.realpathSync(path.resolve(root,p)), base=fs.realpathSync(root)+path.sep;
  if(!real.startsWith(base)) throw Error('asset escapes project');
  if(!(kind==='audio'?/\.(wav|mp3|m4a|flac|ogg)$/i:/\.(png|jpe?g)$/i).test(real)) throw Error('unsupported asset format');
  if(fs.statSync(real).size>(kind==='audio'?100:30)*1024*1024) throw Error('asset size limit exceeded');
  return real;
}
export function validate(file) {
  const p=read(file), root=path.dirname(path.resolve(file));
  if(!['classic','cinematic'].includes(p.presentation??'classic'))throw Error('invalid presentation');
  if(p.version!==1 || !Array.isArray(p.facts) || !p.facts.length) throw Error('version/facts invalid');
  const ids=p.facts.map(f=>f.id);
  if(new Set(ids).size!==ids.length || p.facts.some(f=>!f.id || typeof f.text!=='string' || !f.text.trim())) throw Error('invalid facts');
  if(![24,25,30].includes(p.fps) || !Number.isInteger(p.width) || !Number.isInteger(p.height) || p.width%2 || p.height%2 || p.width<320 || p.height<320 || p.width>1920 || p.height>1920) throw Error('invalid output dimensions/fps');
  if(!Array.isArray(p.scenes) || p.scenes.length<1 || p.scenes.length>30) throw Error('invalid scenes');
  if(p.audio!=null) {
    if(!Number.isFinite(p.audio.gain) || p.audio.gain<0 || p.audio.gain>1) throw Error('audio gain must be 0..1');
    const meta=JSON.parse(run('ffprobe',['-v','error','-show_streams','-of','json',asset(root,p.audio.asset,'audio')]));
    if(!meta.streams.some(s=>s.codec_type==='audio')) throw Error('asset has no audio stream');
  }
  const seen=new Set(); let frames=0; const warnings=[];
  for(const s of p.scenes) {
    if(!['still','push','pull'].includes(s.motion??'still')) throw Error('motion must be still, push or pull');
    if(!/^[a-zA-Z0-9_-]+$/.test(s.id) || seen.has(s.id)) throw Error('invalid/duplicate scene id'); seen.add(s.id);
    if(!Number.isFinite(s.seconds) || s.seconds<1 || s.seconds>20) throw Error('scene seconds must be 1..20');
    if(typeof s.caption!=='string' || !s.caption.trim() || [...s.caption].length>36 || /[\r\n\x00-\x1f]/.test(s.caption)) throw Error('caption must be a single line, <=36 characters');
    if(!Array.isArray(s.factIds) || !s.factIds.length || s.factIds.some(f=>!ids.includes(f))) throw Error('missing fact reference');
    const a=asset(root,s.asset); const meta=JSON.parse(run('ffprobe',['-v','error','-show_streams','-of','json',a]));
    if(!meta.streams.some(x=>x.codec_type==='video' && x.width>0 && x.height>0)) throw Error('unreadable photo');
    validateLayers(p,s,root,{asset,run});
    const sf=s.seconds*p.fps;
    if(!Number.isInteger(sf)) warnings.push({sceneId:s.id,kind:'non-integer-frames',seconds:s.seconds,fps:p.fps,frames:Math.round(sf),message:`scene ${s.id}: ${s.seconds}s × ${p.fps}fps = ${sf} frames is not an integer; rounded to ${Math.round(sf)} frames`});
    frames+=Math.round(sf);
  }
  if(p.presentation==='cinematic')frames=planTimeline(p).frames;
  if(frames/p.fps>180) throw Error('prototype limit: 180 seconds');
  return {p,root,frames,warnings};
}
export function patch(file,change) {
  const {p,root}=validate(file); const s=p.scenes.find(x=>x.id===change.sceneId);
  const global=change.scope==='project';
  if((!global&&!s) || !change.changes || Object.keys(change.changes).some(k=>!(global?['audio','endTitle']:['caption','seconds','asset','factIds','motion','camera','transition','layers']).includes(k))) throw Error('invalid scoped patch');
  const before=fs.readFileSync(file), next=structuredClone(p);
  Object.assign(global?next:next.scenes.find(x=>x.id===s.id),change.changes);
  const temp=path.join(root,`.validate-${crypto.randomUUID()}.json`);
  try {write(temp,next); validate(temp);} finally {fs.rmSync(temp,{force:true});}
  const id=crypto.randomUUID(); const history=path.join(root,'history');
  write(path.join(history,id+'.json'),{sceneId:s?.id??null,scope:global?'project':'scene',changes:change.changes,before:hash(before),after:hash(JSON.stringify(next)),previous:p});
  write(file,next); return {sceneId:s?.id??null,scope:global?'project':'scene',history:id};
}
function esc(p) {return p.replaceAll('\\','/').replaceAll(':','\\:').replaceAll("'","'\\''");}
export function render(file) {
  if(read(file).presentation==='cinematic')return renderCinematic(file,{validate,run,asset,hash,read,write});
  const {p,root,frames,warnings}=validate(file), build=path.join(root,'build'); fs.mkdirSync(build,{recursive:true});
  const font=process.env.AETHER_FONT || 'C:/Windows/Fonts/simhei.ttf';
  if(!fs.existsSync(font)) throw Error('set AETHER_FONT to an installed licensed font');
  const manifest={projectHash:hash(fs.readFileSync(file)),frames,sceneKeys:[],adapter:'ffmpeg-v2',audio:p.audio?'local-track':'silent',audioHash:p.audio?hash(fs.readFileSync(asset(root,p.audio.asset,'audio'))):null,warnings:warnings||[],versions:{node:process.version,ffmpeg:run('ffmpeg',['-version']).split('\n')[0]}};
  for(const s of p.scenes) {
    const a=asset(root,s.asset), n=Math.round(s.seconds*p.fps), key=hash(JSON.stringify({s,w:p.width,h:p.height,fps:p.fps,asset:hash(fs.readFileSync(a)),font:hash(fs.readFileSync(font)),adapter:manifest.adapter,ffmpeg:manifest.versions.ffmpeg}));
    const clip=`${s.id}-${key}.mp4`; manifest.sceneKeys.push({id:s.id,key,clip});
    fs.writeFileSync(path.join(build,`${s.id}.txt`),s.caption);
    if(!fs.existsSync(path.join(build,clip))) {
      const size=Math.min(Math.floor(p.width/22),Math.floor((p.width-48)/Math.max([...s.caption].length,1)));
      const photoHeight=Math.floor(p.height*0.8/2)*2;
      const motion=s.motion??'still', progress=`min(on/${Math.max(n-1,1)},1)`;
      const zoom=motion==='push'?`1+0.06*${progress}`:`1.06-0.06*${progress}`;
      // Guard bands keep the entire photograph visible even at maximum zoom.
      const imageW=motion==='still'?p.width:Math.floor(p.width*0.88/2)*2;
      const imageH=motion==='still'?photoHeight:Math.floor(photoHeight*0.88/2)*2;
      const move=motion==='still'?'':`,zoompan=z='${zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${p.width}x${p.height}:fps=${p.fps}`;
      const vf=`scale=${imageW}:${imageH}:force_original_aspect_ratio=decrease,pad=${p.width}:${p.height}:(ow-iw)/2:(${photoHeight}-ih)/2:color=0x171b21,setsar=1${move},drawbox=x=0:y=${photoHeight}:w=iw:h=ih-${photoHeight}:color=black@0.75:t=fill,drawtext=fontfile='${esc(font)}':textfile=${s.id}.txt:expansion=none:fontsize=${size}:fontcolor=white:x=(w-tw)/2:y=h-h/10-th/2,fade=t=in:st=0:d=0.3`;
      const temp=clip+'.tmp.mp4';
      run('ffmpeg',['-y','-v','error','-loop','1','-i',a,'-vf',vf,'-r',String(p.fps),'-frames:v',String(n),'-c:v','libx264','-preset','fast','-pix_fmt','yuv420p',temp],build);
      fs.renameSync(path.join(build,temp),path.join(build,clip));
    }
    run('ffmpeg',['-y','-v','error','-ss','0.5','-i',clip,'-frames:v','1',`scene-${s.id}.png`],build);
  }
  fs.writeFileSync(path.join(build,'concat.txt'),manifest.sceneKeys.map(s=>`file '${s.clip}'`).join('\n'));
  const duration=frames/p.fps;
  const audio=p.audio?['-i',asset(root,p.audio.asset,'audio'),'-map','0:v:0','-map','1:a:0','-af',`volume=${p.audio.gain},apad,atrim=duration=${duration},afade=t=in:d=0.25,afade=t=out:st=${Math.max(0,duration-0.4)}:d=0.4`,'-c:v','copy','-c:a','aac','-b:a','160k','-t',String(duration)]:['-c','copy'];
  run('ffmpeg',['-y','-v','error','-f','concat','-safe','1','-i','concat.txt',...audio,'-movflags','+faststart','film.tmp.mp4'],build);
  fs.renameSync(path.join(build,'film.tmp.mp4'),path.join(build,'film.mp4'));
  manifest.videoHash=hash(fs.readFileSync(path.join(build,'film.mp4'))); write(path.join(build,'manifest.json'),manifest); return manifest;
}
export function verify(file) {
  if(read(file).presentation==='cinematic')return verifyCinematic(file,{validate,run,asset,hash,read,write});
  const {p,root,frames}=validate(file), b=path.join(root,'build'), m=read(path.join(b,'manifest.json')), video=path.join(b,'film.mp4');
  const meta=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',video]));
  const v=meta.streams.find(x=>x.codec_type==='video');
  run('ffmpeg',['-v','error','-i',video,'-f','null','-']);
  const checks={freshProject:m.projectHash===hash(fs.readFileSync(file)),videoHash:m.videoHash===hash(fs.readFileSync(video)),dimensions:v.width===p.width&&v.height===p.height,frameCount:Number(v.nb_read_frames)===frames,duration:Math.abs(Number(meta.format.duration)-frames/p.fps)<1/p.fps+0.01,assetsFresh:p.scenes.every((s,i)=>m.sceneKeys[i]?.key===hash(JSON.stringify({s,w:p.width,h:p.height,fps:p.fps,asset:hash(fs.readFileSync(asset(root,s.asset))),font:hash(fs.readFileSync(process.env.AETHER_FONT || 'C:/Windows/Fonts/simhei.ttf')),adapter:m.adapter,ffmpeg:m.versions.ffmpeg}))),decode:true};
  const audio=meta.streams.find(s=>s.codec_type==='audio');
  checks.audioPresence=Boolean(audio)===Boolean(p.audio);
  checks.audioFresh=m.audioHash===(p.audio?hash(fs.readFileSync(asset(root,p.audio.asset,'audio'))):null);
  checks.audioDuration=!p.audio || Boolean(audio)&&Math.abs(Number(audio.duration)-frames/p.fps)<0.1;
  const report={pass:Object.values(checks).every(Boolean),checks,manualRequired:['story accuracy','photo correspondence','visual quality','caption glyphs',...(p.audio?['audio listening and rights']:[])],audio:p.audio?'local-track':'silent'};
  write(path.join(b,'qa.json'),report); return report;
}
