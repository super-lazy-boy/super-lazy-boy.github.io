import { readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { parsePublicRecords } from "../lib/public-records.ts";
import { serviceConfig } from "../lib/service-config.ts";

const root=new URL("../",import.meta.url);
try {
  serviceConfig.parse(JSON.parse(await readFile(new URL("content/services.json",root),"utf8")));
  const records=parsePublicRecords(JSON.parse(await readFile(new URL("content/public-records.json",root),"utf8")));
  console.log(`Validated ${records.length} explicitly public records.`);
  await build({configFile:fileURLToPath(new URL("github-pages/vite.config.ts",root))});
  await writeFile(new URL("docs/.nojekyll",root),"");
  await copyFile(new URL("docs/index.html",root),new URL("docs/404.html",root));
  console.log("Independent website ready: docs. Commit source changes and docs together to publish.");
} catch(error) {
  console.error("Website was not built. Check content/public-records.json:",error.message);
  process.exitCode=1;
}
