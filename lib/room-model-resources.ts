import {GLTFLoader,MeshoptDecoder,type GLTF} from 'three-stdlib';
import {LoadingManager} from 'three';
import {ModelResourceCache,downloadModel} from './model-resource-cache';
import {useModelProgress,useModelPhase} from './model-resource-hooks';
import release from '../public/room-version.json';
import collectibles from '../public/collectibles-version.json';
import type {NewCollectibleId} from './collectibles';

export const ROOM_MODEL_URL='./models/sunlit-room/room.glb?v='+release.modelSha256.slice(0,12);
export const collectibleModelURL=(id:NewCollectibleId)=>'./models/collectibles/'+id+'.glb?v='+collectibles[id].sha256.slice(0,12);
const bytesByURL=new Map([[ROOM_MODEL_URL,release.modelBytes],...Object.entries(collectibles).map(([id,version])=>['./models/collectibles/'+id+'.glb?v='+version.sha256.slice(0,12),version.bytes] as [string,number])]);
const decoder=MeshoptDecoder();

export const roomModels=new ModelResourceCache<GLTF>(async(url,context)=>{
  const response=await fetch(url,{signal:context.signal,cache:context.attempt?'reload':'default'});
  const bytes=await downloadModel(response,context,bytesByURL.get(url));context.decoding();
  const manager=new LoadingManager(),loader=new GLTFLoader(manager);loader.setMeshoptDecoder(decoder);
  let textureError:Error|null=null;manager.onError=path=>{textureError=new Error('Model texture could not load: '+path);};
  const result=await loader.parseAsync(bytes,new URL('.',new URL(url,location.href)).href);
  if(context.signal.aborted)throw context.signal.reason;
  if(textureError)throw textureError;
  return result;
});
export function useRoomModel(url:string){return roomModels.read(url);}
export function useMainModelProgress(){return useModelProgress(roomModels,ROOM_MODEL_URL);}
export function useMainModelPhase(){return useModelPhase(roomModels,ROOM_MODEL_URL);}
if(typeof window!=='undefined')void roomModels.preload(ROOM_MODEL_URL);
