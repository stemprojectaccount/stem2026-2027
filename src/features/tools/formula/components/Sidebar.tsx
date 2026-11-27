import { ALL_FILTER_VALUE, type SubjectSummary } from '../core';

interface SidebarProps {
  totalCount: number;
  subjectSummaries: SubjectSummary[];
  availableTopics: { topic: string; count: number }[];
  selectedSubject: string;
  selectedTopic: string;
  onSelectSubject: (subject: string) => void;
  onSelectTopic: (topic: string) => void;
}

export function Sidebar({
  totalCount,
  subjectSummaries,
  availableTopics,
  selectedSubject,
  selectedTopic,
  onSelectSubject,
  onSelectTopic,
}: SidebarProps) {
  return (
    <aside aria-label="Bộ lọc môn học và chủ đề" className="w-full lg:w-64 lg:shrink-0">
      {/* Mobile compact selects */}
      <div className="grid grid-cols-2 gap-2.5 lg:hidden">
        <div>
          <label
            htmlFor="mobile-subject-select"
            className="mb-1 block text-sm font-medium text-ink-secondary"
          >
            Môn học
          </label>
          <select
            id="mobile-subject-select"
            value={selectedSubject}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
          >
            <option value={ALL_FILTER_VALUE}>Tất cả môn ({totalCount})</option>
            {subjectSummaries.map((item) => (
              <option key={item.subject} value={item.subject}>
                {item.subject} ({item.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="mobile-topic-select"
            className="mb-1 block text-sm font-medium text-ink-secondary"
          >
            Chủ đề
          </label>
          <select
            id="mobile-topic-select"
            value={selectedTopic}
            onChange={(e) => onSelectTopic(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
          >
            <option value={ALL_FILTER_VALUE}>Tất cả chủ đề</option>
            {availableTopics.map((item) => (
              <option key={item.topic} value={item.topic}>
                {item.topic} ({item.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop clean side rail */}
      <div className="hidden lg:block lg:sticky lg:top-24 space-y-6">
        <section>
          <h2 className="mb-2.5 px-2 text-sm font-semibold text-ink">Môn học</h2>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onSelectSubject(ALL_FILTER_VALUE)}
                aria-pressed={selectedSubject === ALL_FILTER_VALUE}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedSubject === ALL_FILTER_VALUE
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink'
                }`}
              >
                <span className="truncate">Tất cả môn</span>
                <span className="ml-2 shrink-0 text-sm tabular-nums text-ink-muted">
                  {totalCount}
                </span>
              </button>
            </li>
            {subjectSummaries.map((item) => {
              const isSelected = selectedSubject === item.subject;
              return (
                <li key={item.subject}>
                  <button
                    type="button"
                    onClick={() => onSelectSubject(item.subject)}
                    aria-pressed={isSelected}
                    className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent-soft font-semibold text-accent'
                        : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink'
                    }`}
                  >
                    <span className="truncate">{item.subject}</span>
                    <span className="ml-2 shrink-0 text-sm tabular-nums text-ink-muted">
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="border-t border-border pt-5">
          <h2 className="mb-2.5 px-2 text-sm font-semibold text-ink">Chủ đề</h2>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onSelectTopic(ALL_FILTER_VALUE)}
                aria-pressed={selectedTopic === ALL_FILTER_VALUE}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedTopic === ALL_FILTER_VALUE
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink'
                }`}
              >
                <span className="truncate">Tất cả chủ đề</span>
              </button>
            </li>
            {availableTopics.map((item) => {
              const isSelected = selectedTopic === item.topic;
              return (
                <li key={item.topic}>
                  <button
                    type="button"
                    onClick={() => onSelectTopic(item.topic)}
                    aria-pressed={isSelected}
                    className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent-soft font-semibold text-accent'
                        : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink'
                    }`}
                  >
                    <span className="truncate">{item.topic}</span>
                    <span className="ml-2 shrink-0 text-sm tabular-nums text-ink-muted">
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
