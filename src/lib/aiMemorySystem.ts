import { 
  AIMemoryStore, 
  UserProfileMemory, 
  LongTermMemory, 
  MemoryItem, 
  ConversationTurn, 
  UserProgress,
  Lesson
} from "../types";

const LOCAL_STORAGE_MEMORY_KEY = "eduquest_ai_long_term_memory_v2";

/**
 * SMART MEMORY SECURITY FILTER
 * Strictly rejects passwords, OTPs, bank account numbers, credit cards, or sensitive tokens.
 */
export function isSensitiveInformation(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // Patterns for sensitive data
  const sensitivePatterns = [
    /\b(password|mat khau|mật khẩu|pass)\s*[:=]\s*\S+/i,
    /\b(otp|mã otp|one time password)\b/i,
    /\b(stk|số tài khoản|so tai khoan|ngân hàng|bank account|cvv|ccv)\b/i,
    /\b\d{9,16}\b/, // Potential bank account or card number
    /\b(token|secret_key|api_key)\b/i
  ];

  return sensitivePatterns.some(pattern => pattern.test(lower));
}

/**
 * Filter out sensitive content from strings before memorizing
 */
export function sanitizeMemoryContent(content: string): string {
  if (isSensitiveInformation(content)) {
    return "[Nội dung bảo mật đã được bảo vệ - không lưu trữ]";
  }
  return content.trim();
}

/**
 * Initial baseline memory state
 */
