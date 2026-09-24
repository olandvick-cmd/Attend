"use client";

import { UserRound } from "lucide-react";

type CampaignNameInputProps = {
  name: string;
  onChange: (name: string) => void;
};

export default function CampaignNameInput({
  name,
  onChange,
}: CampaignNameInputProps) {
  return (
    <div className="mt-5">
      <label
        htmlFor="attendee-name"
        className="text-xs font-semibold text-neutral-700"
      >
        Your name
      </label>

      <div className="relative mt-2">
        <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

        <input
          id="attendee-name"
          type="text"
          value={name}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Enter your name"
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      </div>
    </div>
  );
}