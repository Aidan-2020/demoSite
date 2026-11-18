import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {WalkLook,horizontalForward,insideView,quarterTurnAroundView} from './walkthrough.js';
import {getRoomScene} from './cloud.js';
import {loadBedroomAsset} from './room-asset.js';
import {mainSplatBounds,recenterSplat} from './framing.js';
const $=id=>document.getElementById(id);
let currentId="aidans-room";
let spark,sceneBounds,homeView;
let renderer,scene,camera,orbit,look,model,meta,observer,frame,lastTime,mode='explore',active=false,ready=false,disposed=false,controller;
const keys=new Set(),touchKeys=new Set();const forward=new THREE.Vector3(),right=new THREE.Vector3();let drag=null,returnFocus;
function message(text,error=false){$('roomStatus').textContent=text;$('roomStatus').classList.toggle('error',error);}
function decode(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
function setMode(next){if(!ready)return;mode=next;look.unlock();orbit.enabled=next==='orbit';$('exploreMode').classList.toggle('selected',next==='explore');$('orbitMode').classList.toggle('selected',next==='orbit');$('roomLook').hidden=next!=='explore';$('roomTouch').hidden=next!=='explore';$('roomHelp').textContent=next==='explore'?'Drag right to look left; drag down to look down. WASD / arrows move; Q / E moves down / up. Look around captures the mouse; Esc releases it.':'Drag to orbit · right-drag to pan · scroll to zoom';if(next==='orbit'){const center=sceneBounds?sceneBounds.getCenter(new THREE.Vector3()):new THREE.Vector3().fromArray(meta.target);if(camera.position.distanceTo(center)<.01){const span=sceneBounds?Math.max(sceneBounds.getSize(new THREE.Vector3()).length(),1):5;camera.position.copy(center).add(new THREE.Vector3(span*.7,span*.3,span*.7));}orbit.target.copy(center);orbit.update();}else{look.sync();renderer.domElement.focus({preventScroll:true});}keys.clear();touchKeys.clear();}
function reset(){if(!ready)return;look.unlock();const view=homeView||{position:meta.position,target:meta.target};camera.position.fromArray(view.position);camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3().fromArray(view.target));orbit.target.fromArray(view.target);look.sync();setMode('explore');renderer.domElement.focus({preventScroll:true});keys.clear();touchKeys.clear();message((meta?.format==='ply'?'Gaussian splats':'Mesh preview')+' · free movement, no wall collisions');}
function resize(){if(!renderer||!active)return;const stage=$('roomStage'),w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
function animate(now){if(!active)return;frame=requestAnimationFrame(animate);const dt=Math.min((now-lastTime)/1000,.1)||0;lastTime=now;if(ready&&mode==='explore'){
 const has=key=>keys.has(key)||touchKeys.has(key);const speed=Number($('roomSpeed').value)*(keys.has('ShiftLeft')?3:1)*dt;forward.copy(horizontalForward(camera));right.crossVectors(forward,camera.up).normalize();const move=new THREE.Vector3();if(has('KeyW')||has('ArrowUp'))move.add(forward);if(has('KeyS')||has('ArrowDown'))move.sub(forward);if(has('KeyD')||has('ArrowRight'))move.add(right);if(has('KeyA')||has('ArrowLeft'))move.sub(right);if(has('KeyE'))move.y+=1;if(has('KeyQ'))move.y-=1;if(move.lengthSq()>0)camera.position.addScaledVector(move.normalize(),speed);
 }if(orbit?.enabled)orbit.update();renderer.render(scene,camera);}
function keydown(e){if(!active||!ready||mode!=='explore'||(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable))return;if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'].includes(e.code)){e.preventDefault();keys.add(e.code);}}
function keyup(e){keys.delete(e.code);}
function pause(){keys.clear();touchKeys.clear();}
function pointerdown(e){if(!ready||mode!=='explore'||look.isLocked||e.button!==0)return;renderer.domElement.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}
function pointermove(e){if(!drag||mode!=='explore'||look.isLocked)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};look.rotate(dx,dy);}
function pointerup(){drag=null;}
function startRenderer(){const stage=$('roomStage');scene=new THREE.Scene();scene.background=new THREE.Color('#111b20');scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(3,8,5);scene.add(sun);camera=new THREE.PerspectiveCamera(70,1,.02,1000);renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive 3D twin');renderer.domElement.addEventListener('webglcontextlost',()=>message('Graphics context lost. Close other GPU-heavy tabs, then reload this viewer.',true));stage.appendChild(renderer.domElement);orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=false;orbit.enabled=false;look=new WalkLook(camera,renderer.domElement);look.addEventListener('lock',()=>{drag=null;$('roomLook').textContent='Mouse captured · Esc to release';renderer.domElement.focus();});look.addEventListener('unlock',()=>{$('roomLook').textContent='Look around';pause();});renderer.domElement.addEventListener('pointerdown',pointerdown);renderer.domElement.addEventListener('pointermove',pointermove);renderer.domElement.addEventListener('pointerup',pointerup);renderer.domElement.addEventListener('pointercancel',pointerup);observer=new ResizeObserver(resize);observer.observe(stage);resize();}
function loading(text){message(text);$('roomLoadingText').textContent=text;}
function frameBounds(bounds,force=false){
 if(force){delete meta.position;delete meta.target;}
 if(bounds.isEmpty()||![...bounds.min,...bounds.max].every(Number.isFinite))throw Error('The scene has no finite bounds.');
 const size=bounds.getSize(new THREE.Vector3());
 if(!meta.position){const center=bounds.getCenter(new THREE.Vector3()),radius=Math.max(size.length(),1);meta.target=center.toArray();meta.position=center.clone().add(new THREE.Vector3(radius*.7,radius*.3,radius*.7)).toArray();}
 camera.near=Math.max(.001,size.length()/100000);camera.far=Math.max(100,size.length()*20);camera.updateProjectionMatrix();orbit.maxDistance=Math.max(size.length()*3,10);
}
function progress(event){if(!active||!event.loaded)return;const mb=(event.loaded/1048576).toFixed(1);loading(event.total?'Loading scene… '+Math.min(100,Math.round(event.loaded/event.total*100))+'% ('+mb+' MB)':'Loading scene… '+mb+' MB');}
async function load(id){
 controller=new AbortController();const signal=controller.signal;
 loading('Checking access to the bedroom…');const access=await getRoomScene();signal.throwIfAborted();
 loading('Loading Gaussian-splat renderer…');const splatModule=await import('./vendor/spark/spark.module.js');signal.throwIfAborted();
 const result=await loadBedroomAsset(access.key,signal,loading);signal.throwIfAborted();meta=result.meta;
 const splat=true,length=meta.downloadBytes;
 const response={body:new Blob([result.bytes]).stream()};
 if(splat){
  const {SparkRenderer,SplatMesh}=splatModule;spark=new SparkRenderer({renderer});scene.add(spark);
  const splats=new SplatMesh({stream:response.body,streamLength:length,fileName:'scene.ply',extSplats:true,lod:false,onProgress:progress});model=splats;
  await splats.initialized;if(signal.aborted){splats.dispose();return;}
  if(Array.isArray(meta.orientation)&&meta.orientation.length===4&&meta.orientation.every(Number.isFinite))splats.quaternion.fromArray(meta.orientation).normalize();else if(meta.flipY)splats.rotation.x=Math.PI;splats.updateMatrixWorld(true);scene.add(splats);
  loading('Finding the main scene…');sceneBounds=recenterSplat(splats,mainSplatBounds(splats));frameBounds(sceneBounds,true);homeView=insideView(sceneBounds,meta.startView);
  ready=true;reset();await spark.update({scene,camera});if(signal.aborted)return;
 }
 $('roomFlip').hidden=!splat;$('roomRollLeft').hidden=!splat;$('roomRollRight').hidden=!splat;$('roomFitMain').hidden=!splat;$('roomFitAll').hidden=!splat;setMode('explore');$('roomLoading').hidden=true;$('roomControls').hidden=false;$('roomQuality').textContent=meta.splats.toLocaleString()+' splats · '+(length/1048576).toFixed(1)+' MB download';$('sceneDialog').querySelector('h2').textContent=meta.name;renderer.domElement.setAttribute('aria-label','Interactive 3D twin');
 loading(splat?'Gaussian splats · free movement, no wall collisions':'Mesh preview · free movement, no wall collisions');
}
function levelWorld(clockwise){
 if(!ready||meta.format!=='ply')return;
 look.unlock();camera.getWorldDirection(forward);const direction=forward.clone(),turn=quarterTurnAroundView(camera,clockwise);
 model.quaternion.premultiply(turn).normalize();
 sceneBounds=recenterSplat(model,mainSplatBounds(model));frameBounds(sceneBounds,true);
 camera.position.applyQuaternion(turn);camera.lookAt(camera.position.clone().add(direction));look.sync();
 homeView={position:camera.position.toArray(),target:camera.position.clone().add(direction).toArray()};
 setMode('explore');message('World turned 90°. Continue exploring or use Start inside.');
}
function showOverview(bounds){
 frameBounds(bounds,true);look.unlock();camera.position.fromArray(meta.position);camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3().fromArray(meta.target));look.sync();setMode('orbit');renderer.domElement.focus({preventScroll:true});
}
export async function openRoom(id="aidans-room"){if(active)return;currentId=id;returnFocus=document.activeElement;disposed=false;active=true;ready=false;sceneBounds=null;homeView=null;$('sceneDialog').querySelector('h2').textContent='Aidan’s room';$('roomLoading').querySelector('h3').textContent='Opening Aidan’s room';$('roomLoadingText').textContent='Loading viewer…';$('sceneDialog').showModal();$('roomLoading').hidden=false;$('roomControls').hidden=true;$('roomRetry').hidden=true;try{startRenderer();lastTime=performance.now();frame=requestAnimationFrame(animate);await load(id);}catch(e){if(!active||controller?.signal.aborted)return;message('Could not open the room: '+e.message,true);$('roomLoadingText').textContent='The room could not load. Check your connection, then retry.';$('roomRetry').hidden=false;}}
function close(){if(!active)return;active=false;ready=false;controller?.abort();cancelAnimationFrame(frame);pause();drag=null;look?.unlock();look?.dispose();orbit?.dispose();observer?.disconnect();if(meta?.format==='ply')model?.dispose();spark?.dispose();spark=null;model?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.dispose();}});renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();model=null;renderer=null;scene=null;camera=null;orbit=null;look=null;meta=null;if(document.fullscreenElement===$('sceneDialog'))document.exitFullscreen().catch(()=>{});$('sceneDialog').close();history.replaceState(null,'',location.pathname+location.search);returnFocus?.focus();}
$('roomFlip').onclick=()=>{if(!ready||meta.format!=='ply')return;model.rotateX(Math.PI);meta.flipY=!meta.flipY;model.updateMatrixWorld(true);delete meta.position;delete meta.target;sceneBounds=recenterSplat(model,mainSplatBounds(model));frameBounds(sceneBounds,true);homeView=insideView(sceneBounds);reset();};$('roomFitMain').onclick=()=>{if(!ready||!sceneBounds)return;showOverview(sceneBounds);};$('roomFitAll').onclick=()=>{if(!ready||meta.format!=='ply')return;showOverview(model.getBoundingBox().applyMatrix4(model.matrixWorld));};$('roomRollLeft').onclick=()=>levelWorld(false);$('roomRollRight').onclick=()=>levelWorld(true);$('roomClose').onclick=close;$('sceneDialog').addEventListener('cancel',e=>{e.preventDefault();close();});$('roomReset').onclick=reset;$('exploreMode').onclick=()=>setMode('explore');$('orbitMode').onclick=()=>setMode('orbit');$('roomLook').onclick=async()=>{if(!ready)return;renderer.domElement.focus();try{await look.lock();}catch{message('Drag on the scene to look around.');}};$('roomRetry').onclick=()=>{close();openRoom(currentId);};
$('roomFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('sceneDialog').requestFullscreen();}catch{message('Fullscreen is unavailable in this browser.');}};
document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);document.addEventListener('pointerlockerror',()=>{if(active)message('Mouse capture is unavailable. Drag on the scene to look around.');});
for(const button of $('roomTouch').querySelectorAll('[data-key]')){button.addEventListener('pointerdown',e=>{e.preventDefault();touchKeys.add(button.dataset.key);button.setPointerCapture(e.pointerId);renderer?.domElement.focus();});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>touchKeys.delete(button.dataset.key));}


