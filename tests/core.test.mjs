import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validate,patch,render,verify,read,write,run,hash} from '../src/core.mjs';
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'assets'));
  run('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=320x240','-frames:v','1',path.join(root,'assets/a.png')]);
  const file=path.join(root,'project.json');
  write(file,{version:1,width:320,height:480,fps:24,facts:[{id:'f1',text:'测试事实'}],scenes:[{id:'s1',asset:'assets/a.png',caption:'测试一',seconds:1,factIds:['f1']},{id:'s2',asset:'assets/a.png',caption:'测试二',seconds:1,factIds:['f1']}]});
  return file;
}
test('valid project has exact frame budget',t=>{assert.equal(validate(fixture(t)).frames,48);});
for(const [name,mutate] of [
  ['missing photo',p=>p.scenes[0].asset='assets/missing.png'],
  ['path escape',p=>p.scenes[0].asset='../outside.png'],
  ['duplicate scene',p=>p.scenes[1].id='s1'],
  ['unreferenced facts',p=>p.scenes[0].factIds=['nope']],
  ['long caption',p=>p.scenes[0].caption='长'.repeat(37)],
  ['negative duration',p=>p.scenes[0].seconds=-1],
  ['odd size',p=>p.width=321],
  ['unsupported fps',p=>p.fps=60],
  ['broken photo',p=>p.scenes[0].asset='assets/broken.png']
]) test(`reject ${name}`,t=>{const f=fixture(t),p=read(f); fs.writeFileSync(path.join(path.dirname(f),'assets/broken.png'),'not an image'); mutate(p); write(f,p); assert.throws(()=>validate(f));});
test('scoped patch preserves unrelated scene and invalid patch leaves source intact',t=>{
  const f=fixture(t),before=read(f); patch(f,{sceneId:'s2',changes:{caption:'局部修改',seconds:2}});
  assert.deepEqual(read(f).scenes[0],before.scenes[0]); assert.equal(read(f).scenes[1].seconds,2);
  const bytes=fs.readFileSync(f); assert.throws(()=>patch(f,{sceneId:'s2',changes:{seconds:-2}})); assert.deepEqual(fs.readFileSync(f),bytes);
  assert.equal(fs.readdirSync(path.join(path.dirname(f),'history')).length,1);
});
test('render, QA, selective cache reuse and stale source detection',t=>{
  const f=fixture(t),a=render(f); assert.equal(verify(f).pass,true);
  const clip=path.join(path.dirname(f),'build',a.sceneKeys[0].clip),time=fs.statSync(clip).mtimeMs;
  patch(f,{sceneId:'s2',changes:{caption:'第二幕修改',seconds:2}}); assert.equal(verify(f).pass,false);
  const b=render(f); assert.equal(b.sceneKeys[0].key,a.sceneKeys[0].key); assert.equal(fs.statSync(clip).mtimeMs,time);
  assert.notEqual(b.sceneKeys[1].key,a.sceneKeys[1].key); assert.equal(verify(f).pass,true);
  const p=path.join(path.dirname(f),'assets/a.png'); fs.appendFileSync(p,Buffer.from('changed')); assert.equal(verify(f).checks.assetsFresh,false);
});
test('non-integer frame count warns and rounds 1.23s @24fps to 30 frames',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-nf-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'assets'));
  run('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=320x240','-frames:v','1',path.join(root,'assets/a.png')]);
  const file=path.join(root,'project.json');
  write(file,{version:1,width:320,height:480,fps:24,facts:[{id:'f1',text:'非整数帧测试'}],scenes:[{id:'s1',asset:'assets/a.png',caption:'一点二三秒',seconds:1.23,factIds:['f1']}]});
  const r=validate(file);
  assert.equal(r.frames,30,'1.23s * 24fps should round to 30 frames');
  assert.ok(r.warnings.some(w=>w.sceneId==='s1'&&w.kind==='non-integer-frames'&&w.frames===30),'should warn about non-integer frames');
});
