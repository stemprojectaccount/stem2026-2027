import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookCheck,
  Briefcase,
  CheckCircle2,
  CircleDashed,
  GraduationCap,
  MessageCircle,
  Repeat2,
  Ruler,
  Space,
  SpellCheck,
  Wand2,
} from 'lucide-react';
import type {
  AnalysisIssue,
  CriterionMatchResult,
  DetectedLanguage,
  EssayAnalysisResult,
  IssueCategory,
  TextRange,
  ToneStyle,
} from '../analyzer';
import { formatReadingTime } from '../analyzer';

type AnalysisTab = 'all' | 'metrics' | 'tone' | 'criteria' | 'suggestions';

interface AnalysisPanelProps {
  analysis: EssayAnalysisResult;
  onHighlightRange: (range: TextRange, label?: string) => void;
  onApplyFix: (issue: AnalysisIssue) => void;
  onLoadSample: (lang: DetectedLanguage) => void;
}

function getToneMeta(style: ToneStyle): {
  Icon: typeof GraduationCap;
  toneClass: string;
  bgClass: string;
} {
  switch (style) {
    case 'academic':
      return {
        Icon: GraduationCap,
        toneClass: 'text-accent',
        bgClass: 'bg-accent-soft',
      };
    case 'formal':
      return {
        Icon: Briefcase,
        toneClass: 'text-ok',
        bgClass: 'bg-ok-soft',
      };
    case 'casual':
      return {
        Icon: MessageCircle,
        toneClass: 'text-warn',
        bgClass: 'bg-warn-soft',
      };
    case 'neutral':
      return {
        Icon: CircleDashed,
        toneClass: 'text-ink-muted',
        bgClass: 'bg-surface-subtle',
      };
  }
}

function getIssueMeta(category: IssueCategory): {
  label: string;
  Icon: typeof AlertCircle;
  toneClass: string;
} {
  switch (category) {
    case 'grammar':
      return {
        label: 'Ngữ pháp và chính tả',
        Icon: BookCheck,
        toneClass: 'text-alert',
      };
    case 'capitalization':
      return {
        label: 'Viết hoa đầu câu',
        Icon: SpellCheck,
        toneClass: 'text-alert',
      };
    case 'punctuation':
      return {
        label: 'Dấu câu kết thúc',
        Icon: AlertCircle,
        toneClass: 'text-alert',
      };
    case 'spacing':
      return {
        label: 'Khoảng cách dấu câu',
        Icon: Space,
        toneClass: 'text-alert',
      };
    case 'long_sentence':
      return {
        label: 'Câu quá dài',
        Icon: Ruler,
        toneClass: 'text-warn',
      };
    case 'repetition':
      return {
        label: 'Lặp từ / cụm từ',
        Icon: Repeat2,
        toneClass: 'text-warn',
      };
  }
}

