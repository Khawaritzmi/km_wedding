-- Run once in your Supabase SQL editor, then run data/guests-seed.sql.
-- Tables have no public read/write policies. Only narrow RPC functions are callable.
begin;
create table if not exists public.wedding_guests (
  token text primary key check (token ~ '^[a-f0-9]{32}$'),
  name text not null check (char_length(trim(name)) between 1 and 120),
  max_party integer not null default 2 check (max_party between 1 and 10),
  active boolean not null default true
);
create table if not exists public.wedding_responses (
  guest_token text primary key references public.wedding_guests(token),
  message text not null check (char_length(trim(message)) between 1 and 1000),
  attendance text not null check (attendance in ('hadir', 'tidak', 'belum')),
  party integer not null check (party between 0 and 10),
  consent boolean not null check (consent),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.wedding_guests enable row level security;
alter table public.wedding_responses enable row level security;
revoke all on public.wedding_guests, public.wedding_responses from anon, authenticated;

create or replace function public.wedding_guest(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', name, 'max_party', max_party)
  from public.wedding_guests where token = p_token and active;
$$;

create or replace function public.wedding_wishes(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb) from (
    select g.name, r.message, r.updated_at as created_at
    from public.wedding_responses r join public.wedding_guests g on g.token = r.guest_token
    where r.approved and r.consent and g.active
      and exists(select 1 from public.wedding_guests v where v.token = p_token and v.active)
    order by r.updated_at desc limit 100
  ) w;
$$;

create or replace function public.wedding_respond(p_token text, p_message text, p_attendance text, p_party integer, p_consent boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare allowed integer;
begin
  -- Serialize changes per guest, so retries and simultaneous requests cannot duplicate records.
  select max_party into allowed from public.wedding_guests where token = p_token and active for update;
  if not found then raise exception 'Invalid invitation'; end if;
  if p_consent is distinct from true or p_message is null or char_length(trim(p_message)) not between 1 and 1000
    or p_attendance is null or p_attendance not in ('hadir','tidak','belum') or p_party is null
    or (p_attendance = 'hadir' and (p_party < 1 or p_party > allowed))
    or (p_attendance <> 'hadir' and p_party <> 0) then raise exception 'Invalid response'; end if;
  if exists(select 1 from public.wedding_responses where guest_token = p_token and updated_at > now() - interval '10 seconds')
    then raise exception 'Please wait before resubmitting'; end if;
  insert into public.wedding_responses (guest_token,message,attendance,party,consent)
    values (p_token,trim(p_message),p_attendance,p_party,true)
  on conflict (guest_token) do update set message = excluded.message, attendance = excluded.attendance,
    party = excluded.party, consent = true, approved = false, updated_at = now();
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.wedding_guest(text), public.wedding_wishes(text), public.wedding_respond(text,text,text,integer,boolean) from public, anon, authenticated;
grant execute on function public.wedding_guest(text), public.wedding_wishes(text), public.wedding_respond(text,text,text,integer,boolean) to anon;
commit;
