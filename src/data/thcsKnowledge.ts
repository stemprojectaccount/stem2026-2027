// Short textbook facts for the offline assistant (src/lib/localMind.ts).
// THCS, Chương trình GDPT 2018 (Kết nối tri thức / Chân trời sáng tạo / Cánh diều agree on these basics).
// Each entry: [subject, other ways students ask it, answer]. CẦN GIÁO VIÊN KIỂM TRA khi mở rộng.
export type KnowledgeEntry = [subject: string, ask: string, answer: string];

export const THCS_KNOWLEDGE: KnowledgeEntry[] = [
  // ---------- Toán ----------
  ["Toán", "số nguyên tố là gì định nghĩa số nguyên tố", `**Số nguyên tố** là số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó.
- Ví dụ: 2, 3, 5, 7, 11, 13, 17, 19…
- 0 và 1 không là số nguyên tố, cũng không là hợp số.
- 2 là số nguyên tố chẵn duy nhất.`],
  ["Toán", "hợp số là gì", `**Hợp số** là số tự nhiên lớn hơn 1, có nhiều hơn hai ước.
Ví dụ: 4 (ước 1, 2, 4), 6, 8, 9, 10.`],
  ["Toán", "tập hợp số tự nhiên kí hiệu N N*", `**Tập hợp số tự nhiên** ℕ = {0; 1; 2; 3; …}.
Tập hợp số tự nhiên khác 0: ℕ* = {1; 2; 3; …}.
Mỗi số tự nhiên có đúng một số liền sau; số 0 là số tự nhiên nhỏ nhất, không có số tự nhiên lớn nhất.`],
  ["Toán", "dấu hiệu chia hết cho 2 cho 5 cho 3 cho 9", `**Dấu hiệu chia hết**
- Cho 2: chữ số tận cùng là 0, 2, 4, 6, 8.
- Cho 5: chữ số tận cùng là 0 hoặc 5.
- Cho 3: tổng các chữ số chia hết cho 3.
- Cho 9: tổng các chữ số chia hết cho 9.`],
  ["Toán", "cách tìm ước chung lớn nhất ƯCLN ucln", `**Tìm ƯCLN** (phân tích ra thừa số nguyên tố):
1. Phân tích mỗi số ra thừa số nguyên tố.
2. Chọn các thừa số nguyên tố **chung**.
3. Lấy mỗi thừa số với số mũ **nhỏ nhất**, rồi nhân lại.
Ví dụ: 24 = 2³·3, 36 = 2²·3² → ƯCLN = 2²·3 = 12.`],
  ["Toán", "cách tìm bội chung nhỏ nhất BCNN bcnn", `**Tìm BCNN** (phân tích ra thừa số nguyên tố):
1. Phân tích mỗi số ra thừa số nguyên tố.
2. Chọn các thừa số nguyên tố **chung và riêng**.
3. Lấy mỗi thừa số với số mũ **lớn nhất**, rồi nhân lại.
Ví dụ: 12 = 2²·3, 15 = 3·5 → BCNN = 2²·3·5 = 60.`],
  ["Toán", "thứ tự thực hiện phép tính", `**Thứ tự thực hiện phép tính**
- Không có ngoặc: lũy thừa → nhân, chia → cộng, trừ (cùng bậc thì từ trái sang phải).
- Có ngoặc: ( ) → [ ] → { }.`],
  ["Toán", "lũy thừa nhân chia hai lũy thừa cùng cơ số", `**Lũy thừa cùng cơ số**
- aᵐ · aⁿ = aᵐ⁺ⁿ
- aᵐ : aⁿ = aᵐ⁻ⁿ (a ≠ 0, m ≥ n)
- a⁰ = 1 (a ≠ 0); (aᵐ)ⁿ = aᵐ·ⁿ`],
  ["Toán", "giá trị tuyệt đối của một số", `**Giá trị tuyệt đối** của số a, kí hiệu |a|, là khoảng cách từ điểm a đến điểm 0 trên trục số.
- |a| = a nếu a ≥ 0; |a| = −a nếu a < 0.
- |a| ≥ 0 với mọi a.`],
  ["Toán", "quy đồng mẫu số phân số cộng trừ phân số khác mẫu", `**Quy đồng mẫu các phân số**
1. Tìm mẫu chung (thường là BCNN của các mẫu, mẫu phải dương).
2. Tìm thừa số phụ = mẫu chung : từng mẫu.
3. Nhân cả tử và mẫu với thừa số phụ tương ứng.
Cộng, trừ phân số khác mẫu: quy đồng rồi cộng, trừ các tử, giữ mẫu chung.`],
  ["Toán", "số hữu tỉ là gì", `**Số hữu tỉ** là số viết được dưới dạng phân số a/b với a, b là số nguyên, b ≠ 0. Tập hợp số hữu tỉ kí hiệu là ℚ.
Số hữu tỉ viết được dưới dạng số thập phân hữu hạn hoặc vô hạn tuần hoàn.`],
  ["Toán", "số vô tỉ số thực là gì", `**Số vô tỉ** là số viết được dưới dạng số thập phân vô hạn **không** tuần hoàn, ví dụ √2, π. Tập hợp kí hiệu 𝕀.
**Số thực** gồm số hữu tỉ và số vô tỉ, kí hiệu ℝ.`],
  ["Toán", "căn bậc hai số học là gì", `**Căn bậc hai số học** của số a ≥ 0 là số x ≥ 0 sao cho x² = a, kí hiệu √a.
Ví dụ: √25 = 5, √0 = 0. Số âm không có căn bậc hai (trong tập số thực).`],
  ["Toán", "tỉ lệ thức tính chất dãy tỉ số bằng nhau", `**Tỉ lệ thức** là đẳng thức của hai tỉ số a/b = c/d.
- Tính chất: a/b = c/d ⇒ a·d = b·c.
- **Dãy tỉ số bằng nhau:** a/b = c/d = (a + c)/(b + d) = (a − c)/(b − d) (các mẫu khác 0).`],
  ["Toán", "đại lượng tỉ lệ thuận tỉ lệ nghịch", `**Tỉ lệ thuận:** y = k·x (k ≠ 0). x tăng bao nhiêu lần thì y tăng bấy nhiêu lần; y/x = k không đổi.
**Tỉ lệ nghịch:** y = a/x hay x·y = a (a ≠ 0). x tăng bao nhiêu lần thì y giảm bấy nhiêu lần.`],
  ["Toán", "bảy hằng đẳng thức đáng nhớ", `**7 hằng đẳng thức đáng nhớ**
1. (A + B)² = A² + 2AB + B²
2. (A − B)² = A² − 2AB + B²
3. A² − B² = (A − B)(A + B)
4. (A + B)³ = A³ + 3A²B + 3AB² + B³
5. (A − B)³ = A³ − 3A²B + 3AB² − B³
6. A³ + B³ = (A + B)(A² − AB + B²)
7. A³ − B³ = (A − B)(A² + AB + B²)`],
  ["Toán", "các phương pháp phân tích đa thức thành nhân tử", `**Phân tích đa thức thành nhân tử**
- Đặt nhân tử chung: AB + AC = A(B + C).
- Dùng hằng đẳng thức: x² − 9 = (x − 3)(x + 3).
- Nhóm hạng tử: x² + xy + 2x + 2y = x(x + y) + 2(x + y) = (x + y)(x + 2).`],
  ["Toán", "phương trình bậc nhất một ẩn cách giải ax + b = 0", `**Phương trình bậc nhất một ẩn** có dạng ax + b = 0 (a ≠ 0).
Nghiệm duy nhất: x = −b/a.
Cách giải: chuyển vế (đổi dấu) các hạng tử chứa x sang một vế, số sang vế kia, rồi chia cho hệ số của x.`],
  ["Toán", "hàm số bậc nhất y = ax + b đồ thị hệ số góc song song cắt nhau", `**Hàm số bậc nhất** y = ax + b (a ≠ 0); a là **hệ số góc**.
- Đồ thị là đường thẳng cắt trục tung tại (0; b).
- a > 0: hàm đồng biến; a < 0: nghịch biến.
- Hai đường y = ax + b và y = a'x + b': song song khi a = a', b ≠ b'; trùng nhau khi a = a', b = b'; cắt nhau khi a ≠ a'.`],
  ["Toán", "giải hệ hai phương trình bậc nhất hai ẩn phương pháp thế phương pháp cộng đại số", `**Giải hệ hai phương trình bậc nhất hai ẩn**
- **Phương pháp thế:** từ một phương trình rút x (hoặc y) rồi thế vào phương trình còn lại.
- **Phương pháp cộng đại số:** nhân hai phương trình với số thích hợp để hệ số của một ẩn bằng nhau hoặc đối nhau, rồi cộng (trừ) vế theo vế.`],
  ["Toán", "công thức nghiệm phương trình bậc hai delta biệt thức delta phẩy công thức nghiệm thu gọn", `**Phương trình bậc hai** ax² + bx + c = 0 (a ≠ 0), Δ = b² − 4ac.
- Δ > 0: hai nghiệm phân biệt x = (−b ± √Δ)/(2a).
- Δ = 0: nghiệm kép x = −b/(2a).
- Δ < 0: vô nghiệm.
**Công thức thu gọn** (b = 2b'): Δ' = b'² − ac; x = (−b' ± √Δ')/a.`],
  ["Toán", "định lí viète hệ thức viète vi ét tổng và tích hai nghiệm", `**Định lí Viète:** nếu ax² + bx + c = 0 (a ≠ 0) có hai nghiệm x₁, x₂ thì
- x₁ + x₂ = −b/a
- x₁ · x₂ = c/a
Nhẩm nghiệm: a + b + c = 0 ⇒ x₁ = 1, x₂ = c/a; a − b + c = 0 ⇒ x₁ = −1, x₂ = −c/a.`],
  ["Toán", "bất phương trình bậc nhất một ẩn cách giải đổi chiều", `**Bất phương trình bậc nhất một ẩn:** ax + b > 0 (hoặc <, ≥, ≤), a ≠ 0.
- Chuyển vế thì đổi dấu hạng tử.
- Nhân (chia) hai vế với số **âm** thì phải **đổi chiều** bất đẳng thức.
Ví dụ: −3x + 9 > 0 ⇔ −3x > −9 ⇔ x < 3.`],
  ["Toán", "tổng ba góc trong một tam giác góc ngoài", `**Tổng ba góc trong một tam giác bằng 180°.**
Góc ngoài của tam giác bằng tổng hai góc trong không kề với nó.`],
  ["Toán", "các trường hợp bằng nhau của tam giác", `**Ba trường hợp bằng nhau của hai tam giác**
- Cạnh – cạnh – cạnh (c.c.c).
- Cạnh – góc – cạnh (c.g.c): góc xen giữa hai cạnh.
- Góc – cạnh – góc (g.c.g): cạnh xen giữa hai góc.
Tam giác vuông còn có: cạnh huyền – góc nhọn, cạnh huyền – cạnh góc vuông.`],
  ["Toán", "tam giác cân tam giác đều tính chất", `**Tam giác cân:** có hai cạnh bằng nhau; hai góc ở đáy bằng nhau.
**Tam giác đều:** ba cạnh bằng nhau; mỗi góc bằng 60°.`],
  ["Toán", "đường trung tuyến trọng tâm tam giác", `**Đường trung tuyến** nối một đỉnh với trung điểm cạnh đối diện.
Ba đường trung tuyến cắt nhau tại **trọng tâm G**, với AG = 2/3 AM (AM là trung tuyến).`],
  ["Toán", "các đường đồng quy trong tam giác phân giác trung trực đường cao trực tâm", `**Các điểm đồng quy trong tam giác**
- 3 trung tuyến → trọng tâm.
- 3 phân giác → điểm cách đều ba cạnh (tâm đường tròn nội tiếp).
- 3 trung trực → điểm cách đều ba đỉnh (tâm đường tròn ngoại tiếp).
- 3 đường cao → trực tâm.`],
  ["Toán", "bất đẳng thức tam giác điều kiện ba cạnh", `**Bất đẳng thức tam giác:** trong một tam giác, tổng hai cạnh bất kì luôn **lớn hơn** cạnh còn lại, hiệu hai cạnh luôn nhỏ hơn cạnh còn lại.
Mẹo kiểm tra: tổng hai cạnh nhỏ phải lớn hơn cạnh lớn nhất.`],
  ["Toán", "dấu hiệu nhận biết hai đường thẳng song song so le trong đồng vị", `**Hai đường thẳng song song** khi một đường thẳng cắt chúng tạo ra:
- một cặp góc so le trong bằng nhau, hoặc
- một cặp góc đồng vị bằng nhau.
Ngược lại, nếu a ∥ b thì các góc so le trong bằng nhau, các góc đồng vị bằng nhau.`],
  ["Toán", "định lí pythagore pitago tam giác vuông", `**Định lí Pythagore:** tam giác ABC vuông tại A thì BC² = AB² + AC² (bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông).
**Đảo lại:** nếu BC² = AB² + AC² thì tam giác vuông tại A.
Ví dụ: hai cạnh góc vuông 6 cm và 8 cm → cạnh huyền 10 cm.`],
  ["Toán", "định lí thalès talet ta lét", `**Định lí Thalès:** nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ.
Với DE ∥ BC (D ∈ AB, E ∈ AC): AD/AB = AE/AC, AD/DB = AE/EC.`],
  ["Toán", "đường trung bình của tam giác", `**Đường trung bình của tam giác** là đoạn nối trung điểm hai cạnh.
Nó **song song** với cạnh thứ ba và **bằng nửa** cạnh ấy.`],
  ["Toán", "các trường hợp đồng dạng của tam giác", `**Hai tam giác đồng dạng** khi có:
- ba cặp cạnh tương ứng tỉ lệ (c.c.c), hoặc
- hai cặp cạnh tỉ lệ và góc xen giữa bằng nhau (c.g.c), hoặc
- hai cặp góc bằng nhau (g.g).
Tỉ số diện tích bằng bình phương tỉ số đồng dạng.`],
  ["Toán", "hình bình hành tính chất dấu hiệu nhận biết", `**Hình bình hành:** tứ giác có các cạnh đối song song.
Tính chất: các cạnh đối bằng nhau, các góc đối bằng nhau, hai đường chéo cắt nhau tại trung điểm mỗi đường.
Dấu hiệu: các cạnh đối bằng nhau; hoặc hai cạnh đối song song và bằng nhau; hoặc hai đường chéo cắt nhau tại trung điểm mỗi đường.`],
  ["Toán", "hình chữ nhật dấu hiệu nhận biết", `**Hình chữ nhật:** tứ giác có bốn góc vuông.
Dấu hiệu: hình bình hành có một góc vuông, hoặc có hai đường chéo bằng nhau.`],
  ["Toán", "hình thoi dấu hiệu nhận biết", `**Hình thoi:** tứ giác có bốn cạnh bằng nhau.
Dấu hiệu: hình bình hành có hai cạnh kề bằng nhau, hoặc hai đường chéo vuông góc, hoặc một đường chéo là phân giác của một góc.`],
  ["Toán", "hình vuông dấu hiệu nhận biết", `**Hình vuông:** tứ giác có bốn góc vuông và bốn cạnh bằng nhau.
Dấu hiệu: hình chữ nhật có hai cạnh kề bằng nhau (hoặc hai đường chéo vuông góc); hình thoi có một góc vuông (hoặc hai đường chéo bằng nhau).`],
  ["Toán", "tỉ số lượng giác góc nhọn sin cos tan cot", `**Tỉ số lượng giác của góc nhọn α** trong tam giác vuông:
- sin α = đối / huyền
- cos α = kề / huyền
- tan α = đối / kề
- cot α = kề / đối
Mẹo: “Sin đi học, Cos không hư, Tan đoàn kết, Cot kết đoàn”.`],
  ["Toán", "giá trị lượng giác góc đặc biệt 30 45 60 độ", `**Góc đặc biệt**
- sin 30° = 1/2; cos 30° = √3/2; tan 30° = √3/3
- sin 45° = cos 45° = √2/2; tan 45° = 1
- sin 60° = √3/2; cos 60° = 1/2; tan 60° = √3`],
  ["Toán", "góc nội tiếp góc ở tâm đường tròn", `**Góc ở tâm** có đỉnh trùng tâm; số đo bằng số đo cung bị chắn.
**Góc nội tiếp** có đỉnh nằm trên đường tròn; số đo bằng **nửa** số đo cung bị chắn.
Góc nội tiếp chắn nửa đường tròn là góc vuông.`],
  ["Toán", "tứ giác nội tiếp dấu hiệu", `**Tứ giác nội tiếp** là tứ giác có bốn đỉnh nằm trên một đường tròn.
Tính chất và dấu hiệu: tổng hai góc đối bằng 180°.`],
  ["Toán", "tiếp tuyến của đường tròn tính chất hai tiếp tuyến cắt nhau", `**Tiếp tuyến** của đường tròn vuông góc với bán kính tại tiếp điểm.
Hai tiếp tuyến cắt nhau tại M: MA = MB, MO là phân giác góc AMB.`],
  ["Toán", "độ dài đường tròn chu vi hình tròn độ dài cung", `**Độ dài đường tròn:** C = 2πR = πd.
**Độ dài cung n°:** l = πRn/180.`],
  ["Toán", "diện tích hình tròn hình quạt tròn", `**Diện tích hình tròn:** S = πR².
**Diện tích hình quạt tròn n°:** S = πR²n/360.`],
  ["Toán", "hình trụ hình nón hình cầu diện tích thể tích", `**Hình trụ:** S xq = 2πrh; V = πr²h.
**Hình nón:** S xq = πrl (l là đường sinh, l² = r² + h²); V = ⅓πr²h.
**Hình cầu:** S = 4πR²; V = 4/3·πR³.`],
  ["Toán", "diện tích các hình phẳng tam giác hình thang hình chữ nhật hình bình hành", `**Diện tích hình phẳng**
- Hình chữ nhật: S = a·b. Hình vuông: S = a².
- Tam giác: S = ½·a·h.
- Hình thang: S = ½·(a + b)·h.
- Hình bình hành: S = a·h.
- Hình thoi: S = ½·d₁·d₂.`],
  ["Toán", "thể tích hình hộp chữ nhật hình lập phương lăng trụ đứng hình chóp đều", `**Thể tích**
- Hình hộp chữ nhật: V = a·b·c. Hình lập phương: V = a³.
- Lăng trụ đứng: V = S đáy · h.
- Hình chóp đều: V = ⅓·S đáy·h.`],
  ["Toán", "xác suất của biến cố xác suất thực nghiệm", `**Xác suất của biến cố** (các kết quả đồng khả năng): P(A) = số kết quả thuận lợi / tổng số kết quả.
**Xác suất thực nghiệm** = số lần sự kiện xảy ra / tổng số lần thử.
0 ≤ P(A) ≤ 1.`],
  ["Toán", "số trung bình cộng của dãy số liệu", `**Số trung bình cộng** = tổng các giá trị / số các giá trị.
Có tần số: x̄ = (x₁n₁ + x₂n₂ + … + xₖnₖ)/N.`],
  ["Toán", "quy tắc làm tròn số", `**Làm tròn số:** xét chữ số ngay sau hàng làm tròn.
- Nhỏ hơn 5: giữ nguyên chữ số hàng làm tròn, bỏ các chữ số sau.
- Từ 5 trở lên: cộng 1 vào chữ số hàng làm tròn.
Ví dụ: 14,276 ≈ 14,3 (làm tròn đến hàng phần mười).`],
  ["Toán", "tỉ số phần trăm tìm phần trăm của một số", `**Tỉ số phần trăm** của a và b: a/b · 100%.
Tìm m% của số a: a · m/100.
Tìm số khi biết m% của nó là b: b : m/100.`],

  // ---------- Khoa học tự nhiên: Vật lí ----------
  ["KHTN", "công thức tính tốc độ vận tốc quãng đường thời gian", `**Tốc độ** v = s/t (s: quãng đường, t: thời gian).
Đơn vị: m/s hoặc km/h. 1 m/s = 3,6 km/h.`],
  ["KHTN", "sự chuyển thể của chất nóng chảy đông đặc bay hơi ngưng tụ sôi là gì", `**Sự chuyển thể của chất**
- **Nóng chảy:** rắn → lỏng. **Đông đặc:** lỏng → rắn.
- **Bay hơi:** lỏng → hơi (xảy ra ở mặt thoáng, ở mọi nhiệt độ).
- **Ngưng tụ:** hơi → lỏng.
- **Sôi:** bay hơi cả ở mặt thoáng và trong lòng chất lỏng, ở nhiệt độ sôi (nước: 100 °C ở áp suất thường).`],
  ["KHTN", "trọng lượng khối lượng công thức P = 10m", `**Trọng lượng** là độ lớn lực hút của Trái Đất: P = 10·m (P: N; m: kg).
Khối lượng (kg) chỉ lượng chất của vật; trọng lượng là lực (N).`],
  ["KHTN", "lực ma sát là gì", `**Lực ma sát** xuất hiện ở mặt tiếp xúc giữa hai vật, cản trở chuyển động.
Gồm ma sát trượt, ma sát lăn, ma sát nghỉ. Có lợi (giúp đi lại, phanh xe) và có hại (mòn máy, tốn năng lượng).`],
  ["KHTN", "khối lượng riêng trọng lượng riêng công thức", `**Khối lượng riêng** D = m/V (kg/m³).
**Trọng lượng riêng** d = P/V = 10·D (N/m³).
Ví dụ: nước có D = 1000 kg/m³.`],
  ["KHTN", "áp suất công thức áp suất chất lỏng", `**Áp suất** p = F/S (Pa = N/m²).
**Áp suất chất lỏng** p = d·h (d: trọng lượng riêng chất lỏng, h: độ sâu).`],
  ["KHTN", "lực đẩy archimedes acsimet", `**Lực đẩy Archimedes:** vật nhúng trong chất lỏng bị đẩy từ dưới lên một lực bằng trọng lượng phần chất lỏng bị vật chiếm chỗ.
F_A = d·V (d: trọng lượng riêng chất lỏng, V: thể tích phần chìm).
Vật nổi khi F_A > P, chìm khi F_A < P.`],
  ["KHTN", "đòn bẩy moment lực", `**Moment lực** đặc trưng cho tác dụng làm quay: M = F·d (d: khoảng cách từ trục quay đến giá của lực).
**Đòn bẩy:** khi khoảng cách từ điểm tựa đến lực tác dụng lớn hơn khoảng cách đến vật thì được lợi về lực.`],
  ["KHTN", "động năng thế năng cơ năng công thức", `**Động năng:** Wđ = ½·m·v².
**Thế năng trọng trường:** Wt = P·h (P = 10m).
**Cơ năng** W = Wđ + Wt; khi chỉ có trọng lực tác dụng, cơ năng được bảo toàn.`],
  ["KHTN", "công cơ học công suất công thức", `**Công cơ học:** A = F·s (J).
**Công suất:** P = A/t (W). 1 W = 1 J/s.`],
  ["KHTN", "âm thanh tần số biên độ độ cao độ to âm cao âm thấp âm to âm nhỏ", `**Âm thanh**
- Tần số (Hz) càng lớn → âm càng **cao** (bổng).
- Biên độ dao động càng lớn → âm càng **to**.
- Tai người nghe được khoảng 20 Hz đến 20 000 Hz.
- Âm không truyền được trong chân không.`],
  ["KHTN", "định luật phản xạ ánh sáng", `**Định luật phản xạ ánh sáng**
- Tia phản xạ nằm trong mặt phẳng chứa tia tới và pháp tuyến tại điểm tới.
- Góc phản xạ bằng góc tới.`],
  ["KHTN", "khúc xạ ánh sáng là gì", `**Khúc xạ ánh sáng** là hiện tượng tia sáng bị gãy khúc tại mặt phân cách khi truyền từ môi trường trong suốt này sang môi trường trong suốt khác.
Ví dụ: chiếc thìa trong cốc nước trông như bị gãy.`],
  ["KHTN", "thấu kính hội tụ thấu kính phân kì", `**Thấu kính hội tụ:** rìa mỏng hơn phần giữa; chùm tia song song đi qua hội tụ tại tiêu điểm. Dùng làm kính lúp, kính lão (kính viễn).
**Thấu kính phân kì:** rìa dày hơn phần giữa; làm chùm tia song song loe rộng ra. Dùng làm kính cận.`],
  ["KHTN", "định luật ohm ôm cường độ dòng điện hiệu điện thế điện trở", `**Định luật Ohm:** I = U/R
- I: cường độ dòng điện (A), U: hiệu điện thế (V), R: điện trở (Ω).
**Điện trở dây dẫn:** R = ρ·l/S.`],
  ["KHTN", "đoạn mạch nối tiếp song song", `**Mạch nối tiếp:** I = I₁ = I₂; U = U₁ + U₂; R = R₁ + R₂.
**Mạch song song:** U = U₁ = U₂; I = I₁ + I₂; 1/R = 1/R₁ + 1/R₂.`],
  ["KHTN", "công suất điện điện năng tiêu thụ", `**Công suất điện:** P = U·I (W).
**Điện năng tiêu thụ:** A = P·t (J hoặc kWh). 1 kWh = 3 600 000 J (1 “số điện”).`],
  ["KHTN", "các hình thức truyền nhiệt dẫn nhiệt đối lưu bức xạ", `**Ba cách truyền nhiệt**
- Dẫn nhiệt: chủ yếu ở chất rắn (thìa kim loại nóng dần).
- Đối lưu: ở chất lỏng và chất khí (nước sôi trong nồi).
- Bức xạ nhiệt: truyền bằng tia nhiệt, cả trong chân không (Mặt Trời sưởi ấm Trái Đất).`],
  ["KHTN", "nam châm từ trường cực bắc cực nam", `**Nam châm** có hai cực: Bắc (N) và Nam (S). Cùng cực đẩy nhau, khác cực hút nhau.
Xung quanh nam châm và dòng điện có **từ trường**.`],

  // ---------- KHTN: Hoá học ----------
  ["KHTN", "cấu tạo nguyên tử proton neutron electron", `**Nguyên tử** gồm:
- **Hạt nhân** ở giữa, chứa proton (+) và neutron (không mang điện).
- **Vỏ** gồm các electron (−) chuyển động quanh hạt nhân, xếp thành các lớp.
Nguyên tử trung hoà về điện: số proton = số electron.`],
  ["KHTN", "nguyên tố hoá học là gì", `**Nguyên tố hoá học** là tập hợp những nguyên tử cùng loại, có cùng số proton trong hạt nhân.
Mỗi nguyên tố có kí hiệu hoá học, ví dụ: H, O, Na, Fe.`],
  ["KHTN", "đơn chất hợp chất là gì", `**Đơn chất:** tạo nên từ một nguyên tố (O₂, Fe, Cu).
**Hợp chất:** tạo nên từ hai nguyên tố trở lên (H₂O, NaCl, CO₂).`],
  ["KHTN", "phân tử khối lượng phân tử", `**Phân tử** là hạt đại diện cho chất, gồm các nguyên tử liên kết với nhau.
**Khối lượng phân tử** = tổng khối lượng các nguyên tử trong phân tử (amu). Ví dụ H₂O: 2·1 + 16 = 18 amu.`],
  ["KHTN", "liên kết ion liên kết cộng hoá trị", `**Liên kết ion:** hình thành do lực hút giữa ion dương và ion âm (thường giữa kim loại và phi kim), ví dụ NaCl.
**Liên kết cộng hoá trị:** hình thành do các nguyên tử dùng chung electron (thường giữa phi kim), ví dụ H₂O, CO₂.`],
  ["KHTN", "hoá trị là gì quy tắc hoá trị", `**Hoá trị** là con số biểu thị khả năng liên kết của nguyên tử nguyên tố này với nguyên tử nguyên tố khác.
**Quy tắc hoá trị** với hợp chất AₓBᵧ: x·a = y·b (a, b là hoá trị của A, B).`],
  ["KHTN", "bảng tuần hoàn các nguyên tố hoá học cấu tạo ô chu kì nhóm", `**Bảng tuần hoàn**: các nguyên tố xếp theo chiều tăng dần điện tích hạt nhân.
- **Ô nguyên tố:** số hiệu nguyên tử, kí hiệu, tên, khối lượng nguyên tử.
- **Chu kì** (hàng): cùng số lớp electron.
- **Nhóm** (cột): thường có cùng số electron lớp ngoài cùng nên tính chất tương tự.`],
  ["KHTN", "phản ứng hoá học dấu hiệu nhận biết", `**Phản ứng hoá học** là quá trình biến đổi chất này thành chất khác.
Dấu hiệu: có chất mới tạo thành — đổi màu, tạo kết tủa, sủi bọt khí, toả nhiệt hoặc phát sáng.`],
  ["KHTN", "định luật bảo toàn khối lượng", `**Định luật bảo toàn khối lượng:** trong một phản ứng hoá học, tổng khối lượng các chất sản phẩm bằng tổng khối lượng các chất phản ứng.
A + B → C + D thì m A + m B = m C + m D.`],
  ["KHTN", "mol là gì khối lượng mol công thức n = m/M thể tích mol chất khí", `**Mol** là lượng chất chứa 6,022·10²³ hạt (nguyên tử hoặc phân tử).
- n = m/M (M: khối lượng mol, g/mol).
- Chất khí ở điều kiện chuẩn (25 °C, 1 bar): V = n·24,79 (lít).`],
  ["KHTN", "nồng độ phần trăm nồng độ mol dung dịch", `**Nồng độ phần trăm:** C% = m chất tan / m dung dịch · 100%.
**Nồng độ mol:** C_M = n/V (mol/L, V tính bằng lít).`],
  ["KHTN", "acid axit là gì tính chất quỳ tím chuyển màu", `**Acid** là hợp chất trong phân tử có nguyên tử H liên kết với gốc acid; khi tan trong nước tạo ion H⁺.
Tính chất: làm quỳ tím hoá **đỏ**; tác dụng với kim loại (giải phóng H₂), base, oxide base, muối. Ví dụ: HCl, H₂SO₄.`],
  ["KHTN", "base bazơ là gì tính chất quỳ tím chuyển màu xanh", `**Base** là hợp chất trong phân tử có nguyên tử kim loại liên kết với nhóm OH; base tan (kiềm) tạo ion OH⁻ trong nước.
Tính chất: làm quỳ tím hoá **xanh**, phenolphthalein hoá hồng; tác dụng với acid tạo muối và nước. Ví dụ: NaOH, Ca(OH)₂.`],
  ["KHTN", "muối là gì", `**Muối** là hợp chất được tạo thành từ sự thay thế ion H⁺ của acid bằng ion kim loại (hoặc NH₄⁺).
Ví dụ: NaCl, CaCO₃, CuSO₄.`],
  ["KHTN", "oxide oxit là gì phân loại", `**Oxide** là hợp chất của hai nguyên tố, trong đó có một nguyên tố là oxygen.
Ví dụ: CO₂, CaO, Fe₂O₃. Phân loại: oxide acid, oxide base, oxide lưỡng tính, oxide trung tính.`],
  ["KHTN", "thang ph là gì môi trường acid base trung tính", `**Thang pH** (0–14) cho biết độ acid, base của dung dịch:
- pH < 7: môi trường acid.
- pH = 7: trung tính (nước cất).
- pH > 7: môi trường base.`],
  ["KHTN", "tốc độ phản ứng chất xúc tác các yếu tố ảnh hưởng", `**Tốc độ phản ứng** tăng khi: tăng nồng độ, tăng nhiệt độ, tăng diện tích bề mặt tiếp xúc, có **chất xúc tác**.
Chất xúc tác làm phản ứng nhanh hơn nhưng không bị mất đi sau phản ứng.`],
  ["KHTN", "dãy hoạt động hoá học của kim loại", `**Dãy hoạt động hoá học:** K, Na, Ca, Mg, Al, Zn, Fe, Pb, (H), Cu, Ag, Au.
- Mức độ hoạt động giảm dần từ trái sang phải.
- Kim loại đứng trước H tác dụng với acid (HCl, H₂SO₄ loãng) giải phóng H₂.
- Kim loại đứng trước (trừ K, Na, Ca…) đẩy kim loại đứng sau ra khỏi dung dịch muối.`],
  ["KHTN", "tính chất chung của kim loại", `**Tính chất của kim loại**
- Vật lí: dẻo, dẫn điện, dẫn nhiệt, có ánh kim.
- Hoá học: tác dụng với phi kim (O₂, Cl₂…), với acid, với dung dịch muối.`],
  ["KHTN", "hydrocarbon methane ethylene", `**Hydrocarbon** là hợp chất hữu cơ chỉ chứa C và H.
- **Methane** CH₄: chỉ có liên kết đơn, cháy toả nhiều nhiệt, thành phần chính của khí thiên nhiên, khí biogas.
- **Ethylene** C₂H₄: có một liên kết đôi, làm mất màu dung dịch bromine, dùng kích thích quả mau chín và sản xuất nhựa PE.`],
  ["KHTN", "ethylic alcohol rượu etylic acetic acid axit axetic", `**Ethylic alcohol** C₂H₅OH: chất lỏng, tan vô hạn trong nước, cháy được; dùng làm nhiên liệu, dung môi.
**Acetic acid** CH₃COOH: có tính acid; dung dịch 2–5% là giấm ăn.`],

  // ---------- KHTN: Sinh học ----------
  ["KHTN", "tế bào là gì cấu tạo tế bào", `**Tế bào** là đơn vị cấu trúc và chức năng của sự sống.
Cấu tạo cơ bản: **màng tế bào**, **tế bào chất**, **nhân** (hoặc vùng nhân).
Tế bào thực vật có thêm thành tế bào và lục lạp.`],
  ["KHTN", "tế bào nhân sơ tế bào nhân thực khác nhau", `**Tế bào nhân sơ:** chưa có nhân hoàn chỉnh (chỉ có vùng nhân), ví dụ vi khuẩn.
**Tế bào nhân thực:** có nhân hoàn chỉnh với màng nhân, có nhiều bào quan; ví dụ tế bào thực vật, động vật, nấm.`],
  ["KHTN", "quang hợp là gì phương trình quang hợp", `**Quang hợp** là quá trình lá cây sử dụng nước, carbon dioxide và năng lượng ánh sáng (nhờ diệp lục) để tạo glucose và thải oxygen.
Nước + Carbon dioxide → (ánh sáng, diệp lục) → Glucose + Oxygen.`],
  ["KHTN", "hô hấp tế bào là gì phương trình", `**Hô hấp tế bào** là quá trình phân giải glucose (có oxygen) để giải phóng năng lượng cho tế bào, diễn ra chủ yếu ở ti thể.
Glucose + Oxygen → Carbon dioxide + Nước + Năng lượng (ATP và nhiệt).`],
  ["KHTN", "trao đổi chất và chuyển hoá năng lượng", `**Trao đổi chất** là quá trình cơ thể lấy chất từ môi trường, biến đổi chúng và thải chất không cần ra môi trường.
**Chuyển hoá năng lượng** là sự biến đổi năng lượng từ dạng này sang dạng khác (quang năng → hoá năng trong quang hợp…).`],
  ["KHTN", "các giới sinh vật năm giới phân loại sinh giới", `**Năm giới sinh vật:** Khởi sinh, Nguyên sinh, Nấm, Thực vật, Động vật.
Bậc phân loại từ thấp đến cao: Loài → Chi → Họ → Bộ → Lớp → Ngành → Giới.`],
  ["KHTN", "virus là gì", `**Virus** có kích thước rất nhỏ, chưa có cấu tạo tế bào, gồm vỏ protein và lõi là vật chất di truyền.
Virus chỉ sống và sinh sản bên trong tế bào sinh vật khác. Một số gây bệnh: cúm, sởi, thuỷ đậu.`],
  ["KHTN", "vi khuẩn là gì", `**Vi khuẩn** là sinh vật đơn bào, nhân sơ, kích thước rất nhỏ.
Có lợi: làm sữa chua, dưa muối, phân giải xác sinh vật. Có hại: gây bệnh tả, lao, uốn ván, làm hỏng thức ăn.`],
  ["KHTN", "các nhóm thực vật rêu dương xỉ hạt trần hạt kín", `**Các nhóm thực vật**
- Rêu: chưa có mạch dẫn, sinh sản bằng bào tử.
- Dương xỉ: có mạch dẫn, sinh sản bằng bào tử.
- Hạt trần (thông): có hạt nhưng không có hoa, quả.
- Hạt kín: có hoa, quả; hạt nằm trong quả.`],
  ["KHTN", "động vật không xương sống có xương sống", `**Động vật không xương sống:** ruột khoang, giun, thân mềm, chân khớp…
**Động vật có xương sống:** cá, lưỡng cư, bò sát, chim, thú (động vật có vú).`],
  ["KHTN", "đa dạng sinh học vai trò bảo vệ", `**Đa dạng sinh học** là sự phong phú về số loài, số cá thể và môi trường sống.
Bảo vệ: không săn bắt động vật hoang dã, trồng và bảo vệ rừng, lập vườn quốc gia, khu bảo tồn.`],
  ["KHTN", "hệ tiêu hoá ở người các cơ quan", `**Hệ tiêu hoá:** ống tiêu hoá (miệng, hầu, thực quản, dạ dày, ruột non, ruột già, hậu môn) và tuyến tiêu hoá (tuyến nước bọt, gan, tuỵ…).
Ruột non là nơi tiêu hoá và hấp thụ chất dinh dưỡng chủ yếu.`],
  ["KHTN", "hệ tuần hoàn ở người tim mạch máu", `**Hệ tuần hoàn** gồm tim và hệ mạch (động mạch, tĩnh mạch, mao mạch).
Có hai vòng tuần hoàn: vòng tuần hoàn lớn (nuôi cơ thể) và vòng tuần hoàn nhỏ (qua phổi, trao đổi khí).`],
  ["KHTN", "hệ hô hấp ở người", `**Hệ hô hấp:** đường dẫn khí (mũi, họng, thanh quản, khí quản, phế quản) và hai lá phổi.
Trao đổi khí ở phế nang: oxygen vào máu, carbon dioxide từ máu ra ngoài.`],
  ["KHTN", "hệ bài tiết thận lọc máu", `**Hệ bài tiết nước tiểu:** thận, ống dẫn nước tiểu, bóng đái, ống đái.
Thận lọc máu, tạo nước tiểu để thải chất độc, chất thừa.`],
  ["KHTN", "hệ thần kinh", `**Hệ thần kinh** gồm bộ phận trung ương (não, tuỷ sống) và bộ phận ngoại biên (dây thần kinh, hạch thần kinh).
Điều khiển, điều hoà và phối hợp hoạt động của các cơ quan.`],
  ["KHTN", "gene DNA là gì", `**DNA** là phân tử mang thông tin di truyền, cấu trúc xoắn kép gồm hai mạch; đơn phân là nucleotide (A, T, G, C), A liên kết với T, G liên kết với C.
**Gene** là một đoạn DNA mang thông tin quy định một sản phẩm (protein hoặc RNA).`],
  ["KHTN", "nhiễm sắc thể là gì", `**Nhiễm sắc thể** là cấu trúc mang gene, nằm trong nhân tế bào.
Tế bào người có 46 nhiễm sắc thể (23 cặp), trong đó có 1 cặp nhiễm sắc thể giới tính (XX ở nữ, XY ở nam).`],
  ["KHTN", "nguyên phân giảm phân khác nhau", `**Nguyên phân:** 1 tế bào mẹ → 2 tế bào con có bộ nhiễm sắc thể giống hệt tế bào mẹ (2n). Giúp cơ thể lớn lên.
**Giảm phân:** 1 tế bào → 4 tế bào con có bộ nhiễm sắc thể giảm một nửa (n). Tạo giao tử.`],
  ["KHTN", "quần thể quần xã hệ sinh thái chuỗi thức ăn", `**Quần thể:** các cá thể cùng loài, cùng sống trong một khu vực.
**Quần xã:** nhiều quần thể khác loài cùng sống trong một khu vực.
**Hệ sinh thái:** quần xã và môi trường sống (sinh cảnh).
**Chuỗi thức ăn:** sinh vật sản xuất → sinh vật tiêu thụ → sinh vật phân giải. Ví dụ: cỏ → thỏ → cáo → vi sinh vật.`],

  // ---------- Lịch sử ----------
  ["Lịch sử", "nhà nước văn lang vua hùng", `**Nhà nước Văn Lang** (khoảng thế kỉ VII TCN) là nhà nước đầu tiên của người Việt.
Đứng đầu là Hùng Vương, giúp việc có Lạc hầu, Lạc tướng; kinh đô ở Phong Châu (Phú Thọ ngày nay).`],
  ["Lịch sử", "nhà nước âu lạc an dương vương thành cổ loa", `**Nhà nước Âu Lạc** do An Dương Vương (Thục Phán) lập nên (khoảng thế kỉ III TCN), đóng đô ở Phong Khê, xây thành Cổ Loa, chế nỏ bắn nhiều phát.`],
  ["Lịch sử", "khởi nghĩa hai bà trưng năm 40", `**Khởi nghĩa Hai Bà Trưng** (năm 40) chống ách đô hộ của nhà Đông Hán, nổ ra ở Hát Môn. Trưng Trắc lên làm vua, đóng đô ở Mê Linh.`],
  ["Lịch sử", "khởi nghĩa bà triệu năm 248", `**Khởi nghĩa Bà Triệu** (năm 248) chống ách đô hộ của nhà Ngô, nổ ra ở núi Nưa (Thanh Hoá).`],
  ["Lịch sử", "khởi nghĩa lý bí nước vạn xuân", `**Khởi nghĩa Lý Bí** (năm 542) chống nhà Lương. Năm 544, Lý Bí lên ngôi (Lý Nam Đế), đặt tên nước là **Vạn Xuân**.`],
  ["Lịch sử", "khúc thừa dụ giành quyền tự chủ năm 905", `**Năm 905, Khúc Thừa Dụ** nổi dậy, giành quyền tự chủ, mở đầu thời kì xây dựng nền tự chủ của người Việt.`],
  ["Lịch sử", "chiến thắng bạch đằng năm 938 ngô quyền", `**Chiến thắng Bạch Đằng năm 938:** Ngô Quyền dùng cọc gỗ cắm ở lòng sông Bạch Đằng, đánh tan quân Nam Hán.
Ý nghĩa: chấm dứt hơn 1000 năm Bắc thuộc. Năm 939, Ngô Quyền xưng vương, đóng đô ở Cổ Loa.`],
  ["Lịch sử", "đinh bộ lĩnh dẹp loạn 12 sứ quân đại cồ việt", `**Đinh Bộ Lĩnh** dẹp loạn 12 sứ quân, lên ngôi năm 968 (Đinh Tiên Hoàng), đặt tên nước là **Đại Cồ Việt**, đóng đô ở Hoa Lư.`],
  ["Lịch sử", "lê hoàn kháng chiến chống tống năm 981", `**Năm 981, Lê Hoàn** lãnh đạo kháng chiến chống quân Tống thắng lợi, bảo vệ nền độc lập của Đại Cồ Việt.`],
  ["Lịch sử", "lý công uẩn dời đô thăng long năm 1010", `**Năm 1010, Lý Công Uẩn** (Lý Thái Tổ) dời đô từ Hoa Lư về Đại La, đổi tên là **Thăng Long**. Năm 1054, nhà Lý đổi tên nước là Đại Việt.`],
  ["Lịch sử", "kháng chiến chống tống 1075 1077 lý thường kiệt sông như nguyệt", `**Kháng chiến chống Tống (1075–1077)** do Lý Thường Kiệt lãnh đạo.
Chủ động “tiến công trước để tự vệ” (1075), lập phòng tuyến sông Như Nguyệt và đánh bại quân Tống (1077). Gắn với bài thơ “Nam quốc sơn hà”.`],
  ["Lịch sử", "ba lần kháng chiến chống mông nguyên nhà trần trần hưng đạo mấy lần", `**Ba lần kháng chiến chống Mông – Nguyên** của nhà Trần: 1258, 1285, 1287–1288.
Trần Hưng Đạo chỉ huy hai lần sau; chiến thắng Bạch Đằng năm 1288 kết thúc cuộc kháng chiến lần ba.`],
  ["Lịch sử", "khởi nghĩa lam sơn lê lợi nguyễn trãi", `**Khởi nghĩa Lam Sơn (1418–1427)** chống quân Minh do Lê Lợi lãnh đạo, Nguyễn Trãi là mưu sĩ.
Thắng lợi tiêu biểu: Tốt Động – Chúc Động (1426), Chi Lăng – Xương Giang (1427). Năm 1428, Lê Lợi lên ngôi; Nguyễn Trãi viết “Bình Ngô đại cáo”.`],
  ["Lịch sử", "quang trung nguyễn huệ đại phá quân thanh rạch gầm xoài mút", `**Nguyễn Huệ – Quang Trung**
- 1785: chiến thắng Rạch Gầm – Xoài Mút, đánh tan quân Xiêm.
- Tết Kỷ Dậu 1789: đại phá quân Thanh ở Ngọc Hồi – Đống Đa.`],
  ["Lịch sử", "thực dân pháp xâm lược việt nam năm 1858", `**Ngày 1/9/1858**, liên quân Pháp – Tây Ban Nha nổ súng tấn công Đà Nẵng, mở đầu cuộc xâm lược Việt Nam.`],
  ["Lịch sử", "cách mạng tháng tám năm 1945 tuyên ngôn độc lập", `**Cách mạng tháng Tám năm 1945** giành chính quyền trong cả nước (Hà Nội: 19/8/1945).
**Ngày 2/9/1945**, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình, khai sinh nước Việt Nam Dân chủ Cộng hoà.`],
  ["Lịch sử", "chiến thắng điện biên phủ 1954 hiệp định genève", `**Chiến dịch Điện Biên Phủ** (13/3 – 7/5/1954) thắng lợi, buộc Pháp kí **Hiệp định Genève** (21/7/1954), chấm dứt chiến tranh ở Đông Dương.`],
  ["Lịch sử", "giải phóng miền nam thống nhất đất nước 30/4/1975", `**Ngày 30/4/1975**, Chiến dịch Hồ Chí Minh toàn thắng, giải phóng hoàn toàn miền Nam, thống nhất đất nước.`],
  ["Lịch sử", "chiến tranh thế giới thứ nhất thứ hai năm nào", `**Chiến tranh thế giới thứ nhất:** 1914–1918.
**Chiến tranh thế giới thứ hai:** 1939–1945.`],
  ["Lịch sử", "cách mạng tháng mười nga 1917", `**Cách mạng tháng Mười Nga** (1917) lật đổ Chính phủ tư sản lâm thời, thành lập nhà nước Xô viết.`],

  // ---------- Địa lí ----------
  ["Địa lí", "kinh tuyến vĩ tuyến toạ độ địa lí", `**Kinh tuyến** là đường nối cực Bắc với cực Nam; kinh tuyến gốc 0° đi qua Greenwich (Anh).
**Vĩ tuyến** là vòng tròn vuông góc với kinh tuyến; vĩ tuyến gốc là Xích đạo (0°).
**Toạ độ địa lí** của một điểm gồm kinh độ và vĩ độ.`],
  ["Địa lí", "tỉ lệ bản đồ là gì", `**Tỉ lệ bản đồ** cho biết mức thu nhỏ so với thực tế.
Ví dụ 1 : 100 000 nghĩa là 1 cm trên bản đồ ứng với 100 000 cm = 1 km ngoài thực tế.`],
  ["Địa lí", "cấu tạo bên trong trái đất", `**Cấu tạo Trái Đất** gồm ba lớp: **vỏ Trái Đất**, **man-ti** (lớp trung gian) và **nhân** (lõi).
Vỏ Trái Đất mỏng nhất nhưng là nơi tồn tại sự sống.`],
  ["Địa lí", "trái đất chuyển động quanh mặt trời các mùa hệ quả", `**Trái Đất chuyển động quanh Mặt Trời** một vòng hết khoảng 365 ngày 6 giờ, theo hướng từ tây sang đông, trục nghiêng không đổi.
Hệ quả: các mùa trong năm, ngày đêm dài ngắn khác nhau theo mùa.`],
  ["Địa lí", "trái đất tự quay quanh trục hệ quả ngày đêm", `**Trái Đất tự quay quanh trục** từ tây sang đông, một vòng khoảng 24 giờ.
Hệ quả: ngày đêm luân phiên, giờ trên Trái Đất khác nhau, vật chuyển động bị lệch hướng.`],
  ["Địa lí", "các đới khí hậu trên trái đất", `**5 đới khí hậu:** 1 đới nóng (nhiệt đới), 2 đới ôn hoà (ôn đới), 2 đới lạnh (hàn đới).`],
  ["Địa lí", "vòng tuần hoàn của nước chu trình nước gồm những giai đoạn", `**Vòng tuần hoàn của nước**
1. Nước ở biển, sông, hồ **bốc hơi** thành hơi nước.
2. Hơi nước **ngưng tụ** thành mây.
3. Mây gặp lạnh gây **mưa** (hoặc tuyết).
4. Nước mưa chảy trên mặt đất, thấm xuống đất thành nước ngầm, rồi theo sông đổ ra biển.`],
  ["Địa lí", "khí hậu việt nam đặc điểm", `**Khí hậu Việt Nam** là khí hậu **nhiệt đới ẩm gió mùa**: nóng, mưa nhiều, độ ẩm cao; có gió mùa mùa đông (lạnh, khô ở miền Bắc) và gió mùa mùa hạ (nóng ẩm, mưa nhiều).`],
  ["Địa lí", "các thành phần của lớp vỏ khí khí quyển", `**Khí quyển** gồm: khí nitrogen (khoảng 78%), oxygen (khoảng 21%), hơi nước và các khí khác (khoảng 1%).
Tầng đối lưu sát mặt đất là nơi sinh ra các hiện tượng mây, mưa, sấm chớp.`],

  // ---------- Ngữ văn ----------
  ["Ngữ văn", "biện pháp tu từ so sánh là gì", `**So sánh** là đối chiếu sự vật, sự việc này với sự vật, sự việc khác có nét tương đồng để tăng sức gợi hình, gợi cảm.
Từ so sánh thường gặp: như, là, tựa, giống như, bao nhiêu… bấy nhiêu.
Ví dụ: “Mặt trời xuống biển như hòn lửa.”`],
  ["Ngữ văn", "biện pháp tu từ nhân hoá là gì", `**Nhân hoá** là gọi hoặc tả con vật, cây cối, đồ vật… bằng những từ ngữ vốn dùng để gọi hoặc tả con người, làm cho chúng gần gũi, sinh động.
Ví dụ: “Ông trời mặc áo giáp đen ra trận.”`],
  ["Ngữ văn", "biện pháp tu từ ẩn dụ là gì", `**Ẩn dụ** là gọi tên sự vật, hiện tượng này bằng tên sự vật, hiện tượng khác có **nét tương đồng** với nó.
Ví dụ: “Người Cha mái tóc bạc” (Người Cha chỉ Bác Hồ).`],
  ["Ngữ văn", "biện pháp tu từ hoán dụ là gì", `**Hoán dụ** là gọi tên sự vật, hiện tượng này bằng tên sự vật, hiện tượng khác có **quan hệ gần gũi** với nó (bộ phận – toàn thể, vật chứa – vật bị chứa, dấu hiệu – sự vật…).
Ví dụ: “Áo chàm đưa buổi phân li” (áo chàm chỉ người Việt Bắc).`],
  ["Ngữ văn", "điệp ngữ nói quá nói giảm nói tránh liệt kê", `**Một số biện pháp tu từ khác**
- **Điệp ngữ:** lặp lại từ ngữ để nhấn mạnh.
- **Nói quá:** phóng đại mức độ để nhấn mạnh, gây ấn tượng.
- **Nói giảm nói tránh:** diễn đạt tế nhị, tránh gây cảm giác đau buồn, thô tục.
- **Liệt kê:** sắp xếp nối tiếp nhiều từ ngữ cùng loại để diễn tả đầy đủ hơn.`],
  ["Ngữ văn", "từ đơn từ phức từ ghép từ láy", `**Từ đơn:** chỉ có một tiếng (nhà, cây).
**Từ phức:** có hai tiếng trở lên, gồm:
- **Từ ghép:** các tiếng có quan hệ về nghĩa (bàn ghế, sách vở).
- **Từ láy:** các tiếng có quan hệ láy âm (long lanh, xinh xắn).`],
  ["Ngữ văn", "từ đồng nghĩa từ trái nghĩa từ đồng âm từ đa nghĩa", `- **Từ đồng nghĩa:** nghĩa giống hoặc gần giống (siêng năng – chăm chỉ).
- **Từ trái nghĩa:** nghĩa trái ngược (cao – thấp).
- **Từ đồng âm:** âm giống nhau, nghĩa khác hẳn (“đường” để ăn – “đường” để đi).
- **Từ đa nghĩa:** một từ có nhiều nghĩa liên quan (“chân” người, “chân” bàn).`],
  ["Ngữ văn", "truyền thuyết cổ tích ngụ ngôn truyện cười thần thoại đặc điểm", `**Các thể loại truyện dân gian**
- **Thần thoại:** giải thích nguồn gốc thế giới, con người.
- **Truyền thuyết:** kể về nhân vật, sự kiện liên quan đến lịch sử (Thánh Gióng).
- **Cổ tích:** kể về số phận các kiểu nhân vật, thể hiện ước mơ cái thiện thắng cái ác (Thạch Sanh, Tấm Cám).
- **Ngụ ngôn:** mượn chuyện loài vật, đồ vật để nêu bài học (Ếch ngồi đáy giếng).
- **Truyện cười:** gây cười, phê phán thói xấu.`],
  ["Ngữ văn", "thơ lục bát đặc điểm luật thơ cách gieo vần", `**Thơ lục bát:** mỗi cặp gồm một dòng 6 tiếng (lục) và một dòng 8 tiếng (bát).
- Vần: tiếng 6 dòng lục vần với tiếng 6 dòng bát; tiếng 8 dòng bát vần với tiếng 6 dòng lục tiếp theo.
- Thanh: các tiếng 2, 4, 6 theo luật bằng – trắc (tiếng 2 bằng, 4 trắc, 6 bằng).`],
  ["Ngữ văn", "thơ đường luật thất ngôn bát cú tứ tuyệt", `**Thơ Đường luật**
- **Thất ngôn bát cú:** 8 câu, mỗi câu 7 chữ; bố cục đề – thực – luận – kết; gieo vần bằng ở cuối câu 1, 2, 4, 6, 8; hai cặp câu thực và luận đối nhau.
- **Thất ngôn tứ tuyệt:** 4 câu, mỗi câu 7 chữ.`],
  ["Ngữ văn", "văn nghị luận luận đề luận điểm lí lẽ bằng chứng", `**Văn bản nghị luận** nhằm thuyết phục người đọc về một ý kiến.
- **Luận đề:** vấn đề chính được bàn.
- **Luận điểm:** các ý kiến triển khai luận đề.
- **Lí lẽ:** lời giải thích, lập luận.
- **Bằng chứng:** dẫn chứng, số liệu, ví dụ cụ thể.`],
  ["Ngữ văn", "ngôi kể thứ nhất ngôi thứ ba", `**Ngôi kể**
- **Ngôi thứ nhất:** người kể xưng “tôi”, kể điều mình trải qua.
- **Ngôi thứ ba:** người kể giấu mình, gọi nhân vật bằng tên, kể khách quan.`],
  ["Ngữ văn", "trạng ngữ là gì", `**Trạng ngữ** là thành phần phụ của câu, bổ sung thông tin về thời gian, nơi chốn, nguyên nhân, mục đích, phương tiện… Thường đứng đầu câu, ngăn cách với nòng cốt bằng dấu phẩy.
Ví dụ: “**Sáng nay,** em đi học sớm.”`],
  ["Ngữ văn", "câu đơn câu ghép", `**Câu đơn:** có một cụm chủ ngữ – vị ngữ làm nòng cốt.
**Câu ghép:** có từ hai cụm chủ ngữ – vị ngữ trở lên, không bao chứa nhau; nối bằng quan hệ từ, cặp quan hệ từ hoặc dấu câu.`],
  ["Ngữ văn", "các kiểu câu theo mục đích nói câu kể câu hỏi câu cảm câu khiến", `**Kiểu câu theo mục đích nói**
- **Câu kể (trần thuật):** kể, thông báo; kết thúc bằng dấu chấm.
- **Câu hỏi (nghi vấn):** dùng để hỏi; dấu chấm hỏi.
- **Câu cảm (cảm thán):** bộc lộ cảm xúc; thường có dấu chấm than.
- **Câu khiến (cầu khiến):** yêu cầu, đề nghị; dấu chấm than hoặc dấu chấm.`],
  ["Ngữ văn", "cách viết đoạn văn bố cục đoạn văn", `**Đoạn văn** gồm nhiều câu cùng nói về một ý, mở đầu bằng chữ viết hoa lùi đầu dòng, kết thúc bằng dấu chấm xuống dòng.
Thường có: câu mở đoạn (nêu ý chính) → các câu phát triển ý → câu kết đoạn.`],
  ["Ngữ văn", "cách tóm tắt văn bản", `**Tóm tắt văn bản**
1. Đọc kĩ, xác định nội dung chính và các sự việc (ý) quan trọng.
2. Sắp xếp các ý theo trình tự hợp lí.
3. Viết lại bằng lời văn của mình, ngắn gọn, trung thành với văn bản gốc.`],

  // ---------- Tiếng Anh ----------
  ["Tiếng Anh", "thì hiện tại đơn present simple cách dùng công thức", `**Present simple (hiện tại đơn)**
- Dùng: thói quen, sự thật hiển nhiên, lịch trình.
- (+) S + V(s/es); (−) S + do/does not + V; (?) Do/Does + S + V?
- Dấu hiệu: always, usually, often, sometimes, every day.`],
  ["Tiếng Anh", "thì hiện tại tiếp diễn present continuous", `**Present continuous (hiện tại tiếp diễn)**
- Dùng: hành động đang xảy ra lúc nói, kế hoạch gần.
- S + am/is/are + V-ing.
- Dấu hiệu: now, at the moment, Look!, Listen!`],
  ["Tiếng Anh", "thì quá khứ đơn past simple", `**Past simple (quá khứ đơn)**
- Dùng: hành động đã xảy ra và kết thúc trong quá khứ.
- (+) S + V-ed/V2; (−) S + did not + V; (?) Did + S + V?
- Dấu hiệu: yesterday, last week, ago, in 2010.`],
  ["Tiếng Anh", "thì hiện tại hoàn thành present perfect since for", `**Present perfect (hiện tại hoàn thành)**
- Dùng: hành động bắt đầu trong quá khứ, kéo dài đến hiện tại hoặc còn ảnh hưởng.
- S + have/has + V3/V-ed.
- since + mốc thời gian (since 2015); for + khoảng thời gian (for 3 years).`],
  ["Tiếng Anh", "thì tương lai đơn will be going to", `**Future simple (tương lai đơn)**: S + will + V — quyết định tức thời, dự đoán.
**Be going to + V**: kế hoạch đã định, dự đoán có căn cứ.`],
  ["Tiếng Anh", "so sánh hơn so sánh nhất comparative superlative", `**So sánh hơn**
- Tính từ ngắn: adj + -er + than (taller than).
- Tính từ dài: more + adj + than (more beautiful than).
**So sánh nhất**
- Tính từ ngắn: the + adj + -est (the tallest).
- Tính từ dài: the most + adj.
Bất quy tắc: good – better – best; bad – worse – worst.`],
  ["Tiếng Anh", "câu điều kiện loại 1 loại 2 conditional sentences", `**Câu điều kiện**
- **Loại 0:** If + hiện tại đơn, hiện tại đơn (sự thật).
- **Loại 1:** If + hiện tại đơn, S + will + V (có thể xảy ra ở hiện tại, tương lai).
- **Loại 2:** If + quá khứ đơn, S + would + V (không có thật ở hiện tại); với “be” dùng “were” cho mọi ngôi.`],
  ["Tiếng Anh", "câu bị động passive voice", `**Câu bị động:** S + be + V3/V-ed (+ by O).
- Hiện tại đơn: am/is/are + V3.
- Quá khứ đơn: was/were + V3.
Ví dụ: They clean the room. → The room is cleaned (by them).`],
  ["Tiếng Anh", "câu tường thuật reported speech", `**Câu tường thuật:** lùi thì khi động từ tường thuật ở quá khứ (said, told).
- Hiện tại đơn → quá khứ đơn; will → would; can → could.
- Đổi đại từ, trạng từ: now → then, today → that day, here → there.
Ví dụ: “I am tired,” she said. → She said (that) she was tired.`],
  ["Tiếng Anh", "mệnh đề quan hệ who which that relative clauses", `**Mệnh đề quan hệ**
- **who:** thay cho người (làm chủ ngữ).
- **which:** thay cho vật.
- **that:** thay cho người hoặc vật (mệnh đề xác định).
- **whose:** chỉ sở hữu.
Ví dụ: The girl **who** is singing is my sister.`],
  ["Tiếng Anh", "danh từ đếm được không đếm được much many some any", `**Countable / uncountable nouns**
- many + danh từ đếm được số nhiều (many books); much + danh từ không đếm được (much water).
- some: câu khẳng định, lời mời; any: câu phủ định và câu hỏi.
- a lot of / lots of dùng cho cả hai loại.`],
  ["Tiếng Anh", "mạo từ a an the", `**Mạo từ**
- **a** + danh từ số ít bắt đầu bằng phụ âm (a book); **an** + nguyên âm (an apple, an hour).
- **the:** khi người nghe đã biết vật được nói tới, vật duy nhất (the sun), so sánh nhất.`],

  // ---------- Tin học ----------
  ["Tin học", "thông tin và dữ liệu khác nhau", `**Dữ liệu** là những gì được ghi lại (chữ, số, hình ảnh, âm thanh…).
**Thông tin** là những gì đem lại hiểu biết cho con người, có được khi xử lí dữ liệu.`],
  ["Tin học", "đơn vị đo dung lượng bit byte kb mb gb", `**Đơn vị đo dung lượng thông tin**
- Bit là đơn vị nhỏ nhất (0 hoặc 1); 1 byte = 8 bit.
- 1 KB = 1024 byte; 1 MB = 1024 KB; 1 GB = 1024 MB; 1 TB = 1024 GB.`],
  ["Tin học", "ba cấu trúc điều khiển cơ bản của thuật toán tuần tự rẽ nhánh lặp", `**Ba cấu trúc cơ bản của thuật toán**
- **Tuần tự:** các bước thực hiện lần lượt.
- **Rẽ nhánh:** “Nếu… thì… (nếu không thì…)”, chọn việc theo điều kiện.
- **Lặp:** làm lại một nhóm bước nhiều lần.`],
  ["Tin học", "mạng máy tính internet là gì", `**Mạng máy tính** là nhóm máy tính và thiết bị kết nối với nhau để chia sẻ dữ liệu, tài nguyên.
**Internet** là mạng kết nối hàng triệu mạng máy tính trên toàn thế giới; dịch vụ: web, thư điện tử, tìm kiếm, mạng xã hội.`],
  ["Tin học", "hệ điều hành phần mềm ứng dụng", `**Hệ điều hành** điều khiển hoạt động của máy tính và các phần mềm khác (Windows, Android, iOS).
**Phần mềm ứng dụng** phục vụ công việc cụ thể (Word, Excel, trình duyệt web).`],
  ["Tin học", "an toàn trên mạng bảo vệ thông tin cá nhân", `**An toàn trên mạng**
- Không chia sẻ mật khẩu, mã OTP, địa chỉ nhà, số điện thoại cho người lạ.
- Dùng mật khẩu mạnh, đăng xuất trên máy dùng chung.
- Không mở tệp, đường link lạ; báo người lớn khi bị đe doạ, bắt nạt trên mạng.`],

  // ---------- GDCD ----------
  ["GDCD", "quyền trẻ em các nhóm quyền cơ bản", `**Quyền cơ bản của trẻ em** (Luật Trẻ em 2016; trẻ em là người dưới 16 tuổi) gồm các nhóm: quyền được sống còn, quyền được bảo vệ, quyền được phát triển, quyền được tham gia.
Đường dây nóng bảo vệ trẻ em: **111** (miễn phí).`],
  ["GDCD", "tự lập là gì biểu hiện", `**Tự lập** là tự làm lấy, tự giải quyết công việc của mình, tự lo liệu, không trông chờ, dựa dẫm vào người khác.
Biểu hiện: tự học bài, tự chuẩn bị đồ dùng, tự giặt quần áo.`],
  ["GDCD", "tiết kiệm là gì", `**Tiết kiệm** là sử dụng hợp lí, đúng mức của cải, thời gian, sức lực của mình và của người khác.
Tiết kiệm khác keo kiệt, bủn xỉn.`],
  ["GDCD", "các số điện thoại khẩn cấp 113 114 115", `**Số điện thoại khẩn cấp** (miễn phí)
- 111: bảo vệ trẻ em.
- 112: tìm kiếm cứu nạn.
- 113: công an.
- 114: cứu hoả, cứu nạn.
- 115: cấp cứu y tế.`],
];
