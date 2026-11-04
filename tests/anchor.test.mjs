import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {run,write,render,verify,patch,read} from '../src/core.mjs';
test('bottom anchor remains on path while subject grows; scale edit isolates scene',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-anchor-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=blue:s=320x480','-frames:v','1',path.join(root,'bg.png')]);
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=red:s=80x40,format=rgba,pad=320:480:20:80:color=black@0','-frames:v','1',path.join(root,'sprite.png')]);
 const layer={id:'train',asset:'sprite.png',width:0.25,path:[[0.5,0.65],[0.5,0.65],[0.5,0.65],[0.5,0.65]],anchor:[0.5,1],scale:[0.6,1.3],rotation:0,bob:0};
 const scene={id:'train',asset:'bg.png',caption:'合成缩放测试',seconds:2,factIds:['f'],camera:{zoom:[1,1],pan:[[0.5,0.5],[0.5,0.5]]},layers:[layer]};
 const p={version:1,presentation:'cinematic',captionMode:'none',width:320,height:480,fps:24,facts:[{id:'f',text:'合成色块'}],scenes:[scene,{...scene,id:'hold',seconds:1,layers:[]}]};
 const file=path.join(root,'project.json');write(file,p);const a=render(file);assert.equal(verify(file).pass,true);
 function bounds(time){const r=spawnSync('ffmpeg',['-v','error','-threads','2','-ss',String(time),'-i',path.join(root,'build/film.mp4'),'-map','0:v:0','-an','-frames:v','1','-pix_fmt','rgb24','-threads','2','-f','rawvideo','-'],{windowsHide:true,maxBuffer:2e6});assert.equal(r.status,0);let x0=320,x1=-1,y0=480,y1=-1;for(let i=0;i<r.stdout.length;i+=3)if(r.stdout[i]>120&&r.stdout[i+1]<90&&r.stdout[i+2]<90){const x=(i/3)%320,y=Math.floor(i/3/320);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}assert.ok(x1>x0);return {x0,x1,y0,y1};}
 const early=bounds(0.4),late=bounds(1.5);assert.ok(late.x1-late.x0>(early.x1-early.x0)*1.25);assert.ok(Math.abs(early.y1-late.y1)<=2,'bottom contact stays fixed during scaling');assert.ok(Math.abs(late.y1-312)<=2);
 patch(file,{sceneId:'train',changes:{layers:[{...layer,scale:[0.7,1.2]}]}});const b=render(file);assert.deepEqual(b.renderedScenes,['train']);assert.equal(a.sceneKeys[1].key,b.sceneKeys[1].key);assert.equal(verify(file).pass,true);
 assert.throws(()=>patch(file,{sceneId:'train',changes:{layers:[{...layer,anchor:[2,0]}]}}),/anchor/);assert.throws(()=>patch(file,{sceneId:'train',changes:{layers:[{...layer,scale:[1,3]}]}}),/scale/);
});
