"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { createLounge, loungeTop, loungeSide } from "./models/lounge";
import { useRecordMotion } from "./RecordMotion";
type V=[number,number,number];
const OAK="#c4ad8e",DARK="#3c4243";
function Block({size,position=[0,0,0],color="#f4f3ef",rotation=[0,0,0],radius=.015}:{size:V;position?:V;color?:string;rotation?:V;radius?:number}) {
  return <RoundedBox args={size} position={position} rotation={rotation} radius={Math.min(radius,...size.map(v=>v/2-.0005))} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.64}/></RoundedBox>;
}
function Round({r=.05,h=.1,position=[0,0,0],color=DARK,rotation=[0,0,0],metal=0}:{r?:number;h?:number;position?:V;color?:string;rotation?:V;metal?:number}) {
  return <mesh position={position} rotation={rotation} castShadow><cylinderGeometry args={[r,r,h,32]}/><meshStandardMaterial color={color} roughness={.38} metalness={metal}/></mesh>;
}
export function Cable({points,color=DARK,r=.009}:{points:V[];color?:string;r?:number}) {
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[JSON.stringify(points)]);
  return <mesh castShadow><tubeGeometry args={[curve,36,r,6,false]}/><meshStandardMaterial color={color} roughness={.82}/></mesh>;
}
export function useSurface(kind:"wood"|"fabric"|"screen") {
  const texture=useMemo(()=>{
    const canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;const c=canvas.getContext("2d")!;
    c.fillStyle=kind==="wood"?"#c4ad8e":kind==="screen"?"#f9f9f7":"#a7a49a";c.fillRect(0,0,256,256);
    let seed=27;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    if(kind==="wood"){for(let i=0;i<400;i++){const x=random()*256;c.strokeStyle=`rgba(89,64,38,${random()*.1})`;c.lineWidth=random()*.8+.2;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+random()*5,80,x-3,170,x+random()*5,256);c.stroke();}}
    else {for(let i=0;i<256;i++){c.strokeStyle=i%2?"#ffffff13":"#20202012";c.lineWidth=.45;c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.moveTo(0,i);c.lineTo(256,i);c.stroke();}}
    const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(kind==="wood"?2:6,kind==="wood"?1:6);map.colorSpace=THREE.SRGBColorSpace;return map;
  },[kind]);
  useEffect(()=>()=>texture.dispose(),[texture]);return texture;
}
export function StudioLight() {
  const {gl,scene,invalidate}=useThree();
  useEffect(()=>{const room=new RoomEnvironment(),generator=new THREE.PMREMGenerator(gl),target=generator.fromScene(room,.025);scene.environment=target.texture;scene.environmentIntensity=.45;room.dispose();generator.dispose();invalidate();return()=>{scene.environment=null;target.dispose();};},[gl,scene,invalidate]);
  return null;
}
export function OakPanel({size,position,rotation=[0,0,0]}:{size:V;position:V;rotation?:V}) {
  const map=useSurface("wood");return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial map={map} roughness={.68}/></mesh>;
}
export function Plant({position=[0,0,0],scale=1}:{position?:V;scale?:number}) {
  return <group position={position} scale={scale}>
    <mesh position={[0,.20,0]} castShadow><cylinderGeometry args={[.21,.155,.40,40]}/><meshStandardMaterial color="#e8e4db" roughness={.93}/></mesh>
    <Round r={.199} h={.025} position={[0,.397,0]} color="#4a4034"/>
    {Array.from({length:9},(_,i)=>{const a=i*2.4,h=.55+(i%4)*.17;const x=Math.sin(a)*.22,z=Math.cos(a)*.23;return <group key={i}>
      <Cable points={[[0,.37,0],[x*.35,h*.8,z*.35],[x,h,z]]} color="#5f7150" r={.009}/>
      <mesh position={[x,h,z]} rotation={[.35*Math.cos(a),a,.38*Math.sin(a)]} scale={[.09,.26,.018]} castShadow><sphereGeometry args={[1,12,16]}/><meshStandardMaterial color={i%2?"#536d46":"#718457"} roughness={.75}/></mesh>
      <mesh position={[x*.5,h*.70,z*.5]} rotation={[.7,a+1,.8]} scale={[.075,.17,.015]} castShadow><sphereGeometry args={[1,10,12]}/><meshStandardMaterial color="#70845b" roughness={.7}/></mesh>
    </group>;})}
    <Round r={.23} h={.018} position={[0,.013,0]} color="#dad4c7"/>
  </group>;
}
export function Speaker({position=[0,0,0],scale=1}:{position?:V;scale?:number}) {
  return <group position={position} scale={scale}>
    <Block size={[.32,.52,.31]} position={[0,.26,0]} color="#343a3a"/>
    <Block size={[.285,.48,.012]} position={[0,.26,.16]} color="#292f2f"/>
    {[{r:.097,y:.21},{r:.045,y:.40}].map(({r,y})=><group key={y}><Round r={r} h={.017} position={[0,y,.175]} rotation={[Math.PI/2,0,0]} color="#161e20"/><mesh position={[0,y,.188]}><torusGeometry args={[r*.83,.006,8,32]}/><meshStandardMaterial color="#68716e" metalness={.4} roughness={.45}/></mesh><Round r={r*.35} h={.020} position={[0,y,.19]} rotation={[Math.PI/2,0,0]} color="#515a57"/></group>)}
    <Round r={.009} h={.012} position={[.10,.07,.18]} rotation={[Math.PI/2,0,0]} color="#bbcab7"/>
  </group>;
}
function DeskLamp() {
  return <group position={[1.55,1.70,-.52]}>
    <Round r={.20} h={.028} position={[0,.014,0]} color="#b9b8b1" metal={.7}/>
    <Cable points={[[0,.03,0],[0,.36,0],[.03,.63,-.05],[-.25,.82,-.02]]} color="#6c7371" r={.018}/>
    <mesh position={[-.25,.79,-.02]} rotation={[0,0,.3]} castShadow><coneGeometry args={[.19,.18,40,1,true]}/><meshStandardMaterial color="#d9d4c9" side={THREE.DoubleSide} metalness={.3} roughness={.5}/></mesh>
    <Round r={.16} h={.01} position={[-.25,.71,-.02]} color="#fff4d5"/>
  </group>;
}
export function DeskDetails() {
  return <group>
    <Block size={[2.0,.009,.72]} position={[.20,1.697,.36]} color="#747a74" radius={.004}/>
    <Speaker position={[-1.55,1.70,-.10]}/><Speaker position={[1.48,1.70,-.08]}/>
    <DeskLamp/>
    <Plant position={[-1.58,1.70,-.53]} scale={.43}/>
    <group position={[-1.35,1.71,.48]} rotation={[0,-.12,0]}><Block size={[.45,.055,.34]} position={[0,.025,0]} color="#d2b78e"/><Block size={[.42,.035,.31]} position={[0,.025,.005]} color="#f1f0e8"/><Round r={.012} h={.34} position={[.12,.065,0]} rotation={[Math.PI/2,0,.1]} color="#353d40" metal={.3}/></group>
    <group position={[1.54,1.70,.45]}><Round r={.10} h={.014} color="#d2c1aa"/><mesh position={[0,.13,0]} castShadow><cylinderGeometry args={[.074,.07,.24,32,1,true]}/><meshStandardMaterial color="#e1ddd3" side={THREE.DoubleSide} roughness={.4}/></mesh><Round r={.065} h={.008} position={[0,.235,0]} color="#5c4230"/><mesh position={[.083,.14,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.055,.013,12,24]}/><meshStandardMaterial color="#e1ddd3" roughness={.4}/></mesh></group>
    <Block size={[.65,.10,.45]} position={[-.1,1.48,-.35]} color="#c3c8c4"/>
    <Cable points={[[0,2.5,-.36],[0,1.65,-.55],[.6,1.48,-.6],[1.05,.85,-.38]]}/>
    <Cable points={[[.1,1.73,.20],[.4,1.70,-.4],[1.08,1.55,-.54]]} r={.006}/>
    <group position={[-1.37,.61,-.1]}><Block size={[.69,1.13,1.10]} position={[0,0,0]}/>{[-.30,.06,.37].map(y=><group key={y}><OakPanel size={[.63,.27,.028]} position={[0,y,.57]}/><Block size={[.22,.018,.025]} position={[0,y+.07,.595]} color="#8e928b"/></group>)}<Round r={.035} h={.05} position={[-.24,-.57,.30]} color="#505655"/><Round r={.035} h={.05} position={[.24,-.57,.30]} color="#505655"/></group>
  </group>;
}
export function ShelfDetails() {
  return <group position={[-1.9,0,-3.75]}>
    <OakPanel size={[4.78,.04,.66]} position={[0,4.30,0]}/>
    <Plant position={[-1.84,4.34,-.03]} scale={.50}/>
    <group position={[1.34,4.34,0]}>{[0,1,2].map(i=><group key={i} position={[i*.22,0,0]} rotation={[0,0,i===2?-.04:0]}><Block size={[.19,.50,.39]} position={[0,.25,0]} color={i===1?"#9caaa0":"#ded9cd"}/><Block size={[.10,.12,.008]} position={[0,.31,.20]} color="#f5f3eb"/><Round r={.024} h={.009} position={[0,.105,.208]} rotation={[Math.PI/2,0,0]} color="#72786f"/></group>)}</group>
  </group>;
}
function Rug({position,size}:{position:V;size:[number,number]}) {
  const map=useSurface("fabric");return <group position={position}><RoundedBox args={[size[0],.025,size[1]]} radius={.01} smoothness={2} receiveShadow><meshStandardMaterial color="#dbd5c6" map={map} roughness={1} bumpMap={map} bumpScale={.015}/></RoundedBox>{[-1,1].map(side=><group key={side} position={[side*(size[0]/2-.065),.015,0]}>{Array.from({length:3},(_,i)=><Block key={i} size={[.008,.003,size[1]-.08]} position={[side*i*.025,0,0]} color="#bdb6a7" radius={0}/>)}</group>)}</group>;
}
export function LazySofa({standalone=false}:{standalone?:boolean}) {
  const map=useSurface("fabric"),shape=useMemo(createLounge,[]);
  useEffect(()=>()=>{shape.top.dispose();shape.side.dispose();},[shape]);
  const fabric=<meshStandardMaterial color="#788271" map={map} roughness={.97} bumpMap={map} bumpScale={.006}/>;
  const rim=Array.from({length:97},(_,i)=>{const p=loungeTop(1,i/96*Math.PI*2);p[1]+=.004;return p;});
  return <group position={standalone?[0,0,0]:[3.06,0,1.10]} rotation={[0,standalone?0:.035,0]} scale={standalone?1:1.08}>
    <mesh geometry={shape.side} castShadow receiveShadow>{fabric}</mesh>
    <mesh geometry={shape.top} castShadow receiveShadow>{fabric}</mesh>
    <Cable points={rim} color="#74806c" r={.055}/>
    <Cable points={rim.map(p=>[p[0],p[1]+.052,p[2]] as V)} color="#626f5a" r={.003}/>
    <Cable points={Array.from({length:97},(_,i)=>loungeSide(.88,i/96*Math.PI*2))} color="#65715d" r={.005}/>
    {[0,1.10,-1.10,2.35,-2.35].map(angle=><Cable key={angle} points={Array.from({length:20},(_,i)=>loungeSide(i/19,angle))} color="#6a7561" r={.0035}/>)}
    <group position={[.13,.74,.43]} rotation={[.15,-.06,-.13]}>
      <RoundedBox args={[1.02,.36,.22]} radius={.10} smoothness={6} castShadow receiveShadow><meshStandardMaterial color="#c7c5b2" map={map} roughness={.98} bumpMap={map} bumpScale={.004}/></RoundedBox>
      <Cable points={[[-.43,-.12,-.111],[-.47,0,-.111],[-.42,.13,-.111],[.42,.13,-.111],[.47,0,-.111],[.42,-.13,-.111],[-.43,-.12,-.111]]} color="#a8aa94" r={.003}/>
    </group>
    <Cable points={Array.from({length:16},(_,i)=>{const p=loungeSide(.24+i/15*.40,0);p[2]+=.005;return p;})} color="#525f4e" r={.008}/>
    <mesh position={[0,.64,.914]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.024,.004,8,20]}/><meshStandardMaterial color="#9ca18e" metalness={.5} roughness={.55}/></mesh>
    <Block size={[.035,.10,.009]} position={[.942,.45,.13]} rotation={[0,1.4,0]} color="#c6bca6"/>
  </group>;
}
function Projector() {
  return <group position={[4.10,1.04,2.63]} rotation={[0,.04,0]}>
    <Block size={[.66,.24,.49]} position={[0,.13,0]} color="#deded8" radius={.04}/>
    <Block size={[.59,.045,.43]} position={[0,.025,0]} color="#646e6e"/>
    <Round r={.09} h={.045} position={[-.15,.145,-.255]} rotation={[Math.PI/2,0,0]} color="#353f44" metal={.6}/>
    <Round r={.067} h={.01} position={[-.15,.145,-.281]} rotation={[Math.PI/2,0,0]} color="#294856" metal={.75}/>
    <Round r={.025} h={.012} position={[-.16,.16,-.288]} rotation={[Math.PI/2,0,0]} color="#aac3c5" metal={.4}/>
    {Array.from({length:10},(_,i)=><Block key={i} size={[.008,.105,.008]} position={[.03+i*.022,.14,-.249]} color="#88928f" radius={.002}/>)}
    <Round r={.022} h={.006} position={[.13,.254,.05]} color="#647b6e"/>
    <Block size={[.13,.01,.025]} position={[-.13,.253,.03]} color="#969e98"/>
    <Cable points={[[.25,.05,.20],[.31,-.25,.36],[.13,-1.02,.55],[-.10,-1.02,.64]]} r={.008}/>
  </group>;
}
export function RoomAccessories({playing=false}:{playing?:boolean}) {
  const {loadingTape}=useRecordMotion();
  return <>
    <Rug position={[-1.92,.013,.43]} size={[3.65,4.10]}/>
    <Rug position={[3.03,.014,.75]} size={[3.35,3.4]}/>
    <Rug position={[-5.45,.013,3.94]} size={[2.50,1.80]}/>
    <Plant position={[-6.48,0,4.08]} scale={.62}/>
    <group position={[-4.36,.72,4.02]}>
      <Round r={.31} h={.045} color="#c4ad91"/>
      <Round r={.035} h={.67} position={[0,-.35,0]} color="#aab3a3" metal={.35}/>
      <Round r={.23} h={.026} position={[0,-.69,0]} color="#c2c9bb"/>
      <Block size={[.23,.035,.19]} position={[-.07,.042,.04]} color="#eee2b9" radius={.003}/>
      <Round r={.055} h={.115} position={[.15,.08,-.08]} color="#e4dfd2"/>
      {[0,1,2].map(i=><Round key={i} r={.007} h={.18} position={[.13+i*.016,.19,-.08]} rotation={[0,0,(i-1)*.12]} color={['#52634d','#b79a78','#8a939f'][i]}/>)}
    </group>
    <Plant position={[-4.57,0,-2.30]} scale={1.25}/>
    <ShelfDetails/>
    <LazySofa/>
    <group position={[4.50,.77,.85]}><mesh receiveShadow castShadow><cylinderGeometry args={[.48,.48,.055,48]}/><meshStandardMaterial color={OAK} roughness={.65}/></mesh>{[0,1,2].map(i=>{const a=i*Math.PI*2/3;return <Round key={i} r={.023} h={.75} position={[Math.sin(a)*.29,-.38,Math.cos(a)*.29]} color="#8b928b" metal={.7}/>;})}</group>
    <group position={[4.10,.98,2.63]}><OakPanel size={[.78,.045,.62]} position={[0,.04,0]}/>{[-.29,.29].map(x=><Block key={x} size={[.035,1.0,.035]} position={[x,-.48,0]} color="#a9b1a7"/>)}<Block size={[.70,.04,.48]} position={[0,-.94,0]} color="#c4cbc0"/></group>
    <group position={[4.50,.81,.85]}><Round r={.14} h={.012} color="#c8b79d"/><Round r={.08} h={.17} position={[0,.10,0]} color="#e9e3d9"/><Round r={.064} h={.007} position={[0,.19,0]} color="#55412e"/><Block size={[.18,.015,.31]} position={[.21,.015,-.04]} color="#434b48"/><Block size={[.015,.014,.07]} position={[.21,.027,.03]} color="#bbc2b2"/></group>
    <Projector/>
    <group position={[3.2,1.425,-3.75]}><Block size={[.97,.15,.42]} position={[-.85,.10,0]} color="#9da5a1"/>{Array.from({length:6},(_,i)=><Block key={i} size={[.035,.005,.16]} position={[-1.20+i*.10,.18,.01]} color="#727e78" radius={.001}/>)}<Block size={[.79,.098,.008]} position={[-.85,.10,.217]} color="#29352f" radius={.003}/><Block size={[.12,.012,.007]} position={[-1.20,.04,.221]} color="#c4cbbb"/><mesh position={[-.50,.15,.224]}><sphereGeometry args={[.008,12,8]}/><meshStandardMaterial color={playing||loadingTape?"#b5cc92":"#7c867b"} emissive={playing||loadingTape?"#607a3d":"#000000"} emissiveIntensity={.6}/></mesh><Round r={.034} h={.018} position={[-.50,.10,.22]} rotation={[Math.PI/2,0,0]} color="#65726c" metal={.8}/></group>
    <Speaker position={[5.75,.22,-3.54]} scale={1.7}/><OakPanel size={[.62,.18,.57]} position={[5.75,.11,-3.54]}/>
  </>;
}
