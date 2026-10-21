"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {useFrame,useThree} from "@react-three/fiber";
import {CameraControls,CameraControlsImpl} from "@react-three/drei";
import * as THREE from "three";
import {ROOM_VIEWS,ROOM_HOVER_TIMING,pickRoomZone,RoomHoverIntent,type Vec3} from "@/lib/room-navigation";
import type {Zone} from "@/lib/room-types";

type Props={zone:Zone;revision:number;locked:boolean;onZone:(zone:Zone)=>void;onHover?:(zone:Zone|null)=>void};
function useRoomPreferences(){
  const [prefs,setPrefs]=useState({mouse:false,reduced:false});
  useEffect(()=>{
    const mouse=matchMedia("(hover: hover) and (pointer: fine)"),reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setPrefs({mouse:mouse.matches,reduced:reduced.matches});update();
    mouse.addEventListener("change",update);reduced.addEventListener("change",update);
    return()=>{mouse.removeEventListener("change",update);reduced.removeEventListener("change",update);};
  },[]);
  return prefs;
}
export default function RoomNavigation(props:Props){
  const {size}=useThree(),prefs=useRoomPreferences();
  return prefs.mouse&&size.width>=650?<MouseNavigation {...props} reduced={prefs.reduced}/>:<TouchNavigation zone={props.zone} revision={props.revision} reduced={prefs.reduced}/>;
}

function MouseNavigation({zone,revision,locked,onZone,onHover,reduced}:Props&{reduced:boolean}){
  const {camera,gl,invalidate}=useThree();
  const live=useRef({zone,locked,onZone,onHover});live.current={zone,locked,onZone,onHover};
  const intent=useMemo(()=>new RoomHoverIntent(),[]);
  const pointer=useRef({x:0,y:0,surface:false});
  const warmup=useRef(12);
  const focal=useRef(new THREE.Vector3(...ROOM_VIEWS[zone].target));
  const hover=useRef<Zone|null>(null);
  const vectors=useMemo(()=>({position:new THREE.Vector3(),target:new THREE.Vector3(),right:new THREE.Vector3(),forward:new THREE.Vector3(),up:new THREE.Vector3(0,1,0),ray:new THREE.Raycaster(),ndc:new THREE.Vector2()}),[]);
  const feedback=()=>{if(hover.current!==intent.candidate){hover.current=intent.candidate;live.current.onHover?.(intent.candidate);}};
  useEffect(()=>{
    intent.reset(Date.now(),ROOM_HOVER_TIMING.cooldown);hover.current=null;onHover?.(null);pointer.current.surface=false;warmup.current=12;invalidate();
  },[zone,revision,locked,reduced,intent,invalidate,onHover]);
  useEffect(()=>{
    const stage=gl.domElement.closest<HTMLElement>(".scene-stage");if(!stage)return;
    const cancel=()=>{intent.cancel();feedback();};
    const move=(event:PointerEvent)=>{
      if(event.pointerType!=="mouse")return;
      const el=event.target instanceof Element?event.target:null;
      const {zone:current,locked:busy}=live.current;
      const editing=document.activeElement?.matches(".workstation input,.workstation textarea,.workstation [contenteditable=true]");
      if(busy||editing||event.buttons){cancel();return;}
      const nav=el?.closest<HTMLElement>("[data-room-zone]")?.dataset.roomZone as Zone|undefined;
      const rect=stage.getBoundingClientRect(),inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
      const surface=el?.closest(".monitor-content,.projection-content");
      pointer.current.surface=!!surface;
      if(inside&&!surface){pointer.current.x=THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);pointer.current.y=THREE.MathUtils.clamp(1-(event.clientY-rect.top)/rect.height*2,-1,1);}
      else if(!inside){pointer.current.x=0;pointer.current.y=0;}
      if(nav&&["overview","office","books","cinema","guestbook"].includes(nav))intent.point(nav,current,Date.now());
      else if(surface)intent.point(surface.classList.contains("monitor-content")?"office":"cinema",current,Date.now());
      else if(!inside||el?.closest(".view-toolbar,.quick-records,.scene-caption,.shelf-pager,.record-motion-status,.modal"))intent.point(null,current,Date.now());
      else{
        vectors.ndc.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
        vectors.ray.setFromCamera(vectors.ndc,camera);
        intent.point(pickRoomZone(vectors.ray.ray,current),current,Date.now());
      }
      feedback();invalidate();
    };
    const leave=()=>{cancel();pointer.current.x=0;pointer.current.y=0;invalidate();};
    window.addEventListener("pointermove",move,{passive:true});
    window.addEventListener("pointerdown",cancel,{passive:true});
    window.addEventListener("pointerup",move,{passive:true});
    window.addEventListener("blur",leave);document.addEventListener("visibilitychange",leave);
    return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",cancel);window.removeEventListener("pointerup",move);window.removeEventListener("blur",leave);document.removeEventListener("visibilitychange",leave);};
  },[camera,gl,intent,invalidate,vectors]);
  useFrame((_,delta)=>{
    const next=locked?null:intent.step(zone,Date.now());
    if(next){feedback();onZone(next);}
    const view=ROOM_VIEWS[zone],p=pointer.current;
    vectors.position.set(...view.camera);vectors.target.set(...view.target);
    vectors.forward.copy(vectors.target).sub(vectors.position).normalize();vectors.right.crossVectors(vectors.forward,vectors.up).normalize();
    const amount=reduced||locked||p.surface?0:zone==="overview"?.74:zone==="office"?0:.14;
    vectors.position.addScaledVector(vectors.right,p.x*amount).addScaledVector(vectors.up,p.y*amount*.35);
    vectors.target.addScaledVector(vectors.right,p.x*amount*.40).addScaledVector(vectors.up,p.y*amount*.18);
    const alpha=reduced?1:1-Math.exp(-Math.min(delta,.05)*5.3);
    camera.position.lerp(vectors.position,alpha);focal.current.lerp(vectors.target,alpha);camera.lookAt(focal.current);
    const desiredFov=zone==="office"?31:zone==="cinema"?43:zone==="books"?83:zone==="guestbook"?53:38;
    let lensMoving=false;
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=THREE.MathUtils.lerp(camera.fov,desiredFov,alpha);lensMoving=Math.abs(camera.fov-desiredFov)>.005;camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    // Drei's screen HTML commits in a separate React root after the first frame.
    if(warmup.current-->0||camera.position.distanceToSquared(vectors.position)>.000001||focal.current.distanceToSquared(vectors.target)>.000001||lensMoving||intent.candidate!==null)invalidate();
  },-2);
  return null;
}

