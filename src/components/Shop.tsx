import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Sparkles, 
  Check, 
  ShoppingBag, 
  AlertCircle,
  Gift,
  Trophy,
  Database,
  Layers,
  ChevronRight,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus
} from "lucide-react";
import { UserProgress, MagicCard } from "../types";
import { MAGIC_CARDS } from "../data";





import { getAvatarAtLevel, AVATAR_EVOLUTIONS } from "../lib/avatarEvolution";
import { motion, AnimatePresence } from "motion/react";

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
    longDesc: "Thích hợp để thử vận may ban đầu. Rút được 1 lá ma thuật ngẫu nhiên (tập trung ở Đồng & Sắt).",
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
    description: "Nhận thẻ khống chế Đóng Băng & Gây Khó.",
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
}

export default function Shop({ progress, onUpdateProgress, selectedAvatarIdx, triggerSuccess }: ShopProps) {
  const [activeTab, setActiveTab] = useState<"items" | "magic_cards">("items");

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
      triggerSuccess("⚠️ Em cần ít nhất 2 lá bài đặt vào lò luyện để dung hợp!");
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
      triggerSuccess(`✨ Dung hợp thành công! Em đã nhận được lá bài ${randomResult.name}!`);
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
    triggerSuccess(`🪙 Điểm danh thành công! Em nhận được +${coinsGained} Xu Trí Tuệ hôm nay.`);
  };

  const handleBuyItem = (item: ShopItem) => {
    const currentCoins = progress.coins || 0;
    if (currentCoins < item.price) {
      alert(`⚠️ Em không đủ Xu Trí Tuệ rồi! Hãy tích cực học tập để kiếm thêm xu nhé! (Cần thêm ${item.price - currentCoins} xu)`);
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

    triggerSuccess(`🛒 Đã mua thành công 1x ${item.name}! Vật phẩm đã được chuyển vào Kho Đồ.`);
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
      triggerSuccess(`🥰 Linh thú đã thưởng thức ${itemEmoji} ${itemName}! Tặng lại em +${itemXp} XP bứt phá!`);
    }, 1200);
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
      alert(`⚠️ Em không đủ Xu Trí Tuệ để mua gói thẻ này! (Cần thêm ${pack.price - currentCoins} xu)`);
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

  const currentPet = getAvatarAtLevel(selectedAvatarIdx, progress.level);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12 relative">
      
      {/* 1. Header: Bank / Coins balance */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
        <div className="space-y-2 text-center md:text-left relative z-10">
          <span className="text-[11px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-indigo-50 inline-block">HỆ THỐNG TIỀN TỆ GAMIFICATION</span>
          <h2 className="font-display font-black text-3xl tracking-tight leading-tight">
            CỬA HÀNG TRI THỨC 🪙
          </h2>
          <p className="text-sm text-indigo-100 max-w-md">
            Đổi <span className="font-extrabold text-white">Xu Trí Tuệ</span> lấy thức ăn bồi bổ linh thú hoặc bóc những gói thẻ phép thuật ma mị khuynh đảo đấu trường PK!
          </p>
        </div>

        {/* Big Coin Counter */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex items-center gap-4 shadow-inner min-w-[200px] justify-center relative z-10">
          <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-spin-slow">
            <Coins className="w-7 h-7 text-white fill-amber-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Số dư Xu hiện tại</p>
            <p className="text-3xl font-black text-amber-300 tracking-tight">{progress.coins || 0} <span className="text-lg text-white font-semibold">Xu</span></p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] max-w-xl mx-auto border border-slate-200/50">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "items" 
              ? "bg-white text-indigo-650 shadow-md" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Linh Thú & Thức Ăn</span>
        </button>
        <button
          onClick={() => setActiveTab("magic_cards")}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "magic_cards" 
              ? "bg-white text-indigo-650 shadow-md" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4 text-fuchsia-500" />
          <span>Gói Thẻ Ma Thuật 🃏</span>
        </button>
      </div>

      {/* TAB 1: ITEMS AND PET FEEDING */}
      {activeTab === "items" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Shop Inventory & Companion feeding */}
          <div className="space-y-6 lg:col-span-1">
            {/* Companion Interaction Screen */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Linh thú đồng hành</span>

              {/* Glowing Pet Avatar Box */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-50 rounded-[2.5rem] animate-pulse" />
                {isFeeding && (
                  <div className="absolute inset-0 bg-indigo-100/60 rounded-[2.5rem] z-10 flex items-center justify-center text-5xl animate-bounce">
                    {SHOP_ITEMS.find(i => i.id === isFeeding)?.emoji}
                    </div>

                )}
                <div className="text-7xl relative z-0 transition-transform duration-300 hover:scale-110">
                  {currentPet.emoji}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-black text-lg text-slate-800">{currentPet.title}</h3>
                <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">Cấp Tiến Hóa {currentPet.stageNum}</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed px-4">
                "{currentPet.description}"
              </p>

              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2 justify-center">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Cho ăn để bứt phá thêm điểm kinh nghiệm!</span>
              </div>
            </div>

            {/* User Food Inventory */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-800 text-sm">Thức Ăn Trữ Sẵn</h3>
                <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-full font-bold text-slate-500">
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
                          ? "border-indigo-100 bg-white shadow-sm" 
                          : "border-slate-50 bg-slate-50/40 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100">
                          {item.emoji}
                      </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-indigo-600 font-bold">+{item.xpBoost} XP khi sử dụng</p>
                      </div>
                    </div>

                      <div>
                        {count > 0 ? (
                          <button
                            onClick={() => handleUseItem(item.id, item.xpBoost, item.name, item.emoji)}
                            disabled={isFeeding !== null}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer disabled:opacity-50"
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
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                  📅
                </div>
                <div>
                  <h4 className="font-display font-black text-slate-800 text-sm">Điểm Danh Ngày Mới Nhận Xu</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mỗi ngày ghé thăm học tập được tặng ngay <span className="font-bold text-amber-600">+25 Xu Trí Tuệ</span>!</p>
                </div>
              </div>

              <div>
                {hasCheckedIn ? (
                  <div className="px-5 py-3 bg-white/80 border border-amber-100 rounded-2xl flex items-center gap-2 text-xs font-extrabold text-amber-600">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                    <span>Đã nhận hôm nay!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-amber-200 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  >
                    Điểm Danh Nhận Xu 🎁
                  </button>
                )}
              </div>
            </div>

            {/* Shop Catalog Grid */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <span>Kệ Hàng Thức Ăn Linh Thú</span>
                </h3>
                <p className="text-xs text-slate-400">Mua sắm vật phẩm dinh dưỡng đổi lấy điểm kinh nghiệm thăng tiến vượt bậc.</p>
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
                          ? "border-indigo-600 bg-indigo-50/5 shadow-md scale-[1.01]" 
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{item.emoji}</span>
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl text-xs font-black text-amber-600 shadow-sm">
                            <Coins className="w-3.5 h-3.5 fill-amber-300" />
                            <span>{item.price} Xu</span>
                        </div>
                      </div>

                        <div className="space-y-1">
                          <h4 className="font-display font-black text-slate-850 text-xs">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">+{item.xpBoost} XP</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyItem(item);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl transition-all shadow-sm cursor-pointer"
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
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedItem.emoji}</span>
                    <div>
                      <h5 className="text-xs font-black text-slate-850">{selectedItem.name}</h5>
                      <p className="text-[10px] text-slate-400">Trị giá: <strong className="text-amber-600">{selectedItem.price} Xu</strong> • Công dụng: <strong className="text-indigo-600">+{selectedItem.xpBoost} XP</strong></p>
                  </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {selectedItem.longDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Gamification tips */}
            <div className="p-5 bg-indigo-50/30 border border-indigo-100/30 rounded-2xl flex items-start gap-3.5 text-xs text-indigo-900 leading-relaxed">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Mẹo kiếm thật nhiều Xu Trí Tuệ:</p>
                <ul className="list-disc pl-4 space-y-1 text-indigo-700/90 font-medium text-[11px]">
                  <li>Biên soạn và ghim bài học bất kỳ tăng ngay <strong className="text-indigo-900 font-bold">+15 Xu</strong>.</li>
                  <li>Làm bài kiểm tra trắc nghiệm, mỗi câu đúng tăng ngay <strong className="text-indigo-900 font-bold">+5 Xu</strong>.</li>
                  <li>Nếu hoàn thành xuất sắc đạt điểm tuyệt đối 100%, nhận thêm thưởng <strong className="text-indigo-900 font-bold">+30 Xu</strong> tuyệt đỉnh!</li>
                  <li>Vượt qua đấu trường PK chiến thắng đối thủ nhận hàng chục xu thưởng khổng lồ!</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: GACHA MAGIC CARDS */}
      {activeTab === "magic_cards" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Owned Magical Cards Inventory */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-fuchsia-500" />
                  <h3 className="font-display font-black text-slate-850 text-sm">Kho Bài Ma Thuật</h3>
                </div>
                <span className="text-[10px] bg-fuchsia-50 text-fuchsia-700 px-2.5 py-0.5 rounded-full font-bold">
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
                          ? "border-fuchsia-100 bg-gradient-to-r from-fuchsia-50/10 to-white shadow-sm" 
                          : "border-slate-50 bg-slate-50/40 opacity-55"
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500" />
                      
                      <div className="text-3xl bg-slate-50 w-11 h-11 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
                        {card.emoji}
                    </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-slate-850 truncate">{card.name}</h4>
                          <span className="text-[10px] font-black text-fuchsia-600 shrink-0 bg-fuchsia-50 px-1.5 py-0.2 rounded">
                            x{qty}
                          </span>
                      </div>
                        <p className={`text-[9px] font-bold ${card.colorClass}`}>{card.tierLabel}</p>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-550 mt-0.5 mb-1">
                          <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-0.5">💪 Lực: {card.power}</span>
                          <span className="bg-amber-50/60 text-amber-800 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-0.5">⏳ Hồi: {card.cooldownRounds}v</span>
                      </div>
                        <p className="text-[10px] text-slate-450 leading-tight font-medium">{card.description}</p>
                        <p className="text-[9.5px] text-indigo-650 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100/30 mt-1 font-semibold leading-normal">
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
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-slate-850 text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500 animate-pulse" />
                    <span>Quầy Thẻ Phép Thuật Ngẫu Nhiên</span>
                  </h3>
                  <p className="text-xs text-slate-400">Chọn một gói thẻ phù hợp với túi tiền. Từng gói sẽ tăng cơ hội trúng các lá cực hiếm!</p>
                </div>

                <button
                  onClick={() => setIsSoundOn(!isSoundOn)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                  title="Bật/Tắt âm thanh bóc thẻ"
                >
                  {isSoundOn ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
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
                          ? "border-fuchsia-500 bg-fuchsia-50/5 shadow-md scale-[1.01]" 
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-4xl">{pack.emoji}</span>
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl text-xs font-black text-amber-600 shadow-sm">
                            <Coins className="w-3.5 h-3.5 fill-amber-300 animate-spin-slow" />
                            <span>{pack.price} Xu</span>
                        </div>
                      </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-black text-slate-850 text-xs">{pack.name}</h4>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${pack.badgeColor}`}>
                              {pack.cardCount} Lá
                            </span>
                        </div>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{pack.description}</p>
                      </div>
                    </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-[9px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded">Rút {pack.cardCount} Lá Bài</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPack(pack);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Bóc Thẻ 📦
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
                    CHÚC MỪNG EM ĐÃ RÚT ĐƯỢC!
                  </h3>
                </div>

                {/* The actual Card visual design */}
                <motion.div 
                  className={`w-64 h-96 rounded-[2.2rem] border-4 p-6 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl ${unboxedCards[revealedCardIdx].bgClass} ${unboxedCards[revealedCardIdx].borderClass}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Card sparkle shine */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                  {/* Top line: Name and Tier */}
                  <div className="w-full text-center space-y-1 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border ${unboxedCards[revealedCardIdx].colorClass}`}>
                      {unboxedCards[revealedCardIdx].tierLabel}
                    </span>
                    <h4 className="font-display font-black text-slate-800 text-sm leading-tight mt-1.5">{unboxedCards[revealedCardIdx].name}</h4>
                    <div className="flex justify-center items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded-full border border-slate-100 flex items-center gap-0.5">
                        💪 Lực: {unboxedCards[revealedCardIdx].power}
                      </span>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50/70 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5">
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
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-1">
                      "{unboxedCards[revealedCardIdx].description}"
                    </p>
                    <div className="bg-white/90 border border-slate-100 rounded-2xl p-2.5 text-[10.5px] text-indigo-750 font-black leading-tight shadow-sm">
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
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
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
                      className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer"
                    >
                      Thu cất vào kho đồ 🎒
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
