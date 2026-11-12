"use client";
import {useEffect,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {CameraControls,CameraControlsImpl} from '@react-three/drei';
import * as THREE from 'three';
import {ROOM_VIEWS,type Vec3} from '@/lib/room-navigation';
import type {Zone} from '@/lib/room-types';

type Props={zone:Zone;revision:number;locked:boolean;onZone:(zone:Zone)=>void};
/** Click-to-enter: pointing at a book or screen can never steal the camera. */
export default function RoomNavigation({zone,revision,locked}:Props){
  const {camera,size,gl,invalidate}=useThree(),controls=useRef<CameraControlsImpl>(null);
  const pointer=useRef({x:0,y:0}),[desktop,setDesktop]=useState(true),reduced=useRef(false);
  const target=useRef(new THREE.Vector3(...ROOM_VIEWS[zone].target));
  useEffect(()=>{
    const media=matchMedia('(hover: hover) and (pointer: fine)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{setDesktop(media.matches);reduced.current=motion.matches;invalidate();};update();
    media.addEventListener('change',update);motion.addEventListener('change',update);
    return()=>{media.removeEventListener('change',update);motion.removeEventListener('change',update);};
  },[invalidate]);
  useEffect(()=>{
    const move=(e:PointerEvent)=>{
      const element=e.target instanceof Element?e.target:null;
      if(e.pointerType!=='mouse'||locked||element?.closest('.monitor-content,.projection-content,.modal')){pointer.current={x:0,y:0};invalidate();return;}
      const rect=gl.domElement.getBoundingClientRect();pointer.current={x:THREE.MathUtils.clamp((e.clientX-rect.left)/rect.width*2-1,-1,1),y:THREE.MathUtils.clamp(1-(e.clientY-rect.top)/rect.height*2,-1,1)};invalidate();
    };
    window.addEventListener('pointermove',move,{passive:true});return()=>window.removeEventListener('pointermove',move);
  },[gl,locked,invalidate]);
  useEffect(()=>{
    pointer.current={x:0,y:0};invalidate();
    if(desktop&&size.width>=650)return;
    const c=controls.current;if(!c)return;const view=ROOM_VIEWS[zone];
    const position=new THREE.Vector3(...view.camera),look=new THREE.Vector3(...view.target);
    if(size.width<650&&zone==='overview')position.sub(look).multiplyScalar(2.15).add(look);
    if(size.width<650&&zone==='office')position.sub(look).multiplyScalar(1.2).add(look);
    if(size.width<650&&zone==='guestbook')position.sub(look).multiplyScalar(1.45).add(look);
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=zone==='overview'?38:zone==='office'?size.width<650?76:36:zone==='books'?size.width<650?94:50:zone==='cinema'?size.width<650?76:42:size.width<650?58:45;camera.updateProjectionMatrix();}
    c.minAzimuthAngle=-Infinity;c.maxAzimuthAngle=Infinity;
    let cancelled=false;
    void c.setLookAt(...position.toArray() as Vec3,...view.target,!reduced.current).then(()=>{
      if(cancelled)return;const angle=c.azimuthAngle,range=zone==='overview'?.20:zone==='office'?.04:.10;c.minAzimuthAngle=angle-range;c.maxAzimuthAngle=angle+range;
    });return()=>{cancelled=true;};
  },[zone,revision,desktop,size.width,camera,invalidate]);
  useFrame((_,dt)=>{
    if(!desktop||size.width<650)return;
    const view=ROOM_VIEWS[zone],end=new THREE.Vector3(...view.camera),look=new THREE.Vector3(...view.target);
    if(zone==='overview'&&!locked&&!reduced.current){end.x+=pointer.current.x*.22;end.y+=pointer.current.y*.08;}
    const a=reduced.current?1:1-Math.exp(-Math.min(dt,.12)*5.5);
    camera.position.lerp(end,a);target.current.lerp(look,a);camera.lookAt(target.current);
    let lens=false;
    if(camera instanceof THREE.PerspectiveCamera){const fov=zone==='office'?36:zone==='books'?50:zone==='cinema'?42:38;camera.fov=THREE.MathUtils.lerp(camera.fov,fov,a);lens=Math.abs(camera.fov-fov)>.005;camera.updateProjectionMatrix();}
    camera.updateMatrixWorld();
    if(camera.position.distanceToSquared(end)>.000001||target.current.distanceToSquared(look)>.000001||lens)invalidate();
  },-2);
  if(desktop&&size.width>=650)return null;
  const distance=ROOM_VIEWS[zone].distance;
  return <CameraControls ref={controls} makeDefault enabled={!locked} smoothTime={.55} minPolarAngle={.78} maxPolarAngle={1.43}
    minDistance={zone==='overview'?size.width<650?29:15:distance[0]} maxDistance={zone==='overview'?46:distance[1]*1.6}
    mouseButtons={{left:CameraControlsImpl.ACTION.ROTATE,middle:0,right:0,wheel:CameraControlsImpl.ACTION.DOLLY}}
    touches={{one:CameraControlsImpl.ACTION.TOUCH_ROTATE,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:0}}/>;
}
