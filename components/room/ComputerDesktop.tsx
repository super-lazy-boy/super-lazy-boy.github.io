"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, FileText, Home, Library, Lightbulb, Plus, Search, Lock, Check, UserRound } from "lucide-react";
import type { RoomRecord, RecordKind } from "@/lib/room-types";
import RecordEditor from "./RecordEditor";
import { useT } from "./i18n";
import profile from "@/content/profile.json";

type WorkKind="research"|"idea"|"knowledge"|"about";
export type ComputerRequest={kind:WorkKind;revision:number}|null;
export default function ComputerDesktop({records,owner,request,onRefresh}:{records:RoomRecord[];owner:boolean;request:ComputerRequest;onRefresh:()=>Promise<unknown>}) {
  const t=useT();
  const [app,setApp]=useState<WorkKind|null>(null),[selected,setSelected]=useState<string|null>(null),[editing,setEditing]=useState<Partial<RoomRecord>|null>(null),[query,setQuery]=useState(""),[saved,setSaved]=useState(false);
  useEffect(()=>{if(request){setApp(request.kind);setSelected(null);setEditing(null);setQuery("");}},[request]);
  const apps=[{kind:"research" as const,Icon:FileText,name:t("研究工作","Research"),hint:t("正在探索的问题","Questions in progress")},{kind:"idea" as const,Icon:Lightbulb,name:t("研究想法","Ideas"),hint:t("先把灵感留下","Catch a little spark")},{kind:"knowledge" as const,Icon:Library,name:t("很多知识","Knowledge"),hint:t("随手收藏，慢慢连接","Collect, connect, discover")},{kind:"about" as const,Icon:UserRound,name:t("关于我","About me"),hint:t("房间里的人与故事","The person behind the room")}];
  const active=apps.find(a=>a.kind===app),note=records.find(r=>r.id===selected);
  const list=records.filter(r=>r.kind===app&&(r.title+" "+r.body+" "+r.tags).toLowerCase().includes(query.toLowerCase()));
  const open=(kind:WorkKind)=>{setApp(kind);setSelected(null);setEditing(null);setQuery("");setSaved(false);};
  const home=()=>{setApp(null);setEditing(null);setSelected(null);};
  const back=()=>{if(editing)setEditing(null);else if(selected)setSelected(null);else home();};
  const afterSave=async()=>{await onRefresh();setEditing(null);setSelected(null);setSaved(true);};
  const links=(value:string)=>value.split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>/^https?:\/\//.test(part)?<a href={part} key={i} target="_blank" rel="noopener noreferrer">{part} ↗</a>:part);
  return <div className="workstation" aria-label={t("电脑桌面","Computer desktop")}>
    <header className="workstation-bar"><button onClick={home} aria-label={t("返回电脑桌面","Computer home")}><span className="os-mark"/> super-lazy-boy</button><span>{active?.name||t("一间自己的房间","A room of my own")}</span><span className="os-status">{saved?<><Check size={13}/>{t("已保存","Saved")}</>:"◉  STUDIO"}</span></header>
    {!app?<div className="os-desktop">
      <div className="os-welcome"><p>MAKE ROOM FOR IDEAS</p><h2>{t("留一点空间，给好奇心。","A little room for curiosity.")}</h2><span>{t("点开文件夹，继续今天的探索。","Open a folder. Follow a question.")}</span></div>
      <div className="os-folders">{apps.map(({kind,Icon,name,hint})=><button key={kind} onClick={()=>open(kind)}><div className={"folder-shape folder-"+kind}><Icon size={32} strokeWidth={1.2}/></div><strong>{name}</strong><small>{hint}</small></button>)}</div>
      <footer className="os-dock"><span>01 / STUDIO</span><a href="https://github.com/super-lazy-boy" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14}/></a><a href="mailto:2352467@tongji.edu.cn">{t("联系我","Contact")} <ArrowUpRight size={14}/></a></footer>
    </div>:<div className="os-app">
      <aside className="os-sidebar"><button onClick={home}><Home size={16}/>{t("桌面","Desktop")}</button>{apps.map(({kind,Icon,name})=><button key={kind} className={app===kind?"active":""} onClick={()=>open(kind)}><Icon size={16}/>{name}{kind!=="about"&&<small>{records.filter(r=>r.kind===kind).length}</small>}</button>)}<span>{t("在这里，慢慢积累。","One thought at a time.")}</span></aside>
      <section className="os-content"><header className="os-toolbar"><button onClick={back} aria-label={t("返回上一层","Back")}><ArrowLeft size={17}/></button><strong>{editing?t(editing.id?"编辑记录":"新建记录",editing.id?"Edit note":"New note"):note?note.title:active?.name}</strong>{owner&&!editing&&app!=="about"&&<button className="os-new" onClick={()=>{setEditing(note||{kind:app as RecordKind});setSaved(false);}}><Plus size={14}/>{note?t("编辑","Edit"):t("新建","New")}</button>}</header>
        <div className="os-scroll" key={editing?"editor":selected||app}>
          {editing?<RecordEditor initial={editing} records={records} onSaved={afterSave} onCancel={()=>setEditing(null)} allowedKinds={editing.id?[editing.kind as RecordKind]:["research","idea","knowledge"]}/>:app==="about"?<article className="os-about"><span>THE PERSON IN THE ROOM</span><h1>{profile.name}<i>.</i></h1><h2>{t(profile.intro,"Curiosity in research. Journeys in stories.")}</h2><p>{t(profile.description,"A home for questions in progress, books I read, and worlds from films and games that stay with me.")}</p><h3>{t("喜欢的世界","Worlds worth keeping close")}</h3><div className="os-interest-list">{profile.interests.map(name=><span key={name}>{name}</span>)}</div><footer><a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href={"mailto:"+profile.email}>{t("联系我","Contact")} ↗</a></footer></article>:note?<article className="os-note"><p className="os-note-meta">{[note.date,note.creator,note.tags].filter(Boolean).join(" · ")}{note.visibility==="private"&&<Lock size={12}/>}</p><h1>{note.title}</h1><div>{links(note.body||t("还没有写下内容。","No text yet."))}</div></article>:<>
            <div className="os-search"><Search size={16}/><input aria-label={t("电脑内搜索","Search on computer")} placeholder={t("查找这份文件夹里的内容","Search this folder")} value={query} onChange={e=>setQuery(e.target.value)}/></div>
            {list.length?<div className="os-files">{list.map(r=><button key={r.id} onClick={()=>setSelected(r.id)}><FileText size={22}/><span><strong>{r.title}</strong><small>{r.body.slice(0,64)||r.date}</small></span><ArrowUpRight size={15}/></button>)}</div>:<div className="os-empty"><FileText size={38} strokeWidth={1}/><h3>{query?t("没有找到这条记录","No matches"):t("给下一个想法，留个位置。","A place for your next thought.")}</h3><p>{owner?t("在电脑里新建、阅读和编辑。","Create, read and edit right here."):t("内容会慢慢更新。","More will find a home here.")}</p>{owner&&<button onClick={()=>setEditing({kind:app as RecordKind})}><Plus size={14}/>{t("写下第一条","Write a first note")}</button>}</div>}
          </>}
        </div>
        <footer className="os-app-status"><span>{app==="about"?"PERSONAL SPACE":list.length+" "+t("个项目","items")}</span><span>{t("灵感角 / 工作记录","Studio / Notes")}</span></footer>
      </section>
    </div>}
  </div>;
}
