"use client";

import { Sparkles } from "lucide-react";

export default function CampaignHeader() {
  return (
    <header className="border-b border-neutral-100">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>

          <span className="text-lg font-bold tracking-tight">
            Attend
          </span>
        </div>

        <span className="text-xs font-medium text-neutral-400">
          Event DP
        </span>
      </div>
    </header>
  );
}