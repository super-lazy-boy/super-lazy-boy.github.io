import type {RoomRecord} from './room-types';
export const BOOKS_PER_LAYER=18;
export type BookEntity={record:RoomRecord;slot:number;layer:number;column:number};
export function bookEntities(records:RoomRecord[]):BookEntity[]{
 const books=records.filter(r=>r.kind==='book'&&!r.archived).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
 const used=new Set<number>(),assigned=new Map<string,number>();
 for(const r of books)if(r.slot>=0&&!used.has(r.slot)){assigned.set(r.id,r.slot);used.add(r.slot);}
 let free=0;
 for(const r of books)if(!assigned.has(r.id)){while(used.has(free))free++;assigned.set(r.id,free);used.add(free++);}
 return books.map(record=>{const slot=assigned.get(record.id)!;return{record,slot,layer:Math.floor(slot/BOOKS_PER_LAYER),column:slot%BOOKS_PER_LAYER};}).sort((a,b)=>a.slot-b.slot);
}
export function nextBookSlot(records:RoomRecord[]){const used=new Set(bookEntities(records).map(e=>e.slot));let slot=0;while(used.has(slot))slot++;return slot;}
export function bookAddress(slot:number){return `${String(Math.floor(slot/BOOKS_PER_LAYER)+1).padStart(2,'0')} · ${String(slot%BOOKS_PER_LAYER+1).padStart(2,'0')}`;}
export function bookSize(slot:number){return{width:[.18,.22,.16,.24,.20,.17][slot%6],height:.69+(slot*7%9)*.014};}

