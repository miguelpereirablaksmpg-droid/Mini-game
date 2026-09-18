const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
let W=0,H=0,dpr=1,paused=false,quality=1;
let yaw=0,pitch=-0.12,zoom=720,dragging=false,lastMX=0,lastMY=0;
const keys={};
let p,coins=0,level=1,won=false;

function resize(){
  dpr=Math.min(devicePixelRatio||1,2)*quality;
  W=innerWidth; H=innerHeight;
  canvas.width=Math.max(1,W*dpr); canvas.height=Math.max(1,H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener('resize',resize); resize();

function setKey(e,down){
  const k=e.key.toLowerCase();
  keys[k]=down;
  if(e.code==='Space') keys.space=down;
}
function keyDown(e){
  if(e.key==='Escape'||e.code==='Escape'){
    e.preventDefault(); e.stopPropagation();
    toggleMenu();
    return;
  }
  setKey(e,true);
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='ArrowRight') e.preventDefault();
  if(e.key.toLowerCase()==='r') reset();
}
function keyUp(e){ setKey(e,false); }
window.addEventListener('keydown',keyDown,true);
window.addEventListener('keyup',keyUp,true);
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);dragging=false;});

canvas.addEventListener('mousedown',e=>{
  if(paused) return;
  dragging=true; lastMX=e.clientX; lastMY=e.clientY;
  canvas.classList.add('grabbing');
});
window.addEventListener('mousemove',e=>{
  if(!dragging||paused) return;
  const dx=e.clientX-lastMX,dy=e.clientY-lastMY;
  lastMX=e.clientX; lastMY=e.clientY;
  yaw+=dx*0.008;
  pitch=Math.max(-0.85,Math.min(0.45,pitch+dy*0.005));
});
window.addEventListener('mouseup',()=>{
  dragging=false; canvas.classList.remove('grabbing');
});
canvas.addEventListener('wheel',e=>{
  if(paused) return;
  zoom=Math.max(520,Math.min(900,zoom-e.deltaY*.35));
  e.preventDefault();
},{passive:false});

const platforms=[
 {x:-4,z:0,w:8,d:9,h:1.5,spawn:true},
 {x:-5,z:12,w:10,d:8,h:1},
 {x:-1,z:20,w:6,d:5,h:1.4},
 {x:5,z:29,w:5,d:5,h:2},
 {x:1,z:38,w:7,d:5,h:1},
 {x:-5,z:47,w:5,d:5,h:2.2},
 {x:1,z:56,w:6,d:6,h:1.2},
 {x:6,z:67,w:5,d:5,h:2.8},
 {x:0,z:78,w:7,d:6,h:1},
 {x:-6,z:89,w:6,d:5,h:2.5},
 {x:0,z:101,w:10,d:10,h:1}
];
const coins3d=[
 {x:0,z:14,y:2},{x:-1,z:23,y:3},{x:5,z:32,y:4},{x:1,z:41,y:3},
 {x:-5,z:50,y:4},{x:1,z:59,y:3},{x:6,z:70,y:5},{x:0,z:81,y:3},
 {x:-6,z:92,y:5},{x:0,z:105,y:3}
];

