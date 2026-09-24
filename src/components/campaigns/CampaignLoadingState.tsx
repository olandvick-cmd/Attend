"use client";

import { Loader2 } from "lucide-react";

export default function CampaignLoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Loading campaign...
        </p>
      </div>
    </main>
  );
}