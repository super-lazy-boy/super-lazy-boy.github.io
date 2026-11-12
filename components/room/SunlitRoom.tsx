"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import type {Zone} from '@/lib/room-types';
import {ASSET_ZONES} from '@/lib/room-navigation';
import release from '@/public/room-version.json';

const URL='./models/sunlit-room/room.glb?v='+release.modelSha256.slice(0,12);
type Props={zone?:Zone;night?:boolean;playing?:boolean;lamps?:{desk:boolean;floor:boolean};onInspectArt?:()=>void;part?:string};
export default function SunlitRoom({zone='overview',night=false,playing=false,lamps={desk:true,floor:true},onInspectArt,part}:Props){
  const {scene}=useGLTF(URL),{gl,invalidate}=useThree(),mix=useRef(0),power=useRef(0);
  const data=useMemo(()=>{
    const root=scene.clone(true),materials=new Map<string,THREE.MeshStandardMaterial>(),curtains:THREE.Group[]=[];
    const meshes:THREE.Mesh[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
    for(const object of meshes){
      const group=String(object.userData.asset_group||object.name.split(' | ')[0]);
      if(part&&group!==part&&!(part==='desk'&&['desk details','desk lamp','computer tower','flowers jasmine'].includes(group))){object.removeFromParent();continue;}
      object.userData.roomZone=ASSET_ZONES[group]||'overview';
      const role=group.includes('lamp glow')?group.split(' ')[0]:group==='projector glow'?'projector':'';
      object.castShadow=!role;object.receiveShadow=true;
      object.material=(Array.isArray(object.material)?object.material:[object.material]).map(original=>{
        const key=original.uuid+'|'+role;
        if(!materials.has(key)){
          const mat=(original as THREE.MeshStandardMaterial).clone();mat.envMapIntensity=.65;mat.userData.emitterRole=role;
          if(role){mat.emissive.set(role==='projector'?'#d2e6ff':'#ffdfac');mat.emissiveIntensity=0;}
          if(/flower|botanical|greenery|curtain|lamp/.test(group))mat.side=THREE.DoubleSide;
          if(mat.map)mat.map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());materials.set(key,mat);
        }
        return materials.get(key)!;
      });
      if(object.material.length===1)object.material=object.material[0];
    }
    if(!part){
      root.updateMatrixWorld(true);
      for(const object of meshes){
        const group=String(object.userData.asset_group||'');if(!group.startsWith('curtain '))continue;
        const pivot=new THREE.Group();pivot.position.z=group==='curtain left'?-2.125:3.325;root.add(pivot);root.updateMatrixWorld(true);pivot.attach(object);curtains.push(pivot);
      }
    }
    if(part==='starry night')root.rotation.y=-Math.PI/2;
    return {root,materials:[...materials.values()],curtains};
  },[scene,part,gl]);
  useEffect(()=>{gl.shadowMap.needsUpdate=true;invalidate();},[data,night,playing,lamps.desk,lamps.floor,gl,invalidate]);
  useEffect(()=>()=>data.materials.forEach(m=>m.dispose()),[data]);
  useFrame((_,dt)=>{
    const reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a=reduced?1:1-Math.exp(-Math.min(dt,.1)*4),target=night&&!part?1:0,lit=playing&&!part?1:0;
    mix.current=THREE.MathUtils.lerp(mix.current,target,a);power.current=THREE.MathUtils.lerp(power.current,lit,a);
    for(const curtain of data.curtains)curtain.scale.z=1+mix.current*3.7;
    for(const mat of data.materials){
      const role=mat.userData.emitterRole;
      if(role==='projector')mat.emissiveIntensity=power.current*2.2;
      else if(role){const enabled=role==='desk'?lamps.desk:role==='floor'?lamps.floor:true;mat.emissiveIntensity=enabled?mix.current*(playing?.20:.65):0;}
    }
    if(Math.abs(mix.current-target)>.001||Math.abs(power.current-lit)>.001){gl.shadowMap.needsUpdate=true;invalidate();}
  });
  const groupOf=(e:ThreeEvent<MouseEvent|PointerEvent>)=>String(e.object.userData.asset_group||'');
  return <primitive object={data.root} onClick={(e:ThreeEvent<MouseEvent>)=>{if(groupOf(e)==='starry night'&&onInspectArt&&e.delta<4){e.stopPropagation();onInspectArt();}}}
    onPointerOver={(e:ThreeEvent<PointerEvent>)=>{if(groupOf(e)==='starry night'&&onInspectArt)document.body.style.cursor='zoom-in';}}
    onPointerOut={()=>{document.body.style.cursor='';}}/>;
}
if(typeof window!=='undefined')useGLTF.preload(URL);
