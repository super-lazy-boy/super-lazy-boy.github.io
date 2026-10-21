"use client";
import {useEffect,useRef,useState} from 'react';
import {useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html,RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {memoryDrawerPose} from '@/lib/memory-drawer';
import {CINEMA_LAYOUT} from '@/lib/cinema-layout';

function Part({size,position,color='#eeeae1'}:{size:[number,number,number];position:[number,number,number];color?:string}){
 return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.72}/></mesh>;
}
export default function MemoryDrawer({active,locked,opening,request,onRequest,onOpened}:{active:boolean;locked:boolean;opening:boolean;request:number;onRequest:()=>void;onOpened:()=>void}){
 const tray=useRef<THREE.Group>(null),started=useRef<number|null>(null),lastRequest=useRef(request);
 const callback=useRef(onOpened);callback.current=onOpened;
 const reduced=useRef(false),[hover,setHover]=useState(false),{invalidate}=useThree();
 useEffect(()=>{
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{reduced.current=query.matches;invalidate();};update();
  query.addEventListener('change',update);return()=>query.removeEventListener('change',update);
 },[invalidate]);
 useEffect(()=>{
  if(!active||!opening){started.current=null;setHover(false);if(tray.current)tray.current.position.z=0;return;}
  if(request!==lastRequest.current){lastRequest.current=request;started.current=performance.now();invalidate();}
 },[request,active,opening,invalidate]);
 useEffect(()=>{invalidate();},[hover,invalidate]);
 useFrame((_,delta)=>{
  if(!tray.current)return;
  if(started.current===null){const end=hover&&active&&!locked?.04:0;tray.current.position.z=THREE.MathUtils.damp(tray.current.position.z,end,12,reduced.current?1:delta);if(Math.abs(tray.current.position.z-end)>.0001)invalidate();return;}
  const pose=memoryDrawerPose(performance.now()-started.current,reduced.current);
  tray.current.position.z=pose.extension;
  if(pose.complete){started.current=null;document.body.style.cursor='';callback.current();}
  else invalidate();
 });
 const over=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();if(active&&!locked){setHover(true);document.body.style.cursor='pointer';}};
 return <group position={[CINEMA_LAYOUT.drawerX,1.60,.015]} onClick={event=>{event.stopPropagation();if(active&&!locked&&event.delta<4)onRequest();}} onPointerOver={over} onPointerOut={()=>{setHover(false);document.body.style.cursor='';}}>
  <Part size={[.94,.025,.53]} position={[0,-.134,0]} color="#c4ae93"/>
  <Part size={[.94,.025,.53]} position={[0,.134,0]} color="#e9e6dc"/>
  {[-.456,.456].map(x=><Part key={x} size={[.027,.245,.53]} position={[x,0,0]}/>)}
  <Part size={[.89,.245,.025]} position={[0,0,-.253]}/>
  <group ref={tray}>
   <Part size={[.84,.015,.46]} position={[0,-.113,0]} color="#bda88b"/>
   {[-.412,.412].map(x=><Part key={x} size={[.018,.19,.46]} position={[x,-.013,0]} color="#c9b79b"/>)}
   <Part size={[.84,.18,.016]} position={[0,-.018,-.225]} color="#c9b79b"/>
   <Part size={[.89,.24,.035]} position={[0,0,.247]} color={hover?'#e5dece':'#ede9df'}/>
   <RoundedBox args={[.24,.028,.045]} position={[0,.025,.285]} radius={.009} smoothness={2} castShadow><meshStandardMaterial color={hover?'#77846e':'#8d9688'} roughness={.38} metalness={.35}/></RoundedBox>
   <Html transform position={[0,0,.32]} distanceFactor={1} style={{pointerEvents:active&&!locked?'auto':'none'}}><button className="drawer-control" aria-label="拉开录像带抽屉" disabled={!active||locked} onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)} onClick={event=>{event.stopPropagation();onRequest();}}/></Html>
   {Array.from({length:7},(_,index)=><group key={index} position={[0,-.065,-.17+index*.052]} rotation={[-.10+index*.012,0,0]}>
    <Part size={[.70,.12,.009]} position={[0,0,0]} color={index%2?'#eeeadd':'#ddd9c9'}/>
    <Part size={[.11,.025,.009]} position={[-.25+index*.08,.067,0]} color={['#8d9f8d','#c6ad7d','#929caa','#c1a393'][index%4]}/>
   </group>)}
  </group>
 </group>;
}
