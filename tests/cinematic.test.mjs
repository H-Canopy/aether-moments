import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {planTimeline} from '../src/cinematic.mjs';
import {write,read,run,validate,render,verify,patch} from '../src/core.mjs';
const project=()=>({version:1,presentation:'cinematic',captionMode:'none',width:320,height:480,fps:24,facts:[{id:'f',text:'合成红蓝色块'}],scenes:[{id:'red',asset:'red.png',caption:'红色',seconds:2,factIds:['f'],transition:{type:'dissolve',seconds:0.5}},{id:'blue',asset:'blue.png',caption:'蓝色',seconds:2,factIds:['f']}]});
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-cinema-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));for(const c of ['red','blue'])run('ffmpeg',['-y','-v','error','-f','lavfi','-i',`color=c=${c}:s=320x480`,'-frames:v','1',path.join(root,c+'.png')]);const file=path.join(root,'project.json');write(file,project());return file;}
test('overlap budgets count final frames, offsets and normalized cameras',()=>{
 const p=project(),r=planTimeline(p);assert.equal(r.frames,84);assert.equal(r.clips[1].startFrame,36);assert.equal(r.transitions[0].startFrame,36);
 p.scenes[0].transition.seconds=1.5;assert.throws(()=>planTimeline(p),/overlap/);
 p.scenes[0].transition={type:'unknown',seconds:0.5};assert.throws(()=>planTimeline(p));
 p.scenes[0].transition={type:'cut',seconds:0};p.scenes[1].transition={type:'dissolve',seconds:0.5};assert.throws(()=>planTimeline(p),/last/);
 delete p.scenes[1].transition;p.scenes[0].camera={zoom:[0.5,1],pan:[[0,0],[1,1]]};assert.throws(()=>planTimeline(p),/camera/);
});
test('dissolve actually mixes video pixels; transition-only patch reuses clips; camera patch isolates target',t=>{
 const file=fixture(t),root=path.dirname(file);const a=render(file);assert.equal(verify(file).pass,true);
 const pixel=spawnSync('ffmpeg',['-v','error','-ss','1.75','-i',path.join(root,'build/film.mp4'),'-map','0:v:0','-an','-vf','crop=2:2:160:240,scale=1:1','-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'],{windowsHide:true});assert.equal(pixel.status,0);assert.ok(pixel.stdout[0]>60&&pixel.stdout[2]>60,'mid-transition contains red and blue, not a hard cut');
 const clip=path.join(root,'build',a.sceneKeys[0].clip),mtime=fs.statSync(clip).mtimeMs;
 patch(file,{sceneId:'red',changes:{transition:{type:'dissolve',seconds:0.75}}});assert.equal(verify(file).pass,false);
 const b=render(file);assert.deepEqual(b.renderedScenes,[]);assert.equal(b.reusedScenes.length,2);assert.equal(fs.statSync(clip).mtimeMs,mtime);assert.equal(b.frames,78);assert.equal(verify(file).pass,true);
 patch(file,{sceneId:'red',changes:{camera:{zoom:[1,1.1],pan:[[0.4,0.5],[0.6,0.5]],easing:'linear'}}});const c=render(file);assert.deepEqual(c.renderedScenes,['red']);assert.equal(c.sceneKeys[1].key,b.sceneKeys[1].key);assert.equal(verify(file).pass,true);
 const old=fs.readFileSync(file);assert.throws(()=>patch(file,{sceneId:'red',changes:{transition:{type:'dissolve',seconds:2}}}));assert.deepEqual(fs.readFileSync(file),old);
});
test('mixed cut and slide compose with exact frame count',t=>{
 const file=fixture(t),p=read(file);p.scenes[0].transition={type:'cut',seconds:0};p.scenes.push({...p.scenes[0],id:'third',transition:{type:'cut',seconds:0}});p.scenes[1].transition={type:'smoothleft',seconds:0.5};write(file,p);render(file);assert.equal(validate(file).frames,132);assert.equal(verify(file).pass,true);
});
