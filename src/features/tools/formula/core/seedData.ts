import type { FormulaEntry } from './types';

const SEED_TIMESTAMP = '2026-09-01T08:00:00.000Z';

import { EXTRA_FORMULAS } from './extraSeed';

const BASE_FORMULAS: FormulaEntry[] = [
  {
    id: 'math-identities-square',
    subject: 'Toán học',
    topic: 'Đại số',
    title: 'Bình phương của một tổng và một hiệu',
    expression: '(a + b)² = a² + 2ab + b²\n(a − b)² = a² − 2ab + b²',
    explanation:
      'a, b là hai biểu thức đại số tùy ý. Lưu ý luôn có hạng tử tích đôi 2ab và giữ đúng dấu trừ trước 2ab ở hằng đẳng thức hiệu.',
    example: '(x + 3)² = x² + 2 × x × 3 + 3² = x² + 6x + 9',
    isPriority: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'math-quadratic-formula',
    subject: 'Toán học',
    topic: 'Đại số',
    title: 'Công thức nghiệm phương trình bậc hai',
    expression: 'ax² + bx + c = 0 (a ≠ 0)\nΔ = b² − 4ac  |  x₁,₂ = (−b ± √Δ) / (2a)',
    explanation:
      'Nếu Δ > 0: hai nghiệm phân biệt. Nếu Δ = 0: nghiệm kép x₁ = x₂ = −b / (2a). Nếu Δ < 0: phương trình vô nghiệm thực.',
    example:
      'x² − 5x + 6 = 0 có Δ = (−5)² − 4 × 1 × 6 = 1 > 0 ⇒ x₁ = (5 + 1) / 2 = 3; x₂ = (5 − 1) / 2 = 2.',
    isPriority: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'math-pythagoras',
    subject: 'Toán học',
    topic: 'Hình học',
    title: 'Định lý Pythagore trong tam giác vuông',
    expression: 'c² = a² + b²',
    explanation:
      'c là độ dài cạnh huyền (đối diện góc vuông); a và b là độ dài hai cạnh góc vuông. Các cạnh phải cùng đơn vị đo trước khi thay số.',
    example:
      'Tam giác vuông có a = 6 cm, b = 8 cm ⇒ cạnh huyền c = √(6² + 8²) = √100 = 10 cm.',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'math-circle-area',
    subject: 'Toán học',
    topic: 'Hình học',
    title: 'Chu vi và diện tích hình tròn',
    expression: 'C = 2πR = πd\nS = πR²',
    explanation:
      'R là bán kính, d = 2R là đường kính, π ≈ 3,14. Khi đề bài cho đường kính d, nhớ chia đôi lấy R rồi mới tính diện tích S.',
    example:
      'Hình tròn bán kính R = 5 cm có C ≈ 2 × 3,14 × 5 = 31,4 cm và S ≈ 3,14 × 5² = 78,5 cm².',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'phys-ohm-law',
    subject: 'Vật lý',
    topic: 'Điện học',
    title: 'Định luật Ôm cho đoạn mạch',
    expression: 'I = U / R',
    explanation:
      'I là cường độ dòng điện (A), U là hiệu điện thế hai đầu đoạn mạch (V), R là điện trở (Ω). Công thức suy ra: U = I × R và R = U / I.',
    example:
      'Đặt hiệu điện thế U = 12 V vào điện trở R = 6 Ω ⇒ cường độ dòng điện I = 12 / 6 = 2 A.',
    isPriority: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'phys-power-joule',
    subject: 'Vật lý',
    topic: 'Điện học',
    title: 'Công suất điện và Định luật Jun – Len-xơ',
    expression: 'P = U × I = I² × R = U² / R\nQ = I² × R × t',
    explanation:
      'P là công suất điện (W), Q là nhiệt lượng tỏa ra trên dây dẫn (J), t là thời gian dòng điện chạy qua (s). Luôn đổi thời gian về giây (s) khi tính Q.',
    example:
      'Dây dẫn R = 40 Ω, dòng điện I = 2 A chạy trong t = 5 phút = 300 s ⇒ Q = 2² × 40 × 300 = 48 000 J = 48 kJ.',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'phys-speed-density',
    subject: 'Vật lý',
    topic: 'Cơ học',
    title: 'Tốc độ chuyển động và Khối lượng riêng',
    expression: 'v = s / t\nD = m / V',
    explanation:
      'v là tốc độ (m/s hoặc km/h), s là quãng đường, t là thời gian (1 m/s = 3,6 km/h). D là khối lượng riêng (kg/m³), m là khối lượng (kg), V là thể tích (m³).',
    example:
      'Xe đi quãng đường s = 90 km trong t = 1,5 giờ ⇒ tốc độ v = 90 / 1,5 = 60 km/h (≈ 16,7 m/s).',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'chem-mol-mass-volume',
    subject: 'Hóa học',
    topic: 'Mol và tính toán',
    title: 'Tính số mol theo khối lượng và thể tích khí (đkc)',
    expression: 'n = m / M\nn = V / 24,79 (ở đkc: 25 °C, 1 bar)',
    explanation:
      'n là số mol (mol), m là khối lượng chất (g), M là khối lượng mol (g/mol), V là thể tích khí ở điều kiện chuẩn (L). Theo GDPT 2018, 1 mol khí ở đkc chiếm 24,79 L.',
    example:
      '4,958 L khí O₂ ở đkc có n = 4,958 / 24,79 = 0,2 mol ⇒ khối lượng m = 0,2 × 32 = 6,4 g.',
    isPriority: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'chem-concentration',
    subject: 'Hóa học',
    topic: 'Dung dịch',
    title: 'Nồng độ phần trăm và Nồng độ mol',
    expression: 'C% = (m_ct / m_dd) × 100%\nC_M = n / V_dd',
    explanation:
      'm_ct là khối lượng chất tan (g), m_dd = m_ct + m_dm là khối lượng dung dịch (g), n là số mol chất tan (mol), V_dd là thể tích dung dịch (L). Nhớ đổi mL sang L khi tính C_M.',
    example:
      'Hòa tan 20 g muối ăn vào 80 g nước thu được m_dd = 100 g ⇒ C% = (20 / 100) × 100% = 20%.',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'chem-valence-rule',
    subject: 'Hóa học',
    topic: 'Quy tắc hóa học',
    title: 'Quy tắc hóa trị trong hợp chất hai nguyên tố',
    expression: 'a × x = b × y  (với công thức AₓBᵧ)',
    explanation:
      'a, b là hóa trị tương ứng của nguyên tố (hoặc nhóm nguyên tử) A và B; x, y là chỉ số nguyên tử. Dùng để lập nhanh công thức hóa học hoặc tìm hóa trị chưa biết.',
    example:
      'Lập CTHH của Al (hóa trị III) và O (hóa trị II): 3 × x = 2 × y ⇒ chọn x = 2, y = 3 ⇒ công thức Al₂O₃.',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'eng-first-conditional',
    subject: 'Tiếng Anh',
    topic: 'Ngữ pháp',
    title: 'Câu điều kiện loại 1 (First Conditional)',
    expression: 'If + S + V(s/es), S + will / can / may + V_inf',
    explanation:
      'Diễn tả sự việc có thật, có khả năng xảy ra ở hiện tại hoặc tương lai. Mệnh đề chứa If luôn chia thì hiện tại đơn, không dùng will trong mệnh đề If.',
    example:
      'If it rains tomorrow, we will stay at home. (Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà.)',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'eng-present-perfect',
    subject: 'Tiếng Anh',
    topic: 'Ngữ pháp',
    title: 'Thì Hiện tại hoàn thành (Present Perfect)',
    expression: 'S + have / has + V₃ / V-ed',
    explanation:
      'Diễn tả hành động bắt đầu trong quá khứ và kéo dài đến hiện tại, hoặc trải nghiệm không rõ thời điểm. Dấu hiệu: since + mốc thời gian, for + khoảng thời gian, just, already, yet.',
    example:
      'She has learned English for four years. (Cô ấy đã học tiếng Anh được bốn năm.)',
    isPriority: false,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

export const SEED_FORMULAS: FormulaEntry[] = [...BASE_FORMULAS, ...EXTRA_FORMULAS];
