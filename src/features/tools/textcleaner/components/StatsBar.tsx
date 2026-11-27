import type { TextStats } from '../lib/textProcessor';

interface StatsBarProps {
  stats: TextStats;
  onInspectLinks: () => void;
}

const numberFormatter = new Intl.NumberFormat('vi-VN');

function formatNum(value: number): string {
  return numberFormatter.format(value);
}

export function StatsBar({ stats, onInspectLinks }: StatsBarProps) {
  return (
    <section
      aria-label="Thống kê văn bản tức thì"
      className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5"
    >
      <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm text-slate-600">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-slate-500">Số từ</dt>
          <dd
            data-testid="stat-words"
            className="font-mono font-medium text-slate-900 tabular-nums"
          >
            {formatNum(stats.words)}
          </dd>
        </div>

        <span aria-hidden="true" className="hidden text-slate-300 sm:inline">
          ·
        </span>

        <div className="flex items-baseline gap-1.5">
          <dt className="text-slate-500">Ký tự</dt>
          <dd className="font-mono font-medium text-slate-900 tabular-nums">
            <span data-testid="stat-chars-with-spaces">{formatNum(stats.charsWithSpaces)}</span>
            <span className="ml-1 font-sans text-xs font-normal text-slate-500">
              (không dấu cách:{' '}
              <span data-testid="stat-chars-without-spaces" className="font-mono tabular-nums text-slate-700">
                {formatNum(stats.charsWithoutSpaces)}
              </span>
              )
            </span>
          </dd>
        </div>

        <span aria-hidden="true" className="hidden text-slate-300 sm:inline">
          ·
        </span>

        <div className="flex items-baseline gap-1.5">
          <dt className="text-slate-500">Số dòng</dt>
          <dd
            data-testid="stat-lines"
            className="font-mono font-medium text-slate-900 tabular-nums"
          >
            {formatNum(stats.lines)}
          </dd>
        </div>

        <span aria-hidden="true" className="hidden text-slate-300 sm:inline">
          ·
        </span>

        <div className="flex items-baseline gap-1.5">
          <dt className="text-slate-500">Link phát hiện</dt>
          <dd className="font-mono font-medium tabular-nums">
            <button
              type="button"
              onClick={onInspectLinks}
              data-testid="stat-links"
              className="text-[#1D4ED8] underline-offset-4 hover:underline"
              aria-label={`Xem ${stats.linksCount} đường link phát hiện được`}
            >
              {formatNum(stats.linksCount)}
            </button>
          </dd>
        </div>
      </dl>
    </section>
  );
}
