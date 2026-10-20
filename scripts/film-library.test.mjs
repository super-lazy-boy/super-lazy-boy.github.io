import test from 'node:test';
import assert from 'node:assert/strict';
import profiles from '../content/film-spine-profiles.json' with {type:'json'};
import {filmEntities,nextFilmSlot,filmAddress} from '../lib/film-library.ts';
const records=Object.keys(profiles).map((id,index)=>({id,kind:'movie',title:'Film '+index,slot:-1,archived:false,createdAt:new Date(1700000000000+index).toISOString()}));
test('all 1137 imported films own different permanent physical positions',()=>{
 const entities=filmEntities(records);
 assert.equal(entities.length,1137);assert.equal(new Set(entities.map(e=>e.slot)).size,1137);
 assert.equal(entities.at(-1).cabinet,20);
 assert.equal(entities.filter(e=>e.cabinet===20).length,17);
});
test('filtering records and adding a new tape do not move catalog films',()=>{
 const initial=new Map(filmEntities(records).map(e=>[e.record.id,e.slot]));
 const addition={...records[0],id:'new-film',slot:nextFilmSlot(records)};
 for(const entity of filmEntities([...records.slice(200),addition])){
  if(entity.record.id==='new-film')assert.equal(entity.slot,1137);
  else assert.equal(entity.slot,initial.get(entity.record.id));
 }
});
test('cabinet coordinates identify the two physical rows without overlap',()=>{
 assert.equal(filmAddress(0),'01 · A01');assert.equal(filmAddress(27),'01 · A28');
 assert.equal(filmAddress(28),'01 · B01');assert.equal(filmAddress(56),'02 · A01');
 const entities=filmEntities(records);
 assert.equal(new Set(entities.map(e=>[e.cabinet,e.row,e.column].join(':'))).size,1137);
});
