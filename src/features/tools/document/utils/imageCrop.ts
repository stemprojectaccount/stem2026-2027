export interface CropRect {
  /** Normalized left coordinate in [0, 1] */
  x: number;
  /** Normalized top coordinate in [0, 1] */
  y: number;
  /** Normalized width in (0, 1] */
  width: number;
  /** Normalized height in (0, 1] */
  height: number;
}

export type CropHandle = 'nw' | 'ne' | 'sw' | 'se';

export interface PixelCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const DEFAULT_CROP_RECT: CropRect = {
  x: 0.08,
  y: 0.08,
  width: 0.84,
  height: 0.84,
};

export const MIN_CROP_FRACTION = 0.05;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function normalizeDragRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  minSize = MIN_CROP_FRACTION,
): CropRect {
  const sx = clamp(startX, 0, 1);
  const sy = clamp(startY, 0, 1);
  const ex = clamp(endX, 0, 1);
  const ey = clamp(endY, 0, 1);

  let x = Math.min(sx, ex);
  let y = Math.min(sy, ey);
  let width = Math.abs(ex - sx);
  let height = Math.abs(ey - sy);

  if (width < minSize) {
    width = minSize;
    if (x + width > 1) {
      x = Math.max(0, 1 - width);
    }
  }

  if (height < minSize) {
    height = minSize;
    if (y + height > 1) {
      y = Math.max(0, 1 - height);
    }
  }

  return { x, y, width, height };
}

export function moveCropRect(rect: CropRect, deltaX: number, deltaY: number): CropRect {
  const width = clamp(rect.width, MIN_CROP_FRACTION, 1);
  const height = clamp(rect.height, MIN_CROP_FRACTION, 1);
  const x = clamp(rect.x + deltaX, 0, 1 - width);
  const y = clamp(rect.y + deltaY, 0, 1 - height);
  return { x, y, width, height };
}

export function resizeCropRect(
  rect: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  minSize = MIN_CROP_FRACTION,
): CropRect {
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;

  if (handle === 'nw' || handle === 'sw') {
    left = clamp(left + deltaX, 0, right - minSize);
  } else {
    right = clamp(right + deltaX, left + minSize, 1);
  }

  if (handle === 'nw' || handle === 'ne') {
    top = clamp(top + deltaY, 0, bottom - minSize);
  } else {
    bottom = clamp(bottom + deltaY, top + minSize, 1);
  }

  return {
    x: left,
    y: top,
    width: Math.max(minSize, right - left),
    height: Math.max(minSize, bottom - top),
  };
}

export function toPixelCrop(
  rect: CropRect,
  naturalWidth: number,
  naturalHeight: number,
): PixelCrop {
  const safeW = Math.max(1, Math.round(naturalWidth));
  const safeH = Math.max(1, Math.round(naturalHeight));

  const sx = clamp(Math.round(rect.x * safeW), 0, safeW - 1);
  const sy = clamp(Math.round(rect.y * safeH), 0, safeH - 1);
  const sw = clamp(Math.round(rect.width * safeW), 1, safeW - sx);
  const sh = clamp(Math.round(rect.height * safeH), 1, safeH - sy);

  return { sx, sy, sw, sh };
}

export function isFullImageCrop(rect: CropRect): boolean {
  return rect.x <= 0.01 && rect.y <= 0.01 && rect.width >= 0.98 && rect.height >= 0.98;
}

export function cropDataUrlToRegion(
  imageDataUrl: string,
  rect: CropRect,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { sx, sy, sw, sh } = toPixelCrop(rect, img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Không thể khởi tạo vùng vẽ để cắt ảnh.'));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: sw,
        height: sh,
      });
    };
    img.onerror = () => reject(new Error('Không thể tải ảnh để cắt vùng chọn.'));
    img.src = imageDataUrl;
  });
}
