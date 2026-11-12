import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoomHoverIntent,ROOM_VIEWS,ROOM_FOCUS,ROOM_HOVER_TIMING,pickRoomZone,objectRoomZone} from '../lib/room-navigation.ts';

test('passing over several areas never completes a dwell',()=>{
  const h=new RoomHoverIntent();h.point('office','overview',0);
  assert.equal(h.step('overview',2300),null);
  h.point('books','overview',2300);h.point('cinema','overview',3000);h.point(null,'overview',3100);
  assert.equal(h.step('overview',10000),null);
});
test('entry takes 2.4 seconds and empty-space return takes 3 seconds',()=>{
  const h=new RoomHoverIntent();h.point('office','overview',0);
  assert.equal(h.step('overview',2399),null);assert.equal(h.step('overview',2400),'office');
  h.reset(4000,ROOM_HOVER_TIMING.cooldown);
  h.point('overview','office',5499);assert.equal(h.candidate,null);
  h.point('overview','office',5500);assert.equal(h.step('office',8499),null);
  assert.equal(h.step('office',8500),'overview');assert.equal(h.step('overview',20000),null);
});
test('camera settlement cooldown requires a fresh pointer event afterwards',()=>{
  const h=new RoomHoverIntent();h.point('books','overview',0);h.reset(5000,1500);
  h.point('office','books',6200);assert.equal(h.candidate,null);assert.equal(h.step('books',15000),null);
  h.point('office','books',15001);assert.equal(h.step('books',17400),null);assert.equal(h.step('books',17401),'office');
});
test('a short boundary gap pauses rather than finishes the entry dwell',()=>{
  const h=new RoomHoverIntent();h.point('books','overview',0);
  h.point('overview','overview',2000);assert.equal(h.step('overview',2050),null);
  h.point('books','overview',2100);assert.equal(h.step('overview',2499),null);assert.equal(h.step('overview',2500),'books');
});
test('one move to empty space expires the grace without another event',()=>{
  const h=new RoomHoverIntent();h.point('books','office',0);h.point('overview','office',1800);
  assert.equal(h.step('office',1949),null);assert.equal(h.step('office',1950),null);
  assert.equal(h.candidate,'overview');assert.equal(h.step('office',4949),null);assert.equal(h.step('office',4950),'overview');
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
