import { Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { WorkspaceTab } from '../types/document';

interface SidebarNavProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  historyCount: number;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  shortLabel: string;
  icon: typeof FileText;
}> = [
  {
    id: 'pdf-to-word',
    label: 'Chuyển PDF sang Word',
    shortLabel: 'PDF → Word',
    icon: FileText,
  },
  {
    id: 'image-translate',
    label: 'Dịch chữ từ ảnh',
    shortLabel: 'Dịch ảnh',
    icon: ImageIcon,
  },
  {
    id: 'history',
    label: 'Lịch sử gần đây',
    shortLabel: 'Lịch sử',
    icon: Clock,
  },
];

export function SidebarNav({ activeTab, onSelectTab, historyCount }: SidebarNavProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        aria-label="Điều hướng công cụ"
        className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white"
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            PDF &amp; Dịch ảnh
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === 'history' && historyCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {historyCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-700">Mẹo dán nhanh</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Bấm{' '}
            <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-800">
              Ctrl + V
            </kbd>{' '}
            ở bất cứ đâu để dán ảnh chụp màn hình và dịch chữ ngay lập tức.
          </p>
        </div>
      </aside>
    </>
  );
}

// Phone / tablet: a tab row under the header (the app's own bottom bar already sits at the bottom)
export function MobileTabs({ activeTab, onSelectTab, historyCount }: SidebarNavProps) {
  return (
    <>
      <nav
        aria-label="Điều hướng di động"
        className="flex h-14 items-center justify-around border-b border-slate-200 bg-white px-2 lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[44px] min-w-[84px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-blue-700' : 'text-slate-600'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span>
                {item.shortLabel}
                {item.id === 'history' && historyCount > 0 ? ` (${historyCount})` : ''}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
