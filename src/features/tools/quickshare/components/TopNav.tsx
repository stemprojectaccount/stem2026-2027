import { Clock, KeyRound, PenSquare } from 'lucide-react';

export type AppView = 'compose' | 'lookup' | 'recent' | 'viewer';

interface TopNavProps {
  activeView: AppView;
  recentCount: number;
  onNavigate: (view: 'compose' | 'lookup' | 'recent') => void;
}

export function TopNav({ activeView, recentCount, onNavigate }: TopNavProps) {
  const navItems: ReadonlyArray<{
    id: 'compose' | 'lookup' | 'recent';
    label: string;
    mobileLabel: string;
    icon: typeof PenSquare;
  }> = [
    { id: 'compose', label: 'Chia sẻ mới', mobileLabel: 'Chia sẻ', icon: PenSquare },
    { id: 'lookup', label: 'Mở bằng mã', mobileLabel: 'Mở mã', icon: KeyRound },
    {
      id: 'recent',
      label: recentCount > 0 ? `Gần đây (${recentCount})` : 'Gần đây',
      mobileLabel: 'Gần đây',
      icon: Clock,
    },
  ];

  const primaryActionTarget: 'compose' | 'lookup' =
    activeView === 'compose' ? 'lookup' : 'compose';
  const primaryActionLabel =
    activeView === 'compose' ? 'Nhập mã nhanh' : 'Chia sẻ mới';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E1E6EF] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-8 px-4 sm:h-[64px] sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('compose')}
            className="inline-flex min-h-[44px] items-center gap-2.5 text-left text-lg font-bold tracking-tight text-[#141923] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#1D4ED8" />
              <rect x="6.5" y="6.5" width="4.5" height="4.5" rx="1" fill="#FFFFFF" />
              <rect x="13" y="6.5" width="4.5" height="4.5" rx="1" fill="#FFFFFF" />
              <rect x="6.5" y="13" width="4.5" height="4.5" rx="1" fill="#FFFFFF" />
              <path
                d="M13.5 15.25H17.5M15.5 13.25V17.25"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span>Chia sẻ nhanh</span>
          </button>

          {/* Zone 2: Clean single-line text navigation links (Desktop) */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-7 md:flex"
          >
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative min-h-[44px] px-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] cursor-pointer ${
                    isActive
                      ? 'text-[#1D4ED8]'
                      : 'text-[#475467] hover:text-[#141923]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 bottom-0 left-0 h-[2px] rounded-full bg-[#1D4ED8]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single contextual primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(primaryActionTarget)}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#E1E6EF] bg-[#F7F8FA] px-4 py-2 text-sm font-medium text-[#141923] transition-colors hover:border-[#C9D2E1] hover:bg-[#EEF1F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (56px height, keeping total sticky <= 14% of 844px viewport) */}
      <nav
        aria-label="Thanh chuyển nhanh trên điện thoại"
        className="border-b border-[#E1E6EF] bg-white md:hidden"
      >
        <div className="grid h-[56px] grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-[#1D4ED8]' : 'text-[#556174]'
                }`}
              >
                <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
