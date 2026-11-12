import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,quantize,prune} from '@gltf-transform/functions';
import {stat} from 'node:fs/promises';
const file='public/models/sunlit-room/room.glb',io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const before=(await stat(file)).size,doc=await io.read(file);
await doc.transform(dedup(),weld(),quantize({quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14}),prune());
await io.write(file,doc);
console.log(JSON.stringify({before,after:(await stat(file)).size}));
