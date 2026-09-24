"use client";

import type {
  NamePosition,
  PhotoPosition,
  Template,
} from "@/lib/campaigns/types";

import {
  coverSize,
  type PhotoAdjustment,
} from "@/lib/campaigns/image";

type PhotoSize = {
  width: number;
  height: number;
};

type CampaignPreviewProps = {
  template: Template | null;
  photo: string;
  name: string;

  canvasWidth: number;
  canvasHeight: number;

  photoPosition: PhotoPosition;
  namePosition: NamePosition;
  nameHeightPct: number;

  photoSize: PhotoSize | null;
  clampedAdjustment: PhotoAdjustment;

  frameRef: React.RefObject<HTMLDivElement | null>;

  onPointerDown: (
    event: React.PointerEvent<HTMLDivElement>
  ) => void;

  onPointerMove: (
    event: React.PointerEvent<HTMLDivElement>
  ) => void;

  onPointerUp: () => void;
};

export default function CampaignPreview({
  template,
  photo,
  name,
  canvasWidth,
  canvasHeight,
  photoPosition,
  namePosition,
  nameHeightPct,
  photoSize,
  clampedAdjustment,
  frameRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CampaignPreviewProps) {
  if (!template) return null;

  let photoDrawPct: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null = null;

  if (photo && photoSize) {
    const frameAspect =
      photoPosition.width /
      photoPosition.height;

    const {
      width: drawW,
      height: drawH,
    } = coverSize(
      frameAspect,
      1,
      photoSize.width,
      photoSize.height,
      clampedAdjustment.zoom
    );

    const widthPct =
      (drawW / frameAspect) * 100;

    const heightPct =
      drawH * 100;

    const leftPct =
      (100 - widthPct) / 2 +
      clampedAdjustment.offsetX * 100;

    const topPct =
      (100 - heightPct) / 2 +
      clampedAdjustment.offsetY * 100;

    photoDrawPct = {
      width: widthPct,
      height: heightPct,
      left: leftPct,
      top: topPct,
    };
  }

  const nameBoxPixelWidth =
    (namePosition.width / 100) *
    canvasWidth;

  const nameBoxPixelHeight =
    (nameHeightPct / 100) *
    canvasHeight;

  let textAnchor = "middle";

  let textX =
    nameBoxPixelWidth / 2;

  if (namePosition.textAlign === "left") {
    textAnchor = "start";
    textX = 0;
  } else if (
    namePosition.textAlign === "right"
  ) {
    textAnchor = "end";
    textX = nameBoxPixelWidth;
  }

  return (
    <div className="flex w-full justify-center">
      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-neutral-100 shadow-xl"
        style={{
          aspectRatio: `${canvasWidth}/${canvasHeight}`,
        }}
      >
        {/* DESIGN */}
        <img
          src={template.asset_url}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-contain"
        />

        {/* PHOTO FRAME */}
        {photo && (
          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute cursor-grab touch-none overflow-hidden active:cursor-grabbing"
            style={{
              left: `${photoPosition.left}%`,
              top: `${photoPosition.top}%`,
              width: `${photoPosition.width}%`,
              height: `${photoPosition.height}%`,
              borderRadius:
                photoPosition.shape === "circle"
                  ? "9999px"
                  : undefined,
              transform:
                photoPosition.angle
                  ? `rotate(${photoPosition.angle}deg)`
                  : undefined,
            }}
          >
            {photoDrawPct && (
              <img
                src={photo}
                alt="Your uploaded photo"
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  left: `${photoDrawPct.left}%`,
                  top: `${photoDrawPct.top}%`,
                  width: `${photoDrawPct.width}%`,
                  height: `${photoDrawPct.height}%`,
                }}
              />
            )}
          </div>
        )}

        {/* NAME */}
        {name && (
          <div
            className="absolute overflow-hidden"
            style={{
              left: `${namePosition.left}%`,
              top: `${namePosition.top}%`,
              width: `${namePosition.width}%`,
              height: `${nameHeightPct}%`,
              transform:
                namePosition.angle
                  ? `rotate(${namePosition.angle}deg)`
                  : undefined,
            }}
          >
            <svg
              viewBox={`0 0 ${nameBoxPixelWidth} ${nameBoxPixelHeight}`}
              className="h-full w-full overflow-visible"
            >
              <text
                x={textX}
                y={nameBoxPixelHeight / 2}
                textAnchor={
                  textAnchor as
                    | "start"
                    | "middle"
                    | "end"
                    | "inherit"
                }
                dominantBaseline="central"
                textLength={nameBoxPixelWidth}
                lengthAdjust="spacingAndGlyphs"
                style={{
                  fontFamily: `${namePosition.fontFamily}, Arial, sans-serif`,
                  fontWeight:
                    namePosition.fontWeight,
                  fontSize: `${namePosition.fontSize}px`,
                  fill: namePosition.color,
                }}
              >
                {name}
              </text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}