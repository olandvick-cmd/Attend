"use client";

import CampaignGeneratedImage from "./CampaignGeneratedImage";
import CampaignPhotoControls from "./CampaignPhotoControls";

type CampaignPreviewSectionProps = {
  generatedImage: string | null;
  canvasWidth: number;
  canvasHeight: number;
  photo: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  preview: React.ReactNode;
};

export default function CampaignPreviewSection({
  generatedImage,
  canvasWidth,
  canvasHeight,
  photo,
  zoom,
  onZoomChange,
  onReset,
  preview,
}: CampaignPreviewSectionProps) {
  return (
    <section className="order-2 lg:order-1">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Preview</h2>

        <span className="text-xs text-neutral-400">
          {canvasWidth} × {canvasHeight}px
        </span>
      </div>

      <div className="rounded-2xl bg-neutral-100 p-3 sm:p-5">
        {generatedImage ? (
          <CampaignGeneratedImage image={generatedImage} />
        ) : (
          preview
        )}
      </div>

      {photo && !generatedImage && (
        <CampaignPhotoControls
          zoom={zoom}
          onZoomChange={onZoomChange}
          onReset={onReset}
        />
      )}
    </section>
  );
}