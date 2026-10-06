-- Run in the Supabase SQL Editor as project owner AFTER signing in and completing your profile.
-- Replace this placeholder with your full verified Google account email.
begin;
DO $$
declare target uuid;
begin
 select p.id into target from public.profiles p join auth.users u on u.id=p.id
 where lower(u.email)=lower('REPLACE_WITH_OWNER_GOOGLE_EMAIL') and u.raw_app_meta_data->>'provider'='google' and u.email_confirmed_at is not null and p.setup_complete;
 if target is null then raise exception 'Verified Google account with completed profile not found'; end if;
 update public.profiles set role='Admin',requested_role='Admin',access_status='Approved',is_owner=true where id=target;
 insert into public.activity_log(actor_id,event,entity_id,details) values(target,'Owner bootstrapped',target,'{}'::jsonb);
end $$;
commit;
