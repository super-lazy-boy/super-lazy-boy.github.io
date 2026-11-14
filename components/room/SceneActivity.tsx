import {useEffect,useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';

/** Keep GPU resources while an inspector is closed, and resume with a fresh shadow image. */
export default function SceneActivity({active,interactive=active,cacheShadows=false}:{active:boolean;interactive?:boolean;cacheShadows?:boolean}){
  const {gl,invalidate,setEvents}=useThree();
  useLayoutEffect(()=>{setEvents({enabled:active&&interactive});if(active){gl.shadowMap.needsUpdate=true;invalidate();}},[active,interactive,gl,invalidate,setEvents]);
  useEffect(()=>{
    if(!cacheShadows)return;
    const previous=gl.shadowMap.autoUpdate;gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;
    return()=>{gl.shadowMap.autoUpdate=previous;};
  },[gl,cacheShadows]);
  return null;
}
