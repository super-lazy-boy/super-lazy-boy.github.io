import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {recordPrintMaterial} from '../lib/record-print-material.ts';
import {lightProfile} from '../lib/room-lighting.ts';

test('book and tape printing uses a lit, shadow-receiving paper material',()=>{
  const map=new THREE.Texture(),material=recordPrintMaterial(map);
  assert.equal(material.type,'MeshStandardMaterial');assert.equal(material.isMeshBasicMaterial,undefined);
  assert.equal(material.map,map);assert.equal(material.toneMapped,true);
  assert.equal(material.emissive.getHex(),0);assert.equal(material.emissiveMap,null);
  assert.equal(material.metalness,0);assert.ok(material.roughness>.7);
  const json=material.toJSON();assert.equal(json.type,'MeshStandardMaterial');assert.equal(json.emissive,0);
  material.dispose();map.dispose();
});
test('blank labels retain their ink colour and printed labels retain their texture',()=>{
  const blank=recordPrintMaterial(null,'#5a605d'),map=new THREE.Texture(),printed=recordPrintMaterial(map);
  assert.equal(blank.color.getHexString(),'5a605d');assert.equal(blank.map,null);assert.equal(printed.color.getHexString(),'ffffff');assert.equal(printed.map,map);
  assert.notEqual(blank.uuid,printed.uuid);blank.dispose();printed.dispose();map.dispose();
});
test('night reflections and ambient fill fall while local task lights become dominant',()=>{
  const day=lightProfile(false,false),night=lightProfile(true,false),film=lightProfile(true,true);
  assert.ok(night.ambient<day.ambient/3);assert.ok(night.environment<day.environment/3);
  assert.equal(night.sun,0);assert.ok(night.desk>3&&night.floor>10&&night.guest>3&&night.console>2);
  assert.ok(film.guest<night.guest&&film.console<night.console);assert.ok(film.projector>0);
});
