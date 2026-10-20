-- Public APIs expose only note content and a per-request ownership flag.
create table room_private.guestbook_settings (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into room_private.guestbook_settings(singleton) values(true);
create table room_private.guestbook_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  author_name text not null check(char_length(author_name) between 1 and 40),
  body text not null check(char_length(btrim(body)) between 1 and 280),
  color text not null default 'paper' check(color in ('paper','sage','blush','lavender')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index guestbook_visible_order on room_private.guestbook_notes(created_at desc,id desc) where deleted_at is null;
create index guestbook_author_recent on room_private.guestbook_notes(author_id,created_at desc);
alter table room_private.guestbook_settings enable row level security;
alter table room_private.guestbook_notes enable row level security;
create policy guestbook_notes_read on room_private.guestbook_notes for select to anon,authenticated
  using(deleted_at is null or (select public.room_can_edit()));
create policy guestbook_notes_own_update on room_private.guestbook_notes for update to authenticated
  using(author_id=(select auth.uid()) and deleted_at is null)
  with check(author_id=(select auth.uid()) and deleted_at is null);
create policy guestbook_settings_owner on room_private.guestbook_settings for all to authenticated
  using((select public.room_can_edit())) with check((select public.room_can_edit()));
revoke all on room_private.guestbook_notes,room_private.guestbook_settings from public,anon,authenticated;

create function room_private.guestbook_list(p_before timestamptz,p_before_id uuid,p_limit integer,p_deleted boolean)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  is_owner boolean:=public.room_can_edit(); is_signed boolean; is_enabled boolean;
  rows_json jsonb; more boolean; last_row jsonb; take integer:=greatest(1,least(coalesce(p_limit,24),50));
begin
  if (p_before is null)<>(p_before_id is null) then raise exception '翻页位置无效' using errcode='22023'; end if;
  select exists(select 1 from auth.identities where user_id=auth.uid() and provider='github') into is_signed;
  select enabled into is_enabled from room_private.guestbook_settings where singleton;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',n.id,'body',n.body,'color',n.color,'authorName',n.author_name,
    'createdAt',n.created_at,'updatedAt',n.updated_at,
    'mine',coalesce(n.author_id=auth.uid(),false),'canEdit',coalesce(n.author_id=auth.uid(),false) and is_enabled and n.deleted_at is null
  ) order by n.created_at desc,n.id desc),'[]'::jsonb) into rows_json
  from (
    select * from room_private.guestbook_notes
    where (case when coalesce(p_deleted,false) and is_owner then deleted_at is not null else deleted_at is null end)
      and (p_before is null or (created_at,id)<(p_before,p_before_id))
    order by created_at desc,id desc limit take+1
  ) n;
  more:=jsonb_array_length(rows_json)>take;
  if more then rows_json:=rows_json-take; end if;
  last_row:=rows_json->(jsonb_array_length(rows_json)-1);
  return jsonb_build_object('enabled',is_enabled,'owner',is_owner,'signedIn',is_signed,
    'notes',rows_json,'hasMore',more,'nextCursor',case when more then jsonb_build_object('before',last_row->>'createdAt','id',last_row->>'id') else null end);
end;
$$;

