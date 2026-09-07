// lib/notifications.ts
import { createClient } from "@/lib/supabase/server";

export async function createNotification({
  userId,
  title,
  message,
  type = "system",
}: {
  userId: string;
  title: string;
  message: string;
  type?: "event" | "campaign" | "system";
}) {
  const supabase = await createClient();

  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });
}