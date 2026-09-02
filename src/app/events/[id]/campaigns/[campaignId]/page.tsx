"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Share2,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  event_id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: "draft" | "published" | "paused" | "archived";
  views: number;
  generations: number;
  downloads: number;
  shares: number;
  participants: number;
  created_at: string;
  updated_at: string;
};

type Template = {
  id: string;
  campaign_id: string;
  name: string;
  asset_url: string;
  width: number;
  height: number;
  canvas_config: any;
  version: number;
  is_active: boolean;
};

type Event = {
  id: string;
  title: string;
  cover_image: string | null;
};

export default function CampaignDashboard() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;
  const campaignId = params.campaignId as string;

  const supabase = useMemo(() => createClient(), []);

  const [campaign, setCampaign] =
    useState<Campaign | null>(null);

  const [template, setTemplate] =
    useState<Template | null>(null);

  const [event, setEvent] =
    useState<Event | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [publishing, setPublishing] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ---------------------------------------------------------
   * LOAD CAMPAIGN
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function loadCampaign() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        /*
         * Campaign
         */

        const {
          data: campaignData,
          error: campaignError,
        } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", campaignId)
          .eq("event_id", eventId)
          .single();

        if (campaignError || !campaignData) {
          throw new Error(
            campaignError?.message ||
              "Campaign could not be found."
          );
        }

        /*
         * Security check.
         */

        if (campaignData.creator_id !== user.id) {
          throw new Error(
            "You don't have permission to view this campaign."
          );
        }

        if (!mounted) return;

        setCampaign(campaignData as Campaign);

        /*
         * Event
         */

        const {
          data: eventData,
          error: eventError,
        } = await supabase
          .from("events")
          .select("id, title, cover_image")
          .eq("id", eventId)
          .single();

        if (eventError || !eventData) {
          throw new Error(
            eventError?.message ||
              "Event could not be found."
          );
        }

        if (!mounted) return;

        setEvent(eventData as Event);

        /*
         * Active template
         */

        const {
          data: templateData,
          error: templateError,
        } = await supabase
          .from("campaign_templates")
          .select("*")
          .eq("campaign_id", campaignId)
          .eq("is_active", true)
          .order("version", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (templateError && templateError.code !== "PGRST116") {
          throw new Error(templateError.message);
        }

        if (!mounted) return;

        if (templateData) {
          setTemplate(templateData as Template);
        }
      } catch (err: any) {
        console.error("Campaign dashboard error:", err);

        if (!mounted) return;

        setError(
          err?.message ||
            "Something went wrong."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCampaign();

    return () => {
      mounted = false;
    };
  }, [
    campaignId,
    eventId,
    router,
    supabase,
  ]);

  /*
   * ---------------------------------------------------------
   * PUBLIC CAMPAIGN URL
   * ---------------------------------------------------------
   */

  function getCampaignUrl() {
    if (typeof window === "undefined") {
      return "";
    }

    if (!campaign) {
      return "";
    }

    return `${window.location.origin}/campaign/${campaign.slug}`;
  }

  /*
   * ---------------------------------------------------------
   * COPY CAMPAIGN LINK
   * ---------------------------------------------------------
   */

  async function copyCampaignLink() {
    const url = getCampaignUrl();

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Could not copy campaign link:",
        err
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * PUBLISH CAMPAIGN
   * ---------------------------------------------------------
   */

  async function publishCampaign() {
    if (!campaign) return;

    setPublishing(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      /*
       * Confirm creator.
       */

      if (campaign.creator_id !== user.id) {
        throw new Error(
          "You don't have permission to publish this campaign."
        );
      }

      /*
       * Make campaign public.
       */

      const {
        data,
        error: updateError,
      } = await supabase
        .from("campaigns")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("creator_id", user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      setCampaign(data as Campaign);
    } catch (err: any) {
      console.error(
        "Publish campaign error:",
        err
      );

      setError(
        err?.message ||
          "Could not publish campaign."
      );
    } finally {
      setPublishing(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (error && !campaign) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            !
          </div>

          <h1 className="mt-4 text-lg font-semibold">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/events/${eventId}`
              )
            }
            className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Back to event
          </button>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */

  const statusLabel = {
    draft: "Draft",
    published: "Published",
    paused: "Paused",
    archived: "Archived",
  }[campaign.status];

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-neutral-50">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/events/${eventId}`
              )
            }
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              {event?.title || "Event"}
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </button>

          <div className="flex items-center gap-2">

            {campaign.status === "published" && (
              <a
                href={getCampaignUrl()}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium transition hover:bg-neutral-50 sm:flex"
              >
                <ExternalLink className="h-4 w-4" />
                View campaign
              </a>
            )}

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

          </div>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-[1400px] px-5 py-8">

        {/* TITLE */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <div className="flex items-center gap-2">

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  campaign.status === "published"
                    ? "bg-green-50 text-green-700"
                    : campaign.status === "paused"
                    ? "bg-amber-50 text-amber-700"
                    : campaign.status === "archived"
                    ? "bg-red-50 text-red-600"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {statusLabel}
              </span>

              <span className="text-xs text-neutral-400">
                Campaign
              </span>

            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {campaign.title}
            </h1>

            {campaign.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                {campaign.description}
              </p>
            )}

          </div>

          <div className="flex gap-2">

            {/* EDIT */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/events/${eventId}/campaigns/${campaignId}/edit`
                )
              }
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            >
              <Pencil className="h-4 w-4" />

              Edit
            </button>

            {/* PUBLISH */}

            {campaign.status === "draft" && (
              <button
                type="button"
                onClick={publishCampaign}
                disabled={publishing}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                {publishing
                  ? "Publishing..."
                  : "Publish campaign"}
              </button>
            )}

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Participants"
            value={campaign.participants || 0}
            icon={
              <Users className="h-5 w-5" />
            }
          />

          <StatCard
            label="Generations"
            value={campaign.generations || 0}
            icon={
              <ImageIcon className="h-5 w-5" />
            }
          />

          <StatCard
            label="Downloads"
            value={campaign.downloads || 0}
            icon={<ArrowDownIcon />}
          />

          <StatCard
            label="Views"
            value={campaign.views || 0}
            icon={
              <Eye className="h-5 w-5" />
            }
          />

        </div>

        {/* MAIN GRID */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

          {/* PREVIEW */}

          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">

              <div>
                <h2 className="text-sm font-semibold">
                  Campaign design
                </h2>

                {template && (
                  <p className="mt-1 text-xs text-neutral-400">
                    {template.width} ×{" "}
                    {template.height}px
                  </p>
                )}
              </div>

              <span className="text-xs text-neutral-400">
                Template v
                {template?.version || 1}
              </span>

            </div>

            <div className="flex min-h-[500px] items-center justify-center bg-neutral-100 p-6">

              {template?.asset_url ? (
                <div className="max-h-[650px] max-w-full overflow-hidden rounded-xl bg-white shadow-lg">

                  <img
                    src={template.asset_url}
                    alt={campaign.title}
                    className="block max-h-[620px] max-w-full object-contain"
                  />

                </div>
              ) : (
                <div className="text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-400 shadow-sm">
                    <ImageIcon className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-medium">
                    No design found
                  </p>

                </div>
              )}

            </div>

          </section>

          {/* CAMPAIGN INFO */}

          <section className="space-y-6">

            {/* SHARE */}

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-sm font-semibold">
                    Campaign link
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Share this link with your attendees.
                  </p>
                </div>

                <Share2 className="h-5 w-5 text-neutral-400" />

              </div>

              <div className="mt-4 flex gap-2">

                <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">

                  <p className="truncate text-xs text-neutral-500">
                    {getCampaignUrl()}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={copyCampaignLink}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}

                  <span className="hidden sm:inline">
                    {copied
                      ? "Copied"
                      : "Copy"}
                  </span>
                </button>

              </div>

            </div>

            {/* STATUS */}

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

              <h2 className="text-sm font-semibold">
                Campaign status
              </h2>

              <div className="mt-4 rounded-xl bg-neutral-50 p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium">
                      {statusLabel}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {campaign.status === "draft"
                        ? "Only you can access this campaign."
                        : campaign.status === "published"
                        ? "Anyone with the campaign link can participate."
                        : campaign.status === "paused"
                        ? "Participants cannot generate new DPs."
                        : "This campaign is no longer active."}
                    </p>

                  </div>

                  <div
                    className={`h-3 w-3 rounded-full ${
                      campaign.status === "published"
                        ? "bg-green-500"
                        : campaign.status === "paused"
                        ? "bg-amber-500"
                        : campaign.status === "archived"
                        ? "bg-red-400"
                        : "bg-neutral-300"
                    }`}
                  />

                </div>

              </div>

            </div>

            {/* EVENT */}

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

              <h2 className="text-sm font-semibold">
                Event
              </h2>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/events/${eventId}`
                  )
                }
                className="mt-3 flex w-full items-center gap-3 rounded-xl border border-neutral-100 p-3 text-left transition hover:bg-neutral-50"
              >

                {event?.cover_image ? (
                  <img
                    src={event.cover_image}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold">
                    {event?.title}
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    View event
                  </p>

                </div>

              </button>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}

/*
 * ---------------------------------------------------------
 * STAT CARD
 * ---------------------------------------------------------
 */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          {icon}
        </div>

      </div>

      <p className="mt-5 text-2xl font-bold tracking-tight">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs font-medium text-neutral-500">
        {label}
      </p>

    </div>
  );
}

/*
 * Simple download icon.
 */

function ArrowDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

