"use client";
import {Suspense,useEffect,useRef,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {CameraControls,CameraControlsImpl} from '@react-three/drei';
import {RotateCcw} from 'lucide-react';
import * as THREE from 'three';
import {TardisModel} from './TardisOrnament';
import {StudioLight} from './RoomDecor';
import {useT} from './i18n';

function InspectionCamera({revision}:{revision:number}){
 const controls=useRef<CameraControlsImpl>(null),{size,invalidate}=useThree();
 useEffect(()=>{
  const distance=5.5*Math.max(1,size.height/size.width*.85),angle=.34;
  void controls.current?.setLookAt(Math.sin(angle)*distance,1.05,Math.cos(angle)*distance,0,0,0,false);
  invalidate();
 },[revision,size.width,size.height,invalidate]);
 return <CameraControls ref={controls} makeDefault minDistance={2.6} maxDistance={12} minPolarAngle={.22} maxPolarAngle={Math.PI-.22}
  smoothTime={.15} draggingSmoothTime={.1} dollySpeed={.6}
  mouseButtons={{left:CameraControlsImpl.ACTION.ROTATE,middle:CameraControlsImpl.ACTION.NONE,right:CameraControlsImpl.ACTION.NONE,wheel:CameraControlsImpl.ACTION.DOLLY}}
  touches={{one:CameraControlsImpl.ACTION.TOUCH_ROTATE,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:CameraControlsImpl.ACTION.NONE}}/>;
}

export default function CollectibleViewer(){
 const t=useT(),[revision,setRevision]=useState(0);
 return <div className="collectible-inspection">
  <div className="collectible-viewport" aria-label={t('TARDIS 三维摆件，可拖动旋转、缩放查看','3D TARDIS collectible. Drag to rotate and scroll to zoom.')}>
   <Canvas shadows frameloop="demand" dpr={[1,1.7]} camera={{position:[1.9,1.05,5.2],fov:38,near:.05,far:50}}
    gl={{antialias:true,alpha:false}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;}}>
    <color attach="background" args={['#fafbf9']}/>
    <ambientLight intensity={.65}/><hemisphereLight args={['#ffffff','#d4d8d1',.8]}/>
    <directionalLight position={[-3,6,5]} intensity={2.2} castShadow shadow-mapSize={[1024,1024]} shadow-normalBias={.02}/>
    <directionalLight position={[4,2,-3]} intensity={.55}/>
    <Suspense fallback={null}><StudioLight/><group position={[0,-1.5,0]}><TardisModel height={3}/></group></Suspense>
    <mesh position={[0,-1.505,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[30,30]}/><shadowMaterial transparent opacity={.17}/></mesh>
    <InspectionCamera revision={revision}/>
   </Canvas>
  </div>
  <div className="collectible-controls"><p>{t('拖动旋转 · 滚轮或双指缩放 · Esc 返回房间','Drag to rotate · Scroll or pinch to zoom · Esc to return')}</p><button className="button subtle" onClick={()=>setRevision(value=>value+1)}><RotateCcw size={14}/>{t('重置角度','Reset view')}</button></div>
 </div>;
}
