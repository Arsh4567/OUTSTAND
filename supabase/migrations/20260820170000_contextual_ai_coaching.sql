alter table public.notification_preferences
  add column if not exists coaching_enabled boolean not null default true;

alter table public.notification_events
  drop constraint if exists notification_events_category_check;

alter table public.notification_events
  add constraint notification_events_category_check
  check (category in ('habit','goal','motivation','update','system','coaching'));

create index if not exists notification_events_coaching_idx
  on public.notification_events(user_id, category, created_at desc);
