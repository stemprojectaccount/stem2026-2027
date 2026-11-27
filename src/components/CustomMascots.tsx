import React from "react";

// ==========================================
// LOGO EDUPIA - IOE PRO AI (THIẾT KẾ ĐẲNG CẤP)
// ==========================================
export const BrandLogo: React.FC<{ className?: string; size?: number; tagline?: boolean }> = ({ className = "", size = 42, tagline = true }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src="/logo-mark.png"
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{ width: size, height: size }}
        className="rounded-2xl shrink-0 drop-shadow-sm"
      />

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base tracking-tight text-slate-900 font-display leading-none">
            Smart<span className="text-blue-600">Study</span>
          </span>
        </div>
        {tagline && (
          <span className="text-[10px] font-medium text-slate-500 tracking-normal mt-0.5">
            Không gian học tập THCS
          </span>
        )}
      </div>
    </div>
  );
};

// ==========================================
// Ổ KHÓA 3D EDUPIA (TỰ VẼ THAY THẾ EMOJI 🔒)
// ==========================================
export const Edupia3DLock: React.FC<{ locked?: boolean; size?: number; className?: string }> = ({
  locked = true,
  size = 52,
  className = ""
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Ambient glow */}
      <div className={`absolute inset-0 rounded-2xl ${locked ? "bg-amber-200/30" : "bg-emerald-200/30"} blur-md`} />
      
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <linearGradient id="shackleGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="lockBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="keyholeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#431407" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>

        {/* Shackle (Càng khóa 3D kim loại) */}
        {locked ? (
          <path
            d="M26 36 V24 C26 15 32 10 40 10 C48 10 54 15 54 24 V36"
            stroke="url(#shackleGold)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M26 36 V20 C26 13 32 8 40 8 C48 8 54 13 54 20"
            stroke="url(#shackleGold)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        )}

        {/* Thân khóa 3D vát cạnh mềm mại */}
        <rect x="18" y="32" width="44" height="38" rx="12" fill="url(#lockBody)" />
        {/* Điểm nhấn ánh sáng phản chiếu trên mặt khóa */}
        <rect x="22" y="36" width="36" height="10" rx="5" fill="#ffffff" opacity="0.3" />

        {/* Lỗ khóa chìa */}
        <circle cx="40" cy="48" r="4.5" fill="url(#keyholeGrad)" />
        <path d="M38 49 L37 59 H43 L42 49 Z" fill="url(#keyholeGrad)" />
      </svg>
    </div>
  );
};

// ==========================================
// HUY HIỆU ĐỒNG XU TRÍ TUỆ (THAY THẾ EMOJI 🪙)
// ==========================================
export const WisdomCoinIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = "" }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          <linearGradient id="coinFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
        
        {/* Viền ngoài đồng xu */}
        <circle cx="30" cy="30" r="27" fill="url(#coinRim)" />
        <circle cx="30" cy="30" r="23" fill="url(#coinFace)" stroke="#fef9c3" strokeWidth="1.5" />
        
        {/* Ký tự sách / sao tri thức ở giữa */}
        <path
          d="M22 28 C25 25, 28 25, 30 27 C32 25, 35 25, 38 28 V38 C35 36, 32 36, 30 38 C28 36, 25 36, 22 38 Z"
          fill="#ffffff"
          opacity="0.9"
        />
        <circle cx="30" cy="22" r="2.5" fill="#ffffff" />
      </svg>
    </div>
  );
};

// ==========================================
// HỘP QUÀ TRI THỨC 3D (THAY THẾ EMOJI 🎁)
// ==========================================
export const MagicGiftBox: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="giftBox" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="giftRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Nắp hộp quà */}
        <rect x="8" y="16" width="48" height="12" rx="4" fill="url(#giftBox)" />
        <rect x="12" y="28" width="40" height="28" rx="6" fill="url(#giftBox)" opacity="0.9" />

        {/* Ruy băng vàng */}
        <rect x="27" y="16" width="10" height="40" fill="url(#giftRibbon)" />
        <rect x="8" y="20" width="48" height="5" fill="url(#giftRibbon)" opacity="0.5" />

        {/* Nơ trên đỉnh */}
        <ellipse cx="26" cy="12" rx="6" ry="4" fill="url(#giftRibbon)" transform="rotate(-20 26 12)" />
        <ellipse cx="38" cy="12" rx="6" ry="4" fill="url(#giftRibbon)" transform="rotate(20 38 12)" />
        <circle cx="32" cy="14" r="3.5" fill="#fef08a" />
      </svg>
    </div>
  );
};

