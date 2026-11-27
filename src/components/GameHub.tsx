import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Gamepad2, FolderOpen, Play, Bug, Trophy, Clock, ArrowLeft, CheckCircle2, Terminal, Trash2, Search, Calculator, Languages, Grid, FlaskConical, Folder, Code2, BookOpen, Flame, Users, PlusCircle, ArrowRight, Layers, ShoppingBag, Coins, Gift, Lock, Check, Shield, Zap, X, RotateCcw, Star, ListChecks } from "lucide-react";
import { UserProgress } from "../types";
import { DEFAULT_GAMES } from "../games/registry";
import {
  GameArtTheme,
  GameBadgeType,
  GameFolder,
  GameManifest,
  GameRewardPayload,
  GameTestLogEntry,
} from "../games/types";
import { WisdomCoinIcon } from "./CustomMascots";
import { getStudentProfile } from "../lib/studentProfile";
import {
  PVHeroId,
  PVHeroMeta,
  PVProfileState,
  PVUpgrades,
  PV_GACHA_COST,
  PV_HERO_CATALOG,
  PV_PITY_THRESHOLD,
  PV_UPGRADE_METAS,
  addPVTransaction,
  loadPVProfile,
  rollPVHeroGacha,
  savePVProfile,
} from "../games/pixel-vanguard/pixelVanguardStore";
import { HeroPixelAvatar } from "../games/pixel-vanguard/PixelVanguardGame";
import {
  INK_SIEGE_SURVIVORS,
  grantInkSiegeRewardToStorage,
  loadInkSiegeSaveSummary,
} from "../games/ink-siege/InkSiegeGame";

