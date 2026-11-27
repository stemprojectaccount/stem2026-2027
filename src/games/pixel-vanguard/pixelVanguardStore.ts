// Quản lý hồ sơ Pixel Vanguard, Cửa hàng Nhân vật, Gói Gacha, Nâng cấp chỉ số & Giới hạn thời gian chơi
import { SupportedGradeNumber } from "../../lib/studentProfile";

export type SchoolGrade = SupportedGradeNumber;

export type PVHeroId =
  | "knight"
  | "paladin"
  | "wizard"
  | "pyromancer"
  | "vampire_noctis"
  | "ninja_kage"
  | "frost_valkyrie"
  | "plague_chemist"
  | "cyber_scientist"
  | "hazmat_commando";

export type PVRarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface PVHeroMeta {
  id: PVHeroId;
  codeName: string;
  vietnameseName: string;
  title: string;
  rarity: PVRarity;
  rarityLabel: string;
  priceCoins: number;
  hp: number;
  armor: number;
  energy: number;
  speed: number;
  starterWeapon: string;
  skillName: string;
  skillDesc: string;
  passiveDesc: string;
  accentColor: string;
  badgeBg: string;
}

export const PV_HERO_CATALOG: PVHeroMeta[] = [
  {
    id: "knight",
    codeName: "IRON KNIGHT",
    vietnameseName: "Hiệp Sĩ Sắt",
    title: "Chiến binh tiên phong cân bằng công thủ",
    rarity: "Common",
    rarityLabel: "Mặc định",
    priceCoins: 0,
    hp: 6,
    armor: 5,
    energy: 180,
    speed: 92,
    starterWeapon: "Súng Lục Cũ",
    skillName: "Song Hỏa Lực (Dual Wield)",
    skillDesc: "Nhân đôi tốc độ bắn và tung 2 luồng đạn liên hoàn trong 4,5 giây.",
    passiveDesc: "Mỗi khi phá khiên không bị nhận sát thương tràn thêm.",
    accentColor: "#63b3ff",
    badgeBg: "from-sky-500 to-blue-700",
  },
  {
    id: "paladin",
    codeName: "HOLY PALADIN",
    vietnameseName: "Thánh Kỵ Sĩ",
    title: "Pháo đài khiên thánh bất khả xâm phạm",
    rarity: "Rare",
    rarityLabel: "Hiếm",
    priceCoins: 80,
    hp: 4,
    armor: 8,
    energy: 140,
    speed: 80,
    starterWeapon: "Trượng Thánh Quang",
    skillName: "Khiên Thánh (Holy Shield)",
    skillDesc: "Bất tử hoàn toàn trong 3,6 giây và hấp thụ đạn địch thành năng lượng.",
    passiveDesc: "Khi vỡ giáp sẽ phát nổ sóng xung kích đẩy lùi quái xung quanh.",
    accentColor: "#ffd866",
    badgeBg: "from-amber-400 to-yellow-600",
  },
  {
    id: "wizard",
    codeName: "ARCANE WIZARD",
    vietnameseName: "Pháp Sư Bí Thuật",
    title: "Bậc thầy sấm sét và nguyên tố cổ đại",
    rarity: "Rare",
    rarityLabel: "Hiếm",
    priceCoins: 90,
    hp: 4,
    armor: 5,
    energy: 240,
    speed: 88,
    starterWeapon: "Trượng Pháp Thuật",
    skillName: "Chuỗi Sét Thiên Phạt (Chain Lightning)",
    skillDesc: "Phóng tia sét giật liên hoàn qua tối đa 5 mục tiêu và làm choáng.",
    passiveDesc: "Đòn chí mạng nguyên tố gây sát thương nhân đôi.",
    accentColor: "#b482ff",
    badgeBg: "from-purple-500 to-indigo-700",
  },
  {
    id: "pyromancer",
    codeName: "PYRO EMBER",
    vietnameseName: "Hỏa Thuật Sư",
    title: "Cơn bão thiên thạch thiêu rụi chiến trường",
    rarity: "Rare",
    rarityLabel: "Hiếm",
    priceCoins: 95,
    hp: 5,
    armor: 4,
    energy: 220,
    speed: 94,
    starterWeapon: "Trượng Hỏa Cầu",
    skillName: "Mưa Thiên Thạch (Meteor Swarm)",
    skillDesc: "Triệu hồi 5 thiên thạch rơi xuống vị trí chỉ định, để lại vùng lửa đốt cháy.",
    passiveDesc: "Miễn nhiễm sát thương lửa và tăng sát thương nổ.",
    accentColor: "#ff6e4a",
    badgeBg: "from-orange-500 to-red-600",
  },
  {
    id: "vampire_noctis",
    codeName: "LORD NOCTIS",
    vietnameseName: "Bá Tước Bóng Đêm",
    title: "Chiến binh huyết nguyệt tự hồi phục sinh lực",
    rarity: "Epic",
    rarityLabel: "Sử thi",
    priceCoins: 140,
    hp: 4,
    armor: 4,
    energy: 170,
    speed: 98,
    starterWeapon: "Kiếm Huyết Nguyệt",
    skillName: "Đàn Dơi Huyết (Crimson Swarm)",
    skillDesc: "Phóng 10 dơi đêm truy kích kẻ địch, hút máu và hồi lại HP + năng lượng.",
    passiveDesc: "Hạ gục quái có tỉ lệ rơi bóng máu hồi sinh lực.",
    accentColor: "#e63956",
    badgeBg: "from-rose-600 to-red-800",
  },
  {
    id: "ninja_kage",
    codeName: "SHADOW KAGE",
    vietnameseName: "Ảnhẫn Giả Kage",
    title: "Tốc độ chớp nhoáng và phân thân ám sát",
    rarity: "Epic",
    rarityLabel: "Sử thi",
    priceCoins: 150,
    hp: 4,
    armor: 4,
    energy: 190,
    speed: 108,
    starterWeapon: "Phi Tiêu Gió",
    skillName: "Ảnh Phân Thân (Shadow Dash)",
    skillDesc: "Lướt xuyên mục tiêu, tạo bóng phân thân và phóng 8 phi tiêu chuẩn xác.",
    passiveDesc: "Tăng 18% tỉ lệ chí mạng cho vũ khí tầm xa và cận chiến.",
    accentColor: "#38d9a9",
    badgeBg: "from-emerald-500 to-teal-700",
  },
  {
    id: "frost_valkyrie",
    codeName: "VALKYRIE FREYA",
    vietnameseName: "Nữ Chiến Thần Băng Giá",
    title: "Cơn bão tuyết đóng băng mọi chiến tuyến",
    rarity: "Epic",
    rarityLabel: "Sử thi",
    priceCoins: 160,
    hp: 5,
    armor: 6,
    energy: 185,
    speed: 92,
    starterWeapon: "Thương Băng Cực",
    skillName: "Tân Tinh Băng Giá (Glacial Nova)",
    skillDesc: "Phát nổ vòng băng khổng lồ đóng băng toàn bộ kẻ địch và phóng 10 mảnh băng.",
    passiveDesc: "Tăng thời gian đóng băng và cộng thêm +1 Giáp tối đa.",
    accentColor: "#7be6ff",
    badgeBg: "from-cyan-400 to-blue-600",
  },
  {
    id: "plague_chemist",
    codeName: "DR. MORBUS",
    vietnameseName: "Giả Kim Dược Sư",
    title: "Kiểm soát chiến trường bằng bình giả kim độc tố",
    rarity: "Epic",
    rarityLabel: "Sử thi",
    priceCoins: 155,
    hp: 5,
    armor: 5,
    energy: 210,
    speed: 90,
    starterWeapon: "Súng Phun Độc",
    skillName: "Mưa Bình Giả Kim (Alchemical Barrage)",
    skillDesc: "Ném 3 bình độc tố tạo vùng ăn mòn làm chậm và rút máu quái liên tục.",
    passiveDesc: "Miễn nhiễm độc tố và tăng sát thương độc theo thời gian.",
    accentColor: "#78e05a",
    badgeBg: "from-lime-500 to-green-700",
  },
  {
    id: "cyber_scientist",
    codeName: "DR. TESLA",
    vietnameseName: "Tiến Sĩ Công Nghệ Tesla",
    title: "Triệu hồi tháp pháo tự động và lưới điện từ",
    rarity: "Legendary",
    rarityLabel: "Huyền thoại",
    priceCoins: 220,
    hp: 4,
    armor: 6,
    energy: 230,
    speed: 90,
    starterWeapon: "Súng Xung Điện",
    skillName: "Tháp Pháo Tự Hành (Auto-Turret)",
    skillDesc: "Triệu hồi tháp pháo laser tự động khóa mục tiêu và bắn liên thanh trong 9 giây.",
    passiveDesc: "Vũ khí laser tăng độ rộng tia và nảy thêm 1 lần.",
    accentColor: "#3ee8ff",
    badgeBg: "from-cyan-500 to-indigo-600",
  },
  {
    id: "hazmat_commando",
    codeName: "UNIT-X9 HAZMAT",
    vietnameseName: "Đặc Nhiệm Hạt Nhân X9",
    title: "Sức mạnh hỏa lực hạng nặng và xung phản ứng",
    rarity: "Legendary",
    rarityLabel: "Huyền thoại",
    priceCoins: 240,
    hp: 6,
    armor: 6,
    energy: 200,
    speed: 88,
    starterWeapon: "Pháo Plasma Hạng Nặng",
    skillName: "Xung Lò Phản Ứng (Reactor Pulse)",
    skillDesc: "Giải phóng sóng xung kích hạt nhân quét sạch đạn địch và gây sát thương diện rộng.",
    passiveDesc: "Miễn nhiễm cả Lửa lẫn Độc, tăng bán kính vụ nổ.",
    accentColor: "#a8ff3e",
    badgeBg: "from-lime-400 to-emerald-700",
  },
];

