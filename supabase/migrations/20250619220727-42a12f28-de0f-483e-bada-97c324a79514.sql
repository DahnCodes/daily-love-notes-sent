
-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension for HTTP requests if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the daily love letters to be sent every day at 9 AM UTC
SELECT cron.schedule(
  'daily-love-letters',
  '0 9 * * *', -- Every day at 9 AM UTC (adjust time as needed)
  $$
  SELECT
    net.http_post(
        url:='https://qaeqzmsxcpnrnbwccrzg.supabase.co/functions/v1/send-daily-love-letters',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZXF6bXN4Y3Bucm5id2NjcnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDI3NDAsImV4cCI6MjA2MzU3ODc0MH0.qsdmaq6_zqDnubD5w-xQRAMuvmxj-pc41T6w0NEBLec"}'::jsonb,
        body:='{"triggered_by": "cron"}'::jsonb
    ) as request_id;
  $$
);
