import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../content/services.json',import.meta.url),'utf8'));
const headers={apikey:config.publishableKey,'Content-Type':'application/json'};
const call=async(path,init={})=>{const response=await fetch(config.url+path,{headers,signal:AbortSignal.timeout(20000),...init});return {status:response.status,data:await response.json()};};
const settings=await call('/auth/v1/settings');
const records=await call('/rest/v1/rpc/room_records_list',{method:'POST',body:'{}'});
const rejected=await call('/rest/v1/rpc/room_records_save',{method:'POST',body:JSON.stringify({p_payload:{kind:'book',title:'Unauthorized write must fail'},p_entrypoint:'book'})});
const table=await call('/rest/v1/records?select=id');
const profile=JSON.parse(await readFile(new URL('../content/profile.json',import.meta.url),'utf8'));
let oauthCallbackMatches=false,clientIdIsNotUsername=false,githubAuthorizationAccepted=false;
if(settings.data.external?.github===true){
  const endpoint=new URL(config.url+'/auth/v1/authorize');
  endpoint.searchParams.set('provider','github');
  endpoint.searchParams.set('redirect_to','https://super-lazy-boy.github.io/');
  const response=await fetch(endpoint,{headers,redirect:'manual',signal:AbortSignal.timeout(20000)});
  const location=response.headers.get('location');
  if(location){
    const target=new URL(location);
    if(target.origin==='https://github.com'&&target.pathname==='/login/oauth/authorize'){
      const clientId=target.searchParams.get('client_id');
      clientIdIsNotUsername=!!clientId&&clientId!==profile.name;
      oauthCallbackMatches=target.searchParams.get('redirect_uri')===config.url+'/auth/v1/callback';
      if(clientIdIsNotUsername&&oauthCallbackMatches){
        // No account cookies are sent. Do not print or persist the one-time OAuth state.
        const github=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(20000)});
        await github.body?.cancel();
        githubAuthorizationAccepted=[200,302,303].includes(github.status);
      }
    }
  }
}
const result={githubEnabled:settings.data.external?.github===true,publicRead:records.status===200&&records.data.owner===false,
  publicRecordCount:records.data.records?.length,anonymousWriteRejected:rejected.status===401||rejected.status===403,
  privateTableNotExposed:table.status===404,oauthCallbackMatches,clientIdIsNotUsername,githubAuthorizationAccepted};
console.log(JSON.stringify(result,null,2));
if(Object.values({...result,publicRecordCount:true}).some(value=>value!==true))process.exitCode=1;
