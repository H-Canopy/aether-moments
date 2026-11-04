import fs from 'node:fs';
import path from 'node:path';
import {layerGraph,layerHashes} from './layers.mjs';

export function planTimeline(p) {
  if(!['burn','none'].includes(p.captionMode??'burn')) throw Error('captionMode must be burn or none');
  const clips=p.scenes.map(s=>({id:s.id,frames:Math.round(s.seconds*p.fps)}));
  const transitions=[];let start=0;
  for(let i=0;i<clips.length;i++) {
    const s=p.scenes[i],c=clips[i]; c.startFrame=start;c.endFrame=start+c.frames;
    if(s.camera!=null) {
      const cam=s.camera;
      if(!Array.isArray(cam.zoom)||cam.zoom.length!==2||cam.zoom.some(z=>!Number.isFinite(z)||z<1||z>2)||!Array.isArray(cam.pan)||cam.pan.length!==2||cam.pan.some(a=>!Array.isArray(a)||a.length!==2||a.some(v=>!Number.isFinite(v)||v<0||v>1))||!['linear','smooth'].includes(cam.easing??'linear'))throw Error('invalid camera zoom/pan/easing');
    }
    const tr=s.transition??{type:'cut',seconds:0};
    if(!['cut','dissolve','smoothleft'].includes(tr.type)||!Number.isFinite(tr.seconds)||tr.seconds<0)throw Error('invalid transition');
    const frames=Math.round(tr.seconds*p.fps);
    if(tr.type==='cut'&&frames!==0||tr.type!=='cut'&&(frames<1||tr.seconds>2))throw Error('invalid transition duration');
    if(i===clips.length-1&&frames!==0)throw Error('last scene cannot transition to missing scene');
    if(i<clips.length-1) {
      const incoming=transitions[i-1]?.frames??0;
      if(frames>Math.min(c.frames,clips[i+1].frames)/2||incoming+frames>=c.frames)throw Error('transition overlap consumes scene');
      transitions.push({from:c.id,to:clips[i+1].id,type:tr.type,frames,startFrame:c.endFrame-frames,endFrame:c.endFrame});
    }
    start=c.endFrame-frames;
  }
  if(p.endTitle!=null && (typeof p.endTitle!=='string'||p.endTitle.length>24||/[\r\n\x00-\x1f]/.test(p.endTitle)))throw Error('invalid endTitle');
  return {frames:clips.at(-1).endFrame,clips,transitions};
}

function rendererId(hash) {return 'cinematic-v3-'+hash(fs.readFileSync(new URL('./cinematic.mjs',import.meta.url))+fs.readFileSync(new URL('./layers.mjs',import.meta.url))).slice(0,16);}
function clipKey(p,s,root,manifest,font,H) {
  const {transition,...visual}=s; // Transition changes recompose, without rerendering source clips.
  return H.hash(JSON.stringify({visual,w:p.width,h:p.height,fps:p.fps,captionMode:p.captionMode??'burn',asset:H.hash(fs.readFileSync(H.asset(root,s.asset))),layers:layerHashes(s,root,H),font:H.hash(fs.readFileSync(font)),adapter:manifest.adapter,ffmpeg:manifest.versions.ffmpeg}));
}
const esc=s=>s.replaceAll('\\','/').replaceAll(':','\\:').replaceAll("'","'\\''");

