import fs from 'node:fs';

export function inspectLayer(root,layer,H) {
 const file=H.asset(root,layer.asset);
 if(!/\.png$/i.test(file))throw Error('layer requires transparent PNG');
 const text=H.run('ffmpeg',['-v','error','-i',file,'-vf','alphaextract,bbox,signalstats,metadata=print:file=-','-frames:v','1','-f','null','-']);
 const fields=Object.fromEntries([...text.matchAll(/(lavfi\.[\w.]+)=([\d.]+)/g)].map(m=>[m[1],Number(m[2])]));
 if(fields['lavfi.signalstats.YMIN']!==0||!(fields['lavfi.signalstats.YMAX']>0)||!(fields['lavfi.bbox.w']>0)||!(fields['lavfi.bbox.h']>0))throw Error('layer needs visible subject and actual transparent pixels');
 return {file,bounds:[fields['lavfi.bbox.x1'],fields['lavfi.bbox.y1'],fields['lavfi.bbox.w'],fields['lavfi.bbox.h']]};
}
export function validateLayers(p,s,root,H) {
 if(s.layers==null)return;
 if(p.presentation!=='cinematic'||!Array.isArray(s.layers)||s.layers.length>4)throw Error('up to four layers require cinematic mode');
 const ids=new Set();
 for(const l of s.layers) {
  if(!/^[a-zA-Z0-9_-]+$/.test(l.id)||ids.has(l.id))throw Error('invalid/duplicate layer id');ids.add(l.id);
  if(!Number.isFinite(l.width)||l.width<=0||l.width>1||!Array.isArray(l.path)||l.path.length!==4||l.path.some(v=>!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isFinite(n)||n<0||n>1)))throw Error('invalid layer width or cubic path');
  if(!Number.isFinite(l.rotation??0)||Math.abs(l.rotation??0)>15||!Number.isFinite(l.bob??0)||(l.bob??0)<0||(l.bob??0)>0.05||!Number.isFinite(l.period??3)||(l.period??3)<0.5||(l.period??3)>10)throw Error('invalid layer rotation/bob/period');
  if(l.scale!=null&&(!Array.isArray(l.scale)||l.scale.length!==2||l.scale.some(v=>!Number.isFinite(v)||v<0.25||v>2)))throw Error('scale must be two values in 0.25..2');
  if(l.anchor!=null&&(!Array.isArray(l.anchor)||l.anchor.length!==2||l.anchor.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('anchor must be a normalized point');
  const info=inspectLayer(root,l,H);geometry(p,l,info.bounds);
 }
}
export function layerHashes(s,root,H){return (s.layers??[]).map(l=>({id:l.id,hash:H.hash(fs.readFileSync(H.asset(root,l.asset)))}));}
function geometry(p,l,[x,y,w,h]) {
 const baseW=Math.round(p.width*l.width),baseH=baseW*h/w,max=Math.max(...(l.scale??[1,1]));
 const canvas=Math.ceil((Math.hypot(baseW,baseH)*max+8)/2)*2;
 if(canvas>4096)throw Error('layer canvas exceeds 4096px; reduce width/scale');
 return {baseW,ratio:h/w,canvas};
}
export function layerGraph(p,s,n,root,H,background) {
 const inputs=[],filters=[`[0:v]${background}[bg0]`];let label='bg0';
 const u=`min(max(t/${(n-1)/p.fps},0),1)`;
 for(const [i,l] of s.layers.entries()){
  const {file,bounds:[x,y,w,h]}=inspectLayer(root,l,H);inputs.push('-loop','1','-framerate',String(p.fps),'-i',file);
  const bez=axis=>`pow(1-(${u}),3)*${l.path[0][axis]}+3*pow(1-(${u}),2)*(${u})*${l.path[1][axis]}+3*(1-(${u}))*pow(${u},2)*${l.path[2][axis]}+pow(${u},3)*${l.path[3][axis]}`;
  const {baseW,ratio,canvas}=geometry(p,l,[x,y,w,h]),[s0,s1]=l.scale??[1,1],[ax,ay]=l.anchor??[0.5,0.5];
  const scale=`${s0}+(${s1-s0})*(${u})`,sw=`round(${baseW}*(${scale}))`,sh=`round((${sw})*${ratio})`;
  const angle=`${(l.rotation??0)*Math.PI/180}*sin(2*PI*t/${l.period??3})`;
  const dx=`(${ax-0.5})*(${sw})*cos(${angle})-(${ay-0.5})*(${sh})*sin(${angle})`;
  const dy=`(${ax-0.5})*(${sw})*sin(${angle})+(${ay-0.5})*(${sh})*cos(${angle})`;
  filters.push(`[${i+1}:v]crop=${w}:${h}:${x}:${y},scale=w='${sw}':h=-1:eval=frame:flags=lanczos,format=rgba,pad=${canvas}:${canvas}:(ow-iw)/2:(oh-ih)/2:eval=frame:color=black@0,rotate=a='${angle}':ow=${canvas}:oh=${canvas}:c=none[fg${i}]`);
  filters.push(`[${label}][fg${i}]overlay=x='W*(${bez(0)})-w/2-(${dx})':y='H*((${bez(1)})+${l.bob??0}*sin(2*PI*t/${l.period??3}))-h/2-(${dy})':eval=frame:format=auto:shortest=1[bg${i+1}]`);label=`bg${i+1}`;
 }
 filters.push(`[${label}]format=yuv420p[layered]`);return {inputs,graph:filters.join(';'),label:'layered'};
}
