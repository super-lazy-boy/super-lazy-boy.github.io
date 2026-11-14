import {createElement,Suspense,useCallback,useState,type ReactNode} from 'react';
import type {WebGLRenderTarget} from 'three';
import RoomPreparation from './RoomPreparation.ts';
import RoomFirstFrame from './RoomFirstFrame.ts';

export type RoomSceneMode='room'|'films'|'books';
type Props={mode:RoomSceneMode;room:ReactNode;films:ReactNode;books:ReactNode;fallback:ReactNode;effectsReady:boolean;onPrepared:()=>void;onReady:()=>void;onError:(error:Error)=>void;target:()=>WebGLRenderTarget|null};

/** A mode owns its entire object tree. Hidden room props must never pick or shadow an archive. */
export default function RoomSceneContent({mode,room,films,books,fallback,effectsReady,onPrepared,onReady,onError,target}:Props){
  const [preparedMode,setPreparedMode]=useState<RoomSceneMode|null>(null);
  const prepared=useCallback(()=>{setPreparedMode(mode);onPrepared();},[mode,onPrepared]);
  // One boundary commits the full collection, including image resources and saved custom models.
  return createElement(Suspense,{fallback},mode==='books'?books:mode==='films'?films:room,
    effectsReady&&createElement(RoomPreparation,{key:'prepare:'+mode,onPrepared:prepared,onError,target}),
    createElement(RoomFirstFrame,{key:'frame:'+mode,onReady,enabled:effectsReady&&preparedMode===mode}));
}
