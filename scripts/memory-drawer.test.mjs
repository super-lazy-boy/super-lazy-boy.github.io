import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDrawerPose,DRAWER_DURATION_MS} from '../lib/memory-drawer.ts';
test('the drawer visibly opens before the cabinet is entered',()=>{
 assert.equal(memoryDrawerPose(0).extension,0);
 const half=memoryDrawerPose(DRAWER_DURATION_MS/2);
 assert.ok(half.extension>0&&half.extension<.43);assert.equal(half.complete,false);
 const hold=memoryDrawerPose(DRAWER_DURATION_MS*.9);
 assert.equal(hold.extension,.43);assert.equal(hold.complete,false);
 assert.equal(memoryDrawerPose(DRAWER_DURATION_MS).complete,true);
});
test('reduced motion opens the cabinet immediately, without an animation delay',()=>{
 assert.deepEqual(memoryDrawerPose(0,true),{extension:.43,complete:true});
});
