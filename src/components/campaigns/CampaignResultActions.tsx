"use client";

import {
  ArrowDownToLine,
  Check,
  Loader2,
  RotateCcw,
  Share2,
} from "lucide-react";

type CampaignResultActionsProps = {
  downloaded: boolean;
  sharing: boolean;
  shared: boolean;
  onDownload: () => void;
  onShare: () => void;
  onCreateAnother: () => void;
};

export default function CampaignResultActions({
  downloaded,
  sharing,
  shared,
  onDownload,
  onShare,
  onCreateAnother,
}: CampaignResultActionsProps) {
  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={onDownload}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
      >
        {downloaded ? (
          <>
            <Check className="h-4 w-4" />
            Downloaded
          </>
        ) : (
          <>
            <ArrowDownToLine className="h-4 w-4" />
            Download DP
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onShare}
        disabled={sharing}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-violet-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
      >
        {sharing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sharing...
          </>
        ) : shared ? (
          <>
            <Check className="h-4 w-4" />
            Shared
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share DP
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onCreateAnother}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-violet-600 transition hover:bg-neutral-50"
      >
        <RotateCcw className="h-4 w-4" />
        Create another
      </button>
    </div>
  );
}