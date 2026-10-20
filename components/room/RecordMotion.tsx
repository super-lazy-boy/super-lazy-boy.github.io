"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RoomRecord, Zone } from "@/lib/room-types";

export type RecordRequest={id:string;revision:number}|null;
export type MotionStatus="book-out"|"book-return"|"tape-out"|"tape-insert"|null;
type Anchor={node:THREE.Group;width:number;height:number};
type Pose={position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3};
type Motion={record:RoomRecord;origin:Pose;width:number;height:number;phase:"take"|"hold"|"return";revision:number};
type MotionContextValue={register:(id:string,anchor:Anchor)=>()=>void;hiddenId:string|null;loadedId:string|null;select:(record:RoomRecord)=>void;loadingTape:boolean};
const Context=createContext<MotionContextValue>({register:()=>()=>{},hiddenId:null,loadedId:null,select:()=>{},loadingTape:false});
const smooth=(p:number)=>{const v=THREE.MathUtils.clamp(p,0,1);return v*v*(3-2*v);};
const bookEnd=(origin:Pose)=>origin.position.clone().add(new THREE.Vector3(0,Math.max(.14,1.55-origin.position.y),.93));
const bookRotation=(origin:Pose)=>{const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.12,-.52,.08));return Math.abs(origin.quaternion.z)>.45?tilt:origin.quaternion.clone().multiply(tilt);};
export function useRecordMotion(){return useContext(Context);}
export function useRecordAnchor(record:RoomRecord|undefined,width:number,height:number){
  const ref=useRef<THREE.Group>(null),motion=useRecordMotion();
  useLayoutEffect(()=>{if(record&&ref.current)return motion.register(record.id,{node:ref.current,width,height});},[record?.id,width,height,motion.register]);
  return {ref,hidden:!!record&&(motion.hiddenId===record.id||motion.loadedId===record.id),select:()=>record&&motion.select(record)};
}
function Actor({motion,renderBook,renderTape,onFinish,onStage}:{motion:Motion;renderBook:(record:RoomRecord,w:number,h:number)=>ReactNode;renderTape:()=>ReactNode;onFinish:()=>void;onStage:(status:MotionStatus)=>void}){
  const root=useRef<THREE.Group>(null),started=useRef(performance.now()),done=useRef(false),stage=useRef(-1);
  const {invalidate}=useThree();
  const isBook=motion.record.kind==="book",duration=motion.phase==="return"?.64:isBook?1.05:2.15;
  const start=motion.origin;
  useEffect(()=>{started.current=performance.now();done.current=false;stage.current=-1;invalidate();},[motion.phase,motion.revision,invalidate]);
  useFrame(()=>{
    const node=root.current;if(!node)return;
    const p=motion.phase==="hold"?1:Math.min((performance.now()-started.current)/(duration*1000),1);
    if(isBook){
      const t=motion.phase==="return"?1-smooth(p):smooth(p);
      node.position.lerpVectors(start.position,bookEnd(start),t);
      node.position.y+=Math.sin(t*Math.PI)*.045;
      node.quaternion.copy(start.quaternion).slerp(bookRotation(start),t);node.scale.copy(start.scale);
    }else{
      const pull=start.position.clone().add(new THREE.Vector3(0,.04,.67));
      const front=new THREE.Vector3(2.35,1.525,-2.91),inside=new THREE.Vector3(2.35,1.525,-3.79);
      const upright=start.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2));
      if(p<.28){node.position.lerpVectors(start.position,pull,smooth(p/.28));node.quaternion.copy(upright);node.scale.set(.65,1.25,.72);}
      else if(p<.73){const t=smooth((p-.28)/.45);node.position.lerpVectors(pull,front,t);node.position.y+=Math.sin(t*Math.PI)*.46;node.quaternion.copy(upright).slerp(new THREE.Quaternion(),t);node.scale.lerpVectors(new THREE.Vector3(.65,1.25,.72),new THREE.Vector3(1,1,1),t);}
      else{node.position.lerpVectors(front,inside,smooth((p-.73)/.24));node.quaternion.identity();node.scale.setScalar(1);}
      const next=p<.73?0:1;if(stage.current!==next){stage.current=next;onStage(next?"tape-insert":"tape-out");}
    }
    if(p===1&&motion.phase!=="hold"&&!done.current){done.current=true;onFinish();}
    if(motion.phase!=="hold"&&!done.current)invalidate();
  });
  return <group ref={root}>{isBook?renderBook(motion.record,motion.width,motion.height):renderTape()}</group>;
}
export function RecordMotionProvider({children,request,records,activeBookId,loadedTapeId,zone,viewRevision,skipRevision,onSelect,onComplete,onStatus,renderBook,renderTape}:{children:ReactNode;request:RecordRequest;records:RoomRecord[];activeBookId:string|null;loadedTapeId:string|null;zone:Zone;viewRevision:number;skipRevision:number;onSelect:(record:RoomRecord)=>void;onComplete:(record:RoomRecord)=>void;onStatus:(status:MotionStatus)=>void;renderBook:(record:RoomRecord,w:number,h:number)=>ReactNode;renderTape:()=>ReactNode}){
  const anchors=useRef(new Map<string,Anchor>()),latestRequest=useRef(0),lastView=useRef(viewRevision),lastSkip=useRef(skipRevision);
  const [motion,setMotion]=useState<Motion|null>(null),[reduced,setReduced]=useState(false);
  const current=useRef(motion);current.current=motion;
  const callbacks=useRef({onComplete,onStatus});callbacks.current={onComplete,onStatus};
  const register=useCallback((id:string,anchor:Anchor)=>{anchors.current.set(id,anchor);return()=>{if(anchors.current.get(id)===anchor)anchors.current.delete(id);};},[]);
  useEffect(()=>{const query=matchMedia("(prefers-reduced-motion: reduce)"),update=()=>setReduced(query.matches);update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[]);
  const finish=useCallback(()=>{
    const value=current.current;if(!value)return;
    if(value.phase==="return"){setMotion(null);callbacks.current.onStatus(null);return;}
    if(value.record.kind==="book")setMotion({...value,phase:"hold"});else setMotion(null);
    callbacks.current.onStatus(null);callbacks.current.onComplete(value.record);
  },[]);
  useEffect(()=>{
    if(request&&request.revision!==latestRequest.current){
      latestRequest.current=request.revision;lastView.current=viewRevision;
      const record=records.find(r=>r.id===request.id);if(!record){setMotion(null);callbacks.current.onStatus(null);return;}
      if(zone!==(record.kind==="book"?"books":"cinema")){setMotion(null);callbacks.current.onStatus(null);return;}
      const anchor=anchors.current.get(record.id);
      if(reduced||!anchor||record.id===loadedTapeId){setMotion(null);callbacks.current.onStatus(null);callbacks.current.onComplete(record);return;}
      anchor.node.updateWorldMatrix(true,false);
      const origin={position:anchor.node.getWorldPosition(new THREE.Vector3()),quaternion:anchor.node.getWorldQuaternion(new THREE.Quaternion()),scale:anchor.node.getWorldScale(new THREE.Vector3())};
      setMotion({record,origin,width:anchor.width,height:anchor.height,phase:"take",revision:request.revision});
      callbacks.current.onStatus(record.kind==="book"?"book-out":"tape-out");return;
    }
    if(viewRevision!==lastView.current){lastView.current=viewRevision;setMotion(null);callbacks.current.onStatus(null);}
  },[request,zone,viewRevision,records,reduced,loadedTapeId]);
  useEffect(()=>{const value=current.current;if(value?.phase==="hold"&&activeBookId!==value.record.id){if(reduced){setMotion(null);return;}setMotion({...value,phase:"return"});callbacks.current.onStatus("book-return");}},[activeBookId,motion?.phase,reduced]);
  useEffect(()=>{if(skipRevision!==lastSkip.current){lastSkip.current=skipRevision;if(current.current?.phase!=="hold")finish();}},[skipRevision,finish]);
  useEffect(()=>{if(reduced&&current.current&&current.current.phase!=="hold")finish();},[reduced,finish]);
  const value=useMemo(()=>({register,hiddenId:motion?.record.id||null,loadedId:loadedTapeId,select:onSelect,loadingTape:!!motion&&motion.record.kind!=="book"}),[register,motion,loadedTapeId,onSelect]);
  return <Context.Provider value={value}>{children}{motion&&<Actor key={motion.revision} motion={motion} renderBook={renderBook} renderTape={renderTape} onFinish={finish} onStage={status=>callbacks.current.onStatus(status)}/>}</Context.Provider>;
}