export interface PVUpgrades {
  hp: number;     // 0..3 (+1 Max HP / cấp)
  armor: number;  // 0..3 (+1 Max Giáp / cấp)
  energy: number; // 0..3 (+25 Năng lượng / cấp)
  cd: number;     // 0..3 (-8% Hồi chiêu / cấp)
}

export interface PVTransactionEntry {
  id: string;
  timestamp: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
}

export interface PVSettings {
  mode: "study" | "adventure";
  questionsEnabled: boolean;
  preferredDifficulty: 1 | 2 | 3;
  topicFilter: string;
  timerSeconds: number; // 0 = tắt giới hạn thời gian
  dailyLimitMinutes: number; // Mặc định 20 phút/ngày
  gradeOverride?: SchoolGrade;
}

export interface PVProfileState {
  unlocked: PVHeroId[];
  selectedHero: PVHeroId;
  upgrades: PVUpgrades;
  pityCounter: number; // Bảo hiểm Gacha: tối đa 5 lần quay chắc chắn ra tướng chưa sở hữu
  heroFragments: number; // Mảnh anh hùng tích lũy khi quay trùng (3 mảnh đổi 1 tướng bất kỳ hoặc hoàn xu)
  dailyDateKey: string;
  dailyCoinsEarned: number;
  dailyPlaySeconds: number;
  bestFloor: number;
  totalRunsCompleted: number;
  settings: PVSettings;
  transactions: PVTransactionEntry[];
}

