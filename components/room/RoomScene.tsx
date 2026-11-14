"use client";
import {Suspense,useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {CameraControls,Center,Html,useGLTF} from '@react-three/drei';
import './SunlitRoom.css';
import {EffectComposer,N8AO,ToneMapping} from '@react-three/postprocessing';
import {ToneMappingMode,type EffectComposer as ComposerInstance} from 'postprocessing';
import * as THREE from 'three';
import {ROOM_VIEWS} from '@/lib/room-navigation';
import {assetUrl,type RoomRecord,type Zone} from '@/lib/room-types';
import {filmEntities,keepsakeFilms} from '@/lib/film-library';
import {CINEMA_LAYOUT} from '@/lib/cinema-layout';
import type {GuestbookData} from '@/lib/guestbook';
import {StudioLight} from './RoomDecor';
import SunlitRoom from './SunlitRoom';
import RoomLighting from './RoomLighting';
import ProjectionBeam from './ProjectionBeam';
import type {CollectibleId} from '@/lib/collectibles';
import RoomNavigation from './RoomNavigation';
import {RecordMotionProvider,useRecordAnchor,useRecordMotion,type RecordRequest,type MotionStatus} from './RecordMotion';
import {PLAYER_Y,PLAYER_INSIDE} from '@/lib/record-motion-paths';
import {TapeCase,TapeTitle} from './TapeSpine';
import BookObject from './BookObject';
import BookStack from './BookStack';
import BookArchive from './BookArchive';
import FilmArchive from './FilmArchive';
import MemoryDrawer from './MemoryDrawer';
import GuestbookBoard,{GuestbookCamera} from './GuestbookBoard';
import {createAviators} from './models/aviators';
import {roomPointerEvents} from './RoomPointerEvents';
import SceneActivity from './SceneActivity';
import RoomAntialiasing from './RoomAntialiasing';
import RoomStartup,{RoomFirstFrame,RoomContextMonitor,RoomRenderBoundary} from './RoomStartup';
import DeferredRoomCollectibles,{RoomAssetBoundary} from './DeferredRoomCollectibles';
import {roomModels,useMainModelPhase} from '@/lib/room-model-resources';
import RoomPreparation from './RoomPreparation';

type Vec3=[number,number,number];
type Props={
  guestbookOpen:boolean;guestbookData:GuestbookData|null;onGuestbook:()=>void;
  zone:Zone;navigationLocked:boolean;paused:boolean;language:'zh'|'en';viewRevision:number;records:RoomRecord[];owner:boolean;bookPage:number;filmPage:number;
  night:boolean;lamps:{desk:boolean;floor:boolean};screenFocused:boolean;onScreenFocus:()=>void;
  onZone:(zone:Zone)=>void;onRecord:(record:RoomRecord)=>void;onBlank:(kind:'book'|'movie',slot:number)=>void;
  computer:ReactNode;projection:ReactNode;review?:string;
  recordRequest:RecordRequest;activeBookId:string|null;loadedTapeId:string|null;skipRevision:number;playbackBusy:boolean;
  onSelect:(record:RoomRecord)=>void;onMotionStatus:(status:MotionStatus)=>void;
  libraryOpen:boolean;onOpenLibrary:()=>void;bookArchiveOpen:boolean;bookLayer:number;onOpenBooks:()=>void;
  drawerRequest:number;drawerOpening:boolean;onDrawerRequest:()=>void;onInspectCollectible:(id?:CollectibleId)=>void;
};
const pointerOff=()=>{document.body.style.cursor='';};
function Book({record,w,h,position,onBlank,active}:{record?:RoomRecord;w:number;h:number;position:Vec3;onBlank:()=>void;active:boolean}){
  const [hover,setHover]=useState(false),anchor=useRecordAnchor(record,w,h);
  return <group ref={anchor.ref} position={position} visible={!anchor.hidden}
    onClick={e=>{e.stopPropagation();if(active&&e.delta<4){pointerOff();record?anchor.select():onBlank();}}}
    onPointerOver={e=>{e.stopPropagation();if(active){setHover(true);document.body.style.cursor='pointer';}}} onPointerOut={()=>{setHover(false);pointerOff();}}>
    <group><BookObject record={record} w={w} h={h}/></group>
  </group>;
}
function Books(props:Props){
  const books=props.records.filter(r=>r.kind==='book'),bySlot=new Map(books.map((r,i)=>[r.slot>=0?r.slot:i,r]));
  const widths=[.17,.22,.14,.20,.27,.16,.23,.18,.26,.15,.19,.21,.16,.24,.18,.22,.14,.27];
  return <group position={[-1.9,0,-3.75]} userData={{roomZone:'books'}}>
    {Array.from({length:90},(_,i)=>{
      const row=Math.floor(i/18),col=i%18,slot=props.bookPage*96+i,start=col<12?0:12;
      const x=(col<12?-2.28:.81)+widths.slice(start,col).reduce((sum,w)=>sum+w+.035,0)+widths[col]/2;
      return <Book active={props.zone==='books'&&!props.navigationLocked} key={slot} record={bySlot.get(slot)} w={widths[col]} h={.55+(i*13%9)*.016} position={[x,.20+row*.82,.03]} onBlank={()=>props.owner&&props.onBlank('book',slot)}/>;
    })}
    <BookStack records={books} active={props.zone==='books'&&!props.navigationLocked} onOpen={props.onOpenBooks}/>
    {[{p:[1.90,.055,2.15],yaw:.17,w:.10},{p:[2.50,.047,3.15],yaw:-.15,w:.084},{p:[1.70,.056,4.15],yaw:-.13,w:.10}].map((item,i)=>{
      const slot=props.bookPage*96+93+i;
      return <group key={slot} position={item.p as Vec3} rotation={[0,item.yaw,0]}><group rotation={[0,0,Math.PI/2]} scale={[1,1,1.65]}><Book active={props.zone==='books'&&!props.navigationLocked} record={bySlot.get(slot)} w={item.w} h={.64} position={[0,-.32,0]} onBlank={()=>props.owner&&props.onBlank('book',slot)}/></group></group>;
    })}
  </group>;
}
function Tape({record,position,slot,onBlank,active}:{record?:RoomRecord;position:Vec3;slot:number;onBlank:()=>void;active:boolean}){
  const anchor=useRecordAnchor(record,.125,.48),[hover,setHover]=useState(false);
  return <group ref={anchor.ref} position={[position[0],position[1]+.24,position[2]]} visible={!anchor.hidden}
    onClick={e=>{e.stopPropagation();if(active&&e.delta<4){pointerOff();record?anchor.select():onBlank();}}}
    onPointerOver={e=>{e.stopPropagation();if(active){setHover(true);document.body.style.cursor='pointer';}}} onPointerOut={()=>{setHover(false);pointerOff();}}>
    <group><TapeCase record={record} slot={slot}/></group>
    {hover&&record&&<Html center position={[0,.38,.2]} style={{pointerEvents:'none'}}><TapeTitle record={record} slot={slot}/></Html>}
  </group>;
}
function Tapes(props:Props){
  const entities=filmEntities(props.records),bySlot=new Map(entities.map(e=>[e.slot,e])),keepsakes=keepsakeFilms(entities),keptIds=new Set(keepsakes.map(e=>e.record.id));
  return <group position={CINEMA_LAYOUT.origin} userData={{roomZone:'cinema'}}>
    {Array.from({length:56},(_,i)=>{
      const slot=props.filmPage*56+i,record=bySlot.get(slot)?.record;
      if(record&&keptIds.has(record.id))return null;
      return <Tape active={props.zone==='cinema'&&!props.navigationLocked} key={slot} slot={slot} record={record} position={[-1.98+(i%28)*.146,.15+Math.floor(i/28)*.62,.02]} onBlank={()=>props.owner&&props.onBlank('movie',slot)}/>;
    })}
    {keepsakes.map((e,i)=><group key={e.record.id} position={CINEMA_LAYOUT.keepsakes[i]} rotation={[0,CINEMA_LAYOUT.keepsakeYaws[i],Math.PI/2]}><Tape active={props.zone==='cinema'&&!props.navigationLocked} record={e.record} slot={e.slot} position={[0,-.24,0]} onBlank={()=>{}}/></group>)}
    <MemoryDrawer active={props.zone==='cinema'} locked={props.navigationLocked} opening={props.drawerOpening} request={props.drawerRequest} onRequest={props.onDrawerRequest} onOpened={props.onOpenLibrary}/>
    {props.zone==='cinema'&&<Html transform position={[0,3.05,-.105]} distanceFactor={1} occlude><div className={'projection-content'+(props.playbackBusy?' projection-loading':'')} onClick={e=>e.stopPropagation()}>{props.projection}</div></Html>}
  </group>;
}
function SavedModel({record}:{record:RoomRecord}){
  const {scene}=useGLTF(record.modelUrl||assetUrl(record.modelKey)),{gl,invalidate}=useThree();
  const clone=useMemo(()=>{
    const group=scene.clone(true),box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    group.position.sub(center);group.position.y+=size.y/2;
    const root=new THREE.Group();root.add(group);root.scale.setScalar(Math.min(.35,record.modelScale)/Math.max(size.x,size.y,size.z));
    root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return root;
  },[scene,record.modelScale]);
  useEffect(()=>{gl.shadowMap.needsUpdate=true;invalidate();},[clone,record.modelPlacement,record.modelRotation,gl,invalidate]);
  const positions:Record<string,Vec3>={'books-top':[-2.50,4.38,-3.75],'books-middle':[-2.50,4.38,-3.75],'cinema-left':[4.80,1.45,-3.75],'cinema-right':[5.10,1.45,-3.75]};
  return <group position={positions[record.modelPlacement]||positions['books-top']} rotation={[0,record.modelRotation*Math.PI/180,0]}><primitive object={clone}/></group>;
}
function LoadedTape({records}:{records:RoomRecord[]}){
  const motion=useRecordMotion(),record=records.find(r=>r.id===motion.loadedId);
  if(!record||motion.hiddenId===record.id||motion.loadingTape)return null;
  return <group position={[CINEMA_LAYOUT.origin[0]+CINEMA_LAYOUT.tapePlayerX,PLAYER_Y,PLAYER_INSIDE]} rotation={[0,0,Math.PI/2]}><TapeCase record={record}/></group>;
}
function RoomLoading({language}:{language:'zh'|'en'}){
  return <Html center><div className="room-model-loading" role="status"><span>{language==='zh'?'正在准备内容…':'Preparing the collection…'}</span></div></Html>;
}
function Furniture({props,onReady,prepared,onPrepared,onError,target}:{props:Props;onReady:()=>void;prepared:boolean;onPrepared:()=>void;onError:(error:Error)=>void;target:()=>THREE.WebGLRenderTarget|null}){
  return <RecordMotionProvider request={props.recordRequest} records={props.records} activeBookId={props.activeBookId} loadedTapeId={props.loadedTapeId} zone={props.zone} viewRevision={props.viewRevision} skipRevision={props.skipRevision} onSelect={props.onSelect} onComplete={props.onRecord} onStatus={props.onMotionStatus}
    renderBook={(record,w,h)=><BookObject record={record} w={w} h={h} detail/>} renderTape={record=><TapeCase record={record} slot={filmEntities(props.records).find(e=>e.record.id===record.id)?.slot||0}/> }>
    <SunlitRoom zone={props.zone} night={props.night} playing={!!props.loadedTapeId&&!props.playbackBusy} lamps={props.lamps} onInspectArt={!props.navigationLocked&&!props.screenFocused?()=>props.onInspectCollectible('starry-night'):undefined}/>
    <group position={[-3.50,0,-.60]} rotation={[0,Math.PI/2,0]}><group position={[0,0,-.28]}>
      <Html transform position={[0,2.70,.067]} distanceFactor={1} occlude style={{pointerEvents:props.zone==='office'?'auto':'none'}}><div className="monitor-content" inert={props.zone!=='office'} onClick={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key!=='Escape')e.stopPropagation();}}><div inert={!props.screenFocused} className="monitor-application">{props.computer}</div>{props.zone==='office'&&!props.screenFocused&&<button className="screen-entry" aria-label={props.language==='zh'?'点击使用电脑':'Click to use the computer'} onClick={e=>{e.stopPropagation();props.onScreenFocus();}}/>}</div></Html>
    </group></group>
    <GuestbookBoard data={props.guestbookData} active={props.zone==='guestbook'&&!props.navigationLocked} onOpen={props.onGuestbook}/>
    <Books {...props}/><Tapes {...props}/><LoadedTape records={props.records}/>
    <ProjectionBeam active={!!props.loadedTapeId&&!props.playbackBusy} night={props.night}/>
    <RoomPreparation onPrepared={onPrepared} onError={onError} target={target}/><RoomFirstFrame onReady={onReady} enabled={prepared}/>
  </RecordMotionProvider>;
}
export default function RoomScene(props:Props){
  const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);if(!ready)return null;
  return <RoomSceneContents {...props}/>;
}
function RoomSceneContents(props:Props){
  const [revision,setRevision]=useState(0),[drawn,setDrawn]=useState(false),[error,setError]=useState<Error|null>(null),[extrasError,setExtrasError]=useState(false),[extrasRevision,setExtrasRevision]=useState(0);
  const phase=useMainModelPhase(),onReady=useCallback(()=>{setDrawn(true);setError(null);},[]),onError=useCallback((e:Error)=>setError(e),[]),onExtraError=useCallback(()=>setExtrasError(true),[]);
  const retry=()=>{roomModels.retryFailures();setError(null);setDrawn(false);setExtrasError(false);setRevision(v=>v+1);};
  useEffect(()=>{
    if(drawn||error||props.paused||phase!=='ready')return;
    const timer=setTimeout(()=>setError(new Error('Room did not render after decoding')),30000);return()=>clearTimeout(timer);
  },[drawn,error,props.paused,phase]);
  return <div className="room-scene"><RoomRenderBoundary key={revision} onError={onError}><RoomCanvas {...props} onReady={onReady} onError={onError} extrasReady={drawn} extrasRevision={extrasRevision} onExtraError={onExtraError}/></RoomRenderBoundary>
    <RoomStartup drawn={drawn} error={error} paused={props.paused} language={props.language} onRetry={retry}/>
    {extrasError&&drawn&&!error&&<div className="room-extra-error" role="status"><span>{props.language==='zh'?'有件摆件暂未打开。':'A collectible could not open.'}</span><button onClick={()=>{roomModels.retryFailures();setExtrasError(false);setExtrasRevision(v=>v+1);}}>{props.language==='zh'?'重试摆件':'Retry collectibles'}</button></div>}
  </div>;
}
function RoomCanvas(props:Props&{onReady:()=>void;onError:(e:Error)=>void;extrasReady:boolean;extrasRevision:number;onExtraError:()=>void}){
  const [prepared,setPrepared]=useState(false),onPrepared=useCallback(()=>setPrepared(true),[]);
  const composer=useRef<ComposerInstance>(null),target=useCallback(()=>composer.current?.inputBuffer??null,[]);
  return <Canvas className="room-canvas" inert={props.guestbookOpen||props.paused} events={roomPointerEvents} raycaster={{firstHitOnly:true}} shadows frameloop={props.paused?'never':'demand'} dpr={[1.5,2]} camera={{position:ROOM_VIEWS.overview.camera,fov:38,near:.08,far:100}}
    gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor('#ffffff',0);gl.toneMapping=THREE.AgXToneMapping;gl.toneMappingExposure=1.0;gl.shadowMap.type=THREE.PCFSoftShadowMap;}}>
    {/* Transparent pixels take the page's day/night background independently of room lighting. */}
    <SceneActivity active={!props.paused}/><RoomContextMonitor onError={props.onError}/><RoomLighting night={props.night} screening={!!props.loadedTapeId} lamps={props.lamps} beamActive={!!props.loadedTapeId&&!props.playbackBusy}/>{(props.bookArchiveOpen||props.libraryOpen)&&<ambientLight intensity={props.night?.15:.65}/>}
    <Suspense fallback={props.extrasReady?<RoomLoading language={props.language}/>:null}>{props.bookArchiveOpen?<BookArchive records={props.records} layer={props.bookLayer} locked={props.navigationLocked} owner={props.owner} request={props.recordRequest} activeBookId={props.activeBookId} viewRevision={props.viewRevision} skipRevision={props.skipRevision} onSelect={props.onSelect} onRecord={props.onRecord} onStatus={props.onMotionStatus} onBlank={slot=>props.onBlank('book',slot)}/>:props.libraryOpen?<FilmArchive records={props.records} cabinet={props.filmPage} onPick={props.onSelect} locked={props.navigationLocked}/>:<Furniture props={props} onReady={props.onReady} prepared={prepared} onPrepared={onPrepared} onError={props.onError} target={target}/>}</Suspense>
    <DeferredRoomCollectibles key={props.extrasRevision} enabled={props.extrasReady} locked={props.navigationLocked||props.screenFocused} onInspect={props.onInspectCollectible} onError={props.onExtraError}/>
    {props.extrasReady&&props.records.filter(r=>r.modelVisible&&(r.modelKey||r.modelUrl)).map(record=><RoomAssetBoundary key={record.id+':'+props.extrasRevision} onError={()=>{useGLTF.clear(record.modelUrl||assetUrl(record.modelKey));props.onExtraError();}}><Suspense fallback={null}><SavedModel record={record}/></Suspense></RoomAssetBoundary>)}
    <EffectComposer ref={composer} enabled={prepared} multisampling={0}><N8AO halfRes aoRadius={.25} intensity={.8} distanceFalloff={1} color="#5c594f"/><ToneMapping mode={ToneMappingMode.AGX}/><RoomAntialiasing/></EffectComposer>
    {props.guestbookOpen&&<GuestbookCamera/>}
    {!props.guestbookOpen&&!props.libraryOpen&&!props.bookArchiveOpen&&<RoomNavigation screenFocused={props.screenFocused} zone={props.zone} revision={props.viewRevision} locked={props.navigationLocked} onZone={props.onZone}/>}
  </Canvas>;
}
export function ReviewScene({item}:{item:string}){
  const glasses=useMemo(()=>item==='glasses'?createAviators():null,[item]);
  const part=({sofa:'lounge',books:'bookshelf',cinema:'media cabinet'} as Record<string,string>)[item]||item;
  return <Canvas shadows frameloop="demand" dpr={[1,1.5]} camera={{position:item==='glasses'?[1.7,.9,2.5]:[5,4,6],fov:40}}>
    <color attach="background" args={['#ffffff']}/><StudioLight/><ambientLight intensity={.5}/><directionalLight position={[-4,7,6]} intensity={2.5} castShadow/>
    <Suspense fallback={null}><Center>{glasses?<primitive object={glasses}/>:<SunlitRoom part={part}/>}</Center></Suspense>
    <CameraControls makeDefault minDistance={item==='glasses'?1.3:2} maxDistance={16} minPolarAngle={.3} maxPolarAngle={1.6}/>
  </Canvas>;
}
