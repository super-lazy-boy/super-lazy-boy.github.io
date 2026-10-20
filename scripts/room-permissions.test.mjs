import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {entryAllows,editorKinds} from '../lib/record-entry.ts';
import {serviceConfig} from '../lib/service-config.ts';

const owner='11111111-1111-4111-8111-111111111111';
const visitor='22222222-2222-4222-8222-222222222222';
const migration=await readFile(new URL('../supabase/migrations/202610200001_room_owner_records.sql',import.meta.url),'utf8');
const grants=await readFile(new URL('../supabase/migrations/202610200002_explicit_rpc_grants.sql',import.meta.url),'utf8');

test('database rejects visitors, protects private content, and enforces record types',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`
      create role anon; create role authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;
      create schema auth; create schema storage;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      create table auth.identities(user_id uuid, provider text, provider_id text, identity_data jsonb);
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
      grant usage on schema public,auth,storage to anon,authenticated;
      grant execute on function auth.uid(),storage.foldername(text) to anon,authenticated;
      grant select,insert on storage.objects to anon,authenticated;
      insert into auth.identities values ('${owner}','github','165765809','{}'),
        ('${visitor}','github','other-id','{"provider_id":"165765809","role":"owner"}');
    `);
    await db.exec(migration);
    await db.exec(grants);
    const role=async(user)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await db.exec('set role '+(user?'authenticated':'anon'));};
    const list=async(archived=false)=>(await db.query('select public.room_records_list($1) as result',[archived])).rows[0].result;
    const save=async(payload,entry='book',id=null)=>(await db.query('select public.room_records_save($1::jsonb,$2,$3::uuid) as result',[JSON.stringify(payload),entry,id])).rows[0].result;
    await role(null);
    assert.equal((await list()).owner,false);
    await assert.rejects(save({kind:'book',title:'unauthorized'}),/permission denied/);
    await assert.rejects(db.query("select * from room_private.records"),/permission denied/);
    await role(visitor);
    assert.equal((await list()).owner,false,'spoofed identity_data cannot grant ownership');
    await assert.rejects(save({kind:'book',title:'unauthorized'}),/仅站点主人/);
    await role(owner);
    assert.equal((await list()).owner,true);
    const privateBook=await save({kind:'book',title:'private',memorialNote:'never public'});
    const publicBook=await save({kind:'book',title:'public',visibility:'public',memorialNote:'also never public',modelUrl:'https://example.com/hidden.glb',modelVisible:false});
    const tape=await save({kind:'movie',title:'film',visibility:'public'},'movie');
    await db.query("insert into storage.objects values ('room-assets',$1),('room-assets',$2)",[owner+'/private.png',owner+'/public.png']);
    await save({coverKey:owner+'/private.png'},'book',privateBook.id);
    await save({coverKey:owner+'/public.png'},'book',publicBook.id);
    assert.equal((await list()).records.length,3);
    await assert.rejects(save({kind:'movie',title:'wrong entry'},'book'),/对应区域/);
    await assert.rejects(save({kind:'book',title:'wrong entry'},'movie'),/对应区域/);
    await assert.rejects(save({kind:'research',title:'wrong entry'},'movie'),/对应区域/);
    await assert.rejects(save({kind:'movie'},'manager',privateBook.id),/不能改变/);
    await assert.rejects(save({visibility:null},'book',privateBook.id),/不能为 null/);
    await assert.rejects(save({kind:'book',title:'bad URL',coverUrl:'javascript:alert(1)'}),/HTTPS/);
    await assert.rejects(save({kind:'book',title:'other asset',coverKey:visitor+'/cover.jpg'}),/素材不属于/);
    await role(visitor);
    const visible=await list(true);
    assert.equal(visible.owner,false);
    assert.deepEqual(visible.records.map(r=>r.title).sort(),['film','public']);
    assert.equal(visible.records.find(r=>r.id===publicBook.id).memorialNote,'');
    assert.equal(visible.records.find(r=>r.id===publicBook.id).modelUrl,'');
    await assert.rejects(save({body:'attack'},'movie',tape.id),/仅站点主人/);
    await assert.rejects(db.query("select public.room_records_import('[{\"title\":\"attack\"}]')"),/仅站点主人/);
    await assert.rejects(db.query("insert into storage.objects values ('room-assets','attacker/cover.png')"),/row-level security/);
    await role(owner);
    await save({archived:true},'manager',tape.id);
    assert.equal((await list()).records.length,2);
    assert.equal((await list(true)).records.length,3);
    await role(null);
    assert.deepEqual((await list(true)).records.map(r=>r.title),['public']);
    assert.equal((await db.query("select public.room_asset_readable('unknown/key') as ok")).rows[0].ok,false);
    assert.equal((await db.query('select public.room_asset_readable($1) as ok',[owner+'/private.png'])).rows[0].ok,false);
    assert.equal((await db.query('select public.room_asset_readable($1) as ok',[owner+'/public.png'])).rows[0].ok,true);
    assert.deepEqual((await db.query('select name from storage.objects')).rows.map(r=>r.name),[owner+'/public.png']);
  }finally{await db.close();}
});

test('book and tape editors have one fixed kind; computer keeps its own kinds',()=>{
  assert.deepEqual(editorKinds('book'),['book']);
  assert.deepEqual(editorKinds('movie'),['movie']);
  assert.deepEqual(editorKinds('idea'),['research','idea','knowledge']);
  assert.deepEqual(editorKinds('research',true),['research']);
  assert.equal(entryAllows('book','movie'),false);
  assert.equal(entryAllows('movie','book'),false);
  assert.equal(entryAllows('computer','book'),false);
});

test('public builds reject secret or service-role keys',()=>{
  const config={provider:'supabase',url:'https://example.supabase.co',publishableKey:'sb_publishable_example'};
  assert.equal(serviceConfig.parse(config).provider,'supabase');
  for(const publishableKey of ['sb_secret_example','service_role','eyJhbGciOiJIUzI1NiJ9']){
    assert.throws(()=>serviceConfig.parse({...config,publishableKey}));
  }
});
