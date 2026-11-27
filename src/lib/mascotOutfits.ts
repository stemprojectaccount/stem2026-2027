export interface MascotOutfit {
  id: string;
  name: string;
  category: "all" | "hat" | "robe" | "special";
  price: number;
  description: string;
  tagline: string;
  rarity: "Phổ thông" | "Hiếm" | "Sử thi" | "Huyền thoại";
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  previewColor: string;
  statBoost: string;
  storyQuote: string;
  iconSvg: string;
}

export const MASCOT_OUTFITS: MascotOutfit[] = [
  {
    id: "default",
    name: "Học Trò Tinh Khôi",
    category: "robe",
    price: 0,
    description: "Bộ đồng phục học đường cơ bản với khăn quàng tri thức thanh lịch.",
    tagline: "Khởi đầu hành trình học tập",
    rarity: "Phổ thông",
    badgeBg: "bg-sky-100",
    badgeBorder: "border-sky-300",
    textColor: "text-sky-800",
    previewColor: "#38bdf8",
    statBoost: "Trang phục mặc định",
    storyQuote: "Vạn dặm đường xa bắt đầu từ một bước chân giản dị.",
    iconSvg: "🎒"
  },
  {
    id: "scholar",
    name: "Học Sĩ Viện Hàn Lâm",
    category: "hat",
    price: 35,
    description: "Mũ cử nhân màu xanh lam thẫm đính tua rua vàng óng và cặp kính tròn thông thái.",
    tagline: "Biểu tượng của học thức uyên thâm",
    rarity: "Hiếm",
    badgeBg: "bg-blue-100",
    badgeBorder: "border-blue-300",
    textColor: "text-blue-800",
    previewColor: "#0284c7",
    statBoost: "+5% Xu mỗi bài học",
    storyQuote: "Kính thông thái giúp em nhìn thấu mọi dạng đề thi học búa!",
    iconSvg: "🎓"
  },
  {
    id: "detective",
    name: "Thám Tử Tri Thức",
    category: "special",
    price: 60,
    description: "Mũ beret dạ kẻ sọc cổ điển của thám tử lừng danh cùng kính lúp soi đáp án chuẩn xác.",
    tagline: "Sự thật duy nhất luôn nằm trong kiến thức",
    rarity: "Hiếm",
    badgeBg: "bg-amber-100",
    badgeBorder: "border-amber-300",
    textColor: "text-amber-900",
    previewColor: "#d97706",
    statBoost: "+8% Tỷ lệ trả lời chuẩn xác",
    storyQuote: "Không một bẫy ngữ pháp hay công thức nào qua mắt được thám tử nhí!",
    iconSvg: "🔍"
  },
  {
    id: "wizard",
    name: "Đại Pháp Sư Sao Băng",
    category: "hat",
    price: 95,
    description: "Mũ phù thủy chóp nhọn màu tím huyền diệu đính các vì sao tỏa sáng lung linh.",
    tagline: "Phép thuật biến kiến thức thành sức mạnh",
    rarity: "Sử thi",
    badgeBg: "bg-purple-100",
    badgeBorder: "border-purple-300",
    textColor: "text-purple-800",
    previewColor: "#9333ea",
    statBoost: "+12% XP tích lũy toàn diện",
    storyQuote: "Lắc nhẹ đũa phép sao băng, bài tập khó tan biến trong nháy mắt!",
    iconSvg: "🪄"
  },
  {
    id: "cyber",
    name: "Chiến Binh Cyberpunk AI",
    category: "special",
    price: 140,
    description: "Kính thực tế ảo neon VR Visor phát sáng công nghệ cao kết hợp tai nghe viễn tưởng.",
    tagline: "Học tập thời đại số thông minh vượt bậc",
    rarity: "Sử thi",
    badgeBg: "bg-cyan-100",
    badgeBorder: "border-cyan-300",
    textColor: "text-cyan-900",
    previewColor: "#06b6d4",
    statBoost: "+15% Tốc độ ghi nhớ Flashcard",
    storyQuote: "Tải thẳng tri thức vào não bộ với băng thông siêu tốc AI!",
    iconSvg: "🥽"
  },
  {
    id: "superhero",
    name: "Siêu Anh Hùng Học Đường",
    category: "robe",
    price: 190,
    description: "Áo choàng đỏ rực bay phấp phới cùng mặt nạ hiệp sĩ và huy hiệu tia chớp quả cảm.",
    tagline: "Bảo vệ điểm số, vượt qua mọi kỳ thi",
    rarity: "Sử thi",
    badgeBg: "bg-rose-100",
    badgeBorder: "border-rose-300",
    textColor: "text-rose-800",
    previewColor: "#e11d48",
    statBoost: "+18% Sức mạnh Đấu trường PK",
    storyQuote: "Nơi nào có bài thi hóc búa, nơi đó có siêu anh hùng xuất hiện ứng cứu!",
    iconSvg: "⚡"
  },
  {
    id: "royal",
    name: "Vương Giả Hoàng Gia",
    category: "hat",
    price: 260,
    description: "Vương miện vàng ròng nạm hồng ngọc quý giá và áo choàng nhung viền lông tuyết sang trọng.",
    tagline: "Khí chất bá vương dẫn đầu bảng vàng",
    rarity: "Huyền thoại",
    badgeBg: "bg-amber-100",
    badgeBorder: "border-amber-400",
    textColor: "text-amber-950",
    previewColor: "#ca8a04",
    statBoost: "+25% Xu thưởng khi đạt chuỗi streak",
    storyQuote: "Người đội vương miện xứng đáng đứng đầu mọi bảng xếp hạng thi đua!",
    iconSvg: "👑"
  },
  {
    id: "dragon",
    name: "Long Thần Giáp Lửa",
    category: "special",
    price: 350,
    description: "Giáp sừng rồng hoàng kim vảy lửa, cánh rồng uy phong cùng vòng hào quang ngũ sắc.",
    tagline: "Đỉnh cao tuyệt đối của linh thú vũ trụ",
    rarity: "Huyền thoại",
    badgeBg: "bg-gradient-to-r from-red-100 to-amber-100",
    badgeBorder: "border-orange-400",
    textColor: "text-orange-950",
    previewColor: "#ea580c",
    statBoost: "+30% Toàn bộ chỉ số học tập và PK",
    storyQuote: "Sức mạnh nguyên sơ của rồng thần thức tỉnh, bứt phá mọi giới hạn!",
    iconSvg: "🐉"
  }
];

export function getOutfitById(id: string): MascotOutfit {
  return MASCOT_OUTFITS.find(o => o.id === id) || MASCOT_OUTFITS[0];
}
