-- Additive Stage 1A context. No identity, RLS, authentication or company-status changes.
alter table public.observations
 add column resource text not null default '' check(length(resource)<=200),
 add column desired_behaviour text not null default '' check(length(desired_behaviour)<=80),
 add column intent_basis text not null default 'Unknown' check(intent_basis in ('Unknown','Declared','Inferred')),
 add column started_on date,
 add column intervention_status text not null default 'Unknown' check(intervention_status in ('Unknown','Active','Ended')),
 add constraint objective_requires_basis check((desired_behaviour='' and intent_basis='Unknown') or (desired_behaviour<>'' and intent_basis in ('Declared','Inferred')));

-- Retain the original RPC for older clients. Its atomic duplicate, company and source handling is reused.
create or replace function public.submit_intervention_observation(
 _company_id uuid,_company_name text,_domain text,_category text,_behaviour text,_description text,_detail text,_observed_on date,_source text,
 _allow_duplicate boolean default false,
 _resource text default '',_desired_behaviour text default '',_intent_basis text default 'Unknown',_started_on date default null,_intervention_status text default 'Unknown'
) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; target uuid; resource_value text:=coalesce(trim(_resource),''); desired_value text:=coalesce(trim(_desired_behaviour),''); basis_value text:=coalesce(_intent_basis,'Unknown'); status_value text:=coalesce(_intervention_status,'Unknown');
begin
 perform private.require_member();
 if length(resource_value)>200 or length(desired_value)>80 then raise exception 'Intervention context exceeds the field limit'; end if;
 if basis_value not in ('Unknown','Declared','Inferred') or status_value not in ('Unknown','Active','Ended') then raise exception 'Choose a valid intervention status and objective basis'; end if;
 if desired_value<>'' and basis_value='Unknown' then raise exception 'Mark the desired behaviour as Declared or Inferred'; end if;
 if desired_value='' then basis_value:='Unknown'; end if;
 result:=public.submit_observation(_company_id,_company_name,_domain,_category,_behaviour,_description,_detail,_observed_on,_source,_allow_duplicate);
 target:=(result->>'observation_id')::uuid;
 -- A possible duplicate must never overwrite context on the existing observation.
 if target is not null then
  update public.observations set resource=resource_value,desired_behaviour=desired_value,intent_basis=basis_value,started_on=_started_on,intervention_status=status_value where id=target;
 end if;
 return result;
end; $$;
revoke all on function public.submit_intervention_observation(uuid,text,text,text,text,text,text,date,text,boolean,text,text,text,date,text) from public,anon;
grant execute on function public.submit_intervention_observation(uuid,text,text,text,text,text,text,date,text,boolean,text,text,text,date,text) to authenticated;
