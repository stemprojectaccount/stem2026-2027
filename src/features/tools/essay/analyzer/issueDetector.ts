import type {
  AnalysisIssue,
  CriterionInput,
  DetectedLanguage,
  SentenceSegment,
  TextRange,
  WordToken,
} from './types';
import { getStopwords, VIETNAMESE_REDUPLICATIVES } from './tokenizer';

export interface ResolvedDetectorOptions {
  maxSentenceWords: number;
  minWordRepeatCount: number;
  minPhraseRepeatCount: number;
}

const ENGLISH_CONTRACTIONS_MAP: Record<string, string> = {
  dont: "don't",
  doesnt: "doesn't",
  didnt: "didn't",
  cant: "can't",
  wont: "won't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  havent: "haven't",
  hasnt: "hasn't",
  hadnt: "hadn't",
  shouldnt: "shouldn't",
  couldnt: "couldn't",
  wouldnt: "wouldn't",
  im: "I'm",
  ive: "I've",
  youre: "you're",
  theyre: "they're",
  weve: "we've",
  whats: "what's",
  thats: "that's",
};

const ENGLISH_TYPOS_MAP: Record<string, string> = {
  becuase: 'because',
  becasue: 'because',
  enviroment: 'environment',
  enviromental: 'environmental',
  goverment: 'government',
  recieve: 'receive',
  beleive: 'believe',
  freind: 'friend',
  freinds: 'friends',
  studing: 'studying',
  writting: 'writing',
  tommorow: 'tomorrow',
  tomorow: 'tomorrow',
  diffrent: 'different',
  importent: 'important',
  beautifull: 'beautiful',
  usefull: 'useful',
  helful: 'helpful',
  alot: 'a lot',
  thier: 'their',
  pepole: 'people',
  langauge: 'language',
  eduction: 'education',
  knowlege: 'knowledge',
  neccessary: 'necessary',
  definately: 'definitely',
  seperate: 'separate',
  untill: 'until',
  wich: 'which',
  teh: 'the',
  adn: 'and',
  intresting: 'interesting',
  studen: 'student',
  studens: 'students',
  shcool: 'school',
};

const SILENT_H_WORDS = new Set(['hour', 'hours', 'honest', 'honestly', 'honor', 'honour', 'heir']);
const CONSONANT_SOUND_VOWEL_PREFIXES = [
  'uni',
  'use',
  'usu',
  'eu',
  'one',
  'once',
  'uk',
  'usa',
  'ufo',
];
const PLURAL_COUNTABLE_AFTER_MUCH = new Set([
  'people',
  'students',
  'friends',
  'books',
  'trees',
  'problems',
  'ideas',
  'things',
  'cars',
  'days',
  'years',
  'hours',
  'times',
  'places',
  'animals',
]);
const DOUBLE_COMPARATIVE_WORDS = new Set([
  'better',
  'worse',
  'easier',
  'harder',
  'faster',
  'slower',
  'bigger',
  'smaller',
  'cheaper',
  'stronger',
  'longer',
  'shorter',
  'higher',
  'lower',
  'cleaner',
  'greener',
]);
const THIRD_PERSON_FIX: Record<string, string> = {
  are: 'is', were: 'was', have: 'has', do: 'does', "don't": "doesn't", go: 'goes', want: 'wants', like: 'likes',
  need: 'needs', help: 'helps', make: 'makes', think: 'thinks', know: 'knows', play: 'plays', study: 'studies',
  watch: 'watches', live: 'lives', work: 'works', love: 'loves', get: 'gets', say: 'says', try: 'tries',
  come: 'comes', take: 'takes', give: 'gives', become: 'becomes', seem: 'seems', look: 'looks', feel: 'feels',
  read: 'reads', write: 'writes', learn: 'learns', teach: 'teaches', use: 'uses', cause: 'causes', provide: 'provides',
};

// Linking words that open a sentence and are normally followed by a comma
const EN_TRANSITIONS = [
  'however', 'moreover', 'furthermore', 'therefore', 'besides', 'nevertheless', 'consequently', 'firstly', 'secondly',
  'thirdly', 'finally', 'in conclusion', 'in addition', 'for example', 'for instance', 'on the other hand',
  'in my opinion', 'in short', 'to sum up', 'as a result',
];
const VI_TRANSITIONS = [
  'tuy nhiên', 'ngoài ra', 'bên cạnh đó', 'vì vậy', 'do đó', 'tóm lại', 'nhìn chung', 'như vậy', 'thứ nhất',
  'thứ hai', 'thứ ba', 'cuối cùng', 'trước hết', 'hơn nữa', 'mặt khác', 'nói tóm lại', 'chẳng hạn',
];

