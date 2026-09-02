"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import CampaignBuilder from "@/components/campaigns/campaign-builder";

type Campaign = {
  id: string;
  event_id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
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

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] =
    useState<Campaign | null>(null);

  const [template, setTemplate] =
    useState<Template | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCampaign() {
      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        /*
         * ---------------------------------------------
         * AUTH
         * ---------------------------------------------
         */

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        /*
         * ---------------------------------------------
         * LOAD CAMPAIGN
         * ---------------------------------------------
         */

        const {
          data: campaignData,
          error: campaignError,
        } = await supabase
          .from("campaigns")
          .select(
            "id,event_id,creator_id,title,slug,description,status"
          )
          .eq("id", campaignId)
          .eq("event_id", eventId)
          .single();

        if (
          campaignError ||
          !campaignData
        ) {
          throw new Error(
            "Campaign could not be found."
          );
        }

        /*
         * ---------------------------------------------
         * CREATOR CHECK
         * ---------------------------------------------
         */

        if (
          campaignData.creator_id !==
          user.id
        ) {
          throw new Error(
            "You don't have permission to edit this campaign."
          );
        }

        /*
         * ---------------------------------------------
         * LOAD ACTIVE TEMPLATE
         * ---------------------------------------------
         */

        const {
          data: templateData,
          error: templateError,
        } = await supabase
          .from("campaign_templates")
          .select("*")
          .eq(
            "campaign_id",
            campaignId
          )
          .eq(
            "is_active",
            true
          )
          .order(
            "version",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

        if (templateError) {
          throw new Error(
            templateError.message
          );
        }

        if (!templateData) {
          throw new Error(
            "No campaign design was found."
          );
        }

        if (!mounted) return;

        setCampaign(
          campaignData as Campaign
        );

        setTemplate(
          templateData as Template
        );
      } catch (err: any) {
        console.error(
          "Edit campaign error:",
          err
        );

        if (!mounted) return;

        setError(
          err?.message ||
            "Unable to load campaign."
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
  ]);

  /*
   * ---------------------------------------------
   * LOADING
   * ---------------------------------------------
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </main>
    );
  }

  /*
   * ---------------------------------------------
   * ERROR
   * ---------------------------------------------
   */

  if (
    error ||
    !campaign ||
    !template
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <h1 className="text-lg font-bold text-neutral-900">
            Unable to edit campaign
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {error ||
              "The campaign could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/events/${eventId}/campaigns/${campaignId}`
              )
            }
            className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------
   * BUILDER
   * ---------------------------------------------
   */

  return (
    <CampaignBuilder
      mode="edit"
      eventId={eventId}
      campaign={campaign}
      template={template}
    />
  );
}