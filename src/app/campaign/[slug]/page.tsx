"use client";

import {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowDownToLine,
  Check,
  ImagePlus,
  Loader2,
  Move,
  RotateCcw,
  Sparkles,
  UserRound,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  event_id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: "draft" | "published" | "paused" | "archived";
  views: number;
  generations: number;
  downloads: number;
  shares: number;
  participants: number;
};

type Template = {
  id: string;
  campaign_id: string;
  name: string;
  asset_url: string;
  width: number;
  height: number;
  canvas_config: CanvasConfig | null;
  version: number;
  is_active: boolean;
};

type PhotoConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  shape?: "rectangle" | "circle";
};

type NameConfig = {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  textAlign?: "left" | "center" | "right";
  fontFamily?: string;
  fontWeight?: string | number;
  color?: string;
  angle?: number;
};

type CanvasConfig = {
  canvas?: { width: number; height: number };
  photo: PhotoConfig | null;
  name: NameConfig | null;
};

type PhotoPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  shape: "rectangle" | "circle";
};

type NamePosition = {
  left: number;
  top: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  textAlign: "left" | "center" | "right";
  color: string;
  angle: number;
};

type PhotoAdjustment = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

const DEFAULT_ADJUSTMENT: PhotoAdjustment = { zoom: 1, offsetX: 0, offsetY: 0 };

