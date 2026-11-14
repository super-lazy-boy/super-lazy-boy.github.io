import { readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import {createHash} from 'node:crypto';
import { parsePublicRecords } from "../lib/public-records.ts";
import { serviceConfig } from "../lib/service-config.ts";
import { NEW_COLLECTIBLE_IDS } from '../lib/collectibles.ts';
import {applicationVersion} from './application-version.mjs';

const root=new URL("../",import.meta.url);
try {
  serviceConfig.parse(JSON.parse(await readFile(new URL("content/services.json",root),"utf8")));
  const records=parsePublicRecords(JSON.parse(await readFile(new URL("content/public-records.json",root),"utf8")));
  console.log(`Validated ${records.length} explicitly public records.`);
  const collectibles={};
  for(const id of NEW_COLLECTIBLE_IDS){
    const bytes=await readFile(new URL('public/models/collectibles/'+id+'.glb',root));
    const layout=JSON.parse(await readFile(new URL('public/models/collectibles/'+id+'-layout.json',root),'utf8'));
    collectibles[id]={sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,dimensions:layout.dimensions,sourceParts:layout.sourceParts};
  }
  await writeFile(new URL('public/collectibles-version.json',root),JSON.stringify(collectibles,null,2)+'\n');
  const model=await readFile(new URL('public/models/sunlit-room/room.glb',root));
  const modelSha256=createHash('sha256').update(model).digest('hex');
  const appSha256=await applicationVersion(root);
  const releaseSha256=createHash('sha256').update(modelSha256).update(JSON.stringify(collectibles)).update(appSha256).digest('hex');
  const layout=JSON.parse(await readFile(new URL('public/models/sunlit-room/layout.json',root),'utf8'));
  await writeFile(new URL('public/room-version.json',root),JSON.stringify({id:'sunlit-'+releaseSha256.slice(0,12),appSha256,modelSha256,modelBytes:model.length,sourceParts:layout.sourceObjectCount,publicRecords:records.length},null,2)+'\n');
  await build({configFile:fileURLToPath(new URL("github-pages/vite.config.ts",root))});
  await writeFile(new URL("docs/.nojekyll",root),"");
  await copyFile(new URL("docs/index.html",root),new URL("docs/404.html",root));
  console.log("Independent website ready: docs. Commit source changes and docs together to publish.");
} catch(error) {
  console.error("Website was not built. Check content/public-records.json:",error.message);
  process.exitCode=1;
}
