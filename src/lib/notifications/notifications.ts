// src/lib/notifications.ts
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

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });

  if (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}
