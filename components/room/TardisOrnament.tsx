"use client";
import {useEffect,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {CINEMA_LAYOUT} from '@/lib/cinema-layout';
import {createTardis,disposeTardis} from './models/tardis/createTardis';

export function TardisModel({height}:{height:number}){
 const {invalidate}=useThree();
 const model=useMemo(()=>{
  const object=createTardis({onTextureReady:invalidate}),bounds=new THREE.Box3().setFromObject(object),objectHeight=bounds.getSize(new THREE.Vector3()).y;
  object.scale.setScalar(height/objectHeight);
  return object;
 },[invalidate,height]);
 useLayoutEffect(()=>{
  model.updateWorldMatrix(true,true);
  // Preserve the approved wood grain/wear frequency when the miniature moves or scales.
  model.userData.wearFrameInverse.copy(model.matrixWorld).invert();model.userData.sculptRuntime.syncInstances?.();invalidate();
 },[model,invalidate]);
 useEffect(()=>()=>disposeTardis(model),[model]);
 return <primitive object={model} dispose={null}/>;
}

export default function TardisOrnament({onInspect,disabled=false}:{onInspect?:()=>void;disabled?:boolean}){
 const placement=CINEMA_LAYOUT.tardis,interactive=!!onInspect&&!disabled;
 useEffect(()=>()=>{document.body.style.cursor='';},[]);
 return <group name="cinema-tardis-keepsake" position={placement.position} rotation={[0,placement.yaw,0]}
  onClick={event=>{event.stopPropagation();if(interactive&&event.delta<4){document.body.style.cursor='';onInspect?.();}}}
  onPointerOver={event=>{event.stopPropagation();if(interactive)document.body.style.cursor='zoom-in';}}
  onPointerOut={()=>{document.body.style.cursor='';}}>
  <TardisModel height={placement.height}/>
  {interactive&&<mesh position={[0,placement.height/2,0]}><boxGeometry args={[.23,placement.height+.012,.23]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/></mesh>}
 </group>;
}
