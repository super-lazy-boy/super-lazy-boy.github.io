import {createHash} from 'node:crypto';

export const hashBytes=bytes=>createHash('sha256').update(bytes).digest('hex');
const attributeHash=accessor=>({type:accessor.getType(),normalized:accessor.getNormalized(),count:accessor.getCount(),componentType:accessor.getComponentType(),sha256:hashBytes(new Uint8Array(accessor.getArray().buffer,accessor.getArray().byteOffset,accessor.getArray().byteLength))});
function indexHash(primitive){
  const indices=primitive.getIndices();if(!indices)return null;
  const values=Uint32Array.from(indices.getArray());
  // Meshopt's triangle codec permits cyclic rotation within a face, preserving winding and every corner.
  if(primitive.getMode()===4)for(let i=0;i<values.length;i+=3){
    const a=values[i],b=values[i+1],c=values[i+2];
    if(b<a&&b<c){values[i]=b;values[i+1]=c;values[i+2]=a;}
    else if(c<a&&c<b){values[i]=c;values[i+1]=a;values[i+2]=b;}
  }
  return {count:values.length,sha256:hashBytes(new Uint8Array(values.buffer))};
}
export async function modelFidelity(io,document,version=1){
  const primitives=document.getRoot().listMeshes().map(mesh=>mesh.listPrimitives().map(p=>({
    mode:p.getMode(),indices:indexHash(p),attributes:Object.fromEntries(p.listSemantics().sort().map(semantic=>[semantic,attributeHash(p.getAttribute(semantic))])),
    targets:p.listTargets().map(target=>Object.fromEntries(target.listSemantics().sort().map(semantic=>[semantic,attributeHash(target.getAttribute(semantic))])))
  })));
  const {json}=await io.writeJSON(document),appearance={};
  for(const key of ['asset','scene','scenes','nodes','meshes','materials','samplers','textures','animations','skins','cameras','extensions'])if(json[key]!==undefined)appearance[key]=json[key];
  if(version>=2)appearance.meshes=(json.meshes||[]).map(mesh=>({...mesh,primitives:mesh.primitives.map(({indices,attributes,targets,...primitive})=>({
    ...primitive,attributes:Object.keys(attributes).sort(),...(targets?{targets:targets.map(target=>Object.keys(target).sort())}:{})
  }))}));
  // V2 ignores renumbered accessor references, while the geometry hash still checks their full data.
  // Primitive material bindings, mesh order, transforms and every appearance property remain checked.
  appearance.images=(json.images||[]).map(({bufferView,uri,...image})=>image);
  appearance.extensionsRequired=(json.extensionsRequired||[]).filter(name=>name!=='EXT_meshopt_compression').sort();
  const images=document.getRoot().listTextures().map(texture=>({mime:texture.getMimeType(),sha256:hashBytes(texture.getImage())}));
  const appearanceSha256=hashBytes(JSON.stringify({appearance,images})),geometrySha256=hashBytes(JSON.stringify(primitives));
  let triangles=0;for(const mesh of document.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMode()===4)triangles+=(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3;
  return {geometrySha256,appearanceSha256,triangles,primitives:primitives.reduce((sum,list)=>sum+list.length,0),images:images.length};
}
