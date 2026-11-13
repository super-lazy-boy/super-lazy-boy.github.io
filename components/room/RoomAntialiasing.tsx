import {useEffect,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {SMAAPreset,SMAAEffect} from 'postprocessing';

type LookupEvents={addEventListener:(type:'load',listener:()=>void)=>void;removeEventListener:(type:'load',listener:()=>void)=>void};

/** Smooth the completed AO/tone-mapped image; canvas MSAA does not cover those passes. */
export default function RoomAntialiasing(){
  const effect=useMemo(()=>new SMAAEffect({preset:SMAAPreset.ULTRA}),[]),invalidate=useThree(state=>state.invalidate);
  useLayoutEffect(()=>{
    // postprocessing emits `load`, but its Effect typings currently list only `change`.
    const antialiasing=effect as SMAAEffect&LookupEvents;
    // The lookup images load asynchronously, including when a cached room is already idle.
    const ready=()=>invalidate();antialiasing.addEventListener('load',ready);invalidate();
    return()=>antialiasing.removeEventListener('load',ready);
  },[effect,invalidate]);
  useEffect(()=>()=>effect.dispose(),[effect]);
  return <primitive object={effect}/>;
}
