export interface EvolutionStage {
  stageNum: number;
  minLevel: number;
  emoji: string;
  title: string;
  description: string;
}

export interface AvatarEvolution {
  id: number;
  label: string;
  color: string;
  stages: EvolutionStage[];
}

export const AVATAR_EVOLUTIONS: AvatarEvolution[] = [
  {
    id: 0,
    label: "Mèo Thông Thái",
    color: "bg-pink-100 border-pink-200 text-pink-600",
    stages: [
      { stageNum: 1, minLevel: 1, emoji: "😽", title: "Mèo Nhép Tò Mò", description: "Mèo con mới chập chững bước chân vào thế giới tri thức học đường." },
      { stageNum: 2, minLevel: 2, emoji: "🐱", title: "Mèo Tri Thức", description: "Bắt đầu biết thắc mắc và yêu thích tự học hỏi các bài học mới." },
      { stageNum: 3, minLevel: 4, emoji: "🐈‍💻", title: "Mèo Bách Khoa", description: "Chiến thần gõ phím, tự ôn luyện mọi đề thi không quản ngày đêm." },
      { stageNum: 4, minLevel: 6, emoji: "🐯", title: "Mãnh Hổ Hoàng Gia", description: "Đạt đến đỉnh cao trí tuệ, dũng cảm chinh phục mọi đấu trường!" }
    ]
  },
  {
    id: 1,
    label: "Khủng Long Học Tập",
    color: "bg-emerald-100 border-emerald-200 text-emerald-600",
    stages: [
      { stageNum: 1, minLevel: 1, emoji: "🥚", title: "Trứng Tiền Sử", description: "Quả trứng bí ẩn chứa đựng ước mơ học tập đang chờ ngày thức giấc." },
      { stageNum: 2, minLevel: 2, emoji: "🦖", title: "Khủng Long Nhí", description: "Chú khủng long con háu ăn kiến thức, làm bài kiểm tra cực nhanh." },
      { stageNum: 3, minLevel: 4, emoji: "🦕", title: "Khổng Lồ Trí Tuệ", description: "Tầm vóc vượt trội, sở hữu khả năng phân tích kiến thức sâu rộng." },
      { stageNum: 4, minLevel: 6, emoji: "🐉", title: "Thần Long Đấu Trí", description: "Phượng múa rồng bay, hóa thân thành rồng thần thông thái tối cao!" }
    ]
  },
  {
    id: 2,
    label: "Cáo Nhanh Trí",
    color: "bg-orange-100 border-orange-200 text-orange-600",
    stages: [
      { stageNum: 1, minLevel: 1, emoji: "🐾", title: "Chân Nhỏ Tinh Nghịch", description: "Chú cáo nhỏ mới chỉ để lại những dấu chân tò mò đầu tiên." },
      { stageNum: 2, minLevel: 2, emoji: "🦊", title: "Cáo Lanh Lợi", description: "Nhạy bén giải quyết các câu hỏi hóc búa từ AI cực kỳ thông minh." },
      { stageNum: 3, minLevel: 4, emoji: "🐺", title: "Sói Bạc Kiên Cường", description: "Kỷ luật thép, luôn kiên trì tự lập kế hoạch học tập xuất sắc." },
      { stageNum: 4, minLevel: 6, emoji: "🦄", title: "Lân Quang Vũ Trụ", description: "Hóa thân thành sinh vật huyền thoại lấp lánh hào quang tri thức." }
    ]
  },
  {
    id: 3,
    label: "Gấu Cần Cù",
    color: "bg-blue-100 border-blue-200 text-blue-600",
    stages: [
      { stageNum: 1, minLevel: 1, emoji: "🧸", title: "Gấu Bông Tập Sự", description: "Chú gấu nhỏ ngoan ngoãn lắng nghe bài giảng chăm chỉ mỗi ngày." },
      { stageNum: 2, minLevel: 2, emoji: "🐼", title: "Gấu Trúc Cần Mẫn", description: "Siêu sao gặm nhấm sách vở, miệt mài ghi chú bài học chất lượng." },
      { stageNum: 3, minLevel: 4, emoji: "🐻", title: "Gấu Xám Uy Nghi", description: "Sức mạnh trí tuệ vô song, không ngại bất kỳ thử thách khó nhằn nào." },
      { stageNum: 4, minLevel: 6, emoji: "🐻‍❄️", title: "Bạch Gấu Bắc Cực", description: "Làm chủ vùng đất lạnh giá của tri thức siêu việt và tinh thông." }
    ]
  },
  {
    id: 4,
    label: "Phi Hành Gia",
    color: "bg-purple-100 border-purple-200 text-purple-600",
    stages: [
      { stageNum: 1, minLevel: 1, emoji: "🌠", title: "Sao Băng Nhỏ", description: "Một tia sáng ban sơ vừa được thắp lên giữa bầu trời đêm mênh mông." },
      { stageNum: 2, minLevel: 2, emoji: "🚀", title: "Tên Lửa Đẩy", description: "Tăng tốc cực mạnh, phóng thẳng vào quỹ đạo bài giảng chất lượng cao." },
      { stageNum: 3, minLevel: 4, emoji: "👨‍🚀", title: "Nhà Du Hành", description: "Tự tin khám phá những hành tinh kiến thức mới mẻ chưa ai đặt chân." },
      { stageNum: 4, minLevel: 6, emoji: "🪐", title: "Chúa Tể Thiên Hà", description: "Làm chủ không gian học tập vô tận, điều khiển vũ trụ trí tuệ." }
    ]
  },
  {
    id: 5,
    label: "Sư Tử Kiên Trì",
    color: "bg-amber-100 border-amber-200 text-amber-600",
    stages: [
      { stageNum: 1, minLevel: 1, emoji: "🦁", title: "Sư Tử Nhí", description: "Chú sư tử con nghịch ngợm, dấn thân vào các bài học đầy hào hứng." },
      { stageNum: 2, minLevel: 2, emoji: "🐆", title: "Báo Swift Bứt Phá", description: "Nhanh như cắt, hoàn thành đố vui trắc nghiệm đạt điểm tối đa." },
      { stageNum: 3, minLevel: 4, emoji: "🦁", title: "Sư Tử Tôn Quý", description: "Dáng dấp thủ lĩnh kiêu hãnh, luôn dẫn đầu bảng thành tích học tập." },
      { stageNum: 4, minLevel: 6, emoji: "👑🦁", title: "Chúa Tể Muôn Loài", description: "Vị vua sở hữu vương miện danh vọng và bộ óc chiến thuật thiên tài." }
    ]
  }
];

export function getAvatarAtLevel(avatarId: number, level: number) {
  const avatar = AVATAR_EVOLUTIONS[avatarId] || AVATAR_EVOLUTIONS[0];
  // Find the highest stage that satisfies minLevel <= level
  let currentStage = avatar.stages[0];
  for (const stage of avatar.stages) {
    if (level >= stage.minLevel) {
      currentStage = stage;
    }
  }
  return currentStage;
}

export function getNextStageAtLevel(avatarId: number, level: number) {
  const avatar = AVATAR_EVOLUTIONS[avatarId] || AVATAR_EVOLUTIONS[0];
  // Find the first stage that has minLevel > level
  return avatar.stages.find(stage => stage.minLevel > level) || null;
}
