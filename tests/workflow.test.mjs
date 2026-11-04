import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {init,preview,doctor} from '../src/workflow.mjs';
import {write,read,run,hash} from '../src/core.mjs';
test('intake copies photo without changing source, preserves facts, refuses overwrite and creates offline preview',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-intake-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const photo=path.join(root,'照片.png');run('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=320x240','-frames:v','1',photo]);const before=hash(fs.readFileSync(photo));
  const input={facts:[{id:'f1',text:'一张测试图'}],scenes:[{id:'s1',asset:'照片.png',caption:'一张测试图',seconds:2,factIds:['f1']}]};
  const intake=path.join(root,'intake.json');write(intake,input);const dest=path.join(root,'project');const result=init(intake,dest);
  assert.equal(hash(fs.readFileSync(photo)),before);assert.deepEqual(read(result.project).facts,input.facts);assert.ok(fs.existsSync(path.join(dest,'assets/photo-1.png')));
  assert.throws(()=>init(intake,dest),/exists/);const page=preview(result.project);const html=fs.readFileSync(page.preview,'utf8');assert.ok(html.includes('data:image/png;base64,'));
  new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);
});
test('environment doctor reports individual components',()=>{const r=doctor();assert.deepEqual(Object.keys(r.checks),['node','ffmpeg','ffprobe','font']);assert.equal(typeof r.ready,'boolean');});