// =========================================================================
// BỘ LINH THÚ CHIBI HỌC THUẬT & TRANG PHỤC TÙY BIẾN
// =========================================================================

// Gradient & Filter dùng chung cho trang phục
export const MascotOutfitDefs: React.FC = () => (
  <>
    <linearGradient id="cyberVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#06b6d4" />
      <stop offset="50%" stopColor="#3b82f6" />
      <stop offset="100%" stopColor="#ec4899" />
    </linearGradient>
    <linearGradient id="dragonWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f97316" />
      <stop offset="60%" stopColor="#ea580c" />
      <stop offset="100%" stopColor="#9a3412" />
    </linearGradient>
    <linearGradient id="dragonHornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="40%" stopColor="#f59e0b" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
    <linearGradient id="outfitGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="50%" stopColor="#f59e0b" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
    <linearGradient id="wizardHatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#7e22ce" />
      <stop offset="50%" stopColor="#6b21a8" />
      <stop offset="100%" stopColor="#4c1d95" />
    </linearGradient>
  </>
);

// Lớp phụ kiện nền (cánh, áo choàng phía sau)
export const OutfitBackLayer: React.FC<{ outfitId?: string }> = ({ outfitId = "default" }) => {
  if (!outfitId || outfitId === "default") return null;

  switch (outfitId) {
    case "superhero":
      return (
        <g id="outfit-hero-cape">
          <path d="M20 60 C8 72, 10 90, 16 98 C26 95, 30 84, 34 76 Z" fill="#dc2626" />
          <path d="M80 60 C92 72, 90 90, 84 98 C74 95, 70 84, 66 76 Z" fill="#b91c1c" />
        </g>
      );
    case "royal":
      return (
        <g id="outfit-royal-cape-back">
          <path d="M16 62 C10 76, 12 92, 20 97 C28 93, 32 82, 34 74 Z" fill="#991b1b" />
          <path d="M84 62 C90 76, 88 92, 80 97 C72 93, 68 82, 66 74 Z" fill="#7f1d1d" />
        </g>
      );
    case "dragon":
      return (
        <g id="outfit-dragon-back">
          <path d="M22 50 C8 32, 2 48, 6 68 C14 64, 20 58, 24 56 Z" fill="url(#dragonWingGrad)" />
          <path d="M78 50 C92 32, 98 48, 94 68 C86 64, 80 58, 76 56 Z" fill="url(#dragonWingGrad)" />
        </g>
      );
    case "wizard":
      return (
        <g id="outfit-wizard-sparks">
          <circle cx="14" cy="30" r="2" fill="#c084fc" opacity="0.85" />
          <circle cx="86" cy="34" r="2.5" fill="#fef08a" opacity="0.9" />
          <circle cx="18" cy="74" r="2" fill="#38bdf8" opacity="0.85" />
          <circle cx="82" cy="74" r="2" fill="#c084fc" opacity="0.85" />
        </g>
      );
    case "cyber":
      return (
        <g id="outfit-cyber-back">
          <circle cx="50" cy="50" r="45" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 8" fill="none" opacity="0.45" />
        </g>
      );
    default:
      return null;
  }
};

