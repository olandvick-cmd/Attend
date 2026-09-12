export type NotificationCategory =
  | "events"
  | "campaigns"
  | "activity"
  | "recommendations"
  | "general";

export type NotificationPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type NotificationStatus =
  | "scheduled"
  | "sent"
  | "read"
  | "dismissed"
  | "expired";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  event_id: string | null;
  campaign_id: string | null;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  delivery_channel: "in_app" | "push" | "email" | "whatsapp";
  priority: NotificationPriority;
  dedupe_key: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type NotificationFilter =
  | "all"
  | "events"
  | "campaigns"
  | "activity"
  | "recommendations";

export type NotificationPreferences = {
  user_id: string;
  event_reminders: boolean;
  new_events: boolean;
  trending_events: boolean;
  campaign_activity: boolean;
  campaign_milestones: boolean;
  recommendations: boolean;
  campaign_insights: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  smart_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
};