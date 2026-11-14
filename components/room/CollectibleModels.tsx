"use client";
import {useEffect,useMemo} from 'react';
import {useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {COLLECTIBLE_PLACEMENTS,NEW_COLLECTIBLE_IDS,type CollectibleId,type NewCollectibleId} from '@/lib/collectibles';
import versions from '@/public/collectibles-version.json';
import {accelerateRoomObject} from '@/lib/room-raycast';
import {inspectionTransform} from '@/lib/collectible-inspection';
import {useRoomModel,collectibleModelURL} from '@/lib/room-model-resources';

export function CollectibleModel({id,onInspect,locked=false,showSupport=true}:{id:NewCollectibleId;onInspect?:(id:CollectibleId)=>void;locked?:boolean;showSupport?:boolean}){
  const {scene}=useRoomModel(collectibleModelURL(id)),{gl,invalidate}=useThree();
  const root=useMemo(()=>{const clone=scene.clone(true);clone.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return clone;},[scene]);
  useEffect(()=>accelerateRoomObject(root),[root]);
  useEffect(()=>{root.traverse(o=>{if(o.userData.display_support)o.visible=showSupport;});gl.shadowMap.needsUpdate=true;invalidate();},[root,showSupport,gl,invalidate]);
  return <primitive object={root} onClick={onInspect?(e:ThreeEvent<MouseEvent>)=>{if(!locked&&e.delta<4){e.stopPropagation();document.body.style.cursor='';onInspect(id);}}:undefined}
    onPointerOver={onInspect?(e:ThreeEvent<PointerEvent>)=>{if(!locked){e.stopPropagation();document.body.style.cursor='zoom-in';}}:undefined}
    onPointerOut={onInspect?()=>{document.body.style.cursor='';}:undefined}/>;
}
export function RoomCollectibles({locked,onInspect,ids=NEW_COLLECTIBLE_IDS}:{locked:boolean;onInspect:(id:CollectibleId)=>void;ids?:readonly NewCollectibleId[]}){
  return <>{ids.map(id=>{const p=COLLECTIBLE_PLACEMENTS[id];return <group key={id} position={p.position} rotation={[0,p.yaw,0]} scale={p.scale} userData={{roomZone:p.zone,collectibleId:id}}><CollectibleModel id={id} locked={locked} onInspect={onInspect}/></group>;})}</>;
}
export function InspectCollectible({id,showSupport=true}:{id:NewCollectibleId;showSupport?:boolean}){
  const {scale,offsetY}=inspectionTransform(versions[id].dimensions);
  return <group scale={scale} position={[0,offsetY,0]}><CollectibleModel id={id} showSupport={showSupport}/></group>;
}
