import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface CropRect {
  x: number; // % from left (0-100)
  y: number; // % from top (0-100)
  w: number; // % width (0-100)
  h: number; // % height (0-100)
}

/** Parse position string → CropRect or null (for legacy formats) */
export function parseCropPosition(position?: string): CropRect | null {
  if (!position) return null;
  try {
    const parsed = JSON.parse(position);
    if (
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      typeof parsed.w === 'number' &&
      typeof parsed.h === 'number'
    ) {
      return parsed as CropRect;
    }
  } catch {
    // Not JSON — legacy format like "center", "top", "50% 50%"
  }
  return null;
}

/** Convert position string → CSS style for displaying cropped image */
export function cropPositionToStyle(position?: string): React.CSSProperties {
  const crop = parseCropPosition(position);
  if (crop) {
    const top = crop.y;
    const right = 100 - crop.x - crop.w;
    const bottom = 100 - crop.y - crop.h;
    const left = crop.x;
    // object-view-box crops the image before object-fit is applied
    return {
      objectFit: 'cover',
      objectViewBox: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
    } as React.CSSProperties;
  }
  // Legacy fallback
  return {
    objectFit: 'cover' as const,
    objectPosition: position || 'center',
  };
}

interface CropSelectorProps {
  imageUrl: string;
  crop: CropRect | null;
  onChange: (crop: CropRect) => void;
}

type DragMode = 'none' | 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se';

