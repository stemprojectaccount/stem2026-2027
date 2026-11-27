import type {
  DetectedLanguage,
  EssayMetrics,
  SentenceSegment,
  ToneAnalysis,
  ToneStyle,
  WordToken,
} from './types';

const EN_ACADEMIC_PHRASES = [
  'in conclusion',
  'in addition',
  'on the other hand',
  'as a result',
  'in contrast',
  'for instance',
  'for example',
  'to summarize',
  'in summary',
  'according to',
  'it is evident',
  'research shows',
  'studies indicate',
];

const EN_ACADEMIC_WORDS = new Set([
  'furthermore',
  'moreover',
  'consequently',
  'nevertheless',
  'nonetheless',
  'therefore',
  'thus',
  'hence',
  'conversely',
  'accordingly',
  'subsequently',
  'whereas',
  'research',
  'evidence',
  'analysis',
  'analyze',
  'analyse',
  'hypothesis',
  'methodology',
  'significant',
  'significantly',
  'demonstrate',
  'demonstrates',
  'indicate',
  'indicates',
  'factor',
  'factors',
  'impact',
  'perspective',
  'context',
  'argument',
  'conclusion',
  'data',
  'study',
  'studies',
  'phenomenon',
  'sustainable',
  'academic',
  'objective',
  'criteria',
  'evaluate',
  'assess',
  'concept',
  'theory',
  'principle',
  'implication',
  'implications',
  'correlation',
  'contribute',
  'contributes',
  'empirical',
  'framework',
  'literature',
  'specifically',
]);

const EN_FORMAL_PHRASES = [
  'thank you',
  'with respect',
  'look forward',
  'in order to',
  'would like to',
];

const EN_FORMAL_WORDS = new Set([
  'sincerely',
  'regards',
  'respectfully',
  'dear',
  'appreciate',
  'grateful',
  'request',
  'inform',
  'ensure',
  'recommend',
  'propose',
  'responsibility',
  'duty',
  'opportunity',
  'community',
  'citizen',
  'citizens',
  'policy',
  'improve',
  'promote',
  'encourage',
  'essential',
  'necessary',
  'effective',
  'beneficial',
  'appropriate',
  'cooperation',
  'respect',
  'environment',
  'protect',
  'protecting',
  'practice',
  'maintain',
]);

const EN_CASUAL_PHRASES = [
  'a lot of',
  'lots of',
  'tons of',
  'kind of',
  'sort of',
  'pretty much',
  'hang out',
  'you know',
  'by the way',
  'to be honest',
];

const EN_CASUAL_WORDS = new Set([
  'awesome',
  'cool',
  'super',
  'stuff',
  'gonna',
  'wanna',
  'gotta',
  'kinda',
  'sorta',
  'yeah',
  'yep',
  'nope',
  'hey',
  'guys',
  'kids',
  'ok',
  'okay',
  'totally',
  'literally',
  'basically',
  'chill',
  'crazy',
  'lol',
  'omg',
  'btw',
  'dude',
  'bro',
  'fun',
  'really',
  'dont',
  'cant',
  'wont',
  'im',
  'ive',
  'youre',
  'theyre',
]);

