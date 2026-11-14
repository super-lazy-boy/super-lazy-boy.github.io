"use client";
import {Suspense,useEffect,useRef,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {CameraControls,CameraControlsImpl,Center} from '@react-three/drei';
import {RotateCcw} from 'lucide-react';
import * as THREE from 'three';
import {TardisModel} from './TardisOrnament';
import SunlitRoom from './SunlitRoom';
import {StudioLight} from './RoomDecor';
import {useT} from './i18n';
import {COLLECTIBLE_NAMES,type CollectibleId} from '@/lib/collectibles';
import {InspectCollectible} from './CollectibleModels';
import versions from '@/public/collectibles-version.json';
import SceneActivity from './SceneActivity';

function InspectionCamera({revision,item,top,active}:{revision:number;item:CollectibleId;top:boolean;active:boolean}){
 const controls=useRef<CameraControlsImpl>(null),{size,invalidate}=useThree();
 useEffect(()=>{
  if(!active||size.width<=0||size.height<=0)return;
  const distance=5.5*Math.max(1,size.height/size.width*.85),angle=item==='monica-apartment'?.32:item==='millennium-falcon'?.42:.34;
  const elevation=item==='monica-apartment'?.84:item==='millennium-falcon'?.58:item==='zaizen-lighter'?.82:item==='wish-willow'?.34:.19;
  // Flat dioramas need an elevated first view so their interiors are visible.
  if(top)void controls.current?.setLookAt(0,distance,.012,0,0,0,false);
  else void controls.current?.setLookAt(Math.sin(angle)*distance,Math.sin(elevation)*distance,Math.cos(angle)*distance,0,0,0,false);
  invalidate();
 },[revision,item,top,active,size.width,size.height,invalidate]);
 return <CameraControls ref={controls} makeDefault enabled={active} minDistance={2.6} maxDistance={12} minPolarAngle={top?.002:.22} maxPolarAngle={Math.PI-.22}
  smoothTime={.15} draggingSmoothTime={.1} dollySpeed={.6}
  mouseButtons={{left:CameraControlsImpl.ACTION.ROTATE,middle:CameraControlsImpl.ACTION.NONE,right:CameraControlsImpl.ACTION.NONE,wheel:CameraControlsImpl.ACTION.DOLLY}}
  touches={{one:CameraControlsImpl.ACTION.TOUCH_ROTATE,two:CameraControlsImpl.ACTION.TOUCH_DOLLY,three:CameraControlsImpl.ACTION.NONE}}/>;
}

export default function CollectibleViewer({item='tardis',night=false,active=true}:{item?:CollectibleId;night?:boolean;active?:boolean}){
 const t=useT(),[revision,setRevision]=useState(0),[top,setTop]=useState(false);
 useEffect(()=>{if(active){setTop(false);setRevision(value=>value+1);}},[item,active]);
 const floorY=item==='tardis'?-1.505:item==='starry-night'?-1.18:-1.5*versions[item].dimensions[1]/Math.max(...versions[item].dimensions)-.005;
 return <div className="collectible-inspection">
  <div className="collectible-viewport" aria-label={t(...COLLECTIBLE_NAMES[item])+t('，可拖动旋转、缩放查看','. Drag to rotate and zoom.')}>
   <Canvas shadows frameloop={active?'demand':'never'} dpr={[1,1.7]} camera={{position:[1.9,1.05,5.2],fov:38,near:.05,far:50}}
    gl={{antialias:true,alpha:false}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;}}>
    <SceneActivity active={active} cacheShadows/><color attach="background" args={[night?'#080a0b':'#fafbf9']}/>
    <ambientLight intensity={.65}/><hemisphereLight args={['#ffffff','#d4d8d1',.8]}/>
    <directionalLight position={[-3,6,5]} intensity={2.2} castShadow shadow-mapSize={[1024,1024]} shadow-normalBias={.02}/>
    <directionalLight position={[4,2,-3]} intensity={.55}/>
    <Suspense fallback={null}><StudioLight/>{item==='tardis'?<group position={[0,-1.5,0]}><TardisModel height={3}/></group>:item==='starry-night'?<group scale={1.8}><Center><SunlitRoom part="starry night"/></Center></group>:<Center><InspectCollectible id={item}/></Center>}</Suspense>
    <mesh position={[0,floorY,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[30,30]}/><shadowMaterial transparent opacity={.17}/></mesh>
    <InspectionCamera revision={revision} item={item} top={top} active={active}/>
   </Canvas>
  </div>
  {item==='starry-night'&&<p className="artwork-credit">Vincent van Gogh · 1889 · <a href="https://www.moma.org/collection/works/79802" target="_blank" rel="noopener noreferrer">The Starry Night</a><span> · Google Art Project / Wikimedia Commons</span></p>}
  {item==='millennium-falcon'&&<p className="artwork-credit">{t('参照 LEGO UCS 75192 的外观与比例制作','Study based on the appearance and proportions of LEGO UCS 75192')} · <a href="https://www.lego.com/en-us/product/millennium-falcon-75192" target="_blank" rel="noopener noreferrer">LEGO</a></p>}
  {item==='wish-willow'&&<p className="artwork-credit">Obsession · <a href="https://onewishwillow.app/zh/" target="_blank" rel="noopener noreferrer">One Wish Willow</a></p>}
  {item==='zaizen-lighter'&&<p className="artwork-credit">{t('白色巨塔 · 财前五郎','The White Tower · Goro Zaizen')} · S.T. Dupont · 60 DIAMANTS</p>}
  <div className="collectible-controls"><p>{t('拖动旋转 · 滚轮或双指缩放 · Esc 返回房间','Drag to rotate · Scroll or pinch to zoom · Esc to return')}</p>{(item==='monica-apartment'||item==='millennium-falcon'||item==='zaizen-lighter')&&<button className="button subtle" aria-pressed={top} onClick={()=>setTop(value=>!value)}>{top?t('立体视角','Perspective'):t('俯视查看','Top view')}</button>}<button className="button subtle" onClick={()=>{setTop(false);setRevision(value=>value+1);}}><RotateCcw size={14}/>{t('重置角度','Reset view')}</button></div>
 </div>;
}
