import { TARGET_LANGUAGES, TargetLanguageCode } from '../types/document';

interface LanguageSelectProps {
  id: string;
  label: string;
  value: TargetLanguageCode;
  onChange: (value: TargetLanguageCode) => void;
  disabled?: boolean;
}

export function LanguageSelect({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: LanguageSelectProps) {
  return (
    <div className="flex items-center gap-2.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-600 whitespace-nowrap shrink-0"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as TargetLanguageCode)}
        className="h-10 min-w-[164px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 transition-colors hover:border-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 disabled:opacity-50"
      >
        {TARGET_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
