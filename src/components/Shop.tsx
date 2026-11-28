import React, { useState, useEffect } from "react";
import { Coins, Check, ShoppingBag, AlertCircle, Gift, Trophy, Database, Layers, ChevronRight, Flame, Zap, Volume2, VolumeX, RefreshCw, Plus, Shirt, Crown, Wand2, Shield, Star, Tag, Palette, ArrowLeftRight, TrendingUp } from "lucide-react";
import { UserProgress, MagicCard } from "../types";
import { MAGIC_CARDS } from "../data";
import { MASCOT_OUTFITS, MascotOutfit, getOutfitById } from "../lib/mascotOutfits";
import { getMascotComponent, getOutfitIconSrc, getOutfitPreviewSrc, getPetImageSrc, ShopItemIcon, WisdomCoinIcon } from "./CustomMascots";
import { getAvatarAtLevel, AVATAR_EVOLUTIONS } from "../lib/avatarEvolution";
import { motion, AnimatePresence } from "motion/react";
import {
  PV_HERO_CATALOG,
  PV_GACHA_COST,
  PV_PITY_THRESHOLD,
  PV_UPGRADE_METAS,
  PVHeroMeta,
  PVProfileState,
  PVUpgrades,
  addPVTransaction,
  loadPVProfile,
  rollPVHeroGacha,
  savePVProfile,
} from "../games/pixel-vanguard/pixelVanguardStore";
import { HeroPixelAvatar } from "../games/pixel-vanguard/PixelVanguardGame";

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  xpBoost: number;
  emoji: string;
  iconColor: string;
  bgLight: string;
  longDesc: string;
}



export interface CardPack {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  longDesc: string;
  bgClass: string;
  borderClass: string;
  badgeColor: string;
  textBadgeColor: string;
  cardCount: number;
  rates: { dong: number; sat: number; bac: number; vang: number; kimcuong: number; baymau: number };
}


export const SHOP_ITEMS: ShopItem[] = [
  { id: "cookie", name: "Bánh Quy", price: 10, description: "Bánh quy thơm ngon", xpBoost: 5, emoji: "🍪", iconColor: "text-amber-500", bgLight: "bg-amber-50", longDesc: "Bánh quy thơm ngon bổ dưỡng." },
  { id: "lollipop", name: "Kẹo Mút", price: 20, description: "Kẹo mút ngọt ngào", xpBoost: 12, emoji: "🍭", iconColor: "text-pink-500", bgLight: "bg-pink-50", longDesc: "Kẹo mút siêu ngọt." },
  { id: "shield", name: "Khiên Gỗ", price: 50, description: "Khiên bảo vệ", xpBoost: 35, emoji: "🛡️", iconColor: "text-slate-500", bgLight: "bg-slate-50", longDesc: "Khiên bảo vệ vật lý." },
  { id: "elixir", name: "Thuốc Phép", price: 100, description: "Thuốc phép ma thuật", xpBoost: 80, emoji: "🧪", iconColor: "text-purple-500", bgLight: "bg-purple-50", longDesc: "Thuốc phép tăng điểm kinh nghiệm cực mạnh." },
  { id: "crown", name: "Vương Miện", price: 300, description: "Vương miện hoàng gia", xpBoost: 300, emoji: "👑", iconColor: "text-yellow-500", bgLight: "bg-yellow-50", longDesc: "Vương miện hoàng gia quý phái." }
];

export const CARD_PACKS: CardPack[] = [
  {
    id: "pack_dong",
    name: "Gói Thẻ Đồng",
    emoji: "📦🥉",
    price: 15,
    description: "Gói thẻ cơ bản, chứa bùa hộ mệnh tập sự.",
    longDesc: "Thích hợp để thử vận may ban đầu. Rút được 1 lá ma thuật ngẫu nhiên (tập trung ở Đồng và Sắt).",
    bgClass: "bg-amber-50/60",
    borderClass: "border-amber-200/60",
    badgeColor: "bg-amber-100 text-amber-800",
    textBadgeColor: "text-amber-700",
    cardCount: 1,
    rates: { dong: 70, sat: 20, bac: 8, vang: 2, kimcuong: 0, baymau: 0 }
  },
  {
    id: "pack_sat",
    name: "Gói Thẻ Sắt",
    emoji: "📦🔩",
    price: 25,
    description: "Tăng tỷ lệ nhận thẻ Che Màn Hình sương mù.",
    longDesc: "Rèn sắt đúc trí tuệ. Rút được 1 lá bài ma thuật ngẫu nhiên với tỷ lệ trúng thẻ Sắt tăng mạnh.",
    bgClass: "bg-slate-100/50",
    borderClass: "border-slate-300",
    badgeColor: "bg-slate-200 text-slate-800",
    textBadgeColor: "text-slate-600",
    cardCount: 1,
    rates: { dong: 35, sat: 45, bac: 15, vang: 5, kimcuong: 0, baymau: 0 }
  },
  {
    id: "pack_bac",
    name: "Gói Thẻ Bạc",
    emoji: "📦🥈",
    price: 45,
    description: "Nhận thẻ khống chế Đóng Băng và Gây Khó.",
    longDesc: "Gia tăng phép thuật khống chế đối thủ cực mạnh. Rút được 1 lá ma thuật với tỷ lệ nhận cấp Bạc lên tới 40%.",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-250",
    badgeColor: "bg-sky-100 text-sky-800",
    textBadgeColor: "text-sky-600",
    cardCount: 1,
    rates: { dong: 15, sat: 25, bac: 45, vang: 12, kimcuong: 3, baymau: 0 }
  },
  {
    id: "pack_vang",
    name: "Gói Thẻ Vàng",
    emoji: "📦👑",
    price: 85,
    description: "Gói cao cấp chứa 2 lá, cơ hội trúng thẻ Epic cực đại.",
    longDesc: "Cấp độ hoàng kim của phép thuật PK. Rút được 2 lá ma thuật ngẫu nhiên với cơ hội vàng nhận thẻ Epic 1.5x.",
    bgClass: "bg-amber-100/20",
    borderClass: "border-amber-300",
    badgeColor: "bg-amber-100 text-amber-900",
    textBadgeColor: "text-amber-600",
    cardCount: 2,
    rates: { dong: 5, sat: 15, bac: 30, vang: 38, kimcuong: 10, baymau: 2 }
  },
  {
    id: "pack_kimcuong",
    name: "Gói Thẻ Kim Cương",
    emoji: "📦💎",
    price: 150,
    description: "Chứa 2 lá siêu phẩm, đảm bảo tỷ lệ Legendary cao.",
    longDesc: "Những viên kim cương tinh hoa rực sáng. Rút được 2 lá ma thuật cao cấp, tỷ lệ trúng thẻ Nhân Hệ Số 2.0 rất cao.",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-250",
    badgeColor: "bg-indigo-100 text-indigo-800",
    textBadgeColor: "text-indigo-650",
    cardCount: 2,
    rates: { dong: 0, sat: 5, bac: 15, vang: 30, kimcuong: 40, baymau: 10 }
  },
  {
    id: "pack_baymau",
    name: "Gói Thẻ Bảy Màu",
    emoji: "📦🌈",
    price: 300,
    description: "Gói đỉnh cao chứa 3 lá, chắc chắn có thẻ Bảy Màu!",
    longDesc: "Sức mạnh tối thượng của Thần Rồng Tri Thức. Rút 3 lá ma thuật, bảo đảm nhận ít nhất 1 thẻ Thách Thức Vô Song!",
    bgClass: "bg-fuchsia-50/40",
    borderClass: "border-fuchsia-350",
    badgeColor: "bg-fuchsia-100 text-fuchsia-800 animate-pulse",
    textBadgeColor: "text-fuchsia-600",
    cardCount: 3,
    rates: { dong: 0, sat: 0, bac: 10, vang: 20, kimcuong: 35, baymau: 35 }
  }
];

