import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {ModelResourceCache,downloadModel,roomLoadingPercent} from '../lib/model-resource-cache.ts';
import {applicationVersion} from './application-version.mjs';

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('published release identity includes the current application code as well as model bytes',async()=>{
  const room=JSON.parse(await readFile('public/room-version.json','utf8')),collectibles=JSON.parse(await readFile('public/collectibles-version.json','utf8'));
  const appSha256=await applicationVersion(new URL('../',import.meta.url));assert.equal(room.appSha256,appSha256);
  const expected=createHash('sha256').update(room.modelSha256).update(JSON.stringify(collectibles)).update(appSha256).digest('hex');
  assert.equal(room.id,'sunlit-'+expected.slice(0,12));
  const previous=createHash('sha256').update(room.modelSha256).update(JSON.stringify(collectibles)).digest('hex');
  assert.notEqual(room.id,'sunlit-'+previous.slice(0,12),'a code-only fix cannot reuse the old model-only release URL');
});

test('legacy global progress reaches 100 then restarts for newly discovered resources',async()=>{
  const manager=THREE.DefaultLoadingManager,previous={onStart:manager.onStart,onProgress:manager.onProgress,onLoad:manager.onLoad,onError:manager.onError};
  try{
    const {useProgress}=await import('@react-three/drei/core/Progress.js');
    manager.itemStart('room.glb');manager.itemEnd('room.glb');assert.equal(useProgress.getState().progress,100);
    manager.itemStart('embedded-room-texture');assert.equal(useProgress.getState().progress,0);
    manager.itemEnd('embedded-room-texture');assert.equal(useProgress.getState().progress,100);
  }finally{Object.assign(manager,previous);}
});

test('a versioned URL has one stable promise and retains its decoded model across scene remounts',async()=>{
  const pending=deferred();let loads=0;
  const cache=new ModelResourceCache(async()=>{loads++;return pending.promise;});
  const promise=cache.preload('room?v=one');assert.equal(cache.preload('room?v=one'),promise);
  assert.throws(()=>cache.read('room?v=one'),value=>value===promise);await tick();assert.equal(loads,1);
  const model={scene:'full detail'};pending.resolve(model);await promise;
  assert.equal(cache.read('room?v=one'),model);cache.retryFailures();assert.equal(cache.read('room?v=one'),model);assert.equal(loads,1);
});

test('100% downloaded remains below completion while decoding and awaiting the first real frame',async()=>{
  const decoding=deferred();let controls;
  const cache=new ModelResourceCache(async(_,ctx)=>{controls=ctx;ctx.download(1024,1024);await tick();ctx.decoding();return decoding.promise;});
  const pending=cache.preload('room');await tick();assert.equal(roomLoadingPercent(cache.snapshot('room')),90);
  await tick();assert.equal(cache.snapshot('room').phase,'decoding');assert.equal(roomLoadingPercent(cache.snapshot('room')),92);
  decoding.resolve({});await pending;assert.equal(roomLoadingPercent(cache.snapshot('room')),96);assert.equal(controls.signal.aborted,false);
});

test('stalled downloads and decodes fail once, abort, and retry without discarding good assets',async()=>{
  let attempt=0,signal;
  const cache=new ModelResourceCache(async(url,ctx)=>{if(url==='good')return 'kept';signal=ctx.signal;attempt=ctx.attempt;if(attempt===0){ctx.decoding();return new Promise(()=>{});}return 'recovered';},25);
  await cache.preload('good');await assert.rejects(cache.preload('bad'),/timed out/);assert.equal(signal.aborted,true);
  assert.throws(()=>cache.read('bad'),/timed out/);cache.retryFailures();assert.equal(cache.read('good'),'kept');
  assert.equal(await cache.preload('bad'),'recovered');assert.equal(attempt,1);
});

test('truncated files, HTML fallback pages, and HTTP failures cannot masquerade as loaded models',async()=>{
  const context={signal:new AbortController().signal,attempt:0,download(){},decoding(){}};
  await assert.rejects(downloadModel(new Response('<html>missing</html>',{headers:{'content-type':'text/html'}}),context),/HTML/);
  await assert.rejects(downloadModel(new Response(null,{status:404}),context),/404/);
  const bytes=new Uint8Array(16),header=new DataView(bytes.buffer);header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,20,true);
  await assert.rejects(downloadModel(new Response(bytes),context),/incomplete/);
});

