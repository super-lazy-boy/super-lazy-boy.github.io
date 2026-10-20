"use client";
import {useState} from 'react';
import {Html} from '@react-three/drei';
import type {RoomRecord} from '@/lib/room-types';
import BookObject from './BookObject';
export default function BookStack({records,active,onOpen}:{records:RoomRecord[];active:boolean;onOpen:()=>void}){
 const [hover,setHover]=useState(false),books=records.filter(r=>r.kind==='book').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
 return <group position={[0,.78,1.02]} onClick={e=>{e.stopPropagation();if(active&&e.delta<4)onOpen();}} onPointerOver={e=>{e.stopPropagation();if(active){setHover(true);document.body.style.cursor='pointer';}}} onPointerOut={()=>{setHover(false);document.body.style.cursor='';}}>
  <mesh position={[0,-.10,0]} castShadow receiveShadow><boxGeometry args={[.90,.06,.62]}/><meshStandardMaterial color="#c4ad91" roughness={.76}/></mesh>
  {[-.34,.34].flatMap(x=>[-.21,.21].map(z=><mesh key={`${x}:${z}`} position={[x,-.44,z]} castShadow><boxGeometry args={[.045,.62,.045]}/><meshStandardMaterial color="#dedfd9" roughness={.68}/></mesh>))}
  {[0,1,2].map(i=><group key={i} position={[i===1?.035:0,i*.105+(hover&&i===2?.035:0),i===2?(hover?.015:-.045):0]} rotation={[0,[-.18,.04,-.12][i],Math.PI/2]}><group position={[0,-.34,0]}><BookObject record={books[i]} w={.10} h={.68} detail={hover}/></group></group>)}
  <Html transform position={[0,.24,.29]} distanceFactor={1} style={{pointerEvents:active?'auto':'none'}}><button className="book-stack-control" aria-label="打开逐层书架" disabled={!active} onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)} onClick={e=>{e.stopPropagation();onOpen();}}/></Html>
 </group>;
}

