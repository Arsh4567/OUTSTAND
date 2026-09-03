-- The canonical hourly notification engine already performs scheduling,
-- timezone/quiet-hour handling, deduplication, delivery logging and push delivery.
-- Remove the obsolete minute-by-minute dispatcher that references the retired
-- notification_jobs/enqueue_due_notification_jobs pipeline.
select cron.unschedule('outstand-dispatch-notification-jobs');
