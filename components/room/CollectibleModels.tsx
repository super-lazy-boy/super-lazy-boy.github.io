"use client";
import {useEffect,useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import {useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {COLLECTIBLE_PLACEMENTS,NEW_COLLECTIBLE_IDS,type CollectibleId,type NewCollectibleId} from '@/lib/collectibles';
import versions from '@/public/collectibles-version.json';

const assetURL=(id:NewCollectibleId)=>'./models/collectibles/'+id+'.glb?v='+versions[id].sha256.slice(0,12);
export function CollectibleModel({id,onInspect,locked=false}:{id:NewCollectibleId;onInspect?:(id:CollectibleId)=>void;locked?:boolean}){
  const {scene}=useGLTF(assetURL(id)),{gl,invalidate}=useThree();
  const root=useMemo(()=>{const clone=scene.clone(true);clone.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return clone;},[scene]);
  useEffect(()=>{gl.shadowMap.needsUpdate=true;invalidate();},[root,gl,invalidate]);
  return <primitive object={root} onClick={(e:ThreeEvent<MouseEvent>)=>{if(onInspect&&!locked&&e.delta<4){e.stopPropagation();document.body.style.cursor='';onInspect(id);}}}
    onPointerOver={(e:ThreeEvent<PointerEvent>)=>{if(onInspect&&!locked){e.stopPropagation();document.body.style.cursor='zoom-in';}}}
    onPointerOut={()=>{if(onInspect)document.body.style.cursor='';}}/>;
}
export function RoomCollectibles({locked,onInspect}:{locked:boolean;onInspect:(id:CollectibleId)=>void}){
  return <>{NEW_COLLECTIBLE_IDS.map(id=>{const p=COLLECTIBLE_PLACEMENTS[id];return <group key={id} position={p.position} rotation={[0,p.yaw,0]} scale={p.scale} userData={{roomZone:p.zone,collectibleId:id}}><CollectibleModel id={id} locked={locked} onInspect={onInspect}/></group>;})}</>;
}
export function InspectCollectible({id}:{id:NewCollectibleId}){
  const max=Math.max(...versions[id].dimensions);
  return <group scale={3/max}><CollectibleModel id={id}/></group>;
}
