export type Difficulty = "easy" | "medium" | "hard" | "impossible";

export interface VocabQuestion {
  id: string;
  type: "translate";
  word: string;
  partOfSpeech?: string;
  options: string[];
  answer: string;
  example?: string;
  exampleVi?: string;
  textToRead: string;
  difficulty: Difficulty;
  source?: "ai" | "bank" | "local";
}

// Used only if the server cannot be reached at all, so a round never stalls.
export const OFFLINE_QUESTIONS: Omit<VocabQuestion, "id" | "difficulty">[] = [
  { type: "translate", word: "Environment", options: ["Môi trường", "Kinh tế", "Xã hội", "Giao thông"], answer: "Môi trường", textToRead: "Environment", example: "We must protect the environment." },
  { type: "translate", word: "School", options: ["Trường học", "Bệnh viện", "Công viên", "Chợ"], answer: "Trường học", textToRead: "School", example: "My school is near my house." },
  { type: "translate", word: "Happy", options: ["Vui vẻ", "Buồn bã", "Tức giận", "Mệt mỏi"], answer: "Vui vẻ", textToRead: "Happy", example: "I am happy today." },
  { type: "translate", word: "Neighbour", options: ["Hàng xóm", "Họ hàng", "Đồng nghiệp", "Khách hàng"], answer: "Hàng xóm", textToRead: "Neighbour", example: "My neighbour is very kind." },
  { type: "translate", word: "Sustainable", options: ["Bền vững", "Tạm thời", "Vô ích", "Đắt đỏ"], answer: "Bền vững", textToRead: "Sustainable", example: "We need sustainable energy." },
  { type: "translate", word: "Achievement", options: ["Thành tựu", "Sự thất bại", "Kế hoạch", "Thói quen"], answer: "Thành tựu", textToRead: "Achievement", example: "Winning the prize was a great achievement." },
  { type: "translate", word: "Obsolete", options: ["Lỗi thời", "Hiện đại", "Có ích", "Phổ biến"], answer: "Lỗi thời", textToRead: "Obsolete", example: "This phone is obsolete now." },
  { type: "translate", word: "Meticulous", options: ["Tỉ mỉ, cẩn thận", "Bừa bãi", "Nhanh nhẹn", "Hào phóng"], answer: "Tỉ mỉ, cẩn thận", textToRead: "Meticulous", example: "She is a meticulous student." },
];
