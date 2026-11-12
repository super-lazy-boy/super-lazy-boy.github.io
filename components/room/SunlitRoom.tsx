"use client";

import {useEffect,useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import {useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import type {Zone} from '@/lib/room-types';
import release from '@/public/room-version.json';

const URL='./models/sunlit-room/room.glb?v='+release.modelSha256.slice(0,12);
const zones:Record<string,Zone>={desk:'office','desk details':'office',chair:'office',bookshelf:'books','media cabinet':'cinema',player:'cinema','projection screen':'cinema',lounge:'cinema','side table':'cinema',projector:'cinema','guest corner':'guestbook'};

/** The editable source and deterministic build live in design/ and scripts/blender/. */
export default function SunlitRoom({onZone,part}:{onZone?:(zone:Zone)=>void;part?:string}){
  const {scene}=useGLTF(URL),{gl,invalidate}=useThree();
  const model=useMemo(()=>{
    const root=scene.clone(true);
    root.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const group=String(object.userData.asset_group||object.name.split(' | ')[0]);
      object.visible=!part||group===part||(part==='desk'&&group==='desk details');
      object.castShadow=true;object.receiveShadow=true;
      for(const mat of Array.isArray(object.material)?object.material:[object.material]){
        if(mat instanceof THREE.MeshStandardMaterial){
          mat.envMapIntensity=.65;
          if(group==='botanicals'||group==='window')mat.side=THREE.DoubleSide;
          if(mat.map)mat.map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());
        }
      }
    });
    return root;
  },[scene,part,gl]);
  useEffect(()=>{invalidate();},[model,invalidate]);
  const zoneOf=(event:ThreeEvent<PointerEvent|MouseEvent>)=>zones[String(event.object.userData.asset_group||event.object.name.split(' | ')[0])];
  return <primitive object={model} onClick={(e:ThreeEvent<MouseEvent>)=>{const zone=zoneOf(e);if(zone&&onZone&&e.delta<4){e.stopPropagation();onZone(zone);}}}
    onPointerOver={(e:ThreeEvent<PointerEvent>)=>{if(onZone&&zoneOf(e))document.body.style.cursor='pointer';}}
    onPointerOut={()=>{document.body.style.cursor='';}}/>;
}

useGLTF.preload(URL);
