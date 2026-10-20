import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../content/services.json',import.meta.url),'utf8'));
const headers={apikey:config.publishableKey,'Content-Type':'application/json'};
const call=async(path,init={})=>{const response=await fetch(config.url+path,{headers,signal:AbortSignal.timeout(20000),...init});return {status:response.status,data:await response.json()};};
const settings=await call('/auth/v1/settings');
const records=await call('/rest/v1/rpc/room_records_list',{method:'POST',body:'{}'});
const rejected=await call('/rest/v1/rpc/room_records_save',{method:'POST',body:JSON.stringify({p_payload:{kind:'book',title:'Unauthorized write must fail'},p_entrypoint:'book'})});
const table=await call('/rest/v1/records?select=id');
const result={githubEnabled:settings.data.external?.github===true,publicRead:records.status===200&&records.data.owner===false,
  publicRecordCount:records.data.records?.length,anonymousWriteRejected:rejected.status===401||rejected.status===403,
  privateTableNotExposed:table.status===404};
console.log(JSON.stringify(result,null,2));
if(Object.values({...result,publicRecordCount:true}).some(value=>value!==true))process.exitCode=1;