function detectTransitionCommas(sentences: SentenceSegment[], language: DetectedLanguage): AnalysisIssue[] {
  const list = (language === 'en' ? EN_TRANSITIONS : VI_TRANSITIONS).slice().sort((a, b) => b.length - a.length);
  const issues: AnalysisIssue[] = [];
  for (const s of sentences) {
    const lead = s.text.match(/^\s*/)?.[0].length ?? 0;
    const body = s.text.slice(lead);
    const lower = body.normalize('NFC').toLowerCase();
    const hit = list.find((w) => lower.startsWith(w) && /^[\s]/.test(lower.slice(w.length)) && !/^[,:;]/.test(lower.slice(w.length)));
    if (!hit || s.wordCount < 4) continue;
    const start = s.start + lead;
    const range: TextRange = { start, end: start + hit.length };
    const original = body.slice(0, hit.length);
    issues.push({
      id: `transition-comma-${s.globalIndex}`,
      category: 'punctuation',
      severity: 'warning',
      title: `Thiếu dấu phẩy sau “${original}”`,
      reason: `Từ nối đứng đầu câu (“${original}”) thường được ngăn cách với phần còn lại bằng dấu phẩy để câu rõ ý.`,
      suggestion: `Viết “${original},”.`,
      fixSteps: [`Thêm dấu phẩy ngay sau “${original}”.`],
      wrongText: original,
      suggestedFix: `${original},`,
      locationLabel: `Đoạn ${s.paragraphIndex}, Câu ${s.sentenceInParagraph}`,
      excerpt: makeExcerpt(s.text),
      range,
      allRanges: [range],
    });
  }
  return issues;
}

const MODALS = new Set(['can', 'could', 'must', 'should', 'will', 'would', 'may', 'might']);