/*
 * =========================================================
 * HELPER FUNCTIONS
 * =========================================================
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.drawImage(img, x, y, w, h);
}

function coverSize(frameW: number, frameH: number, imgW: number, imgH: number, zoom: number) {
  const frameRatio = frameW / frameH;
  const imgRatio = imgW / imgH;

  let baseWidth = frameW;
  let baseHeight = frameH;

  if (imgRatio > frameRatio) {
    baseHeight = frameH;
    baseWidth = frameH * imgRatio;
  } else {
    baseWidth = frameW;
    baseHeight = frameW / imgRatio;
  }

  return { width: baseWidth * zoom, height: baseHeight * zoom };
}

function maxOffset(frameW: number, frameH: number, drawW: number, drawH: number) {
  return {
    x: Math.max(0, (drawW - frameW) / (2 * frameW)),
    y: Math.max(0, (drawH - frameH) / (2 * frameH)),
  };
}

function clampAdjustment(
  adjustment: PhotoAdjustment,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number
): PhotoAdjustment {
  const { width, height } = coverSize(frameW, frameH, imgW, imgH, adjustment.zoom);
  const bounds = maxOffset(frameW, frameH, width, height);

  return {
    zoom: adjustment.zoom,
    offsetX: Math.min(bounds.x, Math.max(-bounds.x, adjustment.offsetX)),
    offsetY: Math.min(bounds.y, Math.max(-bounds.y, adjustment.offsetY)),
  };
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function PublicCampaignPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<{ width: number; height: number } | null>(null);
  const [adjustment, setAdjustment] = useState<PhotoAdjustment>(DEFAULT_ADJUSTMENT);

  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startY: number; startOffset: PhotoAdjustment } | null>(
    null
  );

  useEffect(() => {
    async function loadCampaign() {
      setLoading(true);
      setError("");

      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (campaignError || !campaignData) {
          throw new Error("This campaign does not exist or is no longer available.");
        }

        setCampaign(campaignData as Campaign);

        const { data: templateData, error: templateError } = await supabase
          .from("campaign_templates")
          .select("*")
          .eq("campaign_id", campaignData.id)
          .eq("is_active", true)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (templateError) {
          throw new Error(templateError.message);
        }

        if (!templateData) {
          throw new Error("This campaign does not have a design yet.");
        }

        setTemplate(templateData as Template);

        await supabase
          .from("campaigns")
          .update({ views: (campaignData.views || 0) + 1 })
          .eq("id", campaignData.id);
      } catch (err: any) {
        console.error("Campaign loading error:", err);
        setError(err?.message || "Unable to load this campaign.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCampaign();
    }
  }, [slug]);

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;

      const probe = new Image();
      probe.onload = () => {
        setPhotoSize({ width: probe.naturalWidth, height: probe.naturalHeight });
        setAdjustment(DEFAULT_ADJUSTMENT);
        setPhoto(dataUrl);
        setGeneratedImage(null);
        setDownloaded(false);
      };
      probe.onerror = () => {
        setError("Could not read your photo.");
      };
      probe.src = dataUrl;
    };

    reader.onerror = () => {
      setError("Could not read your photo.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  const canvasConfig = template?.canvas_config;

  const canvasWidth = canvasConfig?.canvas?.width || template?.width || 1080;
  const canvasHeight = canvasConfig?.canvas?.height || template?.height || 1080;

  const photoPosition = useMemo<PhotoPosition>(() => {
    const photoConfig = canvasConfig?.photo;

    if (!photoConfig) {
      return { left: 25, top: 25, width: 50, height: 50, angle: 0, shape: "rectangle" };
    }

    return {
      left: (photoConfig.x / canvasWidth) * 100,
      top: (photoConfig.y / canvasHeight) * 100,
      width: (photoConfig.width / canvasWidth) * 100,
      height: (photoConfig.height / canvasHeight) * 100,
      angle: photoConfig.angle || 0,
      shape: photoConfig.shape || "rectangle",
    };
  }, [canvasConfig, canvasWidth, canvasHeight]);

  const namePosition = useMemo<NamePosition>(() => {
    const nameConfig = canvasConfig?.name;

    if (!nameConfig) {
      return {
        left: 10,
        top: 85,
        width: 80,
        fontSize: 42,
        fontFamily: "Arial",
        fontWeight: 600,
        textAlign: "center",
        color: "#111111",
        angle: 0,
      };
    }

    return {
      left: (nameConfig.x / canvasWidth) * 100,
      top: (nameConfig.y / canvasHeight) * 100,
      width: (nameConfig.width / canvasWidth) * 100,
      fontSize: nameConfig.fontSize || 42,
      fontFamily: nameConfig.fontFamily || "Arial",
      fontWeight: nameConfig.fontWeight || 600,
      textAlign: nameConfig.textAlign || "center",
      color: nameConfig.color || "#111111",
      angle: nameConfig.angle || 0,
    };
  }, [canvasConfig, canvasWidth, canvasHeight]);

  const nameHeightPct = ((namePosition.fontSize * 1.5) / canvasHeight) * 100;

  const clampedAdjustment = useMemo(() => {
    if (!photoSize) return adjustment;

    return clampAdjustment(
      adjustment,
      photoPosition.width,
      photoPosition.height,
      photoSize.width,
      photoSize.height
    );
  }, [adjustment, photoPosition.width, photoPosition.height, photoSize]);

  function updateZoom(nextZoom: number) {
    setAdjustment((current) => {
      const zoom = Math.min(3, Math.max(1, nextZoom));
      if (!photoSize) return { ...current, zoom };
      return clampAdjustment(
        { ...current, zoom },
        photoPosition.width,
        photoPosition.height,
        photoSize.width,
        photoSize.height
      );
    });
  }

  function resetAdjustment() {
    setAdjustment(DEFAULT_ADJUSTMENT);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!photo) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: clampedAdjustment,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current || !frameRef.current || !photoSize) return;

    const rect = frameRef.current.getBoundingClientRect();
    const dxPct = (event.clientX - dragState.current.startX) / rect.width;
    const dyPct = (event.clientY - dragState.current.startY) / rect.height;

    const next = clampAdjustment(
      {
        zoom: dragState.current.startOffset.zoom,
        offsetX: dragState.current.startOffset.offsetX + dxPct,
        offsetY: dragState.current.startOffset.offsetY + dyPct,
      },
      photoPosition.width,
      photoPosition.height,
      photoSize.width,
      photoSize.height
    );

    setAdjustment(next);
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function Preview() {
    if (!template) return null;

    let photoDrawPct: { width: number; height: number; left: number; top: number } | null = null;

    if (photo && photoSize) {
      const frameAspect = photoPosition.width / photoPosition.height;
      const { width: drawW, height: drawH } = coverSize(
        frameAspect,
        1,
        photoSize.width,
        photoSize.height,
        clampedAdjustment.zoom
      );

      const widthPct = (drawW / frameAspect) * 100;
      const heightPct = drawH * 100;

      const leftPct = (100 - widthPct) / 2 + clampedAdjustment.offsetX * 100;
      const topPct = (100 - heightPct) / 2 + clampedAdjustment.offsetY * 100;

      photoDrawPct = {
        width: widthPct,
        height: heightPct,
        left: leftPct,
        top: topPct,
      };
    }

    const nameBoxPixelWidth = (namePosition.width / 100) * canvasWidth;
    const nameBoxPixelHeight = (nameHeightPct / 100) * canvasHeight;

    let textAnchor = "middle";
    let textX = nameBoxPixelWidth / 2;
    if (namePosition.textAlign === "left") {
      textAnchor = "start";
      textX = 0;
    } else if (namePosition.textAlign === "right") {
      textAnchor = "end";
      textX = nameBoxPixelWidth;
    }

    return (
      <div className="flex w-full justify-center">
        <div
          className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-neutral-100 shadow-xl"
          style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}
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
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="absolute cursor-grab touch-none overflow-hidden active:cursor-grabbing"
              style={{
                left: `${photoPosition.left}%`,
                top: `${photoPosition.top}%`,
                width: `${photoPosition.width}%`,
                height: `${photoPosition.height}%`,
                borderRadius: photoPosition.shape === "circle" ? "9999px" : undefined,
                transform: photoPosition.angle ? `rotate(${photoPosition.angle}deg)` : undefined,
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
                transform: namePosition.angle ? `rotate(${namePosition.angle}deg)` : undefined,
              }}
            >
              <svg
                viewBox={`0 0 ${nameBoxPixelWidth} ${nameBoxPixelHeight}`}
                className="h-full w-full overflow-visible"
              >
                <text
                  x={textX}
                  y={nameBoxPixelHeight / 2}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  textLength={nameBoxPixelWidth}
                  lengthAdjust="spacingAndGlyphs"
                  style={{
                    fontFamily: `${namePosition.fontFamily}, Arial, sans-serif`,
                    fontWeight: namePosition.fontWeight,
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

  async function generateDP() {
    if (!campaign || !template) return;

    if (!photo || !photoSize) {
      setError("Please upload your photo first.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setError("");
    setGenerating(true);
    setGeneratedImage(null);
    setDownloaded(false);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        throw new Error("Your browser could not prepare the image.");
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const design = await loadImage(template.asset_url);
      drawContain(ctx, design, 0, 0, canvasWidth, canvasHeight);

      const attendeePhoto = await loadImage(photo);

      const px = (photoPosition.left / 100) * canvasWidth;
      const py = (photoPosition.top / 100) * canvasHeight;
      const pw = (photoPosition.width / 100) * canvasWidth;
      const ph = (photoPosition.height / 100) * canvasHeight;

      const { width: drawW, height: drawH } = coverSize(
        pw,
        ph,
        attendeePhoto.width,
        attendeePhoto.height,
        clampedAdjustment.zoom
      );

      const drawX = px + (pw - drawW) / 2 + clampedAdjustment.offsetX * pw;
      const drawY = py + (ph - drawH) / 2 + clampedAdjustment.offsetY * ph;

      ctx.save();

      if (photoPosition.angle) {
        const centerX = px + pw / 2;
        const centerY = py + ph / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((photoPosition.angle * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.beginPath();
      if (photoPosition.shape === "circle") {
        ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(px, py, pw, ph);
      }
      ctx.clip();

      ctx.drawImage(attendeePhoto, drawX, drawY, drawW, drawH);

      ctx.restore();

      const nx = (namePosition.left / 100) * canvasWidth;
      const ny = (namePosition.top / 100) * canvasHeight;
      const nw = (namePosition.width / 100) * canvasWidth;
      const nh = (nameHeightPct / 100) * canvasHeight;

      ctx.save();

      if (namePosition.angle) {
        const centerX = nx + nw / 2;
        const centerY = ny + nh / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((namePosition.angle * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      const textAlign =
        namePosition.textAlign === "left" ? "left" : namePosition.textAlign === "right" ? "right" : "center";

      ctx.textAlign = textAlign;
      ctx.textBaseline = "middle";
      ctx.fillStyle = namePosition.color;

      let currentFontSize = Math.max(10, namePosition.fontSize);
      ctx.font = `${namePosition.fontWeight} ${currentFontSize}px ${namePosition.fontFamily}, Arial, sans-serif`;

      const textToDraw = name.trim();
      let textWidth = ctx.measureText(textToDraw).width;

      while (textWidth > nw && currentFontSize > 10) {
        currentFontSize -= 1;
        ctx.font = `${namePosition.fontWeight} ${currentFontSize}px ${namePosition.fontFamily}, Arial, sans-serif`;
        textWidth = ctx.measureText(textToDraw).width;
      }

      let textX = nx + nw / 2;
      if (textAlign === "left") textX = nx;
      if (textAlign === "right") textX = nx + nw;

      const textY = ny + nh / 2;

      ctx.fillText(textToDraw, textX, textY);

      ctx.restore();

      let result: string;
      try {
        result = canvas.toDataURL("image/png", 1);
      } catch (exportError) {
        console.error("Canvas export failed:", exportError);
        throw new Error(
          "The campaign design could not be exported. Please refresh the page and try again."
        );
      }

      setGeneratedImage(result);

      const nextGenerations = (campaign.generations || 0) + 1;
      const nextParticipants = Math.max(campaign.participants || 0, 1);

      const { error: analyticsError } = await supabase
        .from("campaigns")
        .update({ generations: nextGenerations, participants: nextParticipants })
        .eq("id", campaign.id);

      if (analyticsError) {
        console.warn("Analytics update failed:", analyticsError);
      }

      setCampaign({ ...campaign, generations: nextGenerations, participants: nextParticipants });
    } catch (err: any) {
      console.error("DP generation failed:", err);
      setGeneratedImage(null);
      setError(err?.message || "Could not generate your DP.");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadDP() {
    if (!generatedImage) return;

    try {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `${slug}-attend-dp.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloaded(true);

      if (campaign) {
        const nextDownloads = (campaign.downloads || 0) + 1;
        const { error: downloadError } = await supabase
          .from("campaigns")
          .update({ downloads: nextDownloads })
          .eq("id", campaign.id);

        if (downloadError) {
          console.warn("Download analytics failed:", downloadError);
        }

        setCampaign({ ...campaign, downloads: nextDownloads });
      }
    } catch (err) {
      console.error("Download failed:", err);
      setError("Could not download the image. Please try again.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-neutral-500">Loading campaign...</p>
        </div>
      </main>
    );
  }

  if (error && !campaign) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-bold">Campaign unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!campaign || !template) return null;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">Attend</span>
          </div>
          <span className="text-xs font-medium text-neutral-400">Event DP</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            {campaign.title}
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Create your event DP
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base">
            Upload your photo and enter your name. Attend will place them into the event design
            for you.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          {/* PREVIEW */}
          <section className="order-2 lg:order-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Preview</h2>
              <span className="text-xs text-neutral-400">
                {canvasWidth} × {canvasHeight}px
              </span>
            </div>

            <div className="rounded-2xl bg-neutral-100 p-3 sm:p-5">
              {generatedImage ? (
                <div className="flex justify-center">
                  <img
                    src={generatedImage}
                    alt="Generated event DP"
                    className="max-h-[700px] w-auto max-w-full rounded-xl shadow-lg"
                  />
                </div>
              ) : (
                <Preview />
              )}
            </div>

            {/* PHOTO ADJUSTMENT CONTROLS */}
            {photo && !generatedImage && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <Move className="h-4 w-4 shrink-0 text-neutral-400" />
                <p className="flex-1 text-xs text-neutral-500">
                  Drag your photo to reposition it, or zoom to adjust the crop.
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateZoom(clampedAdjustment.zoom - 0.1)}
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
                    value={clampedAdjustment.zoom}
                    onChange={(e) => updateZoom(Number(e.target.value))}
                    className="w-24 accent-violet-600"
                  />
                  <button
                    type="button"
                    onClick={() => updateZoom(clampedAdjustment.zoom + 0.1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetAdjustment}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
                    title="Reset position"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* FORM */}
          <section className="order-1 lg:order-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold">Personalize your DP</h2>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Your photo and name will be placed into the campaign design.
              </p>

              {/* PHOTO */}
              <div className="mt-6">
                <label className="text-xs font-semibold text-neutral-700">Your photo</label>

                <label
                  htmlFor="attendee-photo"
                  className="mt-2 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 text-center transition hover:border-violet-400 hover:bg-violet-50/40"
                >
                  {photo ? (
                    <>
                      <img src={photo} alt="" className="h-24 w-24 rounded-xl object-cover shadow-sm" />
                      <p className="mt-3 text-xs font-semibold text-violet-600">Change photo</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-neutral-700">Upload your photo</p>
                      <p className="mt-1 text-xs text-neutral-400">PNG or JPG · Max 10 MB</p>
                    </>
                  )}

                  <input
                    id="attendee-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              {/* NAME */}
              <div className="mt-5">
                <label htmlFor="attendee-name" className="text-xs font-semibold text-neutral-700">
                  Your name
                </label>

                <div className="relative mt-2">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="attendee-name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setGeneratedImage(null);
                      setDownloaded(false);
                      setError("");
                    }}
                    placeholder="Enter your name"
                    maxLength={80}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {error}
                </div>
              )}

              {!generatedImage ? (
                <button
                  type="button"
                  onClick={generateDP}
                  disabled={generating || !photo || !name.trim()}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating DP...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate DP
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={downloadDP}
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
                    onClick={() => setGeneratedImage(null)}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Make another
                  </button>
                </div>
              )}

              {/* PRIVACY */}
              <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
                No account required. Your photo is processed in your browser.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}