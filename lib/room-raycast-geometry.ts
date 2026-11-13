import {BufferAttribute,BufferGeometry} from 'three';
import {MeshBVH,CENTER,type SerializedBVH} from 'three-mesh-bvh';

export type RaycastGeometry={positions:Float32Array;index:Uint32Array|null;groups:{start:number;count:number;materialIndex?:number}[];drawRange:{start:number;count:number}};

/** Transfer copies only: the geometry being displayed must remain usable during construction. */
export function copyRaycastGeometry(geometry:BufferGeometry):RaycastGeometry {
  const attribute=geometry.getAttribute('position'),positions=new Float32Array(attribute.count*3);
  // getX/Y/Z also handle normalized quantized and interleaved GLTF attributes.
  for(let i=0;i<attribute.count;i++){positions[i*3]=attribute.getX(i);positions[i*3+1]=attribute.getY(i);positions[i*3+2]=attribute.getZ(i);}
  const index=geometry.index?Uint32Array.from(geometry.index.array):null;
  return {positions,index,groups:geometry.groups.map(group=>({...group})),drawRange:{...geometry.drawRange}};
}

export function buildRoomBoundsTree(payload:RaycastGeometry):SerializedBVH {
  const geometry=new BufferGeometry().setAttribute('position',new BufferAttribute(payload.positions,3));
  if(payload.index)geometry.setIndex(new BufferAttribute(payload.index,1));
  for(const group of payload.groups)geometry.addGroup(group.start,group.count,group.materialIndex);
  geometry.setDrawRange(payload.drawRange.start,payload.drawRange.count);
  const tree=new MeshBVH(geometry,{strategy:CENTER,indirect:true,targetLeafSize:8});
  // Indirection preserves the original index order, UVs, materials and face identities.
  return MeshBVH.serialize(tree,{cloneBuffers:false});
}
