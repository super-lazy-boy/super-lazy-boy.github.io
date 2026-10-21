import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoomHoverIntent,ROOM_VIEWS,pickRoomZone} from '../lib/room-navigation.ts';

test('passing over an area does not move the camera',()=>{
  const hover=new RoomHoverIntent();
  hover.point('office','overview',0);
  assert.equal(hover.step('overview',200),null);
  hover.point(null,'overview',250);
  assert.equal(hover.step('overview',1000),null);
});
test('a settled hover enters once and camera motion alone cannot re-enter',()=>{
  const hover=new RoomHoverIntent();hover.point('office','overview',0);
  assert.equal(hover.step('overview',999),null);
  assert.equal(hover.step('overview',1000),'office');
  hover.cancel();
  hover.point('overview','office',1100);
  assert.equal(hover.step('office',2400),null);
  hover.point('overview','office',2500);
  assert.equal(hover.step('office',3799),null);
  assert.equal(hover.step('office',3800),'overview');
  assert.equal(hover.step('overview',6000),null);
});
test('manual navigation or a dialog cancels the queued area change',()=>{
  const hover=new RoomHoverIntent();hover.point('books','overview',0);hover.reset(150,1400);
  assert.equal(hover.step('overview',1000),null);
  hover.point('cinema','books',1600);
  assert.equal(hover.step('books',2599),null);
  assert.equal(hover.step('books',2600),'cinema');
});
test('staying in the active area never starts a new camera transition',()=>{
  const hover=new RoomHoverIntent();hover.point('books','books',0);
  assert.equal(hover.candidate,null);assert.equal(hover.step('books',1000),null);
});
test('focus camera centres hit their own furniture and empty sky exits',()=>{
  for(const zone of ['office','books','cinema','guestbook']){
    const view=ROOM_VIEWS[zone],origin=new THREE.Vector3(...view.camera);
    const ray=new THREE.Ray(origin,new THREE.Vector3(...view.target).sub(origin).normalize());
    assert.equal(pickRoomZone(ray,zone),zone);
    assert.equal(pickRoomZone(new THREE.Ray(origin,new THREE.Vector3(0,1,0)),zone),'overview');
  }
});
test('the guest corner has its own hover target and stays separate from the desk',()=>{
  const origin=new THREE.Vector3(...ROOM_VIEWS.overview.camera);
  const ray=new THREE.Ray(origin,new THREE.Vector3(...ROOM_VIEWS.guestbook.target).sub(origin).normalize());
  assert.equal(pickRoomZone(ray,'overview'),'guestbook');
  const hover=new RoomHoverIntent();hover.point('guestbook','overview',0);
  assert.equal(hover.step('overview',999),null);assert.equal(hover.step('overview',1000),'guestbook');
  assert.notDeepEqual(ROOM_VIEWS.guestbook.target,ROOM_VIEWS.office.target);
});

test('crossing several areas restarts the full dwell time for the final target',()=>{
  const hover=new RoomHoverIntent();
  hover.point('books','overview',0);
  hover.point('cinema','overview',700);
  hover.point('guestbook','overview',1200);
  assert.equal(hover.step('overview',2199),null);
  assert.equal(hover.step('overview',2200),'guestbook');
});
