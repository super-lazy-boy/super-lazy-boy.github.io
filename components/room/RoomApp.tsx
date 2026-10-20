"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, Component, lazy, Suspense } from "react";
import { BookOpen, Clapperboard, Monitor, Plus, ArrowUpRight, ArrowLeft, X, Search, Settings2, Download, Upload, RotateCcw, Box, ExternalLink, Eye, Lock, Archive } from "lucide-react";
import { type RoomRecord, type RecordKind, type Zone, KIND_LABELS, recordCover, safeTrailerId } from "@/lib/room-types";
import RecordEditor from "./RecordEditor";
import ComputerDesktop, { type ComputerRequest } from "./ComputerDesktop";
import { type MotionStatus, type RecordRequest } from "./RecordMotion";
import { LanguageContext, useT, type Lang } from "./i18n";
import { useRoomServices } from "./RoomServices";
import {filmEntities,filmAddress,nextFilmSlot} from '@/lib/film-library';

const Scene=lazy(()=>import("./RoomScene"));
const Review=lazy(()=>import("./RoomScene").then(m=>({default:m.ReviewScene})));
type Panel=null|"list"|"detail"|"editor"|"manager"|"review"|"login";
const zones:Zone[]=["overview","office","books","cinema"];
function Modal({children,onClose,title,wide=false}:{children:ReactNode;onClose:()=>void;title:string;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current;d?.showModal();return()=>d?.close();},[]);
  return <dialog ref={ref} className={"modal "+(wide?"modal-wide":"")} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="modal-inner"><header className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭 / Close"><X size={19}/></button></header>{children}</div>
  </dialog>;
}
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{error:boolean}>{
  state={error:false};static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?this.props.fallback:this.props.children;}
}
function Projection({record,onBrowse,onRead}:{record:RoomRecord|null;onBrowse:()=>void;onRead:()=>void}) {
  const t=useT();
  return <div className="projected-page"><span className="projected-label">A PRIVATE SCREENING ROOM</span>
    {record?<div className="projected-selected">{recordCover(record)?<img src={recordCover(record)} alt={record.title}/>:<div className="projected-poster" style={{background:record.color}}><Clapperboard size={44}/><strong>{record.title}</strong></div>}<div><p>{record.year} {record.creator&&" / "+record.creator}</p><h2>{record.title}</h2><p className="projected-note">{record.body||t("还没有写下这次观看的感想。","A note for this viewing is still to come.")}</p><button onClick={onRead}>{t("打开观影记录","Open viewing note")} <ArrowUpRight size={19}/></button><button className="projected-back" onClick={onBrowse}>{t("换一盘","Choose another")}</button></div></div>
    :<div className="projected-empty"><h2>{t("一个人的放映室","A screening room of my own")}</h2><p>{t("从架子上选一盘，或浏览我的收藏。","Pick a tape from the shelf, or browse the collection.")}</p><button onClick={onBrowse}>{t("浏览影视与游戏","Browse films & games")} <ArrowUpRight size={21}/></button></div>}
  </div>;
}
function RecordDetail({record,owner,onEdit}:{record:RoomRecord;owner:boolean;onEdit:()=>void}) {
  const t=useT(),[play,setPlay]=useState(false);
  const video=safeTrailerId(record.trailerUrl);
  return <div className="record-detail"><div className="detail-meta">
    {recordCover(record)&&<img className="detail-cover" src={recordCover(record)} alt={record.title}/>}
    <span className="kind-label">{KIND_LABELS[record.kind]} {record.year&&" / "+record.year}</span><h1>{record.title}</h1>
    {record.creator&&<p>{record.creator}</p>}
    <div className="detail-facts">{record.date&&<span>{record.date}</span>}{record.rating>0&&<span>{"★".repeat(Math.round(record.rating))} {record.rating}/5</span>}<span>{record.visibility==="public"?<Eye size={13}/>:<Lock size={13}/>} {record.visibility==="public"?t("公开","Public"):t("仅自己","Private")}</span></div>
    {record.tags&&<div className="tags">{record.tags.split(/[,，]/).map(tag=><span key={tag}>{tag.trim()}</span>)}</div>}
    {owner&&<button className="button subtle" onClick={onEdit}><Settings2 size={14}/>{t("编辑记录","Edit note")}</button>}
  </div><div className="detail-writing"><p className="note-body">{(record.body||t("还没有写下记录。","No note yet.")).split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>/^https?:\/\//.test(part)?<a href={part} key={i} target="_blank" rel="noopener noreferrer">{part}</a>:part)}</p>
    {video&&<div className="trailer">{play?<iframe src={"https://www.youtube-nocookie.com/embed/"+video+"?autoplay=1"} title={record.title+" / trailer"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<button className="button" onClick={()=>setPlay(true)}>{t("按需播放预告片","Play trailer")} <ExternalLink size={14}/></button>}</div>}
    {record.memorable&&record.memorialNote&&owner&&<aside className="memorial-note"><span>{t("纪念摆件 · 创作便签","Collectible · creative note")}</span><p>{record.memorialNote}</p>{!record.modelKey&&<small>{t("待单独制作与审核","Awaiting individual modeling and review")}</small>}</aside>}
  </div></div>;
}
export default function RoomApp({publishedRecords}:{publishedRecords?:RoomRecord[]}={}){
  const [lang,setLang]=useState<Lang>("zh");
  return <LanguageContext.Provider value={lang}><RoomContents lang={lang} setLang={setLang} publishedRecords={publishedRecords}/></LanguageContext.Provider>;
}
function RoomContents({lang,setLang,publishedRecords}:{lang:Lang;setLang:(lang:Lang)=>void;publishedRecords?:RoomRecord[]}) {
  const staticSite=publishedRecords!==undefined;
  const services=useRoomServices(),request=services.request;
  const t=useT();
  const [zone,setZone]=useState<Zone>("overview"),[records,setRecords]=useState<RoomRecord[]>([]),[owner,setOwner]=useState(false);
  const [viewRevision,setViewRevision]=useState(0);
  const [computerRequest,setComputerRequest]=useState<ComputerRequest>(null);
  const [recordRequest,setRecordRequest]=useState<RecordRequest>(null),[motionStatus,setMotionStatus]=useState<MotionStatus>(null),[skipRevision,setSkipRevision]=useState(0);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[panel,setPanel]=useState<Panel>(null),[kind,setKind]=useState<RecordKind>("book");
  const [selected,setSelected]=useState<RoomRecord|null>(null),[movie,setMovie]=useState<RoomRecord|null>(null),[editing,setEditing]=useState<Partial<RoomRecord>|null>(null);
  const [search,setSearch]=useState(""),[bookPage,setBookPage]=useState(0),[filmPage,setFilmPage]=useState(0),[review,setReview]=useState("glasses");
  const [libraryOpen,setLibraryOpen]=useState(false);
  const [allRecords,setAllRecords]=useState<RoomRecord[]>([]),[archiveView,setArchiveView]=useState(false),[notice,setNotice]=useState("");
  const importRef=useRef<HTMLInputElement>(null);
  const refreshRevision=useRef(0);
  const [loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState("");
  const refresh=useCallback(async()=>{
    const revision=++refreshRevision.current;
    setError("");
    if(publishedRecords&&!services.connected){setRecords(publishedRecords);setOwner(false);setLoading(false);return publishedRecords;}
    try{
      const response=await request("/api/records",{cache:"no-store"});if(!response.ok)throw new Error(t("记录暂时无法读取，请重试。","Records could not be loaded. Please retry."));
      if(revision!==refreshRevision.current)return null;
      const data=await response.json() as { records:RoomRecord[]; owner:boolean };if(revision!==refreshRevision.current)return null;setRecords(data.records);setOwner(data.owner);
      setMovie(old=>old?data.records.find(record=>record.id===old.id)||null:null);
      setSelected(old=>old?data.records.find(record=>record.id===old.id)||null:null);
      return data.records as RoomRecord[];
    }catch(e){if(revision===refreshRevision.current){setOwner(false);setRecords(publishedRecords||[]);setAllRecords([]);setSelected(null);setMovie(null);setEditing(null);setPanel(null);setError(e instanceof Error?e.message:t("读取失败","Could not load records"));}return null;}finally{if(revision===refreshRevision.current)setLoading(false);}
  },[lang,publishedRecords,request,services.connected]);
  useEffect(()=>{
    ++refreshRevision.current;setOwner(false);setRecords(publishedRecords||[]);setAllRecords([]);
    setSelected(null);setMovie(null);setEditing(null);setRecordRequest(null);setMotionStatus(null);setPanel(null);
    void refresh();
    return()=>{++refreshRevision.current;};
  },[refresh,services.revision]);
  useEffect(()=>{if(!services.connected||panel||motionStatus)return;const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},240000);return()=>clearInterval(timer);},[refresh,services.connected,panel,motionStatus]);
  useEffect(()=>{
    try{const v=localStorage.getItem("room-language");if(v==="en")setLang(v);}catch{}
    const hash=location.hash.slice(1);
    if(zones.includes(hash as Zone))setZone(hash as Zone);
    else if(["research","ideas","resources"].includes(hash)){setZone("office");setComputerRequest({kind:hash==="research"?"research":hash==="ideas"?"idea":"knowledge",revision:1});}
  },[]);
  useEffect(()=>{document.documentElement.lang=lang==="zh"?"zh-CN":"en";document.title=lang==="zh"?"super-lazy-boy · 一间自己的房间":"super-lazy-boy · A room of my own";},[lang]);
  const changeZone=(next:Zone)=>{setLibraryOpen(false);setZone(next);setViewRevision(revision=>revision+1);history.replaceState(null,"","#"+next);document.body.style.cursor="";};
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!panel){if(libraryOpen)setLibraryOpen(false);else changeZone("overview");}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[panel,libraryOpen]);
  const openLibrary=()=>{changeZone('cinema');setRecordRequest(null);setMotionStatus(null);setLibraryOpen(true);setSearch('');setPanel(null);};
  const openList=(next:RecordKind)=>{if(next==="research"||next==="idea"||next==="knowledge"){setComputerRequest({kind:next,revision:Date.now()});changeZone("office");setPanel(null);return;}setKind(next);setSearch("");setPanel("list");};
  const newRecord=(next:RecordKind=kind,slot=-1)=>{if(!owner)return;if((next==='movie'||next==='game')&&slot<0)slot=nextFilmSlot(records);setEditing({kind:next,slot});setPanel("editor");};
  const requestRecord=(record:RoomRecord)=>{
    const ordered=[...records].sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    if(record.kind==="book"){const books=ordered.filter(r=>r.kind==="book"),slot=record.slot>=0?record.slot:books.findIndex(r=>r.id===record.id);setBookPage(Math.floor(Math.max(0,slot)/96));changeZone("books");}
    else{const entity=filmEntities(ordered).find(e=>e.record.id===record.id);setFilmPage(entity?.cabinet||0);changeZone("cinema");}
    setPanel(null);setRecordRequest(old=>({id:record.id,revision:(old?.revision||0)+1}));
  };
  const pickRecord=(record:RoomRecord)=>{setSelected(record);if(record.kind==="movie"||record.kind==="game"){setMovie(record);if(zone!=="cinema")changeZone("cinema");setPanel(null);}else{if(zone!=="books")changeZone("books");setPanel("detail");}};
  const showDetail=(record:RoomRecord)=>{setSelected(record);setPanel("detail");};
  const loadManager=async()=>{const revision=refreshRevision.current;setSearch("");setArchiveView(false);try{const response=await request("/api/records?archived=true",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json() as {records:RoomRecord[];owner:boolean};if(revision!==refreshRevision.current)return;if(!data.owner)throw new Error();setAllRecords(data.records);setPanel("manager");}catch{if(revision===refreshRevision.current)setNotice(t("管理列表暂不可用，请重试。","Could not open the manager. Please retry."));}};
  const editRecord=(record:RoomRecord)=>{setEditing(record);setPanel("editor");};
  const saved=async()=>{setPanel(null);await refresh();setNotice(t("已保存，房间也更新了。","Saved. Your room is up to date."));};
  const archiveRecord=async(record:RoomRecord)=>{
    const response=await request("/api/records/"+record.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({archived:!record.archived})});
    if(response.ok){await refresh();await loadManager();setNotice(t(record.archived?"已恢复记录":"已归档，可在归档中恢复",record.archived?"Record restored":"Archived. You can restore it from the archive."));}else setNotice(t("操作未成功，请重试。","The change could not be saved. Please retry."));
  };
  const exportRecords=async()=>{
    const revision=refreshRevision.current;
    const response=await request("/api/records?archived=true",{cache:"no-store"});if(!response.ok){setNotice(t("导出失败","Export failed"));return;}
    const data=await response.json() as {records:RoomRecord[];owner:boolean};
    if(revision!==refreshRevision.current||!data.owner)return;
    const blob=new Blob([JSON.stringify({format:"personal-room-v1",exportedAt:new Date().toISOString(),records:data.records},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="my-room-records-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);
  };
  const importRecords=async(file?:File)=>{
    if(!file)return;
    try{
      if(file.size>5*1024*1024)throw new Error(t("备份文件需小于 5 MB","Backup must be smaller than 5 MB"));
      const text=await file.text();const data=JSON.parse(text);
      const response=await request("/api/records/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const result=await response.json() as {error?:string;count:number};if(!response.ok)throw new Error(result.error);
      await refresh();await loadManager();setNotice(t("已导入 "+result.count+" 条记录。","Imported "+result.count+" records."));
    }catch(e){setNotice(e instanceof Error?e.message:t("导入失败","Import failed"));}finally{if(importRef.current)importRef.current.value="";}
  };
  const login=async()=>{setLoginBusy(true);setLoginError("");try{await services.signIn?.();}catch(e){setLoginError(e instanceof Error?e.message:t("登录未成功，请重试。","Sign-in failed. Please retry."));setLoginBusy(false);}};
  const logout=async()=>{
    ++refreshRevision.current;setOwner(false);setRecords(publishedRecords||[]);setAllRecords([]);setSelected(null);setMovie(null);setPanel(null);setEditing(null);setRecordRequest(null);setMotionStatus(null);
    try{await services.signOut?.();setNotice(t("已退出，正在以访客身份浏览。","Signed out. You are browsing as a visitor."));}catch{setNotice(t("退出未成功，请重试。","Sign-out failed. Please retry."));await refresh();}
  };
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(""),5000);return()=>clearTimeout(timer);},[notice]);
  const names:Record<Zone,string>={overview:t("房间漫游","Room tour"),office:t("灵感角","Studio corner"),books:t("翻页角","Reading corner"),cinema:t("放映角","Screening corner")};
  const visibleList=records.filter(r=>r.kind===kind && (r.title+" "+r.creator+" "+r.tags).toLowerCase().includes(search.toLowerCase()));
  const books=records.filter(r=>r.kind==="book"),films=records.filter(r=>r.kind==="movie"||r.kind==="game");
  const filmLibrary=useMemo(()=>filmEntities(records),[records]);
  const cabinetCount=Math.max(1,(filmLibrary.at(-1)?.cabinet||0)+1);
  const libraryMatches=search.trim()?filmLibrary.filter(entity=>(entity.record.title+' '+entity.record.year).toLowerCase().includes(search.trim().toLowerCase())).slice(0,7):[];
  useEffect(()=>{setFilmPage(page=>Math.min(page,cabinetCount-1));},[cabinetCount]);
  const bookPages=Math.max(1,Math.ceil(Math.max(books.length,...books.map(record=>record.slot+1))/96));
  const managerRecords=allRecords.filter(r=>r.archived===archiveView&&(r.title+" "+r.creator).toLowerCase().includes(search.toLowerCase()));
  const computer=<ComputerDesktop records={records} owner={owner} request={computerRequest} onRefresh={refresh}/>;
  const projection=<Projection record={movie} onBrowse={openLibrary} onRead={()=>movie&&showDetail(movie)}/>;
  return <main className="room-app">
    <a className="skip-link" href="#room-navigation">{t("跳转到导航","Skip to navigation")}</a>
    <header className="room-header"><a className="wordmark" href="#overview" onClick={e=>{e.preventDefault();changeZone("overview");}}>super-lazy-boy<span>.</span></a>
      <nav id="room-navigation" aria-label={t("区域导航","Room navigation")}>{zones.map(z=><button key={z} data-room-zone={z} className={zone===z?"active":""} aria-pressed={zone===z} onClick={()=>changeZone(z)}><span className="nav-index">{z==="overview"?"00":z==="office"?"01":z==="books"?"02":"03"}</span>{names[z]}</button>)}</nav>
      <div className="header-actions"><button className="lang-button" onClick={()=>{const next=lang==="zh"?"en":"zh";setLang(next);try{localStorage.setItem("room-language",next);}catch{}}}>{lang==="zh"?"EN":"中文"}</button>{owner?<button className="manage-button" onClick={loadManager}><Plus size={15}/><span>{t("管理记录","Manage")}</span></button>:services.connected&&!services.signedIn?<button className="manage-button" onClick={()=>{setLoginBusy(false);setLoginError("");setPanel("login");}}><Lock size={13}/>{t("站主登录","Owner sign-in")}</button>:!staticSite&&!loading&&<a className="manage-button" href="/signin-with-chatgpt?return_to=/" target="_top">{t("登录","Sign in")}</a>}{services.signedIn&&<button className="signout-button" onClick={logout}>{owner?t("退出","Sign out"):t("访客 · 退出","Visitor · Sign out")}</button>}</div>
    </header>
    <div className="scene-stage" aria-label={t("三维个人空间，可使用区域导航切换","3D personal room. Use the navigation to switch areas.")}>
      <SceneBoundary fallback={<div className="scene-fallback"><h1>{t("欢迎来到我的房间","Welcome to my room")}</h1><p>{t("此设备暂未能显示三维画面，仍可直接阅读记录。","3D is unavailable on this device. You can still browse the records.")}</p><button className="button" onClick={()=>openList("book")}>{t("阅读记录","Reading notes")}</button><button className="button" onClick={()=>openList("movie")}>{t("观影记录","Viewing notes")}</button><button className="button" onClick={()=>openList("research")}>{t("研究工作","Research")}</button></div>}>
        <Suspense fallback={<div className="loading-note">{t("正在打开房间…","Opening the room…")}</div>}><Scene libraryOpen={libraryOpen} onOpenLibrary={openLibrary} zone={zone} navigationLocked={panel!==null||motionStatus!==null} viewRevision={viewRevision} records={[...records].sort((a,b)=>a.createdAt.localeCompare(b.createdAt))} owner={owner} language={lang} bookPage={bookPage} filmPage={filmPage} onZone={changeZone} onRecord={pickRecord} onSelect={requestRecord} recordRequest={recordRequest} activeBookId={panel==="detail"&&selected?.kind==="book"?selected.id:null} loadedTapeId={movie?.id||null} skipRevision={skipRevision} onMotionStatus={setMotionStatus} playbackBusy={motionStatus==="tape-out"||motionStatus==="tape-insert"} onBlank={(k,slot)=>newRecord(k,slot)} computer={computer} projection={projection}/></Suspense>
      </SceneBoundary>
      {motionStatus&&<div className="record-motion-status"><span role="status" aria-live="polite">{motionStatus==="book-out"?t("正在取出这本书…","Taking the book off the shelf…"):motionStatus==="book-return"?t("把书放回原处…","Putting the book back…"):motionStatus==="tape-out"?t("取出录像带…","Taking out the tape…"):t("插入播放机，准备放映…","Loading the tape. Getting ready to screen…")}</span><button onClick={()=>setSkipRevision(v=>v+1)}>{t("跳过动画","Skip animation")}</button></div>}
      {loading&&<div className="loading-note" role="status">{t("正在打开房间…","Opening the room…")}</div>}
      {owner&&!libraryOpen&&(zone==="books"||zone==="cinema")&&<div className="owner-entry-hint"><Lock size={12}/><span>{zone==="books"?t("点一本白色的书，写下阅读记录。","Click a white book to add a reading note."):t("点一盘空白录像带，留下观影记录。","Click a blank tape to add a viewing note.")}</span><button onClick={()=>newRecord(zone==="books"?"book":"movie")}>{t("新建","Add")} ＋</button></div>}
      {error&&<div className="error-note" role="alert">{error}<button onClick={refresh}>{t("重试","Retry")}</button></div>}
      <div className={"scene-caption"+(libraryOpen?" in-library":"")}><span className="scene-index">{zone==="overview"?"00":zone==="office"?"01":zone==="books"?"02":"03"}</span><div><h1>{zone==="overview"?t("一间自己的房间","A room of my own"):names[zone]}</h1><p>{zone==="overview"?t("在研究里追问，在故事里远行。","Curiosity in research. Journeys in stories."):zone==="office"?t("点开电脑，看看正在探索的问题。","Open the computer. Follow a question."):zone==="books"?t("读过的书，留下的想法。","Books read. Thoughts kept."):t("从架子上，挑一段记忆。","Pick a memory from the shelf.")}</p>{zone==="overview"&&<button className="caption-about" onClick={()=>{changeZone("office");setComputerRequest({kind:"about",revision:Date.now()});}}>{t("关于我","About me")} <ArrowUpRight size={12}/></button>}</div></div>
      <div className={"view-toolbar"+(libraryOpen?" in-library":"")}>{zone!=="overview"&&<button onClick={()=>changeZone("overview")}><ArrowLeft size={14}/>{t("返回总览","Overview")}</button>}<span className="mouse-navigation-help">{t("移动环顾 · 停留进入 · 移开返回","Move to look · Hover to enter · Move away to return")}</span><span className="touch-navigation-help">{t("点击区域 · 拖动观察 · 双指缩放","Tap to enter · Drag to look · Pinch to zoom")}</span><button className="reset-view" onClick={()=>{changeZone("overview");setBookPage(0);setFilmPage(0);}} aria-label={t("重置视角","Reset view")}><RotateCcw size={14}/></button></div>
      {zone==="books"&&bookPages>1&&<div className="shelf-pager"><button disabled={bookPage===0} onClick={()=>setBookPage(p=>p-1)}>←</button><span>{bookPage+1} / {bookPages}</span><button disabled={bookPage>=bookPages-1} onClick={()=>setBookPage(p=>p+1)}>→</button></div>}
      {zone==="cinema"&&!libraryOpen&&<div className="shelf-pager"><button className="cabinet-entry" onClick={openLibrary}>{t("打开回忆柜","Open the memory cabinet")} ↗</button></div>}
      {libraryOpen&&<section className="film-library-ui" aria-label={t("回忆柜","Memory cabinet")}>
        <div className="library-heading"><button className="button subtle" onClick={()=>setLibraryOpen(false)}><ArrowLeft size={14}/>{t("回到房间","Back to the room")}</button><div><span>THE MEMORY CABINET</span><h2>{t("故事都有自己的位置。","Every story has a place.")}</h2><p>{t(`${filmLibrary.length} 盘录像带 · ${cabinetCount} 组柜架`,`${filmLibrary.length} tapes · ${cabinetCount} cabinets`)}</p></div></div>
        <div className="library-search"><div className="search-field"><Search size={16}/><input aria-label={t("查找柜中的影片","Find a tape")} placeholder={t("找一部电影…","Find a film…")} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label={t("清空搜索","Clear search")} onClick={()=>setSearch('')}><X size={13}/></button>}</div>{search&&<div className="library-results">{libraryMatches.length?libraryMatches.map(entity=><button key={entity.record.id} onClick={()=>{setFilmPage(entity.cabinet);setSearch('');}}><span>{entity.record.title}</span><small>{filmAddress(entity.slot)} ↗</small></button>):<p>{t("没有找到这盘录像带","No matching tape")}</p>}</div>}</div>
        <div className="library-browser"><button aria-label={t("上一组柜架","Previous cabinet")} disabled={filmPage===0} onClick={()=>setFilmPage(p=>p-1)}>←</button><div><span>{t("回忆柜","CABINET")} {String(filmPage+1).padStart(2,'0')} / {String(cabinetCount).padStart(2,'0')}</span><small>{t("点击片名取出放映 · 滚轮靠近看看","Pick a tape to screen it · Scroll to look closer")}</small></div><button aria-label={t("下一组柜架","Next cabinet")} disabled={filmPage>=cabinetCount-1} onClick={()=>setFilmPage(p=>p+1)}>→</button></div>
      </section>}
      <div className={"quick-records"+(libraryOpen?" in-library":"")}><button onClick={()=>openList("book")}><BookOpen size={15}/>{t("阅读记录","Reading")}<span>{books.length}</span></button><button onClick={openLibrary}><Clapperboard size={15}/>{t("影视收藏","Films")}<span>{films.length}</span></button>{zone==="office"&&<button onClick={()=>openList("research")}><Monitor size={15}/>{t("打开工作记录","Open notebook")}</button>}</div>
    </div>
    <footer className="room-footer"><span>© {new Date().getFullYear()} super-lazy-boy</span><div><a href="https://github.com/super-lazy-boy" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={11}/></a><a href="mailto:2352467@tongji.edu.cn">{t("联系我","Contact")} <ArrowUpRight size={11}/></a>{owner&&<button onClick={()=>setPanel("review")}><Box size={11}/>{t("模型审阅","Model review")}</button>}</div></footer>
    {notice&&<div className="toast" role="status">{notice}</div>}
    {panel==="login"&&<Modal title={t("回到自己的房间","Welcome back")} onClose={()=>setPanel(null)}><div className="owner-login"><span className="login-symbol"><Lock size={24} strokeWidth={1.3}/></span><h3>{t("用你的 GitHub 账号登录","Sign in with GitHub")}</h3><p>{t("只有站点主人可以添加和编辑。其他访客可以自由阅读公开内容。","Only the owner can add and edit. Visitors can browse public notes.")}</p><button className="button primary" onClick={login} disabled={loginBusy}>{loginBusy?t("正在前往 GitHub…","Opening GitHub…"):t("使用 GitHub 登录","Continue with GitHub")}<ArrowUpRight size={16}/></button><small>{t("登录后，点击书本写阅读，点击录像带写影视。","Once signed in, use books for reading and tapes for viewing notes.")}</small>{loginError&&<p className="form-error" role="alert">{loginError}</p>}</div></Modal>}
    {panel==="list"&&<Modal title={t(KIND_LABELS[kind],kind==="book"?"Reading notes":kind==="movie"?"Film collection":kind==="game"?"Games":kind==="research"?"Research":kind==="idea"?"Ideas":"Bits of knowledge")} onClose={()=>setPanel(null)} wide>
      <div className="list-toolbar"><div className="search-field"><Search size={16}/><input aria-label={t("搜索记录","Search records")} placeholder={t("搜索名称、作者或标签","Search title, creator or tags")} value={search} onChange={e=>setSearch(e.target.value)}/></div>{owner&&<button className="button primary" onClick={()=>newRecord(kind)}><Plus size={15}/>{t("新增","Add")}</button>}</div>
      {(kind==="movie"||kind==="game")&&<div className="tab-row"><button className={kind==="movie"?"active":""} onClick={()=>setKind("movie")}>{t("电影","Films")}</button><button className={kind==="game"?"active":""} onClick={()=>setKind("game")}>{t("游戏","Games")}</button></div>}
      {!visibleList.length?<div className="empty-state"><BookOpen size={32} strokeWidth={1}/><h3>{search?t("没有找到匹配记录","No matching records"):t("这里还留着位置。","A little room, waiting.")}</h3><p>{owner?t("写下第一条记录，它就会进入这个空间。","Add your first note. It will find a place in this room."):t("内容会慢慢更新。","More will find a home here.")}</p></div>:<div className="record-list">{visibleList.map(r=><button className="record-row" key={r.id} onClick={()=>r.kind==="book"||r.kind==="movie"||r.kind==="game"?requestRecord(r):showDetail(r)}><span className="record-spine" style={{background:r.color}}/><div><h3>{r.title}</h3><p>{[r.creator,r.year,r.date].filter(Boolean).join(" / ")}</p></div><span className="record-privacy">{r.visibility==="private"&&<Lock size={12}/>}</span><ArrowUpRight size={19}/></button>)}</div>}
    </Modal>}
    {panel==="detail"&&selected&&<Modal title={t("记录","Note")} onClose={()=>setPanel(null)} wide><RecordDetail record={selected} owner={owner} onEdit={()=>editRecord(selected)}/></Modal>}
    {panel==="editor"&&owner&&<Modal title={editing?.id?t("编辑记录","Edit note"):t("新增记录","Add a note")} onClose={()=>setPanel(null)} wide><RecordEditor initial={editing||{}} records={records} onSaved={saved} onCancel={()=>setPanel(null)}/></Modal>}
    {panel==="manager"&&owner&&<Modal title={t("我的记录","My records")} onClose={()=>setPanel(null)} wide>
      <div className="manager-actions"><button className="button primary" onClick={()=>newRecord("book")}><BookOpen size={15}/>{t("记一本书","Add a book")}</button><button className="button subtle" onClick={()=>newRecord("movie")}><Clapperboard size={15}/>{t("记一部影视","Add a film")}</button><button className="button subtle" onClick={exportRecords}><Download size={14}/>{t("导出备份","Export")}</button><button className="button subtle" onClick={()=>importRef.current?.click()}><Upload size={14}/>{t("导入备份","Import")}</button><input hidden ref={importRef} type="file" accept=".json,application/json" onChange={e=>importRecords(e.target.files?.[0])}/></div>
      <div className="list-toolbar"><div className="search-field"><Search size={15}/><input placeholder={t("搜索我的记录","Search my records")} aria-label={t("搜索我的记录","Search my records")} value={search} onChange={e=>setSearch(e.target.value)}/></div><button className={"button subtle "+(archiveView?"selected":"")} onClick={()=>setArchiveView(!archiveView)}><Archive size={14}/>{archiveView?t("返回记录","Active notes"):t("归档","Archive")}</button></div>
      <p className="manager-note">{t("每条记录单独设置公开范围。私密内容只对你可见。","Set visibility per note. Private content is only visible to you.")}</p>
      {!managerRecords.length?<div className="empty-state"><h3>{t("从第一条记录开始。","Start with one note.")}</h3><p>{t("书、电影、游戏，以及研究中的一点发现。","A book, a film, a game, or a discovery.")}</p></div>:<div className="manager-list">{managerRecords.map(r=><div className="manager-row" key={r.id}><button onClick={()=>editRecord(r)}><span className="record-spine" style={{background:r.color}}/><div><h3>{r.title}</h3><p>{KIND_LABELS[r.kind]} · {r.visibility==="private"?t("仅自己","Private"):t("公开","Public")}{r.memorable?" · "+t("纪念记录","Memorable"):""}</p></div></button><button className="icon-button" onClick={()=>archiveRecord(r)} aria-label={r.archived?t("恢复记录","Restore record"):t("归档记录","Archive record")}>{r.archived?<RotateCcw size={15}/>:<Archive size={15}/>}</button></div>)}</div>}
    </Modal>}
    {panel==="review"&&owner&&<Modal title={t("基础模型 · 审阅","Base models · review")} onClose={()=>setPanel(null)} wide><div className="review-tabs">{[["glasses",t("墨镜 · 造型草稿","Aviators · draft")],["desk",t("办公桌与电脑","Desk & computer")],["chair",t("椅子","Chair")],["sofa",t("懒人沙发","Lounge chair")],["books",t("书架","Bookshelf")],["cinema",t("影音架与幕布","Video shelf & screen")]].map(([id,label])=><button className={review===id?"active":""} key={id} onClick={()=>setReview(id)}>{label}</button>)}</div><div className="review-viewport"><SceneBoundary fallback={<p>{t("模型暂时无法显示","Model could not be displayed")}</p>}><Suspense fallback={null}><Review item={review}/></Suspense></SceneBoundary></div><p className="manager-note">{t("墨镜为待审阅的造型草稿，尚未放入房间。其余为基础家具模型，可旋转检查。","The aviators are a draft for individual review and are not placed in the room. Rotate to inspect each model.")}</p></Modal>}
  </main>;
}

