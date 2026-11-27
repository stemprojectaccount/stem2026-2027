/**
 * ============================================================================
 * INK SIEGE (NGƯỜI GIỮ TRANG) — STORE & PROGRESSION MODULE
 * ----------------------------------------------------------------------------
 * Quản lý danh sách 10 Thủ Thư, đồng bộ localStorage ("ngt_save") và
 * trao thưởng / vật phẩm từ Cửa hàng SmartStudy sang iframe game.
 * ============================================================================
 */

export interface InkSiegeSurvivorMeta {
  id: string;
  codeName: string;
  vietnameseName: string;
  roleTitle: string;
  weaponName: string;
  ultName: string;
  ultDesc: string;
  priceCoins: number;
  priceShards: number;
  accentColor: string;
}

export const INK_SIEGE_SURVIVORS: InkSiegeSurvivorMeta[] = [
  {
    id: "knight",
    codeName: "NIB",
    vietnameseName: "Thiếu Niên Ngòi Bút NIB",
    roleTitle: "Phổ thông · +3% sát thương mọi kỹ năng",
    weaponName: "Phi Bút Của Nib",
    ultName: "Nét Đậm",
    ultDesc: "6 giây: mọi kỹ năng hồi chiêu nhanh gấp đôi.",
    priceCoins: 0,
    priceShards: 0,
    accentColor: "#ffd93d",
  },
  {
    id: "ninja_kage",
    codeName: "KIRI",
    vietnameseName: "Kiếm Sĩ Giấy Gấp KIRI",
    roleTitle: "Nhanh nhẹn · +12% tốc chạy, 8% né đòn",
    weaponName: "Kiếm Giấy Hạc Trắng",
    ultName: "Nghìn Hạc Giấy",
    ultDesc: "Tung 10 nhát kiếm giấy toả quanh người, bất tử 1 giây.",
    priceCoins: 85,
    priceShards: 10,
    accentColor: "#38d9a9",
  },
  {
    id: "cyber_scientist",
    codeName: "VOLTA",
    vietnameseName: "Nhà Phát Minh VOLTA",
    roleTitle: "Chí mạng · +15% tỉ lệ, +50% sát thương chí mạng",
    weaponName: "Súng Phấn Tesla",
    ultName: "Đoản Mạch",
    ultDesc: "Xoá đạn địch, choáng mọi quái trên màn 2.5 giây.",
    priceCoins: 100,
    priceShards: 15,
    accentColor: "#3ee8ff",
  },
  {
    id: "paladin",
    codeName: "ATLAS",
    vietnameseName: "Người Mang Địa Cầu ATLAS",
    roleTitle: "Đỡ đòn · +20% Máu, giảm 10% sát thương",
    weaponName: "Thước Kinh Tuyến",
    ultName: "Vòng Kinh Tuyến",
    ultDesc: "Bất tử 3 giây, đẩy văng quái xung quanh.",
    priceCoins: 95,
    priceShards: 15,
    accentColor: "#ffd866",
  },
  {
    id: "wizard",
    codeName: "LUMEN",
    vietnameseName: "Thủ Thư Ánh Sáng LUMEN",
    roleTitle: "Pháp sư điện · -8% hồi chiêu, +20% kỹ năng điện",
    weaponName: "Lưỡi Đèn Lồng",
    ultName: "Mưa Chữ Sáng",
    ultDesc: "3 giây tia sáng giáng liên tục vào quái ngẫu nhiên.",
    priceCoins: 120,
    priceShards: 20,
    accentColor: "#b482ff",
  },
  {
    id: "pyromancer",
    codeName: "CHAR",
    vietnameseName: "Nhà Hoá Học Lửa CHAR",
    roleTitle: "Hoả thuật · +25% kỹ năng lửa, miễn nhiễm bỏng",
    weaponName: "Súng Ghim Nung Đỏ",
    ultName: "Phản Ứng Dây Chuyền",
    ultDesc: "Gọi 12 khối lửa rơi xuống đầu kẻ địch.",
    priceCoins: 125,
    priceShards: 20,
    accentColor: "#ff6e4a",
  },
  {
    id: "vampire_noctis",
    codeName: "NOX",
    vietnameseName: "Cú Đêm NOX",
    roleTitle: "Hút máu · Hút 2% sát thương thành máu",
    weaponName: "Kiếm Từ Cú Đêm",
    ultName: "Bầy Cú Đêm",
    ultDesc: "Thả 16 con cú đêm truy cắn quái và hồi máu.",
    priceCoins: 140,
    priceShards: 25,
    accentColor: "#e63956",
  },
  {
    id: "frost_valkyrie",
    codeName: "BORA",
    vietnameseName: "Nhà Thám Hiểm Cực BORA",
    roleTitle: "Băng giá · 15% làm chậm, chí mạng đóng băng 1s",
    weaponName: "Compa Băng Giá",
    ultName: "Bão Tuyết Địa Cực",
    ultDesc: "Đóng băng mọi quái trên màn 3 giây.",
    priceCoins: 145,
    priceShards: 25,
    accentColor: "#7be6ff",
  },
  {
    id: "plague_chemist",
    codeName: "MOSS",
    vietnameseName: "Nhà Thực Vật Học MOSS",
    roleTitle: "Vùng bào tử · Hạ quái 20% để lại vũng độc",
    weaponName: "Giọt Mực Bào Tử",
    ultName: "Mây Phấn Hoa",
    ultDesc: "Mây phấn hoa độc 6 giây quanh người, làm chậm.",
    priceCoins: 150,
    priceShards: 30,
    accentColor: "#78e05a",
  },
  {
    id: "hazmat_commando",
    codeName: "GEAR-9",
    vietnameseName: "Robot Thủ Thư GEAR-9",
    roleTitle: "Máu giáp dày · +30% Máu, +8% giáp",
    weaponName: "Pháo Ghim Hạng Nặng",
    ultName: "Rào Bìa Cứng",
    ultDesc: "Khiên 4 giây giảm 90% sát thương + vòng đạn plasma.",
    priceCoins: 180,
    priceShards: 30,
    accentColor: "#a8ff3e",
  },
];