// Lớp phụ kiện mặt trước (mũ, kính, huân chương, giáp)
export const OutfitFrontLayer: React.FC<{ outfitId?: string }> = ({ outfitId = "default" }) => {
  if (!outfitId) return null;

  switch (outfitId) {
    case "default":
      return (
        <g id="outfit-default">
          <path d="M42 74 Q50 78 58 74 L54 84 L50 81 L46 84 Z" fill="#0284c7" />
          <circle cx="50" cy="76" r="2.5" fill="#fef08a" />
        </g>
      );
    case "scholar":
      return (
        <g id="outfit-scholar">
          {/* Mũ cử nhân hàn lâm */}
          <g transform="translate(0, -6)">
            <polygon points="50,10 78,18 50,26 22,18" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
            <rect x="42" y="22" width="16" height="8" rx="2" fill="#0c4a6e" />
            <circle cx="50" cy="18" r="2.5" fill="#f59e0b" />
            <path d="M50 18 Q72 20 72 30" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <circle cx="72" cy="32" r="2.5" fill="#fbbf24" />
          </g>
          {/* Kính tròn tri thức */}
          <g>
            <circle cx="38" cy="48" r="9" stroke="#fbbf24" strokeWidth="2.2" fill="rgba(255,255,255,0.25)" />
            <circle cx="62" cy="48" r="9" stroke="#fbbf24" strokeWidth="2.2" fill="rgba(255,255,255,0.25)" />
            <line x1="47" y1="48" x2="53" y2="48" stroke="#fbbf24" strokeWidth="2.5" />
          </g>
          {/* Nơ học giả */}
          <path d="M40 76 L50 84 L60 76 L55 72 L50 75 L45 72 Z" fill="#0284c7" />
          <circle cx="50" cy="76" r="3" fill="#f59e0b" />
        </g>
      );
    case "detective":
      return (
        <g id="outfit-detective">
          {/* Mũ thám tử Beret dạ */}
          <g transform="translate(0, -4)">
            <ellipse cx="50" cy="24" rx="28" ry="7" fill="#78350f" />
            <path d="M26 22 C26 10, 74 10, 74 22 Z" fill="#b45309" />
            <rect x="25" y="20" width="50" height="4" rx="2" fill="#d97706" />
            <line x1="39" y1="12" x2="39" y2="22" stroke="#78350f" strokeWidth="1.5" />
            <line x1="61" y1="12" x2="61" y2="22" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="50" cy="11" r="2.5" fill="#fef08a" />
          </g>
          {/* Cổ áo măng tô thám tử */}
          <polygon points="36,75 50,85 45,90 32,80" fill="#9a3412" />
          <polygon points="64,75 50,85 55,90 68,80" fill="#9a3412" />
          <circle cx="50" cy="80" r="2.5" fill="#fef08a" />
          {/* Kính lúp cài áo */}
          <g transform="translate(62, 65) scale(0.6)">
            <circle cx="16" cy="16" r="10" stroke="#ca8a04" strokeWidth="3" fill="#e0f2fe" opacity="0.85" />
            <line x1="23" y1="23" x2="34" y2="34" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
            <circle cx="13" cy="13" r="2.5" fill="#ffffff" />
          </g>
        </g>
      );
    case "wizard":
      return (
        <g id="outfit-wizard">
          {/* Mũ phù thủy chóp nhọn sao vàng */}
          <g transform="translate(0, -8)">
            <ellipse cx="50" cy="28" rx="30" ry="7" fill="#581c87" />
            <path d="M28 28 Q46 4 66 2 L50 18 Q56 26 72 28 Z" fill="url(#wizardHatGrad)" />
            <path d="M28 28 Q50 32 72 28 L71 25 Q50 29 29 25 Z" fill="#eab308" />
            <path d="M48 14 Q52 12 52 16 Q50 20 46 18 Q50 17 48 14 Z" fill="#fef08a" />
            <circle cx="66" cy="3" r="2.5" fill="#fef08a" />
          </g>
          {/* Cổ áo choàng sao băng */}
          <path d="M34 74 Q50 82 66 74 L60 84 Q50 88 40 84 Z" fill="#4c1d95" />
          <circle cx="50" cy="78" r="3.5" fill="#fef08a" />
        </g>
      );
    case "cyber":
      return (
        <g id="outfit-cyber">
          {/* Kính VR Visor thực tế ảo phát sáng */}
          <rect x="23" y="41" width="54" height="15" rx="7.5" fill="url(#cyberVisorGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="27" y1="45" x2="73" y2="45" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
          <line x1="31" y1="51" x2="69" y2="51" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="3 3" />
          {/* Tai nghe công nghệ */}
          <rect x="17" y="43" width="7" height="11" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
          <circle cx="20.5" cy="48.5" r="1.5" fill="#22d3ee" />
          <rect x="76" y="43" width="7" height="11" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
          <circle cx="79.5" cy="48.5" r="1.5" fill="#ec4899" />
          {/* Huy hiệu ngực Cyber AI */}
          <polygon points="44,76 56,76 53,84 47,84" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
          <circle cx="50" cy="80" r="2" fill="#22d3ee" />
        </g>
      );
    case "superhero":
      return (
        <g id="outfit-superhero">
          {/* Mặt nạ anh hùng */}
          <path d="M28 45 Q39 39 50 45 Q61 39 72 45 Q70 54 62 55 Q50 49 38 55 Q30 54 28 45 Z" fill="#18181b" />
          <path d="M28 45 Q39 39 50 45 Q61 39 72 45" stroke="#f59e0b" strokeWidth="1" fill="none" />
          {/* Huy hiệu tia chớp quả cảm */}
          <circle cx="50" cy="78" r="8" fill="#18181b" stroke="#facc15" strokeWidth="1.5" />
          <polygon points="51,72 46,78 49,78 48,84 54,77 51,77" fill="#facc15" />
        </g>
      );
    case "royal":
      return (
        <g id="outfit-royal">
          {/* Vương miện hoàng kim */}
          <g transform="translate(0, -6)">
            <polygon points="26,24 32,10 40,18 50,6 60,18 68,10 74,24" fill="url(#outfitGoldGrad)" stroke="#b45309" strokeWidth="1" />
            <rect x="25" y="22" width="50" height="5" rx="2.5" fill="#f59e0b" />
            <circle cx="50" cy="7" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="32" cy="11" r="2.2" fill="#10b981" />
            <circle cx="68" cy="11" r="2.2" fill="#10b981" />
            <circle cx="40" cy="19" r="1.8" fill="#3b82f6" />
            <circle cx="60" cy="19" r="1.8" fill="#3b82f6" />
          </g>
          {/* Cổ áo nhung tuyết */}
          <path d="M30 74 Q50 82 70 74 L68 84 Q50 90 32 84 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="40" cy="80" r="1.2" fill="#1e293b" />
          <circle cx="50" cy="83" r="1.2" fill="#1e293b" />
          <circle cx="60" cy="80" r="1.2" fill="#1e293b" />
          <circle cx="50" cy="76" r="4" fill="#f59e0b" />
          <circle cx="50" cy="76" r="2" fill="#ef4444" />
        </g>
      );
    case "dragon":
      return (
        <g id="outfit-dragon">
          {/* Sừng rồng thần */}
          <g transform="translate(0, -4)">
            <path d="M28 26 C20 12, 18 4, 30 2 C28 10, 32 18, 38 24 Z" fill="url(#dragonHornGrad)" />
            <path d="M72 26 C80 12, 82 4, 70 2 C72 10, 68 18, 62 24 Z" fill="url(#dragonHornGrad)" />
          </g>
          {/* Tâm giáp rồng hỏa ngọc */}
          <polygon points="36,75 50,88 64,75 50,80" fill="#7c2d12" stroke="#ea580c" strokeWidth="1" />
          <circle cx="50" cy="80" r="4" fill="#f97316" />
          <circle cx="50" cy="80" r="2" fill="#fef08a" />
        </g>
      );
    default:
      return null;
  }
};