export const CropSelector: React.FC<CropSelectorProps> = ({
  imageUrl,
  crop,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [imgRatio, setImgRatio] = useState(1); // naturalWidth / naturalHeight
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    crop: null as CropRect | null,
    mode: 'none' as DragMode,
  });

  const getPos = useCallback((e: MouseEvent | React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  // Constraint: crop pixel height <= crop pixel width * 2/3
  // In percentages: h * imgH <= w * imgW * 2/3  →  h <= w * (imgW/imgH) * 2/3  →  h <= w * imgRatio * 2/3
  const clamp = useCallback(
    (c: CropRect): CropRect => {
      let { x, y, w, h } = c;
      w = Math.max(10, Math.min(100, w));
      const maxH = Math.min(100, w * imgRatio * (2 / 3));
      h = Math.max(5, Math.min(maxH, h));
      x = Math.max(0, Math.min(100 - w, x));
      y = Math.max(0, Math.min(100 - h, y));
      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        w: Math.round(w * 10) / 10,
        h: Math.round(h * 10) / 10,
      };
    },
    [imgRatio]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const pos = getPos(e);
    const tolerance = 4;

    if (crop) {
      // Check corner handles
      const corners: { mode: DragMode; cx: number; cy: number }[] = [
        { mode: 'nw', cx: crop.x, cy: crop.y },
        { mode: 'ne', cx: crop.x + crop.w, cy: crop.y },
        { mode: 'sw', cx: crop.x, cy: crop.y + crop.h },
        { mode: 'se', cx: crop.x + crop.w, cy: crop.y + crop.h },
      ];
      for (const c of corners) {
        if (Math.abs(pos.x - c.cx) < tolerance && Math.abs(pos.y - c.cy) < tolerance) {
          dragRef.current = { startX: pos.x, startY: pos.y, crop: { ...crop }, mode: c.mode };
          setDragMode(c.mode);
          return;
        }
      }
      // Check inside → move
      if (pos.x > crop.x && pos.x < crop.x + crop.w && pos.y > crop.y && pos.y < crop.y + crop.h) {
        dragRef.current = { startX: pos.x, startY: pos.y, crop: { ...crop }, mode: 'move' };
        setDragMode('move');
        return;
      }
    }
    // Draw new crop
    dragRef.current = { startX: pos.x, startY: pos.y, crop: null, mode: 'draw' };
    setDragMode('draw');
  };

  useEffect(() => {
    if (dragMode === 'none') return;

    const onMove = (e: MouseEvent) => {
      const pos = getPos(e);
      const { startX, startY, crop: c0, mode } = dragRef.current;

      if (mode === 'draw') {
        onChange(
          clamp({
            x: Math.min(startX, pos.x),
            y: Math.min(startY, pos.y),
            w: Math.abs(pos.x - startX),
            h: Math.abs(pos.y - startY),
          })
        );
      } else if (mode === 'move' && c0) {
        onChange(
          clamp({
            x: c0.x + (pos.x - startX),
            y: c0.y + (pos.y - startY),
            w: c0.w,
            h: c0.h,
          })
        );
      } else if (c0) {
        // Resize from corner
        let nc: CropRect;
        switch (mode) {
          case 'se':
            nc = { x: c0.x, y: c0.y, w: pos.x - c0.x, h: pos.y - c0.y };
            break;
          case 'sw':
            nc = { x: pos.x, y: c0.y, w: c0.x + c0.w - pos.x, h: pos.y - c0.y };
            break;
          case 'ne':
            nc = { x: c0.x, y: pos.y, w: pos.x - c0.x, h: c0.y + c0.h - pos.y };
            break;
          case 'nw':
            nc = { x: pos.x, y: pos.y, w: c0.x + c0.w - pos.x, h: c0.y + c0.h - pos.y };
            break;
          default:
            return;
        }
        onChange(clamp(nc));
      }
    };

    const onUp = () => setDragMode('none');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragMode, getPos, clamp, onChange]);

  const defaultCrop = clamp({ x: 0, y: 0, w: 100, h: 100 });

  return (
    <div>
      <div className="flex justify-center bg-gray-100 rounded-lg p-2">
        <div
          ref={containerRef}
          className="relative inline-block cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
        >
          <img
            src={imageUrl}
            alt=""
            className="block max-h-[500px] max-w-full"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setImgRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
          />
          {crop && (
            <>
              {/* Dark overlay outside crop */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute bg-black/50"
                  style={{ top: 0, left: 0, right: 0, height: `${crop.y}%` }}
                />
                <div
                  className="absolute bg-black/50"
                  style={{ bottom: 0, left: 0, right: 0, height: `${100 - crop.y - crop.h}%` }}
                />
                <div
                  className="absolute bg-black/50"
                  style={{ top: `${crop.y}%`, left: 0, width: `${crop.x}%`, height: `${crop.h}%` }}
                />
                <div
                  className="absolute bg-black/50"
                  style={{
                    top: `${crop.y}%`,
                    right: 0,
                    width: `${100 - crop.x - crop.w}%`,
                    height: `${crop.h}%`,
                  }}
                />
              </div>
              {/* Crop border + rule-of-thirds grid */}
              <div
                className="absolute border-2 border-white/80 pointer-events-none"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.w}%`,
                  height: `${crop.h}%`,
                }}
              >
                <div className="absolute w-full h-px bg-white/30 top-1/3" />
                <div className="absolute w-full h-px bg-white/30 top-2/3" />
                <div className="absolute h-full w-px bg-white/30 left-1/3" />
                <div className="absolute h-full w-px bg-white/30 left-2/3" />
              </div>
              {/* Corner handles */}
              {[
                { left: `${crop.x}%`, top: `${crop.y}%` },
                { left: `${crop.x + crop.w}%`, top: `${crop.y}%` },
                { left: `${crop.x}%`, top: `${crop.y + crop.h}%` },
                { left: `${crop.x + crop.w}%`, top: `${crop.y + crop.h}%` },
              ].map((style, i) => (
                <div
                  key={i}
                  className="absolute w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-sm pointer-events-none"
                  style={{ ...style, transform: 'translate(-50%, -50%)' }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          {crop
            ? `Zaznaczenie: ${Math.round(crop.w)}% × ${Math.round(crop.h)}%`
            : 'Kliknij i przeciągnij aby zaznaczyć obszar'}
        </span>
        <button
          type="button"
          onClick={() => onChange(defaultCrop)}
          className="text-xs text-amber-600 hover:text-amber-700"
        >
          Resetuj
        </button>
      </div>

      {/* Crop preview */}
      {crop && (
        <div className="mt-2">
          <div className="h-32 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={imageUrl}
              alt="Podgląd"
              className="w-full h-full"
              style={cropPositionToStyle(JSON.stringify(crop))}
            />
          </div>
          <span className="text-xs text-gray-400">Podgląd kadrowania</span>
        </div>
      )}
    </div>
  );
};
