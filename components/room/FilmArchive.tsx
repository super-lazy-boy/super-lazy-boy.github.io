"use client";
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {CameraControls,CameraControlsImpl,Html} from '@react-three/drei';
import {useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {filmEntities,type FilmEntity} from '@/lib/film-library';
import type {RoomRecord} from '@/lib/room-types';
import {TapeLabel,TapeTitle} from './TapeSpine';

const BAY=4.85;
const pose=(entity:FilmEntity):[number,number,number]=>[entity.cabinet*BAY-1.98+entity.column*.146,.39+entity.row*.62,.02];
function ShelfBox({size,position,color='#f6f5f0'}:{size:[number,number,number];position:[number,number,number];color?:string}){
 return <mesh position={position} receiveShadow castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.76}/></mesh>;
}
function Cabinet({index}:{index:number}){
 return <group position={[index*BAY,0,0]}>
  <ShelfBox size={[4.25,1.35,.04]} position={[0,.75,-.26]} color="#e1e3dc"/>
  {[-2.16,2.16].map(x=><ShelfBox key={x} size={[.09,1.40,.65]} position={[x,.70,0]}/>)}
  {[.10,.72,1.36].map(y=><ShelfBox key={y} size={[4.30,.075,.65]} position={[0,y,0]}/>)}
  <ShelfBox size={[4.34,.045,.68]} position={[0,1.42,0]} color="#c4ad91"/>
  <ShelfBox size={[4.28,.065,.62]} position={[0,.048,0]} color="#c4ad91"/>
  <Html position={[0,1.75,.02]} center><div className="cabinet-number">{String(index+1).padStart(2,'0')}<span>MEMORIES, KEPT.</span></div></Html>
 </group>;
}
function ArchiveCamera({cabinet}:{cabinet:number}){
 const ref=useRef<CameraControlsImpl>(null),{size}=useThree();
 useEffect(()=>{
  const x=cabinet*BAY,distance=Math.max(4.7,7.0/(size.width/size.height));
  void ref.current?.setLookAt(x+.10,1.20,distance,x,.76,0,true);
 },[cabinet,size.width,size.height]);
 return <CameraControls ref={ref} makeDefault minDistance={2.7} maxDistance={18} minPolarAngle={1.28} maxPolarAngle={1.8} minAzimuthAngle={-.15} maxAzimuthAngle={.15} mouseButtons={{left:0,middle:CameraControlsImpl.ACTION.DOLLY,right:0,wheel:CameraControlsImpl.ACTION.DOLLY}} touches={{one:0,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:0}}/>;
}
export default function FilmArchive({records,cabinet,onPick,locked=false}:{records:RoomRecord[];cabinet:number;onPick:(record:RoomRecord)=>void;locked?:boolean}){
 const entities=useMemo(()=>filmEntities(records),[records]);
 const bodies=useRef<THREE.InstancedMesh>(null),[hovered,setHovered]=useState<FilmEntity|null>(null);
 const bayCount=Math.max(1,Math.floor((entities.at(-1)?.slot||0)/56)+1);
 useLayoutEffect(()=>{
  const mesh=bodies.current;if(!mesh)return;
  const matrix=new THREE.Matrix4();
  entities.forEach((entity,i)=>mesh.setMatrixAt(i,matrix.makeTranslation(...pose(entity))));
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
 },[entities]);
 useEffect(()=>{setHovered(null);document.body.style.cursor='';},[cabinet]);
 const pick=(event:ThreeEvent<MouseEvent>)=>{event.stopPropagation();if(locked||event.delta>4||event.instanceId===undefined)return;onPick(entities[event.instanceId].record);};
 return <group>
  {Array.from({length:bayCount},(_,index)=>Math.abs(index-cabinet)<=2&&<Cabinet key={index} index={index}/>)}
  {/* Every record owns one permanent mesh instance, including cabinets outside the camera view. */}
  <instancedMesh ref={bodies} visible={entities.length>0} args={[undefined,undefined,Math.max(1,entities.length)]} frustumCulled={false} onClick={pick}
   onPointerMove={e=>{e.stopPropagation();if(e.instanceId!==undefined&&!locked){setHovered(entities[e.instanceId]);document.body.style.cursor='pointer';}}}
   onPointerOut={()=>{setHovered(null);document.body.style.cursor='';}}>
   <boxGeometry args={[.125,.48,.31]}/><meshStandardMaterial color="#303638" roughness={.62}/>
  </instancedMesh>
  {entities.filter(e=>e.cabinet===cabinet).map(entity=><group key={entity.record.id} position={pose(entity)}><TapeLabel record={entity.record} slot={entity.slot}/></group>)}
  {hovered&&hovered.cabinet===cabinet&&<Html position={[pose(hovered)[0],1.10+hovered.row*.34,.5]} center style={{pointerEvents:'none'}}><TapeTitle record={hovered.record} slot={hovered.slot}/></Html>}
  <ArchiveCamera cabinet={cabinet}/>
 </group>;
}
