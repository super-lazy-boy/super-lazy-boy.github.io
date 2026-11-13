import {buildRoomBoundsTree,type RaycastGeometry} from './room-raycast-geometry.ts';

type WorkerScope={onmessage:((event:MessageEvent<RaycastGeometry>)=>void)|null;postMessage:(message:unknown,transfer:Transferable[])=>void};
const scope=self as unknown as WorkerScope;
scope.onmessage=({data})=>{
  try{
    const serialized=buildRoomBoundsTree(data),transfer:Transferable[]=[...serialized.roots];
    if(serialized.index)transfer.push(serialized.index.buffer as ArrayBuffer);
    if(serialized.indirectBuffer)transfer.push(serialized.indirectBuffer.buffer as ArrayBuffer);
    scope.postMessage({serialized},transfer);
  }catch(error){scope.postMessage({error:error instanceof Error?error.message:String(error)},[]);}
};
