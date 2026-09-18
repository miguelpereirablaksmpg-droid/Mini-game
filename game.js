import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x08111d);
scene.fog=new THREE.Fog(0x08111d,45,210);

const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,500);
let yaw=0,pitch=.28,distance=11;
const clock=new THREE.Clock();
const keys={};
let paused=false,coins=0,level=1,won=false,quality=1,dragging=false,lastX=0,lastY=0;
let checkpoint={x:0,y:1.5,z:4};
let jumpPressed=false;

scene.add(new THREE.HemisphereLight(0xbfe8ff,0x18222d,1.8));
const sun=new THREE.DirectionalLight(0xffe1ad,3.2);
sun.position.set(-30,55,20); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-30;
scene.add(sun);

const mat=(color,rough=.65,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const platformMat=mat(0x566d7b,.72,.15);
const edgeMat=mat(0x9ee7ff,.3,.55);
const playerMat=mat(0xe8eef5,.35,.15);
const darkMat=mat(0x182534,.3,.5);

const platforms=[
{x:-4,z:0,w:8,d:9,h:1.5,spawn:true},{x:-5,z:12,w:10,d:8,h:1},
{x:-1,z:20,w:6,d:5,h:1.4},{x:5,z:29,w:5,d:5,h:2},
{x:1,z:38,w:7,d:5,h:1},{x:-5,z:47,w:5,d:5,h:2.2},
{x:1,z:56,w:6,d:6,h:1.2},{x:6,z:67,w:5,d:5,h:2.8},
{x:0,z:78,w:7,d:6,h:1},{x:-6,z:89,w:6,d:5,h:2.5},
{x:0,z:101,w:10,d:10,h:1}
];

const world=new THREE.Group();scene.add(world);
const solids=[];
for(const b of platforms){
  const m=new THREE.Mesh(new THREE.BoxGeometry(b.w,b.h,b.d),platformMat.clone());
  m.position.set(b.x+b.w/2,b.h/2,b.z+b.d/2);
  m.castShadow=true;m.receiveShadow=true;world.add(m);solids.push({mesh:m,b});
  const e=new THREE.Mesh(new THREE.BoxGeometry(b.w+.08,.08,b.d+.08),edgeMat);
  e.position.set(m.position.x,b.h+.04,m.position.z);world.add(e);
}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,260,30,52),mat(0x16252d,.92));
ground.rotation.x=-Math.PI/2;ground.position.set(0,-.04,80);ground.receiveShadow=true;world.add(ground);
const grid=new THREE.GridHelper(150,30,0x6c8792,0x344851);grid.position.set(0,.01,80);world.add(grid);

const player=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,1.05,8,16),playerMat);
body.castShadow=true;body.position.y=1.005;player.add(body);
const visor=new THREE.Mesh(new THREE.BoxGeometry(.58,.18,.08),darkMat);visor.position.set(0,1.25,-.45);player.add(visor);
const ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.035,8,32),edgeMat);ring.rotation.x=Math.PI/2;ring.position.y=.08;player.add(ring);
scene.add(player);

const coinGroup=new THREE.Group();scene.add(coinGroup);
const coins3d=[{x:0,z:14,y:2},{x:-1,z:23,y:3},{x:5,z:32,y:4},{x:1,z:41,y:3},{x:-5,z:50,y:4},{x:1,z:59,y:3},{x:6,z:70,y:5},{x:0,z:81,y:3},{x:-6,z:92,y:5},{x:0,z:105,y:3}];
for(const c of coins3d){
  const g=new THREE.Group();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.12,24),new THREE.MeshStandardMaterial({color:0xffd447,emissive:0x7a4d00,emissiveIntensity:1.2,metalness:.75,roughness:.22}));
  m.rotation.x=Math.PI/2;g.add(m);
  const halo=new THREE.PointLight(0xffd84d,1.5,5);g.add(halo);
  g.position.set(c.x,c.y,c.z);g.userData=c;coinGroup.add(g);
}

function reset(){
  player.position.set(checkpoint.x,checkpoint.y,checkpoint.z);
  player.rotation.set(0,0,0);
  velocity.set(0,0,0);onGround=false;won=false;coins=0;level=1;
  coins3d.forEach((c,i)=>coinGroup.children[i].visible=true);
  updateHud();say('CHEGUE AO FINAL! 🏁');
}
const velocity=new THREE.Vector3();
let onGround=false;

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2)*quality)}
addEventListener('resize',resize);

function setKey(e,down){
  if(e.code==='Space')keys.space=down; else keys[e.key.toLowerCase()]=down;
}
function keydown(e){
  if(e.key==='Escape'||e.code==='Escape'){e.preventDefault();e.stopPropagation();toggleMenu();return}
  if(paused)return;
  if(e.code==='Space'&&!e.repeat)jumpPressed=true;
  setKey(e,true);
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.key.toLowerCase()==='r')respawn();
}
function keyup(e){setKey(e,false);if(e.code==='Space')jumpPressed=false}
addEventListener('keydown',keydown,true);addEventListener('keyup',keyup,true);
addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);dragging=false});