export function AnalysisPanel({
  analysis,
  onHighlightRange,
  onApplyFix,
  onLoadSample,
}: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('all');
  const [cycleCursor, setCycleCursor] = useState<Record<string, number>>({});

  const { detectedLanguage, metrics, tone, criteria, issues, summary } = analysis;
  const isEmptyEssay = metrics.wordCount === 0;
  const langLabel = detectedLanguage === 'en' ? 'Tiếng Anh' : 'Tiếng Việt';

  const missingCriteria = criteria.filter((c) => c.status === 'missing');
  const coveredCriteria = criteria.filter((c) => c.status !== 'missing');

  const handleCycleJump = (key: string, ranges: TextRange[], label: string) => {
    if (ranges.length === 0) return;
    const currentIndex = cycleCursor[key] ?? 0;
    const targetRange = ranges[currentIndex % ranges.length];
    onHighlightRange(targetRange, label);
    setCycleCursor((prev) => ({
      ...prev,
      [key]: (currentIndex + 1) % ranges.length,
    }));
  };

  const tabs: Array<{ id: AnalysisTab; label: string }> = [
    { id: 'all', label: 'Tất cả' },
    { id: 'metrics', label: 'Số liệu' },
    { id: 'tone', label: 'Văn phong' },
    {
      id: 'criteria',
      label:
        summary.totalCriteriaCount > 0
          ? `Từ khóa (${summary.matchedCriteriaCount}/${summary.totalCriteriaCount})`
          : 'Từ khóa',
    },
    {
      id: 'suggestions',
      label:
        summary.totalIssueCount > 0
          ? `Lỗi (${summary.totalIssueCount})`
          : 'Lỗi và sửa',
    },
  ];

  const showMetrics = activeTab === 'all' || activeTab === 'metrics';
  const showTone = activeTab === 'all' || activeTab === 'tone';
  const showCriteria = activeTab === 'all' || activeTab === 'criteria';
  const showSuggestions = activeTab === 'all' || activeTab === 'suggestions';
  const toneMeta = getToneMeta(tone.style);
  const ToneIcon = toneMeta.Icon;

  const renderCriterionRow = (item: CriterionMatchResult) => {
    const isMissing = item.status === 'missing';
    const isExact = item.status === 'matched';
    const canJump = item.ranges.length > 0;

    return (
      <li
        key={item.id}
        className="py-2.5 flex items-start justify-between gap-3"
      >
        <div className="min-w-0 flex items-start gap-2.5">
          {isMissing ? (
            <CircleDashed
              className="w-4 h-4 mt-0.5 text-alert shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="w-4 h-4 mt-0.5 text-ok shrink-0"
              aria-hidden="true"
            />
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-ink break-words">{item.text}</p>
            <p className="text-xs text-ink-secondary mt-0.5 tabular-nums">
              {isExact && (
                <span className="text-ok font-medium">
                  Đã dùng · {item.exactCount} lần
                </span>
              )}
              {item.status === 'idea_covered' && (
                <span className="text-ok font-medium">
                  Đã đề cập ý chính · khớp {item.matchedTerms.length}/
                  {item.matchedTerms.length + item.missingTerms.length} từ khóa chính
                </span>
              )}
              {isMissing && (
                <span className="text-alert font-medium">
                  Còn thiếu
                  {item.matchedTerms.length > 0
                    ? ` · mới có: ${item.matchedTerms.join(', ')}`
                    : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {canJump && (
          <button
            type="button"
            onClick={() =>
              handleCycleJump(`crit-${item.id}`, item.ranges, `Đã chọn “${item.text}”`)
            }
            aria-label={`Xem vị trí của "${item.text}" trong bài viết`}
            className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium text-accent hover:bg-accent-soft transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Xem vị trí</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        )}
      </li>
    );
  };

  const renderIssueRow = (issue: AnalysisIssue) => {
    const { label, Icon, toneClass } = getIssueMeta(issue.category);
    const hasQuickFix = Boolean(issue.wrongText && issue.suggestedFix);

    return (
      <li key={issue.id} className="py-4">
        {/* Category & Location line */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className={`inline-flex items-center gap-1 font-semibold ${toneClass}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {label}
            </span>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span className="text-ink-muted">{issue.locationLabel}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              handleCycleJump(
                `issue-${issue.id}`,
                issue.allRanges,
                `Đã di chuyển tới ${issue.locationLabel}`
              )
            }
            aria-label={`Đi tới vị trí ${issue.locationLabel}: ${issue.title}`}
            className="inline-flex items-center gap-1 min-h-[32px] px-2 py-1 rounded-md text-xs font-semibold text-accent hover:bg-accent-soft transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Tới chỗ sửa</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>

        {/* Mistake title & why it's wrong */}
        <p className="text-sm font-semibold text-ink">{issue.title}</p>
        <p className="text-sm text-ink-secondary mt-0.5">{issue.reason}</p>

        {/* Explicit Wrong -> Suggested Fix comparison box when deterministic */}
        {hasQuickFix && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-surface-subtle/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
              <span className="text-xs font-medium text-ink-muted">Sửa:</span>
              <span className="font-mono text-alert line-through break-all">
                {issue.wrongText}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
              <span className="font-mono font-semibold text-ok break-all">
                {issue.suggestedFix}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onApplyFix(issue)}
              aria-label={`Áp dụng sửa "${issue.wrongText}" thành "${issue.suggestedFix}"`}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Áp dụng sửa</span>
            </button>
          </div>
        )}

        {/* Step-by-step fix guidance */}
        {issue.fixSteps.length > 0 && (
          <div className="mt-2.5">
            <p className="text-xs font-semibold text-ink mb-1">Hướng dẫn cách sửa:</p>
            <ol className="space-y-1 text-xs sm:text-sm text-ink-secondary list-decimal list-inside">
              {issue.fixSteps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {issue.excerpt && (
          <p className="mt-2 text-xs text-ink-muted italic break-words">
            Trích: “{issue.excerpt}”
          </p>
        )}
      </li>
    );
  };

  return (
    <aside
      id="analysis-section"
      aria-labelledby="analysis-heading"
      className="scroll-mt-20 bg-surface border border-line rounded-xl overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6.25rem)] lg:flex lg:flex-col"
    >
      {/* Header + Segmented Filter Tabs */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line shrink-0">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <h2 id="analysis-heading" className="text-base sm:text-lg font-semibold text-ink">
            Kết quả kiểm tra &amp; hướng dẫn sửa
          </h2>
          {!isEmptyEssay && (
            <span className="text-xs text-ink-muted tabular-nums whitespace-nowrap">
              {langLabel} ·{' '}
              {summary.totalIssueCount === 0
                ? 'Không thấy lỗi'
                : `${summary.totalIssueCount} lỗi/gợi ý`}
            </span>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Lọc mục kết quả phân tích"
          className="flex items-center gap-1 p-1 bg-surface-subtle rounded-lg overflow-x-auto"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-h-[36px] px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selected
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Analysis Content Body */}
      <div className="divide-y divide-line lg:overflow-y-auto">
        {/* Section 1: Số liệu bài viết */}
        {showMetrics && (
          <section aria-labelledby="section-metrics-title" className="px-5 sm:px-6 py-4 sm:py-5">
            <h3 id="section-metrics-title" className="text-sm font-semibold text-ink mb-3">
              1. Số liệu bài viết
            </h3>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-ink-muted">Số từ</dt>
                <dd className="text-xl font-semibold font-mono text-ink tabular-nums mt-0.5">
                  {metrics.wordCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Số câu</dt>
                <dd className="text-xl font-semibold font-mono text-ink tabular-nums mt-0.5">
                  {metrics.sentenceCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Số đoạn</dt>
                <dd className="text-xl font-semibold font-mono text-ink tabular-nums mt-0.5">
                  {metrics.paragraphCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Đọc ước tính</dt>
                <dd className="text-base font-semibold text-ink mt-1 whitespace-nowrap">
                  {formatReadingTime(metrics.readingTimeSeconds)}
                </dd>
              </div>
            </dl>

            {metrics.sentenceCount > 0 ? (
              <p className="mt-3 pt-3 border-t border-line text-xs text-ink-secondary tabular-nums">
                Trung bình{' '}
                <strong className="font-semibold text-ink">
                  {metrics.averageWordsPerSentence.toLocaleString('vi-VN')} từ/câu
                </strong>
                {metrics.longestSentenceParagraph !== null && (
                  <>
                    {' '}
                    · Câu dài nhất:{' '}
                    <strong className="font-semibold text-ink">
                      {metrics.longestSentenceWords} từ
                    </strong>{' '}
                    (Đoạn {metrics.longestSentenceParagraph})
                  </>
                )}
              </p>
            ) : (
              <p className="mt-3 pt-3 border-t border-line text-xs text-ink-muted">
                Số liệu cập nhật ngay khi bạn nhập nội dung vào khung soạn thảo.
              </p>
            )}
          </section>
        )}

        {/* Section 2: Văn phong bài viết (Tone Detector) */}
        {showTone && (
          <section
            aria-labelledby="section-tone-title"
            data-testid="tone-section"
            className="px-5 sm:px-6 py-4 sm:py-5"
          >
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 id="section-tone-title" className="text-sm font-semibold text-ink">
                2. Văn phong bài viết
              </h3>
              {tone.style !== 'neutral' && (
                <span className="text-xs text-ink-muted whitespace-nowrap">
                  {langLabel}
                </span>
              )}
            </div>

            <div className={`p-3.5 rounded-lg ${toneMeta.bgClass}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${toneMeta.toneClass}`}>
                <ToneIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span data-testid="tone-label">{tone.label}</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1.5 leading-relaxed">
                {tone.summary}
              </p>
            </div>

            {tone.signals.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-ink mb-1">Dấu hiệu nhận diện:</p>
                <ul className="space-y-1 text-xs sm:text-sm text-ink-secondary list-disc list-inside">
                  {tone.signals.map((signal, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tone.feedback.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line">
                <p className="text-xs font-semibold text-ink mb-1">Gợi ý điều chỉnh văn phong:</p>
                <ul className="space-y-1 text-xs sm:text-sm text-ink-secondary list-disc list-inside">
                  {tone.feedback.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Section 3: Từ khóa đã dùng / còn thiếu */}
        {showCriteria && (
          <section aria-labelledby="section-criteria-title" className="px-5 sm:px-6 py-4 sm:py-5">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 id="section-criteria-title" className="text-sm font-semibold text-ink">
                3. Từ khóa đã dùng / còn thiếu
              </h3>
              {summary.totalCriteriaCount > 0 && (
                <span className="text-xs font-medium text-ink-secondary tabular-nums">
                  Đã nhắc {summary.matchedCriteriaCount}/{summary.totalCriteriaCount}
                </span>
              )}
            </div>

            {criteria.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Bạn chưa thêm từ khóa hoặc ý chính mục tiêu. Hãy thêm ở khung “Từ khóa mục tiêu &amp; ý chính cần có” bên trái để đối chiếu.
              </p>
            ) : (
              <div>
                <div
                  className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden mb-3.5"
                  role="progressbar"
                  aria-valuenow={summary.matchedCriteriaCount}
                  aria-valuemin={0}
                  aria-valuemax={summary.totalCriteriaCount}
                  aria-label="Tiến độ hoàn thành từ khóa mục tiêu"
                >
                  <div
                    className="h-full bg-accent transition-transform duration-200 origin-left"
                    style={{
                      transform: `scaleX(${
                        summary.totalCriteriaCount > 0
                          ? summary.matchedCriteriaCount / summary.totalCriteriaCount
                          : 0
                      })`,
                    }}
                  />
                </div>

                {missingCriteria.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-alert mb-1">
                      Còn thiếu ({missingCriteria.length})
                    </p>
                    <ul className="divide-y divide-line">
                      {missingCriteria.map(renderCriterionRow)}
                    </ul>
                  </div>
                )}

                {coveredCriteria.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ok mb-1">
                      Đã dùng trong bài ({coveredCriteria.length})
                    </p>
                    <ul className="divide-y divide-line">
                      {coveredCriteria.map(renderCriterionRow)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Section 4: Lỗi sai & hướng dẫn cách sửa */}
        {showSuggestions && (
          <section aria-labelledby="section-suggestions-title" className="px-5 sm:px-6 py-4 sm:py-5">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 id="section-suggestions-title" className="text-sm font-semibold text-ink">
                4. Lỗi sai &amp; hướng dẫn cách sửa
              </h3>
              {!isEmptyEssay && summary.totalIssueCount > 0 && (
                <span className="text-xs text-ink-muted tabular-nums">
                  {summary.totalIssueCount} mục
                </span>
              )}
            </div>

            {isEmptyEssay ? (
              <div className="space-y-2.5">
                <p className="text-sm text-ink-secondary">
                  Công cụ tự động kiểm tra Tiếng Việt và Tiếng Anh (ngữ pháp cơ bản, chính tả, viết hoa, dấu câu, khoảng cách, câu dài, lặp từ) rồi hướng dẫn từng bước sửa.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <button
                    type="button"
                    onClick={() => onLoadSample('vi')}
                    className="font-medium text-accent hover:text-accent-hover underline underline-offset-4 cursor-pointer"
                  >
                    Thử bài mẫu Tiếng Việt
                  </button>
                  <span aria-hidden="true" className="text-line-strong">·</span>
                  <button
                    type="button"
                    onClick={() => onLoadSample('en')}
                    className="font-medium text-accent hover:text-accent-hover underline underline-offset-4 cursor-pointer"
                  >
                    Thử bài mẫu Tiếng Anh
                  </button>
                </div>
              </div>
            ) : issues.length === 0 ? (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-ok-soft text-ok">
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">
                    Chưa phát hiện lỗi ngữ pháp, dấu câu, lặp từ hay câu quá dài ({langLabel}).
                  </p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Bạn hãy đọc thầm lại mạch ý và đối chiếu đủ từ khóa mục tiêu rồi xuất file Word để nộp nhé.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Compact unboxed category summary */}
                <p className="text-xs text-ink-secondary mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
                  <AlertTriangle className="w-3.5 h-3.5 text-warn shrink-0" aria-hidden="true" />
                  {summary.grammarCount > 0 && (
                    <>
                      <span>{summary.grammarCount} ngữ pháp/chính tả</span>
                      <span aria-hidden="true" className="text-line-strong">·</span>
                    </>
                  )}
                  <span>{summary.mechanicsCount} viết hoa/dấu câu</span>
                  <span aria-hidden="true" className="text-line-strong">·</span>
                  <span>{summary.longSentenceCount} câu dài</span>
                  <span aria-hidden="true" className="text-line-strong">·</span>
                  <span>{summary.repetitionCount} lặp từ</span>
                </p>

                <ul className="divide-y divide-line" aria-label="Danh sách lỗi sai và hướng dẫn cách sửa">
                  {issues.map(renderIssueRow)}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
