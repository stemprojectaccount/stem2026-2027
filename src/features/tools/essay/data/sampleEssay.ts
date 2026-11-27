import type { CriterionInput, LanguagePreference } from '../analyzer';

export interface SampleEssayData {
  label: string;
  language: LanguagePreference;
  title: string;
  content: string;
  criteria: CriterionInput[];
}

/**
 * Dữ liệu bài viết mẫu Tiếng Việt (lớp 8) có cài sẵn một vài lỗi phổ biến
 * để học sinh trải nghiệm cách chỉ lỗi và hướng dẫn sửa.
 */
export const SAMPLE_ESSAY: SampleEssayData = {
  label: 'Bài mẫu Tiếng Việt (lớp 8)',
  language: 'vi',
  title: 'Giữ gìn trường lớp xanh, sạch từ những việc nhỏ',
  content: [
    'Mỗi buổi sáng bước vào sân trường, không gian sạch đẹp luôn mang lại cảm giác thoải mái cho thầy cô và học sinh . Tuy nhiên, thói quen xả rác bừa bãi vẫn còn xuất hiện ở một số hành lang sau giờ ra chơi. bảo vệ môi trường học đường thực ra không hề xa vời mà bắt đầu ngay từ ý thức hằng ngày của mỗi người.',
    'Khi chúng ta chủ động phân loại rác vào đúng thùng quy định, tắt quạt và bóng đèn mỗi khi rời khỏi phòng học, đồng thời mang theo bình nước cá nhân thay cho chai nhựa dùng một lần để giảm rác thải nhựa, ngôi trường sẽ trở nên gọn gàng và tiết kiệm tài nguyên hơn rất nhiều. Những hành động nhỏ ấy nếu được duy trì đều đặn mỗi ngày sẽ nhanh chóng trở thành nếp sống văn minh chung của cả tập thể lớp. Hành động nhỏ lặp lại mỗi ngày luôn tạo nên thay đổi tích cực. Hành động nhỏ ấy còn truyền cảm hứng cho các bạn lớp dưới.',
    'Ngoài ra, từng chi đội có thể tổ chức góc cây xanh cuối lớp để học sinh cùng chăm sóc và nhắc nhở nhau giữ gìn vệ sinh chung. Khi mỗi học sinh tự giác gương mẫu, không gian học tập sẽ luôn trong lành và thân thiện',
  ].join('\n\n'),
  criteria: [
    { id: 'sample-vi-1', text: 'bảo vệ môi trường' },
    { id: 'sample-vi-2', text: 'phân loại rác' },
    { id: 'sample-vi-3', text: 'rác thải nhựa' },
    { id: 'sample-vi-4', text: 'tổ chức góc cây xanh trong lớp học' },
    { id: 'sample-vi-5', text: 'tái chế giấy vụn' },
  ],
};

/**
 * Dữ liệu bài viết mẫu Tiếng Anh (THCS) có cài sẵn các lỗi thường gặp
 * (viết thường 'i', thiếu dấu nháy đơn 'dont', sai mạo từ 'a important', lỗi chính tả 'enviroment',
 * 'can to', câu dài và thiếu dấu chấm cuối đoạn).
 */
export const SAMPLE_ENGLISH_ESSAY: SampleEssayData = {
  label: 'Bài mẫu Tiếng Anh (THCS)',
  language: 'en',
  title: 'How Students Can Protect Our School Environment',
  content: [
    'Protecting the enviroment is a important duty for every student at school. Today, i want to share some simple habits that we can to practice every day. many students dont realize how much plastic waste we create during break time.',
    'When students bring reusable water bottles to class and put paper into recycling bins instead of throwing everything into one basket while also turning off classroom lights and fans before leaving, our school becomes cleaner and saves a lot of energy. Good habits help students stay healthy. Good habits build a friendly campus. Good habits also inspire younger friends.',
    'In conclusion, they is never too young to care about nature. Small daily actions can make a big difference for our green school',
  ].join('\n\n'),
  criteria: [
    { id: 'sample-en-1', text: 'reusable water bottles' },
    { id: 'sample-en-2', text: 'recycling bins' },
    { id: 'sample-en-3', text: 'plastic waste' },
    { id: 'sample-en-4', text: 'turn off classroom lights to save energy' },
    { id: 'sample-en-5', text: 'plant more trees' },
  ],
};
