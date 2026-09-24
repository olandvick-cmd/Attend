"use client";

import { ImagePlus } from "lucide-react";

type CampaignPhotoUploadProps = {
  photo: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

export default function CampaignPhotoUpload({
  photo,
  onChange,
}: CampaignPhotoUploadProps) {
  return (
    <div className="mt-6">
      <label className="text-xs font-semibold text-neutral-700">
        Your photo
      </label>

      <label
        htmlFor="attendee-photo"
        className="mt-2 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 text-center transition hover:border-violet-400 hover:bg-violet-50/40"
      >
        {photo ? (
          <>
            <img
              src={photo}
              alt=""
              className="h-24 w-24 rounded-xl object-cover shadow-sm"
            />

            <p className="mt-3 text-xs font-semibold text-violet-600">
              Change photo
            </p>
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <ImagePlus className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-semibold text-neutral-700">
              Upload your photo
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              PNG or JPG · Max 10 MB
            </p>
          </>
        )}

        <input
          id="attendee-photo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onChange}
        />
      </label>
    </div>
  );
}