const EN_CONTRACTION_REGEX = /\b[a-z]+['’](?:t|m|re|ve|ll|d|s)\b/i;

const VI_ACADEMIC_PHRASES = [
  'tuy nhiên',
  'bên cạnh đó',
  'ngoài ra',
  'do đó',
  'vì vậy',
  'từ đó',
  'tóm lại',
  'kết luận',
  'thứ nhất',
  'thứ hai',
  'mặt khác',
  'hơn nữa',
  'không những thế',
  'nói cách khác',
  'chính vì thế',
  'trên thực tế',
  'có thể thấy',
  'luận điểm',
  'dẫn chứng',
  'phân tích',
  'nghiên cứu',
  'chứng minh',
  'khái niệm',
  'nguyên nhân',
  'hệ quả',
  'giải pháp',
  'tác động',
  'nhận thức',
  'quan điểm',
  'khách quan',
  'thực trạng',
  'biện pháp',
  'khảo sát',
  'dữ liệu',
  'nguyên tắc',
  'hệ thống',
  'bền vững',
  'cơ sở lý luận',
];

const VI_FORMAL_PHRASES = [
  'kính gửi',
  'trân trọng',
  'đề nghị',
  'góp phần',
  'trách nhiệm',
  'ý thức',
  'tự giác',
  'gương mẫu',
  'tập thể',
  'cộng đồng',
  'nhà trường',
  'quy định',
  'chủ động',
  'duy trì',
  'tích cực',
  'thiết thực',
  'cần thiết',
  'quan trọng',
  'hiệu quả',
  'xây dựng',
  'giữ gìn',
  'bảo vệ',
  'tôn trọng',
  'văn minh',
  'tài nguyên',
  'thầy cô',
  'học sinh',
  'chúng ta',
];

const VI_CASUAL_PHRASES = [
  'quá trời',
  'kiểu như',
  'nói chung là',
  'thiệt ra',
  'tụi mình',
  'bọn mình',
  'mình thấy',
  'chơi luôn',
  'rất chi là',
  'vui lắm',
  'hay lắm',
  'thích lắm',
  'được luôn',
  'siêu thích',
  'cực kỳ',
  'các bạn ơi',
];

const VI_CASUAL_WORDS = new Set([
  'nhé',
  'nha',
  'nhỉ',
  'nè',
  'ơi',
  'hả',
  'á',
  'hihi',
  'haha',
  'kkk',
  'siêu',
  'đỉnh',
  'xịn',
  'oke',
  'ok',
  'thiệt',
  'tớ',
  'cậu',
  'bồ',
  'cực',
  'lắm',
]);

function findMatchedPhrases(normalizedText: string, phrases: string[]): string[] {
  const matched: string[] = [];
  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u');
    if (regex.test(normalizedText)) {
      matched.push(phrase);
    }
  }
  return matched;
}

function uniqueSample(items: string[], limit = 4): string[] {
  return Array.from(new Set(items)).slice(0, limit);
}

function formatQuotedList(items: string[]): string {
  return items.map((item) => `“${item}”`).join(', ');
}

function buildToneLabels(style: ToneStyle): { label: string; summary: string } {
  switch (style) {
    case 'academic':
      return {
        label: 'Học thuật (Academic)',
        summary:
          'Bài viết mang sắc thái lập luận mạch lạc, có từ ngữ phân tích và liên kết ý rõ ràng, phù hợp với văn nghị luận hoặc bài luận học thuật.',
      };
    case 'formal':
      return {
        label: 'Trang trọng (Formal)',
        summary:
          'Bài viết sử dụng cách diễn đạt chuẩn mực, lịch sự và rõ ràng, phù hợp với bài tập làm văn, bài phát biểu hoặc văn bản nộp giáo viên.',
      };
    case 'casual':
      return {
        label: 'Thân mật / Khẩu ngữ (Casual)',
        summary:
          'Bài viết mang giọng điệu trò chuyện tự nhiên, gần gũi; phù hợp với nhật ký, thư gửi bạn bè nhưng nên điều chỉnh nếu dùng cho bài văn nghị luận.',
      };
    case 'neutral':
      return {
        label: 'Chưa đủ dữ liệu',
        summary:
          'Hãy viết ít nhất khoảng 8 từ để công cụ nhận diện văn phong (học thuật, trang trọng hay thân mật).',
      };
  }
}

/**
 * Deterministically analyzes the writing tone/style (academic, formal, or casual)
 * for both Vietnamese and English essays and produces actionable stylistic feedback.
 */
