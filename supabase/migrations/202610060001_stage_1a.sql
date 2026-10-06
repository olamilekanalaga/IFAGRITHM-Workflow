-- Stage 1A: four core tables; auth.users retains private account emails.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id), username text not null unique check(username ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check(length(display_name) between 1 and 80), avatar_url text, avatar_path text,
 role text not null default 'Research Scout' check(role in ('Research Scout','Analyst','Admin')),
 requested_role text not null default 'Research Scout' check(requested_role in ('Research Scout','Analyst','Admin')),
 access_status text not null default 'Pending' check(access_status in ('Pending','Approved','Suspended')),
 setup_complete boolean not null default false, is_owner boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.companies (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 domain text not null unique check(domain=lower(domain) and domain ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
 category text not null check(length(category) between 1 and 80), status text not null default 'Saved' check(status in ('Saved','Researching','Approached','Conversation','Completed')),
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), merged_into uuid references public.companies(id)
);
create table public.observations (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
 behaviour text not null check(length(behaviour) between 1 and 80), description text not null check(length(description) between 1 and 4000),
 detail text not null default '' check(length(detail)<=200), observed_on date not null,
 submitted_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 duplicate_override boolean not null default false, deleted_at timestamptz, merged_into uuid references public.observations(id)
);
create table public.observation_sources (
 id uuid primary key default gen_random_uuid(), observation_id uuid not null references public.observations(id),
 url text not null check(length(url) between 8 and 2048), normalized_url text not null,
 submitted_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), deleted_at timestamptz
);
create unique index sources_per_observation on public.observation_sources(observation_id, normalized_url) where deleted_at is null;
create index observations_company_date on public.observations(company_id,observed_on desc,created_at desc);
create index observations_author on public.observations(submitted_by);
create index observation_source_lookup on public.observation_sources(normalized_url) where deleted_at is null;
create table public.activity_log (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id), event text not null,
 entity_id uuid not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create or replace function private.member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and access_status='Approved' and setup_complete);
$$;
create or replace function private.admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='Admin' and access_status='Approved' and setup_complete);
$$;
create or replace function private.require_member() returns void language plpgsql security definer set search_path='' as $$
begin if not private.member() then raise exception 'Approved workspace access required' using errcode='42501'; end if; end; $$;
create or replace function private.require_admin() returns void language plpgsql security definer set search_path='' as $$
begin if not private.admin() then raise exception 'Admin access required' using errcode='42501'; end if; end; $$;
create or replace function private.google_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare base text; candidate text;
begin
 if new.raw_app_meta_data->>'provider' is distinct from 'google' or new.email is null then return new; end if;
 base:=left(regexp_replace(lower(split_part(new.email,'@',1)),'[^a-z0-9_]','','g'),18);
 if length(base)<3 then base:=coalesce(nullif(base,''),'scout')||'_user'; end if;
 candidate:=base;
 loop
  begin
   insert into public.profiles(id,username,display_name,avatar_url) values(new.id,candidate,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),split_part(new.email,'@',1)),80),case when new.raw_user_meta_data->>'avatar_url' ~ '^https://[a-z0-9.-]+\.googleusercontent\.com/' then new.raw_user_meta_data->>'avatar_url' end);
   exit;
  exception when unique_violation then candidate:=left(base,18)||'_'||left(replace(gen_random_uuid()::text,'-',''),5);
  end;
 end loop;
 return new;
