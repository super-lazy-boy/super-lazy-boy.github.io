import { z } from "zod";
import type { RoomRecord } from "./room-types";

const publicAsset=z.string().max(2000).refine(value=>!value||/^https:\/\//i.test(value)||/^\.\/media\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes(".."),"素材使用 HTTPS 链接或 ./media/ 下的公开文件");
const item=z.object({
  id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  kind:z.enum(["book","movie","game","research","idea","knowledge"]),
  title:z.string().trim().min(1).max(160),
  creator:z.string().max(160).default(""),year:z.string().max(12).default(""),
  body:z.string().max(60000).default(""),date:z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
  color:z.string().regex(/^#[a-fA-F0-9]{6}$/).default("#80927c"),
  visibility:z.literal("public").default("public"),progress:z.enum(["planned","in-progress","finished"]).default("finished"),
  rating:z.number().min(0).max(5).default(0),tags:z.string().max(600).default(""),
  coverUrl:publicAsset.default(""),modelUrl:publicAsset.default(""),
  trailerUrl:z.string().max(2000).refine(v=>!v||/^https:\/\//i.test(v)).default(""),
  slot:z.number().int().min(-1).max(10000).default(-1),memorable:z.boolean().default(false),
  modelVisible:z.boolean().default(false),modelPlacement:z.enum(["books-top","books-middle","cinema-left","cinema-right"]).default("books-middle"),
  modelScale:z.number().min(.1).max(1.5).default(.65),modelRotation:z.number().min(-180).max(180).default(0)
}).strict();
const document=z.object({version:z.literal(1),records:z.array(item).max(10000)}).strict();

export function parsePublicRecords(input:unknown):RoomRecord[]{
  const data=document.parse(input),ids=new Set<string>(),slots=new Set<number>();
  return data.records.map((record,index)=>{
    if(ids.has(record.id))throw new Error("记录 ID 重复："+record.id);ids.add(record.id);
    if(record.kind==="book"&&record.slot>=0){if(slots.has(record.slot))throw new Error("书籍位置重复："+record.slot);slots.add(record.slot);}
    return {...record,coverKey:"",modelKey:"",memorialNote:"",archived:false,createdAt:record.date||String(index).padStart(8,"0"),updatedAt:record.date||""};
  });
}