function makeExcerpt(text: string, maxLength = 78): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function matchCase(source: string, replacement: string): string {
  if (!source) return replacement;
  if (replacement.startsWith("I'") || replacement === 'I') return replacement;
  const first = source[0];
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function expectsAnArticle(nextWordNorm: string): boolean | null {
  if (!/^[a-z]/.test(nextWordNorm)) return null;
  if (SILENT_H_WORDS.has(nextWordNorm)) return true;
  if (CONSONANT_SOUND_VOWEL_PREFIXES.some((prefix) => nextWordNorm.startsWith(prefix))) {
    return false;
  }
  return /^[aeiou]/.test(nextWordNorm);
}

function buildTargetKeywordSet(criteria: CriterionInput[]): Set<string> {
  const set = new Set<string>();
  for (const item of criteria) {
    const cleaned = item.text.normalize('NFC').toLowerCase().trim();
    if (!cleaned) continue;
    set.add(cleaned);
    const words = cleaned.match(/[\p{L}\p{N}]+/gu) ?? [];
    if (words.length <= 2) {
      for (const w of words) set.add(w);
    }
  }
  return set;
}

function sentenceLocation(sentencesById: Map<number, SentenceSegment>, sentenceIndex: number): string {
  const s = sentencesById.get(sentenceIndex);
  if (!s) return `Câu ${sentenceIndex}`;
  return `Đoạn ${s.paragraphIndex}, Câu ${s.sentenceInParagraph}`;
}

function detectAdjacentDuplicates(
  words: WordToken[],
  language: DetectedLanguage,
  sentencesById: Map<number, SentenceSegment>
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (let i = 1; i < words.length; i += 1) {
    const prev = words[i - 1];
    const curr = words[i];
    const isViReduplicative =
      language === 'vi' && VIETNAMESE_REDUPLICATIVES.has(curr.normalized);

    if (
      prev.sentenceIndex === curr.sentenceIndex &&
      prev.normalized === curr.normalized &&
      !isViReduplicative &&
      !/^\d+$/.test(curr.normalized)
    ) {
      const range: TextRange = { start: prev.start, end: curr.end };
      const wrong = `${prev.raw} ${curr.raw}`;
      issues.push({
        id: `adj-repeat-${prev.start}`,
        category: 'repetition',
        severity: 'error',
        title: `Lặp từ liền kề “${wrong}”`,
        reason: `Từ “${prev.raw}” bị gõ lặp hai lần liên tiếp trong cùng một câu.`,
        suggestion: `Xóa bớt một từ “${curr.raw}” thừa.`,
        fixSteps: [
          `Xác định cụm “${wrong}” trong câu.`,
          `Giữ lại một từ “${prev.raw}” duy nhất để câu gọn gàng.`,
        ],
        wrongText: wrong,
        suggestedFix: prev.raw,
        locationLabel: sentenceLocation(sentencesById, curr.sentenceIndex),
        excerpt: wrong,
        range,
        allRanges: [range],
        count: 2,
      });
    }
  }

  return issues;
}

function detectEnglishGrammarIssues(
  words: WordToken[],
  sentencesById: Map<number, SentenceSegment>
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (let i = 0; i < words.length; i += 1) {
    const token = words[i];
    const loc = sentenceLocation(sentencesById, token.sentenceIndex);
    const range: TextRange = { start: token.start, end: token.end };
    const sentence = sentencesById.get(token.sentenceIndex);
    const excerpt = sentence ? makeExcerpt(sentence.text) : token.raw;

    // 1. Standalone lowercase English pronoun "i" or "i'm / i've / i'll / i'd"
    if (/^i(?:'(?:m|ve|ll|d))?$/.test(token.raw)) {
      const fixed = `I${token.raw.slice(1)}`;
      issues.push({
        id: `en-pronoun-i-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Chưa viết hoa đại từ “${token.raw}”`,
        reason: `Trong tiếng Anh, đại từ ngôi thứ nhất “I” (và các dạng viết tắt như I'm, I've, I'll) luôn phải viết hoa ở mọi vị trí.`,
        suggestion: `Đổi “${token.raw}” thành “${fixed}”.`,
        fixSteps: [
          `Tìm vị trí từ “${token.raw}” trong câu.`,
          `Viết hoa chữ “I” thành “${fixed}”.`,
        ],
        wrongText: token.raw,
        suggestedFix: fixed,
        locationLabel: loc,
        excerpt,
        range,
        allRanges: [range],
      });
      continue;
    }

    // 2. Missing apostrophe in common English contractions
    const contractionFix = ENGLISH_CONTRACTIONS_MAP[token.normalized];
    if (contractionFix) {
      const fixed = matchCase(token.raw, contractionFix);
      issues.push({
        id: `en-contraction-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Thiếu dấu nháy đơn ở “${token.raw}”`,
        reason: `Từ rút gọn tiếng Anh cần có dấu nháy đơn (') tại vị trí chữ cái bị lược bỏ.`,
        suggestion: `Sửa “${token.raw}” thành “${fixed}” (hoặc viết đầy đủ trong bài văn trang trọng).`,
        fixSteps: [
          `Thay “${token.raw}” bằng “${fixed}”.`,
          `Mẹo viết bài luận: có thể viết dạng đầy đủ (ví dụ: do not, cannot) để câu văn trang trọng hơn.`,
        ],
        wrongText: token.raw,
        suggestedFix: fixed,
        locationLabel: loc,
        excerpt,
        range,
        allRanges: [range],
      });
      continue;
    }

    // 3. Common high-confidence English spelling typos
    const typoFix = ENGLISH_TYPOS_MAP[token.normalized];
    if (typoFix) {
      const fixed = matchCase(token.raw, typoFix);
      issues.push({
        id: `en-typo-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Sai chính tả tiếng Anh: “${token.raw}”`,
        reason: `Từ “${token.raw}” bị viết sai trật tự hoặc thiếu/thừa chữ cái.`,
        suggestion: `Sửa thành “${fixed}”.`,
        fixSteps: [
          `Đối chiếu chính tả đúng của từ: “${fixed}”.`,
          `Thay “${token.raw}” bằng “${fixed}” và đọc lại câu.`,
        ],
        wrongText: token.raw,
        suggestedFix: fixed,
        locationLabel: loc,
        excerpt,
        range,
        allRanges: [range],
      });
      continue;
    }

    // Pairwise rules require a next token in the same sentence
    if (i + 1 >= words.length) continue;
    const next = words[i + 1];
    if (next.sentenceIndex !== token.sentenceIndex) continue;
    const pairRange: TextRange = { start: token.start, end: next.end };
    const pairRaw = `${token.raw} ${next.raw}`;

    // 4. Article "a" vs "an"
    if (token.normalized === 'a' || token.normalized === 'an') {
      const shouldUseAn = expectsAnArticle(next.normalized);
      if (shouldUseAn === true && token.normalized === 'a') {
        const fixedArticle = matchCase(token.raw, 'an');
        const fixedPair = `${fixedArticle} ${next.raw}`;
        issues.push({
          id: `en-article-an-${token.start}`,
          category: 'grammar',
          severity: 'error',
          title: `Dùng sai mạo từ “${pairRaw}”`,
          reason: `Từ “${next.raw}” bắt đầu bằng nguyên âm (âm đọc u, e, o, a, i), nên cần dùng “an” thay vì “a”.`,
          suggestion: `Đổi “${pairRaw}” thành “${fixedPair}”.`,
          fixSteps: [
            `Kiểm tra âm đầu của từ đứng sau (“${next.raw}”).`,
            `Thay mạo từ “${token.raw}” bằng “${fixedArticle}” → “${fixedPair}”.`,
          ],
          wrongText: pairRaw,
          suggestedFix: fixedPair,
          locationLabel: loc,
          excerpt,
          range: pairRange,
          allRanges: [pairRange],
        });
      } else if (shouldUseAn === false && token.normalized === 'an') {
        const fixedArticle = matchCase(token.raw, 'a');
        const fixedPair = `${fixedArticle} ${next.raw}`;
        issues.push({
          id: `en-article-a-${token.start}`,
          category: 'grammar',
          severity: 'error',
          title: `Dùng sai mạo từ “${pairRaw}”`,
          reason: `Từ “${next.raw}” bắt đầu bằng âm phụ âm, nên cần dùng “a” thay vì “an”.`,
          suggestion: `Đổi “${pairRaw}” thành “${fixedPair}”.`,
          fixSteps: [
            `Kiểm tra âm đọc đầu của “${next.raw}” (là phụ âm).`,
            `Thay “${token.raw}” bằng “${fixedArticle}” → “${fixedPair}”.`,
          ],
          wrongText: pairRaw,
          suggestedFix: fixedPair,
          locationLabel: loc,
          excerpt,
          range: pairRange,
          allRanges: [pairRange],
        });
      }
    }

    // 5. Basic Subject-Verb agreement
    if (
      (token.normalized === 'he' || token.normalized === 'she' || token.normalized === 'it') &&
      (next.normalized === 'are' || next.normalized === "don't" || next.normalized === 'dont')
    ) {
      const fixedVerb = next.normalized === 'are' ? 'is' : "doesn't";
      const fixedPair = `${token.raw} ${fixedVerb}`;
      issues.push({
        id: `en-sva-singular-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Chưa hòa hợp chủ ngữ – động từ: “${pairRaw}”`,
        reason: `Chủ ngữ ngôi thứ ba số ít (${token.raw}) đi với động từ chia số ít (“${fixedVerb}”).`,
        suggestion: `Đổi “${pairRaw}” thành “${fixedPair}”.`,
        fixSteps: [
          `Xác định chủ ngữ số ít “${token.raw}”.`,
          `Chia lại động từ “${next.raw}” thành “${fixedVerb}”.`,
        ],
        wrongText: pairRaw,
        suggestedFix: fixedPair,
        locationLabel: loc,
        excerpt,
        range: pairRange,
        allRanges: [pairRange],
      });
    } else if (
      (token.normalized === 'they' || token.normalized === 'we' || token.normalized === 'you') &&
      next.normalized === 'is'
    ) {
      const fixedPair = `${token.raw} are`;
      issues.push({
        id: `en-sva-plural-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Chưa hòa hợp chủ ngữ – động từ: “${pairRaw}”`,
        reason: `Chủ ngữ “${token.raw}” luôn đi với “are” ở thì hiện tại đơn, không dùng “is”.`,
        suggestion: `Đổi “${pairRaw}” thành “${fixedPair}”.`,
        fixSteps: [
          `Nhận diện chủ ngữ “${token.raw}”.`,
          `Đổi “is” thành “are” → “${fixedPair}”.`,
        ],
        wrongText: pairRaw,
        suggestedFix: fixedPair,
        locationLabel: loc,
        excerpt,
        range: pairRange,
        allRanges: [pairRange],
      });
    } else if (
      token.normalized === 'i' &&
      (next.normalized === 'is' || next.normalized === 'are')
    ) {
      const fixedPair = `I am`;
      issues.push({
        id: `en-sva-i-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Chia sai động từ to-be với “I”: “${pairRaw}”`,
        reason: `Chủ ngữ “I” ở thì hiện tại đơn đi với “am”.`,
        suggestion: `Đổi “${pairRaw}” thành “I am”.`,
        fixSteps: [
          `Đổi “${next.raw}” thành “am” để hòa hợp với chủ ngữ “I”.`,
        ],
        wrongText: pairRaw,
        suggestedFix: fixedPair,
        locationLabel: loc,
        excerpt,
        range: pairRange,
        allRanges: [pairRange],
      });
    }

    // 6. Modal + "to" (e.g. "can to", "should to", "must to")
    if (MODALS.has(token.normalized) && next.normalized === 'to') {
      issues.push({
        id: `en-modal-to-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Thừa giới từ “to” sau động từ khuyết thiếu “${token.raw}”`,
        reason: `Sau động từ khuyết thiếu (${token.raw}) dùng trực tiếp động từ nguyên mẫu không có “to”.`,
        suggestion: `Bỏ từ “to”, sửa “${pairRaw}” thành “${token.raw}”.`,
        fixSteps: [
          `Áp dụng cấu trúc: ${token.normalized} + V (nguyên mẫu).`,
          `Xóa “to” sau “${token.raw}”.`,
        ],
        wrongText: pairRaw,
        suggestedFix: token.raw,
        locationLabel: loc,
        excerpt,
        range: pairRange,
        allRanges: [pairRange],
      });
    }

    // 7. Double comparative (e.g. "more better", "more easier")
    if (token.normalized === 'more' && DOUBLE_COMPARATIVE_WORDS.has(next.normalized)) {
      const fixed = matchCase(token.raw, next.normalized);
      issues.push({
        id: `en-double-comp-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Lặp dạng so sánh hơn “${pairRaw}”`,
        reason: `Từ “${next.raw}” đã ở dạng so sánh hơn rồi nên không thêm “more” phía trước.`,
        suggestion: `Bỏ “more”, chỉ dùng “${fixed}”.`,
        fixSteps: [
          `Xóa “${token.raw}” phía trước “${next.raw}”.`,
        ],
        wrongText: pairRaw,
        suggestedFix: fixed,
        locationLabel: loc,
        excerpt,
        range: pairRange,
        allRanges: [pairRange],
      });
    }

    // 7b. Subject–verb agreement after he / she / it (e.g. "she go" → "she goes", "it have" → "it has")
    if (/^(he|she|it)$/.test(token.normalized) && THIRD_PERSON_FIX[next.normalized]) {
      const prev = i > 0 && words[i - 1].sentenceIndex === token.sentenceIndex ? words[i - 1].normalized : '';
      // skip questions / inversions like "does it have", "can she go"
      if (!/^(do|does|did|can|could|will|would|should|must|may|might|to|let|make|made|help|helps)$/.test(prev)) {
        const fixedVerb = THIRD_PERSON_FIX[next.normalized];
        const fixedPair = `${token.raw} ${fixedVerb}`;
        issues.push({
          id: `en-sva-${token.start}`,
          category: 'grammar',
          severity: 'error',
          title: `Chia động từ chưa đúng: “${pairRaw}”`,
          reason: `Chủ ngữ ngôi thứ ba số ít (${token.raw}) ở thì hiện tại đơn thì động từ phải thêm -s/-es (hoặc dùng is/has/does).`,
          suggestion: `Sửa thành “${fixedPair}”.`,
          fixSteps: [
            `Xác định chủ ngữ “${token.raw}” là ngôi thứ ba số ít.`,
            `Đổi động từ “${next.raw}” thành “${fixedVerb}”.`,
          ],
          wrongText: pairRaw,
          suggestedFix: fixedPair,
          locationLabel: loc,
          excerpt,
          range: pairRange,
          allRanges: [pairRange],
        });
      }
    }

    // 8. "much" + plural countable noun (e.g. "much students", "much people")
    if (token.normalized === 'much' && PLURAL_COUNTABLE_AFTER_MUCH.has(next.normalized)) {
      const fixedQuant = matchCase(token.raw, 'many');
      const fixedPair = `${fixedQuant} ${next.raw}`;
      issues.push({
        id: `en-much-many-${token.start}`,
        category: 'grammar',
        severity: 'error',
        title: `Dùng “much” với danh từ đếm được số nhiều “${next.raw}”`,
        reason: `“Much” chỉ dùng với danh từ không đếm được; với “${next.raw}” cần dùng “many”.`,
        suggestion: `Đổi “${pairRaw}” thành “${fixedPair}”.`,
        fixSteps: [
          `Kiểm tra danh từ “${next.raw}” (đếm được, số nhiều).`,
          `Thay “${token.raw}” bằng “${fixedQuant}” → “${fixedPair}”.`,
        ],
        wrongText: pairRaw,
        suggestedFix: fixedPair,
        locationLabel: loc,
        excerpt,
        range: pairRange,
        allRanges: [pairRange],
      });
    }
  }

  return issues;
}

function detectPunctuationSpacingIssues(
  text: string,
  sentences: SentenceSegment[]
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const s of sentences) {
    const loc = `Đoạn ${s.paragraphIndex}, Câu ${s.sentenceInParagraph}`;
    const excerpt = makeExcerpt(s.text);

    // Extra space before punctuation: e.g. "học sinh ." or "students ,"
    const spaceBeforeRegex = /(\S)([ \t]+)([,.;!?])(?!\.)/g;
    let match: RegExpExecArray | null;
    while ((match = spaceBeforeRegex.exec(s.text)) !== null) {
      const absStart = s.start + match.index;
      const absEnd = absStart + match[0].length;
      const wrong = match[0];
      const fixed = `${match[1]}${match[3]}`;
      issues.push({
        id: `space-before-${absStart}`,
        category: 'spacing',
        severity: 'error',
        title: `Thừa khoảng trắng trước dấu “${match[3]}”`,
        reason: `Dấu câu cần viết sát ngay sau chữ đứng trước, không để khoảng trắng ở giữa.`,
        suggestion: `Xóa khoảng trắng trước dấu “${match[3]}”.`,
        fixSteps: [
          `Xóa dấu cách thừa giữa “${match[1]}” và “${match[3]}”.`,
        ],
        wrongText: wrong,
        suggestedFix: fixed,
        locationLabel: loc,
        excerpt,
        range: { start: absStart, end: absEnd },
        allRanges: [{ start: absStart, end: absEnd }],
      });
    }

    // Missing space after comma/semicolon/colon/sentence punctuation before a letter
    // Ignore decimals (8.5), common abbreviations (e.g., i.e., v.v.), and URLs/emails
    const missingSpaceRegex = /([\p{L}])([,;:.!?])([\p{L}])/gu;
    while ((match = missingSpaceRegex.exec(s.text)) !== null) {
      const punct = match[2];
      const snippetAround = s.text.slice(
        Math.max(0, match.index - 4),
        Math.min(s.text.length, match.index + 8)
      );
      if (
        punct === '.' &&
        (/(?:e\.g|i\.e|v\.v|U\.S|U\.K)/i.test(snippetAround) ||
          /\.(?:com|vn|org|edu|net)\b/i.test(snippetAround))
      ) {
        continue;
      }

      const absStart = s.start + match.index;
      const absEnd = absStart + match[0].length;
      const wrong = match[0];
      const fixed = `${match[1]}${punct} ${match[3]}`;
      issues.push({
        id: `space-after-${absStart}`,
        category: 'spacing',
        severity: 'error',
        title: `Thiếu khoảng trắng sau dấu “${punct}”`,
        reason: `Chữ cái đứng sau dấu “${punct}” bị viết dính liền.`,
        suggestion: `Thêm một khoảng trắng sau dấu “${punct}” → “${fixed}”.`,
        fixSteps: [
          `Đặt con trỏ ngay sau dấu “${punct}” trong cụm “${wrong}”.`,
          `Nhấn phím Cách (Space) một lần để tách chữ rõ ràng.`,
        ],
        wrongText: wrong,
        suggestedFix: fixed,
        locationLabel: loc,
        excerpt,
        range: { start: absStart, end: absEnd },
        allRanges: [{ start: absStart, end: absEnd }],
      });
    }
  }

  void text;
  return issues;
}

function detectRepeatedPhrases(
  words: WordToken[],
  minCount: number,
  targetKeywords: Set<string>,
  stopwords: Set<string>
): { issues: AnalysisIssue[]; coveredWords: Set<string> } {
  const issues: AnalysisIssue[] = [];
  const coveredWords = new Set<string>();

  const flaggedPhrases: Array<{
    phrase: string;
    display: string;
    ranges: TextRange[];
    paragraphs: number[];
    size: number;
  }> = [];

  for (const n of [3, 2]) {
    const map = new Map<
      string,
      { display: string; ranges: TextRange[]; paragraphs: Set<number> }
    >();

    for (let i = 0; i <= words.length - n; i += 1) {
      const slice = words.slice(i, i + n);
      if (slice[0].sentenceIndex !== slice[n - 1].sentenceIndex) continue;

      const norms = slice.map((w) => w.normalized);
      const hasMeaningfulWord = norms.some(
        (w) => w.length >= 2 && !stopwords.has(w) && !/^\d+$/.test(w)
      );
      if (!hasMeaningfulWord) continue;

      if (n === 2 && (stopwords.has(norms[0]) || stopwords.has(norms[1]))) {
        continue;
      }

      const key = norms.join(' ');
      if (targetKeywords.has(key)) continue;

      const existing = map.get(key);
      const candidateRange: TextRange = {
        start: slice[0].start,
        end: slice[n - 1].end,
      };

      if (!existing) {
        map.set(key, {
          display: slice.map((w) => w.raw.toLowerCase()).join(' '),
          ranges: [candidateRange],
          paragraphs: new Set([slice[0].paragraphIndex]),
        });
      } else {
        const last = existing.ranges[existing.ranges.length - 1];
        if (candidateRange.start >= last.end) {
          existing.ranges.push(candidateRange);
          existing.paragraphs.add(slice[0].paragraphIndex);
        }
      }
    }

    for (const [key, data] of map.entries()) {
      if (data.ranges.length < minCount) continue;

      if (
        n === 2 &&
        flaggedPhrases.some(
          (fp) =>
            fp.size === 3 &&
            fp.phrase.includes(key) &&
            fp.ranges.length >= data.ranges.length - 1
        )
      ) {
        continue;
      }

      flaggedPhrases.push({
        phrase: key,
        display: data.display,
        ranges: data.ranges,
        paragraphs: Array.from(data.paragraphs).sort((a, b) => a - b),
        size: n,
      });

      for (const token of key.split(' ')) {
        coveredWords.add(token);
      }
    }
  }

  flaggedPhrases
    .sort((a, b) => b.ranges.length - a.ranges.length)
    .slice(0, 6)
    .forEach((item, idx) => {
      const paraText =
        item.paragraphs.length === 1
          ? `Đoạn ${item.paragraphs[0]}`
          : `Đoạn ${item.paragraphs.join(', ')}`;

      issues.push({
        id: `phrase-repeat-${idx}-${item.phrase}`,
        category: 'repetition',
        severity: 'warning',
        title: `Cụm từ “${item.display}” lặp lại ${item.ranges.length} lần`,
        reason: `Lặp cùng một cụm từ nhiều lần khiến diễn đạt kém linh hoạt.`,
        suggestion: `Thay thế ở một vài vị trí bằng từ đồng nghĩa hoặc đại từ chỉ định.`,
        fixSteps: [
          `Bấm “Tới chỗ sửa” nhiều lần để xem từng vị trí xuất hiện cụm “${item.display}”.`,
          `Giữ lại ở câu chủ đề, còn các câu sau thay bằng từ đồng nghĩa hoặc cách diễn đạt ngắn hơn.`,
        ],
        locationLabel: paraText,
        excerpt: item.display,
        range: item.ranges[0],
        allRanges: item.ranges,
        count: item.ranges.length,
      });
    });

  return { issues, coveredWords };
}

function detectRepeatedWords(
  words: WordToken[],
  minCount: number,
  targetKeywords: Set<string>,
  coveredByPhrases: Set<string>,
  stopwords: Set<string>
): AnalysisIssue[] {
  const counts = new Map<
    string,
    { display: string; ranges: TextRange[]; paragraphs: Set<number> }
  >();

  for (const token of words) {
    if (
      token.normalized.length < 2 ||
      stopwords.has(token.normalized) ||
      /^\d+$/.test(token.normalized) ||
      targetKeywords.has(token.normalized) ||
      coveredByPhrases.has(token.normalized)
    ) {
      continue;
    }

    const entry = counts.get(token.normalized);
    if (!entry) {
      counts.set(token.normalized, {
        display: token.raw.toLowerCase(),
        ranges: [{ start: token.start, end: token.end }],
        paragraphs: new Set([token.paragraphIndex]),
      });
    } else {
      entry.ranges.push({ start: token.start, end: token.end });
      entry.paragraphs.add(token.paragraphIndex);
    }
  }

  return Array.from(counts.entries())
    .filter(([, data]) => data.ranges.length >= minCount)
    .sort((a, b) => b[1].ranges.length - a[1].ranges.length)
    .slice(0, 6)
    .map(([key, data], idx) => {
      const paras = Array.from(data.paragraphs).sort((a, b) => a - b);
      const paraText =
        paras.length === 1 ? `Đoạn ${paras[0]}` : `Đoạn ${paras.join(', ')}`;

      return {
        id: `word-repeat-${idx}-${key}`,
        category: 'repetition',
        severity: 'warning',
        title: `Từ “${data.display}” xuất hiện ${data.ranges.length} lần`,
        reason: `Từ này lặp lại khá dày trong bài viết.`,
        suggestion: `Đa dạng hóa từ vựng bằng từ đồng nghĩa hoặc gộp các ý tương đồng.`,
        fixSteps: [
          `Xem lại các câu chứa từ “${data.display}” ở ${paraText}.`,
          `Thay 1–2 chỗ bằng từ đồng nghĩa hoặc đổi cấu trúc câu.`,
        ],
        locationLabel: paraText,
        excerpt: data.display,
        range: data.ranges[0],
        allRanges: data.ranges,
        count: data.ranges.length,
      };
    });
}

function detectSentenceIssues(
  text: string,
  sentences: SentenceSegment[],
  maxSentenceWords: number
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const s of sentences) {
    const loc = `Đoạn ${s.paragraphIndex}, Câu ${s.sentenceInParagraph}`;

    if (s.wordCount > maxSentenceWords) {
      issues.push({
        id: `long-sentence-${s.globalIndex}`,
        category: 'long_sentence',
        severity: 'warning',
        title: `Câu dài ${s.wordCount} từ (nên dưới ${maxSentenceWords} từ)`,
        reason: `Câu quá dài dễ làm người đọc hụt hơi và khó nắm bắt ý chính.`,
        suggestion: `Tách thành 2 câu ngắn mạch lạc hơn.`,
        fixSteps: [
          `Tìm chỗ nối ý ở giữa câu (như “và”, “nhưng”, “vì”, “nên” hoặc “and”, “but”, “because”, “which”).`,
          `Ngắt bằng dấu chấm (.) rồi viết hoa đầu câu mới, lược bớt từ đệm thừa.`,
        ],
        locationLabel: loc,
        excerpt: makeExcerpt(s.text),
        range: { start: s.start, end: s.end },
        allRanges: [{ start: s.start, end: s.end }],
        count: s.wordCount,
      });
    }

    if (!s.startsWithCapital && s.firstLetterRange) {
      const wrongChar = text.slice(s.firstLetterRange.start, s.firstLetterRange.end);
      const upperChar = wrongChar.normalize('NFC').toUpperCase();
      issues.push({
        id: `capital-${s.globalIndex}`,
        category: 'capitalization',
        severity: 'error',
        title: `Chưa viết hoa đầu câu`,
        reason: `Chữ cái đầu tiên của câu (“${wrongChar}”) đang viết thường.`,
        suggestion: `Viết hoa “${wrongChar}” thành “${upperChar}”.`,
        fixSteps: [
          `Di chuyển tới chữ “${wrongChar}” ở đầu câu.`,
          `Đổi thành chữ in hoa “${upperChar}”.`,
        ],
        wrongText: wrongChar,
        suggestedFix: upperChar,
        locationLabel: loc,
        excerpt: makeExcerpt(s.text),
        range: s.firstLetterRange,
        allRanges: [s.firstLetterRange],
      });
    }

    const shouldHavePunctuation = s.isOutlineItem ? s.wordCount >= 10 : s.wordCount >= 4;
    if (!s.hasEndingPunctuation && shouldHavePunctuation) {
      const tailLen = Math.min(14, s.text.length);
      const endRange: TextRange = {
        start: s.end - tailLen,
        end: s.end,
      };
      const tailText = text.slice(endRange.start, endRange.end);
      issues.push({
        id: `punct-${s.globalIndex}`,
        category: 'punctuation',
        severity: 'error',
        title: `Thiếu dấu câu kết thúc`,
        reason: `Cuối câu/đoạn chưa có dấu chấm (.), chấm hỏi (?) hoặc chấm than (!).`,
        suggestion: `Thêm dấu chấm (.) hoặc dấu câu phù hợp ở cuối câu.`,
        fixSteps: [
          `Đọc lại sắc thái câu (câu kể dùng “.”, câu hỏi dùng “?”, câu cảm thán dùng “!”).`,
          `Thêm dấu câu sát ngay sau chữ cuối cùng “${tailText.trim()}”.`,
        ],
        wrongText: tailText,
        suggestedFix: `${tailText}.`,
        locationLabel: loc,
        excerpt: makeExcerpt(s.text),
        range: endRange,
        allRanges: [endRange],
      });
    }
  }

  return issues;
}

