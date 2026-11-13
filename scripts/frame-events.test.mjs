import test from 'node:test';
import assert from 'node:assert/strict';
import {LatestFrameTask} from '../lib/latest-frame.ts';

function fixture(){
  let id=0;const frames=new Map(),output=[];
  const task=new LatestFrameTask(value=>output.push(value),callback=>{frames.set(++id,callback);return id;},id=>frames.delete(id));
  return {task,frames,output,frame:()=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback(0);}};
}
test('high-frequency pointer input picks the most recent position once per frame',()=>{
  const f=fixture();for(let x=0;x<100;x++)f.task.push({x});assert.equal(f.frames.size,1);assert.equal(f.output.length,0);
  f.frame();assert.deepEqual(f.output,[{x:99}]);assert.equal(f.frames.size,0);
  f.task.push({x:120});f.frame();assert.deepEqual(f.output,[{x:99},{x:120}]);
});
test('a click, exit or disconnect prevents stale hover events and allows fresh movement',()=>{
  const f=fixture();f.task.push('stale');f.task.cancel();f.frame();assert.deepEqual(f.output,[]);
  f.task.push('fresh');f.frame();assert.deepEqual(f.output,['fresh']);f.task.cancel();assert.equal(f.frames.size,0);
});