function TouchNavigation({zone,revision,reduced}:{zone:Zone;revision:number;reduced:boolean}){
  const controls=useRef<CameraControlsImpl>(null),{size,camera}=useThree(),view=ROOM_VIEWS[zone];
  useEffect(()=>{
    const c=controls.current;if(!c)return;
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=size.width<650?(zone==="books"?118:zone==="office"?70:zone==="cinema"?84:zone==="guestbook"?45:38):(zone==="office"?31:zone==="cinema"?43:zone==="books"?83:zone==="guestbook"?53:38);camera.updateProjectionMatrix();}
    c.minAzimuthAngle=-Infinity;c.maxAzimuthAngle=Infinity;
    const position=new THREE.Vector3(...view.camera),target=new THREE.Vector3(...view.target);
    if(size.width<650&&zone==="overview")position.sub(target).multiplyScalar(2.3).add(target);
    if(size.width<650&&zone==="guestbook")position.sub(target).multiplyScalar(1.45).add(target);
    let cancelled=false;
    c.setLookAt(...position.toArray() as Vec3,...view.target,!reduced).then(()=>{if(!cancelled){c.minAzimuthAngle=zone==="guestbook"?1.50:zone==="office"?1.4:zone==="overview"?.38:-.16;c.maxAzimuthAngle=zone==="guestbook"?1.95:zone==="office"?1.74:zone==="overview"?1.1:.16;}});
    return()=>{cancelled=true;};
  },[zone,revision,size.width,reduced,camera,view]);
  return <CameraControls ref={controls} makeDefault smoothTime={.55} draggingSmoothTime={.13} minPolarAngle={.84} maxPolarAngle={1.48}
    minDistance={size.width<650?(zone==="books"?1.8:zone==="office"?2.65:view.distance[0]*1.25):view.distance[0]}
    maxDistance={size.width<650?(zone==="books"?2.65:zone==="overview"?36:view.distance[1]*1.6):view.distance[1]} dollySpeed={.35}
    mouseButtons={{left:CameraControlsImpl.ACTION.ROTATE,middle:CameraControlsImpl.ACTION.NONE,right:CameraControlsImpl.ACTION.NONE,wheel:CameraControlsImpl.ACTION.DOLLY}}
    touches={{one:CameraControlsImpl.ACTION.TOUCH_ROTATE,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:CameraControlsImpl.ACTION.NONE}}/>;
}
