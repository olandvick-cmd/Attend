"use client";

import {
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type CampaignPhotoControlsProps = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
};

export default function CampaignPhotoControls({
  zoom,
  onZoomChange,
  onReset,
}: CampaignPhotoControlsProps) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <Move className="h-4 w-4 shrink-0 text-neutral-400" />

      <p className="flex-1 text-xs text-neutral-500">
        Drag your photo to reposition it, or zoom to adjust the crop.
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onZoomChange(zoom - 0.1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) =>
            onZoomChange(
              Number(event.target.value)
            )
          }
          className="w-24 accent-violet-600"
        />

        <button
          type="button"
          onClick={() => onZoomChange(zoom + 0.1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
          title="Reset position"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}