export interface InkSiegeSaveSummary {
  gems: number;
  gold: number;
  energy: number;
  key_s: number;
  key_g: number;
  unlockedHeroes: string[];
  selectedHero: string;
  shards: Record<string, number>;
  itemCount: number;
}

export const INK_SIEGE_SAVE_KEY = "ngt_save";

export function loadInkSiegeSaveSummary(): InkSiegeSaveSummary {
  try {
    const raw = localStorage.getItem(INK_SIEGE_SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const res = parsed?.res || {};
      const heroesObj = parsed?.heroes || { knight: { star: 1 } };
      const validIds = new Set(INK_SIEGE_SURVIVORS.map((s) => s.id));
      const unlockedHeroes = Object.keys(heroesObj).filter((k) => validIds.has(k));
      if (!unlockedHeroes.includes("knight")) unlockedHeroes.unshift("knight");
      const rawSelHero = parsed?.sel?.hero || parsed?.hero || "knight";
      return {
        gems: Number(res.gems) || 0,
        gold: Number(res.gold) || 0,
        energy: Number(res.energy) ?? 30,
        key_s: Number(res.key_s) || 0,
        key_g: Number(res.key_g) || 0,
        unlockedHeroes,
        selectedHero: validIds.has(rawSelHero) ? rawSelHero : "knight",
        shards: parsed?.shards && typeof parsed.shards === "object" ? parsed.shards : {},
        itemCount: Array.isArray(parsed?.items) ? parsed.items.length : 1,
      };
    }
  } catch {
    // Ignore storage read error
  }
  return {
    gems: 300,
    gold: 1500,
    energy: 30,
    key_s: 2,
    key_g: 0,
    unlockedHeroes: ["knight"],
    selectedHero: "knight",
    shards: {},
    itemCount: 1,
  };
}

