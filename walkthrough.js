import * as THREE from 'three';

export function turnCamera(camera,dx,dy){
 const angles=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');
 // Requested drag convention: drag right -> look left. Keep the horizon level.
 angles.y+=dx*.0025;
 angles.x=THREE.MathUtils.clamp(angles.x-dy*.0025,-Math.PI*85/180,Math.PI*85/180);
 angles.z=0;camera.quaternion.setFromEuler(angles);
}

export function horizontalForward(camera){
 const yaw=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ').y;
 return new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
}

export function quarterTurnAroundView(camera,clockwise=false){
 const axis=camera.getWorldDirection(new THREE.Vector3()).normalize();
 return new THREE.Quaternion().setFromAxisAngle(axis,clockwise?Math.PI/2:-Math.PI/2);
}

export function insideView(bounds,saved){
 if(saved&&['position','target'].every(k=>Array.isArray(saved[k])&&saved[k].length===3&&saved[k].every(Number.isFinite))){
  return {position:[...saved.position],target:[...saved.target]};
 }
 const center=bounds.getCenter(new THREE.Vector3());
 return {position:center.toArray(),target:center.clone().add(new THREE.Vector3(0,0,-1)).toArray()};
}

export class WalkLook extends THREE.EventDispatcher{
 constructor(camera,canvas){
  super();this.camera=camera;this.canvas=canvas;this.isLocked=false;
  this.change=()=>{const next=document.pointerLockElement===canvas;if(next!==this.isLocked){this.isLocked=next;this.dispatchEvent({type:next?'lock':'unlock'});}};
  this.move=e=>{if(this.isLocked)this.rotate(e.movementX,e.movementY);};
  document.addEventListener('pointerlockchange',this.change);document.addEventListener('mousemove',this.move);
 }
 rotate(dx,dy){turnCamera(this.camera,dx,dy);}
 sync(){turnCamera(this.camera,0,0);}
 async lock(){if(!this.canvas.requestPointerLock)throw Error('Mouse capture unavailable');await this.canvas.requestPointerLock();}
 unlock(){if(document.pointerLockElement===this.canvas)document.exitPointerLock();}
 dispose(){this.unlock();document.removeEventListener('pointerlockchange',this.change);document.removeEventListener('mousemove',this.move);}
}
