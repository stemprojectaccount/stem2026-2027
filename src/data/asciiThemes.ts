// ASCII background themes and mood tags. Kept apart from AIChatBot so the app shell can
// read them without loading the chat assistant (and its animation library) at startup.

export type AsciiMoodTag =
  | 'Calm'
  | 'Cyber'
  | 'Nature'
  | 'Cosmic'
  | 'Warm'
  | 'Energy'
  | 'Mystery'
  | 'Learning';

export const ALL_ASCII_MOOD_TAGS: AsciiMoodTag[] = [
  'Calm',
  'Cyber',
  'Nature',
  'Cosmic',
  'Warm',
  'Energy',
  'Mystery',
  'Learning'
];

export const ASCII_MOOD_TAG_ICONS: Record<AsciiMoodTag, string> = {
  Calm: '🧘',
  Energy: '⚡',
  Mystery: '🔍',
  Learning: '📚',
  Cyber: '💻',
  Nature: '🌿',
  Cosmic: '🌌',
  Warm: '☀️'
};

export interface StudioAsciiThemeSpec {
  id: string;
  name: string;
  tier: string;
  cost: number;
  accent: string;
  accentRgb: string;
  contrastText: string;
  headerBg: string;
  surfaceBg: string;
  emotion: AsciiMoodTag;
  moodTags: AsciiMoodTag[];
  moodLabel: string;
  asciiSample: string;
  chars: string;
  description: string;
}

