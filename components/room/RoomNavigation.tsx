"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {CameraControls,CameraControlsImpl} from '@react-three/drei';
import * as THREE from 'three';
import {ROOM_VIEWS,ROOM_FOCUS,ROOM_HOVER_TIMING,RoomHoverTimer,objectRoomZone,roomCameraOffsets,type Vec3} from '@/lib/room-navigation';
import type {Zone} from '@/lib/room-types';

type Props={zone:Zone;revision:number;locked:boolean;screenFocused:boolean;onZone:(zone:Zone)=>void};
export default function RoomNavigation({zone,revision,locked,screenFocused,onZone}:Props){
  const {camera,size,gl,scene,invalidate}=useThree(),controls=useRef<CameraControlsImpl>(null);
  const [desktop,setDesktop]=useState(true),reduced=useRef(false),settled=useRef(false),warmup=useRef(12);
  const pointer=useRef({x:0,y:0}),focal=useRef(new THREE.Vector3(...ROOM_VIEWS.overview.target));
  const base=useRef(new THREE.Vector3(...ROOM_VIEWS.overview.camera)),follow=useRef(new THREE.Vector2()),pointerActive=useRef(false),pending=useRef(false),initialized=useRef(false);
  const live=useRef({zone,locked,screenFocused,onZone,desktop,width:size.width});live.current={zone,locked,screenFocused,onZone,desktop,width:size.width};
  const hover=useMemo(()=>new RoomHoverTimer(()=>live.current.zone,()=>live.current.desktop&&live.current.width>=650&&!live.current.locked&&!live.current.screenFocused&&settled.current&&pointerActive.current&&!document.hidden,next=>live.current.onZone(next)),[]);
  const ray=useMemo(()=>{const ray=new THREE.Raycaster();ray.firstHitOnly=true;return ray;},[]),ndc=useMemo(()=>new THREE.Vector2(),[]);
  const scratch=useMemo(()=>({end:new THREE.Vector3(),target:new THREE.Vector3(),offset:new THREE.Vector3(),targetOffset:new THREE.Vector3(),lookAt:new THREE.Vector3(),desired:new THREE.Vector2(),hits:[] as THREE.Intersection[]}),[]);
  const view=useMemo(()=>screenFocused&&zone==='office'?{...ROOM_FOCUS,distance:[2.6,4.2] as [number,number]}:ROOM_VIEWS[zone],[screenFocused,zone]);
  useEffect(()=>{
    const mouse=matchMedia('(hover: hover) and (pointer: fine)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{setDesktop(mouse.matches);reduced.current=motion.matches;invalidate();};update();
    mouse.addEventListener('change',update);motion.addEventListener('change',update);
    return()=>{mouse.removeEventListener('change',update);motion.removeEventListener('change',update);};
  },[invalidate]);
  useEffect(()=>{
    settled.current=false;warmup.current=12;hover.reset();pointer.current={x:0,y:0};pointerActive.current=false;pending.current=false;invalidate();
  },[zone,revision,screenFocused,locked,desktop,size.width,hover,invalidate]);
  const sample=useCallback(()=>{
    ndc.set(pointer.current.x,pointer.current.y);ray.setFromCamera(ndc,camera);
    scratch.hits.length=0;
    const first=ray.intersectObjects(scene.children,true,scratch.hits).find(hit=>{
      let node:THREE.Object3D|null=hit.object;
      while(node){if(!node.visible||node.userData.hoverIgnore)return false;node=node.parent;}
      return hit.object instanceof THREE.Mesh;
    });
    hover.point(first?objectRoomZone(first.object):'overview');
  },[camera,scene,ray,ndc,hover,scratch]);
  useEffect(()=>{
    const cancel=()=>{const wasFollowing=pointerActive.current;hover.cancel();pending.current=false;pointerActive.current=false;if(wasFollowing)invalidate();};
    const move=(e:PointerEvent)=>{
      const liveState=live.current,element=e.target instanceof Element?e.target:null,rect=gl.domElement.getBoundingClientRect();
      const inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
      const ui=element?.closest('.monitor-content,.projection-content,.modal,.view-toolbar,.quick-records,.scene-caption,.film-library-ui,.guestbook-space,.room-header,.room-footer');
      if(e.pointerType!=='mouse'||liveState.locked||liveState.screenFocused||ui||!inside||e.buttons||document.hidden){cancel();return;}
      pointer.current={x:(e.clientX-rect.left)/rect.width*2-1,y:1-(e.clientY-rect.top)/rect.height*2};
      pointerActive.current=true;
      // Many hardware pointer events share one rendered frame and one exact mesh hit test.
      pending.current=true;if(!settled.current)hover.cancel();else hover.defer();invalidate();
    };
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',cancel,{passive:true});gl.domElement.addEventListener('pointerleave',cancel);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
    return()=>{hover.cancel();window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',cancel);gl.domElement.removeEventListener('pointerleave',cancel);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);};
  },[gl,hover,invalidate]);
  useEffect(()=>{
    if(desktop&&size.width>=650)return;
    const c=controls.current;if(!c)return;
    const end=new THREE.Vector3(...view.camera),target=new THREE.Vector3(...view.target);
    if(size.width<650&&zone==='overview')end.sub(target).multiplyScalar(2.15).add(target);
    if(size.width<650&&screenFocused)end.sub(target).multiplyScalar(1.2).add(target);
    if(size.width<650&&zone==='guestbook')end.sub(target).multiplyScalar(1.45).add(target);
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=screenFocused?76:zone==='overview'?38:zone==='books'?94:zone==='cinema'?76:zone==='guestbook'?58:68;camera.updateProjectionMatrix();}
    c.minAzimuthAngle=-Infinity;c.maxAzimuthAngle=Infinity;let cancelled=false;
    void c.setLookAt(...end.toArray() as Vec3,...view.target,!reduced.current).then(()=>{if(!cancelled){const a=c.azimuthAngle,r=screenFocused?.015:zone==='overview'?.20:.10;c.minAzimuthAngle=a-r;c.maxAzimuthAngle=a+r;}});
    return()=>{cancelled=true;};
  },[zone,revision,screenFocused,desktop,size.width,camera,view,invalidate]);
  useFrame((_,dt)=>{
    if(!desktop||size.width<650)return;
    const {end,target,desired,offset,targetOffset,lookAt}=scratch;end.fromArray(view.camera);target.fromArray(view.target);
    const a=reduced.current?1:1-Math.exp(-Math.min(dt,.12)*5.0);
    base.current.lerp(end,a);focal.current.lerp(target,a);
    const following=!locked&&!screenFocused&&!reduced.current&&pointerActive.current;
    desired.set(following?pointer.current.x:0,following?pointer.current.y:0);follow.current.lerp(desired,a);
    roomCameraOffsets(zone,follow.current.x,follow.current.y,!screenFocused&&!reduced.current,offset,targetOffset);
    camera.position.copy(base.current).add(offset);camera.lookAt(lookAt.copy(focal.current).add(targetOffset));
    let lens=false;
    if(camera instanceof THREE.PerspectiveCamera){const fov=screenFocused?36:zone==='office'?43:zone==='books'?50:zone==='cinema'?42:38,nextFov=THREE.MathUtils.lerp(camera.fov,fov,a);if(nextFov!==camera.fov){camera.fov=nextFov;camera.updateProjectionMatrix();}lens=Math.abs(camera.fov-fov)>.01;}
    camera.updateMatrixWorld();
    const moving=base.current.distanceToSquared(end)>.00001||focal.current.distanceToSquared(target)>.00001||lens;
    if(!moving&&!settled.current){settled.current=true;hover.reset(initialized.current?ROOM_HOVER_TIMING.cooldown:0);initialized.current=true;}
    if(pending.current&&settled.current){if(pointerActive.current&&!locked&&!screenFocused)sample();pending.current=false;}
    if(moving||follow.current.distanceToSquared(desired)>.000001||warmup.current-->0)invalidate();
  },-2);
  if(desktop&&size.width>=650)return null;
  return <CameraControls ref={controls} makeDefault enabled={!locked&&!screenFocused} smoothTime={.55} minPolarAngle={.78} maxPolarAngle={1.43}
    minDistance={screenFocused?2.6:zone==='overview'?29:view.distance[0]} maxDistance={zone==='overview'?46:view.distance[1]*1.6}
    mouseButtons={{left:CameraControlsImpl.ACTION.ROTATE,middle:0,right:0,wheel:CameraControlsImpl.ACTION.DOLLY}}
    touches={{one:CameraControlsImpl.ACTION.TOUCH_ROTATE,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:0}}/>;
}