interface GameHubProps {
  progress: UserProgress;
  onUpdateProgress: (updates: Partial<UserProgress>) => void;
  onTriggerSuccess: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const HIGH_SCORES_STORAGE_KEY = "smart_study_game_highscores_v1";

import {
  GameCoverArtwork,
  getModeBadgeStyle,
} from "./GameCoverArtwork";

// ---- G8: filter by subject (replaces the old topic folders) + "Chơi tiếp" row ----
const SUBJECT_FILTERS = [
  { id: "all", label: "Tất cả", emoji: "🎮" },
  { id: "toan", label: "Toán", emoji: "➗" },
  { id: "tieng-anh", label: "Tiếng Anh", emoji: "🔤" },
  { id: "lich-su-dia-ly", label: "Lịch sử – Địa lí", emoji: "🌏" },
  { id: "khtn", label: "KHTN", emoji: "🔬" },
  { id: "da-mon", label: "Đa môn", emoji: "🧩" },
] as const;
type SubjectFilterId = (typeof SUBJECT_FILTERS)[number]["id"];
const FILTER_KEY = "smartstudy_game_filter_v1";
const RECENT_KEY = "smartstudy_recent_games_v1";
const isMultiSubject = (g: GameManifest) => (g.subjectGroups?.length || 0) >= 3;
const matchesSubject = (g: GameManifest, f: SubjectFilterId) =>
  f === "all" || (f === "da-mon" ? isMultiSubject(g) : !!g.subjectGroups?.includes(f as never));
const subjectLabelOf = (g: GameManifest) =>
  isMultiSubject(g) ? "Đa môn" : SUBJECT_FILTERS.find((f) => f.id === g.subjectGroups?.[0])?.label || "Ôn tập";

/** "Hỗ trợ học tập": what the game asks of the player. Demands are amber so a student can skip a game that won't fit. */
function AccessChips({ a }: { a: GameManifest["access"] }) {
  const chips: [string, boolean][] = [
    [a.noHearing ? "Không cần nghe" : "Cần nghe", !a.noHearing],
    [a.clock === "none" ? "Không tính giờ" : "Chỉnh được giờ", false],
    [a.hands === "slow" ? "Chơi chậm được" : a.hands === "fast" ? "Cần bấm nhanh" : "Cần canh chính xác", a.hands !== "slow"],
  ];
  return (
    <ul aria-label="Mức phù hợp" className="flex flex-wrap gap-1">
      {chips.map(([label, demand]) => (
        <li
          key={label}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
            demand ? "border-amber-300 bg-amber-50 text-amber-900" : "border-[#bfe3d6] bg-[#eefaf5] text-[#0b6b53]"
          }`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
function loadRecentGames(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.filter((id) => DEFAULT_GAMES.some((g) => g.id === id)).slice(0, 3) : [];
  } catch {
    return [];
  }
}

export default function GameHub({
  progress,
  onUpdateProgress,
  onTriggerSuccess,
  onNavigateTab,
}: GameHubProps) {
  const [selectedFolderId, setSelectedFolderIdState] = useState<SubjectFilterId>(() => {
    try {
      const saved = localStorage.getItem(FILTER_KEY);
      if (SUBJECT_FILTERS.some((f) => f.id === saved)) return saved as SubjectFilterId;
    } catch {}
    return "all";
  });
  const setSelectedFolderId = (id: SubjectFilterId) => {
    setSelectedFolderIdState(id);
    try {
      localStorage.setItem(FILTER_KEY, id);
    } catch {}
  };
  const [recentGameIds, setRecentGameIds] = useState<string[]>(loadRecentGames);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTestModeGlobal, setIsTestModeGlobal] = useState<boolean>(false);
  const [showDevInspector, setShowDevInspector] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(() => {
    try {
      const returnGameId = localStorage.getItem("smart_study_return_to_game");
      if (returnGameId) {
        localStorage.removeItem("smart_study_return_to_game");
        if (DEFAULT_GAMES.some((g) => g.id === returnGameId)) {
          return returnGameId;
        }
      }
    } catch {}
    return null;
  });
  const [testLogs, setTestLogs] = useState<GameTestLogEntry[]>([]);

  const [highScores, setHighScores] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {}
    return {};
  });

  const filteredGames = useMemo(() => {
    return DEFAULT_GAMES.filter((game) => {
      const matchesFolder = matchesSubject(game, selectedFolderId);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.vietnameseTitle.toLowerCase().includes(q) ||
        game.subtitle.toLowerCase().includes(q) ||
        game.sourcePath.toLowerCase().includes(q) ||
        game.tags.some((t) => t.toLowerCase().includes(q));
      return matchesFolder && matchesSearch;
    });
  }, [selectedFolderId, searchQuery]);

  const newGamesList = useMemo(
    () => filteredGames.filter((g) => g.section === "new"),
    [filteredGames]
  );

  const popularGamesList = useMemo(
    () => filteredGames.filter((g) => g.section === "popular"),
    [filteredGames]
  );

  const activeGame = useMemo(
    () => DEFAULT_GAMES.find((g) => g.id === activeGameId) || null,
    [activeGameId]
  );

  const appendTestLog = (type: GameTestLogEntry["type"], message: string) => {
    const now = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTestLogs((prev) =>
      [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          type,
          message,
        },
        ...prev,
      ].slice(0, 40)
    );
  };

  const handleSaveHighScore = (gameId: string, newScore: number) => {
    setHighScores((prev) => {
      const currentBest = prev[gameId] || 0;
      if (newScore <= currentBest) return prev;
      const updated = { ...prev, [gameId]: newScore };
      try {
        localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAwardReward = (payload: GameRewardPayload) => {
    onUpdateProgress({
      points: (progress.points || 0) + payload.xp,
      coins: (progress.coins || 0) + payload.coins,
    });
    onTriggerSuccess(
      `Hoàn thành màn chơi: +${payload.xp} XP và +${payload.coins} Xu (${payload.reason})!`
    );
  };

  const handleLaunchGame = (game: GameManifest, forceTestMode?: boolean) => {
    if (typeof forceTestMode === "boolean") {
      setIsTestModeGlobal(forceTestMode);
    }
    setActiveGameId(game.id);
    setTestLogs([]);
    setRecentGameIds((prev) => {
      const next = [game.id, ...prev.filter((id) => id !== game.id)].slice(0, 3);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    const modeLabel =
      (typeof forceTestMode === "boolean" ? forceTestMode : isTestModeGlobal)
        ? "Chế độ thử (debug)"
        : "Chế độ chơi chuẩn";
    appendTestLog(
      "state",
      `Khởi chạy "${game.vietnameseTitle}" (${game.sourcePath}) ở ${modeLabel}`
    );
  };

  const studentGrade = getStudentProfile(progress).gradeNumber;

  // ================= TRẠNG THÁI CỬA HÀNG ĐIỂM THƯỞNG TÍCH HỢP TRONG GAMEHUB =================
  const [showRewardShop, setShowRewardShop] = useState<boolean>(false);
  const [rewardShopSection, setRewardShopSection] = useState<
    "pixel_vanguard" | "ink_siege" | "study_items"
  >("pixel_vanguard");
  const [pvShopSubTab, setPvShopSubTab] = useState<"heroes" | "gacha" | "upgrades">("heroes");
  const [highlightedHeroId, setHighlightedHeroId] = useState<string | null>(null);
  const [pvProfile, setPvProfile] = useState<PVProfileState>(() => loadPVProfile());
  const [inkSummary, setInkSummary] = useState(() => loadInkSiegeSaveSummary());
  const [gachaResult, setGachaResult] = useState<{
    hero: PVHeroMeta;
    isDuplicate: boolean;
    refundCoins: number;
    fragmentsGained: number;
    pityTriggered: boolean;
  } | null>(null);

  const currentCoins = progress.coins || 0;
  const currentXp = progress.points || 0;

  // Đồng bộ hồ sơ Pixel Vanguard xuống iframe nếu đang mở
  const broadcastPVProfileToIframes = useCallback((prof: PVProfileState) => {
    try {
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach((frame) => {
        frame.contentWindow?.postMessage(
          {
            type: "pv:profile",
            unlocked: prof.unlocked,
            upgrades: prof.upgrades,
            selectedHero: prof.selectedHero,
          },
          "*"
        );
      });
    } catch {
      // Ignore cross-frame error
    }
  }, []);

  const handleOpenRewardShop = useCallback(
    (subTab?: string, heroId?: string) => {
      setPvProfile(loadPVProfile());
      setInkSummary(loadInkSiegeSaveSummary());
      if (subTab === "ink_siege") {
        setRewardShopSection("ink_siege");
      } else if (subTab === "study_items") {
        setRewardShopSection("study_items");
      } else {
        setRewardShopSection("pixel_vanguard");
      }
      if (heroId) {
        setHighlightedHeroId(heroId);
      }
      setShowRewardShop(true);
    },
    []
  );

  // Lắng nghe postMessage 'pv:openShop' từ Pixel Vanguard và Ink Siege để mở ngay Cửa hàng điểm thưởng
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "pv:openShop") {
        const sub =
          data.game === "ink-siege" || data.targetSubTab === "ink_siege"
            ? "ink_siege"
            : "pixel_vanguard";
        const hero = typeof data.hero === "string" ? data.hero : undefined;
        handleOpenRewardShop(sub, hero);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleOpenRewardShop]);

  // --- Hành động đổi Nhân vật Pixel Vanguard bằng Xu Trí Tuệ ---
  const handleUnlockOrSelectPVHero = (hero: PVHeroMeta) => {
    const latest = loadPVProfile();
    const isOwned = latest.unlocked.includes(hero.id);
    if (isOwned) {
      const updated = savePVProfile({ ...latest, selectedHero: hero.id });
      setPvProfile(updated);
      broadcastPVProfileToIframes(updated);
      onTriggerSuccess(`Đã chọn chiến binh xuất trận: ${hero.vietnameseName}!`);
      return;
    }

    if (currentCoins < hero.priceCoins) {
      onTriggerSuccess(
        `Bạn cần thêm ${hero.priceCoins - currentCoins} Xu Trí Tuệ để mở khóa ${hero.vietnameseName}. Hãy giải thêm câu hỏi Toán trong game nhé!`
      );
      return;
    }

    onUpdateProgress({
      coins: Math.max(0, currentCoins - hero.priceCoins),
    });

    const updated = savePVProfile(
      addPVTransaction(
        {
          ...latest,
          unlocked: [...latest.unlocked, hero.id],
          selectedHero: hero.id,
        },
        "spend",
        hero.priceCoins,
        `Mở khóa chiến binh ${hero.vietnameseName} trong GameHub`
      )
    );
    setPvProfile(updated);
    broadcastPVProfileToIframes(updated);
    onTriggerSuccess(`Đã mở khóa và trang bị ${hero.vietnameseName}!`);
  };

  // --- Đổi 3 Mảnh Anh Hùng lấy Tướng Pixel Vanguard ---
  const handleRedeemPVHeroByFragments = (hero: PVHeroMeta) => {
    const latest = loadPVProfile();
    if (latest.unlocked.includes(hero.id) || latest.heroFragments < 3) return;
    const updated = savePVProfile(
      addPVTransaction(
        {
          ...latest,
          heroFragments: latest.heroFragments - 3,
          unlocked: [...latest.unlocked, hero.id],
          selectedHero: hero.id,
        },
        "spend",
        0,
        `Đổi 3 Mảnh Anh Hùng lấy ${hero.vietnameseName}`
      )
    );
    setPvProfile(updated);
    broadcastPVProfileToIframes(updated);
    onTriggerSuccess(`Đã ghép 3 Mảnh Anh Hùng mở khóa ${hero.vietnameseName}!`);
  };

  // --- Quay Hộp Anh Hùng Bí Ẩn (Gacha) ---
  const handleRollPVGacha = () => {
    if (currentCoins < PV_GACHA_COST) {
      onTriggerSuccess(
        `Bạn cần ${PV_GACHA_COST} Xu Trí Tuệ để mở Hộp Anh Hùng Bí Ẩn!`
      );
      return;
    }
    const latest = loadPVProfile();
    const outcome = rollPVHeroGacha(latest);
    const netCost = Math.max(0, PV_GACHA_COST - outcome.refundCoins);

    onUpdateProgress({
      coins: Math.max(0, currentCoins - netCost),
    });
    setPvProfile(outcome.updatedProfile);
    setGachaResult({
      hero: outcome.hero,
      isDuplicate: outcome.isDuplicate,
      refundCoins: outcome.refundCoins,
      fragmentsGained: outcome.fragmentsGained,
      pityTriggered: outcome.pityTriggered,
    });
    broadcastPVProfileToIframes(outcome.updatedProfile);
    onTriggerSuccess(
      outcome.isDuplicate
        ? `Quay trúng ${outcome.hero.vietnameseName} (Đã có) -> Nhận +1 Mảnh Anh Hùng và hoàn ${outcome.refundCoins} Xu!`
        : `Chúc mừng! Bạn mở trúng chiến binh mới: ${outcome.hero.vietnameseName}!`
    );
  };

  // --- Nâng cấp chỉ số vĩnh viễn Pixel Vanguard ---
  const handleBuyPVUpgrade = (key: keyof PVUpgrades) => {
    const latest = loadPVProfile();
    const meta = PV_UPGRADE_METAS.find((m) => m.key === key);
    if (!meta) return;
    const curLv = latest.upgrades[key] || 0;
    if (curLv >= meta.costs.length) return;
    const cost = meta.costs[curLv];
    if (currentCoins < cost) {
      onTriggerSuccess(`Cần ${cost} Xu Trí Tuệ để nâng cấp ${meta.name}!`);
      return;
    }

    onUpdateProgress({
      coins: Math.max(0, currentCoins - cost),
    });

    const updated = savePVProfile(
      addPVTransaction(
        {
          ...latest,
          upgrades: {
            ...latest.upgrades,
            [key]: curLv + 1,
          },
        },
        "spend",
        cost,
        `Nâng cấp ${meta.name} lên Cấp ${curLv + 1}`
      )
    );
    setPvProfile(updated);
    broadcastPVProfileToIframes(updated);
    onTriggerSuccess(`Đã nâng cấp ${meta.name} lên Cấp ${curLv + 1}!`);
  };

  // --- Mở khóa / Chọn thủ thư trong Người Giữ Trang (Ink Siege) ---
  const handleUnlockOrSelectInkSurvivor = (survivor: (typeof INK_SIEGE_SURVIVORS)[number]) => {
    const currentInk = loadInkSiegeSaveSummary();
    const isOwned = currentInk.unlockedHeroes.includes(survivor.id);
    if (isOwned) {
      const next = grantInkSiegeRewardToStorage({
        unlockHero: survivor.id,
        toast: `Đã chọn Thủ thư: ${survivor.vietnameseName}`,
      });
      setInkSummary(next);
      onTriggerSuccess(`Đã chọn Thủ thư xuất trận: ${survivor.vietnameseName}!`);
      return;
    }

    if (currentCoins < survivor.priceCoins) {
      onTriggerSuccess(
        `Bạn cần thêm ${survivor.priceCoins - currentCoins} Xu Trí Tuệ để mở khóa ${survivor.vietnameseName}!`
      );
      return;
    }

    onUpdateProgress({
      coins: Math.max(0, currentCoins - survivor.priceCoins),
    });

    const next = grantInkSiegeRewardToStorage({
      unlockHero: survivor.id,
      gems: 100,
      toast: `Đã mở khóa ${survivor.vietnameseName} + Vũ khí riêng!`,
    });
    setInkSummary(next);
    onTriggerSuccess(
      `Đã mở khóa ${survivor.vietnameseName} (kèm Vũ khí riêng và +100 Ngọc Tri Thức)!`
    );
  };

  // --- Đổi Gói Tiếp Tế & Random Mảnh / Đồ Dùng cho Người Giữ Trang (Ink Siege) ---
  const handleBuyInkSupplyPack = (pack: {
    title: string;
    costCoins: number;
    gems?: number;
    gold?: number;
    energy?: number;
    key_s?: number;
    key_g?: number;
    design?: number;
    randomShards?: number;
    randomEquip?: number;
    randomSigWeapon?: boolean;
  }) => {
    if (currentCoins < pack.costCoins) {
      onTriggerSuccess(`Cần ${pack.costCoins} Xu Trí Tuệ để đổi ${pack.title}!`);
      return;
    }
    onUpdateProgress({
      coins: Math.max(0, currentCoins - pack.costCoins),
    });
    const next = grantInkSiegeRewardToStorage({
      gems: pack.gems,
      gold: pack.gold,
      energy: pack.energy,
      key_s: pack.key_s,
      key_g: pack.key_g,
      design: pack.design,
      randomShards: pack.randomShards,
      randomEquip: pack.randomEquip,
      randomSigWeapon: pack.randomSigWeapon,
      toast: `Đã mở ${pack.title} từ Cửa Hàng!`,
    });
    setInkSummary(next);
    onTriggerSuccess(`Đã mua và random thành công ${pack.title} vào Người Giữ Trang!`);
  };

  // --- Đổi Vật Phẩm Hỗ Trợ Học Tập SmartStudy ---
  const handleBuyStudyItem = (item: {
    id: string;
    name: string;
    costCoins: number;
    bonusXp?: number;
    bonusFragments?: number;
    bonusInkGems?: number;
  }) => {
    if (currentCoins < item.costCoins) {
      onTriggerSuccess(`Cần ${item.costCoins} Xu Trí Tuệ để đổi ${item.name}!`);
      return;
    }

    onUpdateProgress({
      coins: Math.max(0, currentCoins - item.costCoins),
      points: (progress.points || 0) + (item.bonusXp || 0),
    });

    if (item.bonusFragments) {
      const latest = loadPVProfile();
      const updated = savePVProfile({
        ...latest,
        heroFragments: latest.heroFragments + item.bonusFragments,
      });
      setPvProfile(updated);
    }
    if (item.bonusInkGems) {
      const next = grantInkSiegeRewardToStorage({
        gems: item.bonusInkGems,
        toast: `+${item.bonusInkGems} Ngọc Tri Thức!`,
      });
      setInkSummary(next);
    }

    onTriggerSuccess(`Đã đổi thành công: ${item.name}!`);
  };

  // Giao diện Cửa hàng điểm thưởng tích hợp trực tiếp trong GameHub
  const renderIntegratedRewardShop = () => {
    if (!showRewardShop) return null;

    return (
      <section
        id="gamehub-integrated-reward-shop"
        className="bg-white rounded-3xl border-2 border-[#93b8e8] shadow-xl overflow-hidden transition-all"
      >
        {/* Header Cửa hàng điểm thưởng */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#2e5cb8] to-[#1d4ed8] text-white px-5 py-4 sm:px-7 sm:py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Cửa hàng điểm thưởng SmartStudy
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[11px] font-extrabold">
                  Đổi trực tiếp trong Sảnh Game
                </span>
              </div>
              <p className="text-xs sm:text-sm text-sky-100 mt-0.5">
                Dùng Xu Trí Tuệ tích lũy từ học tập và giải Toán để mở khóa Chiến Binh Pixel, Thủ Thư Người Giữ Trang và vật phẩm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/35 border border-white/20 text-xs font-extrabold flex items-center gap-2">
              <WisdomCoinIcon className="w-4 h-4" />
              <span>Số dư:</span>
              <span className="text-amber-300 font-mono text-sm font-black tabular-nums">
                {currentCoins} Xu
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-950/35 border border-white/20 text-xs font-extrabold flex items-center gap-1.5">
              <Star className="w-4 h-4 text-sky-300" />
              <span>Điểm XP:</span>
              <span className="text-white font-mono text-sm font-black tabular-nums">
                {currentXp}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-950/35 border border-white/20 text-xs font-extrabold flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-pink-300" />
              <span>Mảnh Tướng:</span>
              <span className="text-pink-200 font-mono text-sm font-black tabular-nums">
                {pvProfile.heroFragments}/3
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowRewardShop(false)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Thu gọn</span>
            </button>
          </div>
        </div>

        {/* Thanh chọn Nhóm Vật Phẩm trong Cửa Hàng */}
        <div className="bg-[#f4f8fd] border-b border-[#d8e5f7] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setRewardShopSection("pixel_vanguard")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer border ${
                rewardShopSection === "pixel_vanguard"
                  ? "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-2xs"
                  : "bg-white text-slate-700 border-[#d8e5f7] hover:border-[#93b8e8]"
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Chiến Binh Pixel ({pvProfile.unlocked.length}/10 Tướng)</span>
            </button>

            <button
              type="button"
              onClick={() => setRewardShopSection("ink_siege")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer border ${
                rewardShopSection === "ink_siege"
                  ? "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-2xs"
                  : "bg-white text-slate-700 border-[#d8e5f7] hover:border-[#93b8e8]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Người Giữ Trang · Ink Siege ({inkSummary.unlockedHeroes.length}/10 Thủ Thư)</span>
            </button>

            <button
              type="button"
              onClick={() => setRewardShopSection("study_items")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer border ${
                rewardShopSection === "study_items"
                  ? "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-2xs"
                  : "bg-white text-slate-700 border-[#d8e5f7] hover:border-[#93b8e8]"
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Vật phẩm học tập và rương tiếp tế</span>
            </button>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("shop")}
              className="text-xs font-extrabold text-[#2e5cb8] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Mở toàn trang Cửa Hàng Quà</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nội dung chi tiết của từng Tab */}
        <div className="p-5 sm:p-6 space-y-5">
          {rewardShopSection === "pixel_vanguard" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPvShopSubTab("heroes")}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      pvShopSubTab === "heroes"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    10 Chiến Binh Pixel
                  </button>
                  <button
                    type="button"
                    onClick={() => setPvShopSubTab("gacha")}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      pvShopSubTab === "gacha"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Quay Hộp Bí Ẩn ({PV_GACHA_COST} Xu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPvShopSubTab("upgrades")}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                      pvShopSubTab === "upgrades"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Nâng cấp vĩnh viễn
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  Bảo hiểm Gacha: <strong>{pvProfile.pityCounter}/{PV_PITY_THRESHOLD}</strong> lần quay chắc chắn ra tướng mới
                </span>
              </div>

              {pvShopSubTab === "heroes" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-5 gap-3.5">
                  {PV_HERO_CATALOG.map((hero) => {
                    const isOwned = pvProfile.unlocked.includes(hero.id);
                    const isSelected = pvProfile.selectedHero === hero.id;
                    const isHighlighted = highlightedHeroId === hero.id;

                    return (
                      <div
                        key={hero.id}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                          isSelected
                            ? "bg-sky-50/70 border-[#2e5cb8] ring-2 ring-[#2e5cb8]/20"
                            : isHighlighted
                            ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/40"
                            : "bg-white border-slate-200 hover:border-sky-300"
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <HeroPixelAvatar
                              heroId={hero.id}
                              accentColor={hero.accentColor}
                              size={46}
                            />
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                              {hero.rarityLabel}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              {hero.vietnameseName}
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                              {hero.skillName}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-center bg-slate-50 rounded-xl p-1.5 border border-slate-200/70 text-[10px] font-bold">
                            <div>
                              <span className="text-slate-400 block">HP</span>
                              <span className="text-rose-600 font-black">{hero.hp}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Giáp</span>
                              <span className="text-sky-600 font-black">{hero.armor}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">N.Lượng</span>
                              <span className="text-amber-600 font-black">{hero.energy}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUnlockOrSelectPVHero(hero)}
                            className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : isOwned
                                ? "bg-[#2e5cb8] hover:bg-[#254da0] text-white"
                                : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Đang xuất trận</span>
                              </>
                            ) : isOwned ? (
                              <span>Chọn xuất trận</span>
                            ) : (
                              <>
                                <Coins className="w-3.5 h-3.5" />
                                <span>Mở khóa · {hero.priceCoins} Xu</span>
                              </>
                            )}
                          </button>

                          {!isOwned && pvProfile.heroFragments >= 3 && (
                            <button
                              type="button"
                              onClick={() => handleRedeemPVHeroByFragments(hero)}
                              className="w-full min-h-[34px] px-2.5 py-1 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-[11px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Gift className="w-3 h-3" />
                              <span>Đổi bằng 3 Mảnh</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {pvShopSubTab === "gacha" && (
                <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
                  <div className="space-y-2 max-w-xl">
                    <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">
                      Hộp Anh Hùng Bí Ẩn · Bảo hiểm Pity {pvProfile.pityCounter}/{PV_PITY_THRESHOLD}
                    </span>
                    <h3 className="text-xl font-black">
                      Thử vận may chiêu mộ chiến binh!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Mỗi lần mở tốn <strong>{PV_GACHA_COST} Xu Trí Tuệ</strong>. Nếu quay trúng chiến binh đã sở hữu sẽ nhận <strong>+1 Mảnh Anh Hùng</strong> và hoàn lại <strong>35 Xu</strong>. Đủ 3 Mảnh đổi miễn phí bất kỳ chiến binh nào!
                    </p>
                    {gachaResult && (
                      <div className="p-3 rounded-xl bg-slate-800 border border-amber-400/50 text-xs font-bold text-amber-200">
                        Kết quả gần nhất: <strong>{gachaResult.hero.vietnameseName}</strong>{" "}
                        {gachaResult.isDuplicate
                          ? `(+1 Mảnh Anh Hùng và hoàn ${gachaResult.refundCoins} Xu)`
                          : "(Chiến binh mới mở khóa!)"}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRollPVGacha}
                    className="min-h-[48px] px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm inline-flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                  >
                    <Gift className="w-5 h-5" />
                    <span>Quay Ngay · {PV_GACHA_COST} Xu</span>
                  </button>
                </div>
              )}

              {pvShopSubTab === "upgrades" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {PV_UPGRADE_METAS.map((up) => {
                    const lv = pvProfile.upgrades[up.key] || 0;
                    const maxLevel = up.costs.length;
                    const isMax = lv >= maxLevel;
                    const cost = isMax ? 0 : up.costs[lv];

                    return (
                      <div
                        key={up.key}
                        className="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-3 bg-slate-50/60"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#2e5cb8] uppercase">
                              Cấp {lv}/{maxLevel}
                            </span>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {up.effectPerLevel}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 mt-1.5">
                            {up.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">{up.desc}</p>
                        </div>

                        <button
                          type="button"
                          disabled={isMax}
                          onClick={() => handleBuyPVUpgrade(up.key)}
                          className={`w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            isMax
                              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                              : "bg-[#2e5cb8] hover:bg-[#254da0] text-white"
                          }`}
                        >
                          {isMax ? (
                            <span>Đã đạt tối đa</span>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5 text-amber-300" />
                              <span>Nâng cấp · {cost} Xu</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {rewardShopSection === "ink_siege" && (
            <div className="space-y-5">
              {/* Số dư trong Người Giữ Trang */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black">
                      Kho Tài Nguyên Thư Viện · Người Giữ Trang (Ink Siege)
                    </h4>
                    <p className="text-xs text-slate-300">
                      Mọi Thủ Thư và gói Ngọc Tri Thức đổi tại đây được cộng trực tiếp vào game Người Giữ Trang.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sky-300">
                    💎 Ngọc Tri Thức: <strong>{inkSummary.gems}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300">
                    🪙 Vàng: <strong>{inkSummary.gold}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300">
                    ⚡ Năng lượng: <strong>{inkSummary.energy}</strong>
                  </span>
                </div>
              </div>

              {/* 6 Gói Mua & Random Mảnh / Đồ Dùng / Vũ Khí cho Ink Siege */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  {
                    title: "Hộp Random Mảnh Nhân Vật (×6 Mảnh)",
                    desc: "Random ngẫu nhiên 6 Mảnh của 1 Thủ Thư để mở khoá hoặc nâng sao nhân vật trong sảnh.",
                    costCoins: 35,
                    randomShards: 6,
                    badge: "Random ×6 Mảnh",
                  },
                  {
                    title: "Rương Random Trang Bị và Đồ Dùng (×2)",
                    desc: "Random ngẫu nhiên 2 món vũ khí / trang bị (Xanh lá → Tím) đưa thẳng vào Kho đồ.",
                    costCoins: 45,
                    randomEquip: 2,
                    badge: "Random 2 Trang Bị",
                  },
                  {
                    title: "Hộp Random Vũ Khí Riêng Thủ Thư",
                    desc: "Random 1 Vũ khí riêng chuyên biệt của Thủ Thư với phẩm chất và cấp độ ngẫu nhiên!",
                    costCoins: 65,
                    randomSigWeapon: true,
                    badge: "Random Vũ Khí Riêng",
                  },
                  {
                    title: "Gói 500 Ngọc Tri Thức",
                    desc: "Dùng mở Rương Tri Thức hạng S, Hộp Chiêu Mộ Thủ Thư và Ổ Trứng Thú Cưng trong Cửa hàng.",
                    costCoins: 40,
                    gems: 500,
                    badge: "+500 Ngọc",
                  },
                  {
                    title: "Gói Chìa Rương Tri Thức",
                    desc: "Nhận ngay +2 Chìa Vàng và +4 Chìa Bạc mở hòm trang bị và mảnh trong Cửa hàng.",
                    costCoins: 55,
                    key_g: 2,
                    key_s: 4,
                    badge: "+6 Chìa Rương",
                  },
                  {
                    title: "Gói 2.500 Vàng và Bản Nháp",
                    desc: "Dùng nâng cấp cấp độ vũ khí, mua đồ random trong Cửa hàng và mở nhánh Tiến Hóa.",
                    costCoins: 35,
                    gold: 2500,
                    design: 25,
                    badge: "+2.500 Vàng",
                  },
                ].map((pack, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 p-4 bg-sky-50/40 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                        {pack.badge}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1.5">
                        {pack.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">{pack.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuyInkSupplyPack(pack)}
                      className="w-full min-h-[38px] px-3 py-2 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-300" />
                      <span>Mua / Random · {pack.costCoins} Xu</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Danh sách 10 Thủ Thư Người Giữ Trang */}
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-3">
                  Chiêu Mộ 10 Thủ Thư (Kèm Vũ Khí Riêng Chuyên Biệt)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-5 gap-3.5">
                  {INK_SIEGE_SURVIVORS.map((sv) => {
                    const isOwned = inkSummary.unlockedHeroes.includes(sv.id);
                    const isSelected = inkSummary.selectedHero === sv.id;

                    return (
                      <div
                        key={sv.id}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "bg-sky-50/80 border-[#2e5cb8] ring-2 ring-[#2e5cb8]/20"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-slate-950 text-[11px] font-black"
                              style={{ backgroundColor: sv.accentColor }}
                            >
                              {sv.codeName}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-500">
                              VK: {sv.weaponName}
                            </span>
                          </div>
                          <h5 className="text-sm font-black text-slate-900">
                            {sv.vietnameseName}
                          </h5>
                          <p className="text-[11px] font-bold text-[#2e5cb8]">
                            {sv.roleTitle}
                          </p>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            <strong>Tuyệt kỹ {sv.ultName}:</strong> {sv.ultDesc}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnlockOrSelectInkSurvivor(sv)}
                          className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : isOwned
                              ? "bg-[#2e5cb8] hover:bg-[#254da0] text-white"
                              : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đang chọn</span>
                            </>
                          ) : isOwned ? (
                            <span>Chọn thủ thư</span>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              <span>Mở khóa · {sv.priceCoins} Xu</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {rewardShopSection === "study_items" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: "xp_booster",
                  name: "Thuốc Tinh Thông Tri Thức (+120 XP)",
                  desc: "Cộng trực tiếp +120 Điểm XP vào hồ sơ học tập SmartStudy để thăng hạng Bảng Vàng.",
                  costCoins: 50,
                  bonusXp: 120,
                  badge: "+120 XP",
                },
                {
                  id: "hero_fragment_chest",
                  name: "Rương Mảnh Anh Hùng (+3 Mảnh Tướng)",
                  desc: "Nhận đủ 3 Mảnh Anh Hùng để ghép miễn phí bất kỳ Chiến Binh Huyền Thoại nào trong Pixel Vanguard.",
                  costCoins: 90,
                  bonusFragments: 3,
                  badge: "+3 Mảnh Anh Hùng",
                },
                {
                  id: "grand_scholar_bundle",
                  name: "Gói Học Giả Toàn Năng (XP + Ngọc + Mảnh)",
                  desc: "Nhận ngay +80 XP, +1 Mảnh Anh Hùng Pixel Vanguard và +350 Ngọc Tri Thức cho Người Giữ Trang.",
                  costCoins: 75,
                  bonusXp: 80,
                  bonusFragments: 1,
                  bonusInkGems: 350,
                  badge: "Combo 3 trong 1",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                      {item.badge}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-2">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyStudyItem(item)}
                    className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đổi Vật Phẩm · {item.costCoins} Xu</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  // ================= MÀN HÌNH ĐANG CHƠI GAME =================
  if (activeGame) {
    const ActiveGameComponent = activeGame.component;

    return (
      <div className="space-y-5">
        {/* Top Game Stage Control Bar: Quay lại sảnh Games, chuyên đề, tên game, Số dư điểm thưởng & nút Cửa hàng điểm thưởng */}
        <div className="bg-white rounded-2xl border border-sky-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* flex-wrap + min width on the title: with big text (support 200%) the title drops under the button instead of being squeezed to 0 px */}
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveGameId(null)}
              className="min-h-[44px] max-w-full px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-blue-800 border border-sky-200 text-xs font-extrabold inline-flex items-center gap-1.5 text-left transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Quay lại sảnh Games</span>
            </button>

            <div className="flex-1 min-w-[10rem]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-blue-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                  {subjectLabelOf(activeGame)}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-blue-950 truncate mt-0.5">
                {activeGame.title} · {activeGame.vietnameseTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
              <WisdomCoinIcon className="w-4 h-4" />
              <span>Số dư:</span>
              <span className="font-mono font-black text-amber-950 tabular-nums">
                {currentCoins} Xu
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                handleOpenRewardShop(
                  activeGame.id.includes("ink-siege") ? "ink_siege" : "pixel_vanguard"
                )
              }
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>{showRewardShop ? "Đang mở Cửa Hàng" : "Cửa hàng điểm thưởng"}</span>
            </button>

            <div className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span>Kỷ lục:</span>
              <span className="font-mono font-black text-blue-950 tabular-nums">
                {highScores[activeGame.id] || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cửa hàng điểm thưởng tích hợp hiển thị ngay phía trên khung game khi được mở */}
        {renderIntegratedRewardShop()}

        {/* Main Game Stage */}
        <div className="w-full">
          <React.Suspense
            fallback={
              <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-blue-900">
                <div className="w-10 h-10 border-4 border-sky-200 border-t-blue-600 rounded-full animate-spin" aria-hidden="true" />
                <p className="text-sm font-bold">Đang tải trò chơi…</p>
              </div>
            }
          >
          <ActiveGameComponent
            gameId={activeGame.id}
            isTestMode={false}
            highScore={highScores[activeGame.id] || 0}
            onSaveHighScore={(score) =>
              handleSaveHighScore(activeGame.id, score)
            }
            onAwardReward={handleAwardReward}
            onLogEvent={appendTestLog}
            onExit={() => setActiveGameId(null)}
            progress={progress}
            onUpdateProgress={onUpdateProgress}
            onNavigateTab={onNavigateTab}
            onTriggerSuccess={onTriggerSuccess}
            onOpenRewardShop={handleOpenRewardShop}
          />
          </React.Suspense>
        </div>
      </div>
    );
  }

  // ================= SẢNH CHÍNH QUESTORA GAME HUB =================
  const renderGameCard = (game: GameManifest) => {
    const bestScore = highScores[game.id] || 0;

    return (
      <article
        key={game.id}
        className="game-spotlight-card group bg-white rounded-3xl border border-[#d8e5f7] hover:border-[#93b8e8] shadow-[0_3px_16px_-4px_rgba(30,58,138,0.06)] hover:shadow-[0_10px_26px_-8px_rgba(46,92,184,0.15)] transition-all duration-250 flex flex-col justify-between overflow-hidden"
      >
        <div>
          {/* 16:9 Visual Cover Banner + Floating Play Circle Button */}
          <div
            onClick={() => handleLaunchGame(game)}
            className="relative cursor-pointer overflow-hidden"
          >
            <div className="transition-transform duration-300 group-hover:scale-[1.03]">
              <GameCoverArtwork
                theme={game.artTheme}
                title={game.title}
                vietnameseTitle={game.vietnameseTitle}
                isPro={game.isPro}
              />
            </div>

            {/* Floating Play Circle on Bottom-Right of Thumbnail */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLaunchGame(game);
              }}
              aria-label={`Chơi ngay ${game.title}`}
              className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-white text-[#2e5cb8] shadow-[0_6px_18px_rgba(30,58,138,0.22)] border border-[#d8e5f7] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#2e5cb8] group-hover:text-white transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          </div>

          {/* Card Content Body */}
          <div className="p-4 sm:p-5 space-y-2.5">
            {/* Badges Row: NEW + PRO + Folder Tag */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {game.isNew && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eef4fc] text-[#243c6e] border border-[#d8e5f7] text-[10px] font-black uppercase tracking-wide">
                  <span>Mới</span>
                </span>
              )}
              {game.isPro && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#2e5cb8] text-white text-[10px] font-black uppercase tracking-wide">
                  PRO
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4f8fd] text-[#243c6e] border border-[#d8e5f7] text-[10px] font-bold ml-auto">
                <BookOpen className="w-3 h-3 text-[#2e5cb8]" />
                <span>{subjectLabelOf(game)}</span>
              </span>
            </div>

            {/* Game Title */}
            <div>
              <h3 className="text-base sm:text-[17px] font-black text-slate-900 leading-snug group-hover:text-[#2e5cb8] transition-colors">
                {game.title}
              </h3>
              <p className="text-xs font-bold text-[#2e5cb8] mt-0.5">
                {game.vietnameseTitle}
              </p>
            </div>

            <AccessChips a={game.access} />

            {/* Team count + Mode badge + High score */}
            <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{game.teamsLabel}</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getModeBadgeStyle(
                    game.modeBadge
                  )}`}
                >
                  {game.modeBadge}
                </span>
              </div>

              {bestScore > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black text-[#243c6e] bg-[#eef4fc] px-2 py-0.5 rounded-md border border-[#d8e5f7]">
                  <Trophy className="w-3 h-3 text-[#2e5cb8]" />
                  <span>{bestScore}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLaunchGame(game)}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Chơi ngay · +{game.rewardXp} XP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-7 pb-8">
      {/* ================= 1. HERO BANNER XANH DỊU VỪA PHẢI & TRẮNG SÁNG ================= */}
      <section className="relative bg-white rounded-[2rem] border border-[#d8e5f7] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left Hero Copy & CTAs */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-5 z-10">
            <h1 className="font-display font-black text-[28px] sm:text-4xl lg:text-[42px] text-slate-900 tracking-tight leading-[1.15]">
              Biến giờ ôn tập
              <span className="block text-[#2e5cb8] mt-1">
                thành giờ chơi game
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab("quiz");
                  } else {
                    handleLaunchGame(DEFAULT_GAMES[0]);
                  }
                }}
                className="w-full sm:w-auto justify-center min-h-[48px] sm:min-h-[46px] px-5 py-2.5 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-sm font-extrabold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ListChecks className="w-4 h-4" />
                <span>Chọn chủ đề để ôn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPvProfile(loadPVProfile());
                  setInkSummary(loadInkSiegeSaveSummary());
                  setShowRewardShop((prev) => !prev);
                }}
                className="w-full sm:w-auto justify-center min-h-[48px] sm:min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cửa hàng điểm thưởng ({currentCoins} Xu)</span>
              </button>
            </div>
          </div>

          {/* Right artwork: SmartStudy AI Tutor whale mascot */}
          <div className="lg:col-span-6 relative h-full min-h-[240px] sm:min-h-[280px] bg-[#e8eef8] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#e2e6f7]">
            <img
              src="/game-hub-hero.webp"
              alt="Linh vật cá voi SmartStudy AI Tutor đội mũ tốt nghiệp, cầm sách – Bạn đồng hành học tập"
              width={1500}
              height={1050}
              decoding="async"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-center select-none"
            />
          </div>
        </div>
      </section>

      {/* ================= 2. THANH SỐ DƯ ĐIỂM THƯỞNG & MỞ CỬA HÀNG TRỰC TIẾP ================= */}
      <section className="bg-[#eef4fc] rounded-3xl border border-[#d8e5f7] px-5 py-4 sm:px-7 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-white text-[#2e5cb8] border border-[#d8e5f7] flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Ôn tập mà vui: chơi xong, kiến thức nhớ lâu hơn
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
          <div className="justify-center px-3 sm:px-4 py-2.5 rounded-xl bg-white border border-[#b9d1f0] text-xs font-extrabold text-[#243c6e] inline-flex items-center gap-2 shadow-2xs">
            <WisdomCoinIcon className="w-4 h-4" />
            <span>Xu Trí Tuệ: <strong>{currentCoins} Xu</strong></span>
          </div>

          <div className="justify-center px-3 sm:px-3.5 py-2.5 rounded-xl bg-white border border-[#b9d1f0] text-xs font-extrabold text-[#243c6e] inline-flex items-center gap-1.5 shadow-2xs">
            <Star className="w-4 h-4 text-[#2e5cb8]" />
            <span>Tổng XP: <strong>{currentXp}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => {
              setPvProfile(loadPVProfile());
              setInkSummary(loadInkSiegeSaveSummary());
              setShowRewardShop((prev) => !prev);
            }}
            className="col-span-2 justify-center min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>
              {showRewardShop ? "Ẩn cửa hàng điểm thưởng" : "Đổi nhân vật và vật phẩm"}
            </span>
          </button>
        </div>
      </section>

      {/* ================= 2B. CỬA HÀNG ĐIỂM THƯỞNG TÍCH HỢP TRONG GAMEHUB ================= */}
      {renderIntegratedRewardShop()}

      {/* ================= 2C. CHƠI TIẾP (3 trò chơi gần nhất) ================= */}
      {recentGameIds.length > 0 && (
        <section aria-labelledby="gamehub-continue-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[#2e5cb8]" />
            <h2 id="gamehub-continue-title" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Chơi tiếp</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentGameIds.map((id) => {
              const g = DEFAULT_GAMES.find((x) => x.id === id);
              if (!g) return null;
              const best = highScores[g.id] || 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleLaunchGame(g)}
                  className="min-h-[64px] w-full text-left rounded-2xl bg-white border border-[#d8e5f7] hover:border-[#93b8e8] hover:shadow-sm px-4 py-3 flex items-center gap-3 transition-all cursor-pointer"
                >
                  <span className="w-11 h-11 rounded-xl bg-[#2e5cb8] text-white flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-900 truncate">{g.vietnameseTitle}</span>
                    <span className="block text-xs text-slate-500 truncate">
                      {subjectLabelOf(g)}
                      {best > 0 ? ` · Kỷ lục ${best}` : ""}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#2e5cb8] shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= 3. THANH LỌC THEO MÔN & TÌM KIẾM NHANH ================= */}
      <section className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        {/* Topic chips wrap onto a second line instead of hiding under the search box */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          {SUBJECT_FILTERS.map((f) => {
            const isSelected = selectedFolderId === f.id;
            const count = DEFAULT_GAMES.filter((g) => matchesSubject(g, f.id)).length;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedFolderId(f.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-[#2e5cb8] text-white border-[#2e5cb8] shadow-xs"
                    : "bg-white text-slate-700 border-[#d8e5f7] hover:border-[#93b8e8]"
                }`}
              >
                <span aria-hidden="true">{f.emoji}</span>
                <span>{f.label}</span>
                <span className={`px-1.5 rounded-full text-[10px] font-mono ${isSelected ? "bg-white/20 text-white" : "bg-[#eef4fc] text-[#243c6e]"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm trò chơi" placeholder="Tìm tên trò chơi hoặc chủ đề..."
            className="w-full min-h-[44px] pl-9 pr-4 py-2 rounded-xl bg-white border border-[#d8e5f7] text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2e5cb8]"
          />
        </div>
      </section>

      {/* ================= 4. NEW GAMES (TRÒ CHƠI MỚI) ================= */}
      {newGamesList.length > 0 && (
        <section id="questora-new-games-section" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Gamepad2 className="w-5 h-5 text-[#2e5cb8]" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Trò chơi mới nổi bật
              </h2>
            </div>
            {selectedFolderId !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedFolderId("all")}
                className="min-h-[44px] px-2 text-xs font-extrabold text-[#2e5cb8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2100px]:grid-cols-6 gap-4 sm:gap-5">
            {newGamesList.map((game) => renderGameCard(game))}
          </div>
        </section>
      )}

      {/* ================= 5. POPULAR GAMES (TRÒ CHƠI PHỔ BIẾN) ================= */}
      {popularGamesList.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Flame className="w-5 h-5 text-[#2e5cb8]" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Popular Games · Trò chơi phổ biến
              </h2>
              <span className="text-xs sm:text-sm font-medium text-slate-500">
                Được yêu thích trong lớp học, sẵn sàng chơi và kiểm thử ngay
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2100px]:grid-cols-6 gap-4 sm:gap-5">
            {popularGamesList.map((game) => renderGameCard(game))}
          </div>
        </section>
      )}
    </div>
  );
}