interface ShopProps {
  progress: UserProgress;
  onUpdateProgress: (updates: Partial<UserProgress>) => void;
  selectedAvatarIdx: number;
  triggerSuccess: (msg: string) => void;
  equippedOutfitId?: string;
  onEquipOutfit?: (outfitId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function Shop({ 
  progress, 
  onUpdateProgress, 
  selectedAvatarIdx, 
  triggerSuccess,
  equippedOutfitId,
  onEquipOutfit,
  onNavigateTab
}: ShopProps) {
  const [activeTab, setActiveTab] = useState<"items" | "outfits" | "magic_cards" | "pixel_vanguard" | "ascii_redeem">(() => {
    try {
      const initialTab = localStorage.getItem("smart_study_shop_initial_tab");
      if (
        initialTab === "items" ||
        initialTab === "outfits" ||
        initialTab === "magic_cards" ||
        initialTab === "pixel_vanguard" ||
        initialTab === "ascii_redeem"
      ) {
        localStorage.removeItem("smart_study_shop_initial_tab");
        return initialTab;
      }
    } catch {}
    return "items";
  });
  const [highlightedPvHeroId, setHighlightedPvHeroId] = useState<string | null>(() => {
    try {
      const heroId = localStorage.getItem("smart_study_shop_initial_hero");
      if (heroId) {
        localStorage.removeItem("smart_study_shop_initial_hero");
        return heroId;
      }
    } catch {}
    return null;
  });
  const [pvProfile, setPvProfile] = useState<PVProfileState>(() => loadPVProfile());
  const [pvGachaResult, setPvGachaResult] = useState<{
    hero: PVHeroMeta;
    isDuplicate: boolean;
    refundCoins: number;
    pityTriggered: boolean;
  } | null>(null);
  const [outfitFilter, setOutfitFilter] = useState<"all" | "owned" | "hat" | "robe" | "special">("all");
  const [previewOutfitId, setPreviewOutfitId] = useState<string>(
    progress.equippedOutfit || equippedOutfitId || localStorage.getItem("smart_study_mascot_outfit") || "default"
  );

  // ASCII Study Points Economy (Relocated from Theme Shop to Gift Shop per user instructions)
  const [asciiPoints, setAsciiPoints] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("ascii_points_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.balance === "number") return parsed.balance;
      }
    } catch {}
    return 50000;
  });

  const syncAsciiPoints = () => {
    try {
      const raw = localStorage.getItem("ascii_points_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.balance === "number") {
          setAsciiPoints(parsed.balance);
        }
      }
    } catch {}
  };

  useEffect(() => {
    const handleStorage = () => syncAsciiPoints();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleRedeemCoinsWithAscii = (costPts: number, coinsGain: number) => {
    if (asciiPoints < costPts) {
      triggerSuccess(`Em chưa đủ Điểm ASCII! Cần thêm ${(costPts - asciiPoints).toLocaleString()} pts để quy đổi.`);
      return;
    }
    const nextPts = Math.max(0, asciiPoints - costPts);
    setAsciiPoints(nextPts);
    try {
      const raw = localStorage.getItem("ascii_points_v1");
      let obj = raw ? JSON.parse(raw) : {};
      obj.balance = nextPts;
      localStorage.setItem("ascii_points_v1", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    onUpdateProgress({
      coins: (progress.coins || 0) + coinsGain
    });
    triggerSuccess(`Đổi thành công! Em đã dùng ${costPts.toLocaleString()} pts ASCII và nhận ngay +${coinsGain} Xu Trí Tuệ!`);
  };

  const handleRedeemPackWithAscii = (costPts: number, packId: string, packName: string) => {
    if (asciiPoints < costPts) {
      triggerSuccess(`Em chưa đủ Điểm ASCII! Cần thêm ${(costPts - asciiPoints).toLocaleString()} pts.`);
      return;
    }
    const targetPack = CARD_PACKS.find(p => p.id === packId);
    if (!targetPack) return;

    const nextPts = Math.max(0, asciiPoints - costPts);
    setAsciiPoints(nextPts);
    try {
      const raw = localStorage.getItem("ascii_points_v1");
      let obj = raw ? JSON.parse(raw) : {};
      obj.balance = nextPts;
      localStorage.setItem("ascii_points_v1", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    handleOpenPack(targetPack);
    triggerSuccess(`Dùng ${costPts.toLocaleString()} pts ASCII đổi mở ngay 1x ${packName}!`);
  };

  const handleRedeemItemWithAscii = (costPts: number, itemId: string, itemName: string, amount = 1) => {
    if (asciiPoints < costPts) {
      triggerSuccess(`Em chưa đủ Điểm ASCII! Cần thêm ${(costPts - asciiPoints).toLocaleString()} pts.`);
      return;
    }
    const nextPts = Math.max(0, asciiPoints - costPts);
    setAsciiPoints(nextPts);
    try {
      const raw = localStorage.getItem("ascii_points_v1");
      let obj = raw ? JSON.parse(raw) : {};
      obj.balance = nextPts;
      localStorage.setItem("ascii_points_v1", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    const nextInv = {
      ...inventory,
      [itemId]: (inventory[itemId] || 0) + amount
    };
    saveInventory(nextInv);
    triggerSuccess(`Đổi thành công ${amount}x ${itemName} bằng ${costPts.toLocaleString()} pts ASCII! Đã chuyển vào Kho Đồ.`);
  };

  // Fusion-specific state
  const [selectedFusionSlots, setSelectedFusionSlots] = useState<string[]>([]);
  const [fusionStatus, setFusionStatus] = useState<"idle" | "fusing" | "success">("idle");
  const [fusedResultCard, setFusedResultCard] = useState<MagicCard | null>(null);

  // Sound generator for card fusion
  const playFusionSound = (stage: "fusing" | "success" | "error") => {
    if (!isSoundOn) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (stage === "fusing") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } else if (stage === "success") {
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.12 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.65);
        });
      } else if (stage === "error") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const getMaxSlotsForTier = (tier: string): number => {
    if (tier === "dong" || tier === "sat") return 3;
    if (tier === "bac" || tier === "vang") return 4;
    return 5; // kimcuong or baymau
  };

  const calculateFusionSuccess = (cards: MagicCard[]): number => {
    if (cards.length < 2) return 0;
    
    const firstCard = cards[0];
    const isAllIdentical = cards.every(c => c.id === firstCard.id);
    const rarity = firstCard.rarity;
    const count = cards.length;

    if (rarity === "Common") {
      if (count === 2) return isAllIdentical ? 0.75 : 0.55;
      return 1.0; // 3 cards
    } else if (rarity === "Rare" || rarity === "Epic") {
      if (count === 2) return isAllIdentical ? 0.50 : 0.35;
      if (count === 3) return isAllIdentical ? 0.80 : 0.65;
      return 1.0; // 4 cards
    } else { // Legendary or Mythic
      if (count === 2) return isAllIdentical ? 0.30 : 0.20;
      if (count === 3) return isAllIdentical ? 0.60 : 0.45;
      if (count === 4) return isAllIdentical ? 0.85 : 0.70;
      return 1.0; // 5 cards
    }
  };

  const getActiveMaxSlots = (): number => {
    if (selectedFusionSlots.length === 0) return 3;
    const firstCardId = selectedFusionSlots[0];
    const card = MAGIC_CARDS.find(c => c.id === firstCardId);
    if (!card) return 3;
    return getMaxSlotsForTier(card.tier);
  };

  const getFusionResult = (slots: string[]): MagicCard => {
    if (slots.length === 0) return MAGIC_CARDS[0];
    
    // Find matching cards
    const cards = slots.map(id => MAGIC_CARDS.find(c => c.id === id)).filter(Boolean) as MagicCard[];
    if (cards.length === 0) return MAGIC_CARDS[0];

    const firstCard = cards[0];
    const tier = firstCard.tier;

    // Check if they are highest tier (baymau)
    if (tier === "baymau") {
      const specialPool = MAGIC_CARDS.filter(c => ["omega", "time_warp", "double_strike", "mirror_force", "super_nova"].includes(c.id));
      const successRate = calculateFusionSuccess(slots.map(id => MAGIC_CARDS.find(c => c.id === id)).filter(Boolean) as MagicCard[]);
      const isSuccess = Math.random() < successRate;

      if (isSuccess) {
        return specialPool[Math.floor(Math.random() * specialPool.length)];
      } else {
        const normalBaymau = MAGIC_CARDS.filter(c => c.tier === "baymau" && !["omega", "time_warp", "double_strike", "mirror_force", "super_nova"].includes(c.id));
        return normalBaymau.length > 0 ? normalBaymau[Math.floor(Math.random() * normalBaymau.length)] : specialPool[0];
      }
    }

    // Determine target tier (next tier)
    let nextTier = "dong";
    if (tier === "dong") nextTier = "sat";
    else if (tier === "sat") nextTier = "bac";
    else if (tier === "bac") nextTier = "vang";
    else if (tier === "vang") nextTier = "kimcuong";
    else if (tier === "kimcuong") nextTier = "baymau";

    const nextTierCards = MAGIC_CARDS.filter(c => c.tier === nextTier);
    const sameTierCards = MAGIC_CARDS.filter(c => c.tier === tier);

    const upgradeChance = calculateFusionSuccess(slots.map(id => MAGIC_CARDS.find(c => c.id === id)).filter(Boolean) as MagicCard[]);
    const isUpgrade = Math.random() < upgradeChance;

    if (isUpgrade && nextTierCards.length > 0) {
      return nextTierCards[Math.floor(Math.random() * nextTierCards.length)];
    } else {
      // return a random card of the same tier
      const samePool = sameTierCards.filter(c => !slots.includes(c.id));
      if (samePool.length > 0) {
        return samePool[Math.floor(Math.random() * samePool.length)];
      }
      return sameTierCards[Math.floor(Math.random() * sameTierCards.length)];
    }
  };

  const handleFusion = () => {
    if (selectedFusionSlots.length < 2) {
      playFusionSound("error");
      triggerSuccess("Em cần ít nhất 2 lá bài đặt vào lò luyện để dung hợp!");
      return;
    }

    setFusionStatus("fusing");
    playFusionSound("fusing");

    setTimeout(() => {
      const randomResult = getFusionResult(selectedFusionSlots);
      setFusedResultCard(randomResult);

      const nextInv = { ...magicCardsInventory };
      selectedFusionSlots.forEach(id => {
        nextInv[id] = Math.max(0, (nextInv[id] || 0) - 1);
      });
      nextInv[randomResult.id] = (nextInv[randomResult.id] || 0) + 1;
      
      setMagicCardsInventory(nextInv);
      localStorage.setItem("smart_study_magic_cards_v2", JSON.stringify(nextInv));

      setFusionStatus("success");
      playFusionSound("success");
      triggerSuccess(`Dung hợp thành công! Em đã nhận được lá bài ${randomResult.name}!`);
    }, 1500);
  };

  // Companion food inventory
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("smart_study_inventory");
      return saved ? JSON.parse(saved) : { cookie: 0, lollipop: 0, shield: 0, elixir: 0, crown: 0 };
    } catch {
      return { cookie: 0, lollipop: 0, shield: 0, elixir: 0, crown: 0 };
    }
  });

  // Magic cards inventory
  const [magicCardsInventory, setMagicCardsInventory] = useState<Record<string, number>>(() => {
    const defaultCards: Record<string, number> = {};
    MAGIC_CARDS.forEach(card => {
      defaultCards[card.id] = 0;
    });
    
    try {
      const saved = localStorage.getItem("smart_study_magic_cards_v2");
      return saved ? { ...defaultCards, ...JSON.parse(saved) } : defaultCards;
    } catch {
      return defaultCards;
    }
  });

  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(SHOP_ITEMS[0]);
  const [selectedPack, setSelectedPack] = useState<CardPack | null>(CARD_PACKS[0]);
  const [isFeeding, setIsFeeding] = useState<string | null>(null);

  // Unboxing sequence state
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [unboxingPack, setUnboxingPack] = useState<CardPack | null>(null);
  const [unboxedCards, setUnboxedCards] = useState<MagicCard[]>([]);
  const [unboxingStep, setUnboxingStep] = useState<"idle" | "spinning" | "reveal">("idle");
  const [revealedCardIdx, setRevealedCardIdx] = useState<number>(0);

  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const lastCheckIn = localStorage.getItem("smart_study_last_check_in");
      if (lastCheckIn === todayStr) {
        setHasCheckedIn(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveInventory = (newInv: Record<string, number>) => {
    setInventory(newInv);
    localStorage.setItem("smart_study_inventory", JSON.stringify(newInv));
  };

  const handleCheckIn = () => {
    if (hasCheckedIn) return;
    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("smart_study_last_check_in", todayStr);
    setHasCheckedIn(true);

    const coinsGained = 25;
    onUpdateProgress({
      coins: (progress.coins || 0) + coinsGained
    });
    triggerSuccess(`Điểm danh thành công! Em nhận được +${coinsGained} Xu Trí Tuệ hôm nay.`);
  };

  const handleBuyItem = (item: ShopItem) => {
    const currentCoins = progress.coins || 0;
    if (currentCoins < item.price) {
      triggerSuccess(`Em không đủ Xu Trí Tuệ rồi! Hãy tích cực học tập để kiếm thêm xu nhé! (Cần thêm ${item.price - currentCoins} xu)`);
      return;
    }

    onUpdateProgress({
      coins: currentCoins - item.price
    });

    const nextInv = {
      ...inventory,
      [item.id]: (inventory[item.id] || 0) + 1
    };
    saveInventory(nextInv);

    triggerSuccess(`Đã mua thành công 1x ${item.name}! Vật phẩm đã được chuyển vào Kho Đồ.`);
  };

  const handleUseItem = (itemId: string, itemXp: number, itemName: string, itemEmoji: string) => {
    if ((inventory[itemId] || 0) <= 0) return;

    setIsFeeding(itemId);

    setTimeout(() => {
      const nextInv = {
        ...inventory,
        [itemId]: inventory[itemId] - 1
      };
      saveInventory(nextInv);

      onUpdateProgress({
        points: progress.points + itemXp
      });

      setIsFeeding(null);
      triggerSuccess(`Linh thú đã thưởng thức ${itemEmoji} ${itemName}! Tặng lại em +${itemXp} XP bứt phá!`);
    }, 1200);
  };

  // Trang phục sở hữu & trang phục đang mặc
  const unlockedOutfits: string[] = progress.unlockedOutfits || (() => {
    try {
      const saved = localStorage.getItem("smart_study_unlocked_outfits");
      return saved ? JSON.parse(saved) : ["default"];
    } catch {
      return ["default"];
    }
  })();

  const currentEquippedOutfit: string = progress.equippedOutfit || equippedOutfitId || (() => {
    try {
      return localStorage.getItem("smart_study_mascot_outfit") || "default";
    } catch {
      return "default";
    }
  })();

  const handleBuyOutfit = (outfit: MascotOutfit) => {
    const currentCoins = progress.coins || 0;
    if (currentCoins < outfit.price) {
      triggerSuccess(`Em chưa đủ Xu Trí Tuệ! Cần thêm ${outfit.price - currentCoins} Xu. Hãy ôn tập và làm quiz để nhận thêm Xu nhé!`);
      return;
    }

    const nextCoins = currentCoins - outfit.price;
    const nextUnlocked = Array.from(new Set([...unlockedOutfits, outfit.id]));

    onUpdateProgress({
      coins: nextCoins,
      unlockedOutfits: nextUnlocked,
      equippedOutfit: outfit.id
    });

    try {
      localStorage.setItem("smart_study_unlocked_outfits", JSON.stringify(nextUnlocked));
      localStorage.setItem("smart_study_mascot_outfit", outfit.id);
    } catch (e) {
      console.error(e);
    }

    if (onEquipOutfit) {
      onEquipOutfit(outfit.id);
    }
    setPreviewOutfitId(outfit.id);
    playUnboxingChime("kimcuong");
    triggerSuccess(`Mua thành công trang phục "${outfit.name}"! Mascot đã được diện đồ mới.`);
  };

  const handleEquipOutfit = (outfitId: string) => {
    onUpdateProgress({
      equippedOutfit: outfitId
    });
    try {
      localStorage.setItem("smart_study_mascot_outfit", outfitId);
    } catch (e) {
      console.error(e);
    }
    if (onEquipOutfit) {
      onEquipOutfit(outfitId);
    }
    setPreviewOutfitId(outfitId);
    const outfit = getOutfitById(outfitId);
    playUnboxingChime("bac");
    triggerSuccess(`Đã diện trang phục "${outfit.name}" cho mascot chính!`);
  };

  // Unboxing sound effect creator
  const playUnboxingChime = (rarity: string) => {
    if (!isSoundOn) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gainNode = ctx.createGain();

      if (rarity === "baymau" || rarity === "kimcuong") {
        // Divine fanfare chord
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major chord
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(f * 2, ctx.currentTime + 1.2);
          gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          osc.connect(gainNode);
          osc.start();
          osc.stop(ctx.currentTime + 1.3);
        });
      } else {
        // Standard magical sweep
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      }

      gainNode.connect(ctx.destination);
    } catch (e) {
      console.warn("Audio blocked:", e);
    }
  };

  // Draw card algorithm
  const drawCardFromPack = (pack: CardPack): MagicCard => {
    const rates = pack.rates;
    const rand = Math.random() * 100;
    let sum = 0;
    let drawnTier: "dong" | "sat" | "bac" | "vang" | "kimcuong" | "baymau" = "dong";
    
    const tiers: ("dong" | "sat" | "bac" | "vang" | "kimcuong" | "baymau")[] = ["dong", "sat", "bac", "vang", "kimcuong", "baymau"];
    for (const tier of tiers) {
      sum += rates[tier];
      if (rand <= sum) {
        drawnTier = tier;
        break;
      }
    }
    
    const tierCards = MAGIC_CARDS.filter(c => c.tier === drawnTier);
    if (tierCards.length === 0) {
      return MAGIC_CARDS[0]; // fallback
    }
    return tierCards[Math.floor(Math.random() * tierCards.length)];
  };

  const handleOpenPack = (pack: CardPack) => {
    const currentCoins = progress.coins || 0;
    if (currentCoins < pack.price) {
      triggerSuccess(`Em không đủ Xu Trí Tuệ để mua gói thẻ này! (Cần thêm ${pack.price - currentCoins} xu)`);
      return;
    }

    // Deduct coins
    onUpdateProgress({
      coins: currentCoins - pack.price
    });

    // Draw cards based on pack count
    const drawn: MagicCard[] = [];
    for (let i = 0; i < pack.cardCount; i++) {
      // If it's pack_baymau, guarantee at least 1 Mythic (baymau) card
      if (pack.id === "pack_baymau" && i === 0) {
        const mythics = MAGIC_CARDS.filter(c => c.tier === "baymau");
        drawn.push(mythics[Math.floor(Math.random() * mythics.length)]);
      } else {
        drawn.push(drawCardFromPack(pack));
      }
    }

    // Update Magic Cards inventory
    const nextMagicInventory = { ...magicCardsInventory };
    drawn.forEach(card => {
      nextMagicInventory[card.id] = (nextMagicInventory[card.id] || 0) + 1;
    });
    setMagicCardsInventory(nextMagicInventory);
    localStorage.setItem("smart_study_magic_cards_v2", JSON.stringify(nextMagicInventory));

    // Play unboxing animations
    setUnboxingPack(pack);
    setUnboxedCards(drawn);
    setRevealedCardIdx(0);
    setUnboxingStep("spinning");

    // Play initial unboxing sound
    playUnboxingChime("standard");

    setTimeout(() => {
      setUnboxingStep("reveal");
      playUnboxingChime(drawn[0].tier);
    }, 1500);
  };

  const effectiveMascotIdx = React.useMemo(() => {
    if (progress.avatarUrl && progress.avatarUrl.startsWith("mascot:")) {
      const idx = parseInt(progress.avatarUrl.replace("mascot:", ""), 10);
      if (!isNaN(idx) && idx >= 0 && idx < 6) return idx;
    }
    return selectedAvatarIdx >= 0 && selectedAvatarIdx < 6 ? selectedAvatarIdx : 0;
  }, [progress.avatarUrl, selectedAvatarIdx]);

  const currentPet = getAvatarAtLevel(effectiveMascotIdx, progress.level);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12 relative">
      
      {/* 1. Header: Bank / Coins balance & ASCII Points */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 text-slate-900 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight text-slate-900">
            Cửa hàng vật phẩm và đổi quà
          </h2>
          <p className="text-sm text-slate-600 max-w-md font-medium">
            Đổi <span className="font-bold text-slate-900">Xu Trí Tuệ</span> và <span className="font-bold text-sky-700">Điểm Thưởng ASCII</span> lấy vật phẩm bồi dưỡng linh thú, mở gói thẻ ma thuật hoặc đổi thưởng hấp dẫn!
          </p>
        </div>

        {/* Dual Counters: Coins & ASCII Points */}
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {/* Big Coin Counter */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 min-w-[170px] justify-center shadow-2xs">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-xs">
              <Coins className="w-5 h-5 text-white fill-amber-200" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Số dư Xu hiện tại</p>
              <p className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight tabular-nums">{progress.coins || 0} <span className="text-xs text-amber-800 font-semibold">Xu</span></p>
            </div>
          </div>

          {/* Big ASCII Points Counter (Moved from Theme Shop to Gift Shop) */}
          <div className="bg-sky-50/90 border border-sky-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 min-w-[190px] justify-center shadow-2xs">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-xs text-white font-mono font-black text-base">
              ✦
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Điểm Thưởng ASCII</p>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-sky-200 text-sky-900">Đổi quà</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-sky-800 tracking-tight tabular-nums">
                {asciiPoints.toLocaleString()} <span className="text-xs text-sky-700 font-semibold">pts</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mobile-tab-scroll flex flex-wrap sm:flex-nowrap gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-4xl mx-auto border border-slate-200/90">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex-1 py-3 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "items" 
              ? "bg-white text-blue-700 shadow-2xs border border-slate-200/80" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span className="whitespace-nowrap">Linh thú</span>
        </button>
        <button
          onClick={() => setActiveTab("outfits")}
          className={`flex-1 py-3 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
            activeTab === "outfits" 
              ? "bg-white text-blue-700 shadow-2xs border border-slate-200/80" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span className="whitespace-nowrap">Trang phục</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
        </button>
        <button
          onClick={() => setActiveTab("magic_cards")}
          className={`flex-1 py-3 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "magic_cards" 
              ? "bg-white text-blue-700 shadow-2xs border border-slate-200/80" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gói Thẻ Ma Thuật</span>
        </button>
        <button
          onClick={() => {
            setPvProfile(loadPVProfile());
            setActiveTab("pixel_vanguard");
          }}
          className={`flex-1 py-3 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "pixel_vanguard"
              ? "bg-white text-blue-700 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Chiến Binh Pixel</span>
        </button>
        <button
          onClick={() => setActiveTab("ascii_redeem")}
          className={`flex-1 py-3 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
            activeTab === "ascii_redeem" 
              ? "bg-sky-600 text-white shadow-2xs border border-sky-600" 
              : "text-sky-800 hover:text-sky-950 bg-sky-100/60"
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Đổi điểm ASCII</span>
          <span className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] font-black ${
            activeTab === "ascii_redeem" ? "bg-white text-sky-700" : "bg-sky-200 text-sky-800"
          }`}>
            ✦ {asciiPoints > 999 ? `${Math.floor(asciiPoints / 1000)}k` : asciiPoints}
          </span>
        </button>
      </div>

      {/* TAB PIXEL VANGUARD: ĐỔI NHÂN VẬT, GACHA & NÂNG CẤP VĨNH VIỄN */}
      {activeTab === "pixel_vanguard" && (
        <div className="space-y-6">
          {/* Gacha Box Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold">
                <Gift className="w-3.5 h-3.5" />
                <span>Gói Random Nhân Vật Pixel Vanguard · Điểm kiếm được từ học tập</span>
              </span>
              <h3 className="text-xl font-black">
                Mở Hộp Anh Hùng Bí Ẩn ({PV_GACHA_COST} Xu / lượt)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tỉ lệ: <strong>Mặc định/Hiếm 60% • Sử thi 30% • Huyền thoại 10%</strong>. Bảo hiểm{" "}
                <strong className="text-amber-300 font-mono">
                  {pvProfile.pityCounter}/{PV_PITY_THRESHOLD}
                </strong>{" "}
                lần quay chắc chắn ra nhân vật chưa sở hữu. Nếu trùng hoàn ngay <strong>45 Xu + 1 Mảnh Tướng</strong> (Đang có{" "}
                <strong className="text-purple-300 font-mono">{pvProfile.heroFragments}/3</strong> mảnh).
              </p>
              <button
                type="button"
                onClick={() => {
                  const coins = progress.coins || 0;
                  if (coins < PV_GACHA_COST) {
                    triggerSuccess(`Em cần ${PV_GACHA_COST} Xu Trí Tuệ để mở Hộp Anh Hùng Bí Ẩn!`);
                    return;
                  }
                  const res = rollPVHeroGacha(pvProfile);
                  const netCost = PV_GACHA_COST - res.refundCoins;
                  onUpdateProgress({ coins: Math.max(0, coins - netCost) });
                  setPvProfile(res.updatedProfile);
                  setPvGachaResult(res);
                  triggerSuccess(
                    res.isDuplicate
                      ? `Quay trúng ${res.hero.vietnameseName} (Đã có) -> Hoàn +${res.refundCoins} Xu và +1 Mảnh Tướng!`
                      : `Chúc mừng! Em đã mở khoá chiến binh mới: ${res.hero.vietnameseName}!`
                  );
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-black inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Gift className="w-4 h-4" />
                <span>Quay Ngay ({PV_GACHA_COST} Xu Trí Tuệ)</span>
              </button>
            </div>

            <div className="md:col-span-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[150px]">
              {pvGachaResult ? (
                <div className="space-y-2">
                  <HeroPixelAvatar
                    heroId={pvGachaResult.hero.id}
                    accentColor={pvGachaResult.hero.accentColor}
                    size={56}
                  />
                  <p className="text-sm font-black text-amber-300">
                    {pvGachaResult.hero.vietnameseName}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {pvGachaResult.isDuplicate
                      ? `Trùng (+${pvGachaResult.refundCoins} Xu và +1 Mảnh)`
                      : "Chiến binh mới đã sẵn sàng!"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Đã sở hữu <strong>{pvProfile.unlocked.length}/10</strong> chiến binh Pixel Vanguard.
                </p>
              )}
            </div>
          </div>

          {/* 10 Heroes Grid */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-display font-black text-base text-slate-900">
                  Danh sách 10 chiến binh Pixel Vanguard
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đổi nhân vật bằng Xu Trí Tuệ (Điểm kiếm được từ học tập) và vào trận ngay lập tức.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem("smart_study_return_to_game", "pixel-vanguard");
                    } catch {}
                    onNavigateTab("games");
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Quay lại chơi Pixel Vanguard</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PV_HERO_CATALOG.map((hero) => {
                const isOwned = pvProfile.unlocked.includes(hero.id);
                const isSelected = pvProfile.selectedHero === hero.id;
                const isHighlighted = highlightedPvHeroId === hero.id;
                return (
                  <div
                    key={hero.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40"
                        : isHighlighted
                        ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/50"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <HeroPixelAvatar
                        heroId={hero.id}
                        accentColor={hero.accentColor}
                        size={52}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm font-black text-slate-900">
                            {hero.vietnameseName}
                          </h5>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${hero.badgeBg}`}
                          >
                            {hero.rarityLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{hero.title}</p>
                        <p className="text-[11px] text-slate-700">
                          <strong>Kỹ năng:</strong> {hero.skillName} — {hero.skillDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {isOwned ? "Đã mở khoá" : `${hero.priceCoins} Xu`}
                      </span>
                      <button
                        type="button"
                        disabled={isSelected}
                        onClick={() => {
                          if (isOwned) {
                            const updated = savePVProfile({
                              ...pvProfile,
                              selectedHero: hero.id,
                            });
                            setPvProfile(updated);
                            triggerSuccess(`Đã trang bị ${hero.vietnameseName} cho Pixel Vanguard!`);
                            return;
                          }
                          const coins = progress.coins || 0;
                          if (coins < hero.priceCoins) {
                            triggerSuccess(`Em cần thêm ${hero.priceCoins - coins} Xu Trí Tuệ để mở khoá ${hero.vietnameseName}!`);
                            return;
                          }
                          onUpdateProgress({ coins: coins - hero.priceCoins });
                          const updated = savePVProfile(
                            addPVTransaction(
                              {
                                ...pvProfile,
                                unlocked: [...pvProfile.unlocked, hero.id],
                                selectedHero: hero.id,
                              },
                              "spend",
                              hero.priceCoins,
                              `Mở khoá ${hero.vietnameseName} tại Cửa hàng`
                            )
                          );
                          setPvProfile(updated);
                          triggerSuccess(`Đã mở khoá và chọn ${hero.vietnameseName}!`);
                        }}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white cursor-default"
                            : isOwned
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        }`}
                      >
                        {isSelected
                          ? "Đang trang bị"
                          : isOwned
                          ? "Chọn nhân vật"
                          : `Mở khoá (${hero.priceCoins} Xu)`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permanent Upgrades */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <h4 className="font-display font-black text-base text-slate-900">
              Nâng cấp chỉ số vĩnh viễn trong hầm ngục
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PV_UPGRADE_METAS.map((up) => {
                const lv = pvProfile.upgrades[up.key as keyof PVUpgrades] || 0;
                const isMax = lv >= 3;
                const cost = isMax ? 0 : up.costs[lv];
                return (
                  <div
                    key={up.key}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {up.name} (Cấp {lv}/3)
                      </p>
                      <p className="text-xs text-slate-600">{up.effectPerLevel}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isMax}
                      onClick={() => {
                        if (isMax) return;
                        const coins = progress.coins || 0;
                        if (coins < cost) {
                          triggerSuccess(`Cần ${cost} Xu Trí Tuệ để nâng cấp ${up.name}!`);
                          return;
                        }
                        onUpdateProgress({ coins: coins - cost });
                        const updated = savePVProfile(
                          addPVTransaction(
                            {
                              ...pvProfile,
                              upgrades: {
                                ...pvProfile.upgrades,
                                [up.key]: lv + 1,
                              },
                            },
                            "spend",
                            cost,
                            `Nâng cấp ${up.name} Cấp ${lv + 1}`
                          )
                        );
                        setPvProfile(updated);
                        triggerSuccess(`Đã nâng cấp ${up.name} lên Cấp ${lv + 1}/3!`);
                      }}
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 ${
                        isMax
                          ? "bg-emerald-100 text-emerald-800 cursor-default"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isMax ? "Đã tối đa" : `Nâng (${cost} Xu)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ITEMS AND PET FEEDING */}
      {activeTab === "items" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Shop Inventory & Companion feeding */}
          <div className="space-y-6 lg:col-span-1">
            {/* Companion Interaction Screen */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Linh thú đồng hành</span>

              {/* Living Mascot Avatar Box with Equipped Outfit */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 bg-slate-100 rounded-2xl animate-pulse" />
                {isFeeding && (
                  <div className="absolute inset-0 bg-blue-100/80 rounded-2xl z-10 flex items-center justify-center text-5xl animate-bounce">
                    <ShopItemIcon itemId={isFeeding} emoji={SHOP_ITEMS.find(i => i.id === isFeeding)?.emoji} size={72} />
                  </div>
                )}
                <div className="relative z-0 transition-transform duration-300 hover:scale-105 flex items-center justify-center">
                  {getMascotComponent(effectiveMascotIdx, 120, currentPet.stageNum, currentEquippedOutfit)}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-slate-900">{currentPet.title}</h3>
                <p className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full inline-block">Cấp Tiến Hóa {currentPet.stageNum}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed px-4 font-medium">
                "{currentPet.description}"
              </p>

              {/* Current Outfit Info & Shortcut */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đồ: {getOutfitById(currentEquippedOutfit).name}</span>
                </span>
                <button
                  onClick={() => setActiveTab("outfits")}
                  className="min-h-6 py-1 text-[11px] font-extrabold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
                >
                  Đổi trang phục →
                </button>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 flex items-center gap-2 justify-center font-semibold">
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Cho ăn để bứt phá thêm điểm kinh nghiệm!</span>
              </div>
            </div>

            {/* User Food Inventory */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-900 text-sm">Thức ăn trữ sẵn</h3>
                <span className="text-[11px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-slate-700">
                  Tổng cộng: {Object.values(inventory).reduce((a, b) => a + b, 0)} món
                </span>
              </div>

              <div className="space-y-2.5">
                {SHOP_ITEMS.map((item) => {
                  const count = inventory[item.id] || 0;
                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        count > 0 
                          ? "border-sky-200/80 bg-sky-100/90 shadow-sm" 
                          : "border-sky-200/40 bg-sky-100/40 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl bg-sky-200/70 w-10 h-10 rounded-xl flex items-center justify-center border border-sky-300/60">
                          <ShopItemIcon itemId={item.id} emoji={item.emoji} size={30} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-sky-950">{item.name}</p>
                          <p className="text-[10px] text-sky-700 font-bold">+{item.xpBoost} XP khi sử dụng</p>
                        </div>
                      </div>

                      <div>
                        {count > 0 ? (
                          <button
                            onClick={() => handleUseItem(item.id, item.xpBoost, item.name, item.emoji)}
                            disabled={isFeeding !== null}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            Cho ăn x{count}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 px-2">Hết đồ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Food Market Stall & Attendance */}
          <div className="space-y-6 lg:col-span-2">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-3xl shadow-xs shrink-0">
                  📅
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm">Điểm danh ngày mới nhận Xu</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">Mỗi ngày ghé thăm học tập được tặng ngay <span className="font-bold text-amber-700">+25 Xu Trí Tuệ</span>!</p>
                </div>
              </div>

              <div>
                {hasCheckedIn ? (
                  <div className="px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-extrabold text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Đã nhận hôm nay!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap rounded-xl shadow-xs transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  >
                    Điểm danh nhận Xu
                  </button>
                )}
              </div>
            </div>

            {/* Shop Catalog Grid */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <span>Kệ thức ăn linh thú</span>
                </h3>
                <p className="text-xs text-slate-500">Mua sắm vật phẩm dinh dưỡng đổi lấy điểm kinh nghiệm thăng tiến vượt bậc.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SHOP_ITEMS.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        isSelected 
                          ? "border-sky-500 bg-sky-200/80 shadow-md scale-[1.01]" 
                          : "border-sky-200/80 hover:border-sky-300 bg-sky-100/90"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <ShopItemIcon itemId={item.id} emoji={item.emoji} size={44} />
                          <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-black text-amber-700 shadow-sm">
                            <Coins className="w-3.5 h-3.5 fill-amber-300" />
                            <span>{item.price} Xu</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-display font-black text-sky-950 text-xs">{item.name}</h4>
                          <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-sky-200/60">
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-200/70 px-2 py-0.5 rounded">+{item.xpBoost} XP</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyItem(item);
                          }}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Mua ngay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected item detail panel */}
              {selectedItem && (
                <div className="p-4 bg-sky-200/60 border border-sky-300/60 rounded-2xl space-y-3.5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <ShopItemIcon itemId={selectedItem.id} emoji={selectedItem.emoji} size={44} />
                    <div>
                      <h5 className="text-xs font-black text-sky-950">{selectedItem.name}</h5>
                      <p className="text-[10px] text-slate-600">Trị giá: <strong className="text-amber-700">{selectedItem.price} Xu</strong> • Công dụng: <strong className="text-sky-800">+{selectedItem.xpBoost} XP</strong></p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {selectedItem.longDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Gamification tips */}
            <div className="p-5 bg-sky-200/50 border border-sky-300/60 rounded-2xl flex items-start gap-3.5 text-xs text-sky-950 leading-relaxed">
              <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Mẹo kiếm thật nhiều Xu Trí Tuệ:</p>
                <ul className="list-disc pl-4 space-y-1 text-sky-900 font-medium text-[11px]">
                  <li>Biên soạn và ghim bài học bất kỳ tăng ngay <strong className="text-sky-950 font-bold">+15 Xu</strong>.</li>
                  <li>Làm bài kiểm tra trắc nghiệm, mỗi câu đúng tăng ngay <strong className="text-sky-950 font-bold">+5 Xu</strong>.</li>
                  <li>Nếu hoàn thành xuất sắc đạt điểm tuyệt đối 100%, nhận thêm thưởng <strong className="text-sky-950 font-bold">+30 Xu</strong> tuyệt đỉnh!</li>
                  <li>Vượt qua đấu trường PK chiến thắng đối thủ nhận hàng chục xu thưởng khổng lồ!</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: MASCOT OUTFITS & WARDROBE */}
      {activeTab === "outfits" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: PHÒNG THỬ ĐỒ CHIBI (FITTING ROOM STAGE) - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="edu-card border border-sky-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-200/30 via-transparent to-sky-100/40 pointer-events-none" />
              
              {/* Header Badge */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-sky-200/80 text-sky-900 border border-sky-300/60 px-3 py-1 rounded-full">
                  Phòng thử đồ mascot
                </span>
                <span className="text-[11px] font-extrabold text-sky-850 flex items-center gap-1 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <Coins className="w-3.5 h-3.5 fill-amber-300 text-amber-600" />
                  <span>{progress.coins || 0} Xu</span>
                </span>
              </div>

              {/* Pedestal & Mascot Stage */}
              <div className="relative w-48 h-48 my-3 flex items-center justify-center">
                {/* Glowing Aura Ring */}
                <div className="absolute inset-0 rounded-full bg-sky-200/70 blur-xl animate-pulse" />
                <div className="absolute -bottom-2 w-36 h-8 bg-sky-300/40 rounded-[50%] blur-xs" />
                
                {/* 3D Mascot Living Chibi with preview outfit */}
                <div className="relative z-10 transition-transform duration-300 hover:scale-110">
                  {/* Mèo cấp 1-2 có ảnh mặc thử thật cho từng bộ đồ */}
                  {effectiveMascotIdx === 0 && currentPet.stageNum <= 2 && previewOutfitId !== "default" && getOutfitPreviewSrc(previewOutfitId) ? (
                    <img src={getOutfitPreviewSrc(previewOutfitId)!} alt="" draggable={false} className="w-[150px] h-[150px] object-contain drop-shadow-[0_4px_6px_rgba(15,23,42,0.18)]" />
                  ) : getMascotComponent(
                    effectiveMascotIdx,
                    150,
                    currentPet.stageNum,
                    previewOutfitId
                  )}
                </div>
              </div>

              {/* Current Previewed Outfit Info */}
              {(() => {
                const previewOutfit = getOutfitById(previewOutfitId);
                const isOwned = unlockedOutfits.includes(previewOutfit.id);
                const isEquipped = currentEquippedOutfit === previewOutfit.id;
                const canAfford = (progress.coins || 0) >= previewOutfit.price;

                return (
                  <div className="w-full space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center gap-2">
                        {getOutfitIconSrc(previewOutfit.id) ? (
                          <img src={getOutfitIconSrc(previewOutfit.id)!} alt="" draggable={false} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-xl">{previewOutfit.iconSvg}</span>
                        )}
                        <h3 className="font-display font-black text-xl text-sky-950">
                          {previewOutfit.name}
                        </h3>
                        {/* Rarity Pill */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${previewOutfit.badgeBorder} ${previewOutfit.badgeBg} ${previewOutfit.textColor}`}>
                          {previewOutfit.rarity}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-sky-700 italic">
                        "{previewOutfit.tagline}"
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed px-2 font-medium">
                      {previewOutfit.description}
                    </p>

                    {/* Stat Buff Pill */}
                    <div className="p-3 bg-sky-100/90 border border-sky-200/80 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-sky-900">
                      <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{previewOutfit.statBoost}</span>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isEquipped ? (
                        <div className="w-full py-3.5 bg-emerald-100 border border-emerald-300 text-emerald-850 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-2xs">
                          <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
                          <span>Đang diện trên mascot</span>
                        </div>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleEquipOutfit(previewOutfit.id)}
                          className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Shirt className="w-4 h-4" />
                          <span>Mặc cho mascot</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyOutfit(previewOutfit)}
                          disabled={!canAfford}
                          className={`w-full py-3.5 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                            canAfford 
                              ? "bg-amber-500 hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
                              : "bg-slate-400 opacity-70 cursor-not-allowed"
                          }`}
                        >
                          <Coins className="w-4 h-4 fill-amber-200" />
                          <span>
                            {canAfford 
                              ? `Mua Bằng ${previewOutfit.price} Xu` 
                              : `Thiếu ${previewOutfit.price - (progress.coins || 0)} Xu (Giá: ${previewOutfit.price} Xu)`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Quick Mascot Wardrobe Tips */}
            <div className="p-5 bg-sky-200/50 border border-sky-300/60 rounded-2xl text-xs text-sky-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-900">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Quyền lợi trang phục mascot</span>
              </div>
              <p className="text-[11px] text-sky-850 leading-relaxed">
                Trang phục đã mua thuộc quyền sở hữu vĩnh viễn của em! Em có thể thoải mái thay đổi bất cứ lúc nào để linh thú đồng hành luôn nổi bật trên bảng xếp hạng và đấu trường.
              </p>
            </div>
          </div>

          {/* RIGHT: BỘ SƯU TẬP TRANG PHỤC & BỘ LỌC (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="edu-card border border-sky-200/80 rounded-[2.5rem] p-6 sm:p-7 shadow-sm space-y-6">
              
              {/* Top Header & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-black text-sky-950 text-lg flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-sky-600" />
                    <span>Bộ sưu tập thời trang học đường</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đã sở hữu: <strong className="text-sky-700 font-extrabold">{unlockedOutfits.length}/{MASCOT_OUTFITS.length}</strong> bộ
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-sky-200/70 p-1 rounded-2xl border border-sky-300/60 self-start sm:self-auto overflow-x-auto max-w-full">
                  {[
                    { id: "all", label: "Tất Cả" },
                    { id: "owned", label: "Đã Có" },
                    { id: "hat", label: "Mũ Nón" },
                    { id: "robe", label: "Áo Choàng" },
                    { id: "special", label: "Đặc Biệt" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOutfitFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        outfitFilter === tab.id
                          ? "bg-sky-600 text-white shadow-xs"
                          : "text-sky-900/70 hover:text-sky-950"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Outfit Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MASCOT_OUTFITS
                  .filter(outfit => {
                    if (outfitFilter === "owned") return unlockedOutfits.includes(outfit.id);
                    if (outfitFilter === "hat") return outfit.category === "hat";
                    if (outfitFilter === "robe") return outfit.category === "robe";
                    if (outfitFilter === "special") return outfit.category === "special";
                    return true;
                  })
                  .map((outfit) => {
                    const isSelected = previewOutfitId === outfit.id;
                    const isOwned = unlockedOutfits.includes(outfit.id);
                    const isEquipped = currentEquippedOutfit === outfit.id;

                    return (
                      <div
                        key={outfit.id}
                        onClick={() => setPreviewOutfitId(outfit.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                          isSelected 
                            ? "border-sky-500 bg-sky-200/70 shadow-md scale-[1.01]" 
                            : "border-sky-200/80 hover:border-sky-300 bg-sky-100/90"
                        }`}
                      >
                        {/* Top Header inside card */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {/* Mini Mascot Preview Wearing this Outfit */}
                              <div className="w-12 h-12 rounded-xl bg-sky-200/80 border border-sky-300/70 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                                <img src={getOutfitPreviewSrc(outfit.id) || getPetImageSrc(selectedAvatarIdx, 1)} alt="" draggable={false} className="w-11 h-11 object-contain" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-sky-950 flex items-center gap-1">
                                  <span>{outfit.name}</span>
                                </h4>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 border ${outfit.badgeBorder} ${outfit.badgeBg} ${outfit.textColor}`}>
                                  {outfit.rarity}
                                </span>
                              </div>
                            </div>

                            {/* Status or Price Tag */}
                            {isEquipped ? (
                              <span className="px-2 py-1 bg-emerald-100 border border-emerald-300 text-emerald-850 rounded-xl text-[10px] font-black flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Đang mặc</span>
                              </span>
                            ) : isOwned ? (
                              <span className="px-2 py-1 bg-sky-100 border border-sky-300 text-sky-850 rounded-xl text-[10px] font-black">
                                Đã có
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-200 px-2 py-1 rounded-xl text-xs font-black text-amber-700 shadow-2xs">
                                <Coins className="w-3.5 h-3.5 fill-amber-300 text-amber-500" />
                                <span>{outfit.price}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {outfit.description}
                          </p>
                        </div>

                        {/* Card Footer Button */}
                        <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-700 truncate max-w-[140px]">
                            {outfit.statBoost}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEquipped) return;
                              if (isOwned) {
                                handleEquipOutfit(outfit.id);
                              } else {
                                handleBuyOutfit(outfit);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                              isEquipped 
                                ? "bg-emerald-600 text-white cursor-default" 
                                : isOwned 
                                  ? "bg-sky-600 hover:bg-sky-700 text-white shadow-2xs" 
                                  : (progress.coins || 0) >= outfit.price 
                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-2xs" 
                                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                            }`}
                          >
                            {isEquipped ? "Đang mặc" : isOwned ? "Mặc ngay" : "Mua ngay"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GACHA MAGIC CARDS */}
      {activeTab === "magic_cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Owned Magical Cards Inventory */}
          <div className="space-y-6 lg:col-span-1">
            <div className="edu-card border border-sky-200/80 rounded-[2rem] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-600" />
                  <h3 className="font-display font-black text-sky-950 text-sm">Kho bài ma thuật</h3>
                </div>
                <span className="text-[10px] bg-sky-200/80 text-sky-900 border border-sky-300/60 px-2.5 py-0.5 rounded-full font-bold">
                  Sở hữu: {Object.values(magicCardsInventory).reduce((a, b) => a + b, 0)} lá
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Các lá bài ma thuật đã bóc sẽ hiển thị trong đấu trường PK. Em có thể kích hoạt chúng để giành lợi thế đảo ngược thế cờ!
              </p>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {MAGIC_CARDS.map((card) => {
                  const qty = magicCardsInventory[card.id] || 0;
                  return (
                    <div 
                      key={card.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 relative overflow-hidden ${
                        qty > 0 
                          ? "border-sky-200/80 bg-sky-100/90 shadow-sm" 
                          : "border-sky-200/40 bg-sky-100/40 opacity-55"
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-sky-600" />
                      
                      <div className="text-3xl bg-sky-200/70 w-11 h-11 rounded-2xl flex items-center justify-center border border-sky-300/60 shrink-0 shadow-inner">
                        {card.emoji}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-sky-950 truncate">{card.name}</h4>
                          <span className="text-[10px] font-black text-sky-700 shrink-0 bg-sky-200/80 px-1.5 py-0.2 rounded">
                            x{qty}
                          </span>
                        </div>
                        <p className={`text-[9px] font-bold ${card.colorClass}`}>{card.tierLabel}</p>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 mt-0.5 mb-1">
                          <span className="bg-sky-200/70 px-1.5 py-0.5 rounded border border-sky-300/60 flex items-center gap-0.5">💪 Lực: {card.power}</span>
                          <span className="bg-amber-50/80 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">⏳ Hồi: {card.cooldownRounds}v</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight font-medium">{card.description}</p>
                        <p className="text-[9.5px] text-sky-900 bg-sky-200/60 p-1.5 rounded-lg border border-sky-300/60 mt-1 font-semibold leading-normal">
                          <strong>Tác dụng:</strong> {card.effect}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Gacha Stall Pack buying */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Gacha packs grid */}
            <div className="edu-card border border-sky-200/80 rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-sky-950 text-base flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sky-600" />
                    <span>Quầy thẻ phép thuật ngẫu nhiên</span>
                  </h3>
                  <p className="text-xs text-slate-500">Chọn một gói thẻ phù hợp với túi tiền. Từng gói sẽ tăng cơ hội trúng các lá cực hiếm!</p>
                </div>

                <button
                  onClick={() => setIsSoundOn(!isSoundOn)}
                  className="p-2 hover:bg-sky-200/80 rounded-xl transition-colors border border-sky-300/60"
                  title="Bật/Tắt âm thanh bóc thẻ"
                >
                  {isSoundOn ? <Volume2 className="w-4 h-4 text-sky-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CARD_PACKS.map((pack) => {
                  const isSelected = selectedPack?.id === pack.id;
                  return (
                    <div 
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-4.5 rounded-[1.75rem] border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        isSelected 
                          ? "border-sky-500 bg-sky-200/80 shadow-md scale-[1.01]" 
                          : "border-sky-200/80 hover:border-sky-300 bg-sky-100/90"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-4xl">{pack.emoji}</span>
                          <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-3 py-1 rounded-xl text-xs font-black text-amber-700 shadow-sm">
                            <Coins className="w-3.5 h-3.5 fill-amber-300 animate-spin-slow" />
                            <span>{pack.price} Xu</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-black text-sky-950 text-xs">{pack.name}</h4>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${pack.badgeColor}`}>
                              {pack.cardCount} Lá
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{pack.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-sky-200/60">
                        <span className="text-[9px] font-bold text-sky-700 bg-sky-200/70 px-2 py-0.5 rounded">Rút {pack.cardCount} Lá Bài</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPack(pack);
                          }}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Bóc thẻ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Pack detail & probabilities panel */}
              {selectedPack && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedPack.emoji}</span>
                    <div>
                      <h5 className="text-xs font-black text-slate-850">{selectedPack.name}</h5>
                      <p className="text-[10px] text-slate-450 font-bold">Số lượng: <strong className="text-fuchsia-600 font-extrabold">{selectedPack.cardCount} Lá Bài</strong> • Giá: <strong className="text-amber-600 font-extrabold">{selectedPack.price} Xu</strong></p>
                  </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {selectedPack.longDesc}
                  </p>

                  {/* Probabilities panel */}
                  <div className="border-t border-slate-150 pt-3">
                    <h6 className="text-[9.5px] font-black text-slate-450 uppercase tracking-wider mb-2">TỶ LỆ BỐC RA THẺ (probability rates)</h6>
                    <div className="grid grid-cols-6 gap-1 text-center font-bold">
                      <div className="bg-amber-100/50 p-1 rounded">
                        <p className="text-[8px] text-amber-800">Đồng</p>
                        <p className="text-[10px] text-amber-950 font-black">{selectedPack.rates.dong}%</p>
                    </div>
                      <div className="bg-slate-100 p-1 rounded">
                        <p className="text-[8px] text-slate-600">Sắt</p>
                        <p className="text-[10px] text-slate-900 font-black">{selectedPack.rates.sat}%</p>
                    </div>
                      <div className="bg-sky-100/50 p-1 rounded">
                        <p className="text-[8px] text-sky-800">Bạc</p>
                        <p className="text-[10px] text-sky-950 font-black">{selectedPack.rates.bac}%</p>
                    </div>
                      <div className="bg-yellow-100/60 p-1 rounded">
                        <p className="text-[8px] text-yellow-800">Vàng</p>
                        <p className="text-[10px] text-yellow-950 font-black">{selectedPack.rates.vang}%</p>
                    </div>
                      <div className="bg-indigo-100/50 p-1 rounded">
                        <p className="text-[8px] text-indigo-800">K.Cương</p>
                        <p className="text-[10px] text-indigo-950 font-black">{selectedPack.rates.kimcuong}%</p>
                    </div>
                      <div className="bg-fuchsia-100/50 p-1 rounded animate-pulse">
                        <p className="text-[8px] text-fuchsia-800">Bảy Màu</p>
                        <p className="text-[10px] text-fuchsia-950 font-black">{selectedPack.rates.baymau}%</p>
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>

            {/* Arena Rules for Magic Cards */}
            <div className="p-5 bg-fuchsia-50/20 border border-fuchsia-100/50 rounded-2xl flex items-start gap-3.5 text-xs text-fuchsia-950 leading-relaxed">
              <Zap className="w-5 h-5 text-fuchsia-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <p className="font-bold">Luật sử dụng Thẻ ma thuật trong đấu trường PK:</p>
                <ul className="list-disc pl-4 space-y-1 text-fuchsia-850/90 font-medium text-[11px]">
                  <li>Trong mỗi lượt câu hỏi PK, em có thể chọn và sử dụng <strong className="text-fuchsia-900">1 lá bài ma thuật</strong> đang sở hữu.</li>
                  <li>Lá bài sẽ được tiêu thụ ngay khi kích hoạt và áp dụng hiệu ứng thần diệu lập tức.</li>
                  <li><strong>Riêng Lá Đóng Băng (❄️):</strong> Chỉ được dùng <strong className="text-fuchsia-900">tối đa 1 lần duy nhất trong toàn trận đấu</strong>, đảm bảo tính công bằng kịch tính.</li>
                  <li>Hãy tích lũy thật nhiều thẻ để sẵn sàng chiến đấu hạ gục bất kỳ đối thủ sừng sỏ nào!</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ĐỔI QUÀ BẰNG ĐIỂM THƯỞNG ASCII (CHUYỂN TỪ THEME SHOP SANG ĐÂY)
          ========================================================================= */}
      {activeTab === "ascii_redeem" && (
        <div className="space-y-8 animate-fade-in">
          {/* Hero Banner for ASCII Points */}
          <div className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-sky-400/30">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold">
                  <Gift className="w-3.5 h-3.5 text-sky-300" />
                  <span>Kho đổi quà bằng điểm ASCII</span>
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
                  Đổi điểm ASCII lấy Xu và quà
                </h3>
                <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                  Tất cả điểm tích lũy khi em chăm chỉ học tập và trò chuyện cùng Trợ lý AI Studio được quy đổi thành <strong className="text-amber-300">Xu Trí Tuệ</strong>, <strong className="text-sky-300">Gói Thẻ Ma Thuật</strong> và <strong className="text-emerald-300">Thần Dược Linh Thú</strong> ngay tại đây.
                </p>
              </div>

              {/* Current Points Display Card */}
              <div className="bg-white/12 backdrop-blur-xl border border-white/25 rounded-2xl p-5 min-w-[210px] text-center shrink-0 shadow-lg">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-200 block">
                  Điểm ASCII của em
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight mt-1 tabular-nums flex items-center justify-center gap-2">
                  <span className="text-amber-300">✦</span>
                  <span>{asciiPoints.toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-sky-200/80 mt-1 block font-medium">
                  Điểm sẵn sàng để quy đổi
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 1: QUY ĐỔI SANG XU TRÍ TUỆ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500 fill-amber-300" />
                  <span>1. Quy đổi điểm ASCII sang Xu Trí Tuệ</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đổi điểm thưởng lấy Xu để tự do mua sắm trang phục, thức ăn và bóc thẻ theo ý muốn.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl shrink-0 self-start sm:self-center">
                Số dư: {progress.coins || 0} Xu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tier 1: 500 pts -> 50 Xu */}
              <div className="p-4.5 rounded-2xl border border-slate-200 hover:border-sky-300 bg-slate-50/70 hover:bg-white transition-all flex flex-col justify-between space-y-4 shadow-2xs group">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">🪙</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Gói Khởi Động
                    </span>
                  </div>
                  <h5 className="font-display font-black text-xl text-slate-900">+50 Xu Trí Tuệ</h5>
                  <p className="text-xs text-slate-500">Phù hợp đổi nhanh khi cần thêm vài chục xu mua bánh quy.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemCoinsWithAscii(500, 50)}
                  disabled={asciiPoints < 500}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <span>Đổi · ✦ 500 pts</span>
                </button>
              </div>

              {/* Tier 2: 1,000 pts -> 110 Xu */}
              <div className="p-4.5 rounded-2xl border border-sky-200 hover:border-sky-400 bg-sky-50/50 hover:bg-white transition-all flex flex-col justify-between space-y-4 shadow-2xs group relative">
                <span className="absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                  Thưởng +10%
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">💰</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      Gói Thông Thái
                    </span>
                  </div>
                  <h5 className="font-display font-black text-xl text-sky-950">+110 Xu Trí Tuệ</h5>
                  <p className="text-xs text-slate-500">Được tặng thêm 10 xu thưởng ưu đãi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemCoinsWithAscii(1000, 110)}
                  disabled={asciiPoints < 1000}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <span>Đổi · ✦ 1,000 pts</span>
                </button>
              </div>

              {/* Tier 3: 2,500 pts -> 300 Xu */}
              <div className="p-4.5 rounded-2xl border border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-white transition-all flex flex-col justify-between space-y-4 shadow-2xs group relative">
                <span className="absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                  Thưởng +20%
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">💎</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Gói Hoàng Kim
                    </span>
                  </div>
                  <h5 className="font-display font-black text-xl text-indigo-950">+300 Xu Trí Tuệ</h5>
                  <p className="text-xs text-slate-500">Đủ xu để mua ngay 2 gói thẻ ma thuật cao cấp!</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemCoinsWithAscii(2500, 300)}
                  disabled={asciiPoints < 2500}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <span>Đổi · ✦ 2,500 pts</span>
                </button>
              </div>

              {/* Tier 4: 5,000 pts -> 700 Xu */}
              <div className="p-4.5 rounded-2xl border-2 border-amber-300 hover:border-amber-400 bg-amber-50/60 hover:bg-white transition-all flex flex-col justify-between space-y-4 shadow-md group relative">
                <span className="absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs animate-pulse">
                  VIP Thưởng +40%
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">👑</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Đại Phú Tri Thức
                    </span>
                  </div>
                  <h5 className="font-display font-black text-xl text-amber-950">+700 Xu Trí Tuệ</h5>
                  <p className="text-xs text-slate-600">Gói siêu khủng giúp tích lũy tài sản khổng lồ.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemCoinsWithAscii(5000, 700)}
                  disabled={asciiPoints < 5000}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                >
                  <span>Đổi · ✦ 5,000 pts</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: ĐỔI GÓI THẺ MA THUẬT BẰNG ĐIỂM ASCII */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-fuchsia-600" />
                  <span>2. Đổi trực tiếp gói thẻ ma thuật Đấu trường PK</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dùng điểm ASCII mở ngay lá bài ma thuật độc quyền không tốn Xu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pack 1: Sắt */}
              <div className="p-4.5 rounded-2xl border border-slate-300 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">📦🔩</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">1 Lá Bài</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-slate-900">Gói Thẻ Sắt</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2">Tăng tỷ lệ nhận thẻ Che Màn Hình sương mù cho đấu trường PK.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemPackWithAscii(1500, "pack_sat", "Gói Thẻ Sắt")}
                  disabled={asciiPoints < 1500}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Mở Ngay · ✦ 1,500 pts
                </button>
              </div>

              {/* Pack 2: Bạc */}
              <div className="p-4.5 rounded-2xl border border-sky-300 bg-sky-50/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">📦🥈</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">1 Lá Bài</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-sky-950">Gói Thẻ Bạc</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2">Cơ hội nhận thẻ khống chế Đóng Băng và Gây Khó đối thủ.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemPackWithAscii(2500, "pack_bac", "Gói Thẻ Bạc")}
                  disabled={asciiPoints < 2500}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Mở Ngay · ✦ 2,500 pts
                </button>
              </div>

              {/* Pack 3: Vàng */}
              <div className="p-4.5 rounded-2xl border border-amber-300 bg-amber-50/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">📦👑</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">2 Lá Bài</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-amber-950">Gói Thẻ Vàng</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2">Gói cao cấp chứa 2 lá, cơ hội trúng thẻ Epic cực đại.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemPackWithAscii(5000, "pack_vang", "Gói Thẻ Vàng")}
                  disabled={asciiPoints < 5000}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Mở Ngay · ✦ 5,000 pts
                </button>
              </div>

              {/* Pack 4: Kim Cương */}
              <div className="p-4.5 rounded-2xl border-2 border-indigo-400 bg-indigo-50/70 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">📦💎</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">2 Lá VIP</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-indigo-950">Gói Kim Cương</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2">Chứa 2 lá siêu phẩm Legendary và Nhân Hệ Số 2.0.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemPackWithAscii(9000, "pack_kimcuong", "Gói Kim Cương")}
                  disabled={asciiPoints < 9000}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  Mở Ngay · ✦ 9,000 pts
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: ĐỔI THỨC ĂN & THẦN DƯỢC LINH THÚ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  <span>3. Đổi thức ăn giúp linh thú lên cấp nhanh</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vật phẩm được cộng trực tiếp vào Kho Đồ để cho linh thú ăn tăng XP bứt phá.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Item 1: 3x Bánh quy */}
              <div className="p-4.5 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">🍪</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Combo 3 cái</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-slate-900">3x Bánh Quy Thơm Ngon</h5>
                  <p className="text-xs text-slate-500">Cho linh thú ăn nhận ngay +15 XP bồi dưỡng.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemItemWithAscii(800, "cookie", "Bánh Quy", 3)}
                  disabled={asciiPoints < 800}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Đổi combo · ✦ 800 pts
                </button>
              </div>

              {/* Item 2: 2x Thuốc phép */}
              <div className="p-4.5 rounded-2xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">🧪</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">Combo 2 lọ</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-slate-900">2x Thuốc Phép Ma Thuật</h5>
                  <p className="text-xs text-slate-500">Thuốc phép tăng điểm kinh nghiệm cực mạnh +160 XP!</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemItemWithAscii(1800, "elixir", "Thuốc Phép", 2)}
                  disabled={asciiPoints < 1800}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Đổi combo · ✦ 1,800 pts
                </button>
              </div>

              {/* Item 3: 1x Vương miện */}
              <div className="p-4.5 rounded-2xl border border-yellow-300 bg-yellow-50/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">👑</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-200 text-yellow-900">Siêu Phẩm</span>
                  </div>
                  <h5 className="font-display font-black text-sm text-slate-900">1x Vương Miện Hoàng Gia</h5>
                  <p className="text-xs text-slate-500">Vật phẩm quý tộc tăng vọt +300 XP cho linh thú đồng hành.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRedeemItemWithAscii(4000, "crown", "Vương Miện", 1)}
                  disabled={asciiPoints < 4000}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Đổi ngay · ✦ 4,000 pts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* GACHA UNBOXING FULL SCREEN ANIMATED OVERLAY */}
      <AnimatePresence>
        {unboxingStep !== "idle" && unboxingPack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
          >
            {/* Ambient dynamic background lighting */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />

            {/* STEP 1: SPINNING CARD PACK EMBLEM */}
            {unboxingStep === "spinning" && (
              <div className="text-center space-y-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                  className="text-8xl select-none"
                >
                  {unboxingPack.emoji.substring(0, 2)}
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display font-black text-xl text-fuchsia-300 uppercase tracking-widest"
                >
                  ĐANG BÓC THẺ {unboxingPack.name.toUpperCase()}...
                </motion.h3>
                <p className="text-slate-400 text-xs animate-pulse">Sức mạnh ma thuật đang tụ tụ tập!</p>
              </div>
            )}

            {/* STEP 2: REVEALING DRAWN CARDS */}
            {unboxingStep === "reveal" && unboxedCards[revealedCardIdx] && (
              <motion.div 
                key={revealedCardIdx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-center max-w-sm w-full space-y-6 flex flex-col items-center"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">
                    LÁ BÀI THỨ {revealedCardIdx + 1} / {unboxedCards.length}
                  </span>
                  <h3 className="font-display font-black text-2xl text-white">
                    Chúc mừng, em đã rút được!
                  </h3>
                </div>

                {/* The actual Card visual design */}
                <motion.div 
                  className={`w-64 h-96 rounded-[2.2rem] border-4 p-6 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl ${unboxedCards[revealedCardIdx].bgClass} ${unboxedCards[revealedCardIdx].borderClass}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Card sparkle shine */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-300/20 rounded-full blur-xl pointer-events-none" />

                  {/* Top line: Name and Tier */}
                  <div className="w-full text-center space-y-1 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100/90 border ${unboxedCards[revealedCardIdx].colorClass}`}>
                      {unboxedCards[revealedCardIdx].tierLabel}
                    </span>
                    <h4 className="font-display font-black text-sky-950 text-sm leading-tight mt-1.5">{unboxedCards[revealedCardIdx].name}</h4>
                    <div className="flex justify-center items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-sky-800 bg-sky-200/70 px-2 py-0.5 rounded-full border border-sky-300/80 flex items-center gap-0.5">
                        💪 Lực: {unboxedCards[revealedCardIdx].power}
                      </span>
                      <span className="text-[9px] font-bold text-amber-750 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                        ⏳ Hồi: {unboxedCards[revealedCardIdx].cooldownRounds}v
                      </span>
                  </div>
                  </div>

                  {/* Mid big Emoji */}
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="text-7xl drop-shadow-md select-none"
                  >
                    {unboxedCards[revealedCardIdx].emoji}
                  </motion.div>

                  {/* Bot Line: description & Arena effect */}
                  <div className="w-full space-y-2 mt-auto">
                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed px-1">
                      "{unboxedCards[revealedCardIdx].description}"
                    </p>
                    <div className="bg-sky-100/90 border border-sky-300 rounded-2xl p-2.5 text-[10.5px] text-sky-950 font-black leading-tight shadow-xs">
                      <p className="text-[9px] text-fuchsia-500 uppercase font-black tracking-wider mb-0.5">Hiệu ứng Đấu Trường PK</p>
                      {unboxedCards[revealedCardIdx].effect}
                  </div>
                  </div>
                </motion.div>

                {/* Continue / Next card control */}
                <div className="pt-2">
                  {revealedCardIdx < unboxedCards.length - 1 ? (
                    <button
                      onClick={() => {
                        const nextIdx = revealedCardIdx + 1;
                        setRevealedCardIdx(nextIdx);
                        playUnboxingChime(unboxedCards[nextIdx].tier);
                      }}
                      className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Rút lá tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setUnboxingStep("idle");
                        setUnboxingPack(null);
                        setUnboxedCards([]);
                      }}
                      className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer"
                    >
                      Thu cất vào kho đồ
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
