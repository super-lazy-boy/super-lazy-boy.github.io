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
/** Curated spine palette: every book snaps to it, so a shelf reads as one colour story. */
const SPINE_PALETTE = ["#8f3f37", "#2f3f52", "#c8b07a", "#5c6b52", "#7b5a63", "#d9cdb4", "#3f4a44", "#b98a5e", "#8fa3a8"];
function paletteColour(hex: string) {
  const target = new THREE.Color(hex);
  let best = SPINE_PALETTE[0], bestDistance = Infinity;
  for (const candidate of SPINE_PALETTE) {
    const c = new THREE.Color(candidate);
    const d = (c.r - target.r) ** 2 + (c.g - target.g) ** 2 + (c.b - target.b) ** 2;
    if (d < bestDistance) { bestDistance = d; best = candidate; }
  }
  return best;
}

/** Three print layouts keep a full shelf from looking like one repeated label. */
function spineLayout(record:RoomRecord){
 let hash=0;for(const char of record.id)hash=(hash*31+char.charCodeAt(0))%997;
 return hash%3;
}
function drawSpineTitle(ctx:CanvasRenderingContext2D,text:string,centerY:number,maxHeight:number,ink:string,font:string,weight:number){
 const chars=Array.from(text);
 const columns=Math.max(1,Math.ceil(chars.length/14)),rows=Math.ceil(chars.length/columns);
 const size=Math.min(46,148/columns,maxHeight/rows*.92);
 ctx.fillStyle=ink;ctx.font=`${weight} ${size}px ${font}`;ctx.textAlign='center';ctx.textBaseline='middle';
 const step=Math.min(size*1.06,maxHeight/rows);
 chars.forEach((char,i)=>{
  const column=Math.floor(i/rows),row=i%rows;
  const x=96+(columns-1)*size*.54-column*size*1.08;
  ctx.fillText(char,x,centerY+(row-(rows-1)/2)*step,size*.98);
 });
}
function useBookSpine(record:RoomRecord|undefined){
 const texture=useMemo(()=>{
  if(!record)return null;
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=768;
  const ctx=canvas.getContext('2d')!,color=paletteColour(record.color||'#e7e4dc');
  ctx.fillStyle=color;ctx.fillRect(0,0,192,768);
  const rgb=new THREE.Color(color),luminance=rgb.r*.2126+rgb.g*.7152+rgb.b*.0722;
  const ink=luminance>.45?'#2f3431':'#faf8ef';
  const accent=luminance>.45?'#2f3431':'#efe9d8';
  const layout=spineLayout(record);
  const title=record.title.split(/\s[:：]\s|：/)[0];
  const author=(record.creator||'').trim();

  if(layout===1){
   // two-tone band across the head
   ctx.globalAlpha=.9;ctx.fillStyle=accent;ctx.fillRect(0,0,192,120);ctx.globalAlpha=1;
   ctx.fillStyle=ink;ctx.font='600 15px "Bahnschrift", "Microsoft YaHei", sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ROOM PRESS',96,58,150);
   drawSpineTitle(ctx,title,430,470,ink,'"Microsoft YaHei", "SimSun", sans-serif',500);
  }else if(layout===2){
   // inset frame, small caps, year at the foot
   ctx.strokeStyle=ink+'66';ctx.lineWidth=2;ctx.strokeRect(20,26,152,716);
   drawSpineTitle(ctx,title,378,520,ink,'"SimSun", "Microsoft YaHei", serif',500);
   ctx.fillStyle=ink;ctx.globalAlpha=.7;ctx.font='400 15px "Bahnschrift", sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(record.year||'—',96,706);
   ctx.globalAlpha=1;
  }else{
   // classic rules top and bottom
   drawSpineTitle(ctx,title,390,540,ink,'"Microsoft YaHei", "SimSun", sans-serif',500);
   ctx.globalAlpha=.5;ctx.fillStyle=ink;ctx.fillRect(28,30,136,2);ctx.fillRect(28,736,136,2);ctx.globalAlpha=1;
  }

  if(author){
   ctx.globalAlpha=.75;ctx.fillStyle=ink;
   ctx.font='400 17px "Microsoft YaHei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(author.slice(0,10),96,layout===2?660:700,140);ctx.globalAlpha=1;
  }
  // faint vertical wear along the hinge
  const wear=ctx.createLinearGradient(0,0,192,0);
  wear.addColorStop(0,'rgba(0,0,0,.07)');wear.addColorStop(.12,'rgba(255,255,255,.05)');
  wear.addColorStop(.5,'rgba(0,0,0,0)');wear.addColorStop(1,'rgba(0,0,0,.06)');
  ctx.fillStyle=wear;ctx.fillRect(0,0,192,768);

  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
 },[record?.title,record?.color,record?.creator,record?.year,record?.id]);
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

