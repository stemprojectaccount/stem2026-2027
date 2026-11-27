import type { FormulaEntry } from './types';

// Bổ sung kho công thức THCS (chương trình GDPT 2018) cho Sổ công thức trong SmartStudy.
const T = '2026-11-20T08:00:00.000Z';
const f = (
  id: string,
  subject: string,
  topic: string,
  title: string,
  expression: string,
  explanation: string,
  example: string,
  isPriority = false
): FormulaEntry => ({ id, subject, topic, title, expression, explanation, example, isPriority, createdAt: T, updatedAt: T });

export const EXTRA_FORMULAS: FormulaEntry[] = [
  // ---------- Toán ----------
  f('math-diff-squares', 'Toán học', 'Đại số', 'Hiệu hai bình phương', 'a² − b² = (a − b)(a + b)',
    'Dùng để phân tích đa thức thành nhân tử hoặc tính nhanh.', '99 × 101 = (100 − 1)(100 + 1) = 100² − 1 = 9 999', true),
  f('math-cubes', 'Toán học', 'Đại số', 'Lập phương của một tổng / một hiệu', '(a + b)³ = a³ + 3a²b + 3ab² + b³\n(a − b)³ = a³ − 3a²b + 3ab² − b³',
    'Hệ số 1 – 3 – 3 – 1; ở hằng đẳng thức hiệu, dấu đan xen + − + −.', '(x + 1)³ = x³ + 3x² + 3x + 1'),
  f('math-sum-cubes', 'Toán học', 'Đại số', 'Tổng / hiệu hai lập phương', 'a³ + b³ = (a + b)(a² − ab + b²)\na³ − b³ = (a − b)(a² + ab + b²)',
    'Ngoặc thứ hai gọi là "bình phương thiếu" (hệ số giữa là 1, không phải 2).', 'x³ − 8 = (x − 2)(x² + 2x + 4)'),
  f('math-vieta', 'Toán học', 'Đại số', 'Hệ thức Vi-ét', 'x₁ + x₂ = −b/a\nx₁ · x₂ = c/a',
    'Áp dụng khi phương trình ax² + bx + c = 0 (a ≠ 0) có nghiệm (Δ ≥ 0). Nếu a + b + c = 0 thì x₁ = 1, x₂ = c/a.',
    'x² − 5x + 6 = 0 ⇒ x₁ + x₂ = 5, x₁x₂ = 6 ⇒ hai nghiệm là 2 và 3.', true),
  f('math-reduced-delta', 'Toán học', 'Đại số', 'Công thức nghiệm thu gọn (b chẵn)', "b = 2b'  ⇒  Δ' = b'² − ac\nx₁,₂ = (−b' ± √Δ') / a",
    "Dùng khi hệ số b chẵn để tính nhanh, số nhỏ hơn và ít sai hơn.", "x² − 6x + 5 = 0: b' = −3, Δ' = 9 − 5 = 4 ⇒ x = 3 ± 2 ⇒ x₁ = 5, x₂ = 1."),
  f('math-linear-function', 'Toán học', 'Hàm số', 'Hàm số bậc nhất y = ax + b', 'y = ax + b (a ≠ 0)\nHai đường thẳng song song ⇔ a = a\', b ≠ b\'\nVuông góc ⇔ a·a\' = −1',
    'a là hệ số góc: a > 0 hàm đồng biến, a < 0 nghịch biến. Đồ thị cắt trục tung tại (0; b).', 'y = 2x − 3 cắt Oy tại (0; −3), cắt Ox tại (1,5; 0).'),
  f('math-trig-ratios', 'Toán học', 'Hình học', 'Tỉ số lượng giác của góc nhọn', 'sin α = đối / huyền     cos α = kề / huyền\ntan α = đối / kề        cot α = kề / đối',
    'Mẹo nhớ: "Sin đi học, Cos không hư, Tan đoàn kết, Cot kết đoàn". sin²α + cos²α = 1.', 'Tam giác vuông có cạnh đối 3, kề 4, huyền 5 ⇒ sin α = 0,6; cos α = 0,8; tan α = 0,75.', true),
  f('math-right-triangle', 'Toán học', 'Hình học', 'Hệ thức lượng trong tam giác vuông', 'b² = a·b\'   c² = a·c\'\nh² = b\'·c\'   a·h = b·c\n1/h² = 1/b² + 1/c²',
    'a: cạnh huyền; b, c: cạnh góc vuông; h: đường cao ứng với cạnh huyền; b\', c\': hình chiếu của b, c trên cạnh huyền.', 'b = 6, c = 8 ⇒ a = 10, h = 6·8/10 = 4,8.'),
  f('math-areas', 'Toán học', 'Hình học', 'Diện tích tam giác, hình thang, hình bình hành', 'S tam giác = ½ · a · h\nS hình thang = ½ · (a + b) · h\nS hình bình hành = a · h',
    'h là chiều cao tương ứng với cạnh đáy a (với hình thang: a, b là hai đáy).', 'Hình thang đáy 6 cm và 10 cm, cao 4 cm ⇒ S = ½ · 16 · 4 = 32 cm².'),
  f('math-solids', 'Toán học', 'Hình học', 'Hình trụ, hình nón, hình cầu', 'Trụ: V = πr²h,  Sxq = 2πrh\nNón: V = ⅓πr²h,  Sxq = πrl\nCầu: V = 4⁄3 πR³,  S = 4πR²',
    'r là bán kính đáy, h là chiều cao, l là đường sinh của hình nón (l² = r² + h²).', 'Hình cầu R = 3 cm ⇒ V = 4/3 · π · 27 = 36π ≈ 113,1 cm³.'),
  f('math-percent', 'Toán học', 'Số học', 'Tỉ số phần trăm', 'a% của b = b · a / 100\nTỉ số phần trăm của a so với b = a / b · 100%',
    'Tăng a% thì nhân với (1 + a/100); giảm a% thì nhân với (1 − a/100).', 'Áo giá 200 000 đ giảm 15% ⇒ 200 000 · 0,85 = 170 000 đ.'),
  f('math-powers', 'Toán học', 'Số học', 'Lũy thừa với số mũ tự nhiên', 'aᵐ · aⁿ = aᵐ⁺ⁿ   aᵐ : aⁿ = aᵐ⁻ⁿ\n(aᵐ)ⁿ = aᵐ·ⁿ   (a·b)ⁿ = aⁿ·bⁿ\na⁰ = 1 (a ≠ 0)',
    'Nhân hai lũy thừa cùng cơ số: giữ cơ số, cộng số mũ; chia: trừ số mũ.', '2³ · 2⁴ = 2⁷ = 128; 5⁶ : 5⁴ = 5² = 25'),
  f('math-probability', 'Toán học', 'Thống kê và xác suất', 'Xác suất của biến cố', 'P(A) = số kết quả thuận lợi cho A / tổng số kết quả có thể',
    'Các kết quả phải đồng khả năng. 0 ≤ P(A) ≤ 1.', 'Gieo xúc xắc, P(ra số chẵn) = 3/6 = 0,5.'),

  // ---------- Vật lý (KHTN) ----------
  f('phys-weight', 'Vật lý', 'Cơ học', 'Trọng lượng và khối lượng', 'P = 10 · m',
    'P: trọng lượng (N); m: khối lượng (kg). Hệ số 10 là gần đúng của g ≈ 9,8 N/kg.', 'Vật 2,5 kg có trọng lượng P = 25 N.'),
  f('phys-pressure', 'Vật lý', 'Áp suất', 'Áp suất chất rắn', 'p = F / S',
    'p: áp suất (Pa = N/m²); F: áp lực (N); S: diện tích bị ép (m²). Nhớ đổi cm² sang m² (1 cm² = 0,0001 m²).', 'F = 600 N, S = 0,03 m² ⇒ p = 20 000 Pa.', true),
  f('phys-liquid-pressure', 'Vật lý', 'Áp suất', 'Áp suất chất lỏng', 'p = d · h',
    'd: trọng lượng riêng của chất lỏng (N/m³), nước d = 10 000 N/m³; h: độ sâu tính từ mặt thoáng (m).', 'Ở độ sâu 3 m trong nước: p = 10 000 · 3 = 30 000 Pa.'),
  f('phys-archimedes', 'Vật lý', 'Áp suất', 'Lực đẩy Archimedes', 'Fₐ = d · V',
    'd: trọng lượng riêng chất lỏng (N/m³); V: thể tích phần chất lỏng bị vật chiếm chỗ (m³). Vật nổi khi Fₐ > P.', 'Vật chìm hẳn trong nước, V = 0,002 m³ ⇒ Fₐ = 10 000 · 0,002 = 20 N.'),
  f('phys-work-power', 'Vật lý', 'Năng lượng', 'Công cơ học và công suất', 'A = F · s\nP = A / t',
    'A: công (J); F: lực (N); s: quãng đường theo phương của lực (m); P: công suất (W); t: thời gian (s).', 'Kéo vật bằng lực 50 N đi 4 m trong 10 s: A = 200 J, P = 20 W.'),
  f('phys-kinetic-potential', 'Vật lý', 'Năng lượng', 'Động năng và thế năng trọng trường', 'Wđ = ½ · m · v²\nWt = P · h = 10 · m · h',
    'm (kg), v (m/s), h (m) so với mốc thế năng. Cơ năng W = Wđ + Wt.', 'Quả bóng 0,5 kg bay 4 m/s có Wđ = ½ · 0,5 · 16 = 4 J.'),
  f('phys-heat', 'Vật lý', 'Nhiệt học', 'Nhiệt lượng', 'Q = m · c · Δt',
    'c: nhiệt dung riêng (J/kg·K), nước c = 4 200; Δt = t₂ − t₁ (°C). Cân bằng nhiệt: Q tỏa = Q thu.', 'Đun 2 kg nước từ 25 °C lên 100 °C: Q = 2 · 4 200 · 75 = 630 000 J.', true),
  f('phys-series-parallel', 'Vật lý', 'Điện học', 'Đoạn mạch nối tiếp và song song', 'Nối tiếp: I = I₁ = I₂;  U = U₁ + U₂;  R = R₁ + R₂\nSong song: U = U₁ = U₂;  I = I₁ + I₂;  1/R = 1/R₁ + 1/R₂',
    'Hai điện trở song song: R = R₁·R₂ / (R₁ + R₂).', 'R₁ = 6 Ω // R₂ = 3 Ω ⇒ R = 18/9 = 2 Ω.', true),
  f('phys-reflection', 'Vật lý', 'Quang học', 'Định luật phản xạ ánh sáng', 'i\' = i',
    'Tia phản xạ nằm trong mặt phẳng chứa tia tới và pháp tuyến; góc phản xạ bằng góc tới.', 'Chiếu tia sáng tạo với gương 30° ⇒ góc tới i = 60°, góc phản xạ i\' = 60°.'),

  // ---------- Hóa học ----------
  f('chem-mol-particles', 'Hóa học', 'Mol và tính toán', 'Số mol và số hạt', 'N = n · 6,022 × 10²³',
    'N: số nguyên tử/phân tử; n: số mol; 6,022 × 10²³ là số Avogadro (NA).', '0,5 mol H₂O chứa 0,5 · 6,022 × 10²³ ≈ 3,011 × 10²³ phân tử.'),
  f('chem-relative-density', 'Hóa học', 'Mol và tính toán', 'Tỉ khối của chất khí', 'd(A/B) = M_A / M_B\nd(A/kk) = M_A / 29',
    'd > 1: khí A nặng hơn khí B. Không khí có M ≈ 29 g/mol.', 'd(CO₂/kk) = 44/29 ≈ 1,52 ⇒ CO₂ nặng hơn không khí.'),
  f('chem-mass-conservation', 'Hóa học', 'Phản ứng hóa học', 'Định luật bảo toàn khối lượng', 'm(chất tham gia) = m(sản phẩm)',
    'Trong phản ứng, số nguyên tử mỗi nguyên tố được giữ nguyên nên tổng khối lượng không đổi.', 'Đốt 12 g C với 32 g O₂ thu được 44 g CO₂.'),
  f('chem-yield', 'Hóa học', 'Phản ứng hóa học', 'Hiệu suất phản ứng', 'H = m(thực tế) / m(lí thuyết) · 100%',
    'Tính theo chất phản ứng hết (không tính theo chất dư).', 'Lí thuyết thu 10 g, thực tế 8 g ⇒ H = 80%.'),
  f('chem-ph', 'Hóa học', 'Dung dịch', 'Thang pH', 'pH < 7: acid   pH = 7: trung tính   pH > 7: base',
    'pH càng nhỏ tính acid càng mạnh, càng lớn tính base càng mạnh.', 'Nước chanh pH ≈ 2 (acid); xà phòng pH ≈ 9–10 (base).'),

  // ---------- Sinh học ----------
  f('bio-photosynthesis', 'Sinh học', 'Trao đổi chất', 'Phương trình quang hợp', '6CO₂ + 6H₂O —(ánh sáng, diệp lục)→ C₆H₁₂O₆ + 6O₂',
    'Quang hợp chuyển năng lượng ánh sáng thành năng lượng hóa học, thải O₂.', 'Cây xanh hấp thụ CO₂ ban ngày và nhả O₂.'),
  f('bio-respiration', 'Sinh học', 'Trao đổi chất', 'Phương trình hô hấp tế bào', 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + năng lượng (ATP)',
    'Ngược với quang hợp; diễn ra ở ti thể, giải phóng năng lượng cho tế bào.', 'Khi chạy bộ, cơ thể hô hấp mạnh hơn nên thở nhanh hơn.'),

  // ---------- Tiếng Anh ----------
  f('eng-present-simple', 'Tiếng Anh', 'Ngữ pháp', 'Thì Hiện tại đơn (Present Simple)', 'S + V(s/es)\nS + do/does + not + V\nDo/Does + S + V?',
    'Dùng cho thói quen, sự thật hiển nhiên. He/She/It: thêm -s/-es vào động từ.', 'She goes to school by bike every day.', true),
  f('eng-past-simple', 'Tiếng Anh', 'Ngữ pháp', 'Thì Quá khứ đơn (Past Simple)', 'S + V2/V-ed\nS + did not + V\nDid + S + V?',
    'Hành động đã xảy ra và kết thúc trong quá khứ; thường đi với yesterday, ago, last…', 'I visited my grandparents last weekend.'),
  f('eng-passive', 'Tiếng Anh', 'Ngữ pháp', 'Câu bị động (Passive Voice)', 'S + be + V3/V-ed (+ by O)',
    'Chia "be" theo thì của câu chủ động; tân ngữ của câu chủ động thành chủ ngữ.', 'They built this bridge in 2010. → This bridge was built in 2010.', true),
  f('eng-second-conditional', 'Tiếng Anh', 'Ngữ pháp', 'Câu điều kiện loại 2', 'If + S + V2/V-ed, S + would + V',
    'Giả định không có thật ở hiện tại. Với "be" dùng "were" cho mọi ngôi.', 'If I were you, I would study harder.'),
  f('eng-comparison', 'Tiếng Anh', 'Ngữ pháp', 'So sánh hơn và so sánh nhất', 'Tính từ ngắn: adj-er than / the adj-est\nTính từ dài: more adj than / the most adj',
    'Bất quy tắc: good → better → the best; bad → worse → the worst.', 'This book is more interesting than that one.'),
  f('eng-reported-speech', 'Tiếng Anh', 'Ngữ pháp', 'Câu tường thuật (Reported Speech)', 'Lùi thì: am/is → was, will → would, can → could\nnow → then, today → that day',
    'Đổi đại từ và trạng từ chỉ thời gian, nơi chốn cho phù hợp người kể.', '"I am tired," she said. → She said (that) she was tired.'),
];
