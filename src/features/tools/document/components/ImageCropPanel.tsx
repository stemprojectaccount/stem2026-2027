import React, { useRef, useState } from 'react';
import { Check, Crop, Maximize2, X } from 'lucide-react';
import {
  CropHandle,
  CropRect,
  DEFAULT_CROP_RECT,
  moveCropRect,
  normalizeDragRect,
  resizeCropRect,
  toPixelCrop,
} from '../utils/imageCrop';

interface ImageCropPanelProps {
  imageDataUrl: string;
  initialRect?: CropRect;
  onApplyCrop: (rect: CropRect, translateImmediately: boolean) => void;
  onCancel: () => void;
  disabled?: boolean;
}

type DragState =
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'move'; startX: number; startY: number; originRect: CropRect }
  | { kind: 'resize'; handle: CropHandle; startX: number; startY: number; originRect: CropRect };

const HANDLES: Array<{
  id: CropHandle;
  label: string;
  positionClass: string;
  cursorClass: string;
}> = [
  {
    id: 'nw',
    label: 'Thay đổi kích thước góc trên trái',
    positionClass: '-top-2 -left-2',
    cursorClass: 'cursor-nwse-resize',
  },
  {
    id: 'ne',
    label: 'Thay đổi kích thước góc trên phải',
    positionClass: '-top-2 -right-2',
    cursorClass: 'cursor-nesw-resize',
  },
  {
    id: 'sw',
    label: 'Thay đổi kích thước góc dưới trái',
    positionClass: '-bottom-2 -left-2',
    cursorClass: 'cursor-nesw-resize',
  },
  {
    id: 'se',
    label: 'Thay đổi kích thước góc dưới phải',
    positionClass: '-bottom-2 -right-2',
    cursorClass: 'cursor-nwse-resize',
  },
];

export function ImageCropPanel({
  imageDataUrl,
  initialRect,
  onApplyCrop,
  onCancel,
  disabled = false,
}: ImageCropPanelProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<CropRect>(initialRect || DEFAULT_CROP_RECT);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  function getRelativePoint(clientX: number, clientY: number): { x: number; y: number } | null {
    const el = stageRef.current;
    if (!el) return null;
    const bounds = el.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    return {
      x: (clientX - bounds.left) / bounds.width,
      y: (clientY - bounds.top) / bounds.height,
    };
  }

  function handleStagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || e.button !== 0) return;
    const point = getRelativePoint(e.clientX, e.clientY);
    if (!point) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({ kind: 'draw', startX: point.x, startY: point.y });
    setRect(normalizeDragRect(point.x, point.y, point.x, point.y));
  }

  function handleSelectionPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || e.button !== 0) return;
    e.stopPropagation();
    const point = getRelativePoint(e.clientX, e.clientY);
    if (!point) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    setDragState({ kind: 'move', startX: point.x, startY: point.y, originRect: rect });
  }

  function handleResizePointerDown(
    handle: CropHandle,
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (disabled || e.button !== 0) return;
    e.stopPropagation();
    const point = getRelativePoint(e.clientX, e.clientY);
    if (!point) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    setDragState({
      kind: 'resize',
      handle,
      startX: point.x,
      startY: point.y,
      originRect: rect,
    });
  }

  function handleStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState) return;
    const point = getRelativePoint(e.clientX, e.clientY);
    if (!point) return;

    if (dragState.kind === 'draw') {
      setRect(normalizeDragRect(dragState.startX, dragState.startY, point.x, point.y));
      return;
    }

    const dx = point.x - dragState.startX;
    const dy = point.y - dragState.startY;

    if (dragState.kind === 'move') {
      setRect(moveCropRect(dragState.originRect, dx, dy));
    } else {
      setRect(resizeCropRect(dragState.originRect, dragState.handle, dx, dy));
    }
  }

  function handleStagePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState) return;
    if (stageRef.current?.hasPointerCapture(e.pointerId)) {
      stageRef.current.releasePointerCapture(e.pointerId);
    }
    setDragState(null);
  }

  function handleSelectionKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = 0.02;
    const isResize = e.shiftKey;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setRect((prev) => (isResize ? resizeCropRect(prev, 'se', -step, 0) : moveCropRect(prev, -step, 0)));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setRect((prev) => (isResize ? resizeCropRect(prev, 'se', step, 0) : moveCropRect(prev, step, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setRect((prev) => (isResize ? resizeCropRect(prev, 'se', 0, -step) : moveCropRect(prev, 0, -step)));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setRect((prev) => (isResize ? resizeCropRect(prev, 'se', 0, step) : moveCropRect(prev, 0, step)));
    }
  }

  const pixelCrop = naturalSize
    ? toPixelCrop(rect, naturalSize.width, naturalSize.height)
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center justify-center bg-slate-100/90 p-4">
        <p className="mb-3 w-full text-xs text-slate-600">
          Kéo thả trực tiếp trên ảnh để khoanh vùng chữ cần dịch, hoặc kéo 4 góc để điều chỉnh.
        </p>

        <div
          ref={stageRef}
          data-testid="crop-stage"
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerUp}
          className="relative inline-block max-w-full cursor-crosshair select-none overflow-hidden rounded-lg border border-slate-300 bg-white touch-none"
        >
          <img
            src={imageDataUrl}
            alt="Ảnh gốc đang chọn vùng cắt"
            draggable={false}
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            className="block max-h-[440px] max-w-full object-contain pointer-events-none"
          />

          {/* Interactive crop selection box with dimmed exterior mask */}
          <div
            data-testid="crop-selection"
            role="application"
            tabIndex={0}
            aria-label="Khung chọn vùng ảnh. Dùng phím mũi tên để di chuyển hoặc Shift kết hợp mũi tên để đổi kích thước."
            onPointerDown={handleSelectionPointerDown}
            onKeyDown={handleSelectionKeyDown}
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
            }}
            className="absolute cursor-move border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            {/* Subtle rule-of-thirds guide lines */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/35" />
              <div className="border-r border-b border-white/35" />
              <div className="border-b border-white/35" />
              <div className="border-r border-b border-white/35" />
              <div className="border-r border-b border-white/35" />
              <div className="border-b border-white/35" />
              <div className="border-r border-white/35" />
              <div className="border-r border-white/35" />
              <div />
            </div>

            {HANDLES.map((handle) => (
              <button
                key={handle.id}
                type="button"
                aria-label={handle.label}
                onPointerDown={(e) => handleResizePointerDown(handle.id, e)}
                className={`absolute ${handle.positionClass} ${handle.cursorClass} h-4 w-4 rounded-xs border-2 border-blue-700 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600`}
              />
            ))}
          </div>
        </div>

        {/* Live pixel dimensions readout + select all shortcut */}
        <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="font-mono tabular-nums" data-testid="crop-dimensions">
            {pixelCrop
              ? `Vùng chọn: ${pixelCrop.sw} × ${pixelCrop.sh} px`
              : 'Đang tính kích thước vùng chọn...'}
          </span>
          <button
            type="button"
            onClick={() => setRect({ x: 0, y: 0, width: 1, height: 1 })}
            className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Chọn toàn ảnh</span>
          </button>
        </div>
      </div>

      {/* Crop Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Hủy</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onApplyCrop(rect, false)}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <Crop className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Áp dụng vùng cắt</span>
          </button>
          <button
            type="button"
            onClick={() => onApplyCrop(rect, true)}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dịch vùng đã chọn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
