export type PhotoAdjustment = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_ADJUSTMENT: PhotoAdjustment = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export function loadImage(
  src: string
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const img = new Image();

      img.crossOrigin = "anonymous";

      img.onload = () =>
        resolve(img);

      img.onerror = reject;

      img.src = src;
    }
  );
}

export function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.drawImage(
    img,
    x,
    y,
    width,
    height
  );
}

export function coverSize(
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number,
  zoom: number
) {
  const frameRatio =
    frameW / frameH;

  const imgRatio =
    imgW / imgH;

  let baseWidth = frameW;
  let baseHeight = frameH;

  if (imgRatio > frameRatio) {
    baseHeight = frameH;
    baseWidth =
      frameH * imgRatio;
  } else {
    baseWidth = frameW;
    baseHeight =
      frameW / imgRatio;
  }

  return {
    width: baseWidth * zoom,
    height: baseHeight * zoom,
  };
}

export function maxOffset(
  frameW: number,
  frameH: number,
  drawW: number,
  drawH: number
) {
  return {
    x: Math.max(
      0,
      (drawW - frameW) /
        (2 * frameW)
    ),
    y: Math.max(
      0,
      (drawH - frameH) /
        (2 * frameH)
    ),
  };
}

export function clampAdjustment(
  adjustment: PhotoAdjustment,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number
): PhotoAdjustment {
  const {
    width,
    height,
  } = coverSize(
    frameW,
    frameH,
    imgW,
    imgH,
    adjustment.zoom
  );

  const bounds =
    maxOffset(
      frameW,
      frameH,
      width,
      height
    );

  return {
    zoom: adjustment.zoom,

    offsetX: Math.min(
      bounds.x,
      Math.max(
        -bounds.x,
        adjustment.offsetX
      )
    ),

    offsetY: Math.min(
      bounds.y,
      Math.max(
        -bounds.y,
        adjustment.offsetY
      )
    ),
  };
}