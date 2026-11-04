import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {run,write,read,render,verify,patch,validate} from '../src/core.mjs';
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-layers-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=blue:s=320x480','-frames:v','1',path.join(root,'bg.png')]);
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=red:s=80x40,format=rgba,pad=320:480:20:80:color=black@0','-frames:v','1',path.join(root,'sprite.png')]);
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=red:s=80x40,format=rgba','-frames:v','1',path.join(root,'opaque.png')]);
 const layer={id:'actor',asset:'sprite.png',width:0.25,path:[[0.2,0.5],[0.4,0.5],[0.6,0.5],[0.8,0.5]],rotation:0,bob:0,period:3};
 const p={version:1,presentation:'cinematic',captionMode:'none',width:320,height:480,fps:24,facts:[{id:'f',text:'合成红色主体和蓝色背景'}],scenes:[{id:'flight',asset:'bg.png',caption:'红色主体移动',seconds:2,factIds:['f'],camera:{zoom:[1,1],pan:[[0.5,0.5],[0.5,0.5]]},layers:[layer]},{id:'hold',asset:'bg.png',caption:'背景',seconds:1,factIds:['f']}]};
 const file=path.join(root,'project.json');write(file,p);return file;
}
test('transparent layer moves independently over static background and scoped patch preserves other clip',t=>{
 const file=fixture(t),root=path.dirname(file);const a=render(file);assert.equal(verify(file).pass,true);
 function redCenter(sec){const r=spawnSync('ffmpeg',['-v','error','-ss',String(sec),'-i',path.join(root,'build/film.mp4'),'-map','0:v:0','-an','-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'],{windowsHide:true,maxBuffer:2e6});assert.equal(r.status,0);let sum=0,n=0;for(let i=0;i<r.stdout.length;i+=3)if(r.stdout[i]>120&&r.stdout[i+1]<90&&r.stdout[i+2]<90){sum+=(i/3)%320;n++;}assert.ok(n>100);return sum/n;}
 assert.ok(redCenter(1.5)-redCenter(0.4)>70,'subject moves even with a fixed camera/background');
 const p=read(file);p.scenes[0].layers[0].path[3]=[0.65,0.5];patch(file,{sceneId:'flight',changes:{layers:p.scenes[0].layers}});const b=render(file);assert.deepEqual(b.renderedScenes,['flight']);assert.equal(a.sceneKeys[1].key,b.sceneKeys[1].key);assert.equal(verify(file).pass,true);
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=green:s=80x40,format=rgba,pad=320:480:20:80:color=black@0','-frames:v','1',path.join(root,'sprite.png')]);assert.equal(verify(file).checks.assetsFresh,false);
});
test('layer validation rejects opaque PNG, invalid paths and duplicate ids',t=>{
 const file=fixture(t),p=read(file),layer=p.scenes[0].layers[0];
 assert.throws(()=>patch(file,{sceneId:'flight',changes:{layers:[{...layer,asset:'opaque.png'}]}}),/transparent/);
 assert.throws(()=>patch(file,{sceneId:'flight',changes:{layers:[{...layer,path:[[0,0]]}]}}));
 assert.throws(()=>patch(file,{sceneId:'flight',changes:{layers:[layer,layer]}}),/duplicate/);
 assert.throws(()=>patch(file,{sceneId:'flight',changes:{layers:[{...layer,asset:'../escape.png'}]}}));
 assert.equal(validate(file).p.scenes[0].layers[0].asset,'sprite.png');
});
