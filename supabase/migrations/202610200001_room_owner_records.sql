-- Only the verified GitHub identity may write. No browser-supplied role or email is trusted.
create schema if not exists room_private;
revoke all on schema room_private from public, anon, authenticated;

create table room_private.settings (
  singleton boolean primary key default true check (singleton),
  github_id text not null
);
insert into room_private.settings (github_id) values ('165765809');

create or replace function public.room_can_edit() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.identities i join room_private.settings s on s.github_id = i.provider_id
    where i.user_id = auth.uid() and i.provider = 'github'
  );
$$;
revoke all on function public.room_can_edit() from public;
grant execute on function public.room_can_edit() to anon, authenticated;

create type room_private.record_fields as (
  kind text, title text, creator text, year text, body text, color text, date text,
  visibility text, progress text, rating numeric, tags text,
  "coverKey" text, "coverUrl" text, "trailerUrl" text, slot integer,
  memorable boolean, "memorialNote" text, "modelKey" text, "modelUrl" text,
  "modelPlacement" text, "modelScale" numeric, "modelRotation" numeric,
  "modelVisible" boolean, archived boolean
);
create table room_private.records (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table room_private.records enable row level security;
create policy room_owner_records on room_private.records to authenticated
  using (public.room_can_edit()) with check (public.room_can_edit());
alter table room_private.settings enable row level security;
revoke all on all tables in schema room_private from public, anon, authenticated;
create unique index room_book_slot on room_private.records (((data->>'slot')::integer))
  where data->>'kind' = 'book' and (data->>'slot')::integer >= 0 and not (data->>'archived')::boolean;

create or replace function public.room_records_list(p_archived boolean default false) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare is_owner boolean := public.room_can_edit(); result jsonb;
begin
  select coalesce(jsonb_agg(
    (case when is_owner then data
      else (data - 'memorialNote') || jsonb_build_object('memorialNote', '',
        'modelKey', case when (data->>'modelVisible')::boolean then data->>'modelKey' else '' end,
        'modelUrl', case when (data->>'modelVisible')::boolean then data->>'modelUrl' else '' end)
    end) || jsonb_build_object('id', id, 'createdAt', created_at, 'updatedAt', updated_at)
    order by created_at desc), '[]'::jsonb) into result
  from room_private.records
  where (is_owner or data->>'visibility' = 'public')
    and (is_owner and p_archived or not (data->>'archived')::boolean);
  return jsonb_build_object('owner', is_owner, 'records', result);
end;
$$;

create or replace function public.room_records_save(p_payload jsonb, p_entrypoint text, p_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r room_private.record_fields; old_data jsonb; clean jsonb; saved_id uuid;
  defaults constant jsonb := '{"kind":"book","title":"","creator":"","year":"","body":"","color":"#728b83","date":"","visibility":"private","progress":"finished","rating":0,"tags":"","coverKey":"","coverUrl":"","trailerUrl":"","slot":-1,"memorable":false,"memorialNote":"","modelKey":"","modelUrl":"","modelPlacement":"books-middle","modelScale":0.65,"modelRotation":0,"modelVisible":false,"archived":false}';
begin
  if not public.room_can_edit() then raise exception '仅站点主人可以录入或修改记录' using errcode = '42501'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 100000 then
    raise exception '记录格式无效或内容过大' using errcode = '22023'; end if;
  if p_id is not null then
    select data into old_data from room_private.records where id = p_id for update;
    if not found then raise exception '记录不存在' using errcode = 'P0002'; end if;
  end if;
  r := jsonb_populate_record(null::room_private.record_fields, defaults || coalesce(old_data, '{}'::jsonb) || p_payload);
  if r.kind is null or r.kind not in ('book','movie','game','research','idea','knowledge') then raise exception '记录类型无效'; end if;
  if old_data is not null and r.kind is distinct from old_data->>'kind' then raise exception '不能改变已有记录的类型'; end if;
  if p_entrypoint is null or not (
    p_entrypoint = 'manager' or p_entrypoint = 'book' and r.kind = 'book'
    or p_entrypoint = 'movie' and r.kind = 'movie'
    or p_entrypoint = 'computer' and r.kind in ('research','idea','knowledge')
  ) then raise exception '请从对应区域录入：书本只接受阅读记录，录像带只接受影视记录'; end if;
  r.title := btrim(r.title);
  clean := to_jsonb(r);
  if exists (select 1 from jsonb_each(clean) where value = 'null'::jsonb) then raise exception '记录字段不能为 null'; end if;
  if length(r.title) not between 1 and 160 or length(r.creator)>160 or length(r.year)>12
    or length(r.body)>60000 or length(r.tags)>600 or length(r."memorialNote")>5000
    or length(r."coverUrl")>2000 or length(r."trailerUrl")>2000 or length(r."modelUrl")>2000
    or length(r."coverKey")>200 or length(r."modelKey")>200 then raise exception '记录字段长度超出限制'; end if;
  if r.color !~ '^#[a-fA-F0-9]{6}$' or r.date !~ '^(\d{4}-\d{2}-\d{2})?$'
    or r.visibility not in ('public','private') or r.progress not in ('planned','in-progress','finished')
    or r.rating not between 0 and 5 or r.slot not between -1 and 10000
    or r."modelPlacement" not in ('books-top','books-middle','cinema-left','cinema-right')
    or r."modelScale" not between 0.1 and 1.5 or r."modelRotation" not between -180 and 180
  then raise exception '记录字段格式无效'; end if;
  if exists(select 1 from unnest(array[r."coverUrl",r."trailerUrl",r."modelUrl"]) u where u <> '' and u !~ '^https://')
    then raise exception '素材链接必须使用 HTTPS'; end if;
  if exists(select 1 from unnest(array[r."coverKey",r."modelKey"]) k
    where k <> '' and (k not like auth.uid()::text || '/%' or k like '%..%'
      or not exists(select 1 from storage.objects o where o.bucket_id='room-assets' and o.name=k)))
    then raise exception '素材不属于当前账号，请重新上传'; end if;
  -- Signed URLs are temporary display values, never persistent model links.
  if r."modelKey" <> '' then r."modelUrl" := ''; end if;
  if r.kind = 'book' and r.slot < 0 then
    select n into r.slot from generate_series(0,10000) n where not exists(
      select 1 from room_private.records x where x.data->>'kind'='book'
        and not (x.data->>'archived')::boolean and (x.data->>'slot')::integer=n and x.id is distinct from p_id
    ) order by n limit 1;
    if r.slot is null then raise exception '书架已满'; end if;
  end if;
  clean := to_jsonb(r);
  if p_id is null then
    insert into room_private.records(data) values(clean) returning id into saved_id;
  else
    update room_private.records set data=clean, updated_at=now() where id=p_id returning id into saved_id;
  end if;
  return jsonb_build_object('id', saved_id);
end;
$$;

create or replace function public.room_records_import(p_records jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare item jsonb; existing_id uuid; count integer := 0;
begin
  if not public.room_can_edit() then raise exception '仅站点主人可以导入记录' using errcode='42501'; end if;
  if jsonb_typeof(p_records) is distinct from 'array' or jsonb_array_length(p_records)>1000
    or octet_length(p_records::text)>5242880 then raise exception '备份格式无效或记录过多'; end if;
  for item in select * from jsonb_array_elements(p_records) loop
    existing_id := null;
    if coalesce(item->>'id','') ~ '^[a-fA-F0-9-]{36}$' then
      select id into existing_id from room_private.records where id=(item->>'id')::uuid;
    end if;
    perform public.room_records_save(item, 'manager', existing_id); count := count+1;
  end loop;
  return jsonb_build_object('count',count);
end;
$$;

-- Private storage: a public record grants access only to its displayed assets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('room-assets','room-assets',false,26214400,
  array['image/png','image/jpeg','image/webp','model/gltf-binary']) on conflict(id) do nothing;
create or replace function public.room_asset_readable(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.room_can_edit() or exists(select 1 from room_private.records
    where data->>'visibility'='public' and not (data->>'archived')::boolean
      and (data->>'coverKey'=p_name or (data->>'modelVisible')::boolean and data->>'modelKey'=p_name));
$$;
create policy room_asset_read on storage.objects for select to anon, authenticated
  using (bucket_id='room-assets' and public.room_asset_readable(name));
create policy room_asset_upload on storage.objects for insert to authenticated
  with check (bucket_id='room-assets' and public.room_can_edit() and (storage.foldername(name))[1]=auth.uid()::text);

revoke all on function public.room_records_list(boolean) from public;
revoke all on function public.room_records_save(jsonb,text,uuid) from public;
revoke all on function public.room_records_import(jsonb) from public;
revoke all on function public.room_asset_readable(text) from public;
grant execute on function public.room_records_list(boolean), public.room_asset_readable(text) to anon, authenticated;
grant execute on function public.room_records_save(jsonb,text,uuid), public.room_records_import(jsonb) to authenticated;