export function createDefaultAIMemory(progress?: UserProgress): AIMemoryStore {
  const initialGrade = progress?.grade || "Lớp 6";
  const initialName = progress?.displayName || "Học sinh SmartStudy";

  return {
    userProfile: {
      name: initialName,
      grade: initialGrade,
      favorite_subject: "Toán học",
      weak_subject: "Tiếng Anh",
      goal: "Đạt học sinh xuất sắc và Nắm vững kiến thức các môn",
      communication_style: "friendly",
      learning_style: "visual",
      notes: "Tập trung rèn luyện tư duy logic và mở rộng vốn từ vựng học thuật."
    },
    recentConversations: [
      {
        id: "msg-init-1",
        role: "model",
        content: "Chào em! Thầy là trợ lý gia sư AI của SmartStudy. Thầy luôn ghi nhớ mục tiêu, thói quen học tập và đồng hành cùng em lâu dài. Hôm nay em cần hỗ trợ bài học nào?",
        timestamp: new Date().toISOString()
      }
    ],
    longTermMemory: {
      learning_history: [
        {
          id: "mem-learn-1",
          category: "learning",
          content: "Đang củng cố nền tảng kiến thức môn Toán và Tiếng Anh",
          score: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      preference_history: [
        {
          id: "mem-pref-1",
          category: "preference",
          content: "Thích giải thích có ví dụ mẫu, công thức viết chuẩn ký hiệu LaTeX",
          score: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      project_history: [
        {
          id: "mem-proj-1",
          category: "project",
          content: "Kế hoạch nâng cao điểm số học kỳ và tham gia Đấu trường Đố vui",
          score: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      goal_history: [
        {
          id: "mem-goal-1",
          category: "goal",
          content: "Nâng cao thành tích môn Toán và bứt phá Tiếng Anh",
          score: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      memory_scores: {
        "Toán": 15,
        "Tiếng Anh": 12,
        "IELTS": 8,
        "Công thức chuẩn": 10,
        "Giải thích từng bước": 9
      }
    },
    preferences: {
      brevity: "balanced",
      tone: "friendly",
      useSearchGrounding: true,
      latexMathRendering: true
    },
    lastMemorySummary: "Học sinh mới bắt đầu năm học, ưu tiên nắm vững kiến thức trọng tâm Toán và nâng cao Tiếng Anh.",
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Load AI Memory from LocalStorage or initialize with live user profile data
 */
export function loadAIMemory(progress?: UserProgress): AIMemoryStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEMORY_KEY);
    if (raw) {
      const parsed: AIMemoryStore = JSON.parse(raw);
      // Synchronize with live user progress if available
      if (progress) {
        if (progress.displayName && progress.displayName !== parsed.userProfile.name) {
          parsed.userProfile.name = progress.displayName;
        }
        if (progress.grade && progress.grade !== parsed.userProfile.grade) {
          parsed.userProfile.grade = progress.grade;
        }
      }
      return parsed;
    }
  } catch (err) {
    console.warn("Could not load AI Memory from localStorage:", err);
  }
  return createDefaultAIMemory(progress);
}

/**
 * Persist AI Memory to LocalStorage
 */
export function saveAIMemory(memory: AIMemoryStore): void {
  try {
    memory.lastUpdated = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_MEMORY_KEY, JSON.stringify(memory));
  } catch (err) {
    console.warn("Could not save AI Memory to localStorage:", err);
  }
}

/**
 * Add a new turn to recent conversation memory (capped at 20 turns)
 */
export function addConversationTurn(
  memory: AIMemoryStore,
  role: "user" | "model",
  content: string
): AIMemoryStore {
  const newTurn: ConversationTurn = {
    id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content: sanitizeMemoryContent(content),
    timestamp: new Date().toISOString()
  };

  // Keep up to 20 recent messages
  const recent = [...memory.recentConversations, newTurn].slice(-20);

  const updated: AIMemoryStore = {
    ...memory,
    recentConversations: recent,
    lastUpdated: new Date().toISOString()
  };

  saveAIMemory(updated);
  return updated;
}

/**
 * Update memory score for a specific topic / keyword (e.g. "IELTS", "Toán 11")
 */
export function updateMemoryScore(
  memory: AIMemoryStore,
  keyword: string,
  increment: number = 1
): AIMemoryStore {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) return memory;

  const currentScores = { ...(memory.longTermMemory.memory_scores || {}) };
  currentScores[cleanKeyword] = (currentScores[cleanKeyword] || 0) + increment;

  const updated: AIMemoryStore = {
    ...memory,
    longTermMemory: {
      ...memory.longTermMemory,
      memory_scores: currentScores
    },
    lastUpdated: new Date().toISOString()
  };

  saveAIMemory(updated);
  return updated;
}

/**
 * Clear AI Memory and reset to baseline defaults
 */
export function clearAIMemory(progress?: UserProgress): AIMemoryStore {
  const fresh = createDefaultAIMemory(progress);
  saveAIMemory(fresh);
  return fresh;
}

/**
 * Manually update User Profile fields in AI Memory
 */
export function updateUserProfileMemory(
  memory: AIMemoryStore,
  profileUpdates: Partial<UserProfileMemory>
): AIMemoryStore {
  const updatedProfile: UserProfileMemory = {
    ...memory.userProfile,
    ...profileUpdates
  };

  const updated: AIMemoryStore = {
    ...memory,
    userProfile: updatedProfile,
    lastUpdated: new Date().toISOString()
  };

  saveAIMemory(updated);
  return updated;
}

/**
 * Merge newly extracted insights into Long Term Memory and User Profile
 */
export function mergeExtractedInsights(
  memory: AIMemoryStore,
  insights: {
    name?: string;
    age?: number;
    grade?: string;
    favorite_subject?: string;
    weak_subject?: string;
    goal?: string;
    career_target?: string;
    current_project?: string;
    communication_style?: string;
    learning_style?: string;
    memorySummary?: string;
    topicsDiscussed?: string[];
  }
): AIMemoryStore {
  const userProfile = { ...memory.userProfile };
  const longTermMemory = { ...memory.longTermMemory };
  const scores = { ...(longTermMemory.memory_scores || {}) };

  // 1. Update Profile fields if new information discovered
  if (insights.name && !isSensitiveInformation(insights.name)) userProfile.name = insights.name;
  if (insights.age && insights.age > 5 && insights.age < 100) userProfile.age = insights.age;
  if (insights.grade && !isSensitiveInformation(insights.grade)) userProfile.grade = insights.grade;
  if (insights.favorite_subject && !isSensitiveInformation(insights.favorite_subject)) userProfile.favorite_subject = insights.favorite_subject;
  if (insights.weak_subject && !isSensitiveInformation(insights.weak_subject)) userProfile.weak_subject = insights.weak_subject;
  if (insights.career_target && !isSensitiveInformation(insights.career_target)) userProfile.career_target = insights.career_target;
  if (insights.current_project && !isSensitiveInformation(insights.current_project)) {
    userProfile.current_project = insights.current_project;
    const projectExists = (longTermMemory.project_history || []).some(p => p.content.toLowerCase().includes(insights.current_project!.toLowerCase()));
    if (!projectExists) {
      longTermMemory.project_history = [
        {
          id: `proj-${Date.now()}`,
          category: "project" as const,
          content: insights.current_project,
          score: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...(longTermMemory.project_history || [])
      ].slice(0, 10);
    }
  }

  if (insights.goal && !isSensitiveInformation(insights.goal)) {
    userProfile.goal = insights.goal;
    // Add to goal history if not already present
    const exists = (longTermMemory.goal_history || []).some(g => g.content.toLowerCase().includes(insights.goal!.toLowerCase()));
    if (!exists) {
      longTermMemory.goal_history = [
        {
          id: `goal-${Date.now()}`,
          category: "goal" as const,
          content: insights.goal,
          score: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...(longTermMemory.goal_history || [])
      ].slice(0, 10);
    }
  }
  if (insights.communication_style) userProfile.communication_style = insights.communication_style;
  if (insights.learning_style) userProfile.learning_style = insights.learning_style;

  // 2. Update memory scores for topics discussed
  if (insights.topicsDiscussed && Array.isArray(insights.topicsDiscussed)) {
    insights.topicsDiscussed.forEach(topic => {
      const clean = topic.trim();
      if (clean && !isSensitiveInformation(clean)) {
        scores[clean] = (scores[clean] || 0) + 1;
      }
    });
  }

  // 3. Update summary
  const lastMemorySummary = insights.memorySummary 
    ? sanitizeMemoryContent(insights.memorySummary)
    : memory.lastMemorySummary;

  const updated: AIMemoryStore = {
    ...memory,
    userProfile,
    longTermMemory: {
      ...longTermMemory,
      memory_scores: scores
    },
    lastMemorySummary,
    lastUpdated: new Date().toISOString()
  };

  saveAIMemory(updated);
  return updated;
}

/**
 * CONTEXT ENGINE: Build the structured context prompt containing
 * Profile, Long-Term Memory (ordered by score), and 20 recent messages
 */
export function buildContextEnginePrompt(
  memory: AIMemoryStore,
  knowledgeContext?: { lessons?: Lesson[]; currentLessonTitle?: string; currentSubject?: string }
): string {
  const profile = memory.userProfile;
  const ltm = memory.longTermMemory;
  
  // Sort memory scores by priority
  const sortedScores = Object.entries(ltm.memory_scores || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, score]) => `• ${topic} (nhắc ${score} lần - Ưu tiên ${score >= 10 ? 'RẤT CAO' : score >= 5 ? 'CAO' : 'Trung bình'})`)
    .join("\n");

  const topGoals = ltm.goal_history.slice(0, 3).map(g => `- ${g.content}`).join("\n") || "- Nâng cao năng lực học tập toàn diện";
  const topPrefs = ltm.preference_history.slice(0, 3).map(p => `- ${p.content}`).join("\n") || "- Giải thích sư phạm chuẩn mực, chuẩn công thức LaTeX";
  const topLearnings = ltm.learning_history.slice(0, 3).map(l => `- ${l.content}`).join("\n") || "- Đang bám sát chương trình phổ thông";

  let knowledgeSnippet = "";
  if (knowledgeContext?.currentLessonTitle) {
    knowledgeSnippet = `\n[KIẾN THỨC BÀI ĐANG HỌC]: "${knowledgeContext.currentLessonTitle}" (Môn: ${knowledgeContext.currentSubject || 'Tổng hợp'})`;
  }

  return `
=== HỒ SƠ NGƯỜI DÙNG (USER PROFILE) ===
- Tên học sinh: ${profile.name || 'Học sinh'}
- Lớp học: ${profile.grade || 'Lớp 6'}
- Môn thế mạnh / yêu thích: ${profile.favorite_subject || 'Toán học'}
- Môn / Kỹ năng đang cần cải thiện: ${profile.weak_subject || 'Tiếng Anh'}
- Mục tiêu chính: ${profile.goal || 'Đạt điểm giỏi'}
- Phong cách giao tiếp ưa thích: ${profile.communication_style || 'Thân thiện, mạch lạc'}
- Phong cách học tập: ${profile.learning_style || 'Trực quan, có ví dụ'}

=== BẢNG ĐIỂM TRÍ NHỚ ƯU TIÊN (MEMORY SCORES) ===
${sortedScores || '• Chưa có điểm tần suất'}

=== LỊCH SỬ MỤC TIÊU và DỰ ÁN (GOAL và PROJECT HISTORY) ===
${topGoals}

=== THÓI QUEN và SỞ THÍCH GIAO TIẾP (PREFERENCE HISTORY) ===
${topPrefs}

=== TIẾN TRÌNH HỌC TẬP (LEARNING HISTORY) ===
${topLearnings}
${knowledgeSnippet}
`;
}
