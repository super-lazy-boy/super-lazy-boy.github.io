"use client";
import {useEffect,useMemo,useState} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {recordCover,type RoomRecord} from '@/lib/room-types';

const covers=new Map<string,Promise<THREE.Texture|null>>();
function useCover(record:RoomRecord|undefined,enabled:boolean){
 const [texture,setTexture]=useState<THREE.Texture|null>(null),{invalidate}=useThree();
 const url=enabled&&record?recordCover(record):'';
 useEffect(()=>{
  let alive=true;setTexture(null);if(!url)return;
  const source=location.hostname==='127.0.0.1'&&url.startsWith('https://super-lazy-boy.github.io/media/')?url.replace('https://super-lazy-boy.github.io',''):url;
  if(!covers.has(source))covers.set(source,new Promise(resolve=>new THREE.TextureLoader().load(source,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;resolve(t);},undefined,()=>resolve(null))));
  void covers.get(source)!.then(t=>{if(alive){setTexture(t);invalidate();}});
  return()=>{alive=false;};
 },[url,invalidate]);
 return texture;
}
function useBookSpine(record:RoomRecord|undefined){
 const texture=useMemo(()=>{
  if(!record)return null;
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=768;
  const ctx=canvas.getContext('2d')!,color=record.color||'#e7e4dc';
  ctx.fillStyle=color;ctx.fillRect(0,0,192,768);
  const rgb=new THREE.Color(color),light=rgb.r*.2126+rgb.g*.7152+rgb.b*.0722;
  ctx.fillStyle=light>.45?'#313532':'#faf8ef';
  const chars=Array.from(record.title),columns=Math.max(1,Math.ceil(chars.length/14)),font=Math.min(43,150/(columns+1));
  ctx.font=`500 ${font}px "Microsoft YaHei",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  chars.forEach((char,i)=>{const column=Math.floor(i/14),row=i%14;ctx.fillText(char,96+(columns-1)*font*.52-column*font*1.04,84+row*43,font);});
  ctx.globalAlpha=.38;ctx.fillRect(24,24,144,2);ctx.fillRect(24,720,144,2);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
 },[record?.title,record?.color]);
 useEffect(()=>()=>texture?.dispose(),[texture]);return texture;
}
export default function BookObject({record,w,h,detail=false}:{record?:RoomRecord;w:number;h:number;detail?:boolean}){
 const spine=useBookSpine(record),cover=useCover(record,detail),color=record?.color||'#fafaf7';
 return <group>
  <mesh position={[0,h/2,-.012]} castShadow receiveShadow><boxGeometry args={[w-.022,h-.025,.40]}/><meshStandardMaterial color="#eeece4" roughness={.94}/></mesh>
  {[-1,1].map(side=><mesh key={side} position={[side*(w/2-.006),h/2,0]} castShadow><boxGeometry args={[.012,h,.46]}/><meshStandardMaterial color={color} roughness={.72}/></mesh>)}
  <mesh position={[0,h/2,.218]} castShadow><boxGeometry args={[w,h,.025]}/><meshStandardMaterial color={color} roughness={.65}/></mesh>
  {spine&&<mesh position={[0,h/2,.232]}><planeGeometry args={[w-.008,h-.01]}/><meshBasicMaterial map={spine} toneMapped={false}/></mesh>}
  {cover&&[-1,1].map(side=><mesh key={side} position={[side*(w/2+.001),h/2,0]} rotation={[0,side*Math.PI/2,0]}><planeGeometry args={[.46,h]}/><meshBasicMaterial map={cover} toneMapped={false}/></mesh>)}
  {detail&&Array.from({length:6},(_,i)=><mesh key={i} position={[-w*.36+i*w*.14,h/2,-.214]}><boxGeometry args={[.001,h-.04,.001]}/><meshStandardMaterial color="#d5d2c8"/></mesh>)}
 </group>;
}