// 1. Mèo Thông Thái (Mystic Scholar Cat)
export const MascotCat: React.FC<{ size?: number; stage?: number; outfitId?: string; className?: string }> = ({
  size = 64,
  stage = 1,
  outfitId = "default",
  className = ""
}) => {
  const showDefaultStageHat = stage >= 2 && (!outfitId || outfitId === "default");

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Aura nhẹ hòa tan */}
      <div className="absolute inset-0 rounded-full bg-sky-200/40 blur-md transform scale-105" />
      
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <linearGradient id="catBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="60%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id="catHat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <MascotOutfitDefs />
        </defs>

        {/* Lớp nền trang phục (Áo choàng, cánh...) */}
        <OutfitBackLayer outfitId={outfitId} />

        {/* Đôi tai mèo tinh nghịch */}
        <polygon points="20,40 30,15 45,35" fill="url(#catBody)" />
        <polygon points="25,36 32,22 40,34" fill="#fed7aa" />
        <polygon points="80,40 70,15 55,35" fill="url(#catBody)" />
        <polygon points="75,36 68,22 60,34" fill="#fed7aa" />

        {/* Khuôn mặt tròn trĩnh */}
        <circle cx="50" cy="55" r="32" fill="url(#catBody)" />
        <ellipse cx="50" cy="62" rx="16" ry="12" fill="#ffffff" opacity="0.9" />

        {/* Mắt long lanh học trò */}
        <ellipse cx="38" cy="50" rx="4.5" ry="6.5" fill="#1e293b" />
        <circle cx="36" cy="48" r="2" fill="#ffffff" />
        <ellipse cx="62" cy="50" rx="4.5" ry="6.5" fill="#1e293b" />
        <circle cx="60" cy="48" r="2" fill="#ffffff" />

        {/* Má hồng pastel */}
        <circle cx="30" cy="58" r="4" fill="#fb7185" opacity="0.6" />
        <circle cx="70" cy="58" r="4" fill="#fb7185" opacity="0.6" />

        {/* Mũi & Miệng cười */}
        <polygon points="48,56 52,56 50,59" fill="#f43f5e" />
        <path d="M46 62 Q50 66 54 62" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Mũ cử nhân mặc định khi lên cấp (nếu không diện đồ shop) */}
        {showDefaultStageHat && (
          <g transform="translate(32, 10) scale(0.75)">
            <polygon points="24,0 48,12 24,24 0,12" fill="url(#catHat)" />
            <rect x="14" y="16" width="20" height="10" rx="3" fill="#0284c7" />
            <path d="M44 14 Q48 24 46 32" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
            <circle cx="46" cy="34" r="2.5" fill="#fbbf24" />
          </g>
        )}

        {/* Lớp trang phục mặt trước */}
        <OutfitFrontLayer outfitId={outfitId} />
      </svg>
    </div>
  );
};

