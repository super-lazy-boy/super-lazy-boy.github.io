"use client";
import {useEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {filmStyle,filmAddress,type FilmStyle} from '@/lib/film-library';
import type {RoomRecord} from '@/lib/room-types';

// Keep rasterized lettering when returning from a cabinet; GPU textures remain per-canvas and disposable.
const spineCanvases=new Map<string,HTMLCanvasElement>();

const themes:Record<FilmStyle,{paper:string;ink:string;accent:string;font:string;weight:number}>={
 scifi:{paper:'#183238',ink:'#dcefe8',accent:'#82cabb',font:'"Bahnschrift", "Microsoft YaHei", sans-serif',weight:600},
 epic:{paper:'#353a2f',ink:'#ece3ba',accent:'#c7ae71',font:'"SimSun", "Songti SC", Georgia, serif',weight:700},
 western:{paper:'#bd9b70',ink:'#352a20',accent:'#714d36',font:'"Georgia", "SimSun", serif',weight:700},
 noir:{paper:'#e1ded4',ink:'#242c32',accent:'#9c5145',font:'"SimSun", "Songti SC", serif',weight:700},
 action:{paper:'#3d4446',ink:'#efeee3',accent:'#c29b66',font:'"Bahnschrift", "Microsoft YaHei", sans-serif',weight:800},
 horror:{paper:'#3a343b',ink:'#ece2dc',accent:'#a77e7c',font:'"FangSong", "SimSun", serif',weight:700},
 animation:{paper:'#a9b8a2',ink:'#273a34',accent:'#eee2b7',font:'"Microsoft YaHei", sans-serif',weight:700},
 comedy:{paper:'#e1c478',ink:'#3b3932',accent:'#839b8d',font:'"KaiTi", "STKaiti", serif',weight:700},
 documentary:{paper:'#d1d4c5',ink:'#3d4941',accent:'#7c8e78',font:'"Bahnschrift", "Microsoft YaHei", sans-serif',weight:500},
 drama:{paper:'#d3bdb0',ink:'#443c3a',accent:'#927e79',font:'"SimSun", "Songti SC", Georgia, serif',weight:600},
};

/** Upright Chinese lettering stays legible on a narrow spine; long titles use several columns. */
export function paintTapeSpine(canvas:HTMLCanvasElement,record:RoomRecord,slot:number){
 canvas.width=192;canvas.height=768;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const theme=themes[filmStyle(record)];
 ctx.fillStyle=theme.paper;ctx.fillRect(0,0,192,768);
 ctx.fillStyle=theme.accent;ctx.fillRect(0,0,192,12);ctx.fillRect(13,28,3,700);
 ctx.strokeStyle=theme.ink+'55';ctx.lineWidth=1;ctx.strokeRect(22,23,150,721);
 ctx.fillStyle=theme.ink;ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='500 18px "Bahnschrift", sans-serif';ctx.fillText('V H S',98,56);
 const title=record.title.trim();
 if(/[\u3400-\u9fff]/u.test(title)){
  const chars=Array.from(title.replace(/\s+/g,''));
  const columns=Math.ceil(chars.length/6),rows=Math.ceil(chars.length/columns);
  const size=Math.min(128,142/columns,525/rows);
  ctx.font=`${theme.weight} ${size}px ${theme.font}`;
  for(let i=0;i<chars.length;i++){
   const col=Math.floor(i/rows),row=i%rows;
   const x=98+(columns-1-col*2)*(150/columns)/2;
   const step=Math.min(112,525/rows);
   const y=355+(row-(rows-1)/2)*step;
   if(filmStyle(record)==='epic'){ctx.strokeStyle=theme.accent;ctx.lineWidth=.8;ctx.strokeText(chars[i],x,y);}
   ctx.fillText(chars[i],x,y);
  }
 }else{
  ctx.save();ctx.translate(99,355);ctx.rotate(-Math.PI/2);
  let size=77;ctx.font=`${theme.weight} ${size}px ${theme.font}`;
  while(ctx.measureText(title).width>525&&size>23){size-=2;ctx.font=`${theme.weight} ${size}px ${theme.font}`;}
  ctx.fillText(title,0,0);ctx.restore();
 }
 ctx.fillStyle=theme.accent;ctx.fillRect(36,650,120,3);
 ctx.fillStyle=theme.ink;ctx.font='500 21px "Bahnschrift", sans-serif';ctx.fillText(record.year||'COLLECTION',98,681);
 ctx.font='400 17px "Bahnschrift", sans-serif';ctx.fillText(String(slot+1).padStart(4,'0'),98,720);
 // Restrained print texture, not distressed or cartoon lettering.
 ctx.globalAlpha=.035;
 for(let i=0;i<130;i++){const x=(i*71+slot*19)%192,y=(i*131+slot*31)%768;ctx.fillRect(x,y,1,1);}
 ctx.globalAlpha=1;
}

export function useTapeTexture(record:RoomRecord|undefined,slot:number){
 const {invalidate}=useThree();
 const texture=useMemo(()=>{
  if(!record)return null;
  const key=JSON.stringify([record.id,record.title,record.year,filmStyle(record),slot]);
  let canvas=spineCanvases.get(key);
  if(!canvas){canvas=document.createElement('canvas');paintTapeSpine(canvas,record,slot);}
  spineCanvases.delete(key);spineCanvases.set(key,canvas);
  if(spineCanvases.size>80)spineCanvases.delete(spineCanvases.keys().next().value!);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
 },[record?.id,record?.title,record?.year,record?.tags,slot]);
 useEffect(()=>{invalidate();},[texture,invalidate]);
 useEffect(()=>()=>texture?.dispose(),[texture]);return texture;
}
export function TapeLabel({record,slot}:{record?:RoomRecord;slot:number}){
 const texture=useTapeTexture(record,slot);
 // Blank -> printed changes Three's shader defines, so replace the material as well as its map.
 return <mesh position={[0,0,.158]}><planeGeometry args={[.114,.453]}/><meshBasicMaterial key={texture?'printed':'blank'} map={texture} color={record?'#ffffff':'#5a605d'} toneMapped={false}/></mesh>;
}
export function TapeCase({record,slot=0}:{record?:RoomRecord;slot?:number}){
 return <group><mesh castShadow receiveShadow><boxGeometry args={[.125,.48,.31]}/><meshStandardMaterial color="#303638" roughness={.58}/></mesh><TapeLabel record={record} slot={slot}/><mesh position={[0,.234,.161]}><boxGeometry args={[.121,.008,.003]}/><meshStandardMaterial color="#6b706b" roughness={.56}/></mesh></group>;
}
export function TapeTitle({record,slot}:{record:RoomRecord;slot:number}){
 return <div className="tape-title"><span>{filmAddress(slot)}</span><strong>{record.title}</strong><small>{record.year}</small></div>;
}
