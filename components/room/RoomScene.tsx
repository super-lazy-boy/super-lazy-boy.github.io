"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl, Center, Html, RoundedBox, SoftShadows, useGLTF } from "@react-three/drei";
import RoomNavigation from "./RoomNavigation";
import {ROOM_VIEWS} from "@/lib/room-navigation";
import { createAviators } from "./models/aviators";
import * as THREE from "three";
import { DeskDetails, LazySofa, OakPanel, RoomAccessories, StudioLight, useSurface } from "./RoomDecor";
import { RecordMotionProvider, useRecordAnchor, type RecordRequest, type MotionStatus } from "./RecordMotion";
import { assetUrl, type RoomRecord, type Zone } from "@/lib/room-types";
import {filmEntities,keepsakeFilms} from '@/lib/film-library';
import {TapeCase,TapeTitle} from './TapeSpine';
import FilmArchive from './FilmArchive';
import MemoryDrawer from './MemoryDrawer';
import BookArchive from './BookArchive';
import BookObject from './BookObject';
import BookStack from './BookStack';
import GuestbookBoard,{GuestbookCamera} from './GuestbookBoard';
import type {GuestbookData} from '@/lib/guestbook';

type Vec3 = [number, number, number];
type Props = {
  guestbookOpen:boolean;guestbookData:GuestbookData|null;onGuestbook:()=>void;
  zone: Zone; navigationLocked:boolean; language:"zh"|"en"; viewRevision: number; records: RoomRecord[]; owner: boolean; bookPage: number; filmPage: number;
  onZone: (zone: Zone) => void; onRecord: (record: RoomRecord) => void;
  onBlank: (kind: "book" | "movie", slot: number) => void;
  computer: ReactNode; projection: ReactNode; review?: string;
  recordRequest:RecordRequest; activeBookId:string|null; loadedTapeId:string|null; skipRevision:number; playbackBusy:boolean;
  onSelect:(record:RoomRecord)=>void; onMotionStatus:(status:MotionStatus)=>void;
  libraryOpen:boolean;onOpenLibrary:()=>void;
  bookArchiveOpen:boolean;bookLayer:number;onOpenBooks:()=>void;
  drawerRequest:number;drawerOpening:boolean;onDrawerRequest:()=>void;
};
const WHITE="#f9f9f7", INK="#303337";
const material = (color: string, metalness=0, roughness=.73) => <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
function Box({size,position=[0,0,0],color=WHITE,rotation, ...props}:{size:Vec3;position?:Vec3;color?:string;rotation?:Vec3;[key:string]:unknown}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow {...props}><boxGeometry args={size}/>{material(color)}</mesh>;
}
function Bevel({size,position=[0,0,0],color=WHITE,radius=.025, ...props}:{size:Vec3;position?:Vec3;color?:string;radius?:number;[key:string]:unknown}) {
  return <RoundedBox args={size} position={position} radius={Math.min(radius, ...size.map(v=>v/2-.001))} smoothness={2} castShadow receiveShadow {...props}>{material(color)}</RoundedBox>;
}
function Cylinder({r=.05,h=.1,position=[0,0,0],color=INK,rotation=[0,0,0]}:{r?:number;h?:number;position?:Vec3;color?:string;rotation?:Vec3}) {
  return <mesh position={position} rotation={rotation} castShadow><cylinderGeometry args={[r,r,h,20]}/>{material(color)}</mesh>;
}
const pointerOn=(e:ThreeEvent<PointerEvent>)=>{e.stopPropagation();document.body.style.cursor="pointer";};
const pointerOff=()=>{document.body.style.cursor="";};