function reset(){
  p={x:0,z:4,y:3.5,vy:0,vx:0,vz:0,on:true};
  yaw=0; pitch=-0.12; zoom=720; won=false;
  coins3d.forEach(c=>c.got=false); coins=0; level=1; hud();
  show('CHEGUE AO FINAL! 🏁');
}
function hud(){
  document.querySelector('#coins').textContent=coins;
  document.querySelector('#level').textContent=level;
  document.querySelector('#speed').textContent=Math.round(Math.hypot(p.vx,p.vz)*10);
}
function cam(x,y,z){
  const dx=x-p.x,dz=z-p.z;
  const cy=Math.cos(yaw),sy=Math.sin(yaw);
  const rx=dx*cy-dz*sy;
  const rz=dx*sy+dz*cy;
  const cy2=Math.cos(pitch),sy2=Math.sin(pitch);
  const depth=rz*cy2-(y-p.y)*sy2+7;
  const vert=(y-p.y)*cy2+rz*sy2;
  const f=zoom/Math.max(depth,2);
  return {x:W/2+rx*f,y:H*.55-vert*f,depth,f};
}
function poly(points,fill,stroke){
  ctx.beginPath();
  points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
function visible(qs){return qs.some(q=>q.depth>1.2);}
function box(b){
  const top=[cam(b.x,b.h,b.z),cam(b.x+b.w,b.h,b.z),cam(b.x+b.w,b.h,b.z+b.d),cam(b.x,b.h,b.z+b.d)];
  const bottom=[cam(b.x,0,b.z),cam(b.x+b.w,0,b.z),cam(b.x+b.w,0,b.z+b.d),cam(b.x,0,b.z+b.d)];
  if(!visible(top)) return;
  poly([top[0],top[1],bottom[1],bottom[0]],'#304657','#ffffff22');
  poly([top[1],top[2],bottom[2],bottom[1]],'#223443','#ffffff18');
  poly([top[2],top[3],bottom[3],bottom[2]],'#273b4a','#ffffff18');
  poly(top,b.spawn?'#78909f':'#587487','#ffffff33');
  if(b.spawn){
    const q=cam(b.x+b.w/2,b.h+.04,b.z+b.d/2);
    if(q.depth>2){ctx.fillStyle='#fff';ctx.font='900 12px Arial';ctx.textAlign='center';ctx.fillText('SPAWN',q.x,q.y);}
  }
}
function drawGround(){
  const far=180,near=7,left=-45,right=45;
  const a=cam(left,0,near),b=cam(right,0,near),c=cam(right,0,far),d=cam(left,0,far);
  poly([a,b,c,d],'#1c2d35','#ffffff12');
  for(let z=10;z<=170;z+=10){
    const l=cam(left,0,z),r=cam(right,0,z);
    if(l.depth>1&&r.depth>1) poly([l,r,{x:r.x,y:r.y+1},{x:l.x,y:l.y+1}],null,'#ffffff16');
  }
  for(let x=-40;x<=40;x+=5){
    const l=cam(x,0,8),r=cam(x,0,170);
    if(l.depth>1&&r.depth>1){ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(r.x,r.y);ctx.strokeStyle='#ffffff12';ctx.stroke();}
  }
}
function drawWorld(){
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#071525');sky.addColorStop(.5,'#2d6b83');sky.addColorStop(1,'#c18c65');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  const sun=cam(-18,20,70);ctx.fillStyle='#ffe3a2';ctx.beginPath();ctx.arc(sun.x,sun.y,42,0,Math.PI*2);ctx.fill();
  drawGround();
  platforms.slice().sort((a,b)=>b.z-a.z).forEach(box);
  coins3d.filter(c=>!c.got).sort((a,b)=>b.z-a.z).forEach(c=>{
    const q=cam(c.x,c.y,c.z),s=Math.max(4,11*q.f/80);
    if(q.depth<2)return;
    ctx.fillStyle='#ffd84a';ctx.shadowColor='#ffe98a';ctx.shadowBlur=18;
    ctx.beginPath();ctx.arc(q.x,q.y,s,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  });
  drawPlayer();
}
function drawPlayer(){
  const q=cam(p.x,p.y+1.1,p.z),s=Math.max(12,36*q.f/80);
  ctx.save();ctx.translate(q.x,q.y);
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,s*1.45,s*.65,s*.18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e9edf2';ctx.fillRect(-s*.32,-s*.55,s*.64,s*.95);
  ctx.fillStyle='#c9d2dc';ctx.beginPath();ctx.arc(0,-s*.78,s*.32,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#202a35';ctx.fillRect(-s*.18,-s*.84,s*.1,s*.1);ctx.fillRect(s*.08,-s*.84,s*.1,s*.1);
  ctx.fillStyle='#4c86b8';ctx.fillRect(-s*.28,s*.4,s*.22,s*.65);ctx.fillRect(s*.06,s*.4,s*.22,s*.65);
  ctx.restore();
}
function show(t){
  const m=document.querySelector('#message');m.textContent=t;m.style.opacity=1;
  setTimeout(()=>{if(!won)m.style.opacity=0},900);
}
function toggleMenu(force){
  paused=typeof force==='boolean'?force:!paused;
  const menu=document.querySelector('#menu');
  menu.classList.toggle('hidden',!paused);
  menu.setAttribute('aria-hidden',String(!paused));
  menu.style.display=paused?'grid':'none';
  if(!paused){
    document.querySelector('#settings').classList.add('hidden');
    document.querySelector('#manual').classList.add('hidden');
  }
}
const menu=document.querySelector('#menu');
menu.style.display='none';
document.querySelector('#resume').addEventListener('click',e=>{e.preventDefault();toggleMenu(false);});
document.querySelector('#restartBtn').addEventListener('click',e=>{e.preventDefault();reset();toggleMenu(false);});
document.querySelector('#settingsBtn').addEventListener('click',e=>{e.preventDefault();document.querySelector('#settings').classList.toggle('hidden');document.querySelector('#manual').classList.add('hidden');});
document.querySelector('#manualBtn').addEventListener('click',e=>{e.preventDefault();document.querySelector('#manual').classList.toggle('hidden');document.querySelector('#settings').classList.add('hidden');});
document.querySelector('#quality').addEventListener('change',e=>{quality=+e.target.value;resize();});
reset();

function update(){
  if(!paused){
    const f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
    const side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
    const boost=keys.shift?1.65:1;
    const cs=Math.cos(yaw),sn=Math.sin(yaw);
    const moveX=(side*cs+f*sn),moveZ=(-side*sn+f*cs);
    p.vx+=moveX*.32*boost;p.vz+=moveZ*.42*boost;
    p.vx*=.86;p.vz*=.91;
    p.vx=Math.max(-5,Math.min(5,p.vx));p.vz=Math.max(-5,Math.min(5,p.vz));
    if(keys.space&&p.on){p.vy=9.5;p.on=false;}
    p.vy-=.42;p.x+=p.vx*.12;p.z+=p.vz*.16;p.y+=p.vy*.12;p.on=false;
    for(const b of platforms){
      if(p.x>b.x-.6&&p.x<b.x+b.w+.6&&p.z>b.z-.6&&p.z<b.z+b.d+.6&&p.vy<=0&&p.y<=b.h+1&&p.y>=b.h-.7){
        p.y=b.h;p.vy=0;p.on=true;
      }
    }
    for(const c of coins3d){
      if(!c.got&&Math.hypot(p.x-c.x,p.z-c.z)<1.7&&Math.abs(p.y-c.y)<2){
        c.got=true;coins++;if(coins%5===0)level++;hud();show('+1 MOEDA! 🪙');
      }
    }
    if(p.z>100&&p.on){won=true;show('VOCÊ VENCEU! 🏆');}
    if(p.y<-8){p.x=0;p.z=4;p.y=3.5;p.vy=0;p.vx=0;p.vz=0;show('CAIU! VOLTANDO AO SPAWN 😅');}
    hud();
  }
  drawWorld();requestAnimationFrame(update);
}
update();