export function grantInkSiegeRewardToStorage(payload: {
  gems?: number;
  gold?: number;
  energy?: number;
  key_s?: number;
  key_g?: number;
  design?: number;
  unlockHero?: string;
  randomShards?: number;
  randomEquip?: number;
  randomSigWeapon?: boolean;
  toast?: string;
}): InkSiegeSaveSummary {
  try {
    const raw = localStorage.getItem(INK_SIEGE_SAVE_KEY);
    if (raw) {
      const save: any = JSON.parse(raw);
      if (!save.res) save.res = {};
      if (!save.shards || typeof save.shards !== "object") save.shards = {};
      if (!save.heroes) save.heroes = { knight: { star: 1, skin: 0, skins: [0] } };
      if (!save.sel) save.sel = { hero: "knight", chapter: 0, pet: null };
      if (!Array.isArray(save.items)) save.items = [];
      if (typeof save.uidSeq !== "number") save.uidSeq = save.items.length + 10;

      if (typeof payload.gems === "number" && payload.gems > 0) {
        save.res.gems = (Number(save.res.gems) || 0) + payload.gems;
      }
      if (typeof payload.gold === "number" && payload.gold > 0) {
        save.res.gold = (Number(save.res.gold) || 0) + payload.gold;
      }
      if (typeof payload.energy === "number" && payload.energy > 0) {
        save.res.energy = (Number(save.res.energy) || 0) + payload.energy;
      }
      if (typeof payload.key_s === "number" && payload.key_s > 0) {
        save.res.key_s = (Number(save.res.key_s) || 0) + payload.key_s;
      }
      if (typeof payload.key_g === "number" && payload.key_g > 0) {
        save.res.key_g = (Number(save.res.key_g) || 0) + payload.key_g;
      }
      if (typeof payload.design === "number" && payload.design > 0) {
        save.res.design = (Number(save.res.design) || 0) + payload.design;
      }
      if (typeof payload.randomShards === "number" && payload.randomShards > 0) {
        const nonStarter = INK_SIEGE_SURVIVORS.filter((s) => s.id !== "knight");
        const picked = nonStarter[Math.floor(Math.random() * nonStarter.length)];
        if (picked) {
          save.shards[picked.id] = (Number(save.shards[picked.id]) || 0) + payload.randomShards;
        }
      }
      if (typeof payload.randomEquip === "number" && payload.randomEquip > 0) {
        const poolBases = [
          "w_kunai", "w_katana", "w_shotgun", "w_bat", "w_revolver",
          "n_fang", "n_amulet", "g_leather", "g_iron",
          "a_leather", "a_mail", "b_cloth", "b_warrior", "s_cloth", "s_combat",
        ];
        for (let i = 0; i < payload.randomEquip; i++) {
          const base = poolBases[Math.floor(Math.random() * poolBases.length)];
          const qRoll = Math.random();
          const q = qRoll < 0.15 ? 3 : qRoll < 0.5 ? 2 : 1;
          save.items.push({
            uid: save.uidSeq++,
            base,
            q,
            plus: 0,
            lvl: 1,
            spent: { gold: 0, design: 0 },
          });
        }
      }
      if (payload.randomSigWeapon) {
        const picked = INK_SIEGE_SURVIVORS[Math.floor(Math.random() * INK_SIEGE_SURVIVORS.length)];
        if (picked) {
          const qRoll = Math.random();
          const q = qRoll < 0.08 ? 4 : qRoll < 0.25 ? 3 : qRoll < 0.55 ? 2 : 1;
          const lv = 1 + Math.floor(Math.random() * (5 + q * 4));
          save.items.push({
            uid: save.uidSeq++,
            base: "sig_" + picked.id,
            q,
            plus: 0,
            lvl: lv,
            lvl0: lv,
            spent: { gold: 0, design: 0 },
          });
        }
      }
      if (typeof payload.unlockHero === "string" && payload.unlockHero) {
        if (!save.heroes[payload.unlockHero]) {
          save.heroes[payload.unlockHero] = { star: 1, skin: 0, skins: [0] };
          const q = Math.random() < 0.3 ? 3 : 2;
          const lv = 1 + Math.floor(Math.random() * 8);
          save.items.push({
            uid: save.uidSeq++,
            base: "sig_" + payload.unlockHero,
            q,
            plus: 0,
            lvl: lv,
            lvl0: lv,
            spent: { gold: 0, design: 0 },
          });
        }
        save.sel.hero = payload.unlockHero;
      }

      localStorage.setItem(INK_SIEGE_SAVE_KEY, JSON.stringify(save));
    } else {
      const pendingRaw = localStorage.getItem("ngt_smartstudy_pending");
      const pendingList = pendingRaw ? JSON.parse(pendingRaw) : [];
      if (Array.isArray(pendingList)) {
        pendingList.push(payload);
        localStorage.setItem("ngt_smartstudy_pending", JSON.stringify(pendingList));
      }
    }
  } catch {
    // Ignore storage write error
  }

  try {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((frame) => {
      frame.contentWindow?.postMessage(
        {
          type: "sv:grantReward",
          data: payload,
        },
        "*"
      );
    });
  } catch {
    // Ignore cross-frame error
  }

  return loadInkSiegeSaveSummary();
}
