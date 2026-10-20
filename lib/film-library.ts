import profiles from '../content/film-spine-profiles.json' with {type:'json'};
import type {RoomRecord} from './room-types';

export const TAPES_PER_CABINET=56;
export type FilmStyle='epic'|'western'|'animation'|'scifi'|'horror'|'noir'|'documentary'|'action'|'comedy'|'drama';
const catalog=profiles as Record<string,{slot:number;style:FilmStyle}>;
export type FilmEntity={record:RoomRecord;slot:number;cabinet:number;row:number;column:number};

/** Catalog slots are permanent; filtering or adding a record never renumbers another tape. */
export function filmEntities(records:RoomRecord[]):FilmEntity[]{
 const films=records.filter(r=>(r.kind==='movie'||r.kind==='game')&&!r.archived)
  .sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
 const used=new Set<number>(),assigned=new Map<string,number>();
 for(const record of films){
  const slot=catalog[record.id]?.slot??(record.slot>=0?record.slot:null);
  if(slot!==null&&!used.has(slot)){assigned.set(record.id,slot);used.add(slot);}
 }
 let free=0;
 for(const record of films)if(!assigned.has(record.id)){
  while(used.has(free))free++;
  assigned.set(record.id,free);used.add(free++);
 }
 return films.map(record=>{const slot=assigned.get(record.id)!;return{record,slot,cabinet:Math.floor(slot/TAPES_PER_CABINET),row:Math.floor(slot%TAPES_PER_CABINET/28),column:slot%28};}).sort((a,b)=>a.slot-b.slot);
}
export function filmStyle(record:RoomRecord):FilmStyle{
 const known=catalog[record.id]?.style;if(known)return known;
 const text=record.title+' '+record.tags;
 if(/指环王|霍比特|魔戒|奇幻/.test(text))return 'epic';
 if(/科幻|星际|星球|太空|赛博|源代码|降临/.test(text))return 'scifi';
 if(/西部|荒野/.test(text))return 'western';
 if(/动画|动漫/.test(text))return 'animation';
 if(/恐怖|惊魂/.test(text))return 'horror';
 if(/悬疑|犯罪|谜踪|蝙蝠侠|小丑/.test(text))return 'noir';
 if(/纪录/.test(text))return 'documentary';
 if(/喜剧|生活大爆炸/.test(text))return 'comedy';
 return 'drama';
}
export function filmAddress(slot:number){return `${String(Math.floor(slot/56)+1).padStart(2,'0')} · ${slot%56<28?'A':'B'}${String(slot%28+1).padStart(2,'0')}`;}
export function nextFilmSlot(records:RoomRecord[]){
 const reserved=new Set([...Object.values(catalog).map(p=>p.slot),...filmEntities(records).map(e=>e.slot)]);
 let slot=0;while(reserved.has(slot))slot++;return slot;
}

// A few real tapes can be left within reach; their catalog position remains reserved.
export function keepsakeFilms(entities:FilmEntity[]){
 const choices=[/横道世之介/,/指环王.*魔戒再现|指环王1/,/霍比特人.*意外|霍比特人1/,/蝙蝠侠.*黑暗骑士$/, /^降临$/, /^生活大爆炸 第十二季$/];
 const result:FilmEntity[]=[];
 for(const match of choices){const entity=entities.find(e=>match.test(e.record.title)&&!result.some(r=>r.record.id===e.record.id));if(entity)result.push(entity);}
 return result.slice(0,6);
}
