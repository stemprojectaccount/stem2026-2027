import React from "react";
import {
  Calculator,
  Languages,
  Grid,
  FlaskConical,
  Folder,
} from "lucide-react";
import {
  GameArtTheme,
  GameBadgeType,
  GameFolder,
} from "../games/types";

/**
 * ============================================================================
 * GAME COVER ARTWORK & BADGE HELPERS
 * ----------------------------------------------------------------------------
 * Tách riêng phần minh hoạ thẻ game 16:9 (SVG Cover Artwork) và icon chuyên đề
 * giúp GameHub.tsx gọn gàng, dễ tìm kiếm và bảo trì.
 * ============================================================================
 */

export function renderFolderIcon(iconName: GameFolder["iconName"], className = "w-4 h-4") {
  switch (iconName) {
    case "calculator":
      return <Calculator className={className} />;
    case "languages":
      return <Languages className={className} />;
    case "grid":
      return <Grid className={className} />;
    case "flask":
      return <FlaskConical className={className} />;
    default:
      return <Folder className={className} />;
  }
}

export function getModeBadgeStyle(badge: GameBadgeType) {
  switch (badge) {
    case "Action Roguelike":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "Team Battle":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Strategy":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Speed":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Memory":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Sandbox":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * Covers designed from real in-game screenshots (public/game-covers, 1280×800 WebP).
 * Themes listed here use the image; the others keep their SVG artwork below.
 */
const SCREENSHOT_COVERS: Partial<Record<GameArtTheme, { src: string; alt: string }>> = {
  "english-pop": { src: "/game-covers/english-pop.webp", alt: "Bóng bay chứa câu hỏi từ vựng đang rơi trong English Pop và Learn" },
  "su-ca": { src: "/game-covers/su-ca.webp", alt: "Xúc xắc và câu hỏi Lịch sử trong Sử Ca" },
  "pixel-vanguard": { src: "/game-covers/pixel-vanguard.webp", alt: "Logo Pixel Vanguard, hầm ngục và 10 chiến binh có thể chọn" },
  "ink-siege": { src: "/game-covers/ink-siege.webp", alt: "Thủ thư Nib chiến đấu với quái mực trong Ink Siege" },
  "pool-party": { src: "/game-covers/pool-party.webp", alt: "Bạn nhỏ bật nhảy khỏi cầu sau câu trả lời đúng trong Pool Party Dive" },
  "lucky-claw": { src: "/game-covers/lucky-claw.webp", alt: "Cần gắp nhấc viên nang đáp án đúng trong máy gắp Lucky Claw" },
  "tower-defense": { src: "/game-covers/tower-defense.webp", alt: "Bản đồ có ba Tháp Cung chặn quái Lú Lẫn trong Tháp Canh Tri Thức" },
  "pirate-treasure": { src: "/game-covers/pirate-treasure.webp", alt: "Bản đồ 25 rương gỗ, bạc, vàng trên đảo trong Pirate Island Raid" },
  "fox-academy": { src: "/game-covers/fox-academy.webp", alt: "Giáo sư Cáo đọc từ, bảng chọn từ và phiên âm trong Học Viện Cáo" },
  "dragon-kingdom": { src: "/game-covers/dragon-kingdom.webp", alt: "Bản đồ Việt Nam với địa danh Lam Sơn trong Thành Trì Rồng Lửa" },
};

export function GameCoverArtwork({
  theme,
  title,
  vietnameseTitle,
  isPro,
}: {
  theme: GameArtTheme;
  title: string;
  vietnameseTitle: string;
  isPro?: boolean;
}) {
  const shot = SCREENSHOT_COVERS[theme];
  if (shot) {
    return (
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-900 select-none">
        <img
          src={shot.src}
          alt={shot.alt}
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* the cover image already carries the game's own title, so no name badge here */}
      </div>
    );
  }

  switch (theme) {
    case "home-run":
      return (
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-b from-[#1e3a8a] via-[#3b82f6] to-[#15803d] select-none">
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover" aria-hidden="true">
            <rect width="400" height="250" fill="#1e40af" />
            <ellipse cx="200" cy="230" rx="220" ry="85" fill="#22c55e" />
            <ellipse cx="200" cy="235" rx="140" ry="50" fill="#d97706" opacity="0.85" />
            <g transform="translate(55, 58)">
              <rect x="18" y="30" width="56" height="52" rx="14" fill="#38bdf8" stroke="#0369a1" strokeWidth="3" />
              <rect x="26" y="40" width="40" height="24" rx="6" fill="#0f172a" />
              <circle cx="38" cy="52" r="5" fill="#facc15" />
              <circle cx="54" cy="52" r="5" fill="#facc15" />
              <line x1="72" y1="68" x2="155" y2="28" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
            </g>
            <path d="M190 95 Q245 75 305 110" fill="none" stroke="#fef08a" strokeWidth="4" strokeDasharray="6 4" />
            <circle cx="310" cy="112" r="15" fill="#ffffff" stroke="#ef4444" strokeWidth="2.5" />
            <rect x="185" y="18" width="185" height="50" rx="12" fill="#0f172a" fillOpacity="0.8" stroke="#facc15" strokeWidth="2.5" />
            <text x="277" y="40" textAnchor="middle" fill="#fde047" fontSize="15" fontWeight="900">HOME RUN</text>
            <text x="277" y="58" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">RALLY</text>
          </svg>
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/60 backdrop-blur-xs text-white text-[10px] font-black tracking-wide uppercase border border-white/20">
            {vietnameseTitle}
          </div>
        </div>
      );

    default:
      return (
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#312e81] via-[#4338ca] to-[#0284c7] select-none">
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover" aria-hidden="true">
            <rect width="400" height="250" fill="#312e81" />
            <circle cx="90" cy="70" r="4" fill="#fde047" />
            <circle cx="320" cy="55" r="3" fill="#38bdf8" />
            <circle cx="200" cy="125" r="52" fill="#6366f1" stroke="#a5b4fc" strokeWidth="4" />
            <text x="200" y="132" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="900">DEV LAB</text>
          </svg>
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/60 backdrop-blur-xs text-white text-[10px] font-black tracking-wide uppercase border border-white/20">
            {title}
          </div>
        </div>
      );
  }
}