end; $$;
create trigger create_google_profile after insert on auth.users for each row execute function private.google_profile();
-- Backfill Google accounts that existed before this migration; account emails stay in auth.users.
DO $$
declare u record; base text; candidate text;
begin
 for u in select * from auth.users where raw_app_meta_data->>'provider'='google' and email is not null and not exists(select 1 from public.profiles p where p.id=auth.users.id) loop
  base:=left(regexp_replace(lower(split_part(u.email,'@',1)),'[^a-z0-9_]','','g'),18);
  if length(base)<3 then base:=coalesce(nullif(base,''),'scout')||'_user'; end if;
  candidate:=base;
  loop
   begin
    insert into public.profiles(id,username,display_name,avatar_url) values(u.id,candidate,left(coalesce(nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1)),80),case when u.raw_user_meta_data->>'avatar_url' ~ '^https://[a-z0-9.-]+\.googleusercontent\.com/' then u.raw_user_meta_data->>'avatar_url' end);
    exit;
   exception when unique_violation then candidate:=left(base,18)||'_'||left(replace(gen_random_uuid()::text,'-',''),5);
   end;
  end loop;
 end loop;
end; $$;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.observations enable row level security;
alter table public.observation_sources enable row level security;
alter table public.activity_log enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or private.member());
create policy companies_read on public.companies for select to authenticated using(private.member());
create policy observations_read on public.observations for select to authenticated using(private.member());
create policy sources_read on public.observation_sources for select to authenticated using(private.member());
create policy activity_read on public.activity_log for select to authenticated using(private.member());
revoke all on public.profiles,public.companies,public.observations,public.observation_sources,public.activity_log from anon,authenticated;
grant select on public.profiles,public.companies,public.observations,public.observation_sources,public.activity_log to authenticated;
revoke all on function private.member(),private.admin(),private.require_member(),private.require_admin(),private.google_profile() from public;
grant execute on function private.member(),private.admin() to authenticated;

create or replace function public.save_profile(_display_name text,_username text,_requested_role text,_avatar_path text default null) returns void language plpgsql security definer set search_path='' as $$
declare me public.profiles;
begin
 select * into me from public.profiles where id=auth.uid() for update;
 if me.id is null then raise exception 'Google account required' using errcode='42501'; end if;
 if _requested_role not in ('Research Scout','Analyst','Admin') then raise exception 'Invalid requested role'; end if;
 if _avatar_path is not null and (_avatar_path not like auth.uid()::text||'/%' or _avatar_path ~ '\.\.') then raise exception 'Invalid avatar path'; end if;
 update public.profiles set display_name=trim(_display_name),username=lower(trim(_username)),requested_role=_requested_role,setup_complete=true,avatar_path=coalesce(_avatar_path,avatar_path) where id=auth.uid();
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Profile updated',auth.uid(),jsonb_build_object('requested_role',_requested_role));
end; $$;
create or replace function public.review_access(_profile_id uuid,_role text,_status text) returns void language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 perform private.require_admin(); perform pg_advisory_xact_lock(87341001);
 if _role not in ('Research Scout','Analyst','Admin') or _status not in ('Pending','Approved','Suspended') then raise exception 'Invalid role or access status'; end if;
 select * into target from public.profiles where id=_profile_id for update;
 if target.id is null then raise exception 'Profile not found'; end if;
 if target.is_owner and (_role<>'Admin' or _status<>'Approved') then raise exception 'Owner access is protected'; end if;
 if not target.setup_complete and _status='Approved' then raise exception 'Profile setup is incomplete'; end if;
 if target.role='Admin' and target.access_status='Approved' and (_role<>'Admin' or _status<>'Approved') and (select count(*) from public.profiles where role='Admin' and access_status='Approved')<=1 then raise exception 'Cannot remove the last admin'; end if;
 update public.profiles set role=_role,access_status=_status,requested_role=_role where id=_profile_id;
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Access reviewed',_profile_id,jsonb_build_object('role',_role,'access_status',_status,'previous_role',target.role,'previous_status',target.access_status,'requested_role',target.requested_role));
end; $$;

