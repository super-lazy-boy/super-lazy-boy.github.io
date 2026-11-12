import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoomHoverIntent,ROOM_VIEWS,ROOM_FOCUS,ROOM_HOVER_TIMING,pickRoomZone,objectRoomZone,roomCameraPose} from '../lib/room-navigation.ts';

test('passing over several areas never completes a dwell',()=>{
  const h=new RoomHoverIntent();h.point('office','overview',0);
  assert.equal(h.step('overview',2300),null);
  h.point('books','overview',2300);h.point('cinema','overview',3000);h.point(null,'overview',3100);
  assert.equal(h.step('overview',10000),null);
});
test('entry and return each take five seconds',()=>{
  const h=new RoomHoverIntent();h.point('office','overview',0);
  assert.equal(h.step('overview',4999),null);assert.equal(h.step('overview',5000),'office');
  h.reset(6000,ROOM_HOVER_TIMING.cooldown);h.point('overview','office',6200);
  assert.equal(h.step('office',11449),null);assert.equal(h.step('office',11450),'overview');
  assert.equal(h.step('overview',20000),null);
});
test('one deliberate movement during cooldown is kept instead of stalling',()=>{
  const h=new RoomHoverIntent();h.reset(5000,450);assert.equal(h.step('books',15000),null);
  h.reset(5000,450);h.point('office','books',5200);
  assert.equal(h.candidate,'office');assert.equal(h.step('books',10449),null);
  assert.equal(h.step('books',10450),'office');assert.equal(h.step('office',20000),null);
});
test('a short boundary gap pauses rather than finishes the entry dwell',()=>{
  const h=new RoomHoverIntent();h.point('books','overview',0);
  h.point('overview','overview',2000);assert.equal(h.step('overview',2050),null);
  h.point('books','overview',2100);assert.equal(h.step('overview',5099),null);assert.equal(h.step('overview',5100),'books');
});
test('one move to empty space expires the grace without another event',()=>{
  const h=new RoomHoverIntent();h.point('books','office',0);h.point('overview','office',1800);
  assert.equal(h.step('office',1979),null);assert.equal(h.step('office',1980),null);
  assert.equal(h.candidate,'overview');assert.equal(h.step('office',6979),null);assert.equal(h.step('office',6980),'overview');
  h.reset();h.point('office','overview',0);h.point('overview','overview',2000);
  assert.equal(h.step('overview',10000),null);assert.equal(h.candidate,null);
});
test('input locks and leaving the viewport discard a queued transition',()=>{
  const h=new RoomHoverIntent();h.point('books','overview',0);h.cancel();assert.equal(h.step('overview',10000),null);
  h.point('cinema','overview',10001);h.reset(12000,1500);assert.equal(h.step('overview',20000),null);
});
test('the active area never starts a second transition',()=>{
  const h=new RoomHoverIntent();h.point('books','books',0);assert.equal(h.candidate,null);assert.equal(h.step('books',10000),null);
});
test('semantic furniture hits inherit their region; architecture is overview',()=>{
  const root=new THREE.Group(),mesh=new THREE.Mesh();root.userData.roomZone='books';root.add(mesh);
  assert.equal(objectRoomZone(mesh),'books');mesh.userData.roomZone='office';assert.equal(objectRoomZone(mesh),'office');
  delete mesh.userData.roomZone;mesh.removeFromParent();mesh.userData.asset_group='starry night';assert.equal(objectRoomZone(mesh),'office');
  mesh.userData.asset_group='cinema botanicals';assert.equal(objectRoomZone(mesh),'cinema');
  mesh.userData.asset_group='architecture';assert.equal(objectRoomZone(mesh),'overview');
});
test('desk overview and screen focus have distinct stable cameras',()=>{
  assert.ok(new THREE.Vector3(...ROOM_VIEWS.office.camera).distanceTo(new THREE.Vector3(...ROOM_FOCUS.camera))>3);
  assert.deepEqual(ROOM_FOCUS.target,[-3.73,2.70,-.60]);
  for(const zone of ['office','books','cinema','guestbook']){
    const v=ROOM_VIEWS[zone],origin=new THREE.Vector3(...v.camera);
    assert.equal(pickRoomZone(new THREE.Ray(origin,new THREE.Vector3(...v.target).sub(origin).normalize()),zone),zone);
    assert.equal(pickRoomZone(new THREE.Ray(origin,new THREE.Vector3(0,1,0)),zone),'overview');
  }
});

test('mouse camera follow is bounded, reversible and disabled while reading',()=>{
  for(const zone of Object.keys(ROOM_VIEWS)){
    const base=ROOM_VIEWS[zone],a=roomCameraPose(zone,1,1),b=roomCameraPose(zone,-1,-1);
    const p=new THREE.Vector3(...a.camera),q=new THREE.Vector3(...b.camera),center=new THREE.Vector3(...base.camera);
    assert.ok(p.distanceTo(center)<=.60);assert.ok(p.add(q).multiplyScalar(.5).distanceTo(center)<1e-8);
    assert.deepEqual(roomCameraPose(zone,1,1,false),{camera:base.camera,target:base.target});
    assert.deepEqual(roomCameraPose(zone,12,-20),roomCameraPose(zone,1,-1));
  }
});
