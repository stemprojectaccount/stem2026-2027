import { PodcastEpisode } from "../types";

export const SAMPLE_PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: "pod-sample-1",
    title: "Bí kíp lũy thừa và số tự nhiên không bao giờ nhầm",
    subject: "Toán Học",
    grade: "Lớp 6",
    topic: "Số học và Lũy thừa",
    summary: "Minh và Lan cùng mổ xẻ vì sao $a^m \\cdot a^n = a^{m+n}$ chứ không phải $a^{m \\cdot n}$, kèm mẹo tính nhẩm nhanh cực đỉnh.",
    durationMinutes: 4,
    createdAt: "2026-10-18T10:00:00.000Z",
    listened: true,
    isFavorite: true,
    lessonId: "sample-1",
    xpReward: 15,
    dialogue: [
      {
        speaker: "Minh",
        role: "questioner",
        text: "Chào Lan! Hôm nay cô giáo cho bài toán lũy thừa, mình suýt bấm máy tính mà cô bảo phải tính nhẩm theo quy tắc. Sao mà nhân hai lũy thừa cùng cơ số lại là cộng số mũ vậy Lan?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Chào Minh! Câu hỏi hay lắm. Rất nhiều bạn bị nhầm lấy số mũ nhân với nhau đấy! Cậu hãy thử hình dung: 2 mũ 3 là ba số 2 nhân với nhau: 2 nhân 2 nhân 2."
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Đúng rồi! Còn 2 mũ 4 là bốn số 2 nhân với nhau đúng không?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Chính xác! Giờ nếu cậu lấy (2 mũ 3) nhân tiếp với (2 mũ 4), thì có phải đằng trước có 3 con số 2, đằng sau có 4 con số 2, gộp lại là 7 con số 2 đang nhân với nhau không?"
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "A! 3 cộng 4 bằng 7! Thảo nào công thức là a mũ m nhân a mũ n bằng a mũ (m cộng n)!"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Chuẩn luôn! Tương tự với phép chia: chia là bớt đi số lượng thừa số, nên số mũ sẽ trừ cho nhau: a mũ m chia a mũ n bằng a mũ (m trừ n), với điều kiện m lớn hơn hoặc bằng n và a khác 0 nhé."
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Thế còn quy ước số nào mũ 0 cũng bằng 1 thì sao Lan ơi? Nghe hơi vô lý nhỉ?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Thử lấy a mũ 3 chia cho a mũ 3 xem! Một số chia cho chính nó luôn bằng 1, mà theo quy tắc trừ số mũ thì 3 trừ 3 bằng 0. Vậy nên người ta quy ước a mũ 0 luôn bằng 1 để quy tắc toán học không bị gãy đó Minh!"
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Tuyệt vời! Giải thích bằng logic trực quan thế này thì tớ nhớ suốt đời luôn. Cảm ơn Lan nhiều nhé!"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Không có chi Minh ơi! Bây giờ chúng mình cùng làm 2 câu hỏi ôn tập nhanh ở dưới để nhận trọn vẹn điểm XP của buổi học nhé!"
      }
    ],
    quickReviewQuestions: [
      {
        question: "Kết quả của phép tính 3² · 3⁴ là bao nhiêu?",
        options: ["3⁶ = 729", "3⁸ = 6561", "9⁶", "9⁸"],
        correctIndex: 0,
        explanation: "Khi nhân hai lũy thừa cùng cơ số, ta giữ nguyên cơ số và cộng các số mũ: 3^(2+4) = 3^6 = 729."
      },
      {
        question: "Quy ước nào sau đây đúng với mọi số a ≠ 0?",
        options: ["a⁰ = 0", "a⁰ = 1", "a⁰ = a", "a⁰ = -1"],
        correctIndex: 1,
        explanation: "Với mọi số tự nhiên a khác 0, ta có quy ước chuẩn mực: a⁰ = 1."
      }
    ]
  },
  {
    id: "pod-sample-2",
    title: "Chuyến phiêu lưu của giọt nước và chu trình khí quyển",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 6",
    topic: "Trái Đất và Bầu khí quyển",
    summary: "Cùng nghe hành trình một giọt nước biển bốc hơi lên tầng đối lưu, ngưng tụ thành mây trắng rồi rơi xuống nuôi dưỡng cánh rừng.",
    durationMinutes: 3,
    createdAt: "2026-10-18T14:30:00.000Z",
    listened: false,
    isFavorite: false,
    lessonId: "sample-2",
    xpReward: 15,
    dialogue: [
      {
        speaker: "Minh",
        role: "questioner",
        text: "Lan ơi, hôm qua trời mưa to quá. Tớ tự hỏi: nước mưa từ trên mây rơi xuống đất rồi chảy đi đâu hết nhỉ?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Chào Minh! Nước trên Trái Đất không hề mất đi đâu, nó tham gia vào một vòng tuần hoàn vĩnh cửu gọi là Chu Trình Nước đấy!"
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Vòng tuần hoàn đó bắt đầu từ đâu hả Lan?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Dưới ánh nắng Mặt Trời, nước ở đại dương và ao hồ nóng lên, bốc hơi thành hơi nước vô hình bay lên cao. Khi lên cao gặp lạnh, hơi nước ngưng tụ thành hàng tỷ giọt nước li ti tạo nên những đám mây trắng bồng bềnh."
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Và khi các giọt nước li ti va chạm vào nhau, nặng quá không lơ lửng được nữa thì rơi xuống thành mưa đúng không?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Đúng rồi! Nước mưa ngấm vào lòng đất thành nước ngầm, chảy ra sông suối rồi lại đổ về đại dương bao la. Một giọt nước cậu uống hôm nay có thể từng là giọt nước trong cơn mưa thời khủng long đấy!"
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Thú vị thật! Thiên nhiên kỳ diệu hơn tớ nghĩ nhiều!"
      }
    ],
    quickReviewQuestions: [
      {
        question: "Động lực chính thúc đẩy chu trình nước tuần hoàn liên tục trên Trái Đất là gì?",
        options: ["Năng lượng bức xạ Mặt Trời", "Lực hấp dẫn của Mặt Trăng", "Gió biển", "Nham thạch núi lửa"],
        correctIndex: 0,
        explanation: "Năng lượng nhiệt từ ánh sáng Mặt Trời làm bốc hơi nước từ bề mặt đại dương và lục địa, khởi động toàn bộ chu trình."
      }
    ]
  },
  {
    id: "pod-sample-3",
    title: "Giải mã nghệ thuật nhân hóa và ẩn dụ trong văn học",
    subject: "Ngữ Văn",
    grade: "Lớp 6",
    topic: "Biện pháp tu từ",
    summary: "Làm thế nào để phân biệt Ẩn dụ và Hoán dụ? Minh và Lan mách bạn mẹo nhớ bằng công thức tương đồng vs tương cận.",
    durationMinutes: 5,
    createdAt: "2026-10-18T16:00:00.000Z",
    listened: false,
    isFavorite: true,
    xpReward: 15,
    dialogue: [
      {
        speaker: "Minh",
        role: "questioner",
        text: "Lan ơi, trong đề thi Ngữ văn lớp 6, câu hỏi phân biệt Ẩn dụ và Hoán dụ làm tớ hay bị rối quá!"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Đừng lo Minh! Bí quyết nằm ở hai chữ: 'Tương đồng' và 'Tương cận'. Ẩn dụ là so sánh ngầm dựa trên nét TƯƠNG ĐỒNG (giống nhau). Ví dụ: 'Người Cha mái tóc bạc' - Bác Hồ giống người cha ở tình thương bao la."
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "Ồ, thế còn Hoán dụ thì sao hả Lan?"
      },
      {
        speaker: "Lan",
        role: "explainer",
        text: "Hoán dụ dựa trên nét TƯƠNG CẬN (gần gũi, đi liền với nhau). Ví dụ: 'Áo chàm đưa buổi phân ly' - Người dân Việt Bắc hay mặc áo chàm, nên lấy chiếc áo chàm để chỉ đồng bào Việt Bắc!"
      },
      {
        speaker: "Minh",
        role: "questioner",
        text: "A! Áo chàm với người mặc áo đi liền với nhau ngoài đời thực, nên là Hoán dụ! Còn Bác Hồ với người cha có sự giống nhau về phẩm chất nên là Ẩn dụ. Nhớ công thức này thì không bao giờ nhầm nữa rồi!"
      }
    ],
    quickReviewQuestions: [
      {
        question: "Biện pháp tu từ Ẩn dụ được xây dựng dựa trên mối quan hệ nào?",
        options: ["Quan hệ tương đồng (giống nhau)", "Quan hệ tương cận (gần gũi)", "Quan hệ tương phản (đối lập)", "Quan hệ nhân quả"],
        correctIndex: 0,
        explanation: "Ẩn dụ là gọi tên sự vật, hiện tượng này bằng tên sự vật, hiện tượng khác có nét tương đồng (giống nhau) với nó."
      }
    ]
  }
];