// 2. Khủng Long Bách Khoa (Cyber Dino)
export const MascotDino: React.FC<{ size?: number; stage?: number; outfitId?: string; className?: string }> = ({
  size = 64,
  stage = 1,
  outfitId = "default",
  className = ""
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-md transform scale-105" />
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <linearGradient id="dinoBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <MascotOutfitDefs />
        </defs>

        {/* Lớp nền trang phục */}
        <OutfitBackLayer outfitId={outfitId} />

        {/* Gai lưng khủng long chibi */}
        <polygon points="28,24 34,14 40,24" fill="#fbbf24" />
        <polygon points="42,18 48,8 54,18" fill="#fbbf24" />
        <polygon points="56,22 62,12 68,22" fill="#fbbf24" />

        {/* Đầu & thân khủng long bầu bĩnh */}
        <path
          d="M30 35 C30 20, 70 20, 72 40 C72 65, 68 80, 50 80 C32 80, 28 65, 30 35 Z"
          fill="url(#dinoBody)"
        />
        {/* Bụng mềm pastel */}
        <ellipse cx="50" cy="62" rx="14" ry="14" fill="#ecfdf5" opacity="0.9" />

        {/* Mắt thông minh */}
        <ellipse cx="42" cy="42" rx="4" ry="5.5" fill="#064e3b" />
        <circle cx="40" cy="40" r="1.5" fill="#ffffff" />
        <ellipse cx="60" cy="42" rx="4" ry="5.5" fill="#064e3b" />
        <circle cx="58" cy="40" r="1.5" fill="#ffffff" />

        {/* Kính mặc định của khủng long nếu không mặc trang phục khác */}
        {(!outfitId || outfitId === "default") && (
          <>
            <circle cx="42" cy="42" r="8" stroke="#38bdf8" strokeWidth="2" fill="none" />
            <circle cx="60" cy="42" r="8" stroke="#38bdf8" strokeWidth="2" fill="none" />
            <line x1="50" y1="42" x2="52" y2="42" stroke="#38bdf8" strokeWidth="2" />
          </>
        )}

        {/* Nụ cười */}
        <path d="M46 54 Q50 58 54 54" stroke="#064e3b" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Lớp trang phục mặt trước */}
        <OutfitFrontLayer outfitId={outfitId} />
      </svg>
    </div>
  );
};

