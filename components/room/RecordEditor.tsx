"use client";

import { useState, type FormEvent } from "react";
import { Search, Upload, Check, Plus } from "lucide-react";
import { type RoomRecord, type RecordKind, KIND_LABELS, recordCover } from "@/lib/room-types";
import { useT } from "./i18n";
import { useRoomServices } from "./RoomServices";
import { editorKinds, recordEntry } from "@/lib/record-entry";
const dateToday=()=>{const now=new Date();return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");};
const blank:Partial<RoomRecord>={kind:"book",title:"",creator:"",year:"",body:"",color:"#728b83",date:"",visibility:"private",progress:"finished",rating:0,tags:"",coverKey:"",coverUrl:"",trailerUrl:"",slot:-1,memorable:false,memorialNote:"",modelKey:"",modelPlacement:"books-middle",modelScale:.65,modelRotation:0,modelVisible:false,archived:false};
type BookResult={title:string;creator:string;year:string;coverUrl:string};
export default function RecordEditor({initial,records,onSaved,onCancel,allowedKinds}:{initial:Partial<RoomRecord>;records:RoomRecord[];onSaved:()=>void;onCancel:()=>void;allowedKinds?:RecordKind[]}) {
  const t=useT();
  const {request}=useRoomServices();
  const kinds=allowedKinds||editorKinds(initial.kind,!!initial.id);
  const [form,setForm]=useState({...blank,date:dateToday(),...initial});
  const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(""),[results,setResults]=useState<BookResult[]>([]),[lookup,setLookup]=useState(false),[lookupMessage,setLookupMessage]=useState("");
  const set=(key:keyof RoomRecord,value:string|number|boolean)=>setForm(old=>({...old,[key]:value}));
  const findBook=async()=>{
    if(!form.title?.trim())return;setLookup(true);setLookupMessage("");setError("");
    try{const response=await request("/api/search?q="+encodeURIComponent(form.title));const data=await response.json() as {error?:string;results:BookResult[]};if(!response.ok)throw new Error(data.error);setResults(data.results);if(!data.results.length)setLookupMessage(t("没有找到匹配，可以直接填写。","No matches. You can enter the details yourself."));}
    catch{setLookupMessage(t("暂未找到匹配，可以直接填写。","Search is unavailable. You can enter the details yourself."));}finally{setLookup(false);}
  };
  const upload=async(file:File|undefined,model=false)=>{
    if(!file)return;setUploading(true);setError("");
    try{
      const payload=new FormData();payload.append("file",file);
      const response=await request("/api/upload",{method:"POST",body:payload});const data=await response.json() as {error?:string;key:string;type:string;url?:string};
      if(!response.ok)throw new Error(data.error);
      if(model&&data.type!=="model")throw new Error(t("请选择 GLB 三维模型","Please choose a GLB model"));
      if(!model&&data.type!=="image")throw new Error(t("请选择封面图片","Please choose a cover image"));
      set(model?"modelKey":"coverKey",data.key);if(data.url)set(model?"modelUrl":"resolvedCoverUrl",data.url);if(model)set("modelVisible",false);
    }catch(e){setError(e instanceof Error?e.message:t("上传失败","Upload failed"));}finally{setUploading(false);}
  };
  const save=async(e:FormEvent)=>{
    e.preventDefault();setBusy(true);setError("");
    try{
      if(!kinds.includes(form.kind as RecordKind))throw new Error(t("请使用对应区域录入这种记录。","Use the matching area for this record type."));
      let slot=form.slot??-1;
      if(form.kind==="book"&&slot<0){const used=new Set(records.filter(r=>r.kind==="book"&&r.id!==initial.id).map(r=>r.slot));slot=0;while(used.has(slot))slot++;}
      const response=await request(initial.id?"/api/records/"+initial.id:"/api/records",{method:initial.id?"PATCH":"POST",headers:{"Content-Type":"application/json","X-Room-Entry":recordEntry(initial.kind||form.kind as RecordKind)},body:JSON.stringify({...form,slot})});
      const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||t("保存失败","Save failed"));
      onSaved();
    }catch(e){setError(e instanceof Error?e.message:t("保存失败","Save failed"));}finally{setBusy(false);}
  };
  const kind=form.kind as RecordKind;
  return <form className="record-editor" onSubmit={save}>
    <div className="editor-grid"><div className="editor-main">
      <div className="field-row"><label>{t("记录类型","Type")}{kinds.length===1?<div className="fixed-record-type">{t(kind==="book"?"阅读记录":kind==="movie"?"影视记录":KIND_LABELS[kind],kind==="book"?"Reading note":kind==="movie"?"Viewing note":kind)}<small>{t(kind==="book"?"这本书，只收阅读。":kind==="movie"?"这盘录像带，只收影视。":"记录类型保持不变。", "This entry keeps its record type.")}</small></div>:<select value={kind} onChange={e=>{set("kind",e.target.value);set("slot",-1);setResults([]);}}>{kinds.map(k=><option key={k} value={k}>{t(KIND_LABELS[k],k)}</option>)}</select>}</label><label>{t("记录日期","Date")}<input type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></label></div>
      <label>{t("名称","Title")} <span className="required">*</span><div className="title-input"><input autoFocus required maxLength={160} placeholder={t(kind==="book"?"书名或 ISBN":kind==="movie"?"电影或剧集名称":"记录名称",kind==="book"?"Book title or ISBN":kind==="movie"?"Film or series title":"Title")} value={form.title} onChange={e=>set("title",e.target.value)}/>{kind==="book"&&<button type="button" className="lookup-button" disabled={lookup||!form.title?.trim()} onClick={findBook}><Search size={15}/>{lookup?t("查找中","Searching"):t("匹配资料","Find details")}</button>}</div></label>
      {results.length>0&&<div className="lookup-results">{results.map((result,i)=><button type="button" key={i} onClick={()=>{setForm(old=>({...old,...result,coverKey:"",resolvedCoverUrl:""}));setResults([]);}}><strong>{result.title}</strong><span>{result.creator} {result.year}</span><Plus size={14}/></button>)}</div>}
      {lookupMessage&&<p className="field-hint">{lookupMessage}</p>}
      <div className="field-row"><label>{t(kind==="movie"?"导演":kind==="game"?"开发者":"作者 / 来源",kind==="movie"?"Director":kind==="game"?"Developer":"Author / source")}<input value={form.creator} maxLength={160} onChange={e=>set("creator",e.target.value)}/></label><label>{t("年份","Year")}<input value={form.year} maxLength={12} placeholder="—" onChange={e=>set("year",e.target.value)}/></label></div>
      <label>{t("写一点记录","A note")}<textarea rows={8} maxLength={60000} placeholder={t("一句话也可以，之后再慢慢补充。","One sentence is enough. Add more whenever you like.")} value={form.body} onChange={e=>set("body",e.target.value)}/></label>
      <div className="field-row"><label>{t("状态","Status")}<select value={form.progress} onChange={e=>set("progress",e.target.value)}><option value="planned">{t(kind==="book"?"想读":kind==="movie"?"想看":"计划中","Planned")}</option><option value="in-progress">{t(kind==="book"?"在读":kind==="movie"?"在看":"进行中","In progress")}</option><option value="finished">{t(kind==="book"?"已读":kind==="movie"?"已看":"已完成","Finished")}</option></select></label><label>{t("评分（可留空）","Rating (optional)")}<input type="number" min="0" max="5" step=".5" value={form.rating||""} placeholder="— / 5" onChange={e=>set("rating",Number(e.target.value)||0)}/></label></div>
      <label>{t("标签","Tags")}<input placeholder={t("用逗号分隔，例如：科幻，重看","Separate with commas")} value={form.tags} maxLength={600} onChange={e=>set("tags",e.target.value)}/></label>
    </div><aside className="editor-side">
      <fieldset className="visibility-field"><legend>{t("谁可以看到","Who can see this")}</legend><label><input type="radio" name="visibility" checked={form.visibility==="private"} onChange={()=>set("visibility","private")}/><div><strong>{t("仅自己","Only me")}</strong><small>{t("私密保存，访客不会收到内容。","Kept private from visitors.")}</small></div></label><label><input type="radio" name="visibility" checked={form.visibility==="public"} onChange={()=>set("visibility","public")}/><div><strong>{t("公开记录","Public note")}</strong><small>{t("访客可以看到这条记录。","Visible to visitors.")}</small></div></label></fieldset>
      <label>{t("书脊 / 封套颜色","Spine / sleeve color")}<div className="color-field"><input type="color" value={form.color} onChange={e=>set("color",e.target.value)}/><span>{form.color}</span></div></label>
      <div className="cover-upload">{(form.coverKey||form.coverUrl)?<img src={recordCover(form as RoomRecord)} alt={t("封面预览","Cover preview")}/>:<div className="cover-placeholder" style={{background:form.color}}><span>{form.title||t("封面","Cover")}</span></div>}<label className="button subtle"><Upload size={14}/>{t("上传封面","Upload cover")}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0])} disabled={uploading}/></label>{(form.coverKey||form.coverUrl)&&<button className="text-button" type="button" onClick={()=>{set("coverKey","");set("coverUrl","");set("resolvedCoverUrl","");}}>{t("移除封面","Remove cover")}</button>}</div>
      <details className="editor-details"><summary>{t("更多设置","More options")}</summary><label>{t("封面图片链接","Cover image URL")}<input type="url" placeholder="https://" value={form.coverUrl} onChange={e=>{set("coverUrl",e.target.value);set("coverKey","");set("resolvedCoverUrl","");}}/></label>{kind==="book"&&<label>{t("书架位置","Shelf position")}<input type="number" min="-1" max="10000" value={form.slot} onChange={e=>set("slot",Number(e.target.value))}/><small>{t("−1 自动安排；从 0 开始编号。","−1 for automatic placement; positions start at 0.")}</small></label>}{(kind==="movie"||kind==="game")&&<label>{t("预告片链接（YouTube）","Trailer URL (YouTube)")}<input type="url" placeholder="https://www.youtube.com/watch?v=…" value={form.trailerUrl} onChange={e=>set("trailerUrl",e.target.value)}/></label>}</details>
    </aside></div>
    <section className="memorial-editor"><label className="checkbox-label"><input type="checkbox" checked={form.memorable} onChange={e=>set("memorable",e.target.checked)}/><span><strong>{t("这条记录值得留一件纪念物","Keep a collectible for this memory")}</strong><small>{t("先保存想法，之后逐件制作和审核。","Save the idea first. Model and review each piece separately.")}</small></span></label>
      {form.memorable&&<div className="memorial-fields"><label>{t("想留住什么？","What would you like to keep?")}<textarea rows={3} maxLength={5000} placeholder={t("例如：挪麦人雕像，以及它让我记住的那个时刻。","An object, a scene, or a moment worth keeping.")} value={form.memorialNote} onChange={e=>set("memorialNote",e.target.value)}/></label><details><summary>{t("加入已制作的三维摆件","Add an existing 3D collectible")}</summary><p className="field-hint">{t("上传单独审核过的 GLB 模型，选择位置后放入场景。","Upload an individually reviewed GLB model and choose its place.")}</p><label className="button subtle"><Upload size={14}/>{form.modelKey?t("更换 GLB 模型","Replace GLB model"):t("上传 GLB 模型","Upload GLB model")}<input type="file" accept=".glb,model/gltf-binary" onChange={e=>upload(e.target.files?.[0],true)} disabled={uploading}/></label>{form.modelKey&&<><p className="field-hint"><Check size={12}/>{t("模型已上传","Model uploaded")}</p><div className="field-row"><label>{t("摆放位置","Placement")}<select value={form.modelPlacement} onChange={e=>set("modelPlacement",e.target.value)}><option value="books-top">{t("书架顶层","Bookshelf top")}</option><option value="books-middle">{t("书架中层","Bookshelf middle")}</option><option value="cinema-left">{t("影音柜一侧","Video cabinet, first side")}</option><option value="cinema-right">{t("影音柜另一侧","Video cabinet, other side")}</option></select></label><label>{t("模型高度 / 大小","Size")}<input type="number" min=".1" max="1.5" step=".05" value={form.modelScale} onChange={e=>set("modelScale",Number(e.target.value))}/></label></div><label>{t("朝向","Rotation")}<input type="range" min="-180" max="180" step="5" value={form.modelRotation} onChange={e=>set("modelRotation",Number(e.target.value))}/></label><label className="checkbox-label"><input type="checkbox" checked={form.modelVisible} onChange={e=>set("modelVisible",e.target.checked)}/>{t("已审核，放入场景","Reviewed: display in the room")}</label></>}</details></div>}
    </section>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="editor-footer"><span>{uploading?t("正在上传…","Uploading…"):t("私密或公开范围可随时修改。","You can change visibility at any time.")}</span><button type="button" className="button subtle" onClick={onCancel} disabled={busy}>{t("取消","Cancel")}</button><button type="submit" className="button primary" disabled={busy||uploading}>{busy?t("保存中…","Saving…"):t("保存到房间","Save to the room")}</button></div>
  </form>;
}

