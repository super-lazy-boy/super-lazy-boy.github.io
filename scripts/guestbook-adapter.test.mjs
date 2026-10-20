import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomRequest} from '../lib/supabase-room.ts';
import {noteCount} from '../lib/guestbook.ts';
test('guestbook requests send only server-owned IDs and route moderation separately',async()=>{
 const calls=[],id='11111111-1111-4111-8111-111111111111';
 const request=createRoomRequest({rpc:async(name,args)=>{calls.push({name,args});return{data:{ok:true},error:null};}});
 const send=(path,body,method='POST')=>request(path,{method,body:JSON.stringify(body)});
 await send('/api/guestbook',{body:'Hello',color:'sage',author_id:'forged',createdAt:'forged'});
 assert.deepEqual(calls.pop(),{name:'room_guestbook_save',args:{p_body:'Hello',p_color:'sage',p_id:null}});
 await send('/api/guestbook/'+id,{body:'Changed',color:'paper',id:'forged'},'PATCH');
 assert.equal(calls.pop().args.p_id,id);
 await send('/api/guestbook/'+id+'/moderate',{restore:true});
 assert.deepEqual(calls.pop(),{name:'room_guestbook_moderate',args:{p_id:id,p_restore:true}});
 await send('/api/guestbook/settings',{enabled:false});assert.deepEqual(calls.pop(),{name:'room_guestbook_configure',args:{p_enabled:false}});
 await request('/api/guestbook?before=2026-10-20T00%3A00%3A00Z&id='+id+'&deleted=true');
 assert.deepEqual(calls.pop(),{name:'room_guestbook_list',args:{p_before:'2026-10-20T00:00:00Z',p_before_id:id,p_limit:24,p_deleted:true}});
});
test('server permission errors are preserved and Unicode note limits match Postgres',async()=>{
 const request=createRoomRequest({rpc:async()=>({data:null,error:{code:'42501',message:'只能修改自己留下的便签'}})});
 const result=await request('/api/guestbook',{method:'POST',body:'{}'});assert.equal(result.status,400);assert.equal((await result.json()).error,'只能修改自己留下的便签');
 assert.equal(noteCount('  😀你好  '),3);assert.equal(noteCount('😀'.repeat(280)),280);
});