const PV_STORE_KEY = "smart_study_pixel_vanguard_profile_v1";
export const PV_DAILY_COIN_CAP = 180; // Giới hạn xu kiếm từ game mỗi ngày để chống cày lặp lại
export const PV_GACHA_COST = 95; // Chi phí 1 lần mở Hộp Anh Hùng Bí Ẩn
export const PV_PITY_THRESHOLD = 5; // Quay đủ 5 lần chắc chắn nhận tướng mới chưa mở

export const PV_UPGRADE_METAS: {
  key: keyof PVUpgrades;
  name: string;
  desc: string;
  costs: [number, number, number];
  effectPerLevel: string;
}[] = [
  {
    key: "hp",
    name: "Trái Tim Cường Hóa",
    desc: "Tăng máu tối đa khởi đầu cho mọi nhân vật",
    costs: [45, 75, 110],
    effectPerLevel: "+1 HP tối đa / cấp",
  },
  {
    key: "armor",
    name: "Giáp Tinh Thể",
    desc: "Tăng giáp tự hồi phục khi vào mỗi phòng đấu",
    costs: [45, 75, 110],
    effectPerLevel: "+1 Giáp tối đa / cấp",
  },
  {
    key: "energy",
    name: "Lõi Năng Lượng",
    desc: "Tăng giới hạn năng lượng sử dụng vũ khí",
    costs: [35, 65, 95],
    effectPerLevel: "+25 Năng lượng / cấp",
  },
  {
    key: "cd",
    name: "Đồng Hồ Chiến Thuật",
    desc: "Giảm thời gian hồi kỹ năng đặc biệt (phím K)",
    costs: [50, 85, 125],
    effectPerLevel: "-8% Hồi chiêu / cấp",
  },
];

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function loadPVProfile(): PVProfileState {
  const today = getTodayKey();
  const defaultState: PVProfileState = {
    unlocked: ["knight"],
    selectedHero: "knight",
    upgrades: { hp: 0, armor: 0, energy: 0, cd: 0 },
    pityCounter: 0,
    heroFragments: 0,
    dailyDateKey: today,
    dailyCoinsEarned: 0,
    dailyPlaySeconds: 0,
    bestFloor: 1,
    totalRunsCompleted: 0,
    settings: {
      mode: "study",
      questionsEnabled: true,
      preferredDifficulty: 2,
      topicFilter: "all",
      timerSeconds: 30,
      dailyLimitMinutes: 20,
    },
    transactions: [],
  };

  try {
    const raw = localStorage.getItem(PV_STORE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    const unlocked: PVHeroId[] = Array.isArray(parsed.unlocked) && parsed.unlocked.length > 0
      ? parsed.unlocked.filter((id: string) => PV_HERO_CATALOG.some((h) => h.id === id))
      : ["knight"];
    if (!unlocked.includes("knight")) unlocked.unshift("knight");

    const isSameDay = parsed.dailyDateKey === today;
    return {
      unlocked,
      selectedHero: unlocked.includes(parsed.selectedHero) ? parsed.selectedHero : "knight",
      upgrades: {
        hp: Math.min(3, Math.max(0, Number(parsed.upgrades?.hp) || 0)),
        armor: Math.min(3, Math.max(0, Number(parsed.upgrades?.armor) || 0)),
        energy: Math.min(3, Math.max(0, Number(parsed.upgrades?.energy) || 0)),
        cd: Math.min(3, Math.max(0, Number(parsed.upgrades?.cd) || 0)),
      },
      pityCounter: Math.max(0, Number(parsed.pityCounter) || 0),
      heroFragments: Math.max(0, Number(parsed.heroFragments) || 0),
      dailyDateKey: today,
      dailyCoinsEarned: isSameDay ? Math.max(0, Number(parsed.dailyCoinsEarned) || 0) : 0,
      dailyPlaySeconds: isSameDay ? Math.max(0, Number(parsed.dailyPlaySeconds) || 0) : 0,
      bestFloor: Math.max(1, Number(parsed.bestFloor) || 1),
      totalRunsCompleted: Math.max(0, Number(parsed.totalRunsCompleted) || 0),
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {}),
      },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions.slice(0, 30) : [],
    };
  } catch {
    return defaultState;
  }
}

