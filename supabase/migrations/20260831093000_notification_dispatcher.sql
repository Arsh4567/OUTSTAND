-- Ensure the every-minute scheduler actually dispatches queued events.
-- The Edge Function is intentionally public at the HTTP layer because this cron call
-- does not have a user JWT; the function itself only performs server-side delivery.
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_notification_dispatcher()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://zgihqwuzsxpzefhxdxtr.supabase.co/functions/v1/dispatch-notification-jobs',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  );
end;
$$;

do $$
begin
  perform cron.unschedule('outstand-dispatch-notification-jobs');
exception when others then null;
end $$;

select cron.schedule('outstand-dispatch-notification-jobs', '* * * * *', $$select public.trigger_notification_dispatcher();$$);
