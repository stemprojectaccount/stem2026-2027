import React, { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, RefreshCw, Share2, Loader2, Smartphone, AlertCircle, ImageIcon } from "lucide-react";
import { buildPublicLessonUrl } from "../lib/shareLink";

export interface LessonQRCodeProps {
  lessonId: string;
  lessonTitle: string;
  bookName?: string;
  grade?: string;
  shareUrl?: string;
  markerTag?: string;
  isDark?: boolean;
  compact?: boolean;
  defaultShowLogo?: boolean;
  onCopySuccess?: (url: string) => void;
  onDownloadSuccess?: () => void;
}

const toLessonSlug = (text: string): string => {
  return (
    String(text || "bai-hoc")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28) || "bai-hoc"
  );
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

/**
 * Draws the EduQuest emblem badge in the center of a QR code canvas.
 * Uses a white quiet-zone cushion around a sky-to-indigo gradient badge with
 * the EduQuest graduation cap + golden star icon so QR scanners read it cleanly.
 */
const drawEduQuestCenterLogo = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  badgeSize: number
) => {
  ctx.save();

  const pad = Math.max(4, Math.round(badgeSize * 0.12));
  const outerSize = badgeSize + pad * 2;
  const outerX = centerX - outerSize / 2;
  const outerY = centerY - outerSize / 2;
  const outerRadius = Math.round(outerSize * 0.26);

  // 1. Crisp white quiet-zone backing with subtle shadow
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.16)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  drawRoundedRect(ctx, outerX, outerY, outerSize, outerSize, outerRadius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  drawRoundedRect(ctx, outerX, outerY, outerSize, outerSize, outerRadius);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#bae6fd";
  ctx.stroke();

  // 2. Inner EduQuest brand gradient tile
  const innerX = centerX - badgeSize / 2;
  const innerY = centerY - badgeSize / 2;
  const innerRadius = Math.round(badgeSize * 0.24);
  const grad = ctx.createLinearGradient(
    innerX,
    innerY,
    innerX + badgeSize,
    innerY + badgeSize
  );
  grad.addColorStop(0, "#0284c7");
  grad.addColorStop(0.55, "#2563eb");
  grad.addColorStop(1, "#4f46e5");

  drawRoundedRect(ctx, innerX, innerY, badgeSize, badgeSize, innerRadius);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle inner highlight border
  drawRoundedRect(
    ctx,
    innerX + 1.5,
    innerY + 1.5,
    badgeSize - 3,
    badgeSize - 3,
    Math.max(4, innerRadius - 1.5)
  );
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.stroke();

  // 3. Draw Graduation Cap / Book Emblem + Sparkle inside the badge
  const capY = centerY - badgeSize * 0.08;
  const capW = badgeSize * 0.56;
  const capH = badgeSize * 0.26;

  // Mortarboard diamond top
  ctx.beginPath();
  ctx.moveTo(centerX, capY - capH / 2);
  ctx.lineTo(centerX + capW / 2, capY);
  ctx.lineTo(centerX, capY + capH / 2);
  ctx.lineTo(centerX - capW / 2, capY);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Cap skull base
  const baseW = capW * 0.54;
  const baseH = badgeSize * 0.14;
  ctx.beginPath();
  ctx.moveTo(centerX - baseW / 2, capY + capH * 0.18);
  ctx.lineTo(centerX - baseW / 2, capY + capH * 0.18 + baseH);
  ctx.quadraticCurveTo(
    centerX,
    capY + capH * 0.18 + baseH + badgeSize * 0.06,
    centerX + baseW / 2,
    capY + capH * 0.18 + baseH
  );
  ctx.lineTo(centerX + baseW / 2, capY + capH * 0.18);
  ctx.closePath();
  ctx.fillStyle = "#e0f2fe";
  ctx.fill();

  // Golden tassel on the right
  ctx.beginPath();
  ctx.moveTo(centerX + capW * 0.34, capY + capH * 0.1);
  ctx.lineTo(centerX + capW * 0.34, capY + capH * 0.65);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = Math.max(1.5, badgeSize * 0.045);
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    centerX + capW * 0.34,
    capY + capH * 0.7,
    Math.max(1.8, badgeSize * 0.045),
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#fbbf24";
  ctx.fill();

  // "EDUQUEST" mini label at bottom of badge
  const fontSize = Math.max(7, Math.round(badgeSize * 0.16));
  ctx.font = `900 ${fontSize}px "Be Vietnam Pro", system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EDU", centerX, centerY + badgeSize * 0.29);

  ctx.restore();
};

const composeQrWithOptionalLogo = async (
  rawQrDataUrl: string,
  withLogo: boolean,
  size: number = 320
): Promise<string> => {
  if (!withLogo || typeof document === "undefined") {
    return rawQrDataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawQrDataUrl;

  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = rawQrDataUrl;
  });

  ctx.drawImage(qrImg, 0, 0, size, size);

  // Keep logo ~20% of QR width so High (H = 30%) error correction scans effortlessly
  const badgeSize = Math.round(size * 0.21);
  drawEduQuestCenterLogo(ctx, size / 2, size / 2, badgeSize);

  return canvas.toDataURL("image/png");
};

const wrapCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] => {
  const words = String(text || "").trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        const remaining = [currentLine, ...words.slice(i + 1)].join(" ");
        let truncated = remaining;
        while (
          truncated.length > 1 &&
          ctx.measureText(`${truncated}…`).width > maxWidth
        ) {
          truncated = truncated.slice(0, -1).trim();
        }
        lines.push(
          truncated.length < remaining.length ? `${truncated}…` : truncated
        );
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.slice(0, maxLines);
};

export const LessonQRCode: React.FC<LessonQRCodeProps> = ({
  lessonId,
  lessonTitle,
  bookName,
  grade,
  shareUrl: shareUrlProp,
  markerTag: markerTagProp,
  isDark = false,
  compact = false,
  defaultShowLogo = true,
  onCopySuccess,
  onDownloadSuccess,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadedPng, setDownloadedPng] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [showLogoOverlay, setShowLogoOverlay] = useState<boolean>(defaultShowLogo);

  const computeDeepLink = useCallback((): {
    valid: boolean;
    url: string;
    tag: string;
    reason?: string;
  } => {
    const rawId = String(lessonId || "").trim();
    const cleanId = rawId.replace(/^lesson-/, "");
    const normalizedId = cleanId ? `lesson-${cleanId}` : "lesson-1";
    const slug = toLessonSlug(lessonTitle);
    const computedTag =
      markerTagProp || (slug ? `${normalizedId}-${slug}` : normalizedId);

    if (shareUrlProp && shareUrlProp.trim()) {
      const candidate = shareUrlProp.trim();
      if (
        candidate.startsWith("http://") ||
        candidate.startsWith("https://")
      ) {
        return { valid: true, url: candidate, tag: computedTag };
      }
      return {
        valid: false,
        url: "",
        tag: computedTag,
        reason: "Liên kết chia sẻ không đúng định dạng http/https.",
      };
    }

    if (!cleanId) {
      return {
        valid: false,
        url: "",
        tag: computedTag,
        reason: "Bài học chưa có mã định danh hợp lệ để tạo mã QR.",
      };
    }

    const finalUrl = buildPublicLessonUrl(cleanId, computedTag);
    return { valid: true, url: finalUrl, tag: computedTag };
  }, [lessonId, lessonTitle, shareUrlProp, markerTagProp]);

  const {
    valid: isValidUrl,
    url: resolvedShareUrl,
    tag: resolvedMarkerTag,
    reason: invalidReason,
  } = computeDeepLink();

  const generateQrCode = useCallback(async () => {
    if (!isValidUrl || !resolvedShareUrl) {
      setQrDataUrl("");
      setLoading(false);
      setError(invalidReason || "Không thể tạo liên kết bài học hợp lệ.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rawUrl = await QRCode.toDataURL(resolvedShareUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: showLogoOverlay ? "H" : "M",
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      const finalUrl = await composeQrWithOptionalLogo(
        rawUrl,
        showLogoOverlay,
        320
      );
      setQrDataUrl(finalUrl);
      setLoading(false);
    } catch {
      setQrDataUrl("");
      setLoading(false);
      setError(
        "Không thể tạo mã QR cho liên kết này. Em hãy nhấn thử lại hoặc sao chép liên kết nhé."
      );
    }
  }, [isValidUrl, resolvedShareUrl, invalidReason, showLogoOverlay]);

  useEffect(() => {
    let active = true;
    setCopiedLink(false);
    setDownloadedPng(false);

    if (!isValidUrl || !resolvedShareUrl) {
      setQrDataUrl("");
      setLoading(false);
      setError(invalidReason || "Không thể tạo liên kết bài học hợp lệ.");
      return;
    }

    setLoading(true);
    setError(null);

    QRCode.toDataURL(resolvedShareUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: showLogoOverlay ? "H" : "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((rawUrl) =>
        composeQrWithOptionalLogo(rawUrl, showLogoOverlay, 320)
      )
      .then((finalUrl) => {
        if (!active) return;
        setQrDataUrl(finalUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setQrDataUrl("");
        setLoading(false);
        setError(
          "Không thể tạo mã QR cho liên kết này. Em hãy nhấn thử lại hoặc sao chép liên kết nhé."
        );
      });

    return () => {
      active = false;
    };
  }, [isValidUrl, resolvedShareUrl, invalidReason, showLogoOverlay]);

  const handleCopyLink = async () => {
    if (!resolvedShareUrl) return;
    let copied = false;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(resolvedShareUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied && typeof document !== "undefined") {
      try {
        const tempInput = document.createElement("textarea");
        tempInput.value = resolvedShareUrl;
        tempInput.setAttribute("readonly", "");
        tempInput.style.position = "fixed";
        tempInput.style.top = "-9999px";
        tempInput.style.left = "-9999px";
        document.body.appendChild(tempInput);
        tempInput.focus();
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        copied = true;
      } catch {
        // Ignore fallback error in strict iframe sandbox
      }
    }

    setCopiedLink(true);
    onCopySuccess?.(resolvedShareUrl);
    window.setTimeout(() => {
      setCopiedLink(false);
    }, 2200);
  };

  const handleDownloadStyledPng = async () => {
    if (!qrDataUrl || isExportingPng) return;
    setIsExportingPng(true);

    try {
      const canvas = document.createElement("canvas");
      const width = 640;
      const height = 780;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context unavailable");
      }

      // 1. Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#f0f9ff");
      bgGrad.addColorStop(0.5, "#eef2ff");
      bgGrad.addColorStop(1, "#e0e7ff");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Main card container
      const cardX = 32;
      const cardY = 32;
      const cardW = width - 64;
      const cardH = height - 64;

      ctx.save();
      ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();

      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#bae6fd";
      ctx.stroke();

      // 3. Top Header Banner inside Card
      const headerGrad = ctx.createLinearGradient(
        cardX,
        cardY,
        cardX + cardW,
        cardY + 92
      );
      headerGrad.addColorStop(0, "#0284c7");
      headerGrad.addColorStop(1, "#4f46e5");
      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, 92, 32);
      ctx.clip();
      ctx.fillStyle = headerGrad;
      ctx.fillRect(cardX, cardY, cardW, 92);
      ctx.restore();

      // Brand Title & Tag in Header
      ctx.font = '800 15px "Be Vietnam Pro", system-ui, -apple-system, sans-serif';
      ctx.fillStyle = "#e0f2fe";
      ctx.textAlign = "left";
      ctx.fillText(
        "SmartStudy · Thẻ mã QR bài học",
        cardX + 28,
        cardY + 38
      );

      const shortTag = `#${
        resolvedMarkerTag.length > 30
          ? `${resolvedMarkerTag.slice(0, 30)}…`
          : resolvedMarkerTag
      }`;
      ctx.font = '700 14px ui-monospace, "SF Mono", Consolas, monospace';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(shortTag, cardX + 28, cardY + 66);

      // 4. Lesson Title (Wrapped up to 2 lines)
      ctx.fillStyle = "#0f172a";
      ctx.font = '800 24px "Be Vietnam Pro", system-ui, -apple-system, sans-serif';
      ctx.textAlign = "center";
      const titleLines = wrapCanvasText(
        ctx,
        lessonTitle || "Bài học SmartStudy",
        cardW - 64,
        2
      );
      let currentY = cardY + 140;
      titleLines.forEach((line) => {
        ctx.fillText(line, width / 2, currentY);
        currentY += 32;
      });

      // 5. Book Name & Grade metadata pill
      const gradeFormatted = grade
        ? grade.startsWith("Lớp")
          ? grade
          : `Lớp ${grade}`
        : "Lớp 6";
      const metaLabel = [bookName, gradeFormatted].filter(Boolean).join("  •  ");
      if (metaLabel) {
        ctx.font = '700 15px "Be Vietnam Pro", system-ui, -apple-system, sans-serif';
        const pillPaddingX = 18;
        const textWidth = ctx.measureText(metaLabel).width;
        const pillW = Math.min(cardW - 64, textWidth + pillPaddingX * 2);
        const pillX = (width - pillW) / 2;
        const pillY = currentY - 8;

        drawRoundedRect(ctx, pillX, pillY, pillW, 34, 17);
        ctx.fillStyle = "#f0f9ff";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#bae6fd";
        ctx.stroke();

        ctx.fillStyle = "#0369a1";
        ctx.fillText(metaLabel, width / 2, pillY + 22);
        currentY = pillY + 56;
      } else {
        currentY += 16;
      }

      // 6. QR Code Frame & Image (already includes EduQuest logo if showLogoOverlay is true)
      const qrBoxSize = 330;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = currentY;

      drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#c7d2fe";
      ctx.stroke();

      const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = qrDataUrl;
      });

      ctx.drawImage(
        qrImg,
        qrBoxX + 18,
        qrBoxY + 18,
        qrBoxSize - 36,
        qrBoxSize - 36
      );

      // 7. Footer instructions & short URL
      const footerY = qrBoxY + qrBoxSize + 36;
      ctx.font = '700 15px "Be Vietnam Pro", system-ui, -apple-system, sans-serif';
      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText(
        "Quét mã QR bằng Camera hoặc Zalo để mở trực tiếp bài học trên điện thoại",
        width / 2,
        footerY
      );

      const cleanUrlPreview =
        resolvedShareUrl.length > 68
          ? `${resolvedShareUrl.slice(0, 65)}...`
          : resolvedShareUrl;
      ctx.font = '600 12px ui-monospace, "SF Mono", Consolas, monospace';
      ctx.fillStyle = "#64748b";
      ctx.fillText(cleanUrlPreview, width / 2, footerY + 26);

      const finalPngUrl = canvas.toDataURL("image/png");
      const safeId = String(lessonId || "bai-hoc").replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      );
      const linkEl = document.createElement("a");
      linkEl.href = finalPngUrl;
      linkEl.download = `qr-bai-hoc-${safeId}.png`;
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);

      setDownloadedPng(true);
      onDownloadSuccess?.();
      window.setTimeout(() => {
        setDownloadedPng(false);
      }, 2400);
    } catch {
      try {
        const safeId = String(lessonId || "bai-hoc").replace(
          /[^a-zA-Z0-9_-]/g,
          "-"
        );
        const linkEl = document.createElement("a");
        linkEl.href = qrDataUrl;
        linkEl.download = `qr-bai-hoc-${safeId}.png`;
        document.body.appendChild(linkEl);
        linkEl.click();
        document.body.removeChild(linkEl);
        setDownloadedPng(true);
        onDownloadSuccess?.();
        window.setTimeout(() => {
          setDownloadedPng(false);
        }, 2400);
      } catch {
        // Ignore download failure
      }
    } finally {
      setIsExportingPng(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2.5">
        {/* Compact QR & Quick Actions Row */}
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-3 shadow-2xs ${
            isDark
              ? "bg-slate-900/90 border-slate-800 text-slate-100"
              : "bg-white border-sky-200/90 text-slate-900"
          }`}
        >
          <div className="w-[108px] h-[108px] rounded-xl border-2 border-sky-200 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-bold text-slate-500">
                  Đang tạo QR...
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-1 text-center p-1">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-[9px] font-bold text-rose-600 leading-tight line-clamp-2">
                  Lỗi tạo QR
                </span>
                <button
                  type="button"
                  onClick={generateQrCode}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Mã QR mở bài học ${lessonTitle}`}
                width={94}
                height={94}
                className="w-[94px] h-[94px] object-contain select-none"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span
                  className={`text-[11px] font-extrabold truncate ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Quét mã QR trên điện thoại
                </span>
              </div>
            </div>

            {/* Toggle EduQuest Center Logo Overlay */}
            <button
              type="button"
              role="switch"
              aria-checked={showLogoOverlay}
              onClick={() => setShowLogoOverlay((prev) => !prev)}
              className={`w-full px-2 py-1 rounded-lg border text-[10px] font-extrabold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                showLogoOverlay
                  ? isDark
                    ? "bg-indigo-950/80 border-indigo-600/80 text-indigo-200"
                    : "bg-indigo-50/90 border-indigo-200 text-indigo-800"
                  : isDark
                  ? "bg-slate-800 border-slate-700 text-slate-300"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span className="inline-flex items-center gap-1 truncate">
                <ImageIcon className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate">Logo SmartStudy giữa QR</span>
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                  showLogoOverlay
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {showLogoOverlay ? "Bật" : "Tắt"}
              </span>
            </button>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <button
                type="button"
                disabled={!qrDataUrl || loading || isExportingPng}
                onClick={handleDownloadStyledPng}
                className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[10px] font-extrabold border inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  downloadedPng
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                }`}
              >
                <Download className="w-3 h-3" />
                <span>
                  {downloadedPng ? "Đã tải PNG ✓" : "Tải thẻ QR (.png)"}
                </span>
              </button>

              <button
                type="button"
                disabled={!resolvedShareUrl}
                onClick={handleCopyLink}
                className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[10px] font-extrabold border inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 ${
                  copiedLink
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200"
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Đã chép ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Share URL Input Row */}
        {resolvedShareUrl && (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={resolvedShareUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Liên kết chia sẻ bài học"
              className={`min-w-0 flex-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono focus:outline-none ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-slate-200"
                  : "bg-sky-50/90 border-sky-200 text-slate-700"
              }`}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold shadow-xs cursor-pointer shrink-0 transition-all inline-flex items-center gap-1 ${
                copiedLink
                  ? "bg-emerald-600 text-white"
                  : "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Đã chép ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Lesson Badge & Metadata */}
      <div
        className={`px-3 py-2 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
          isDark
            ? "bg-slate-950/80 border-slate-800"
            : "bg-sky-50/80 border-sky-200/80"
        }`}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black tracking-wide num shrink-0 max-w-[190px] truncate">
          #{resolvedMarkerTag}
        </span>
        <span
          className={`text-[11px] font-bold truncate ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {bookName ? `${bookName} · ` : ""}
          {grade?.startsWith("Lớp") ? grade : `Lớp ${grade || "6"}`}
        </span>
      </div>

      {/* Dynamic QR Code Display on Crisp White Quiet-Zone Pad */}
      <div className="flex flex-col items-center justify-center">
        <div className="bg-white p-3.5 rounded-2xl border-2 border-sky-200 shadow-sm flex flex-col items-center justify-center min-w-[208px] min-h-[208px]">
          {loading ? (
            <div className="w-[184px] h-[184px] flex flex-col items-center justify-center gap-2 text-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-[11px] font-bold text-slate-600">
                Đang tạo mã QR bài học...
              </span>
            </div>
          ) : error ? (
            <div className="w-[184px] h-[184px] flex flex-col items-center justify-center gap-2.5 text-center p-2">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 leading-snug">
                {error}
              </span>
              <button
                type="button"
                onClick={generateQrCode}
                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử tạo lại</span>
              </button>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Mã QR mở bài học ${lessonTitle}`}
              width={184}
              height={184}
              className="w-[184px] h-[184px] object-contain rounded-lg select-none"
            />
          ) : null}
        </div>

        {/* Toggle EduQuest Logo Overlay Switch */}
        <div className="mt-2.5 w-full flex items-center justify-center">
          <button
            type="button"
            role="switch"
            aria-checked={showLogoOverlay}
            onClick={() => setShowLogoOverlay((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer ${
              showLogoOverlay
                ? isDark
                  ? "bg-indigo-950/80 border-indigo-500/70 text-indigo-200 shadow-2xs"
                  : "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs"
                : isDark
                ? "bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-800"
                : "bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <ImageIcon className="w-2.5 h-2.5" />
            </span>
            <span>Hiển thị logo SmartStudy ở giữa QR</span>
            <span
              className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                showLogoOverlay
                  ? "bg-indigo-600 justify-end"
                  : isDark
                  ? "bg-slate-600 justify-start"
                  : "bg-slate-300 justify-start"
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
            </span>
          </button>
        </div>

        <p
          className={`mt-2 text-[11px] font-semibold text-center ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          Mở camera điện thoại hoặc Zalo để quét mã và đọc tiếp bài học ngay trên di động
        </p>
      </div>

      {/* Share URL Input & Copy Link Button */}
      {resolvedShareUrl && (
        <div className="space-y-1.5">
          <label
            htmlFor="lesson-qr-share-url-input"
            className={`text-[10px] font-extrabold uppercase tracking-wider block ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Liên kết bài học trực tiếp:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="lesson-qr-share-url-input"
              type="text"
              readOnly
              value={resolvedShareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className={`min-w-0 flex-1 px-3 py-2 rounded-xl border text-[11px] font-mono focus:outline-none ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-slate-200"
                  : "bg-slate-50 border-sky-200 text-slate-700"
              }`}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Sao chép liên kết bài học"
              className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copiedLink
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Buttons: Download Styled PNG Card & Native Share */}
      <div className="pt-1 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!qrDataUrl || loading || isExportingPng}
          onClick={handleDownloadStyledPng}
          aria-label="Tải thẻ mã QR định dạng PNG"
          className={`flex-1 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            downloadedPng
              ? "bg-emerald-600 text-white border-emerald-700"
              : isDark
              ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
              : "bg-sky-50 hover:bg-sky-100 text-sky-950 border-sky-200"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>
            {downloadedPng
              ? "Đã tải thẻ QR (.png) ✓"
              : isExportingPng
              ? "Đang xuất thẻ PNG..."
              : "Tải thẻ QR (.png)"}
          </span>
        </button>

        {typeof navigator !== "undefined" &&
          typeof navigator.share === "function" &&
          resolvedShareUrl && (
            <button
              type="button"
              onClick={() => {
                navigator
                  .share({
                    title: lessonTitle,
                    text: `Ôn tập bài học "${lessonTitle}" trên SmartStudy:`,
                    url: resolvedShareUrl,
                  })
                  .catch(() => {});
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? "bg-indigo-950/70 hover:bg-indigo-900 border-indigo-700 text-indigo-200"
                  : "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ nhanh</span>
            </button>
          )}
      </div>
    </div>
  );
};

export default LessonQRCode;
