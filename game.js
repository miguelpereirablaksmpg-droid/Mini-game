const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');let W,H,dpr;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')keys.space=true;if(e.key.toLowerCase()==='r')reset()});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')keys.space=false});
let p,coins=0,level=1,shake=0,won=false;
const platforms=[
{x:-5,z:10,w:10,d:8,h:1},{x:-1,z:20,w:6,d:5,h:1.4},{x:5,z:29,w:5,d:5,h:2},
{x:1,z:38,w:7,d:5,h:1},{x:-5,z:47,w:5,d:5,h:2.2},{x:1,z:56,w:6,d:6,h:1.2},
{x:6,z:67,w:5,d:5,h:2.8},{x:0,z:78,w:7,d:6,h:1},{x:-6,z:89,w:6,d:5,h:2.5},
{x:0,z:101,w:10,d:10,h:1}
];
const coins3d=[{x:0,z:14,y:2},{x:-1,z:23,y:3},{x:5,z:32,y:4},{x:1,z:41,y:3},{x:-5,z:50,y:4},
{x:1,z:59,y:3},{x:6,z:70,y:5},{x:0,z:81,y:3},{x:-6,z:92,y:5},{x:0,z:105,y:3}];
function reset(){p={x:0,z:5,y:3,vy:0,vx:0,vz:0,on:false};won=false;document.querySelector('#message').textContent='CHEGUE AO FINAL! 🏁';document.querySelector('#message').style.opacity=1;coins3d.forEach(c=>c.got=false);coins=0;level=1;hud()}
reset();
function hud(){document.querySelector('#coins').textContent=coins;document.querySelector('#level').textContent=level;document.querySelector('#speed').textContent=Math.round(Math.hypot(p.vx,p.vz)*10)}
function project(x,y,z){const dz=z-p.z+7;const f=720/(Math.max(dz,2));return{x:W/2+(x-p.x)*f,y:H*.52-(y-p.y)*f,z:dz,f}}
function poly(points,fill,stroke){ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function box(b){
const y=b.h,pts=[project(b.x,y,b.z),project(b.x+b.w,y,b.z),project(b.x+b.w,y,b.z+b.d),project(b.x,y,b.z+b.d)];
const bot=[project(b.x,0,b.z),project(b.x+b.w,0,b.z),project(b.x+b.w,0,b.z+b.d),project(b.x,0,b.z+b.d)];
poly([pts[0],pts[1],bot[1],bot[0]],'rgba(42,58,72,.96)');poly([pts[1],pts[2],bot[2],bot[1]],'rgba(26,39,51,.98)');poly([pts[2],pts[3],bot[3],bot[2]],'rgba(33,48,61,.98)');poly(pts,'rgba(77,103,119,.98)','rgba(255,255,255,.14)');
for(let i=1;i<4;i++){const a={x:pts[0].x+(pts[1].x-pts[0].x)*i/4,y:pts[0].y+(pts[1].y-pts[0].y)*i/4},b2={x:pts[3].x+(pts[2].x-pts[3].x)*i/4,y:pts[3].y+(pts[2].y-pts[3].y)*i/4};ctx.strokeStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b2.x,b2.y);ctx.stroke()}
}
function drawWorld(){
const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#081525');sky.addColorStop(.48,'#2b6681');sky.addColorStop(1,'#c08b62');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
const sun=project(-12,18,65);ctx.fillStyle='rgba(255,220,150,.8)';ctx.beginPath();ctx.arc(sun.x,sun.y,45,0,7);ctx.fill();
ctx.fillStyle='#101a24';for(let i=0;i<14;i++){let z=32+i*7;let h=3+(i%5)*1.5;let q=project(-16+i*2.5,h,z);ctx.fillRect(q.x,q.y,45,120)}
platforms.slice().sort((a,b)=>b.z-a.z).forEach(box);
coins3d.filter(c=>!c.got).sort((a,b)=>b.z-a.z).forEach(c=>{const q=project(c.x,c.y,c.z);const s=Math.max(3,10*q.f/80);ctx.fillStyle='#ffd84a';ctx.shadowColor='#ffe98a';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(q.x,q.y,s,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff2a8';ctx.stroke()});
drawPlayer();
}
function drawPlayer(){const q=project(p.x,p.y+1.1,p.z),s=Math.max(12,35*q.f/80);ctx.save();ctx.translate(q.x,q.y);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,s*1.45,s*.65,s*.18,0,0,7);ctx.fill();ctx.fillStyle='#e9edf2';ctx.fillRect(-s*.32,-s*.55,s*.64,s*.95);ctx.fillStyle='#c9d2dc';ctx.beginPath();ctx.arc(0,-s*.78,s*.32,0,7);ctx.fill();ctx.fillStyle='#202a35';ctx.fillRect(-s*.18,-s*.84,s*.1,s*.1);ctx.fillRect(s*.08,-s*.84,s*.1,s*.1);ctx.fillStyle='#4c86b8';ctx.fillRect(-s*.28,s*.4,s*.22,s*.65);ctx.fillRect(s*.06,s*.4,s*.22,s*.65);ctx.restore()}
function update(){
let f=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);let boost=keys.shift?1.65:1;
p.vx+=(side*0.32*boost);p.vz+=(f*0.42*boost);p.vx*=.86;p.vz*=.91;p.vx=Math.max(-5,Math.min(5,p.vx));p.vz=Math.max(-5,Math.min(5,p.vz));
if((keys.space||keys.w||keys.arrowup)&&p.on){p.vy=9.5;p.on=false}
p.vy-=.42;p.x+=p.vx*.12;p.z+=p.vz*.16;p.y+=p.vy*.12;p.on=false;
for(const b of platforms){if(p.x>b.x-.6&&p.x<b.x+b.w+.6&&p.z>b.z-.6&&p.z<b.z+b.d+.6&&p.vy<=0&&p.y<=b.h+1&&p.y>=b.h-.7){p.y=b.h;p.vy=0;p.on=true}}
for(const c of coins3d)if(!c.got&&Math.hypot(p.x-c.x,p.z-c.z)<1.7&&Math.abs(p.y-c.y)<2){c.got=true;coins++;if(coins%5===0)level++;hud();show('+1 MOEDA! 🪙')}
if(p.z>100&&p.on){won=true;show('VOCÊ VENCEU! 🏆',true)}
if(p.y<-8){p.x=0;p.z=5;p.y=4;p.vy=0;shake=10;show('CAIU! TENTE DE NOVO 😅')}
hud();shake*=.88;drawWorld();requestAnimationFrame(update)}
function show(t,stay=false){const m=document.querySelector('#message');m.textContent=t;m.style.opacity=1;if(!stay)setTimeout(()=>{if(!won)m.style.opacity=0},700)}
update();