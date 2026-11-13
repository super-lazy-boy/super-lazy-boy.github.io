import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,quantize,prune} from '@gltf-transform/functions';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NEW_COLLECTIBLE_IDS} from '../lib/collectibles.ts';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),versions=JSON.parse(await readFile('public/collectibles-version.json','utf8'));
for(const id of process.argv.length>2?process.argv.slice(2):NEW_COLLECTIBLE_IDS){
  const file='public/models/collectibles/'+id+'.glb',doc=await io.read(file);
  await doc.transform(dedup(),weld(),quantize({quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14}),prune());await io.write(file,doc);
  const bytes=await readFile(file),layout=JSON.parse(await readFile('public/models/collectibles/'+id+'-layout.json','utf8'));
  versions[id]={sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,dimensions:layout.dimensions,sourceParts:layout.sourceParts};
}
await writeFile('public/collectibles-version.json',JSON.stringify(versions,null,2)+'\n');console.log(JSON.stringify(versions));
