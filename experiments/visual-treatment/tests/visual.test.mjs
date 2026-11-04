import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {write,run,render,verify,patch} from '../src/core.mjs';
test('landscape layouts render and reject invalid titles, layout and portrait target',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aether-visual-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 run('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=320x240','-frames:v','1',path.join(root,'test.png')]);
 const file=path.join(root,'project.json');const base={version:1,width:640,height:360,fps:24,facts:[{id:'f1',text:'测试图片'}],scenes:[{id:'s1',asset:'test.png',caption:'测试图片',seconds:2,layout:'editorial',heading:'测试标题',kicker:'TEST',factIds:['f1']}]};
 write(file,base);render(file);assert.equal(verify(file).pass,true);
 assert.throws(()=>patch(file,{sceneId:'s1',changes:{crop:[0.8,0.8,0.4,0.4]}}));
 patch(file,{sceneId:'s1',changes:{crop:[0.25,0.25,0.5,0.5]}});render(file);assert.equal(verify(file).pass,true);
 assert.throws(()=>patch(file,{sceneId:'s1',changes:{heading:'长'.repeat(13)}}));
 assert.throws(()=>patch(file,{sceneId:'s1',changes:{layout:'unknown'}}));
 patch(file,{sceneId:'s1',changes:{layout:'hero',heading:'地出'}});render(file);assert.equal(verify(file).pass,true);
 patch(file,{sceneId:'s1',changes:{layout:'title'}});render(file);assert.equal(verify(file).pass,true);
 write(file,{...base,width:360,height:640});assert.throws(()=>render(file),/landscape/);
});
