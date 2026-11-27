import { FileDown } from 'lucide-react';

interface HeaderProps {
  canExport: boolean;
  isExporting: boolean;
  onExportWord: () => void;
  onJumpToSection: (sectionId: 'editor-section' | 'criteria-section' | 'analysis-section') => void;
}

export function Header({
  canExport,
  isExporting,
  onExportWord,
  onJumpToSection,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur-xs border-b border-line">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onJumpToSection('editor-section')}
          className="text-lg sm:text-xl font-bold tracking-tight text-ink whitespace-nowrap shrink-0 cursor-pointer hover:text-accent transition-colors"
        >
          Rà soát bài viết
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Điều hướng khu vực làm việc"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-secondary"
        >
          <button
            type="button"
            onClick={() => onJumpToSection('editor-section')}
            className="py-1 whitespace-nowrap shrink-0 cursor-pointer hover:text-ink transition-colors"
          >
            Soạn thảo
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection('criteria-section')}
            className="py-1 whitespace-nowrap shrink-0 cursor-pointer hover:text-ink transition-colors"
          >
            Từ khóa mục tiêu
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection('analysis-section')}
            className="py-1 whitespace-nowrap shrink-0 cursor-pointer hover:text-ink transition-colors"
          >
            Kết quả rà soát
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportWord}
            disabled={!canExport || isExporting}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer bg-accent text-white hover:bg-accent-hover disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isExporting ? 'Đang xuất…' : 'Xuất file Word'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
