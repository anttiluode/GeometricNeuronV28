(function(){
'use strict';
const E=globalThis.GN28, $=id=>document.getElementById(id);
if(!E)throw Error('Load taps.js, v27.js and v28_reader.js first');
let bits=E.patterns()[10].slice(),selected=7,scan=null,index=0,playing=true,lastAdvance=0,running=false;
const color={orange:'#fa8e56',blue:'#72b7ff',green:'#91d5b6',ink:'#eaf1ee',dim:'#718e9d',line:'#314b5b'};
function fit(canvas){
 const box=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
 const w=box.width,h=box.height,pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 const x=canvas.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
 return {x,w,h};
}
function line(ctx,a,b,stroke,width=2,dash=[]){
 ctx.save();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dash);
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
}
function circle(ctx,x,y,r,fill,stroke){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function text(ctx,t,x,y,size=11,c=color.dim,align='center'){
 ctx.font=size+'px system-ui,Segoe UI,sans-serif';ctx.fillStyle=c;ctx.textAlign=align;
 ctx.fillText(String(t),x,y);
}
function network(){
 const {x,w,h}=fit($('network'));x.clearRect(0,0,w,h);
 const s=scan?.samples?.[index],phase=s?s.phase:0;
 const cx=w*.31,cy=h*.49,R=Math.min(w*.17,h*.34,100),rr=Math.max(7,Math.min(13,R*.14));
 const pts=Array.from({length:8},(_,i)=>{const a=-Math.PI/2+2*Math.PI*i/8;return{x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)};});
 for(let i=0;i<8;i++){
  const a=pts[i],b=pts[(i+1)%8];
  line(x,a,b,'#465763',1.5);
 }
 const reader={x:w*.76,y:h*.37},clock={x:w*.76,y:h*.74};
 line(x,pts[0],reader,color.orange,2.3);
 line(x,clock,reader,color.blue,2.3);
 x.save();x.setLineDash([3,6]);x.strokeStyle='#406178';x.beginPath();x.arc(cx,cy,R+23,0,Math.PI*2);x.stroke();x.restore();
 for(let i=0;i<8;i++){
  const slot=((phase-4*i)%32+32)%32,hot=Boolean(bits[slot]);
  circle(x,pts[i].x,pts[i].y,rr+3,hot?'#7e3c2a':'#1b313b','#415966');
  circle(x,pts[i].x,pts[i].y,rr-1,hot?color.orange:'#52636a');
  text(x,i,pts[i].x,pts[i].y+rr+17,10,color.ink);
 }
 circle(x,reader.x,reader.y,21,s?.observed?'#365a51':'#203843',color.green);
 circle(x,reader.x,reader.y,13,s?.observed?color.green:'#416e61');
 circle(x,clock.x,clock.y,21,'#1d3850',color.blue);
 circle(x,clock.x,clock.y,13,color.blue);
 text(x,'MEMORY / 32',cx,cy+R+45,11,color.orange);
 text(x,'READ',reader.x,reader.y+38,11,color.green);
 text(x,'CLOCK / 59',clock.x,clock.y+39,11,color.blue);
 text(x,s?'PHASE '+String(s.phase).padStart(2,'0'):'NO QUERY',reader.x,reader.y-33,10,color.ink);
 text(x,'Two unmodified input wires',w*.63,22,10,color.dim);
}
function trace(){
 const {x,w,h}=fit($('trace'));x.clearRect(0,0,w,h);
 const s=scan?.samples?.[index],t=s?s.tick:300;const begin=t-27,span=48;
 const lanes=[['ring',color.orange,37],['clock',color.blue,91],['reader',color.green,145]];
 const left=75,right=w-15,dx=(right-left)/span;
 for(const [name,ink,y] of lanes){
  x.strokeStyle='#2c4350';x.lineWidth=1;x.beginPath();x.moveTo(left,y+12);x.lineTo(right,y+12);x.stroke();
  text(x,name.toUpperCase(),10,y+8,10,ink,'left');
  if(!scan?.trace)continue;
  for(let i=0;i<span;i++){
   const hot=scan.trace[name][begin+i]||0;
   if(hot){
    x.fillStyle=ink;x.globalAlpha=.85;
    x.fillRect(left+i*dx,y-7,Math.max(2,dx*.85),16);
   }
  }
 }
 x.globalAlpha=1;
 const queryX=left+(t-begin)*dx,outputX=left+(t+4-begin)*dx;
 line(x,{x:queryX,y:11},{x:queryX,y:h-9},'#e5f2ff93',1.2,[4,5]);
 line(x,{x:outputX,y:11},{x:outputX,y:h-9},'#91d5b677',1,[2,6]);
 text(x,'query',queryX,10,10,color.ink);
 text(x,'+4',outputX,h-9,10,color.green);
}
function renderPattern(){
 const area=$('pattern');area.replaceChildren();
 bits.forEach((b,i)=>{
  const el=document.createElement('button');el.type='button';el.className=(b?'on ':'')+(i===selected?'selected':'');
  el.setAttribute('aria-label','Memory slot '+i+': '+(b?'one':'zero')+'. Click to toggle and select.');
  el.setAttribute('aria-pressed',Boolean(b));
  el.title='Slot '+i+' · '+(b?'1':'0');
  el.addEventListener('click',()=>{bits[i]=1-bits[i];selected=i;renderPattern();$('probeResult').textContent='Pattern changed. Re-run the scan for updated measurements.';});
  area.appendChild(el);
 });
 $('slot').textContent=String(selected).padStart(2,'0');
}
function renderPhases(){
 const box=$('phases');box.replaceChildren();
 const s=scan?.samples?.[index],seen=new Set((scan?.samples||[]).slice(0,index+1).map(v=>v.phase));
 for(let i=0;i<32;i++){
  const cell=document.createElement('div');
  if(seen.has(i))cell.classList.add('visited');
  if(s?.phase===i)cell.classList.add('now');
  cell.title='Phase '+i+(seen.has(i)?' visited':' not visited');
  box.appendChild(cell);
 }
 $('coverage').textContent=seen.size+' / 32';
}
function render(){
 network();trace();renderPhases();
 const sample=scan?.samples?.[index];
 $('scanCounter').textContent=sample?'QUERY '+(index+1)+' / '+scan.total:'QUERY —';
 $('tick').textContent=sample?sample.tick:'—';
 $('answer').textContent=sample?sample.observed:'—';
 $('answer').style.color=sample?.observed?color.green:color.dim;
 $('answerText').textContent=sample
  ?'Clock samples ring slots '+sample.phase+' and '+((sample.phase+1)%32)+
   ' · Expected OR '+sample.expected+' · Reader '+sample.observed+(sample.correct?' ✓':' ✕')
  :'Run the experiment to see what the reader says.';
}
function displayResult(id,value,good=null){
 const el=$(id);el.textContent=value;el.classList.toggle('good',good===true);
 el.classList.toggle('bad',good===false);
}
function run(){
 if(running)return;
 running=true;$('run').disabled=true;$('run').textContent='SIMULATING ORIGINAL LOOPS…';
 // Release browser paint before performing the synchronous reference simulation.
 setTimeout(()=>{
 try{
  scan=E.study(bits,{trace:true});index=0;playing=true;lastAdvance=0;
  const a=E.study(bits,{mode:'ringOnly'}),b=E.study(bits,{mode:'clockOnly'});
  displayResult('accuracy',scan.correct+' / '+scan.total,scan.correct===scan.total);
  displayResult('positive',String(scan.positives));
  displayResult('unsolicited',String(scan.unsolicited),scan.unsolicited===0);
  displayResult('stable',scan.stable?'UNCHANGED':'CORRUPTED',scan.stable);
  displayResult('withoutClock',a.samples.filter(s=>s.observed).length+' positive beats',a.samples.every(s=>!s.observed));
  displayResult('withoutRing',b.samples.filter(s=>s.observed).length+' positive beats',b.samples.every(s=>!s.observed));
  $('probeResult').textContent='Click a memory slot above, then run the separate manual probe.';
  $('play').textContent='Ⅱ Pause playback';
  render();
 }catch(error){$('probeResult').textContent='Simulation error: '+error.message;console.error(error);}
 finally{$('run').disabled=false;$('run').textContent='▶ RUN THE NATIVE CLOCK SCAN';running=false;}
 },25);
}
function setBits(next){bits=next;selected=Math.min(31,selected);renderPattern();$('probeResult').textContent='New memory loaded. Run the clock scan.';}
$('random').addEventListener('click',()=>{const n=7+Math.floor(Math.random()*20);setBits(E.patterns()[n].slice());});
$('single').addEventListener('click',()=>setBits(Array.from({length:32},(_,i)=>+(i===selected))));
$('empty').addEventListener('click',()=>setBits(Array(32).fill(0)));
$('dense').addEventListener('click',()=>setBits(Array(32).fill(1)));
$('run').addEventListener('click',run);
$('play').addEventListener('click',()=>{playing=!playing;lastAdvance=0;$('play').textContent=playing?'Ⅱ Pause playback':'▶ Play playback';});
$('prev').addEventListener('click',()=>{if(scan){index=(index+scan.samples.length-1)%scan.samples.length;render();}});
$('next').addEventListener('click',()=>{if(scan){index=(index+1)%scan.samples.length;render();}});
$('probe').addEventListener('click',()=>{
 try{
  const r=E.singleProbe(bits,selected);
  $('probeResult').textContent='Slot '+selected+' · expected '+r.actual+' · reader '+r.reader+
   (r.reader===r.actual?' · MATCH':' · MISS')+' · memory '+(r.stable?'preserved':'changed');
 }catch(e){$('probeResult').textContent='Probe error: '+e.message;}
});
function animation(timestamp){
 requestAnimationFrame(animation);
 if(!playing||!scan||!scan.samples.length)return;
 if(!lastAdvance)lastAdvance=timestamp;
 if(timestamp-lastAdvance>330){index=(index+1)%scan.samples.length;lastAdvance=timestamp;render();}
}
window.addEventListener('resize',render);
renderPattern();render();run();requestAnimationFrame(animation);
})();
