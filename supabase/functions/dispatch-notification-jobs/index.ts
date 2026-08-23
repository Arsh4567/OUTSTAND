import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-notification`;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { data: events, error } = await admin
    .from("notification_events")
    .select("id")
    .is("delivered_at", null)
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .limit(100);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });

  let dispatched = 0;
  for (const event of events ?? []) {
    const result = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE },
      body: JSON.stringify({ event_id: event.id }),
    });
    if (result.ok) dispatched += 1;
  }

  return new Response(JSON.stringify({ dispatched }), { headers: { "Content-Type": "application/json" } });
});
