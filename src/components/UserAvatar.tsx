import React, { useState, useEffect } from "react";
import { getMascotComponent } from "./CustomMascots";
import { getAvatarAtLevel } from "../lib/avatarEvolution";

const CUSTOM_AVATAR_CACHE_KEY = "smart_study_custom_avatar_data_v1";

interface UserAvatarProps {
  avatarUrl?: string;
  displayName?: string;
  selectedAvatarIdx?: number;
  level?: number;
  equippedOutfit?: string;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  displayName = "Học sinh",
  selectedAvatarIdx = 0,
  level = 1,
  equippedOutfit = "default",
  size = 40,
  className = "",
  showBorder = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackDataUrl, setFallbackDataUrl] = useState<string | null>(null);

  // Reset error state if avatarUrl changes
  useEffect(() => {
    setImageError(false);
    setFallbackDataUrl(null);
  }, [avatarUrl]);

  // 1. Check if avatar is a Mascot reference: "mascot:0", "mascot:1", etc.
  if (avatarUrl && avatarUrl.startsWith("mascot:")) {
    const parsedIdx = parseInt(avatarUrl.replace("mascot:", ""), 10);
    const mascotIdx = !isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < 6 ? parsedIdx : 0;
    const stage = getAvatarAtLevel(mascotIdx, level).stageNum;
    return (
      <div 
        className={`flex items-center justify-center overflow-hidden shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {getMascotComponent(mascotIdx, Math.round(size * 0.95), stage, equippedOutfit)}
      </div>
    );
  }

  // 2. Custom image URL (data URL, blob URL, or http/uploads URL)
  const resolvedSrc = fallbackDataUrl || avatarUrl;
  if (resolvedSrc && !imageError) {
    return (
      <div 
        className={`relative overflow-hidden shrink-0 bg-sky-100 flex items-center justify-center ${showBorder ? "border border-sky-300/80 shadow-2xs" : ""} ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={resolvedSrc}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => {
            if (!fallbackDataUrl) {
              try {
                const cached = localStorage.getItem(CUSTOM_AVATAR_CACHE_KEY);
                if (cached && cached !== resolvedSrc && cached.startsWith("data:image/")) {
                  setFallbackDataUrl(cached);
                  return;
                }
              } catch {}
            }
            setImageError(true);
          }}
        />
      </div>
    );
  }

  // 3. Fallback: Mascot of selectedAvatarIdx
  const fallbackIdx = selectedAvatarIdx !== undefined && !isNaN(selectedAvatarIdx) && selectedAvatarIdx >= 0 && selectedAvatarIdx < 6
    ? selectedAvatarIdx
    : 0;
  const stage = getAvatarAtLevel(fallbackIdx, level).stageNum;

  return (
    <div 
      className={`relative overflow-hidden shrink-0 bg-sky-100 flex items-center justify-center ${showBorder ? "border border-sky-300/80 shadow-2xs" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      {getMascotComponent(fallbackIdx, Math.round(size * 0.95), stage, equippedOutfit)}
    </div>
  );
};
