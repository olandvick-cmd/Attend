"use client";

import { useParams } from "next/navigation";
import CampaignBuilder from "@/components/campaigns/campaign-builder";

export default function CreateCampaignPage() {
  const params = useParams();

  const eventId = params.id as string;

  return (
    <CampaignBuilder
      mode="create"
      eventId={eventId}
    />
  );
}