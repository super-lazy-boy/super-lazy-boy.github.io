import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';

/** Priority 2 runs after EffectComposer's actual draw at priority 1. */
export default function RoomFirstFrame({onReady,enabled=true}:{onReady:()=>void;enabled?:boolean}){
  const notified=useRef(false);
  useFrame(({gl})=>{if(enabled&&!notified.current&&gl.info.render.frame>0&&!gl.getContext().isContextLost()){notified.current=true;onReady();}},2);
  return null;
}
