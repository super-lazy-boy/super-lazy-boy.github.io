"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {CameraControls,CameraControlsImpl,Html} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {bookEntities,bookSize,bookAddress,type BookEntity} from '@/lib/book-library';
import {recordCover,type RoomRecord} from '@/lib/room-types';
import {RecordMotionProvider,useRecordAnchor,type RecordRequest,type MotionStatus} from './RecordMotion';
import BookObject from './BookObject';

function Block({size,position,color='#f4f3ed'}:{size:[number,number,number];position:[number,number,number];color?:string}){return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.75}/></mesh>;}
function LayerBook({entity,x,locked,onBlank}:{entity?:BookEntity;x:number;locked:boolean;onBlank:()=>void}){
 const [hover,setHover]=useState(false),record=entity?.record,size=bookSize(entity?.slot||0),anchor=useRecordAnchor(record,size.width,size.height);
 return <group ref={anchor.ref} visible={!anchor.hidden} position={[x,.21,0]} onPointerOver={e=>{e.stopPropagation();if(!locked){setHover(true);document.body.style.cursor='pointer';}}} onPointerOut={()=>{setHover(false);document.body.style.cursor='';}} onClick={e=>{e.stopPropagation();if(!locked&&e.delta<4){document.body.style.cursor='';record?anchor.select():onBlank();}}}>
  <group position={[0,0,hover?.065:0]}><BookObject record={record} w={size.width} h={size.height} detail={hover}/></group>
  {hover&&record&&<Html position={[0,1.12,.45]} center style={{pointerEvents:'none'}}><div className="tape-title book-hover-card">{recordCover(record)&&<img src={recordCover(record)} alt=""/>}<div><span>{bookAddress(entity!.slot)}</span><strong>{record.title}</strong></div></div></Html>}
 </group>;
}
function LayerCamera({layer}:{layer:number}){
 const controls=useRef<CameraControlsImpl>(null),{camera,size}=useThree();
 useEffect(()=>{
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=38;camera.updateProjectionMatrix();}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,distance=Math.max(5.3,6.8/(size.width/size.height));
  void controls.current?.setLookAt(.25,1.45,distance,0,.62,0,!reduced);
 },[camera,size.width,size.height,layer]);
 return <CameraControls ref={controls} makeDefault minDistance={3.3} maxDistance={16} minPolarAngle={1.12} maxPolarAngle={1.65} minAzimuthAngle={-.18} maxAzimuthAngle={.18} mouseButtons={{left:0,middle:CameraControlsImpl.ACTION.DOLLY,right:0,wheel:CameraControlsImpl.ACTION.DOLLY}} touches={{one:0,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:0}}/>;
}
type Props={records:RoomRecord[];layer:number;locked:boolean;owner:boolean;request:RecordRequest;activeBookId:string|null;viewRevision:number;skipRevision:number;onSelect:(r:RoomRecord)=>void;onRecord:(r:RoomRecord)=>void;onStatus:(s:MotionStatus)=>void;onBlank:(slot:number)=>void};
export default function BookArchive(props:Props){
 const shelf=useRef<THREE.Group>(null),previous=useRef(props.layer),settling=useRef(false),{invalidate}=useThree();
 useEffect(()=>{if(previous.current===props.layer)return;const direction=Math.sign(props.layer-previous.current);previous.current=props.layer;if(shelf.current){shelf.current.position.y=matchMedia('(prefers-reduced-motion: reduce)').matches?0:direction*.26;settling.current=true;invalidate();}},[props.layer,invalidate]);
 useFrame((_,delta)=>{if(!settling.current||!shelf.current)return;shelf.current.position.y=THREE.MathUtils.damp(shelf.current.position.y,0,11,Math.min(delta,.05));if(Math.abs(shelf.current.position.y)<.001){shelf.current.position.y=0;settling.current=false;}else invalidate();});
 const entities=useMemo(()=>bookEntities(props.records),[props.records]),row=entities.filter(e=>e.layer===props.layer),byColumn=new Map(row.map(e=>[e.column,e]));
 const widths=Array.from({length:18},(_,i)=>bookSize(props.layer*18+i).width),total=widths.reduce((sum,w)=>sum+w+.045,0)-.045;
 useEffect(()=>()=>{document.body.style.cursor='';},[props.layer]);
 return <RecordMotionProvider records={props.records} request={props.request} activeBookId={props.activeBookId} loadedTapeId={null} zone="books" viewRevision={props.viewRevision} skipRevision={props.skipRevision} onSelect={props.onSelect} onComplete={props.onRecord} onStatus={props.onStatus} renderBook={(r,w,h)=><BookObject record={r} w={w} h={h} detail/>} renderTape={()=>null}>
  <group ref={shelf}>
   <Block size={[4.85,1.10,.045]} position={[0,.68,-.28]} color="#e7e7df"/>
   {[-2.46,2.46].map(x=><Block key={x} size={[.09,1.16,.68]} position={[x,.70,0]}/>)}
   <Block size={[5.0,.08,.74]} position={[0,.16,0]} color="#c4ad91"/>
   <Block size={[4.86,.065,.68]} position={[0,1.25,0]}/>
   {Array.from({length:18},(_,i)=>{const x=-total/2+widths.slice(0,i).reduce((sum,w)=>sum+w+.045,0)+widths[i]/2;return <LayerBook key={props.layer*18+i} entity={byColumn.get(i)} x={x} locked={props.locked} onBlank={()=>props.owner&&props.onBlank(props.layer*18+i)}/>;})}
  </group>
  <LayerCamera layer={props.layer}/>
 </RecordMotionProvider>;
}

