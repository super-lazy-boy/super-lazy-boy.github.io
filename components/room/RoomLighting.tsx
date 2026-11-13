"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {SoftShadows} from '@react-three/drei';
import * as THREE from 'three';
import {LIGHT_ANCHORS,lightProfile} from '@/lib/room-lighting';
import {StudioLight} from './RoomDecor';

export default function RoomLighting({night,screening,lamps,beamActive}:{night:boolean;screening:boolean;lamps:{desk:boolean;floor:boolean};beamActive:boolean}){
  const {scene,size,gl,invalidate}=useThree();
  const sun=useRef<THREE.DirectionalLight>(null),fill=useRef<THREE.DirectionalLight>(null),ambient=useRef<THREE.AmbientLight>(null),sky=useRef<THREE.HemisphereLight>(null);
  const fixtures=useMemo(()=>{
    const root=new THREE.Group(),lights:Record<string,THREE.Light>={};
    for(const [key,color,angle] of [['desk','#ffd2a1',.86],['floor','#ffd2a0',.88],['picture','#ffe5bb',.72],['projector','#e5edff',.36],['guest','#ffd29b',.85],['console','#ffcd92',1.10]] as const){
      const a=LIGHT_ANCHORS[key],light=new THREE.SpotLight(color,0,15,angle,.65,2);light.position.fromArray(a.position);light.target.position.fromArray(a.target);
      light.castShadow=['desk','floor','guest','console'].includes(key);light.shadow.mapSize.set(key==='floor'?1024:512,key==='floor'?1024:512);light.shadow.bias=-.00015;light.shadow.normalBias=.008;light.shadow.camera.near=.06;
      root.add(light,light.target);lights[key]=light;
    }
    LIGHT_ANCHORS.shelves.forEach((p,i)=>{for(const [j,dx] of [-1.15,1.15].entries()){const l=new THREE.PointLight('#ffd4a1',0,2.8,2);l.position.fromArray(p);l.position.x+=dx;root.add(l);lights['shelf'+i+'-'+j]=l;}});
    LIGHT_ANCHORS.media.forEach((p,i)=>{const light=new THREE.PointLight('#ffcf98',0,2.8,2);light.position.fromArray(p);root.add(light);lights['media'+i]=light;});
    return {root,lights};
  },[]);
  useEffect(()=>{invalidate();},[night,screening,lamps.desk,lamps.floor,beamActive,invalidate]);
  useEffect(()=>{const previous=gl.shadowMap.autoUpdate;gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;return()=>{gl.shadowMap.autoUpdate=previous;};},[gl]);
  useEffect(()=>()=>Object.values(fixtures.lights).forEach(light=>{if(light instanceof THREE.SpotLight)light.shadow.dispose();light.dispose();}),[fixtures]);
  useFrame((_,dt)=>{
    const p=lightProfile(night,screening,lamps),a=matchMedia('(prefers-reduced-motion: reduce)').matches?1:1-Math.exp(-Math.min(dt,.1)*4);let moving=false;
    const apply=(light:THREE.Light|null,value:number)=>{if(!light)return;light.intensity=THREE.MathUtils.lerp(light.intensity,value,a);if(Math.abs(light.intensity-value)>.001)moving=true;};
    apply(sun.current,p.sun);apply(fill.current,p.fill);apply(ambient.current,p.ambient);apply(sky.current,p.hemisphere);
    for(const key of ['desk','floor','picture','projector','guest','console'] as const)apply(fixtures.lights[key],key==='projector'&&!beamActive?0:p[key]);
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)apply(fixtures.lights['shelf'+i+'-'+j],p.shelf);
    for(let i=0;i<2;i++)apply(fixtures.lights['media'+i],p.media);
    scene.environmentIntensity=THREE.MathUtils.lerp(scene.environmentIntensity,p.environment,a);if(Math.abs(scene.environmentIntensity-p.environment)>.001)moving=true;
    if(moving)gl.shadowMap.needsUpdate=true;
    if(moving)invalidate();
  },-1);
  return <>
    <StudioLight/>
    <ambientLight ref={ambient} intensity={.10}/><hemisphereLight ref={sky} args={['#eaf2ff','#b6a085',.60]}/>
    <directionalLight ref={sun} position={[-13,8,1.8]} intensity={2.75} color="#fff0d7" castShadow
      shadow-mapSize={[size.width<650?1024:2048,size.width<650?1024:2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}
      shadow-camera-near={.5} shadow-camera-far={40} shadow-normalBias={.015} shadow-bias={-.00008}/>
    <directionalLight ref={fill} position={[4,7,9]} intensity={.38} color="#f1f5ff"/>
    <primitive object={fixtures.root}/><SoftShadows size={8} samples={8} focus={.5}/>
  </>;
}
