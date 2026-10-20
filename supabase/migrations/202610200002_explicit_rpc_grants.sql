-- Supabase can grant functions directly to browser roles through default privileges.
-- Revoking PUBLIC alone does not remove those direct grants.
revoke all on function public.room_can_edit() from public, anon, authenticated;
revoke all on function public.room_records_list(boolean) from public, anon, authenticated;
revoke all on function public.room_records_save(jsonb,text,uuid) from public, anon, authenticated;
revoke all on function public.room_records_import(jsonb) from public, anon, authenticated;
revoke all on function public.room_asset_readable(text) from public, anon, authenticated;
grant execute on function public.room_can_edit(), public.room_records_list(boolean), public.room_asset_readable(text) to anon, authenticated;
grant execute on function public.room_records_save(jsonb,text,uuid), public.room_records_import(jsonb) to authenticated;
