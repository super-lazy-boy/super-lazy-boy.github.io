import * as THREE from 'three';

function geometryKey(g:THREE.BufferGeometry){
 let h=2166136261;
 for(const name of Object.keys(g.attributes).sort()){
  const a=g.attributes[name].array;
  const bytes=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);
  for(const b of bytes)h=Math.imul(h^b,16777619);
 }
 if(g.index)for(const n of g.index.array)h=Math.imul(h^n,16777619);
 return g.attributes.position.count+':'+(g.index?.count||0)+':'+(h>>>0);
}
function sameGeometry(a:THREE.BufferGeometry,b:THREE.BufferGeometry){
 const names=Object.keys(a.attributes).sort();if(names.join()!=Object.keys(b.attributes).sort().join())return false;
 for(const name of names){const x=a.attributes[name].array,y=b.attributes[name].array;if(x.length!==y.length)return false;for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;}
 const x=a.index?.array,y=b.index?.array;if(Boolean(x)!==Boolean(y))return false;if(x&&y){if(x.length!==y.length)return false;for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;}return true;
}
export function optimizeRepeatedParts(root:THREE.Group){
 const rt=root.userData.sculptRuntime,buckets=new Map<string,THREE.Mesh[]>();
 let triangles=0;root.traverse((o:any)=>{if(!o.isMesh||!o.visible)return;triangles+=o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3;const m=o as THREE.Mesh;if(Array.isArray(m.material))return;const key=m.material.uuid+':'+geometryKey(m.geometry);const list=buckets.get(key)||[];if(list.length&&!sameGeometry(list[0].geometry,m.geometry))throw Error('Geometry digest collision');list.push(m);buckets.set(key,list);});
 const batches:{pool:THREE.InstancedMesh,sources:THREE.Mesh[]}[]=[];
 for(const sources of buckets.values()){
  if(sources.length<2)continue;
  const first=sources[0],pool=new THREE.InstancedMesh(first.geometry,first.material,sources.length);pool.name='render-batch-'+batches.length;pool.userData.instancePartIds=sources.map(m=>m.userData.componentId);pool.userData.renderBatch=true;pool.castShadow=true;pool.receiveShadow=true;pool.frustumCulled=false;pool.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(pool);
  for(let i=0;i<sources.length;i++){const m=sources[i];m.visible=false;m.castShadow=false;m.userData.instancedProxy=true;m.userData.instanceIndex=i;m.userData.renderBatch=pool.name;}
  batches.push({pool,sources});
 }
 const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4(),hidden=new THREE.Matrix4().makeScale(0,0,0);
 rt.syncInstances=()=>{root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert();for(const {pool,sources}of batches){sources.forEach((m,i)=>{let active=true;for(let p=m.parent;p;p=p.parent){if(!p.visible){active=false;break;}}matrix.multiplyMatrices(inverse,m.matrixWorld);pool.setMatrixAt(i,active?matrix:hidden);});pool.instanceMatrix.needsUpdate=true;}};
 rt.syncInstances();root.userData.optimization={sourceTriangles:triangles,batchCount:batches.length,instancedPartCount:batches.reduce((n,b)=>n+b.sources.length,0),semanticNodesRetained:true};
}
