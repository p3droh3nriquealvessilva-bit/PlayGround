import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const ui = Object.fromEntries(['clock','objective','objectiveHint','progressFill','progressText','locationName','threatCount','interaction','interactionText','condition','healthBar','healthValue','hungerBar','hungerValue','thirstBar','thirstValue','staminaBar','staminaValue','dayValue','tempValue','woundTag','ammoValue','reserveValue','medCount','foodCount','waterCount','message','damageFlash','startScreen','inventoryScreen','pauseScreen','endScreen','inventoryList','capacity','endTitle','endText'].map(id=>[id,$(id)]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x89938a); scene.fog=new THREE.FogExp2(0x89938a,.012);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.08,180); camera.position.set(0,1.68,8); scene.add(camera);
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
scene.add(new THREE.HemisphereLight(0xc5d5d0,0x353b32,2.1));
const sun=new THREE.DirectionalLight(0xffd5a5,2.1);sun.position.set(-16,28,12);scene.add(sun);
const materials={}; const mat=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
const mats={asphalt:mat(0x353b38),sidewalk:mat(0x77796f),concrete:mat(0x77796d),brick:mat(0x665b50),plaster:mat(0x858174),dark:mat(0x202723),window: new THREE.MeshStandardMaterial({color:0x263839,roughness:.25,metalness:.25}),wood:mat(0x594a38),metal:mat(0x39403c,.55),yellow:mat(0xb5a16b),leaf:mat(0x424f3d),blood:mat(0x522d26)};
const boxGeo=new THREE.BoxGeometry(1,1,1), sphereGeo=new THREE.SphereGeometry(1,8,6);
function box(parent,material,pos,scale,geo=boxGeo){const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
const ground=box(scene,mats.asphalt,[0,-.22,0],[120,.4,150]);
// Street markings and pavements
for(const side of [-1,1]){box(scene,mats.sidewalk,[side*7.2,-.01,-20],[4,.3,115]);box(scene,mats.concrete,[side*10,-.01,-20],[1.5,.3,115]);}
for(let z=-72;z<48;z+=12)box(scene,mat(0xb6b39e),[0,-.005,z],[.18,.025,4.2]);
// City blocks: simple low-cost geometry with facade details.
const buildings=[];
for(let side of [-1,1]) for(let i=0;i<8;i++){
  const z=-69+i*16+Math.random()*4, width=7+Math.random()*5,height=9+Math.random()*9, depth=11+Math.random()*4,x=side*(11+width/2);
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const wallMat=[mats.brick,mats.plaster,mat(0x696b61),mat(0x827a69)][Math.floor(Math.random()*4)];
  box(g,wallMat,[0,height/2,0],[width,height,depth]);box(g,mats.dark,[0,height+.17,0],[width+.35,.35,depth+.35]);
  for(let floor=1;floor<height-1;floor+=3.1)for(let wx=-width/2+1.4;wx<width/2-1;wx+=2.65){
    box(g,mats.window,[wx,floor,-depth/2-.012],[1.15,1.45,.06]);
    box(g,mats.dark,[wx,floor-.79,-depth/2-.04],[1.35,.11,.14]);
    if(Math.random()<.3)box(g,mats.wood,[wx,floor,-depth/2-.1],[.12,1.5,.12]);
  }
  box(g,mats.dark,[0,1.15,-depth/2-.045],[1.5,2.3,.12]);
  // fire escape ledges
  if(Math.random()<.55){for(let fy=3;fy<height-1;fy+=3.3)box(g,mats.metal,[side*width*.32,fy,-depth/2-.24],[2.5,.12,.55]);}
  buildings.push({x,z,width,depth});
}
// Street clutter: wrecks, barrels, debris and lamps
const obstacles=[];
function obstacle(x,z,w,d,h,material=mats.dark){const o=box(scene,material,[x,h/2,z],[w,h,d]);obstacles.push({x,z,r:Math.max(w,d)*.58});return o;}
for(let i=0;i<9;i++){
 const z=5-i*10+(Math.random()*3),side=i%2?1:-1,x=side*(4.4+Math.random()*1.1);
 const car=new THREE.Group();car.position.set(x,0,z);car.rotation.y=(Math.random()-.5)*.11;scene.add(car);
 box(car,mat(i%2?0x454b48:0x56493d),[0,.62,0],[2.2,1.05,4.3]);box(car,mats.window,[0,1.22,-.38],[1.8,.7,1.7]);
 for(const wx of [-1,1])for(const wz of [-1.35,1.35]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.2,10),mats.dark);wheel.rotation.z=Math.PI/2;wheel.position.set(wx,.34,wz);car.add(wheel);}
 obstacles.push({x,z,r:1.05});
}
for(let i=0;i<22;i++){let x=(Math.random()<.5?-1:1)*(7.8+Math.random()*4),z=Math.random()*105-62;obstacle(x,z,.55,.55,.9+Math.random()*1.1,i%3?mats.wood:mats.metal);}
for(let z=-60;z<30;z+=20)for(let side of [-1,1]){const pole=box(scene,mats.metal,[side*8.6,4.1,z],[.12,8.2,.12]);box(scene,mats.yellow,[side*8.6,8.2,z],[.65,.18,.3]);}
// Loot containers placed in accessible street-side positions.
const loot=[];
const lootDefs=[['GARRAFA DE ÁGUA','ÁGUA POTÁVEL', '◉','water'],['LATA DE FEIJÃO','ALIMENTO', '▣','food'],['KIT DE PRIMEIROS SOCORROS','MEDICAMENTO','✚','med'],['CARTUCHOS 12 GA','MUNIÇÃO','⌁','ammo'],['BARRA DE CEREAL','ALIMENTO','▰','food'],['ÁGUA ENGARRAFADA','ÁGUA POTÁVEL','◉','water']];
for(let i=0;i<6;i++){
 const z=-8-i*12,x=0, crate=new THREE.Group();crate.position.set(x,0,z);scene.add(crate);
 box(crate,i%2?mats.wood:mats.metal,[0,.36,0],[.9,.72,.72]);box(crate,mats.yellow,[0,.75,0],[.66,.08,.56]);
 const d=lootDefs[i];loot.push({group:crate,x,z,item:{name:d[0],type:d[3],icon:d[2],desc:d[1]},searched:false});
}
// Extraction marker at the far end of the road.
const exitGroup=new THREE.Group();exitGroup.position.set(0,0,-72);scene.add(exitGroup);
const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,6,8),new THREE.MeshBasicMaterial({color:0x94d39a}));beacon.position.y=3;exitGroup.add(beacon);
const beaconLight=new THREE.PointLight(0x75df8c,8,16);beaconLight.position.y=4;exitGroup.add(beaconLight);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.1,6,24),new THREE.MeshBasicMaterial({color:0x8fe6a2}));ring.rotation.x=Math.PI/2;ring.position.y=.12;exitGroup.add(ring);
// Rain particles kept intentionally modest for mobile GPUs.
const rainCount=360,rainPositions=new Float32Array(rainCount*3);for(let i=0;i<rainCount;i++){rainPositions[i*3]=(Math.random()-.5)*40;rainPositions[i*3+1]=Math.random()*18;rainPositions[i*3+2]=(Math.random()-.5)*48;}
const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.Points(rainGeometry,new THREE.PointsMaterial({color:0xc2d0cb,size:.045,transparent:true,opacity:.48}));scene.add(rain);