create function room_private.guestbook_save(p_body text,p_color text,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); label text; note_id uuid; is_enabled boolean;
begin
  if uid is null then raise exception '登录 GitHub 后才可以留下便签' using errcode='42501'; end if;
  select left(coalesce(nullif(identity_data->>'user_name',''),nullif(identity_data->>'preferred_username',''),'来访者'),40)
    into label from auth.identities where user_id=uid and provider='github' limit 1;
  if label is null then raise exception '请使用 GitHub 账号登录' using errcode='42501'; end if;
  select enabled into is_enabled from room_private.guestbook_settings where singleton for share;
  if not is_enabled then raise exception '站主暂时收起了笔，已有便签仍可阅读' using errcode='42501'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 280
    or p_color is null or p_color not in ('paper','sage','blush','lavender') then
    raise exception '便签需为 1–280 字，并选择一种纸张颜色' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('room-guestbook:'||uid::text,0));
  if p_id is null then
    if exists(select 1 from room_private.guestbook_notes where author_id=uid and created_at>clock_timestamp()-interval '60 seconds') then
      raise exception '让这张便签先贴好，一分钟后再留下一张' using errcode='22023'; end if;
    insert into room_private.guestbook_notes(author_id,author_name,body,color)
      values(uid,label,btrim(p_body),p_color) returning id into note_id;
  else
    update room_private.guestbook_notes set body=btrim(p_body),color=p_color,updated_at=clock_timestamp()
      where id=p_id and author_id=uid and deleted_at is null returning id into note_id;
    if note_id is null then raise exception '只能修改自己留下的便签' using errcode='42501'; end if;
  end if;
  return jsonb_build_object('id',note_id);
end;
$$;

create function room_private.guestbook_moderate(p_id uuid,p_restore boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare changed uuid;
begin
  if not public.room_can_edit() then raise exception '只有站主可以收起或恢复便签' using errcode='42501'; end if;
  update room_private.guestbook_notes set deleted_at=case when coalesce(p_restore,false) then null else clock_timestamp() end
    where id=p_id returning id into changed;
  if changed is null then raise exception '没有找到这张便签' using errcode='P0002'; end if;
  return jsonb_build_object('id',changed);
end;
$$;
create function room_private.guestbook_configure(p_enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.room_can_edit() then raise exception '只有站主可以开关留言功能' using errcode='42501'; end if;
  if p_enabled is null then raise exception '开关状态无效' using errcode='22023'; end if;
  update room_private.guestbook_settings set enabled=p_enabled,updated_at=clock_timestamp() where singleton;
  return jsonb_build_object('enabled',p_enabled);
end;
$$;

-- Thin invoker APIs; privileged implementation stays in the non-exposed schema.
create function public.room_guestbook_list(p_before timestamptz default null,p_before_id uuid default null,p_limit integer default 24,p_deleted boolean default false)
returns jsonb language sql stable security invoker set search_path='' as $$ select room_private.guestbook_list(p_before,p_before_id,p_limit,p_deleted) $$;
create function public.room_guestbook_save(p_body text,p_color text default 'paper',p_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$ select room_private.guestbook_save(p_body,p_color,p_id) $$;
create function public.room_guestbook_moderate(p_id uuid,p_restore boolean default false)
returns jsonb language sql security invoker set search_path='' as $$ select room_private.guestbook_moderate(p_id,p_restore) $$;
create function public.room_guestbook_configure(p_enabled boolean)
returns jsonb language sql security invoker set search_path='' as $$ select room_private.guestbook_configure(p_enabled) $$;
revoke all on function room_private.guestbook_list(timestamptz,uuid,integer,boolean),room_private.guestbook_save(text,text,uuid),room_private.guestbook_moderate(uuid,boolean),room_private.guestbook_configure(boolean) from public,anon,authenticated;
revoke all on function public.room_guestbook_list(timestamptz,uuid,integer,boolean),public.room_guestbook_save(text,text,uuid),public.room_guestbook_moderate(uuid,boolean),public.room_guestbook_configure(boolean) from public,anon,authenticated;
grant usage on schema room_private to anon,authenticated;
grant execute on function room_private.guestbook_list(timestamptz,uuid,integer,boolean),public.room_guestbook_list(timestamptz,uuid,integer,boolean) to anon,authenticated;
grant execute on function room_private.guestbook_save(text,text,uuid),public.room_guestbook_save(text,text,uuid),room_private.guestbook_moderate(uuid,boolean),public.room_guestbook_moderate(uuid,boolean),room_private.guestbook_configure(boolean),public.room_guestbook_configure(boolean) to authenticated;
