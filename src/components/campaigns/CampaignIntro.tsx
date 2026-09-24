"use client";

import { Sparkles } from "lucide-react";

type CampaignIntroProps = {
  title: string;
};

export default function CampaignIntro({
  title,
}: CampaignIntroProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
        <Sparkles className="h-3.5 w-3.5" />
        {title}
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
        Create your event DP
      </h1>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base">
        Upload your photo and enter your name. Attend will place them into the event design for you.
      </p>
    </div>
  );
}