const $=s=>document.querySelector(s),app=$('#app');
const prompt='把这些画面做成《失重的夏天》。让纸飞机带我们穿过海边小城，从午后飞到日落。温柔、轻盈，30 秒。';
const titles=['风从窗口来','飞过小城屋顶','夏天开始失重','搭上天空列车','漂浮的日落','回到这一刻'];
const notes=['窗台 / 开场','纸飞机 / 独立路径','街道 / 缓慢推进','列车 / 接触点锚定','城市 / 三层浮动','窗台 / 故事回环'];
let generation=0,timers=[],editing=false;
function later(fn,ms){let g=generation;timers.push(setTimeout(()=>{if(g===generation)fn()},ms))}
function stage(s){app.dataset.stage=s;$('#step').textContent=({idle:'01 / INPUT',story:'02 / STORYBOARD',film:'03 / MOMENTS',edit:'04 / REFINE'})[s];}
function stop(){generation++;timers.forEach(clearTimeout);timers=[];document.querySelectorAll('video').forEach(v=>v.pause())}
function reset(){stop();editing=false;stage('idle');$('#photos').replaceChildren();$('#prompt').value='';$('#assetNote').textContent='＋ 图片与故事';$('#storyboard').replaceChildren();$('#status').textContent='分镜编排';$('#executionText').textContent='检查素材 · 编排镜头 · 分层渲染'}
function addImage(i){const im=new Image();im.src=`media/${i}.png`;im.alt=`素材 ${i}：${titles[i-1]}`;$('#photos').append(im);$('#assetNote').textContent=`${i} 张图片 · AI 生成素材`}
function story(){if(app.dataset.stage!=='idle')return;stage('story');$('#storyboard').replaceChildren();titles.forEach((t,i)=>{let el=document.createElement('article');el.className='shot';el.style.animationDelay=`${i*.12}s`;el.innerHTML=`<img src="media/${i+1}.png" alt="${t}"><div class="shot-id"><span>0${i+1}</span><span>${['03.1','05.6','05.6','05.6','08.1','05.0'][i]}s</span></div><h3>${t}</h3><p>${notes[i]}</p>`;$('#storyboard').append(el)});later(()=>{$('#status').textContent='技术 QA 通过';$('#executionText').textContent='720 帧 / 30 秒 · 分层工程已生成 · 执行记录回放'},2500);later(film,4300)}
function film(){stage('film');let v=$('#film');v.currentTime=0;v.play().catch(()=>{});v.onended=()=>edit()}
async function edit(){if(editing)return;editing=true;$('#film').pause();stage('edit');await Promise.all(['#before','#after'].map(async s=>{let v=$(s);v.currentTime=0;try{await v.play()}catch{}}))}
function start(){reset();for(let i=1;i<=6;i++)later(()=>addImage(i),500+i*350);let n=0;function type(){if(n<prompt.length){$('#prompt').value=prompt.slice(0,++n);later(type,43)}}later(type,3000);later(story,3000+prompt.length*43+1100)}
$('#start').onclick=start;$('#replay').onclick=start;$('#send').onclick=()=>{if(!$('#photos').children.length)for(let i=1;i<=6;i++)addImage(i);if(!$('#prompt').value.trim())$('#prompt').value=prompt;story()};$('#edit').onclick=edit;window.demo={start,reset,story,film,edit,addImage};
