import {Mesh,type BufferGeometry,type Object3D} from 'three';
import {MeshBVH,acceleratedRaycast,type SerializedBVH} from 'three-mesh-bvh';
import {copyRaycastGeometry} from './room-raycast-geometry';

const requested=new WeakSet<BufferGeometry>(),queue=new Set<BufferGeometry>();
let worker:Worker|null=null,current:BufferGeometry|null=null,scheduled=false,failed=false,idleClose:ReturnType<typeof setTimeout>|null=null;

function stopWorker(){worker?.terminate();worker=null;}
function fail(error:unknown){failed=true;current=null;queue.clear();stopWorker();console.warn('Room picking uses its standard fallback because acceleration is unavailable.',error);}
function schedule(){
  if(scheduled||current||failed)return;
  if(queue.size===0){if(idleClose!==null)clearTimeout(idleClose);idleClose=setTimeout(stopWorker,1500);return;}
  if(idleClose!==null){clearTimeout(idleClose);idleClose=null;}scheduled=true;
  const run=()=>{
    scheduled=false;if(failed||current)return;
    try{
      if(!worker){
        worker=new Worker(new URL('./room-raycast.worker.ts',import.meta.url),{type:'module'});
        worker.onerror=event=>fail(event.message);
        worker.onmessage=({data}:{data:{serialized?:SerializedBVH;error?:string}})=>{
          if(data.error||!data.serialized){fail(data.error);return;}
          // Drei also declares an older boundsTree type; the builder and raycaster here both use 0.9.
          try{if(current)Object.assign(current,{boundsTree:MeshBVH.deserialize(data.serialized,current,{setIndex:false})});current=null;schedule();}catch(error){fail(error);}
        };
      }
      current=queue.values().next().value??null;if(!current)return;queue.delete(current);
      const payload=copyRaycastGeometry(current),transfer:Transferable[]=[payload.positions.buffer as ArrayBuffer];
      if(payload.index)transfer.push(payload.index.buffer as ArrayBuffer);
      worker.postMessage(payload,transfer);
    }catch(error){fail(error);}
  };
  // Let the first image and input run before copying the next geometry. BVH work runs off-thread.
  if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(run,{timeout:1500});else setTimeout(run,32);
}

export function accelerateRoomObject(root:Object3D){
  if(typeof Worker==='undefined'||failed)return;
  root.traverse(object=>{
    if(!(object instanceof Mesh)||object.type!=='Mesh')return;
    const geometry=object.geometry,position=geometry.getAttribute('position');if(!position||position.count<128)return;
    object.raycast=acceleratedRaycast;
    if(geometry.boundsTree||requested.has(geometry))return;requested.add(geometry);queue.add(geometry);
  });
  schedule();
}