const player={pos:new THREE.Vector3(0,1.68,12),yaw:0,pitch:0,health:100,hunger:84,thirst:72,stamina:100,ammo:2,reserve:12,med:1,food:1,water:1,supplies:0,inventory:[],wounded:false,flashlight:false,alive:true};
const keys={};let running=false,paused=false,inventoryOpen=false,gameEnded=false,elapsed=0,attackCooldown=0,shotCooldown=0,reloadTimer=0,toastTimer=0,clockMinutes=42,moveX=0,moveY=0,touchLook=null,joystick=null,runHeld=false;
const zombieMat=mat(0x697064),skinMat=mat(0x878578),shirtMat=mat(0x554f43),pantsMat=mat(0x393e38);
const zombies=[];
let audioContext=null,audioBus=null,audioOn=true;
function initAudio(){if(audioContext)return;try{audioContext=new AudioContext();audioBus=audioContext.createGain();audioBus.gain.value=.18;audioBus.connect(audioContext.destination);const length=audioContext.sampleRate*2,buffer=audioContext.createBuffer(1,length,audioContext.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=Math.random()*2-1;const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=320;const gain=audioContext.createGain();gain.gain.value=.035;noise.connect(filter).connect(gain).connect(audioBus);noise.start();}catch(e){audioContext=null;}}
function soundShot(){if(!audioContext||!audioOn)return;const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sawtooth';osc.frequency.setValueAtTime(105,now);osc.frequency.exponentialRampToValueAtTime(28,now+.22);gain.gain.setValueAtTime(.42,now);gain.gain.exponentialRampToValueAtTime(.001,now+.28);osc.connect(gain).connect(audioBus);osc.start(now);osc.stop(now+.3);}
function makeZombie(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const torso=box(g,shirtMat,[0,1.05,0],[.62,.82,.34]);
 const head=new THREE.Mesh(sphereGeo,skinMat);head.position.set(0,1.67,-.015);head.scale.set(.24,.28,.23);g.add(head);
 const eyeMat=new THREE.MeshBasicMaterial({color:0xb63b2e});for(let s of [-1,1]){const e=new THREE.Mesh(sphereGeo,eyeMat);e.position.set(s*.09,1.7,-.21);e.scale.set(.035,.035,.025);g.add(e);}
 const limbs=[];for(let s of [-1,1]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.72,6),skinMat);arm.position.set(s*.39,1.05,-.08);arm.rotation.z=s*.55;g.add(arm);limbs.push(arm);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.68,6),pantsMat);leg.position.set(s*.17,.38,0);g.add(leg);limbs.push(leg);}
 const zombie={group:g,limbs,hp:100,alive:true,speed:.5+Math.random()*.15,attack:0,roam:Math.random()*6};zombies.push(zombie);return zombie;
}
[[-4,-20],[4,-34],[-4,-48],[4,-62]].forEach(p=>makeZombie(...p));
function showMessage(text,duration=2300){ui.message.textContent=text;ui.message.classList.add('show');toastTimer=duration;}
function setObjective(){
 if(player.supplies<3){ui.objective.textContent='ENCONTRE SUPRIMENTOS';ui.objectiveHint.textContent='Vasculhe caixas na rua. Água e comida são prioridade.';ui.progressText.textContent=`${player.supplies} / 3 SUPRIMENTOS`;ui.progressFill.style.width=`${player.supplies/3*100}%`;}
 else {ui.objective.textContent='ALCANCE O ABRIGO';ui.objectiveHint.textContent='Siga a avenida até o sinalizador verde no fim da rua.';ui.progressText.textContent='ABRIGO ATIVO · SETOR LESTE';ui.progressFill.style.width='100%';}
}
function nearestLoot(){let best=null,dist=2.3;for(const item of loot)if(!item.searched){const d=Math.hypot(player.pos.x-item.x,player.pos.z-item.z);if(d<dist){dist=d;best=item;}}return best;}
function activeZombies(){return zombies.filter(z=>z.alive&&z.group.position.distanceTo(player.pos)<28).length;}
function updateInteraction(){const toExit=Math.hypot(player.pos.x,player.pos.z+72);if(player.supplies>=3&&toExit<8.5){ui.interactionText.textContent='ENTRAR NO ABRIGO';ui.interaction.classList.add('show');return;}const l=nearestLoot();if(l){ui.interactionText.textContent='VASCULHAR';ui.interaction.classList.add('show');return;}ui.interaction.classList.remove('show');}
function search(){const toExit=Math.hypot(player.pos.x,player.pos.z+72);if(player.supplies>=3&&toExit<8.5){finish(true);return;}const l=nearestLoot();if(l){l.searched=true;l.group.visible=false;player.supplies++;if(l.item.type==='water')player.water++;if(l.item.type==='food')player.food++;if(l.item.type==='med')player.med++;if(l.item.type==='ammo')player.reserve+=4;showMessage(`ENCONTRADO: ${l.item.name}`);setObjective();updateInventory();return;}showMessage('NADA AO ALCANCE. APROXIME-SE DE UMA CAIXA.');}
function useSlot(slot){if(slot===0){showMessage('IZH-43 PRONTA · CLIQUE PARA DISPARAR');return;}if(slot===1){if(player.med>0&&player.health<100){player.med--;player.health=Math.min(100,player.health+45);player.wounded=false;showMessage('FERIMENTO TRATADO · +45 SAÚDE');}else showMessage(player.med?'VOCÊ NÃO PRECISA DE TRATAMENTO.':'SEM KIT MÉDICO.');}
 if(slot===2){if(player.food>0){player.food--;player.hunger=Math.min(100,player.hunger+38);showMessage('ALIMENTO CONSUMIDO · FOME REDUZIDA.');}else showMessage('SEM ALIMENTO. VASCULHE A CIDADE.');}
 if(slot===3){if(player.water>0){player.water--;player.thirst=Math.min(100,player.thirst+42);showMessage('ÁGUA POTÁVEL · SEDE REDUZIDA.');}else showMessage('SEM ÁGUA. VASCULHE A CIDADE.');}
 updateInventory();updateUI();}
