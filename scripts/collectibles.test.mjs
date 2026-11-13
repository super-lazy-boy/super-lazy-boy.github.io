import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import * as THREE from 'three';
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
