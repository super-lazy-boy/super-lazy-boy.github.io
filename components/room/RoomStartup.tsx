import {Component,useEffect,type ReactNode} from 'react';
import {useThree} from '@react-three/fiber';
import {useRoomLoadingPercent} from '@/lib/room-model-resources';
import {useTardisTexturePhase} from '@/lib/room-texture-resources';
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
  const progress=useRoomLoadingPercent(),textures=useTardisTexturePhase(),zh=language==='zh',failed=!!error,ready=drawn&&!failed;
  const percent=ready?100:textures==='ready'?progress:Math.min(94,progress);
  const label=failed?(zh?'房间暂时未能打开，请重试。':'The room could not open. Please retry.'):
    paused?(zh?'准备好后返回房间继续打开':'Return to the room to continue opening'):
    progress<90?(zh?'正在打开这间房间':'Opening the room'):
    progress<96||textures!=='ready'?(zh?'正在安放物品与贴图':'Preparing objects and textures'):(zh?'正在准备光影与画面':'Preparing the light and view');
  return <div className={'room-startup'+(ready?' is-ready':'')} aria-hidden={ready} inert={ready}>
    <div className="room-startup-card" role={failed?'alert':'status'} aria-live="polite">
      <span className="room-startup-eyebrow">A ROOM OF MY OWN</span>
      <div className="room-startup-heading"><span>{ready?(zh?'房间已准备好':'The room is ready'):label}</span>{!failed&&<small aria-hidden="true">{percent}%</small>}</div>
      {!failed&&<progress className="room-startup-progress" value={percent} max={100} aria-label={zh?'房间准备进度':'Room preparation progress'}/>}
      <p>{failed?(zh?'已载入的模型会保留，重试后继续准备。':'Loaded models are kept for the next attempt.'):(zh?'准备完成后，房间与摆件会一起呈现。':'The room and its collection will appear together.')}</p>
      {failed&&<button className="button subtle" onClick={onRetry}>{zh?'重新打开':'Try again'}</button>}
    </div>
  </div>;
}
