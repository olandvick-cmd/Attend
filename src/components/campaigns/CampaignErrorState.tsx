"use client";

import { Sparkles } from "lucide-react";

type CampaignErrorStateProps = {
  error: string;
};

export default function CampaignErrorState({
  error,
}: CampaignErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Sparkles className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-xl font-bold">
          Campaign unavailable
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {error}
        </p>
      </div>
    </main>
  );
}