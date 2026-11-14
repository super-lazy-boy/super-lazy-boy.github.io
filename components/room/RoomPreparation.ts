import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import type {WebGLRenderTarget} from 'three';

/** Parallel shader compilation prepares the full-quality room before its first draw. */
export default function RoomPreparation({onPrepared,onError,target}:{onPrepared:()=>void;onError:(error:Error)=>void;target?:()=>WebGLRenderTarget|null}){
  const {gl,scene,camera,invalidate}=useThree();
  useEffect(()=>{
    let active=true;
    void Promise.resolve().then(()=>{
      const previous=gl.getRenderTarget();
      // Match the composer's linear render target, so the first draw reuses these programs.
      try{if(target)gl.setRenderTarget(target());return gl.compileAsync(scene,camera);}finally{gl.setRenderTarget(previous);}
    }).then(()=>{if(active){gl.shadowMap.needsUpdate=true;onPrepared();invalidate();}}).catch(error=>{if(active)onError(error instanceof Error?error:new Error(String(error)));});
    return()=>{active=false;};
  },[gl,scene,camera,invalidate,onPrepared,onError,target]);
  return null;
}
