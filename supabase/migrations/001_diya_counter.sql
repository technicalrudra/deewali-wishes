-- Apply in the Supabase SQL editor or via supabase db push.
begin;
create table if not exists public.diwali_stats (
 id smallint primary key check (id = 1),
 total_diyas_lit bigint not null default 0 check (total_diyas_lit >= 0),
 updated_at timestamptz not null default now()
);
insert into public.diwali_stats (id) values (1) on conflict do nothing;
create table if not exists public.diya_lighting_events (
 event_id uuid primary key,
 created_at timestamptz not null default now()
);
alter table public.diwali_stats enable row level security;
alter table public.diya_lighting_events enable row level security;
revoke all on public.diwali_stats from anon, authenticated;
revoke all on public.diya_lighting_events from anon, authenticated;
grant select on public.diwali_stats to service_role;
create or replace function public.record_diya_light(lighting_event uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare inserted_count integer; current_total bigint;
begin
 if lighting_event is null then
  raise exception 'A lighting event ID is required' using errcode = '22004';
 end if;
 insert into public.diya_lighting_events (event_id) values (lighting_event) on conflict do nothing;
 get diagnostics inserted_count = row_count;
 if inserted_count = 1 then
  update public.diwali_stats set total_diyas_lit = total_diyas_lit + 1, updated_at = now() where id = 1 returning total_diyas_lit into current_total;
 else
  select total_diyas_lit into current_total from public.diwali_stats where id = 1;
 end if;
 return current_total;
end;
$$;
revoke all on function public.record_diya_light(uuid) from public, anon, authenticated;
grant execute on function public.record_diya_light(uuid) to service_role;
notify pgrst, 'reload schema';
commit;
