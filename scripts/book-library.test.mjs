import test from 'node:test';
import assert from 'node:assert/strict';
import {bookEntities,bookAddress,nextBookSlot} from '../lib/book-library.ts';
const records=Array.from({length:89},(_,i)=>({id:`book-${i}`,kind:'book',slot:i,archived:false,createdAt:String(i).padStart(4,'0')}));
test('89 books have permanent positions across five individual shelf layers',()=>{
 const entities=bookEntities(records);assert.equal(entities.length,89);assert.equal(new Set(entities.map(e=>e.slot)).size,89);
 assert.deepEqual(Array.from({length:5},(_,i)=>entities.filter(e=>e.layer===i).length),[18,18,18,18,17]);
 assert.equal(bookAddress(88),'05 · 17');
});
test('new books and filtered views preserve assigned positions',()=>{
 assert.equal(nextBookSlot(records),89);
 const subset=bookEntities([...records.slice(15),{...records[0],id:'new',slot:89}]);
 assert.equal(subset.find(e=>e.record.id==='new').layer,4);
 for(const e of subset.filter(e=>e.record.id!=='new'))assert.equal(e.slot,Number(e.record.id.slice(5)));
});
