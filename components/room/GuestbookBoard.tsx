"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {Html,RoundedBox} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {NOTE_COLORS,type GuestNote,type GuestbookData} from '@/lib/guestbook';

function Paper({note,index}:{note?:GuestNote;index:number}){
 const texture=useMemo(()=>{
  const c=document.createElement('canvas');c.width=384;c.height=384;const ctx=c.getContext('2d')!;
  ctx.fillStyle=note?NOTE_COLORS[note.color]:['#f3e6ba','#dce3cf','#e9ddd5'][index%3];ctx.fillRect(0,0,384,384);
  ctx.fillStyle='#4a5043';ctx.font='24px Microsoft YaHei,sans-serif';
  const chars=Array.from(note?.body|| (index===0?'来过，留一句。':''));
  for(let row=0;row<5;row++)ctx.fillText(chars.slice(row*10,row*10+10).join(''),34,78+row*44,316);
  if(note){ctx.font='17px sans-serif';ctx.fillStyle='#68705f';ctx.fillText(note.authorName,34,345,300);}
  else if(index===0){ctx.font='16px sans-serif';ctx.fillText('NOTES LEFT HERE',34,335);}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;return map;
 },[note?.body,note?.authorName,note?.color,index]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={[[-.30,.28,-.29,.29][index],[.20,.18,-.24,-.23][index],.047]} rotation={[0,0,[-.035,.045,.025,-.035][index]]}>
  <mesh castShadow><planeGeometry args={[.45,.43]}/><meshStandardMaterial map={texture} roughness={.98}/></mesh>
  <mesh position={[0,.203,.003]}><planeGeometry args={[.13,.05]}/><meshStandardMaterial color="#f7f4e8" transparent opacity={.65} roughness={.9}/></mesh>
 </group>;
}
export function GuestbookCamera(){
 const {camera,invalidate}=useThree(),target=useRef(new THREE.Vector3(-3.95,2.45,2.95));
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]),end=useMemo(()=>new THREE.Vector3(-.65,2.62,2.95),[]),focal=useRef(new THREE.Vector3());
 useEffect(()=>{camera.getWorldDirection(focal.current);focal.current.multiplyScalar(3.3).add(camera.position);},[camera]);
 useEffect(()=>{invalidate();},[invalidate]);
 useFrame((_,delta)=>{
  const alpha=reduced?1:1-Math.exp(-Math.min(delta,.05)*5.3);
  camera.position.lerp(end,alpha);focal.current.lerp(target.current,alpha);camera.lookAt(focal.current);
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=THREE.MathUtils.lerp(camera.fov,40,alpha);camera.updateProjectionMatrix();}
  if(camera.position.distanceToSquared(end)>.000001||focal.current.distanceToSquared(target.current)>.000001)invalidate();
 });return null;
}
export default function GuestbookBoard({data,onOpen}:{data:GuestbookData|null;onOpen:()=>void}){
 const [hover,setHover]=useState(false),notes=data?.notes.slice(0,4)||[];
 return <group position={[-3.95,2.45,2.95]} rotation={[0,Math.PI/2,0]} onClick={e=>{e.stopPropagation();if(e.delta<4)onOpen();}} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor='pointer';}} onPointerOut={()=>{setHover(false);document.body.style.cursor='';}}>
  <RoundedBox args={[1.23,1.05,.065]} radius={.025} smoothness={3} castShadow><meshStandardMaterial color={hover?'#baa17d':'#c4ad91'} roughness={.70}/></RoundedBox>
  <mesh position={[0,0,.036]} receiveShadow><planeGeometry args={[1.13,.95]}/><meshStandardMaterial color="#e3e4dc" roughness={1}/></mesh>
  {[0,1,2,3].map(index=><Paper key={notes[index]?.id||index} note={notes[index]} index={index}/>)}
  {[-.49,.49].map(x=><mesh key={x} position={[x,-1.46,-.03]} castShadow><boxGeometry args={[.035,1.90,.035]}/><meshStandardMaterial color="#c3c8c0" roughness={.5} metalness={.3}/></mesh>)}
  {[-.49,.49].map(x=><mesh key={x} position={[x,-2.40,-.01]} castShadow><boxGeometry args={[.11,.05,.45]}/><meshStandardMaterial color="#b6bdb3" roughness={.55}/></mesh>)}
  <Html transform position={[0,0,.08]} distanceFactor={1}><button className="guestbook-board-control" aria-label="打开桌边便签" onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)} onClick={e=>{e.stopPropagation();onOpen();}}/></Html>
 </group>;
}
