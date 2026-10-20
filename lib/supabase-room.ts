import type {SupabaseClient} from '@supabase/supabase-js';
import type {RoomRecord} from './room-types';

const bucket='room-assets';
const reply=(data:unknown,status=200)=>Response.json(data,{status});
const message=(error:unknown)=>error instanceof Error?error.message:'操作未成功，请重试。';

export function createRoomRequest(client:SupabaseClient) {
  const rpc=async(name:string,args:Record<string,unknown>={})=>{
    const {data,error}=await client.rpc(name,args);
    if(error)throw new Error(error.code==='42501'&&!name.startsWith('room_guestbook_')?'只有站点主人可以录入和修改记录。':error.message);
    return data;
  };
  const hydrate=async(records:RoomRecord[])=>{
    const keys=[...new Set(records.flatMap(r=>[r.coverKey,r.modelKey]).filter(Boolean))];
    if(!keys.length)return records;
    const {data,error}=await client.storage.from(bucket).createSignedUrls(keys,300);
    if(error)throw new Error('素材暂时无法读取，请重试。');
    const urls=new Map((data||[]).map(item=>[item.path,item.signedUrl]));
    return records.map(record=>({...record,
      resolvedCoverUrl:record.coverKey?urls.get(record.coverKey)||'':undefined,
      modelUrl:record.modelKey?urls.get(record.modelKey)||'':record.modelUrl,
    }));
  };
  return async(path:string,init:RequestInit={}):Promise<Response>=>{
    const url=new URL(path,'https://room.invalid'),method=(init.method||'GET').toUpperCase();
    try{
      if(url.pathname==='/api/guestbook'&&method==='GET')return reply(await rpc('room_guestbook_list',{
        p_before:url.searchParams.get('before'),p_before_id:url.searchParams.get('id'),
        p_limit:24,p_deleted:url.searchParams.get('deleted')==='true',
      }));
      if((url.pathname==='/api/guestbook'&&method==='POST')||(/^\/api\/guestbook\/[a-f0-9-]{36}$/.test(url.pathname)&&method==='PATCH')){
        const payload=JSON.parse(String(init.body));
        return reply(await rpc('room_guestbook_save',{p_body:payload.body,p_color:payload.color,p_id:method==='PATCH'?url.pathname.split('/').pop():null}),method==='POST'?201:200);
      }
      if(url.pathname==='/api/guestbook/settings'&&method==='POST')return reply(await rpc('room_guestbook_configure',{p_enabled:JSON.parse(String(init.body)).enabled}));
      if(/^\/api\/guestbook\/[a-f0-9-]{36}\/moderate$/.test(url.pathname)&&method==='POST')return reply(await rpc('room_guestbook_moderate',{
        p_id:url.pathname.split('/')[3],p_restore:JSON.parse(String(init.body)).restore===true,
      }));
      if(url.pathname==='/api/records'&&method==='GET'){
        const result=await rpc('room_records_list',{p_archived:url.searchParams.get('archived')==='true'});
        return reply({...result,records:await hydrate(result.records)});
      }
      if((url.pathname==='/api/records'&&method==='POST')||(/^\/api\/records\/[a-f0-9-]+$/.test(url.pathname)&&method==='PATCH')){
        const payload=JSON.parse(String(init.body));
        // A record's identity and timestamps are always assigned by the database.
        delete payload.resolvedCoverUrl;
        if(payload.modelKey)delete payload.modelUrl;
        return reply(await rpc('room_records_save',{
          p_payload:payload,p_entrypoint:new Headers(init.headers).get('X-Room-Entry')||'manager',
          p_id:method==='PATCH'?url.pathname.split('/').pop():null,
        }),method==='POST'?201:200);
      }
      if(url.pathname==='/api/records/import'&&method==='POST'){
        const payload=JSON.parse(String(init.body));
        if(payload.format!=='personal-room-v1'||!Array.isArray(payload.records))return reply({error:'请选择房间导出的备份文件。'},400);
        return reply(await rpc('room_records_import',{p_records:payload.records}));
      }
      if(url.pathname==='/api/upload'&&method==='POST'){
        if(!await rpc('room_can_edit'))return reply({error:'只有站点主人可以上传素材。'},403);
        if(!(init.body instanceof FormData))return reply({error:'上传格式无效。'},400);
        const file=init.body.get('file');
        if(!(file instanceof File))return reply({error:'请选择文件。'},400);
        const model=file.name.toLowerCase().endsWith('.glb');
        const imageTypes:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
        const extension=model?'glb':imageTypes[file.type];
        if(!extension||file.size>(model?25:8)*1024*1024)return reply({error:'封面支持 PNG、JPEG、WebP（8 MB 内）；模型支持 GLB（25 MB 内）。'},400);
        if(model){const magic=new Uint8Array(await file.slice(0,4).arrayBuffer());if(String.fromCharCode(...magic)!=='glTF')return reply({error:'请选择有效的 GLB 模型。'},400);}
        const {data:{user},error:authError}=await client.auth.getUser();
        if(authError||!user)return reply({error:'登录已过期，请重新登录。'},401);
        const key=user.id+'/'+crypto.randomUUID()+'.'+extension;
        const {error}=await client.storage.from(bucket).upload(key,file,{contentType:model?'model/gltf-binary':file.type,upsert:false});
        if(error)throw new Error('上传未成功，请重试。');
        const {data}=await client.storage.from(bucket).createSignedUrl(key,300);
        return reply({key,type:model?'model':'image',url:data?.signedUrl});
      }
      if(url.pathname==='/api/search'&&method==='GET'){
        const query=url.searchParams.get('q')?.trim();
        if(!query)return reply({results:[]});
        const response=await fetch('https://openlibrary.org/search.json?q='+encodeURIComponent(query)+'&limit=5&fields=title,author_name,first_publish_year,cover_i',{credentials:'omit'});
        if(!response.ok)throw new Error('匹配资料暂不可用，可以直接填写。');
        const data=await response.json();
        return reply({results:(data.docs||[]).map((book:{title:string;author_name?:string[];first_publish_year?:number;cover_i?:number})=>({
          title:book.title,creator:book.author_name?.join(' / ')||'',year:String(book.first_publish_year||''),
          coverUrl:book.cover_i?'https://covers.openlibrary.org/b/id/'+book.cover_i+'-L.jpg':'',
        }))});
      }
      return reply({error:'此操作不可用。'},404);
    }catch(error){return reply({error:message(error)},400);}
  };
}
