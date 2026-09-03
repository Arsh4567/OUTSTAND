-- Allow signed-in users to enqueue notification events for themselves.
-- RLS remains enabled and the inserted user_id must match auth.uid().
create policy "Users can create their own notification events"
on public.notification_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);
