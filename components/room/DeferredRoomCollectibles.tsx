import {Component,Suspense,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {NEW_COLLECTIBLE_IDS,type NewCollectibleId,type CollectibleId} from '@/lib/collectibles';
import {CINEMA_LAYOUT} from '@/lib/cinema-layout';
import {RoomCollectibles} from './CollectibleModels';
import TardisOrnament from './TardisOrnament';

const ITEMS=[...NEW_COLLECTIBLE_IDS,'tardis'] as const;
function idle(task:()=>void){
  if(typeof window.requestIdleCallback==='function'){const id=window.requestIdleCallback(task,{timeout:700});return()=>window.cancelIdleCallback(id);}
  const id=window.setTimeout(task,32);return()=>clearTimeout(id);
}
export class RoomAssetBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error){console.error('A room collectible could not open',error);this.props.onError();}
  render(){return this.state.failed?null:this.props.children;}
}
function Item({id,index,complete,locked,onInspect}:{id:NewCollectibleId|'tardis';index:number;complete:(index:number)=>void;locked:boolean;onInspect:(id:CollectibleId)=>void}){
  useEffect(()=>complete(index),[index,complete]);
  return id==='tardis'?<group position={CINEMA_LAYOUT.origin} userData={{roomZone:'cinema'}}><TardisOrnament disabled={locked} onInspect={()=>onInspect('tardis')}/></group>:
    <RoomCollectibles ids={[id]} locked={locked} onInspect={onInspect}/>;
}
export default function DeferredRoomCollectibles({enabled,locked,onInspect,onError}:{enabled:boolean;locked:boolean;onInspect:(id:CollectibleId)=>void;onError:()=>void}){
  const [count,setCount]=useState(0),current=useRef(0),pending=useRef<null|(()=>void)>(null);
  const complete=useCallback((index:number)=>{
    if(current.current!==index+1)return;
    pending.current?.();pending.current=idle(()=>{if(current.current===index+1){current.current=Math.min(ITEMS.length,index+2);setCount(current.current);}});
  },[]);
  useEffect(()=>{
    if(!enabled)return;
    pending.current=idle(()=>{current.current=1;setCount(1);});
    return()=>{pending.current?.();pending.current=null;};
  },[enabled]);
  return <>{ITEMS.slice(0,count).map((id,index)=><RoomAssetBoundary key={id} onError={()=>{complete(index);onError();}}><Suspense fallback={null}><Item id={id} index={index} complete={complete} locked={locked} onInspect={onInspect}/></Suspense></RoomAssetBoundary>)}</>;
}
