import { Bookmark, BookOpen, FileJson, Plus } from 'lucide-react';

export type ActiveTab = 'all' | 'priority' | 'data';

interface HeaderProps {
  activeTab: ActiveTab;
  priorityCount: number;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenCreate: () => void;
}

export function Header({
  activeTab,
  priorityCount,
  onSelectTab,
  onOpenCreate,
}: HeaderProps) {
  const navItems: { id: ActiveTab; label: string; mobileLabel: string }[] = [
    { id: 'all', label: 'Tất cả công thức', mobileLabel: 'Sổ tay' },
    {
      id: 'priority',
      label: priorityCount > 0 ? `Ưu tiên ôn tập (${priorityCount})` : 'Ưu tiên ôn tập',
      mobileLabel: priorityCount > 0 ? `Ưu tiên (${priorityCount})` : 'Ưu tiên',
    },
    { id: 'data', label: 'Nhập / Xuất JSON', mobileLabel: 'Dữ liệu' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('all')}
            className="text-left text-lg font-bold tracking-tight text-ink whitespace-nowrap shrink-0 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Sổ công thức
          </button>

          {/* Zone 2: Primary navigation links (desktop) */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-7"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 tabular-nums transition-colors ${
                    isActive
                      ? 'text-accent'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Thêm công thức</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation rail */}
      <nav
        aria-label="Điều hướng di động"
        className="grid grid-cols-3 border-b border-border bg-surface md:hidden"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon =
            item.id === 'all'
              ? BookOpen
              : item.id === 'priority'
                ? Bookmark
                : FileJson;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium tabular-nums transition-colors ${
                isActive ? 'text-accent' : 'text-ink-secondary'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-full">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
