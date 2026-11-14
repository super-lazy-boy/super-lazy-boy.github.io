import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import * as THREE from 'three';
import {MeshBVH,acceleratedRaycast} from 'three-mesh-bvh';
import {createModelIO} from './model-io.mjs';
import {modelFidelity,hashBytes} from './model-fidelity.mjs';
import {copyRaycastGeometry,buildRoomBoundsTree} from '../lib/room-raycast-geometry.ts';
import {ROOM_VIEWS} from '../lib/room-navigation.ts';
import {COLLECTIBLE_PLACEMENTS,NEW_COLLECTIBLE_IDS} from '../lib/collectibles.ts';

const io=createModelIO(),manifest=JSON.parse(await readFile('design/model-compression.json','utf8'));
const scene=new THREE.Scene(),meshes=[],documents=[];
for(const item of manifest.models){
  const bytes=await readFile(item.file),document=await io.readBinary(bytes);documents.push({item,document,bytes});
  const id=item.file.includes('sunlit-room')?'room':item.file.split('/').at(-1).replace('.glb',''),group=new THREE.Group();
  document.getRoot().listScenes()[0].traverse(node=>{
    for(const primitive of node.getMesh()?.listPrimitives()||[]){
      const geometry=new THREE.BufferGeometry();
      for(const [semantic,name] of Object.entries({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})){
        const a=primitive.getAttribute(semantic);if(a)geometry.setAttribute(name,new THREE.BufferAttribute(a.getArray(),a.getElementSize(),a.getNormalized()));
      }
      if(primitive.getIndices())geometry.setIndex(new THREE.BufferAttribute(primitive.getIndices().getArray(),1));
      const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:primitive.getMaterial()?.getDoubleSided()?THREE.DoubleSide:THREE.FrontSide}));
      mesh.matrix.fromArray(node.getWorldMatrix());mesh.matrixAutoUpdate=false;mesh.name=id+':'+node.getName();group.add(mesh);meshes.push(mesh);
    }
  });
  if(id!=='room'){const p=COLLECTIBLE_PLACEMENTS[id];group.position.fromArray(p.position);group.rotation.y=p.yaw;group.scale.setScalar(p.scale);}
  scene.add(group);
}
scene.updateMatrixWorld(true);

test('compressed models retain the approved geometry, texture pixels, materials and layouts',async()=>{
  let before=0,after=0,triangles=0;
  for(const {item,document,bytes} of documents){
    assert.equal(hashBytes(bytes),item.afterSha256);assert.equal(bytes.length,item.afterBytes);
    const fidelity=await modelFidelity(io,document,item.fidelityVersion??1);
    for(const key of ['geometrySha256','appearanceSha256','triangles','primitives','images'])assert.equal(fidelity[key],item[key],item.file+' '+key);
    before+=item.beforeBytes;after+=bytes.length;triangles+=fidelity.triangles;
  }
  assert.deepEqual(manifest.models.map(item=>item.file).sort(),['public/models/sunlit-room/room.glb',...NEW_COLLECTIBLE_IDS.map(id=>'public/models/collectibles/'+id+'.glb')].sort());
  assert.equal(triangles,manifest.models.reduce((sum,item)=>sum+item.triangles,0));assert.ok(triangles>821579);assert.ok(after<before*.70);
});

test('off-thread picking preserves every original vertex buffer and nearest visible hit',()=>{
  const rays=[];
  for(const [zone,view] of Object.entries(ROOM_VIEWS)){
    const fov=zone==='office'?43:zone==='books'?50:zone==='cinema'?42:38,camera=new THREE.PerspectiveCamera(fov,16/9,.08,100);
    camera.position.fromArray(view.camera);camera.lookAt(new THREE.Vector3(...view.target));camera.updateMatrixWorld();
    for(let row=0;row<7;row++)for(let col=0;col<9;col++){
      const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((col-4+.137)/5,(row-3+.093)/4),camera);
      rays.push({ray,expected:ray.intersectObjects(scene.children,true)[0]});
    }
  }
  const original=meshes.map(mesh=>({mesh,position:hashBytes(Buffer.from(mesh.geometry.attributes.position.array.buffer)),index:hashBytes(Buffer.from(mesh.geometry.index.array.buffer))}));
  for(const {mesh} of original){
    if(mesh.geometry.attributes.position.count<128)continue;
    const payload=copyRaycastGeometry(mesh.geometry),transfer=[payload.positions.buffer];if(payload.index)transfer.push(payload.index.buffer);
    const moved=structuredClone(payload,{transfer});assert.equal(payload.positions.byteLength,0);
    mesh.geometry.boundsTree=MeshBVH.deserialize(buildRoomBoundsTree(moved),mesh.geometry,{setIndex:false});mesh.raycast=acceleratedRaycast;
  }
  for(const {mesh,position,index} of original){assert.equal(hashBytes(Buffer.from(mesh.geometry.attributes.position.array.buffer)),position);assert.equal(hashBytes(Buffer.from(mesh.geometry.index.array.buffer)),index);}
  let hits=0;
  for(const {ray,expected} of rays){
    ray.firstHitOnly=true;const actual=ray.intersectObjects(scene.children,true)[0];
    assert.equal(!!actual,!!expected);if(!expected)continue;hits++;
    assert.equal(actual.object,expected.object);assert.ok(Math.abs(actual.distance-expected.distance)<.00001);
    assert.ok(actual.point.distanceTo(expected.point)<.00001);
    if(expected.uv)assert.ok(actual.uv.distanceTo(expected.uv)<.00001);
  }
  assert.ok(hits>80);
});

test('the actual worker handles normalized interleaved positions without detaching displayed buffers',async()=>{
  const geometry=new THREE.BoxGeometry(2,2,2,5,5,5),source=geometry.attributes.position,packed=new Int16Array(source.count*5);
  for(let i=0;i<source.count;i++){packed[i*5]=Math.round(source.getX(i)*32767);packed[i*5+1]=Math.round(source.getY(i)*32767);packed[i*5+2]=Math.round(source.getZ(i)*32767);}
  geometry.setAttribute('position',new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(packed,5),3,0,true));
  const original=hashBytes(new Uint8Array(packed.buffer)),payload=copyRaycastGeometry(geometry),workerURL=new URL('../lib/room-raycast.worker.ts',import.meta.url).href;
  const bridge=`import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:(data,transfer)=>parentPort.postMessage(data,transfer)};await import(${JSON.stringify(workerURL)});parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({ready:true});`;
  const worker=new Worker(new URL('data:text/javascript,'+encodeURIComponent(bridge)));
  try{
    const result=await new Promise((resolve,reject)=>{
      worker.on('error',reject);worker.on('message',message=>{
        if(message.ready)worker.postMessage(payload,[payload.positions.buffer,payload.index.buffer]);
        else if(message.error)reject(new Error(message.error));else resolve(message.serialized);
      });
    });
    assert.equal(payload.positions.byteLength,0);assert.equal(hashBytes(new Uint8Array(packed.buffer)),original);
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()),ray=new THREE.Raycaster(new THREE.Vector3(.23,.17,4),new THREE.Vector3(0,0,-1));mesh.updateMatrixWorld();
    const baseline=ray.intersectObject(mesh)[0];geometry.boundsTree=MeshBVH.deserialize(result,geometry,{setIndex:false});mesh.raycast=acceleratedRaycast;ray.firstHitOnly=true;
    const accelerated=ray.intersectObject(mesh)[0];assert.ok(accelerated.point.distanceTo(baseline.point)<1e-6);assert.ok(accelerated.uv.distanceTo(baseline.uv)<1e-6);
  }finally{await worker.terminate();}
});
