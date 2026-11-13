import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoomHoverIntent,RoomHoverTimer,ROOM_VIEWS,ROOM_FOCUS,ROOM_HOVER_TIMING,pickRoomZone,objectRoomZone,roomCameraPose} from '../lib/room-navigation.ts';

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

function timerFixture(initial='overview'){
  let now=0,id=0,zone=initial,enabled=true;const timers=new Map(),changes=[];
  const clock={now:()=>now,set:(callback,delay)=>{timers.set(++id,{callback,at:now+delay});return id;},clear:id=>timers.delete(id)};
  const hover=new RoomHoverTimer(()=>zone,()=>enabled,next=>{zone=next;changes.push({zone,at:now});},clock);
  return {hover,changes,timers,lock:()=>{enabled=false;},advance:until=>{
    for(let count=0;count<50;count++){
      const first=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!first||first[1].at>until){now=until;return;}
      now=first[1].at;timers.delete(first[0]);first[1].callback();
    }
    throw new Error('timer did not become idle');
  }};
}

test('a completely idle canvas still enters after five seconds, exactly once',()=>{
  const f=timerFixture();f.hover.point('office');assert.equal(f.timers.size,1);
  f.advance(4999);assert.deepEqual(f.changes,[]);f.advance(5000);assert.deepEqual(f.changes,[{zone:'office',at:5000}]);
  f.advance(20000);assert.equal(f.changes.length,1);assert.equal(f.timers.size,0);
});

test('stationary boundary gaps expire and return without any animation frames',()=>{
  const f=timerFixture('office');f.hover.point('books');f.advance(1800);f.hover.point('overview');
  f.advance(1979);assert.equal(f.hover.intent.candidate,'books');f.advance(1980);assert.equal(f.hover.intent.candidate,'overview');
  f.advance(6979);assert.equal(f.changes.length,0);f.advance(6980);assert.deepEqual(f.changes,[{zone:'overview',at:6980}]);
});

test('timer scheduling preserves grace pauses, cooldown and physical movement after reset',()=>{
  const f=timerFixture();f.hover.point('books');f.advance(2000);f.hover.point('overview');f.advance(2100);f.hover.point('books');
  f.advance(5099);assert.equal(f.changes.length,0);f.advance(5100);assert.equal(f.changes[0].zone,'books');
  f.hover.reset(450);f.advance(5300);f.hover.point('office');f.advance(10549);assert.equal(f.changes.length,1);f.advance(10550);assert.equal(f.changes[1].zone,'office');
  f.hover.reset();f.advance(30000);assert.equal(f.changes.length,2);assert.equal(f.timers.size,0);
});

test('leaving or locking a view cancels its pending dwell without a redraw',()=>{
  const a=timerFixture();a.hover.point('cinema');a.hover.cancel();assert.equal(a.timers.size,0);a.advance(10000);assert.equal(a.changes.length,0);
  const b=timerFixture();b.hover.point('books');b.lock();b.advance(10000);assert.equal(b.changes.length,0);assert.equal(b.timers.size,0);assert.equal(b.hover.intent.candidate,null);
});

test('a last-moment physical move is sampled before its old dwell deadline can fire',()=>{
  const f=timerFixture();f.hover.point('office');f.advance(4995);f.hover.defer();f.advance(5010);assert.equal(f.changes.length,0);
  f.hover.point('books');f.advance(10009);assert.equal(f.changes.length,0);f.advance(10010);assert.deepEqual(f.changes,[{zone:'books',at:10010}]);
  const same=timerFixture();same.hover.point('office');same.advance(4995);same.hover.defer();same.advance(5010);same.hover.point('office');same.advance(5010);
  assert.deepEqual(same.changes,[{zone:'office',at:5010}]);
});