export function savePVProfile(profile: PVProfileState): PVProfileState {
  try {
    localStorage.setItem(PV_STORE_KEY, JSON.stringify(profile));
    // Đồng bộ trực tiếp xuống pixelvanguard_save_v1 với shards = 0 để chặn mua trong game
    const rawGameSave = localStorage.getItem("pixelvanguard_save_v1");
    const parsedGameSave = rawGameSave ? JSON.parse(rawGameSave) : {};
    localStorage.setItem(
      "pixelvanguard_save_v1",
      JSON.stringify({
        ...parsedGameSave,
        shards: 0,
        unlocked: profile.unlocked,
        upgrades: profile.upgrades,
        best: Math.max(Number(parsedGameSave.best) || 1, profile.bestFloor),
      })
    );
  } catch {
    // Ignore storage errors in restricted sandbox
  }
  return profile;
}

export function addPVTransaction(
  profile: PVProfileState,
  type: "earn" | "spend",
  amount: number,
  reason: string
): PVProfileState {
  if (amount <= 0) return profile;
  const entry: PVTransactionEntry = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    type,
    amount,
    reason,
  };
  return {
    ...profile,
    transactions: [entry, ...profile.transactions].slice(0, 30),
  };
}

export interface GachaRollResult {
  hero: PVHeroMeta;
  isDuplicate: boolean;
  refundCoins: number;
  fragmentsGained: number;
  pityTriggered: boolean;
  updatedProfile: PVProfileState;
}

