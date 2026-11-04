// Original photo-led compositions. No third-party animation runtime is bundled.
export function visualFilter({p,s,n,font,esc}) {
  const w=p.width,h=p.height, duration=n/p.fps;
  const z=s.motion==='pull'?`1.035-0.035*min(on/${n-1},1)`:`1+0.035*min(on/${n-1},1)`;
  const mode=s.layout??'editorial';
  const title=mode==='title';
  const hero=mode==='hero';
  const photoW=Math.floor(w*(hero?0.75:0.5)/2)*2;
  const photoH=Math.floor(h*(hero?0.72:0.78)/2)*2;
  const posX=hero?`(ow-iw)/2`:`${w*0.44}+(${w*0.53}-iw)/2`;
  const posY=hero?`(${h*0.83}-ih)/2`:`(oh-ih)/2`;
  const crop=s.crop?`crop=iw*${s.crop[2]}:ih*${s.crop[3]}:iw*${s.crop[0]}:ih*${s.crop[1]},`:'';
  let f=`${crop}scale=${photoW}:${photoH}:force_original_aspect_ratio=decrease,pad=${w}:${h}:${posX}:${posY}:color=0x06090e,setsar=1`;
  if(!title && s.motion!=='still')f+=`,zoompan=z='${z}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${w}x${h}:fps=${p.fps}`;
  if(title)f+=`,drawbox=x=0:y=0:w=iw:h=ih:color=0x06090e:t=fill`;
  const tx=title?'(w-tw)/2':hero?`${w*0.06}`:`${w*0.065}`;
  const text=(suffix,size,x,y,color,delay=0)=>`,drawtext=fontfile='${esc(font)}':textfile=${s.id}-${suffix}.txt:expansion=none:fontsize=${Math.floor(size)}:fontcolor=${color}:x=${x}:y=${y}:alpha='min(max((t-${delay})/0.7,0),1)'`;
  f+=text('kicker',h*0.024,tx,title?h*0.29:hero?h*0.84:h*0.25,'0xb7c4ce',0.15);
  const headingSize=Math.min(h*(title?0.15:hero?0.067:0.105),w*(title?0.85:hero?0.25:0.36)/Math.max([...s.heading].length,1));
  f+=text('heading',headingSize,tx,title?h*0.39:hero?h*0.885:h*0.36,'0xf2f0e8',0.35);
  const maxWidth=hero?w*0.68:title?w*0.8:w*0.36;
  const captionSize=Math.min(h*0.028,maxWidth/Math.max([...s.caption].length,1));
  f+=text('caption',captionSize,title?'(w-tw)/2':hero?w*0.38:tx,title?h*0.64:hero?h*0.905:h*0.59,'0xd4d9df',0.8);
  f+=`,drawbox=x=${w*0.065}:y=${h*0.18}:w=${w*0.03}:h=2:color=0x9dbbbf:t=fill`;
  f+=`,fade=t=in:st=0:d=0.65,fade=t=out:st=${Math.max(duration-0.65,0)}:d=0.65`;
  return f;
}