export function detectIssues(
  text: string,
  words: WordToken[],
  sentences: SentenceSegment[],
  criteria: CriterionInput[],
  language: DetectedLanguage,
  options: ResolvedDetectorOptions
): AnalysisIssue[] {
  if (words.length === 0) return [];

  const stopwords = getStopwords(language);
  const sentencesById = new Map<number, SentenceSegment>(
    sentences.map((s) => [s.globalIndex, s])
  );
  const targetKeywords = buildTargetKeywordSet(criteria);

  const englishGrammarIssues =
    language === 'en' ? detectEnglishGrammarIssues(words, sentencesById) : [];
  const spacingIssues = detectPunctuationSpacingIssues(text, sentences);
  const adjacentIssues = detectAdjacentDuplicates(words, language, sentencesById);
  const sentenceIssues = detectSentenceIssues(text, sentences, options.maxSentenceWords);
  const { issues: phraseIssues, coveredWords } = detectRepeatedPhrases(
    words,
    options.minPhraseRepeatCount,
    targetKeywords,
    stopwords
  );
  const wordIssues = detectRepeatedWords(
    words,
    options.minWordRepeatCount,
    targetKeywords,
    coveredWords,
    stopwords
  );

  // A lowercase "i" at the start of a sentence is already reported as a grammar error: drop the
  // duplicate "chưa viết hoa đầu câu" for the same spot.
  const grammarStarts = new Set(englishGrammarIssues.map((i) => i.range.start));
  const sentenceErrors = sentenceIssues.filter(
    (i) => i.severity === 'error' && !(i.category === 'capitalization' && grammarStarts.has(i.range.start))
  );
  const transitionIssues = detectTransitionCommas(sentences, language);

  return [
    ...englishGrammarIssues,
    ...sentenceErrors,
    ...transitionIssues,
    ...spacingIssues,
    ...adjacentIssues,
    ...sentenceIssues.filter((i) => i.severity === 'warning'),
    ...phraseIssues,
    ...wordIssues,
  ];
}