// 3. Cáo Thông Thái (Star Fox)
export const MascotFox: React.FC<{ size?: number; stage?: number; outfitId?: string; className?: string }> = ({
  size = 64,
  stage = 1,
  outfitId = "default",
  className = ""
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 rounded-full bg-amber-200/40 blur-md transform scale-105" />
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <linearGradient id="foxBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <MascotOutfitDefs />
        </defs>

        {/* Lớp nền trang phục */}
        <OutfitBackLayer outfitId={outfitId} />

        {/* Đôi tai cáo vểnh cao */}
        <polygon points="18,46 26,10 46,38" fill="url(#foxBody)" />
        <polygon points="26,36 30,18 40,34" fill="#ffffff" />
        <polygon points="82,46 74,10 54,38" fill="url(#foxBody)" />
        <polygon points="74,36 70,18 60,34" fill="#ffffff" />

        {/* Mặt cáo hình trái xoan tinh anh */}
        <path
          d="M22 48 C22 34, 78 34, 78 48 C78 70, 50 82, 50 82 C50 82, 22 70, 22 48 Z"
          fill="url(#foxBody)"
        />
        {/* Má trắng hai bên */}
        <path d="M24 52 Q38 68 50 80 Q40 60 30 50 Z" fill="#ffffff" />
        <path d="M76 52 Q62 68 50 80 Q60 60 70 50 Z" fill="#ffffff" />

        {/* Mắt cáo sắc sảo lanh lợi */}
        <ellipse cx="38" cy="48" rx="4" ry="5.5" fill="#431407" />
        <circle cx="36" cy="46" r="1.5" fill="#ffffff" />
        <ellipse cx="62" cy="48" rx="4" ry="5.5" fill="#431407" />
        <circle cx="60" cy="46" r="1.5" fill="#ffffff" />

        {/* Mũi đen nhỏ xinh */}
        <circle cx="50" cy="68" r="3" fill="#18181b" />

        {/* Lớp trang phục mặt trước */}
        <OutfitFrontLayer outfitId={outfitId} />
      </svg>
    </div>
  );
};

// 4. Cú Đêm Tri Thức (Grand Owl)
export const MascotOwl: React.FC<{ size?: number; stage?: number; outfitId?: string; className?: string }> = ({
  size = 64,
  stage = 1,
  outfitId = "default",
  className = ""
}) => {
  const showDefaultHat = !outfitId || outfitId === "default";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 rounded-full bg-sky-200/40 blur-md transform scale-105" />
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <linearGradient id="owlBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <MascotOutfitDefs />
        </defs>

        {/* Lớp nền trang phục */}
        <OutfitBackLayer outfitId={outfitId} />

        {/* Thân cú tròn trĩnh */}
        <ellipse cx="50" cy="55" rx="34" ry="32" fill="url(#owlBody)" />
        <ellipse cx="50" cy="64" rx="20" ry="18" fill="#f0f9ff" opacity="0.95" />

        {/* Lông ngực hình vảy cá nhỏ */}
        <path d="M44 60 Q50 64 56 60" stroke="#0284c7" strokeWidth="1.5" fill="none" />
        <path d="M46 66 Q50 70 54 66" stroke="#0284c7" strokeWidth="1.5" fill="none" />

        {/* Đôi mắt to tròn bồ câu đặc trưng */}
        <circle cx="36" cy="44" r="12" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
        <circle cx="36" cy="44" r="6" fill="#0369a1" />
        <circle cx="34" cy="42" r="2.5" fill="#ffffff" />

        <circle cx="64" cy="44" r="12" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
        <circle cx="64" cy="44" r="6" fill="#0369a1" />
        <circle cx="62" cy="42" r="2.5" fill="#ffffff" />

        {/* Mỏ cú nhọn màu vàng cam */}
        <polygon points="46,50 54,50 50,58" fill="#f59e0b" />

        {/* Mũ cử nhân mặc định của cú (chỉ hiển thị nếu không mặc đồ shop) */}
        {showDefaultHat && (
          <>
            <polygon points="50,14 74,22 50,30 26,22" fill="#0f172a" />
            <rect x="42" y="26" width="16" height="8" rx="2" fill="#1e293b" />
            <line x1="68" y1="24" x2="72" y2="34" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="72" cy="36" r="2" fill="#f59e0b" />
          </>
        )}

        {/* Lớp trang phục mặt trước */}
        <OutfitFrontLayer outfitId={outfitId} />
      </svg>
    </div>
  );
};