export function detectTone(
  text: string,
  words: WordToken[],
  sentences: SentenceSegment[],
  metrics: EssayMetrics,
  language: DetectedLanguage
): ToneAnalysis {
  if (metrics.wordCount < 8) {
    const base = buildToneLabels('neutral');
    return {
      style: 'neutral',
      label: base.label,
      summary: base.summary,
      signals: [],
      feedback: [],
    };
  }

  const normalizedText = text.normalize('NFC').toLowerCase();
  const exclamationCount = (text.match(/!/g) ?? []).length;
  const ellipsisCount = (text.match(/\.\.\.|…/g) ?? []).length;

  let academicScore = 0;
  let formalScore = 0;
  let casualScore = 0;

  const academicHits: string[] = [];
  const formalHits: string[] = [];
  const casualHits: string[] = [];
  const contractionHits: string[] = [];

  if (language === 'en') {
    const matchedAcademicPhrases = findMatchedPhrases(normalizedText, EN_ACADEMIC_PHRASES);
    const matchedFormalPhrases = findMatchedPhrases(normalizedText, EN_FORMAL_PHRASES);
    const matchedCasualPhrases = findMatchedPhrases(normalizedText, EN_CASUAL_PHRASES);

    academicHits.push(...matchedAcademicPhrases);
    formalHits.push(...matchedFormalPhrases);
    casualHits.push(...matchedCasualPhrases);

    academicScore += matchedAcademicPhrases.length * 2.5;
    formalScore += matchedFormalPhrases.length * 2;
    casualScore += matchedCasualPhrases.length * 2.5;

    let firstPersonSingularCount = 0;
    let secondPersonCount = 0;
    let longWordCount = 0;

    for (const token of words) {
      if (EN_ACADEMIC_WORDS.has(token.normalized)) {
        academicHits.push(token.raw.toLowerCase());
        academicScore += 2;
      }
      if (EN_FORMAL_WORDS.has(token.normalized)) {
        formalHits.push(token.raw.toLowerCase());
        formalScore += 1.4;
      }
      if (EN_CASUAL_WORDS.has(token.normalized)) {
        casualHits.push(token.raw.toLowerCase());
        casualScore += 2;
      }
      if (EN_CONTRACTION_REGEX.test(token.raw)) {
        // Ignore possessive "'s" on nouns by checking common pronoun/auxiliary contractions
        if (
          /^(?:don|doesn|didn|can|won|isn|aren|wasn|weren|haven|hasn|hadn|shouldn|couldn|wouldn|i|you|we|they|he|she|it|that|there|what|who)['’](?:t|m|re|ve|ll|d|s)$/i.test(
            token.raw
          )
        ) {
          contractionHits.push(token.raw);
          casualScore += 1.8;
        }
      }
      if (token.normalized === 'i' || token.normalized === 'me' || token.normalized === 'my') {
        firstPersonSingularCount += 1;
      }
      if (token.normalized === 'you' || token.normalized === 'your') {
        secondPersonCount += 1;
      }
      if (token.normalized.length >= 7) {
        longWordCount += 1;
      }
    }

    const longWordRatio = longWordCount / Math.max(1, words.length);
    if (longWordRatio >= 0.24 && metrics.averageWordsPerSentence >= 13) {
      academicScore += 2;
    } else if (metrics.averageWordsPerSentence >= 11 && casualScore === 0) {
      formalScore += 1.5;
    }

    if ((firstPersonSingularCount + secondPersonCount) / Math.max(1, words.length) >= 0.12) {
      casualScore += 1.5;
    }
  } else {
    const matchedAcademicPhrases = findMatchedPhrases(normalizedText, VI_ACADEMIC_PHRASES);
    const matchedFormalPhrases = findMatchedPhrases(normalizedText, VI_FORMAL_PHRASES);
    const matchedCasualPhrases = findMatchedPhrases(normalizedText, VI_CASUAL_PHRASES);

    academicHits.push(...matchedAcademicPhrases);
    formalHits.push(...matchedFormalPhrases);
    casualHits.push(...matchedCasualPhrases);

    academicScore += matchedAcademicPhrases.length * 2.2;
    formalScore += matchedFormalPhrases.length * 1.5;
    casualScore += matchedCasualPhrases.length * 2.5;

    for (const token of words) {
      if (VI_CASUAL_WORDS.has(token.normalized)) {
        casualHits.push(token.raw.toLowerCase());
        casualScore += 2;
      }
    }

    if (metrics.averageWordsPerSentence >= 15 && casualScore === 0) {
      formalScore += 1;
    }
  }

  if (exclamationCount >= 1) {
    casualScore += exclamationCount * 1.8;
  }
  if (ellipsisCount >= 1) {
    casualScore += ellipsisCount * 1.2;
  }

  // Classify decisively into casual, academic, or formal
  let style: ToneStyle;
  if (casualScore >= 2.5 && casualScore >= academicScore && casualScore >= formalScore * 0.8) {
    style = 'casual';
  } else if (academicScore >= 3.5 && academicScore >= formalScore) {
    style = 'academic';
  } else {
    style = 'formal';
  }

  const base = buildToneLabels(style);
  const signals: string[] = [];
  const feedback: string[] = [];

  const uniqueAcademic = uniqueSample(academicHits);
  const uniqueFormal = uniqueSample(formalHits);
  const uniqueCasual = uniqueSample(casualHits);
  const uniqueContractions = uniqueSample(contractionHits);

  if (style === 'academic') {
    if (uniqueAcademic.length > 0) {
      signals.push(
        `Từ ngữ / từ nối học thuật: ${formatQuotedList(uniqueAcademic)}`
      );
    }
    signals.push(
      `Độ dài câu trung bình ${metrics.averageWordsPerSentence.toLocaleString('vi-VN')} từ/câu, diễn đạt khách quan.`
    );
    if (uniqueContractions.length > 0 || uniqueCasual.length > 0) {
      const mixed = uniqueSample([...uniqueContractions, ...uniqueCasual], 3);
      signals.push(`Còn lẫn vài từ mang sắc thái thân mật: ${formatQuotedList(mixed)}`);
      feedback.push(
        `Nên thay ${formatQuotedList(mixed)} bằng cách viết đầy đủ, trang trọng hơn để giữ giọng văn học thuật đồng nhất.`
      );
    } else {
      feedback.push(
        'Văn phong học thuật đã ổn định; chú ý kiểm soát độ dài câu (dưới 28–30 từ) để người đọc không bị nặng nề.'
      );
    }
    feedback.push(
      language === 'en'
        ? 'Giữ ngôi thứ ba khách quan và dùng thêm dẫn chứng cụ thể cho mỗi luận điểm chính.'
        : 'Giữ mạch lập luận rõ ràng bằng cách gắn mỗi luận điểm với một dẫn chứng thực tế ngắn gọn.'
    );
  } else if (style === 'formal') {
    if (uniqueFormal.length > 0) {
      signals.push(`Từ ngữ chuẩn mực, trang trọng: ${formatQuotedList(uniqueFormal)}`);
    } else {
      signals.push('Không chứa tiếng lóng hay dấu cảm thán mang tính khẩu ngữ.');
    }
    if (uniqueAcademic.length > 0) {
      signals.push(`Có dùng từ nối lập luận: ${formatQuotedList(uniqueAcademic)}`);
    }
    if (uniqueContractions.length > 0) {
      signals.push(`Có dùng dạng rút gọn: ${formatQuotedList(uniqueContractions)}`);
      feedback.push(
        `Nếu bài viết yêu cầu độ trang trọng cao, hãy viết đầy đủ các dạng rút gọn như ${formatQuotedList(uniqueContractions)}.`
      );
    }
    feedback.push(
      language === 'en'
        ? 'Muốn nâng lên văn phong học thuật (Academic), bạn có thể thêm từ nối như “furthermore”, “consequently”, “in contrast” và giảm đại từ ngôi thứ nhất.'
        : 'Muốn bài văn nghị luận giàu tính học thuật hơn, bạn có thể bổ sung từ nối chuyển ý (“tuy nhiên”, “bên cạnh đó”, “từ đó”) và phân tích nguyên nhân – hệ quả.'
    );
    feedback.push(
      'Văn phong hiện tại đã phù hợp để nộp bài tập làm văn hoặc bài viết trang trọng trên lớp.'
    );
  } else {
    // casual
    if (uniqueCasual.length > 0) {
      signals.push(`Từ ngữ khẩu ngữ / thân mật: ${formatQuotedList(uniqueCasual)}`);
    }
    if (uniqueContractions.length > 0) {
      signals.push(`Dạng rút gọn hội thoại: ${formatQuotedList(uniqueContractions)}`);
    }
    if (exclamationCount > 0) {
      signals.push(`Sử dụng ${exclamationCount} dấu chấm than (!) tạo giọng cảm thán.`);
    }
    if (signals.length === 0) {
      signals.push('Cấu trúc câu ngắn và sử dụng nhiều đại từ giao tiếp trực tiếp.');
    }

    feedback.push(
      language === 'en'
        ? 'Nếu đây là bài luận nộp trên lớp, hãy thay các dạng rút gọn (don’t → do not) và từ khẩu ngữ (awesome, stuff, guys) bằng từ vựng trang trọng hơn.'
        : 'Nếu đây là bài văn nghị luận hoặc thuyết minh, hãy lược bỏ tiểu từ khẩu ngữ (“nhé”, “nha”, “lắm”, “siêu”) và hạn chế dấu chấm than (!).'
    );
    feedback.push(
      'Nếu bạn đang viết thư cho bạn bè, nhật ký hoặc bài kể chuyện gần gũi, giọng điệu thân mật này là hoàn toàn phù hợp.'
    );
  }

  void sentences;

  return {
    style,
    label: base.label,
    summary: base.summary,
    signals,
    feedback,
  };
}
