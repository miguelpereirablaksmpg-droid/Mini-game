const c=document.querySelector('#game'),x=c.getContext('2d');let W,H;function resize(){W=c.width=innerWidth*devicePixelRatio;H=c.height=innerHeight*devicePixelRatio;x.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);W=innerWidth;H=innerHeight}addEventListener('resize',resize);resize();
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')keys.space=true});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')keys.space=false});
let player={x:W/2,y:430,vx:0,vy:0,w:34,h:48,onGround:false},coins=0,level=1;
const blocks=[{x:80,y:520,w:180,h:35},{x:330,y:455,w:160,h:35},{x:570,y:520,w:220,h:35},{x:860,y:420,w:170,h:35},{x:1080,y:510,w:180,h:35}];
const pickups=[{x:145,y:480},{x:400,y:415},{x:670,y:480},{x:940,y:380},{x:1150,y:470}];
function rect(r,col){x.fillStyle=col;x.fillRect(r.x,r.y,r.w,r.h)}
function draw(){x.clearRect(0,0,W,H); // clouds
for(let i=0;i<6;i++){x.fillStyle='#fff8';x.beginPath();x.arc(100+i*210,100+(i%2)*45,25,0,7);x.arc(130+i*210,95+(i%2)*45,35,0,7);x.arc(165+i*210,105+(i%2)*45,23,0,7);x.fill()}
blocks.forEach(b=>{rect(b,'#8b5a35');rect({x:b.x,y:b.y,w:b.w,h:7},'#49a942')});
pickups.forEach(p=>{if(!p.got){x.fillStyle='#ffd21a';x.beginPath();x.arc(p.x,p.y,10,0,7);x.fill();x.strokeStyle='#a56d00';x.stroke()}});
rect({x:player.x,y:player.y,w:player.w,h:player.h},'#e94b3c');rect({x:player.x+7,y:player.y+7,w:20,h:18},'#ffd1a3');x.fillStyle='#222';x.fillRect(player.x+10,player.y+13,4,4);x.fillRect(player.x+22,player.y+13,4,4);
}
function update(){let left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright;if(left)player.vx-=.7;if(right)player.vx+=.7;player.vx*=.82;player.vx=Math.max(-6,Math.min(6,player.vx));if((keys.space||keys.w||keys.arrowup)&&player.onGround){player.vy=-12;player.onGround=false}
player.vy+=.55;let oldY=player.y;player.x+=player.vx;player.y+=player.vy;player.onGround=false;
for(const b of blocks){if(player.x+player.w>b.x&&player.x<b.x+b.w&&oldY+player.h<=b.y&&player.y+player.h>=b.y&&player.vy>=0){player.y=b.y-player.h;player.vy=0;player.onGround=true}}
if(player.y>H+80){player.x=100;player.y=350;player.vy=0}
for(const p of pickups)if(!p.got&&Math.hypot(player.x+17-p.x,player.y+24-p.y)<28){p.got=true;coins++;document.querySelector('#coins').textContent=coins;document.querySelector('#message').textContent='+1 moeda!';setTimeout(()=>document.querySelector('#message').textContent='',700);if(coins%5===0){level++;document.querySelector('#level').textContent=level}}
draw();requestAnimationFrame(update)}update();