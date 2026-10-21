"use client";
import {useEffect,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {CINEMA_LAYOUT} from '@/lib/cinema-layout';
import {createTardis,disposeTardis} from './models/tardis/createTardis';

export default function TardisOrnament(){
 const {invalidate}=useThree(),placement=CINEMA_LAYOUT.tardis;
 const model=useMemo(()=>{
  const object=createTardis({onTextureReady:invalidate}),bounds=new THREE.Box3().setFromObject(object),height=bounds.getSize(new THREE.Vector3()).y;
  object.scale.setScalar(placement.height/height);
  return object;
 },[invalidate,placement.height]);
 useLayoutEffect(()=>{
  model.updateWorldMatrix(true,true);
  // Preserve the approved wood grain/wear frequency when the miniature moves or scales.
  model.userData.wearFrameInverse.copy(model.matrixWorld).invert();model.userData.sculptRuntime.syncInstances?.();invalidate();
 },[model,invalidate]);
 useEffect(()=>()=>disposeTardis(model),[model]);
 return <group name="cinema-tardis-keepsake" position={placement.position} rotation={[0,placement.yaw,0]}><primitive object={model} dispose={null}/></group>;
}
