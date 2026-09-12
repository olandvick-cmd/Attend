import { createClient } from "@/lib/supabase/client";

import type {
  Notification,
  NotificationFilter,
  NotificationPreferences,
} from "./types";

const supabase = createClient();

export async function getNotifications(
  filter: NotificationFilter = "all",
  limit = 30
): Promise<Notification[]> {
  const category = filter === "all" ? null : filter;

  const { data, error } = await supabase.rpc(
    "get_my_notifications",
    {
      p_limit: limit,
      p_category: category,
    }
  );

  if (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }

  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc(
    "get_unread_notification_count"
  );

  if (error) {
    console.error("Failed to fetch notification count:", error);
    return 0;
  }

  return Number(data ?? 0);
}

export async function markNotificationRead(
  notificationId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "mark_notification_read",
    {
      p_notification_id: notificationId,
    }
  );

  if (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }

  return Boolean(data);
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc(
    "mark_all_notifications_read"
  );

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
    return 0;
  }

  return Number(data ?? 0);
}

export async function recordNotificationEvent(params: {
  eventType: string;
  eventId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
}) {
  const { data, error } = await supabase.rpc(
    "record_notification_event",
    {
      p_event_type: params.eventType,
      p_event_id: params.eventId ?? null,
      p_campaign_id: params.campaignId ?? null,
      p_metadata: params.metadata ?? {},
      p_dedupe_key: params.dedupeKey ?? null,
    }
  );

  if (error) {
    console.error("Failed to record notification event:", error);
    return null;
  }

  return data as string;
}

export async function createMyNotification(params: {
  type: string;
  category: NotificationFilter;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  eventId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
  deliveryChannel?: "in_app" | "push" | "email" | "whatsapp";
  dedupeKey?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const { data, error } = await supabase.rpc(
    "create_my_notification",
    {
      p_type: params.type,
      p_category: params.category,
      p_title: params.title,
      p_message: params.message,
      p_action_url: params.actionUrl ?? null,
      p_action_label: params.actionLabel ?? null,
      p_event_id: params.eventId ?? null,
      p_campaign_id: params.campaignId ?? null,
      p_metadata: params.metadata ?? {},
      p_delivery_channel:
        params.deliveryChannel ?? "in_app",
      p_dedupe_key: params.dedupeKey ?? null,
      p_priority: params.priority ?? "normal",
    }
  );

  if (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }

  return data as string | null;
}

export async function getNotificationPreferences() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to fetch notification preferences:",
      error
    );

    return null;
  }

  return data as NotificationPreferences | null;
}

export async function updateNotificationPreferences(
  preferences: Partial<
    Omit<
      NotificationPreferences,
      "user_id" | "created_at" | "updated_at"
    >
  >
) {
  const { data, error } = await supabase.rpc(
    "update_notification_preferences",
    {
      p_event_reminders:
        preferences.event_reminders ?? null,

      p_new_events:
        preferences.new_events ?? null,

      p_trending_events:
        preferences.trending_events ?? null,

      p_campaign_activity:
        preferences.campaign_activity ?? null,

      p_campaign_milestones:
        preferences.campaign_milestones ?? null,

      p_recommendations:
        preferences.recommendations ?? null,

      p_campaign_insights:
        preferences.campaign_insights ?? null,

      p_push_enabled:
        preferences.push_enabled ?? null,

      p_email_enabled:
        preferences.email_enabled ?? null,

      p_smart_notifications:
        preferences.smart_notifications ?? null,

      p_quiet_hours_enabled:
        preferences.quiet_hours_enabled ?? null,

      p_quiet_hours_start:
        preferences.quiet_hours_start ?? null,

      p_quiet_hours_end:
        preferences.quiet_hours_end ?? null,
    }
  );

  if (error) {
    console.error(
      "Failed to update notification preferences:",
      error
    );

    throw error;
  }

  return data as NotificationPreferences;
}