function useLabel(title: string, subtitle="", color="#ffffff", vertical=false, transparent=false) {
  const texture=useMemo(()=>{
    if(vertical&&!title)return null;
    const canvas=document.createElement("canvas");canvas.width=vertical?128:1024;canvas.height=vertical?768:576;
    const ctx=canvas.getContext("2d")!;
    if(!transparent){ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);}
    ctx.fillStyle=vertical ? (new THREE.Color(color).getHSL({h:0,s:0,l:0}).l>.63 ? "#40474b" : "#fff") : "#30383a";
    if(vertical){
      ctx.translate(64,384);ctx.rotate(-Math.PI/2);ctx.font="500 35px Arial, Microsoft YaHei, sans-serif";
      ctx.textAlign="center";ctx.fillText(title.slice(0,24),0,12,650);
      ctx.fillRect(-300,-25,25,3);
    }else{
      ctx.textAlign="center";ctx.font="500 42px Arial, Microsoft YaHei, sans-serif";ctx.fillText(title,512,268,920);
      ctx.fillStyle="#8a9295";ctx.font="24px Arial, Microsoft YaHei, sans-serif";ctx.fillText(subtitle,512,330,900);
    }
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
  },[title,subtitle,color,vertical,transparent]);
  useEffect(()=>()=>texture?.dispose(),[texture]);return texture;
}
function Label({title,subtitle="",position,size,color="#fbfbfa",transparent=false}:{title:string;subtitle?:string;position:Vec3;size:[number,number];color?:string;transparent?:boolean}) {
  const texture=useLabel(title,subtitle,color,false,transparent);
  return <mesh position={position}><planeGeometry args={size}/><meshBasicMaterial map={texture} transparent={transparent} toneMapped={false}/></mesh>;
}
function Desk({children,onClick}:{children?:ReactNode;onClick?:()=>void}) {
  return <group>
    <DeskDetails/>
    <Bevel size={[3.8,.12,1.55]} position={[0,1.63,0]} radius={.018}/>
    {[-1.72,1.72].flatMap(x=>[-.58,.58].map(z=><Box key={x+":"+z} size={[.085,1.57,.085]} position={[x,.785,z]} color="#f3f4f3"/>))}
    <Box size={[3.35,.12,.07]} position={[0,1.40,-.56]} color="#f0f1ef"/>
    <group position={[0,0,-.28]} onClick={e=>{e.stopPropagation();if(e.delta<4)onClick?.();}} onPointerOver={pointerOn} onPointerOut={pointerOff}>
      <Bevel size={[2.28,1.38,.085]} position={[0,2.69,0]} color="#303336" radius={.024}/>
      <Box size={[2.16,1.23,.012]} position={[0,2.70,.05]} color="#fbfbfb"/>
      <Label title="研究 · 想法 · 很多知识" subtitle="SUPER-LAZY-BOY" position={[0,2.70,.058]} size={[2.14,1.20]}/>
      <Box size={[.105,.37,.09]} position={[0,1.87,-.025]} color="#4c5054"/>
      <Bevel size={[.64,.035,.39]} position={[0,1.71,.03]} color="#55595d" radius={.018}/>
      <Cylinder r={.008} h={.012} position={[1.03,2.075,.052]} rotation={[Math.PI/2,0,0]} color="#e8ecef"/>
      {children}
    </group>
    <Bevel size={[1.33,.055,.43]} position={[-.12,1.725,.39]} color="#3b3e42" radius={.025}/>
    {Array.from({length:5},(_,row)=>Array.from({length:16},(_,col)=><Box key={row+":"+col} size={[.062,.016,.052]} position={[-.72+col*.079,1.759,.22+row*.073]} color="#666a6d"/>))}
    <Bevel size={[.22,.085,.34]} position={[1.0,1.75,.40]} color="#4d5155" radius={.07}/>
    <Box size={[.008,.012,.09]} position={[1.0,1.795,.32]} color="#272a2e"/>
    <Bevel size={[.56,1.08,.87]} position={[1.08,.57,-.10]} color="#363a3e" radius={.025}/>
    <Box size={[.47,.93,.012]} position={[1.08,.59,.344]} color="#303438"/>
    {Array.from({length:8},(_,i)=><Box key={i} size={[.35,.012,.014]} position={[1.08,.83+i*.026,.356]} color="#484d52"/>)}
    <mesh position={[1.24,.39,.358]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.035,.006,8,24]}/>{material("#a4acb0",.3)}</mesh>
  </group>;
}
function Chair() {
  const cloth=useSurface("fabric");
  return <group position={[0,0,1.90]} rotation={[0,.12,0]}>
    <Bevel size={[.91,.15,.89]} position={[0,1.04,0]} color="#5f6b65" radius={.06}/>
    <Bevel size={[.87,1.01,.12]} position={[0,1.59,.38]} color="#6e7a72" radius={.05}/>
    {[-.51,.51].map(x=><group key={x}><Cylinder h={.35} r={.024} position={[x,1.25,.02]} color="#757e79"/><Bevel size={[.11,.05,.56]} position={[x,1.44,.04]} color="#3d4843" radius={.022}/></group>)}
    <mesh position={[0,1.58,.449]}><planeGeometry args={[.78,.87]}/><meshStandardMaterial color="#64746a" map={cloth} bumpMap={cloth} bumpScale={.012} roughness={.98}/></mesh>
    <Box size={[.53,.08,.06]} position={[0,1.22,.33]} color="#40474a"/>
    <Cylinder h={.79} r={.055} position={[0,.57,0]} color="#565e62"/>
    <Cylinder h={.12} r={.12} position={[0,.20,0]} color="#363c40"/>
    {Array.from({length:5},(_,i)=>{
      const a=i*Math.PI*2/5;
      return <group key={i} rotation={[0,a,0]}>
        <Box size={[.09,.075,.59]} position={[0,.17,.28]} color="#454c50"/>
        <Cylinder h={.11} r={.073} position={[0,.095,.55]} rotation={[0,0,Math.PI/2]} color="#3b4246"/>
      </group>;
    })}
  </group>;
}
function BookVisual({record,w,h,detail=false}:{record?:RoomRecord;w:number;h:number;detail?:boolean}) {
  return <BookObject record={record} w={w} h={h} detail={detail}/>;
}
function Book({record,w,h,position,onClick}:{record?:RoomRecord;w:number;h:number;position:Vec3;onClick:()=>void}) {
  const [hover,setHover]=useState(false),anchor=useRecordAnchor(record,w,h);
  return <group ref={anchor.ref} position={position} visible={!anchor.hidden} onClick={e=>{e.stopPropagation();if(e.delta<4){pointerOff();record?anchor.select():onClick();}}} onPointerOver={e=>{pointerOn(e);setHover(true);}} onPointerOut={()=>{pointerOff();setHover(false);}}>
    <group position={[0,0,hover?.045:0]}><BookVisual record={record} w={w} h={h}/></group>
  </group>;
}
function Bookcase({records,onRecord,onBlank,page,owner,onOpenBooks,active=false}:{records:RoomRecord[];onRecord:(r:RoomRecord)=>void;onBlank:Props["onBlank"];page:number;owner:boolean;onOpenBooks?:()=>void;active?:boolean}) {
  const books=records.filter(r=>r.kind==="book");
  const bySlot=new Map(books.map((r,i)=>[r.slot>=0?r.slot:i,r]));
  return <group position={[-1.9,0,-3.75]}>
    <Box size={[4.80,4.26,.045]} position={[0,2.15,-.35]} color="#eeeeeb"/>
    {[-2.42,2.42].map(x=><Box key={x} size={[.10,4.38,.70]} position={[x,2.19,0]}/>)}
    {Array.from({length:6},(_,i)=><Box key={i} size={[4.80,.075,.70]} position={[0,.15+i*.82,0]}/>)}
    <OakPanel size={[4.78,.08,.62]} position={[0,.095,0]}/>
    <Box size={[.065,4.12,.65]} position={[.7,2.2,0]} color="#f2f3f0"/>
    {Array.from({length:90},(_,i)=>{
      const row=Math.floor(i/18),col=i%18,slot=page*96+i;
      const widths=[.17,.22,.14,.20,.27,.16,.23,.18,.26,.15,.19,.21,.16,.24,.18,.22,.14,.27];
      const groupStart=col<12?0:12;
      const x=(col<12?-2.28:.81)+widths.slice(groupStart,col).reduce((sum,w)=>sum+w+.035,0)+widths[col]/2;
      const record=bySlot.get(slot);
      return <Book key={slot} record={record} w={widths[col]} h={.55+(i*13%9)*.016} position={[x,.20+row*.82,.03]} onClick={()=>record?onRecord(record):owner&&onBlank("book",slot)}/>;
    })}
    {onOpenBooks&&<BookStack records={books} active={active} onOpen={onOpenBooks}/>}
    {[
      {p:[.10,.055,1.40],yaw:.37,w:.10},
      {p:[.79,.047,.77],yaw:-.31,w:.084},
      {p:[-.58,.056,2.00],yaw:-.13,w:.10},
    ].map((item,i)=>{const slot=page*96+93+i,record=bySlot.get(slot);return <group key={slot} position={item.p as Vec3} rotation={[0,item.yaw,0]}><group rotation={[0,0,Math.PI/2]} scale={[1,1,1.65]}><Book record={record} w={item.w} h={.64} position={[0,-.32,0]} onClick={()=>record?onRecord(record):owner&&onBlank("book",slot)}/></group></group>;})}
  </group>;
}
function Tape({record,position,onClick,slot=0}:{record?:RoomRecord;position:Vec3;onClick:()=>void;slot?:number}) {
  const anchor=useRecordAnchor(record,.125,.48),[hover,setHover]=useState(false);
  return <group ref={anchor.ref} position={[position[0],position[1]+.24,position[2]]} visible={!anchor.hidden} onClick={e=>{e.stopPropagation();if(e.delta<4){pointerOff();record?anchor.select():onClick();}}} onPointerOver={e=>{pointerOn(e);setHover(true);}} onPointerOut={()=>{pointerOff();setHover(false);}}>
    <group position={[0,0,hover?.04:0]}><TapeCase record={record} slot={slot}/></group>
    {hover&&record&&<Html center position={[0,.38,.2]} style={{pointerEvents:'none'}}><TapeTitle record={record} slot={slot}/></Html>}
    {!record&&<Box size={[.065,.10,.004]} position={[0,-.08,.161]} color="#cdd0cd"/>}
  </group>;
}
function CassetteBody(){
  return <group>
    <Bevel size={[.74,.10,.43]} color="#353a3d" radius={.01}/>
    <Box size={[.62,.008,.25]} position={[0,.055,-.035]} color="#798082"/>
    {[-.18,.18].map(x=><group key={x}><Cylinder r={.092} h={.012} position={[x,.065,-.035]} color="#282e31"/><Cylinder r={.032} h={.014} position={[x,.075,-.035]} color="#b4b9b8"/>{[0,1,2,3,4,5].map(i=><Box key={i} size={[.008,.013,.051]} position={[x+Math.sin(i*Math.PI/3)*.029,.078,-.035+Math.cos(i*Math.PI/3)*.029]} color="#939c97"/>)}</group>)}
    <Box size={[.47,.009,.08]} position={[0,.056,.14]} color="#e5e6df"/>
  </group>;
}
function Cassette() {
  return <group position={[1.50,1.44,.01]} rotation={[0,-.08,0]}>
    <Bevel size={[.74,.10,.43]} position={[0,.06,0]} color="#353a3d" radius={.01}/>
    <Box size={[.62,.008,.25]} position={[0,.115,-.035]} color="#798082"/>
    {[-.18,.18].map(x=><group key={x}><Cylinder r={.092} h={.012} position={[x,.125,-.035]} color="#282e31"/><Cylinder r={.032} h={.014} position={[x,.135,-.035]} color="#b4b9b8"/></group>)}
    <Box size={[.47,.009,.08]} position={[0,.116,.14]} color="#e5e6df"/>
  </group>;
}
function Cinema({records,onRecord,onBlank,page,owner,onClick,children,drawer}:{records:RoomRecord[];onRecord:(r:RoomRecord)=>void;onBlank:Props["onBlank"];page:number;owner:boolean;onClick:()=>void;children:ReactNode;drawer?:ReactNode}) {
  const entities=filmEntities(records),bySlot=new Map(entities.map(entity=>[entity.slot,entity]));
  const keepsakes=keepsakeFilms(entities),keptIds=new Set(keepsakes.map(entity=>entity.record.id));
  const screen=useSurface("screen");
  return <group position={[3.20,0,-3.75]}>
    <Box size={[4.25,1.35,.04]} position={[0,.75,-.26]} color="#e7e9e5"/>
    {[-2.16,2.16].map(x=><Box key={x} size={[.09,1.40,.65]} position={[x,.70,0]}/>)}
    {[.10,.72,1.36].map(y=><Box key={y} size={[4.30,.075,.65]} position={[0,y,0]}/>)}
    {Array.from({length:56},(_,i)=>{
      const slot=page*56+i,record=bySlot.get(slot)?.record;
      if(record&&keptIds.has(record.id))return null;
      return <Tape key={slot} slot={slot} record={record} position={[-1.98+(i%28)*.146,.15+Math.floor(i/28)*.62,.02]} onClick={()=>record?onRecord(record):owner&&onBlank("movie",slot)}/>;
    })}
    <OakPanel size={[4.34,.06,.68]} position={[0,1.42,0]}/>
    <OakPanel size={[4.25,.08,.59]} position={[0,.055,0]}/>
    <Cassette/>
    {keepsakes.map((entity,i)=>{
      const positions:Vec3[]=[[-1.76,1.5175,.11],[-1.73,1.645,.10],[-1.75,1.7725,.10],[1.53,.10,.67],[1.57,.22,.64],[1.12,.085,1.04]];
      return <group key={entity.record.id} position={positions[i]} rotation={[0,[-.12,.04,.16,-.24,-.15,.23][i],Math.PI/2]}><Tape slot={entity.slot} record={entity.record} position={[0,-.24,0]} onClick={()=>onRecord(entity.record)}/></group>;
    })}
    {drawer}
    <group onClick={e=>{e.stopPropagation();if(e.delta<4)onClick();}} onPointerOver={pointerOn} onPointerOut={pointerOff}>
      <Cylinder h={4.15} r={.025} position={[-1.99,2.15,-.20]} color="#9da4a6"/>
      <Cylinder h={4.15} r={.025} position={[1.99,2.15,-.20]} color="#9da4a6"/>
      <Cylinder h={4.34} r={.055} position={[0,4.25,-.17]} rotation={[0,0,Math.PI/2]} color="#b2b7b8"/>
      <Box size={[4.10,2.35,.025]} position={[0,3.05,-.16]} color="#a9aca6"/>
      <mesh position={[0,3.05,-.14]} receiveShadow><planeGeometry args={[4.02,2.27,32,16]}/><meshStandardMaterial map={screen} roughness={.96} bumpMap={screen} bumpScale={.004}/></mesh>
      <Bevel size={[4.40,.16,.19]} position={[0,4.27,-.17]} color="#e2e4df" radius={.04}/>
      {[-2.19,2.19].map(x=><Box key={x} size={[.025,.17,.20]} position={[x,4.27,-.17]} color="#929b97"/>)}
      <Cylinder h={4.12} r={.035} position={[0,1.89,-.16]} rotation={[0,0,Math.PI/2]} color="#b2b7b8"/>
      <Label title="一个人的放映室" subtitle="选一盘电影，留下一段记忆。" position={[0,3.05,-.122]} size={[3.90,2.20]} transparent/>
      {children}
    </group>
  </group>;
}
function SavedModel({record}:{record:RoomRecord}) {
  const {scene}=useGLTF(record.modelUrl||assetUrl(record.modelKey));
  const clone=useMemo(()=>{
    const group=scene.clone(true);
    const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    group.position.sub(center);group.position.y+=size.y/2;
    const wrapper=new THREE.Group();wrapper.add(group);
    wrapper.scale.setScalar(record.modelScale/Math.max(size.x,size.y,size.z));
    wrapper.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
    return wrapper;
  },[scene,record.modelScale]);
  const placements:Record<string,Vec3>={"books-top":[-2.0,4.36,-3.75],"books-middle":[-.30,2.70,-3.34],"cinema-left":[1.80,1.48,-3.69],"cinema-right":[4.75,1.48,-3.69]};
  return <group position={placements[record.modelPlacement]||placements["books-middle"]} rotation={[0,record.modelRotation*Math.PI/180,0]}><primitive object={clone}/></group>;
}
function Furniture({props}:{props:Props}) {
  return <RecordMotionProvider request={props.recordRequest} records={props.records} activeBookId={props.activeBookId} loadedTapeId={props.loadedTapeId} zone={props.zone} viewRevision={props.viewRevision} skipRevision={props.skipRevision} onSelect={props.onSelect} onComplete={props.onRecord} onStatus={props.onMotionStatus} renderBook={(record,w,h)=><BookVisual record={record} w={w} h={h} detail/>} renderTape={()=> <CassetteBody/>}>
    <group position={[-3.50,0,.55]} rotation={[0,Math.PI/2,0]}><Desk onClick={()=>props.onZone("office")}>
      <Html transform position={[0,2.70,.067]} distanceFactor={1} occlude style={{pointerEvents:props.zone==="office"?"auto":"none"}}><div className="monitor-content" inert={props.zone!=="office"} onClick={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>{props.computer}</div></Html>
    </Desk><Chair/></group>
    <GuestbookBoard data={props.guestbookData} onOpen={props.onGuestbook}/>
    <RoomAccessories playing={!!props.loadedTapeId}/>
    <Bookcase records={props.records} page={props.bookPage} onRecord={props.onRecord} onBlank={props.onBlank} owner={props.owner} onOpenBooks={props.onOpenBooks} active={props.zone==="books"&&!props.navigationLocked}/>
    <Cinema records={props.records} page={props.filmPage} onRecord={props.onRecord} onBlank={props.onBlank} owner={props.owner} onClick={()=>props.onZone("cinema")} drawer={<MemoryDrawer active={props.zone==='cinema'} locked={props.navigationLocked} opening={props.drawerOpening} request={props.drawerRequest} onRequest={props.onDrawerRequest} onOpened={props.onOpenLibrary}/> }>
      {props.zone==="cinema"&&<Html transform position={[0,3.05,-.105]} distanceFactor={1} occlude><div className={"projection-content"+(props.playbackBusy?" projection-loading":"")} onClick={e=>e.stopPropagation()}>{props.projection}</div></Html>}
    </Cinema>
    {props.records.filter(r=>r.modelVisible&&(r.modelKey||r.modelUrl)).map(record=><Suspense key={record.id} fallback={null}><SavedModel record={record}/></Suspense>)}
  </RecordMotionProvider>;
}
export default function RoomScene(props:Props) {
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  if(!ready)return null;
  return <Canvas className="room-canvas" inert={props.guestbookOpen} shadows frameloop="demand" dpr={[1,1.7]} camera={{position:ROOM_VIEWS.overview.camera,fov:38,near:.1,far:100}}
    gl={{antialias:true,alpha:false,powerPreference:"high-performance"}} onCreated={({gl})=>{gl.setClearColor("#ffffff");gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.0;}}>
    <color attach="background" args={["#ffffff"]}/>
    <fog attach="fog" args={["#ffffff",25,50]}/>
    <StudioLight/>
    <ambientLight intensity={.50}/><hemisphereLight args={["#ffffff","#dadbd6",.75]}/>
    <directionalLight position={[-7,11,8]} intensity={1.85} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-normalBias={.04} shadow-bias={-.0001}/>
    <directionalLight position={[7,5,3]} intensity={.25}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]}><planeGeometry args={[200,200]}/><meshBasicMaterial color="#ffffff" toneMapped={false}/></mesh>
    <Suspense fallback={null}>{props.bookArchiveOpen?<BookArchive records={props.records} layer={props.bookLayer} locked={props.navigationLocked} owner={props.owner} request={props.recordRequest} activeBookId={props.activeBookId} viewRevision={props.viewRevision} skipRevision={props.skipRevision} onSelect={props.onSelect} onRecord={props.onRecord} onStatus={props.onMotionStatus} onBlank={slot=>props.onBlank("book",slot)}/>:props.libraryOpen?<FilmArchive records={props.records} cabinet={props.filmPage} onPick={props.onSelect} locked={props.navigationLocked}/>:<Furniture props={props}/>}</Suspense>
    <SoftShadows size={18} samples={12} focus={.3}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.004,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.18}/></mesh>
    {props.guestbookOpen&&<GuestbookCamera/>}
    {!props.guestbookOpen&&!props.libraryOpen&&!props.bookArchiveOpen&&<RoomNavigation zone={props.zone} revision={props.viewRevision} locked={props.navigationLocked} onZone={props.onZone}/>}
  </Canvas>;
}
export function ReviewScene({item}:{item:string}) {
  const glasses=useMemo(()=>item==="glasses"?createAviators():null,[item]);
  useEffect(()=>()=>{glasses?.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});},[glasses]);
  const ground=item==="sofa"?-.60:item==="glasses"?-.28:item==="books"?-2.20:item==="cinema"?-2.15:item==="chair"?-1.15:-1.74;
  return <Canvas key={item} shadows frameloop="demand" dpr={[1,1.5]} camera={{position:item==="glasses"?[1.7,.90,2.5]:item==="sofa"?[2.8,2.2,-3.8]:item==="books"||item==="cinema"?[6,4.2,7]:[4,3.0,5],fov:40}}>
    <color attach="background" args={["#ffffff"]}/><StudioLight/><ambientLight intensity={.8}/><hemisphereLight args={["#fff","#cfd4d2",.8]}/><directionalLight position={[3,7,5]} intensity={2.5} castShadow shadow-mapSize={[1024,1024]}/>
    <Center>{item==="glasses"?<primitive object={glasses!}/>:item==="sofa"?<LazySofa standalone/>:item==="desk"?<Desk/>:item==="chair"?<Chair/>:item==="books"?<Bookcase records={[]} page={0} onRecord={()=>{}} onBlank={()=>{}} owner={false}/>:<Cinema records={[]} page={0} onRecord={()=>{}} onBlank={()=>{}} owner={false} onClick={()=>{}}>{null}</Cinema>}</Center>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,ground,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.18}/></mesh>
    <CameraControls makeDefault minDistance={item==="glasses"?1.3:3} maxDistance={item==="glasses"?6:16} minPolarAngle={.3} maxPolarAngle={1.6}/>
  </Canvas>;
}