/**
 * Quay Gacha mở nhân vật ngẫu nhiên với tỉ lệ minh bạch:
 * - Common / Rare: 60%
 * - Epic: 30%
 * - Legendary: 10%
 * - Bảo hiểm (Pity): Lần quay thứ 5 liên tiếp chắc chắn ra nhân vật CHƯA SỞ HỮU (nếu còn).
 * - Nếu quay trùng: Hoàn lại 45 Xu + tặng 1 Mảnh Anh Hùng (đủ 3 mảnh được đổi miễn phí 1 tướng chưa có).
 */
export function rollPVHeroGacha(profile: PVProfileState): GachaRollResult {
  const lockedHeroes = PV_HERO_CATALOG.filter((h) => !profile.unlocked.includes(h.id));
  const nextPity = profile.pityCounter + 1;
  const forceNewHero = lockedHeroes.length > 0 && nextPity >= PV_PITY_THRESHOLD;

  let chosenHero: PVHeroMeta;
  let pityTriggered = false;

  if (forceNewHero) {
    pityTriggered = true;
    chosenHero = lockedHeroes[Math.floor(Math.random() * lockedHeroes.length)];
  } else {
    const roll = Math.random() * 100;
    let pool: PVHeroMeta[];
    if (roll < 10) {
      pool = PV_HERO_CATALOG.filter((h) => h.rarity === "Legendary");
    } else if (roll < 40) {
      pool = PV_HERO_CATALOG.filter((h) => h.rarity === "Epic");
    } else {
      pool = PV_HERO_CATALOG.filter((h) => h.rarity === "Rare" || h.rarity === "Common");
    }
    if (pool.length === 0) pool = PV_HERO_CATALOG;
    chosenHero = pool[Math.floor(Math.random() * pool.length)];
  }

  const isDuplicate = profile.unlocked.includes(chosenHero.id);
  let nextUnlocked = [...profile.unlocked];
  let refundCoins = 0;
  let fragmentsGained = 0;
  let finalPity = nextPity;

  if (isDuplicate) {
    refundCoins = 45;
    fragmentsGained = 1;
  } else {
    nextUnlocked.push(chosenHero.id);
    finalPity = 0;
  }

  let updatedProfile: PVProfileState = {
    ...profile,
    unlocked: nextUnlocked,
    selectedHero: isDuplicate ? profile.selectedHero : chosenHero.id,
    pityCounter: finalPity,
    heroFragments: profile.heroFragments + fragmentsGained,
  };

  updatedProfile = addPVTransaction(
    updatedProfile,
    "spend",
    PV_GACHA_COST - refundCoins,
    isDuplicate
      ? `Quay Gacha trùng ${chosenHero.vietnameseName} (Hoàn ${refundCoins} Xu + 1 Mảnh)`
      : `Mở Gacha nhận tướng mới: ${chosenHero.vietnameseName}`
  );

  savePVProfile(updatedProfile);

  return {
    hero: chosenHero,
    isDuplicate,
    refundCoins,
    fragmentsGained,
    pityTriggered,
    updatedProfile,
  };
}
