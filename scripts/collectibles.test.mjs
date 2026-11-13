import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH} from 'three-mesh-bvh';
import {COLLECTIBLE_IDS,NEW_COLLECTIBLE_IDS,COLLECTIBLE_NAMES,COLLECTIBLE_PLACEMENTS,isCollectibleId} from '../lib/collectibles.ts';
import {roomBackground} from '../lib/room-theme.ts';

test('day stays white and night becomes an almost-black imagined space',async()=>{
  assert.equal(roomBackground(false),'#ffffff');assert.equal(roomBackground(true),'#030405');
  const layout=JSON.parse(await readFile('public/models/sunlit-room/layout.json','utf8'));
  assert.equal(layout.backgrounds.day,roomBackground(false));assert.equal(layout.backgrounds.night,roomBackground(true));
});
test('one collapsed collection contains all five named, valid items',()=>{
  assert.equal(COLLECTIBLE_IDS.length,5);assert.equal(new Set(COLLECTIBLE_IDS).size,5);
  for(const id of COLLECTIBLE_IDS){assert.equal(isCollectibleId(id),true);assert.ok(COLLECTIBLE_NAMES[id].every(n=>n.length>2));}
  assert.equal(isCollectibleId(''),false);assert.equal(isCollectibleId('cat'),false);
});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),versions=JSON.parse(await readFile('public/collectibles-version.json','utf8'));
for(const id of NEW_COLLECTIBLE_IDS)test(id+' has finite, correctly sized and versioned original geometry',async()=>{
  const file='public/models/collectibles/'+id+'.glb',bytes=await readFile(file),version=versions[id];
  assert.equal(createHash('sha256').update(bytes).digest('hex'),version.sha256);assert.equal(bytes.length,version.bytes);assert.ok(bytes.length<8*1024*1024);
  const doc=await io.read(file),bounds=new THREE.Box3();let vertices=0;
  doc.getRoot().listScenes()[0].traverse(node=>{
    const m=new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for(const p of node.getMesh()?.listPrimitives()||[]){
      const positions=p.getAttribute('POSITION'),v=[];
      for(let i=0;i<positions.getCount();i++){positions.getElement(i,v);assert.ok(v.every(Number.isFinite));bounds.expandByPoint(new THREE.Vector3(...v).applyMatrix4(m));vertices++;}
      for(const attribute of p.listAttributes()){
        for(let i=0;i<attribute.getCount();i++){attribute.getElement(i,v);assert.ok(v.every(Number.isFinite),'finite exported shading and texture coordinates');}
      }
      assert.notEqual(p.getMaterial()?.getExtension('KHR_materials_unlit')?.extensionName,'KHR_materials_unlit');
    }
  });
  assert.ok(vertices>100);const size=bounds.getSize(new THREE.Vector3()).toArray();
  size.forEach((v,i)=>assert.ok(Math.abs(v-version.dimensions[i])<.001,id+' dimension '+i));
  assert.ok(Math.abs(bounds.min.y)<.0001,'grounded origin');assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3()).x)<.001);assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3()).z)<.001);
  assert.ok(version.sourceParts>={ 'monica-apartment':250,'millennium-falcon':1500,'wish-willow':15}[id]);
  assert.equal(COLLECTIBLE_PLACEMENTS[id].scale,1/.45);
});

async function shape(id){
  const doc=await io.read('public/models/collectibles/'+id+'.glb'),parts=[];
  doc.getRoot().listScenes()[0].traverse(node=>{
    const matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for(const p of node.getMesh()?.listPrimitives()||[]){
      const accessor=p.getAttribute('POSITION'),a=new Float32Array(accessor.getCount()*3),v=[];
      for(let i=0;i<accessor.getCount();i++){accessor.getElement(i,v);a.set(v,i*3);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(a,3));
      if(p.getIndices())geometry.setIndex(new THREE.BufferAttribute(p.getIndices().getArray(),1));
      geometry.applyMatrix4(matrix);parts.push(geometry);
    }
  });
  const geometry=mergeGeometries(parts);geometry.computeBoundingBox();
  const tree=new MeshBVH(geometry),size=geometry.boundingBox.getSize(new THREE.Vector3());
  return {size,hit:(x,z)=>tree.raycastFirst(new THREE.Ray(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0)),THREE.DoubleSide)};
}
test('Falcon has tapered narrow tips and a shallow forward slot',async()=>{
  const {size,hit}=await shape('millennium-falcon');
  assert.ok(hit(0,size.z*.25),'the solid central forebody reaches ahead of the saucer');
  assert.equal(hit(0,size.z*.44),null,'the short nose mouth remains open');
  let left=0,right=0;const step=size.x/400;
  for(let i=0;i<400;i++)if(hit(-size.x/2+(i+.5)*step,size.z*.46)){if(i<200)left++;else right++;}
  assert.ok(left>7&&right>7,'both truncated tips are present');
  assert.ok((left+right)/400<.22,'tips are narrow wedges rather than two broad rectangular prongs');
});
test('Monica cutaway has a deep rear bay, stepped frontage and raised window floor',async()=>{
  const {size,hit}=await shape('monica-apartment');
  assert.ok(size.z>size.x*1.25,'the selected cutaway is deeper than it is wide');
  assert.equal(hit(-size.x*.40,-size.z*.40),null,'the rear-left kitchen notch is outside the footprint');
  assert.ok(hit(size.x*.22,-size.z*.40),'the window bay extends behind the kitchen');
  assert.equal(hit(-size.x*.40,size.z*.485),null,'the entry frontage is set back');
  assert.ok(hit(size.x*.20,size.z*.485),'the living-room frontage projects forward');
  const rear=hit(size.x*.13,-size.z*.30),front=hit(-size.x*.30,size.z*.40);
  assert.ok(rear&&front&&rear.point.y<size.y*.30&&rear.point.y-front.point.y>.005,'the rear bay has a real raised floor');
});