export function renderCinematic(file,H) {
  const {p,root,warnings}=H.validate(file),plan=planTimeline(p),build=path.join(root,'build');fs.mkdirSync(build,{recursive:true});
  const font=process.env.AETHER_FONT??'C:/Windows/Fonts/simhei.ttf';
  if(!fs.existsSync(font))throw Error('set AETHER_FONT');
  const manifest={projectHash:H.hash(fs.readFileSync(file)),frames:plan.frames,timeline:plan,sceneKeys:[],adapter:rendererId(H.hash),audio:p.audio?'local-track':'silent',audioHash:p.audio?H.hash(fs.readFileSync(H.asset(root,p.audio.asset,'audio'))):null,warnings,versions:{node:process.version,ffmpeg:H.run('ffmpeg',['-version']).split('\n')[0]},renderedScenes:[],reusedScenes:[]};
  for(const [i,s] of p.scenes.entries()) {
    const n=plan.clips[i].frames,key=clipKey(p,s,root,manifest,font,H),clip=`${s.id}-${key}.mp4`;
    manifest.sceneKeys.push({id:s.id,key,clip});
    if(fs.existsSync(path.join(build,clip)))manifest.reusedScenes.push(s.id);
    else {
      const cam=s.camera??{zoom:s.motion==='pull'?[1.06,1]:s.motion==='push'?[1,1.06]:[1,1],pan:[[0.5,0.5],[0.5,0.5]],easing:'linear'};
      const t=`min(on/${n-1},1)`,e=cam.easing==='smooth'?`(${t})*(${t})*(3-2*(${t}))`:t;
      const lerp=(a,b)=>`${a}+(${b-a})*(${e})`;
      // Guard bands are used when no explicit crop/camera was requested.
      const image=s.camera?`scale=${p.width*2}:${p.height*2}:force_original_aspect_ratio=increase,crop=${p.width*2}:${p.height*2}`:`scale=${Math.floor(p.width*0.88/2)*2}:${Math.floor(p.height*0.88/2)*2}:force_original_aspect_ratio=decrease,pad=${p.width}:${p.height}:(ow-iw)/2:(oh-ih)/2:color=0x10151b,scale=${p.width*2}:${p.height*2}`;
      let vf=`${image},zoompan=z='${lerp(...cam.zoom)}':x='(iw-iw/zoom)*(${lerp(cam.pan[0][0],cam.pan[1][0])})':y='(ih-ih/zoom)*(${lerp(cam.pan[0][1],cam.pan[1][1])})':d=1:s=${p.width}x${p.height}:fps=${p.fps},setsar=1`;
      if((p.captionMode??'burn')==='burn') {
        fs.writeFileSync(path.join(build,`${s.id}.txt`),s.caption);
        const size=Math.floor(Math.min(p.height/30,(p.width*0.85)/[...s.caption].length));
        vf+=`,drawbox=x=0:y=ih*0.86:w=iw:h=ih*0.14:color=black@0.55:t=fill,drawtext=fontfile='${esc(font)}':textfile=${s.id}.txt:expansion=none:fontsize=${size}:fontcolor=white:x=(w-tw)/2:y=h*0.92-th/2`;
      }
      // No per-scene fades: the compositor owns transitions and visible continuity.
      const layers=s.layers?.length?layerGraph(p,s,n,root,H,vf):null;
      if(layers)fs.writeFileSync(path.join(build,`${s.id}-layers.ffgraph`),layers.graph);
      H.run('ffmpeg',['-y','-v','error','-filter_complex_threads','1','-loop','1','-i',H.asset(root,s.asset),...(layers?[...layers.inputs,'-filter_complex',layers.graph,'-map',`[${layers.label}]`]:['-vf',vf]),'-frames:v',String(n),'-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',clip+'.tmp.mp4'],build);
      const clipMeta=JSON.parse(H.run('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=nb_frames','-of','json',path.join(build,clip+'.tmp.mp4')]));
      if(Number(clipMeta.streams[0]?.nb_frames)!==n)throw Error('incomplete scene output; refusing to cache');
      fs.renameSync(path.join(build,clip+'.tmp.mp4'),path.join(build,clip));manifest.renderedScenes.push(s.id);
    }
    H.run('ffmpeg',['-y','-v','error','-ss','0.6','-i',clip,'-frames:v','1',`scene-${s.id}.png`],build);
  }
  const inputs=manifest.sceneKeys.flatMap(s=>['-i',s.clip]);
  const filters=manifest.sceneKeys.map((_,i)=>`[${i}:v]settb=1/${p.fps},setpts=PTS-STARTPTS,format=yuv420p[v${i}]`);
  let label='v0';
  for(let i=1;i<p.scenes.length;i++) {
    const tr=plan.transitions[i-1],raw=`raw${i}`,next=`join${i}`;
    if(tr.type==='cut')filters.push(`[${label}][v${i}]concat=n=2:v=1:a=0[${raw}]`);
    else filters.push(`[${label}][v${i}]xfade=transition=${tr.type==='dissolve'?'fade':'smoothleft'}:duration=${tr.frames/p.fps}:offset=${tr.startFrame/p.fps}[${raw}]`);
    filters.push(`[${raw}]settb=1/${p.fps},setpts=PTS-STARTPTS[${next}]`);label=next;
  }
  const duration=plan.frames/p.fps;
  let finish=`[${label}]trim=end_frame=${plan.frames},setpts=PTS-STARTPTS`;
  if(p.endTitle) {
    fs.writeFileSync(path.join(build,'end-title.txt'),p.endTitle);
    const at=Math.max(0,duration-4);
    finish+=`,drawtext=fontfile='${esc(font)}':textfile=end-title.txt:expansion=none:fontsize=${Math.floor(p.height/16)}:fontcolor=0xfff5de:shadowcolor=black@0.25:shadowx=2:shadowy=2:x=w*0.56:y=h*0.13:alpha='min(max((t-${at})/0.8,0),1)'`;
    finish+=`,drawtext=fontfile='${esc(font)}':text='AI-GENERATED IMAGERY / AETHER MOMENTS':fontsize=${Math.floor(p.height/60)}:fontcolor=white@0.8:shadowcolor=black@0.3:shadowx=1:shadowy=1:x=w*0.04:y=h*0.93:alpha='min(max((t-${at})/0.8,0),1)'`;
  }
  finish+=`,fade=t=in:d=0.3,fade=t=out:st=${Math.max(0,duration-0.7)}:d=0.7,format=yuv420p[outv]`;filters.push(finish);
  const graph=filters.join(';');fs.writeFileSync(path.join(build,'composition.ffgraph'),graph);
  // A saved, inspectable graph is the same composition used for the actual render.
  H.run('ffmpeg',['-y','-v','error','-filter_complex_threads','1',...inputs,'-filter_complex',graph,'-map','[outv]','-frames:v',String(plan.frames),'-r',String(p.fps),'-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','composition.tmp.mp4'],build);
  const audio=p.audio?['-i',H.asset(root,p.audio.asset,'audio'),'-map','0:v:0','-map','1:a:0','-af',`volume=${p.audio.gain},apad,atrim=duration=${duration},afade=t=in:d=0.15,afade=t=out:st=${Math.max(0,duration-0.8)}:d=0.8`,'-c:v','copy','-c:a','aac','-b:a','256k']:['-c','copy'];
  H.run('ffmpeg',['-y','-v','error','-i','composition.tmp.mp4',...audio,'-t',String(duration),'-movflags','+faststart','film.tmp.mp4'],build);
  fs.renameSync(path.join(build,'film.tmp.mp4'),path.join(build,'film.mp4'));manifest.videoHash=H.hash(fs.readFileSync(path.join(build,'film.mp4')));manifest.graphHash=H.hash(graph);H.write(path.join(build,'manifest.json'),manifest);return manifest;
}

