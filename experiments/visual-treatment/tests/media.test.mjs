import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {write,read,run,render,verify,patch,validate} from '../src/core.mjs';
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-media-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'assets'));
  run('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=320x240','-frames:v','1',path.join(root,'assets/photo.png')]);
  run('ffmpeg',['-y','-v','error','-f','lavfi','-i','sine=frequency=440:duration=0.5',path.join(root,'assets/tone.wav')]);
  const file=path.join(root,'project.json');write(file,{version:1,width:320,height:480,fps:24,facts:[{id:'f1',text:'合成媒体验证'}],scenes:[{id:'s1',asset:'assets/photo.png',caption:'合成测试',seconds:2,motion:'push',factIds:['f1']}]});return file;
}
test('moving photo changes after fade; short audio pads; gain-only edit reuses video; changed audio invalidates QA',t=>{
  const file=fixture(t),root=path.dirname(file),a=render(file);assert.equal(verify(file).pass,true);
  const frame=seconds=>run('ffmpeg',['-v','error','-ss',String(seconds),'-i',path.join(root,'build/film.mp4'),'-frames:v','1','-f','framemd5','-']).split('\n').filter(l=>l&&!l.startsWith('#')).join('');
  assert.notEqual(frame(0.6),frame(1.6));
  patch(file,{scope:'project',changes:{audio:{asset:'assets/tone.wav',gain:0.3}}});
  const b=render(file);assert.equal(a.sceneKeys[0].key,b.sceneKeys[0].key);assert.equal(verify(file).pass,true);assert.equal(verify(file).checks.audioDuration,true);
  patch(file,{scope:'project',changes:{audio:{asset:'assets/tone.wav',gain:0.1}}});const c=render(file);assert.equal(c.sceneKeys[0].key,b.sceneKeys[0].key);assert.notEqual(c.videoHash,b.videoHash);assert.equal(verify(file).pass,true);
  fs.appendFileSync(path.join(root,'assets/tone.wav'),'changed');assert.equal(verify(file).checks.audioFresh,false);
  patch(file,{scope:'project',changes:{audio:null}});render(file);assert.equal(verify(file).pass,true);assert.equal(verify(file).audio,'silent');
});
test('reject unsupported motion and invalid gain; scene motion patch accepts pull',t=>{
  const file=fixture(t);assert.throws(()=>patch(file,{sceneId:'s1',changes:{motion:'spin'}}));
  assert.throws(()=>patch(file,{scope:'project',changes:{audio:{asset:'assets/tone.wav',gain:2}}}));
  assert.throws(()=>patch(file,{scope:'project',changes:{width:1000}}));
  patch(file,{sceneId:'s1',changes:{motion:'pull'}});assert.equal(validate(file).p.scenes[0].motion,'pull');render(file);assert.equal(verify(file).pass,true);
});
