export type NotificationStatus = "read" | "unread";

export type Notification = {
  id: string;
  type: string | null;
  category: string | null;
  title: string;
  message: string | null;
  action_url: string | null;
  action_label: string | null;
  event_id: string | null;
  campaign_id: string | null;
  metadata: Record<string, unknown>;
  delivery_channel: string | null;
  status: NotificationStatus;
  priority: "low" | "normal" | "high" | "urgent";
  read_at: string | null;
  created_at: string;
};