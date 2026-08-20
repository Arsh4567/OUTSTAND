import { supabase } from "@/integrations/supabase/client";

export type ChatPresence = { user_id: string; online: boolean; last_seen_at: string | null };

export async function touchLastSeen(userId: string) {
  await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
}

export function isRecentlyOnline(lastSeenAt?: string | null) {
  return Boolean(lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 120_000);
}

export async function uploadChatImage(userId: string, conversationId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${conversationId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, { upsert: false, contentType: file.type || "image/jpeg", cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function softDeleteMessage(messageId: string, userId: string) {
  const { error } = await supabase.from("direct_messages").update({ deleted_at: new Date().toISOString(), deleted_by: userId, content: "" }).eq("id", messageId).eq("sender_id", userId);
  if (error) throw error;
}
