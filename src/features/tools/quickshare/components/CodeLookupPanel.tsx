import { useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import {
  isValidShareCodeFormat,
  normalizeShareCode,
  parseShareLocation,
} from '../core/shareCodec';

interface CodeLookupPanelProps {
  initialError?: string | null;
  onOpenCode: (code: string) => void;
}

export function CodeLookupPanel({ initialError, onOpenCode }: CodeLookupPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? initialError ?? null;

  const handleOpen = () => {
    const raw = inputValue.trim();
    if (!raw) {
      setLocalError('Bạn chưa nhập mã chia sẻ. Hãy nhập 6 ký tự từ thiết bị gửi.');
      return;
    }

    // Also allow pasting a full QuickShare link directly into the lookup box
    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        const loc = parseShareLocation(parsed.pathname, parsed.search, parsed.hash);
        if (loc.type === 'code' && loc.value) {
          setLocalError(null);
          onOpenCode(normalizeShareCode(loc.value));
          return;
        }
      } catch {
        // Continue to code validation
      }
    }

    const normalized = normalizeShareCode(raw);
    if (!isValidShareCodeFormat(normalized)) {
      setLocalError('Mã chia sẻ gồm đúng 6 chữ cái hoặc chữ số (ví dụ: HOC-202). Hãy kiểm tra lại.');
      return;
    }

    setLocalError(null);
    onOpenCode(normalized);
  };

  return (
    <section
      aria-labelledby="lookup-heading"
      className="mx-auto max-w-2xl rounded-2xl border border-[#E1E6EF] bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF4FF] text-[#1D4ED8]">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 id="lookup-heading" className="text-2xl font-bold tracking-tight text-[#141923]">
            Mở nội dung bằng mã ngắn
          </h1>
          <p className="mt-0.5 text-sm text-[#475467]">
            Nhập mã 6 ký tự hoặc dán đường link chia sẻ từ thiết bị khác.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="lookup-code-input"
          className="mb-2 block text-sm font-medium text-[#141923]"
        >
          Mã chia sẻ (6 ký tự)
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="lookup-code-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.toUpperCase());
              if (localError) setLocalError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleOpen();
              }
            }}
            placeholder="Ví dụ: HOC-202"
            aria-invalid={Boolean(displayError)}
            aria-describedby={displayError ? 'lookup-error' : undefined}
            className={`min-h-[52px] flex-1 rounded-xl border bg-white px-4 py-3 font-mono text-xl font-semibold tracking-[0.14em] text-[#141923] placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-[#748094] focus:outline-2 focus:outline-offset-0 ${
              displayError
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:outline-[#DC2626]/20'
                : 'border-[#D4DBE7] focus:border-[#1D4ED8] focus:outline-[#1D4ED8]/20'
            }`}
          />

          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Mở nội dung</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {displayError && (
          <div
            id="lookup-error"
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-sm text-[#B91C1C]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{displayError}</span>
          </div>
        )}
      </div>

      {/* Helpful sample codes for trying immediately */}
      <div className="mt-7 border-t border-[#E1E6EF] pt-5">
        <p className="text-sm font-medium text-[#141923]">Mã mẫu có sẵn để thử ngay</p>
        <p className="mt-1 text-[13px] text-[#556174]">
          Bạn có thể bấm chọn một mã mẫu bên dưới để xem giao diện nhận nội dung và các trường hợp trạng thái.
        </p>

        <div className="mt-3.5 divide-y divide-[#E1E6EF] border-y border-[#E1E6EF]">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#141923]">
                Danh sách tài liệu ôn tập tuần này
              </p>
              <p className="text-xs text-[#556174]">
                <span className="font-mono font-semibold text-[#141923]">HOC-202</span> · Cho phép tạo bản sao mới · 3 đường link
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenCode('HOC202')}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#D4DBE7] bg-white px-3.5 py-2 text-sm font-medium text-[#1D4ED8] transition-colors hover:bg-[#EFF4FF] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Mở mã mẫu
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#141923]">
                Nội quy phòng máy — bản chỉ đọc
              </p>
              <p className="text-xs text-[#556174]">
                <span className="font-mono font-semibold text-[#141923]">DOC-101</span> · Chế độ chỉ đọc · 1 đường link
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenCode('DOC101')}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#D4DBE7] bg-white px-3.5 py-2 text-sm font-medium text-[#1D4ED8] transition-colors hover:bg-[#EFF4FF] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Mở chỉ đọc
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
