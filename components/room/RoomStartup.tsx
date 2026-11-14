import {Component,useEffect,type ReactNode} from 'react';
import {useThree} from '@react-three/fiber';
import {useMainModelProgress} from '@/lib/room-model-resources';
import {roomLoadingPercent} from '@/lib/model-resource-cache';
export {default as RoomFirstFrame} from './RoomFirstFrame';

export class RoomRenderBoundary extends Component<{children:ReactNode;onError:(error:Error)=>void},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error){console.error('Room rendering failed',error);this.props.onError(error);}
  render(){return this.state.failed?null:this.props.children;}
}

export function RoomContextMonitor({onError}:{onError:(error:Error)=>void}){
  const {gl}=useThree();
  useEffect(()=>{
    const lost=(event:Event)=>{event.preventDefault();onError(new Error('WebGL context lost'));};
    gl.domElement.addEventListener('webglcontextlost',lost);
    return()=>gl.domElement.removeEventListener('webglcontextlost',lost);
  },[gl,onError]);return null;
}
export default function RoomStartup({drawn,error,paused,language,onRetry}:{drawn:boolean;error:Error|null;paused:boolean;language:'zh'|'en';onRetry:()=>void}){
  const progress=useMainModelProgress(),zh=language==='zh',percent=roomLoadingPercent(progress);
  const failed=error||progress.error;
  if(drawn&&!failed)return null;
  const label=failed?(zh?'房间暂时未能打开，请重试。':'The room could not open. Please retry.'):
    paused?(zh?'准备好后返回房间继续打开':'Return to the room to continue opening'):
    progress.phase==='downloading'||progress.phase==='idle'?(zh?'正在打开这间房间':'Opening the room'):
    progress.phase==='decoding'?(zh?'正在准备房间中的物品':'Preparing the room'):(zh?'正在准备画面':'Preparing the view');
  return <div className="room-startup" role={failed?'alert':'status'} aria-live="polite"><div className="room-model-loading"><span>{label}</span>{!failed&&percent!==null&&<small>{percent}%</small>}{failed&&<button className="button subtle" onClick={onRetry}>{zh?'重新打开':'Try again'}</button>}</div></div>;
}
