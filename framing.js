import * as THREE from 'three';

// Frame the main concentration of visible splats. Outliers remain in the scene.
export function mainSplatBounds(mesh){
 const xs=[],ys=[],zs=[];
 const stride=Math.max(1,Math.ceil((mesh.numSplats||0)/12000));
 mesh.forEachSplat((index,center,scales,rotation,opacity)=>{
  if(index%stride||opacity<.02||![center.x,center.y,center.z].every(Number.isFinite))return;
  xs.push(center.x);ys.push(center.y);zs.push(center.z);
 });
 if(!xs.length)throw Error('No visible finite splats were found in this export.');
 for(const values of [xs,ys,zs])values.sort((a,b)=>a-b);
 const lo=xs.length>=50?.02:0,hi=1-lo;
 const at=(values,q)=>values[Math.min(values.length-1,Math.floor((values.length-1)*q))];
 return new THREE.Box3(new THREE.Vector3(at(xs,lo),at(ys,lo),at(zs,lo)),new THREE.Vector3(at(xs,hi),at(ys,hi),at(zs,hi)));
}

export function recenterSplat(mesh,bounds){
 const localCenter=bounds.getCenter(new THREE.Vector3());
 // Keep viewing coordinates close to zero; the source file stays unchanged.
 const offset=localCenter.clone().multiply(mesh.scale).applyQuaternion(mesh.quaternion);
 mesh.position.copy(offset.negate());mesh.updateMatrixWorld(true);
 return bounds.clone().applyMatrix4(mesh.matrixWorld);
}