test('streamed progress counts actual bytes and preserves the original GLB buffer',async()=>{
  const bytes=await readFile('public/models/collectibles/anduril.glb'),updates=[];
  const context={signal:new AbortController().signal,attempt:0,download:(loaded,total)=>updates.push([loaded,total]),decoding(){}};
  const stream=new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=32768)controller.enqueue(new Uint8Array(bytes.subarray(i,i+32768)));controller.close();}});
  const actual=await downloadModel(new Response(stream),context,bytes.length);
  assert.equal(createHash('sha256').update(new Uint8Array(actual)).digest('hex'),createHash('sha256').update(bytes).digest('hex'));
  assert.deepEqual(updates.at(-1),[bytes.length,bytes.length]);assert.ok(updates.every((p,i)=>!i||p[0]>updates[i-1][0]));
});

test('the actual Three GLTF loader decodes all unchanged compressed assets and embedded texture dimensions',async()=>{
  // CPU parser test only: bitmap stand-ins retain PNG dimensions, without a browser or GPU.
  const previous={self:globalThis.self,createImageBitmap:globalThis.createImageBitmap};
  globalThis.self=globalThis;
  let decoded=0;
  globalThis.createImageBitmap=async blob=>{
    const bytes=new DataView(await blob.arrayBuffer());decoded++;
    if(bytes.getUint32(0)===0x89504e47)return {width:bytes.getUint32(16),height:bytes.getUint32(20),close(){}};
    assert.equal(bytes.getUint16(0),0xffd8,'embedded image is PNG or JPEG');
    for(let offset=2;offset<bytes.byteLength-8;){
      assert.equal(bytes.getUint8(offset++),0xff);while(bytes.getUint8(offset)===0xff)offset++;
      const marker=bytes.getUint8(offset++),length=bytes.getUint16(offset);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {width:bytes.getUint16(offset+5),height:bytes.getUint16(offset+3),close(){}};
      offset+=length;
    }
    throw new Error('JPEG dimensions missing');
  };
  try{
    const {GLTFLoader,MeshoptDecoder}=await import('three-stdlib'),decoder=MeshoptDecoder();
    const manifest=JSON.parse(await readFile('design/model-compression.json','utf8'));
    for(const info of manifest.models){
      const bytes=await readFile(info.file),manager=new THREE.LoadingManager(),loader=new GLTFLoader(manager),errors=[];manager.onError=url=>errors.push(url);loader.setMeshoptDecoder(decoder);decoded=0;
      const model=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'https://example.invalid/');
      let triangles=0,primitives=0;model.scene.traverse(o=>{if(!o.isMesh)return;primitives++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
        for(const mat of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(mat))if(value?.isTexture){assert.ok(value.image?.width>0&&value.image?.height>0,'embedded image decoded');}
      });
      assert.equal(triangles,info.triangles,info.file);assert.equal(primitives,info.primitives,info.file);
      assert.deepEqual(errors,[],'no hidden texture failures');assert.equal(decoded,info.images,'every original embedded image reaches the decoder');
    }
  }finally{if(previous.self===undefined)delete globalThis.self;else globalThis.self=previous.self;if(previous.createImageBitmap===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=previous.createImageBitmap;}
});

test('cached TARDIS pixels retain every approved texel while textures remain independently disposable',async()=>{
  const load=THREE.TextureLoader.prototype.load;THREE.TextureLoader.prototype.load=function(){return new THREE.Texture();};
  try{
    const {woodMaterial,frostedMaterial}=await import('../components/room/models/tardis/TardisMaterials.ts');
    const wood=woodMaterial(),dark=woodMaterial(true),glass=frostedMaterial(),beacon=frostedMaterial(true);
    const expected={map:'3563908b2138e247a8d0573da3cb939f6ecaeef858d36b202bacdc097471b3d9',normalMap:'359ad9b43d0d989d84b11f1a02e4b9bc2baa9b3d43e647d6ca4d8c6892d8b5cd',aoMap:'54bfaa7a9e7c238056108b565631f13836c9b85aa05826aa0e00a3c549c7d399'};
    for(const [key,hash] of Object.entries(expected)){
      assert.equal(createHash('sha256').update(wood[key].image.data).digest('hex'),hash);assert.equal(wood[key].image.data,dark[key].image.data);assert.notEqual(wood[key],dark[key]);
      assert.equal(wood[key].image.width,1024);assert.equal(wood[key].image.height,1024);
    }
    assert.equal(createHash('sha256').update(glass.normalMap.image.data).digest('hex'),'f5d56d50c1bc684c868d6e2d7805520580550d7a212468e298db2b41efcd48b5');
    assert.equal(createHash('sha256').update(glass.roughnessMap.image.data).digest('hex'),'5fd2598008b3d25836da348b5428ff781b7daadde5c48701491726c2601e0761');
    assert.equal(glass.normalMap.image.data,beacon.normalMap.image.data);assert.notEqual(glass.normalMap,beacon.normalMap);
  }finally{THREE.TextureLoader.prototype.load=load;}
});
