import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Write separately, verify, then replace the requested target. Source may equal target.
export function silenceVideo(source,target){
  source=path.resolve(source);target=path.resolve(target);
  if(!fs.existsSync(source))throw Error('source video does not exist');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const temp=path.join(path.dirname(target),`.silent-${crypto.randomUUID()}.mp4`);
  function run(bin,args){const r=spawnSync(bin,args,{encoding:'utf8',windowsHide:true});if(r.error)throw r.error;if(r.status!==0)throw Error(r.stderr||`${bin} failed`);return r.stdout;}
  try{
    run('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-threads','2','-i',source,'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart','-y',temp]);
    const meta=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',temp]));
    if(meta.streams.some(s=>s.codec_type==='audio')||!meta.streams.some(s=>s.codec_type==='video'))throw Error('silent output must contain video and no audio stream');
    fs.renameSync(temp,target);
    return {target,audioStreams:0,duration:Number(meta.format.duration),videoStreamCopied:true};
  }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{if(!process.argv[2]||!process.argv[3])throw Error('usage: node scripts/silence-video.mjs input.mp4 output.mp4');console.log(JSON.stringify(silenceVideo(process.argv[2],process.argv[3]),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
