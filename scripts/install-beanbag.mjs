import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PropertyType} from '@gltf-transform/core';
import {copyToDocument,dedup,prune,unpartition} from '@gltf-transform/functions';
import {createModelIO} from './model-io.mjs';
import {hashBytes} from './model-fidelity.mjs';

const io=createModelIO(),file='public/models/sunlit-room/room.glb';
const baseline=await io.readBinary(await readFile(file)),candidate=await io.read('work/qa/beanbag-candidate.glb');
const replaced=node=>['lounge','soft furnishings'].includes(node.getExtras().asset_group);
function signature(node){
  const primitives=node.getMesh().listPrimitives().map(primitive=>{
    const indices=Uint32Array.from(primitive.getIndices()?.getArray()||[]);
    for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];if(b<a&&b<c){indices[i]=b;indices[i+1]=c;indices[i+2]=a;}else if(c<a&&c<b){indices[i]=c;indices[i+1]=a;indices[i+2]=b;}}
    const material=primitive.getMaterial(),textures=['getBaseColorTexture','getNormalTexture','getMetallicRoughnessTexture','getOcclusionTexture','getEmissiveTexture'].map(key=>material?.[key]()).map(texture=>texture?hashBytes(texture.getImage()):null);
    return {attributes:primitive.listSemantics().sort().map(key=>{const a=primitive.getAttribute(key),v=a.getArray();return [key,a.getType(),a.getNormalized(),hashBytes(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))];}),indices:hashBytes(new Uint8Array(indices.buffer)),material:material?{name:material.getName(),base:material.getBaseColorFactor(),roughness:material.getRoughnessFactor(),metalness:material.getMetallicFactor(),emissive:material.getEmissiveFactor(),alpha:material.getAlphaMode(),doubleSided:material.getDoubleSided(),textures}:null};
  });
  return hashBytes(JSON.stringify({name:node.getName(),world:node.getWorldMatrix(),primitives}));
}
const unchanged=()=>Object.fromEntries(baseline.getRoot().listNodes().filter(node=>node.getMesh()&&!replaced(node)).map(node=>[node.getName(),signature(node)]));
const before=unchanged();
for(const node of baseline.getRoot().listNodes().filter(replaced))node.dispose();
const additions=candidate.getRoot().listNodes().filter(node=>node.getMesh()&&replaced(node));assert.ok(additions.length>=5);
for(const extension of candidate.getRoot().listExtensionsUsed()){
  const target=baseline.createExtension(extension.constructor);if(extension.isRequired())target.setRequired(true);
}
const copied=copyToDocument(baseline,candidate,additions),scene=baseline.getRoot().getDefaultScene()||baseline.getRoot().listScenes()[0];
for(const node of additions)scene.addChild(copied.get(node));
// Reuse identical original cloth/rug images without touching unrelated vertex buffers.
await baseline.transform(dedup({propertyTypes:[PropertyType.TEXTURE,PropertyType.MATERIAL]}),prune(),unpartition());
assert.deepEqual(unchanged(),before,'Every unrelated exported room object must retain its approved geometry, UVs, materials and images');
for(const extension of baseline.getRoot().listExtensionsUsed())if(extension.extensionName==='EXT_meshopt_compression')extension.dispose();
await writeFile(file,await io.writeBinary(baseline));
await writeFile('work/qa/beanbag-preserved-export.json',JSON.stringify({unchangedGroups:Object.keys(before).length,signatures:before},null,2));
console.log('BEANBAG_INSTALLED',JSON.stringify({unchangedGroups:Object.keys(before).length,replacedGroups:additions.length,uncompressedBytes:(await readFile(file)).length}));