canvas.addEventListener('mousedown',e=>{if(paused)return;dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.classList.add('grabbing')});
addEventListener('mousemove',e=>{if(!dragging||paused)return;yaw-=(e.clientX-lastX)*.006;pitch-= (e.clientY-lastY)*.004;pitch=THREE.MathUtils.clamp(pitch,-.15,1.0);lastX=e.clientX;lastY=e.clientY});
addEventListener('mouseup',()=>{dragging=false;canvas.classList.remove('grabbing')});
canvas.addEventListener('wheel',e=>{if(paused)return;distance=THREE.MathUtils.clamp(distance+e.deltaY*.012,6,18);e.preventDefault()},{passive:false});

function respawn(){player.position.set(checkpoint.x,checkpoint.y,checkpoint.z);velocity.set(0,0,0);onGround=false;won=false;say('CHECKPOINT ↻')}
function toggleMenu(force){paused=typeof force==='boolean'?force:!paused;const m=document.querySelector('#menu');m.classList.toggle('hidden',!paused);m.setAttribute('aria-hidden',String(!paused));m.style.display=paused?'grid':'none';if(!paused){document.querySelector('#settings').classList.add('hidden');document.querySelector('#manual').classList.add('hidden')}}
const menu=document.querySelector('#menu');menu.style.display='none';
document.querySelector('#resume').addEventListener('click',()=>toggleMenu(false));
document.querySelector('#restartBtn').addEventListener('click',()=>{checkpoint={x:0,y:1.5,z:4};reset();toggleMenu(false)});
document.querySelector('#settingsBtn').addEventListener('click',()=>{document.querySelector('#settings').classList.toggle('hidden');document.querySelector('#manual').classList.add('hidden')});
document.querySelector('#manualBtn').addEventListener('click',()=>{document.querySelector('#manual').classList.toggle('hidden');document.querySelector('#settings').classList.add('hidden')});
document.querySelector('#quality').addEventListener('change',e=>{quality=Number(e.target.value)||1;resize()});

function say(t){const el=document.querySelector('#message');el.textContent=t;el.style.opacity='1';clearTimeout(say.timer);say.timer=setTimeout(()=>{el.style.opacity='0'},1100)}
function updateHud(){document.querySelector('#coins').textContent=coins;document.querySelector('#level').textContent=level;document.querySelector('#speed').textContent=Math.round(Math.hypot(velocity.x,velocity.z)*12)}

function physics(dt){
  const forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  const side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  const len=Math.hypot(forward,side)||1;
  const f=forward/len,s=side/len;
  const dir=new THREE.Vector3(s,0,f);
  dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const accel=keys.shift?22:15;
  velocity.x+=dir.x*accel*dt;velocity.z+=dir.z*accel*dt;
  const max=keys.shift?9:6.2;const horizontal=Math.hypot(velocity.x,velocity.z);
  if(horizontal>max){velocity.x*=max/horizontal;velocity.z*=max/horizontal}
  const drag=Math.pow(.82,dt*60);velocity.x*=drag;velocity.z*=drag;
  if(jumpPressed&&onGround){velocity.y=10.5;onGround=false;jumpPressed=false}
  velocity.y-=25*dt;
  const oldY=player.position.y;
  player.position.x+=velocity.x*dt;player.position.z+=velocity.z*dt;player.position.y+=velocity.y*dt;
  onGround=false;
  for(const s of solids){
    const b=s.b,top=b.h;
    if(player.position.x>b.x-.45&&player.position.x<b.x+b.w+.45&&player.position.z>b.z-.45&&player.position.z<b.z+b.d+.45&&oldY>=top-.05&&player.position.y<=top&&velocity.y<=0){
      player.position.y=top;velocity.y=0;onGround=true;
      if(b.z+ b.d>checkpoint.z+5){checkpoint={x:b.x+b.w/2,y:top,z:b.z+b.d/2};level=Math.max(level,platforms.indexOf(b)+1);say('CHECKPOINT '+level+' ✓')}
    }
  }
  if(player.position.y<-12)respawn();
  for(const c of coinGroup.children){if(!c.visible)continue;c.rotation.y+=dt*4;if(player.position.distanceTo(c.position)<1.5){c.visible=false;coins++;if(coins===5)say('METADE DAS MOEDAS! 🪙');if(coins===10)say('TODAS AS MOEDAS! ⭐')}}
  if(player.position.z>105&&onGround&&!won){won=true;say('VOCÊ VENCEU! 🏆')}
  updateHud();
}

function cameraUpdate(){
  const target=player.position.clone();target.y+=1.1;
  const offset=new THREE.Vector3(0,0,distance);
  offset.applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  if(!paused)physics(dt);
  cameraUpdate();
  renderer.render(scene,camera);
}
resize();reset();animate();