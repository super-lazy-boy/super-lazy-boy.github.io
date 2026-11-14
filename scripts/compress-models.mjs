import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {createModelIO} from './model-io.mjs';
import {modelFidelity,hashBytes} from './model-fidelity.mjs';
import {NEW_COLLECTIBLE_IDS} from '../lib/collectibles.ts';

const io=createModelIO(),files=['public/models/sunlit-room/room.glb',...NEW_COLLECTIBLE_IDS.map(id=>'public/models/collectibles/'+id+'.glb')],pending=[],reports=[];
let previous=[];try{previous=JSON.parse(await readFile('design/model-compression.json','utf8')).models;}catch(error){if(error.code!=='ENOENT')throw error;}
for(const file of files){
  const before=await readFile(file),document=await io.readBinary(before);
  const existing=previous.find(item=>item.file===file&&item.afterSha256===hashBytes(before));
  const fidelityVersion=existing?.fidelityVersion??(existing?1:2),fidelity=await modelFidelity(io,document,fidelityVersion);
  if(document.getRoot().listExtensionsRequired().some(extension=>extension.extensionName==='EXT_meshopt_compression')){
    const report=existing;
    assert.ok(report,'A compressed asset needs its matching fidelity report: '+file);
    for(const [key,value] of Object.entries(fidelity))assert.equal(report[key],value,file+' '+key);
    reports.push(report);continue;
  }
  // Encoding only: no decimation, quantization, texture conversion, material edits or vertex reordering.
  document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  const after=await io.writeBinary(document),decoded=await io.readBinary(after),verified=await modelFidelity(io,decoded,fidelityVersion);
  assert.deepEqual(verified,fidelity,'Decoded appearance and geometry must match for '+file);
  assert.ok(after.length<before.length,'Compression must save transfer bytes for '+file);
  const report={file,fidelityVersion,beforeBytes:before.length,afterBytes:after.length,beforeSha256:hashBytes(before),afterSha256:hashBytes(after),...verified};
  pending.push({file,bytes:after});reports.push(report);
}
// Validate every model before replacing any public asset.
for(const item of pending)await writeFile(item.file,item.bytes);
await mkdir('design',{recursive:true});
await writeFile('design/model-compression.json',JSON.stringify({method:'EXT_meshopt_compression with no lossy transforms; decoded vertex attributes, oriented faces, textures, materials and scene transforms verified',models:reports},null,2)+'\n');
console.log(JSON.stringify(reports,null,2));
