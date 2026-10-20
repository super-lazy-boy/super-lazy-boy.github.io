"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowDown,PenLine,Trash2,RotateCcw,X,Check,Lock,StickyNote} from 'lucide-react';
import {NOTE_COLORS,noteCount,type GuestbookData,type GuestNote,type NoteColor,type NoteCursor} from '@/lib/guestbook';
import {useRoomServices} from './RoomServices';
import {useT} from './i18n';

const labels={paper:'奶油黄',sage:'鼠尾草绿',blush:'浅陶粉',lavender:'雾紫'};
function PaperColors({value,onChange}:{value:NoteColor;onChange:(color:NoteColor)=>void}){
 return <div className="note-colors" role="group" aria-label="便签颜色">{(Object.keys(NOTE_COLORS) as NoteColor[]).map(color=><button key={color} type="button" style={{background:NOTE_COLORS[color]}} aria-label={labels[color]} aria-pressed={value===color} onClick={()=>onChange(color)}>{value===color&&<Check size={12}/>}</button>)}</div>;
}
function NoteEditor({initial,busy,onSave,onCancel}:{initial?:GuestNote;busy:boolean;onSave:(body:string,color:NoteColor)=>Promise<boolean>;onCancel?:()=>void}){
 const [body,setBody]=useState(initial?.body||''),[color,setColor]=useState<NoteColor>(initial?.color||'paper'),count=noteCount(body);
 const submit=async(e:FormEvent)=>{e.preventDefault();if(await onSave(body.trim(),color)&&!initial)setBody('');};
 return <form className="note-editor" onSubmit={submit} style={{'--paper':NOTE_COLORS[color]} as React.CSSProperties}>
  <label htmlFor={initial?'edit-'+initial.id:'new-guest-note'}>{initial?'修改我的便签':'给这个房间留一句话'}</label>
  <textarea id={initial?'edit-'+initial.id:'new-guest-note'} value={body} onChange={e=>setBody(e.target.value)} maxLength={560} rows={5} placeholder="一部想推荐的电影，一本喜欢的书，或者一句问候。" autoFocus={!!initial}/>
  <div className="note-editor-tools"><PaperColors value={color} onChange={setColor}/><span className={count>280?'over-limit':''}>{count} / 280</span></div>
  <div className="note-editor-actions">{onCancel&&<button type="button" className="button subtle" onClick={onCancel}>取消</button>}<button className="button primary" disabled={busy||count===0||count>280}>{busy?'正在贴好…':initial?'保存修改':'贴上便签'}<PenLine size={13}/></button></div>
 </form>;
}
type Props={onClose:()=>void;onChanged:()=>void};
export default function Guestbook({onClose,onChanged}:Props){
 const services=useRoomServices(),t=useT(),[data,setData]=useState<GuestbookData|null>(null),[notes,setNotes]=useState<GuestNote[]>([]);
 const [deleted,setDeleted]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [editing,setEditing]=useState<string|null>(null),[confirm,setConfirm]=useState<string|null>(null),generation=useRef(0),heading=useRef<HTMLHeadingElement>(null);
 const get=useCallback(async(append=false,cursor:NoteCursor|null=null)=>{
  const current=++generation.current;setLoading(true);setError('');
  try{
   const query=new URLSearchParams();if(deleted)query.set('deleted','true');if(cursor){query.set('before',cursor.before);query.set('id',cursor.id);}
   const response=await services.request('/api/guestbook?'+query,{cache:'no-store'}),result=await response.json();
   if(!response.ok)throw Error(result.error||'便签暂时无法读取。');if(current!==generation.current)return;
   const incoming=result as GuestbookData;setData(incoming);setNotes(old=>append?[...new Map([...old,...incoming.notes].map(n=>[n.id,n])).values()]:incoming.notes);
  }catch(e){if(current===generation.current)setError(e instanceof Error?e.message:'便签暂时无法读取。');}
  finally{if(current===generation.current)setLoading(false);}
 },[services.request,deleted]);
 useEffect(()=>{setData(null);setNotes([]);setEditing(null);void get();return()=>{generation.current++;};},[get,services.revision]);
 useEffect(()=>{heading.current?.focus();},[]);
 const mutate=async(path:string,payload:unknown,method='POST')=>{
  setBusy(true);setError('');try{const r=await services.request(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await r.json();if(!r.ok)throw Error(result.error||'没有保存成功，请再试一次。');await get();onChanged();return true;}catch(e){setError(e instanceof Error?e.message:'没有保存成功。');return false;}finally{setBusy(false);}
 };
 const save=async(body:string,color:NoteColor,id?:string)=>{const ok=await mutate('/api/guestbook'+(id?'/'+id:''),{body,color},id?'PATCH':'POST');if(ok){setEditing(null);setNotice(id?'修改已保存。':'便签已贴好，谢谢你来过。');}return ok;};
 const signed=services.signedIn&&!!data?.signedIn,owner=signed&&!!data?.owner;
 const signIn=async()=>{setBusy(true);setError('');try{await services.signIn?.();}catch(e){setError(e instanceof Error?e.message:'登录暂时不可用。');setBusy(false);}};
 return <section className="guestbook-space" aria-labelledby="guestbook-heading">
  <header className="guestbook-header"><button className="button subtle" onClick={onClose}><ArrowLeft size={14}/>{t('回到房间','Back to the room')}</button><div><span>NOTES LEFT HERE</span><h1 id="guestbook-heading" ref={heading} tabIndex={-1}>{t('桌边便签','A note by the desk')}</h1><p>{t('来过，就留一点回声。','A little hello, left behind.')}</p></div><button className="icon-button" onClick={onClose} aria-label="关闭便签板"><X size={20}/></button></header>
  {owner&&<div className="guestbook-owner"><button role="switch" aria-checked={data.enabled} disabled={busy} onClick={()=>void mutate('/api/guestbook/settings',{enabled:!data.enabled})}><span className={'note-switch '+(data.enabled?'on':'')}/>{data.enabled?'允许留下便签':'已暂停新增和编辑'}</button><button className="button subtle" onClick={()=>{setDeleted(!deleted);setConfirm(null);setEditing(null);}}>{deleted?<RotateCcw size={13}/>:<Trash2 size={13}/>} {deleted?'回到便签板':'回收夹'}</button></div>}
  <div className="guestbook-layout"><div className="guestbook-notes" aria-label={deleted?'回收夹中的便签':'来访便签'}>
   {!loading&&!notes.length&&<div className="notes-empty"><StickyNote size={32} strokeWidth={1}/><h2>{deleted?'回收夹里很干净。':'这里还留着空白。'}</h2><p>{deleted?'被收起的便签会暂存在这里。':'第一张便签，留给路过的你。'}</p></div>}
   {notes.map((note,index)=><article key={note.id} className="guest-note" style={{'--paper':NOTE_COLORS[note.color], '--tilt':`${((index%5)-2)*.5}deg`} as React.CSSProperties}>
    {editing===note.id&&signed?<NoteEditor initial={note} busy={busy} onSave={(body,color)=>save(body,color,note.id)} onCancel={()=>setEditing(null)}/>:<><p className="guest-note-body">{note.body}</p><footer><strong>{note.authorName}</strong><span>{new Date(note.createdAt).toLocaleDateString('zh-CN')}{note.updatedAt!==note.createdAt?' · 已修改':''}</span></footer><div className="guest-note-actions">
     {signed&&note.mine&&note.canEdit&&!deleted&&<button onClick={()=>{setEditing(note.id);setConfirm(null);}}><PenLine size={12}/>编辑我的便签</button>}
     {owner&&(confirm===note.id?<span className="note-confirm">收进回收夹？<button disabled={busy} onClick={async()=>{if(await mutate('/api/guestbook/'+note.id+'/moderate',{restore:false})){setConfirm(null);setNotice('已收进回收夹，可以恢复。');}}}>确定</button><button onClick={()=>setConfirm(null)}>取消</button></span>:<button disabled={busy} onClick={async()=>{if(deleted){if(await mutate('/api/guestbook/'+note.id+'/moderate',{restore:true}))setNotice('便签已放回。');}else setConfirm(note.id);}}>{deleted?<RotateCcw size={12}/>:<Trash2 size={12}/>} {deleted?'恢复':'删除'}</button>)}
    </div></>}
   </article>)}
   {data?.hasMore&&<button className="button subtle notes-more" disabled={loading} onClick={()=>void get(true,data.nextCursor)}>{loading?'正在翻看…':'再看看其他便签'}<ArrowDown size={14}/></button>}
  </div><aside className="guestbook-writing">
   {deleted?<div className="note-writing-info"><RotateCcw size={24}/><h2>留一个反悔的机会。</h2><p>收起的便签仅站主可见，可以随时放回便签板。</p></div>:data&&!data.enabled?<div className="note-writing-info"><PenLine size={24}/><h2>今天先收起笔。</h2><p>站主暂停了新增和编辑，已经留下的便签仍然可以阅读。</p></div>:signed?<><NoteEditor busy={busy} onSave={(body,color)=>save(body,color)}/><p className="note-public-hint"><Lock size={11}/>便签公开展示，使用 GitHub 签名。你可以修改自己的便签。</p></>:<div className="note-writing-info"><PenLine size={25}/><h2>写张便签吧。</h2><p>用 GitHub 登录，留下一句问候。以后回来，也可以修改自己的内容。</p><button className="button primary" disabled={busy||loading} onClick={signIn}>{busy?'正在前往 GitHub…':'GitHub 登录并留言'}</button><small>公开展示便签与 GitHub 签名。</small></div>}
  </aside></div>
  {loading&&!notes.length&&<p className="guestbook-status" role="status">正在翻开便签…</p>}{error&&<p className="guestbook-error" role="alert">{error}<button onClick={()=>void get()}>重新读取</button></p>}{notice&&<p className="guestbook-status" role="status">{notice}</p>}
 </section>;
}
