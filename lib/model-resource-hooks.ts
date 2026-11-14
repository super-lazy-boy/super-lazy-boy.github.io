import {useSyncExternalStore} from 'react';
import type {ModelResourceCache} from './model-resource-cache';

export function useModelProgress<T>(cache:ModelResourceCache<T>,url:string){
  return useSyncExternalStore(cache.subscribe,()=>cache.snapshot(url),()=>cache.snapshot(url));
}
/** Byte updates belong to the loading label, not the canvas and its postprocessing passes. */
export function useModelPhase<T>(cache:ModelResourceCache<T>,url:string){
  return useSyncExternalStore(cache.subscribe,()=>cache.snapshot(url).phase,()=>cache.snapshot(url).phase);
}