export const STUDIO_ASCII_THEMES: StudioAsciiThemeSpec[] = [
  {
    id: 'lagoon',
    name: 'Lagoon',
    tier: 'free',
    cost: 0,
    accent: '#0284c7',
    accentRgb: '2, 132, 199',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #0c2d62 0%, #0369a1 55%, #0284c7 100%)',
    surfaceBg: '#f0f9ff',
    emotion: 'Calm',
    moodTags: ['Calm', 'Nature', 'Learning'],
    moodLabel: 'Calm · Learning · ≈≈ sóng nước phát quang ≈≈',
    asciiSample: '≈ ~ ≋ · * ° ≈ ~ ≋',
    chars: '~≈≋·*°',
    description: 'Sóng nước đại dương xanh ngọc dịu mắt — mặc định hài hòa chuẩn hệ thống.'
  },
  {
    id: 'claude',
    name: 'Claude',
    tier: 'free',
    cost: 0,
    accent: '#c2410c',
    accentRgb: '194, 65, 12',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #431407 0%, #9a3412 55%, #c2410c 100%)',
    surfaceBg: '#fff7ed',
    emotion: 'Learning',
    moodTags: ['Learning', 'Warm', 'Calm'],
    moodLabel: 'Learning · Warm · // dòng chảy tri thức ấm áp',
    asciiSample: 'claude://> { think() } ✦',
    chars: '·:;|/\\(){}[]<>claude',
    description: 'Tông cam đất ấm áp phong cách Claude Anthropic với dòng ký tự học thuật.'
  },
  {
    id: 'clouds',
    name: 'Clouds',
    tier: 'free',
    cost: 0,
    accent: '#2563eb',
    accentRgb: '37, 99, 235',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #3b82f6 100%)',
    surfaceBg: '#f4f8ff',
    emotion: 'Calm',
    moodTags: ['Calm', 'Nature', 'Learning'],
    moodLabel: 'Calm · Nature · ☁  mây trôi tầng cao  ☁',
    asciiSample: '░ ▒ ▓ ☁ · ° ▒ ░',
    chars: '░▒▓·°☁',
    description: 'Các lớp mây ASCII trôi bồng bềnh trên nền xanh lam thanh thoát.'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    tier: 'free',
    cost: 0,
    accent: '#059669',
    accentRgb: '5, 150, 105',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%)',
    surfaceBg: '#ecfdf5',
    emotion: 'Nature',
    moodTags: ['Nature', 'Mystery', 'Calm'],
    moodLabel: 'Nature · Mystery · ✦ cực quang phương bắc ✦',
    asciiSample: '╭─╮ │ ╰─╯ ✦ ✧ ⋆',
    chars: '╭╮╯╰│─✦✧⋆',
    description: 'Dải cực quang xanh lục bảo chuyển sắc sang tím biếc Bắc Cực.'
  },
  {
    id: 'sakura',
    name: 'Sakura Drift',
    tier: 'free',
    cost: 0,
    accent: '#db2777',
    accentRgb: '219, 39, 119',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #831843 0%, #be185d 55%, #db2777 100%)',
    surfaceBg: '#fdf2f8',
    emotion: 'Nature',
    moodTags: ['Nature', 'Calm', 'Warm'],
    moodLabel: 'Nature · Calm · ✿ cánh hoa anh đào rơi ✿',
    asciiSample: '✿ ❀ ❁ · ° * ✿ ❀',
    chars: '✿❀❁·°*',
    description: 'Cánh hoa anh đào ASCII xoay nhẹ theo làn gió xuân hồng phấn.'
  },
  {
    id: 'cyber-matrix',
    name: 'Cyber Matrix',
    tier: 'free',
    cost: 0,
    accent: '#15803d',
    accentRgb: '21, 128, 61',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #052e16 0%, #14532d 55%, #15803d 100%)',
    surfaceBg: '#f0fdf4',
    emotion: 'Cyber',
    moodTags: ['Cyber', 'Energy', 'Learning', 'Mystery'],
    moodLabel: 'Cyber · Energy · Learning · ▓▒░ mưa mã nhị phân ░▒▓',
    asciiSample: '01 ｱ ｲ ｳ ｴ ｵ 10 ｶ',
    chars: '01ｱｲｳｴｵｶｷｸｹｺ',
    description: 'Mưa ký tự Katakana và mã nhị phân tốc độ cao chuẩn kỹ thuật số.'
  },
  {
    id: 'synthwave',
    name: 'Synthwave Grid',
    tier: 'free',
    cost: 0,
    accent: '#7c3aed',
    accentRgb: '124, 58, 237',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 52%, #a21caf 100%)',
    surfaceBg: '#f5f3ff',
    emotion: 'Energy',
    moodTags: ['Energy', 'Cyber', 'Mystery'],
    moodLabel: 'Energy · Cyber · ◢◤ chân trời retro 80s ◥◣',
    asciiSample: '═ ╬ ═ ▲ ▼ ◆ ◢ ◤',
    chars: '─═│┃┼╬▲▼◆',
    description: 'Lưới chân trời 3D thập niên 80 với mặt trời lặn tím hồng neon.'
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    tier: 'free',
    cost: 0,
    accent: '#d97706',
    accentRgb: '217, 119, 6',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #78350f 0%, #b45309 52%, #d97706 100%)',
    surfaceBg: '#fffbeb',
    emotion: 'Energy',
    moodTags: ['Energy', 'Warm', 'Cosmic'],
    moodLabel: 'Energy · Warm · ☀ bão lửa nhật hoa ☀',
    asciiSample: '☀ ✦ ✸ * ° · ✸ ✦',
    chars: '·°*✦✸☀',
    description: 'Vòng cung plasma mặt trời tỏa sáng rực rỡ từ tâm năng lượng.'
  },
  {
    id: 'deep-cosmos',
    name: 'Deep Cosmos',
    tier: 'free',
    cost: 0,
    accent: '#4338ca',
    accentRgb: '67, 56, 202',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 55%, #4f46e5 100%)',
    surfaceBg: '#eef2ff',
    emotion: 'Mystery',
    moodTags: ['Mystery', 'Cosmic', 'Learning'],
    moodLabel: 'Mystery · Cosmic · ✦ tinh vân vũ trụ sâu ✦',
    asciiSample: '· * + ✦ ✧ ★ ⋆ ·',
    chars: '·*+✦✧★⋆',
    description: 'Trường sao 3 lớp có chiều sâu thị sai cùng sao băng bay ngang.'
  },
  {
    id: 'singularity-omega',
    name: 'Singularity Ω',
    tier: 'free',
    cost: 0,
    accent: '#6d28d9',
    accentRgb: '109, 40, 217',
    contrastText: '#ffffff',
    headerBg: 'linear-gradient(135deg, #2e1065 0%, #5b21b6 48%, #0284c7 100%)',
    surfaceBg: '#f5f3ff',
    emotion: 'Mystery',
    moodTags: ['Mystery', 'Cosmic', 'Energy'],
    moodLabel: 'Mystery · Energy · Ω chân trời sự kiện hố đen Ω',
    asciiSample: '@ # % * + = - : · Ω',
    chars: '·:-=+*#%@Ω',
    description: 'Đĩa bồi tụ hấp dẫn bẻ cong ánh sáng quanh chân trời sự kiện Ω.'
  }
];