-- URL normalisation is enforced in the database, including calls bypassing the UI.
create or replace function private.normalized_source(_url text) returns text language plpgsql immutable set search_path='' as $$
declare parts text[]; host text; path text; query text; cleaned text;
begin
 if length(_url)>2048 then raise exception 'Source URL is too long'; end if;
 parts:=regexp_match(trim(_url),'^(https?)://([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$','i');
 if parts is null or parts[2] ~ '[@[:space:]]' then raise exception 'Use a complete http or https source URL'; end if;
 host:=regexp_replace(lower(parts[2]),'^www\.','');
 if host in ('twitter.com','mobile.twitter.com','mobile.x.com') then host:='x.com'; end if;
 path:=coalesce(nullif(regexp_replace(parts[3],'/$',''),''),'/');
 select string_agg(segment,'&' order by segment) into query from unnest(string_to_array(ltrim(coalesce(parts[4],''),'?'),'&')) segment where segment<>'' and lower(split_part(segment,'=',1)) not in ('s','ref','fbclid','gclid') and lower(segment) not like 'utm\_%' escape '\';
 cleaned:=lower(parts[1])||'://'||host||path||case when query is null then '' else '?'||query end;
 return cleaned;
end; $$;

create or replace function public.submit_observation(_company_id uuid,_company_name text,_domain text,_category text,_behaviour text,_description text,_detail text,_observed_on date,_source text,_allow_duplicate boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare cmp uuid; obs uuid; existing uuid; normalized text;
begin
 perform private.require_member();
 normalized:=private.normalized_source(_source);
 perform pg_advisory_xact_lock(hashtextextended('ifagrithm-capture',0));
 if _company_id is not null then select id into cmp from public.companies where id=_company_id and merged_into is null; if cmp is null then raise exception 'Select an active company'; end if;
 else
  if _domain is null or trim(_domain)='' then raise exception 'A domain is required for a new company'; end if;
  with recursive canonical as (select id,merged_into from public.companies where domain=lower(regexp_replace(trim(_domain),'^www\.','')) union all select c.id,c.merged_into from public.companies c join canonical previous on c.id=previous.merged_into) select id into cmp from canonical where merged_into is null;
  if cmp is null then insert into public.companies(name,domain,category,created_by) values(trim(_company_name),lower(regexp_replace(trim(_domain),'^www\.','')),trim(_category),auth.uid()) returning id into cmp; end if;
 end if;
 select o.id into existing from public.observations o join public.observation_sources s on s.observation_id=o.id where o.company_id=cmp and o.deleted_at is null and o.merged_into is null and s.deleted_at is null and s.normalized_url=normalized order by o.created_at desc limit 1;
 if existing is not null and not _allow_duplicate then return jsonb_build_object('duplicate_id',existing,'company_id',cmp); end if;
 if lower(_behaviour) like '%kol%' and nullif(_detail,'') is not null and _detail !~ '^[0-9]+$' then raise exception 'Creators observed must be a whole number'; end if;
 insert into public.observations(company_id,behaviour,description,detail,observed_on,submitted_by,duplicate_override) values(cmp,trim(_behaviour),trim(_description),coalesce(trim(_detail),''),_observed_on,auth.uid(),existing is not null and _allow_duplicate) returning id into obs;
 insert into public.observation_sources(observation_id,url,normalized_url,submitted_by) values(obs,trim(_source),normalized,auth.uid());
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Observation submitted',obs,jsonb_build_object('company_id',cmp,'duplicate_override',existing is not null and _allow_duplicate));
 return jsonb_build_object('observation_id',obs,'company_id',cmp);
end; $$;
create or replace function public.add_observation_source(_observation_id uuid,_source text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_member(); perform pg_advisory_xact_lock(hashtextextended('ifagrithm-capture',0));
 if not exists(select 1 from public.observations where id=_observation_id and deleted_at is null and merged_into is null) then raise exception 'Observation not found'; end if;
 insert into public.observation_sources(observation_id,url,normalized_url,submitted_by) values(_observation_id,trim(_source),private.normalized_source(_source),auth.uid()) on conflict(observation_id,normalized_url) where deleted_at is null do nothing;
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Source added',_observation_id,jsonb_build_object('url',trim(_source)));
end; $$;
create or replace function public.correct_company(_company_id uuid,_category text,_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_admin();
 update public.companies set category=trim(_category),status=_status where id=_company_id and merged_into is null;
 if not found then raise exception 'Company not found'; end if;
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Company corrected',_company_id,jsonb_build_object('category',_category,'status',_status));
end; $$;
create or replace function public.remove_observation(_observation_id uuid,_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_admin(); if length(trim(_reason))<3 then raise exception 'Give a removal reason'; end if;
 update public.observations set deleted_at=now() where id=_observation_id and deleted_at is null;
 if not found then raise exception 'Observation not found'; end if;
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Observation removed',_observation_id,jsonb_build_object('reason',_reason));
end; $$;
create or replace function public.merge_companies(_from uuid,_into uuid,_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_admin(); perform pg_advisory_xact_lock(hashtextextended('ifagrithm-capture',0));
 if _from=_into or length(trim(_reason))<3 then raise exception 'Select two companies and give a reason'; end if;
 if (select count(*) from public.companies where id in (_from,_into) and merged_into is null)<>2 then raise exception 'Select two active companies'; end if;
 update public.observations set company_id=_into where company_id=_from;
 update public.companies set merged_into=_into where id=_from;
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Companies merged',_into,jsonb_build_object('from',_from,'into',_into,'reason',_reason));
end; $$;
create or replace function public.merge_observations(_from uuid,_into uuid,_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_admin(); perform pg_advisory_xact_lock(hashtextextended('ifagrithm-capture',0));
 if _from=_into or length(trim(_reason))<3 then raise exception 'Select two observations and give a reason'; end if;
 if (select count(*) from public.observations where id in (_from,_into) and deleted_at is null and merged_into is null)<>2 or (select count(distinct company_id) from public.observations where id in (_from,_into))<>1 then raise exception 'Select two active observations of the same company'; end if;
 update public.observation_sources s set deleted_at=now() where s.observation_id=_from and exists(select 1 from public.observation_sources t where t.observation_id=_into and t.normalized_url=s.normalized_url and t.deleted_at is null);
 update public.observation_sources set observation_id=_into where observation_id=_from and deleted_at is null;
 update public.observations set merged_into=_into,deleted_at=now() where id=_from;
 insert into public.activity_log(actor_id,event,entity_id,details) values(auth.uid(),'Observations merged',_into,jsonb_build_object('from',_from,'into',_into,'reason',_reason));
end; $$;
-- RPCs default to PUBLIC execute in PostgreSQL: explicitly close that default.
revoke all on function public.save_profile(text,text,text,text),public.review_access(uuid,text,text),public.submit_observation(uuid,text,text,text,text,text,text,date,text,boolean),public.add_observation_source(uuid,text),public.correct_company(uuid,text,text),public.remove_observation(uuid,text),public.merge_companies(uuid,uuid,text),public.merge_observations(uuid,uuid,text),private.normalized_source(text) from public;
grant execute on function public.save_profile(text,text,text,text),public.review_access(uuid,text,text),public.submit_observation(uuid,text,text,text,text,text,text,date,text,boolean),public.add_observation_source(uuid,text),public.correct_company(uuid,text,text),public.remove_observation(uuid,text),public.merge_companies(uuid,uuid,text),public.merge_observations(uuid,uuid,text) to authenticated;

-- Private profile image bucket. Owners can upload during onboarding; teammates can read only after approval.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-images','profile-images',false,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy avatar_insert on storage.objects for insert to authenticated with check(bucket_id='profile-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_read on storage.objects for select to authenticated using(bucket_id='profile-images' and ((storage.foldername(name))[1]=auth.uid()::text or private.member()));
create policy avatar_delete on storage.objects for delete to authenticated using(bucket_id='profile-images' and (storage.foldername(name))[1]=auth.uid()::text);
commit;