export function verifyCinematic(file,H) {
 const {p,root}=H.validate(file),plan=planTimeline(p),build=path.join(root,'build'),m=H.read(path.join(build,'manifest.json')),film=path.join(build,'film.mp4');
 const meta=JSON.parse(H.run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',film]));
 const v=meta.streams.find(s=>s.codec_type==='video'),a=meta.streams.find(s=>s.codec_type==='audio');H.run('ffmpeg',['-v','error','-i',film,'-f','null','-']);
 const duration=plan.frames/p.fps,font=process.env.AETHER_FONT??'C:/Windows/Fonts/simhei.ttf';
 const checks={freshProject:m.projectHash===H.hash(fs.readFileSync(file)),rendererFresh:m.adapter===rendererId(H.hash),videoHash:m.videoHash===H.hash(fs.readFileSync(film)),dimensions:v.width===p.width&&v.height===p.height,frameCount:Number(v.nb_read_frames)===plan.frames,fps:Math.abs(evalRate(v.r_frame_rate)-p.fps)<0.001,duration:Math.abs(Number(meta.format.duration)-duration)<1/p.fps+0.01,assetsFresh:p.scenes.every((s,i)=>m.sceneKeys[i]?.key===clipKey(p,s,root,m,font,H)),timeline:JSON.stringify(m.timeline)===JSON.stringify(plan),graphHash:m.graphHash===H.hash(fs.readFileSync(path.join(build,'composition.ffgraph'))),audioPresence:Boolean(a)===Boolean(p.audio),audioFresh:m.audioHash===(p.audio?H.hash(fs.readFileSync(H.asset(root,p.audio.asset,'audio'))):null),audioDuration:!p.audio||Boolean(a)&&Math.abs(Number(a.duration)-duration)<0.1,decode:true};
 checks.videoDuration=Math.abs(Number(v.duration)-duration)<1/p.fps+0.01;
 const report={pass:Object.values(checks).every(Boolean),checks,frames:plan.frames,duration,transitions:plan.transitions,manualRequired:['transition visual review','story accuracy','subject framing','audio listening and rights']};H.write(path.join(build,'qa.json'),report);return report;
}
function evalRate(s){const [a,b]=s.split('/').map(Number);return a/b;}