// ===== Ảnh linh thú 3D (public/mascots) =====
// Thứ tự trùng với AVATAR_EVOLUTIONS: 0 Mèo, 1 Khủng long, 2 Cáo, 3 Gấu, 4 Ngôi sao, 5 Sư tử.
const PET_KEYS = ["cat", "dino", "fox", "bear", "star", "lion"] as const;
const OUTFIT_IDS = new Set(["default", "scholar", "detective", "wizard", "cyber", "superhero", "royal", "dragon"]);
const SHOP_ITEM_IDS = new Set(["cookie", "lollipop", "shield", "elixir", "crown"]);

const clampStage = (stage: number) => Math.min(4, Math.max(1, Math.round(stage) || 1));

export const getPetImageSrc = (idx: number, stage = 1) => {
  const key = PET_KEYS[((idx % PET_KEYS.length) + PET_KEYS.length) % PET_KEYS.length] || "cat";
  return `/mascots/pets/${key}-${clampStage(stage)}.webp`;
};
/** Mèo mặc thử bộ trang phục (dùng làm ảnh mẫu trong Cửa hàng). */
export const getOutfitPreviewSrc = (outfitId: string) => (OUTFIT_IDS.has(outfitId) ? `/mascots/outfits/${outfitId}.webp` : null);
/** Biểu tượng riêng của món trang phục (mũ, kính, áo choàng...). */
export const getOutfitIconSrc = (outfitId: string) => (OUTFIT_IDS.has(outfitId) ? `/mascots/outfits/${outfitId}-icon.webp` : null);
/** Ảnh vật phẩm cho linh thú ăn/dùng trong Cửa hàng. */
export const getShopItemImageSrc = (itemId: string) => (SHOP_ITEM_IDS.has(itemId) ? `/mascots/items/${itemId}.webp` : null);

export const PetImage: React.FC<{ idx: number; size?: number; stage?: number; outfitId?: string; className?: string }> = ({
  idx,
  size = 64,
  stage = 1,
  outfitId = "default",
  className = "",
}) => {
  const icon = outfitId && outfitId !== "default" ? getOutfitIconSrc(outfitId) : null;
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <img
        src={getPetImageSrc(idx, stage)}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        className="h-full w-full select-none object-contain drop-shadow-[0_4px_6px_rgba(15,23,42,0.18)]"
      />
      {icon && size >= 40 && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border border-white bg-white/95 shadow-sm"
          style={{ width: Math.round(size * 0.36), height: Math.round(size * 0.36), padding: Math.max(2, Math.round(size * 0.04)) }}
        >
          <img src={icon} alt="" draggable={false} className="h-full w-full object-contain" />
        </span>
      )}
    </span>
  );
};

/** Ảnh vật phẩm; nếu chưa có ảnh thì hiện emoji cũ. */
export const ShopItemIcon: React.FC<{ itemId: string; emoji?: string; size?: number; className?: string }> = ({
  itemId,
  emoji = "",
  size = 32,
  className = "",
}) => {
  const src = getShopItemImageSrc(itemId);
  if (!src) return <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }}>{emoji}</span>;
  return <img src={src} alt="" draggable={false} className={`inline-block select-none object-contain ${className}`} style={{ width: size, height: size }} />;
};

export type WhaleMood = "hello" | "great" | "thinking" | "rest";
/** Cá voi SmartStudy với 4 biểu cảm. */
export const WhaleMascot: React.FC<{ mood?: WhaleMood; size?: number; className?: string }> = ({ mood = "hello", size = 64, className = "" }) => (
  <img
    src={`/mascots/whale/${mood}.webp`}
    alt=""
    draggable={false}
    className={`inline-block select-none object-contain ${className}`}
    style={{ width: size, height: size }}
  />
);

// Helper để lấy linh thú theo index, cấp tiến hoá (1-4) và trang phục
export const getMascotComponent = (idx: number, size = 64, stage = 1, outfitId: string = "default") => (
  <PetImage idx={idx} size={size} stage={stage} outfitId={outfitId} />
);