function updateInventory(){
  ui.medCount.textContent=player.med;ui.foodCount.textContent=player.food;ui.waterCount.textContent=player.water;
  const carried=player.med+player.food+player.water+Math.ceil(player.reserve/4);
  ui.capacity.textContent=`${carried} / 12`;ui.inventoryList.innerHTML='';
  const items=[];
  if(player.med)items.push({name:'KIT DE PRIMEIROS SOCORROS',type:'med',icon:'✚',desc:`${player.med} UN.`});
  if(player.food)items.push({name:'RAÇÃO',type:'food',icon:'▣',desc:`${player.food} UN.`});
  if(player.water)items.push({name:'ÁGUA POTÁVEL',type:'water',icon:'◉',desc:`${player.water} UN.`});
  if(player.ammo||player.reserve)items.push({name:'CARTUCHOS 12 GA',type:'ammo',icon:'⌁',desc:`${player.ammo} NA ARMA · ${player.reserve} NA MOCHILA`});
  if(player.supplies)items.push({name:'SUPRIMENTOS RECUPERADOS',type:'supply',icon:'✓',desc:`${player.supplies} DE 3 PARA O ABRIGO`});
  if(!items.length)ui.inventoryList.innerHTML='<div class="inventory-item"><small>MOCHILA VAZIA</small></div>';
  items.forEach(item=>{const el=document.createElement('div');el.className='inventory-item';el.innerHTML=`<span>${item.icon}</span><div><b>${item.name}</b><small>${item.desc}</small></div>${['med','food','water'].includes(item.type)?'<button>USAR</button>':''}`;const btn=el.querySelector('button');if(btn)btn.onclick=()=>useSlot(({med:1,food:2,water:3})[item.type]);ui.inventoryList.appendChild(el);});
}
function updateUI(){
 for(const [key,val] of [['health',player.health],['hunger',player.hunger],['thirst',player.thirst],['stamina',player.stamina]]){const v=Math.round(val);ui[`${key}Bar`].style.width=`${v}%`;ui[`${key}Value`].textContent=v;}
 ui.ammoValue.textContent=player.ammo;ui.reserveValue.textContent=player.reserve;ui.threatCount.textContent=activeZombies();ui.condition.textContent=player.health<35?'CRÍTICO':player.hunger<20||player.thirst<20?'DEBILITADO':player.wounded?'FERIDO':'ESTÁVEL';ui.woundTag.textContent=player.wounded?'FERIMENTO ABERTO':'SEM FERIMENTOS';ui.woundTag.classList.toggle('danger',player.wounded);ui.dayValue.textContent=`DIA ${String(1+Math.floor(elapsed/180)).padStart(2,'0')}`;ui.tempValue.textContent=`${Math.round(12-Math.min(elapsed/600,5))}°C`;ui.clock.textContent=`${String(6+Math.floor((42+elapsed*2)/60)).padStart(2,'0')}:${String(Math.floor((42+elapsed*2)%60)).padStart(2,'0')}`;
}
function finish(success){gameEnded=true;running=false;ui.endTitle.textContent=success?'VOCÊ SOBREVIVEU.':'FIM DA JORNADA.';ui.endText.textContent=success?'O abrigo ainda está de pé. Por enquanto.':'A cidade tomou mais uma vida. Respire e tente novamente.';ui.endScreen.className='modal-screen visible';ui.endScreen.style.display='flex';if(document.pointerLockElement)document.exitPointerLock();}
function damage(amount){player.health=Math.max(0,player.health-amount);player.wounded=true;ui.damageFlash.classList.remove('hit');void ui.damageFlash.offsetWidth;ui.damageFlash.classList.add('hit');showMessage('VOCÊ FOI FERIDO!');if(player.health<=0)finish(false);updateUI();}
function shoot(){if(!running||paused||inventoryOpen||shotCooldown>0)return;if(player.ammo<=0){showMessage('SEM MUNIÇÃO · PRESSIONE R');return;}player.ammo--;shotCooldown=.48;soundShot();showMessage('TIRO DISPARADO');
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);const targets=[];for(const z of zombies)if(z.alive){const d=z.group.position.distanceTo(camera.position);if(d<24)targets.push(z.group.children[1]);}
 const hit=ray.intersectObjects(targets,false)[0];if(hit){const z=zombies.find(q=>q.group.children.includes(hit.object));if(z){z.hp-=55;if(z.hp<=0){z.alive=false;scene.remove(z.group);showMessage('AMEAÇA ELIMINADA');}else showMessage('ALVO ATINGIDO');}}
}
function reload(){if(!running||player.ammo>=2||player.reserve<=0||reloadTimer>0)return;reloadTimer=1.15;showMessage('RECARREGANDO…');}
function toggleInventory(force){inventoryOpen=typeof force==='boolean'?force:!inventoryOpen;ui.inventoryScreen.classList.toggle('visible',inventoryOpen);if(inventoryOpen){updateInventory();if(document.pointerLockElement)document.exitPointerLock();}else if(running&&!isTouchDevice())$('world').requestPointerLock?.();}
function isTouchDevice(){return matchMedia('(pointer:coarse)').matches||'ontouchstart'in window;}
function pauseGame(){if(!running||gameEnded)return;paused=true;ui.pauseScreen.classList.add('visible');if(document.pointerLockElement)document.exitPointerLock();}
function resumeGame(){paused=false;ui.pauseScreen.classList.remove('visible');if(!isTouchDevice())$('world').requestPointerLock?.();}
function restart(){location.reload();}
function startGame(){ui.startScreen.classList.remove('visible');running=true;initAudio();if(!isTouchDevice())$('world').requestPointerLock?.();showMessage('ENCONTRE SUPRIMENTOS · WASD PARA MOVER');}
function chooseSlot(n){document.querySelectorAll('.quick-slot').forEach((el,i)=>el.classList.toggle('active',i===n));if(n>0)useSlot(n);}
$('startBtn').addEventListener('click',startGame);$('pauseBtn').addEventListener('click',pauseGame);$('resumeBtn').addEventListener('click',resumeGame);$('restartBtn').addEventListener('click',restart);$('againBtn').addEventListener('click',restart);$('closeInventory').addEventListener('click',()=>toggleInventory(false));$('reloadBtn').addEventListener('click',reload);
$('inventoryBtn').addEventListener('click',()=>toggleInventory());
$('soundBtn').addEventListener('click',e=>{initAudio();audioOn=!audioOn;if(audioBus)audioBus.gain.value=audioOn ? .18 : 0;e.currentTarget.classList.toggle('muted',!audioOn);showMessage(audioOn?'ÁUDIO AMBIENTE ATIVADO':'ÁUDIO DESATIVADO');});
document.querySelectorAll('.quick-slot').forEach((el,i)=>el.addEventListener('click',()=>chooseSlot(i)));
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'){if(inventoryOpen)toggleInventory(false);else if(paused)resumeGame();else pauseGame();}
 if(e.code==='KeyE')search();if(e.code==='KeyR')reload();if(e.code==='KeyI'||e.code==='Tab'){e.preventDefault();toggleInventory();}if(e.code==='KeyF'){player.flashlight=!player.flashlight;flash.intensity=player.flashlight?3.5:0;showMessage(player.flashlight?'LANTERNA LIGADA':'LANTERNA DESLIGADA');}
 if(e.code==='Digit1')chooseSlot(0);if(e.code==='Digit2')chooseSlot(1);if(e.code==='Digit3')chooseSlot(2);if(e.code==='Digit4')chooseSlot(3);
});window.addEventListener('keyup',e=>keys[e.code]=false);
const flash=new THREE.SpotLight(0xffe6bc,0,24,Math.PI/7,.4,1.5);flash.position.set(0,0,0);camera.add(flash);camera.add(flash.target);flash.target.position.set(0,0,-1);
$('world').addEventListener('click',()=>{if(running&&!paused&&!inventoryOpen&&!isTouchDevice()&&!document.pointerLockElement)$('world').requestPointerLock?.();});
document.addEventListener('pointerlockchange',()=>{});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===$('world')&&running&&!paused){player.yaw-=e.movementX*.0022;player.pitch=clamp(player.pitch-e.movementY*.0018,-1.15,1.15);}});
$('world').addEventListener('pointerdown',e=>{if(!isTouchDevice()||!running||paused||inventoryOpen)return;touchLook={x:e.clientX,y:e.clientY,id:e.pointerId};$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{if(touchLook&&e.pointerId===touchLook.id){const dx=e.clientX-touchLook.x,dy=e.clientY-touchLook.y;touchLook.x=e.clientX;touchLook.y=e.clientY;player.yaw-=dx*.006;player.pitch=clamp(player.pitch-dy*.004,-1.15,1.15);}});
$('world').addEventListener('pointerup',e=>{if(touchLook&&e.pointerId===touchLook.id)touchLook=null;});
$('world').addEventListener('contextmenu',e=>e.preventDefault());$('world').addEventListener('mousedown',e=>{if(e.button===0)shoot();});
const stick=$('stick'),knob=stick.querySelector('.stick-knob');stick.addEventListener('pointerdown',e=>{e.preventDefault();stick.setPointerCapture(e.pointerId);joystick={id:e.pointerId,cx:stick.getBoundingClientRect().left+56,cy:stick.getBoundingClientRect().top+56};moveJoystick(e);});
function moveJoystick(e){if(!joystick||e.pointerId!==joystick.id)return;const dx=e.clientX-joystick.cx,dy=e.clientY-joystick.cy,len=Math.max(1,Math.hypot(dx,dy)),mag=Math.min(36,len);moveX=dx/len*mag/36;moveY=dy/len*mag/36;knob.style.transform=`translate(${dx/len*mag}px,${dy/len*mag}px)`;}
stick.addEventListener('pointermove',moveJoystick);function stopJoystick(e){if(joystick&&e.pointerId===joystick.id){joystick=null;moveX=moveY=0;knob.style.transform='';}}stick.addEventListener('pointerup',stopJoystick);stick.addEventListener('pointercancel',stopJoystick);
$('mobileRun').addEventListener('pointerdown',e=>{e.preventDefault();runHeld=true;});$('mobileRun').addEventListener('pointerup',()=>runHeld=false);$('mobileRun').addEventListener('pointercancel',()=>runHeld=false);
$('mobileUse').addEventListener('pointerdown',e=>{e.preventDefault();search();});$('mobileFire').addEventListener('pointerdown',e=>{e.preventDefault();shoot();});
let prev=performance.now();
function update(dt){if(!running||paused||gameEnded)return;elapsed+=dt;shotCooldown=Math.max(0,shotCooldown-dt);attackCooldown=Math.max(0,attackCooldown-dt);if(toastTimer>0){toastTimer-=dt*1000;if(toastTimer<=0)ui.message.classList.remove('show');}
 if(reloadTimer>0){reloadTimer-=dt;if(reloadTimer<=0){const n=Math.min(2-player.ammo,player.reserve);player.ammo+=n;player.reserve-=n;showMessage('ESCOPETA RECARREGADA');}}
 const fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-moveY;
 const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+moveX;
 const moving=Math.abs(fwd)+Math.abs(side)>.05, sprint=(keys.ShiftLeft||keys.ShiftRight||runHeld)&&player.stamina>1&&moving;
 const speed=sprint?6.2:3.55;if(sprint)player.stamina=Math.max(0,player.stamina-22*dt);else player.stamina=Math.min(100,player.stamina+13*dt);
 if(moving){const forwardX=-Math.sin(player.yaw),forwardZ=-Math.cos(player.yaw),rightX=Math.cos(player.yaw),rightZ=-Math.sin(player.yaw),len=Math.hypot(fwd,side)||1;const dx=(forwardX*fwd+rightX*side)/len*speed*dt,dz=(forwardZ*fwd+rightZ*side)/len*speed*dt;
 const blocked=(x,z)=>obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.32);const nx=clamp(player.pos.x+dx,-6.35,6.35),nz=clamp(player.pos.z+dz,-78,43);if(!blocked(nx,player.pos.z))player.pos.x=nx;if(!blocked(player.pos.x,nz))player.pos.z=nz;}
 camera.position.copy(player.pos);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
 // Survival needs slowly decline; sprinting and injuries increase the drain.
 player.hunger=Math.max(0,player.hunger-dt*(.105+(sprint ? .055 : 0)));player.thirst=Math.max(0,player.thirst-dt*(.16+(sprint ? .09 : 0)));
 if(player.hunger<=0||player.thirst<=0){player.health=Math.max(0,player.health-dt*1.6);if(player.health===0){finish(false);return;}}
 zombies.forEach(z=>{if(!z.alive)return;z.attack=Math.max(0,z.attack-dt);const dx=player.pos.x-z.group.position.x,dz=player.pos.z-z.group.position.z,d=Math.hypot(dx,dz);z.roam+=dt;if(d<12){if(d>1.25){const speedZ=z.speed*(d<8?1.18:1);z.group.position.x+=dx/d*speedZ*dt;z.group.position.z+=dz/d*speedZ*dt;z.group.rotation.y=Math.atan2(-dx,-dz);z.limbs[0].rotation.z=Math.sin(elapsed*8+z.roam)*.35-.35;z.limbs[2].rotation.z=Math.sin(elapsed*8+z.roam+Math.PI)*.35+.35;}else if(z.attack<=0){z.attack=1.25;damage(7+Math.random()*5);}}else{z.group.position.x+=Math.sin(z.roam*.35)*dt*.12;}});
 loot.forEach(l=>{if(!l.searched)l.group.rotation.y+=dt*.15;});
 const rainPos=rainGeometry.attributes.position;for(let i=0;i<rainCount;i++){let y=rainPos.getY(i)-dt*11;if(y<0)y=16;rainPos.setY(i,y);}rainPos.needsUpdate=true;rain.position.x=player.pos.x;rain.position.z=player.pos.z;
 beacon.rotation?.set(0,elapsed*.3,0);updateInteraction();updateUI();
}
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-prev)/1000);prev=now;update(dt);renderer.render(scene,camera);}
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);});
setObjective();updateInventory();updateUI();
