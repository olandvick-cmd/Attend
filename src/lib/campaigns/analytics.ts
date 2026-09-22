import type { SupabaseClient } from "@supabase/supabase-js";

export type CampaignEventType =
  | "view"
  | "generate"
  | "download"
  | "share";

export type CampaignTrafficSource =
  | "discover"
  | "whatsapp"
  | "facebook"
  | "x"
  | "instagram"
  | "telegram"
  | "email"
  | "direct"
  | "other";

export const VALID_TRAFFIC_SOURCES: CampaignTrafficSource[] = [
  "discover",
  "whatsapp",
  "facebook",
  "x",
  "instagram",
  "telegram",
  "email",
  "direct",
  "other",
];

export function getVisitorId(): string {
  const storageKey = "attend_visitor_id";

  try {
    const existing =
      window.localStorage.getItem(storageKey);

    if (existing) {
      return existing;
    }

    const newId = crypto.randomUUID();

    window.localStorage.setItem(
      storageKey,
      newId
    );

    return newId;
  } catch {
    return crypto.randomUUID();
  }
}

export function getCampaignTrafficSource(
  campaignId: string
): CampaignTrafficSource {
  const storageKey =
    `attend_campaign_source_${campaignId}`;

  try {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const querySource =
      params
        .get("source")
        ?.trim()
        .toLowerCase() ||
      params
        .get("utm_source")
        ?.trim()
        .toLowerCase();

    if (
      querySource &&
      VALID_TRAFFIC_SOURCES.includes(
        querySource as CampaignTrafficSource
      )
    ) {
      const source =
        querySource as CampaignTrafficSource;

      window.sessionStorage.setItem(
        storageKey,
        source
      );

      return source;
    }

    const savedSource =
      window.sessionStorage.getItem(
        storageKey
      );

    if (
      savedSource &&
      VALID_TRAFFIC_SOURCES.includes(
        savedSource as CampaignTrafficSource
      )
    ) {
      return savedSource as CampaignTrafficSource;
    }
  } catch {
    // Ignore storage errors.
  }

  return "direct";
}

export async function trackCampaignEvent(
  supabase: SupabaseClient,
  campaignId: string,
  visitorId: string,
  eventType: CampaignEventType,
  trafficSource: CampaignTrafficSource,
  sharePlatform?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } =
    await supabase.rpc(
      "track_campaign_event",
      {
        campaign_uuid: campaignId,
        visitor_uuid: visitorId,
        event_name: eventType,
        traffic_source: trafficSource,
        share_network:
          sharePlatform ?? null,
        event_metadata:
          metadata ?? {},
      }
    );

  if (error) {
    console.warn(
      `Campaign ${eventType} tracking failed:`,
      error
    );
  }
}