"use client";

import CampaignPhotoUpload from "./CampaignPhotoUpload";
import CampaignNameInput from "./CampaignNameInput";
import CampaignResultActions from "./CampaignResultActions";

type CampaignFormCardProps = {
  photo: string;
  name: string;
  error: string;
  generating: boolean;
  generatedImage: string | null;
  downloaded: boolean;
  sharing: boolean;
  shared: boolean;
  onPhotoChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onNameChange: (name: string) => void;
  onGenerate: () => void;
  onDownload: () => void;
  onShare: () => void;
  onCreateAnother: () => void;
};

export default function CampaignFormCard({
  photo,
  name,
  error,
  generating,
  generatedImage,
  downloaded,
  sharing,
  shared,
  onPhotoChange,
  onNameChange,
  onGenerate,
  onDownload,
  onShare,
  onCreateAnother,
}: CampaignFormCardProps) {
  return (
    <section className="order-1 lg:order-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold">
          Personalize your DP
        </h2>

        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Your photo and name will be placed into the campaign design.
        </p>

        <CampaignPhotoUpload
          photo={photo}
          onChange={onPhotoChange}
        />

        <CampaignNameInput
          name={name}
          onChange={onNameChange}
        />

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
            {error}
          </div>
        )}

        {!generatedImage ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={
              generating ||
              !photo ||
              !name.trim()
            }
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating
              ? "Generating DP..."
              : "Generate DP"}
          </button>
        ) : (
          <CampaignResultActions
            downloaded={downloaded}
            sharing={sharing}
            shared={shared}
            onDownload={onDownload}
            onShare={onShare}
            onCreateAnother={onCreateAnother}
          />
        )}

        <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
          No account required. Your photo is processed in your browser.
        </p>
      </div>
    </section>
  );
}