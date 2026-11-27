import React from "react";
import { 
  Play, 
  Pause, 
  X, 
  Maximize2, 
  SkipBack,
  SkipForward,
  Gauge
} from "lucide-react";
import { usePodcast } from "../context/PodcastContext";
import { renderTextWithMath } from "../lib/renderTextWithMath";

interface MiniPodcastPlayerProps {
  activeTab: string;
  onNavigateToPodcast: () => void;
}

const MINI_SPEED_OPTIONS = [
  {
    value: 0.5,
    shortLabel: "0.5x",
    tag: "Chậm kỹ",
    description: "Đọc rất chậm (0.5x) — nghe rõ từng âm tiết và thuật ngữ",
    isSlowFocus: true,
  },
  {
    value: 0.75,
    shortLabel: "0.75x",
    tag: "Chậm vừa",
    description: "Đọc chậm vừa (0.75x) — tốc độ khuyên dùng để phát âm tiếng Việt rõ ràng",
    isSlowFocus: true,
  },
  {
    value: 1,
    shortLabel: "1x",
    tag: "Chuẩn",
    description: "Tốc độ tiêu chuẩn (1.0x)",
    isSlowFocus: false,
  },
] as const;

export default function MiniPodcastPlayer({ activeTab, onNavigateToPodcast }: MiniPodcastPlayerProps) {
  const {
    currentEpisode,
    isPlaying,
    currentLineIndex,
    playbackSpeed,
    togglePlayPause,
    skipPreviousLine,
    skipNextLine,
    setSpeed,
    closePlayer,
  } = usePodcast();

  // If no episode is loaded or user is already viewing the full podcast page, don't show the mini dock
  if (!currentEpisode || activeTab === "podcast") {
    return null;
  }

  const currentLine = currentEpisode.dialogue[currentLineIndex];
  const progressPercent = currentEpisode.dialogue.length > 0 
    ? Math.round(((currentLineIndex + 1) / currentEpisode.dialogue.length) * 100) 
    : 0;

  const isSlowModeActive = playbackSpeed <= 0.75;
  const isMinh = currentLine?.speaker === "Minh";

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-2 left-2 md:left-auto md:right-6 md:w-[440px] z-40 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-3.5 shadow-lg text-slate-900 flex flex-col gap-2.5">
        {/* Top bar: Info and Primary Transport Controls */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Clickable info to expand */}
          <div 
            onClick={onNavigateToPodcast}
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
            title="Bấm để mở toàn màn hình podcast"
          >
            {/* Clean Speaker Monogram Avatar */}
            <div className="relative shrink-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs border ${
                isMinh
                  ? "bg-amber-100/80 border-amber-300 text-amber-900"
                  : "bg-blue-100/80 border-blue-300 text-blue-900"
              }`}>
                {isMinh ? "M" : "L"}
              </div>
              {isPlaying && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </span>
              )}
            </div>

            {/* Title & current speaking line */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-blue-700">
                  {currentEpisode.subject}
                </span>
                <span className="text-slate-300 text-[10px]">·</span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  Câu {currentLineIndex + 1}/{currentEpisode.dialogue.length}
                </span>
                {isSlowModeActive && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                    Đọc chậm rõ chữ
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {renderTextWithMath(currentEpisode.title)}
              </p>
              <p className="text-xs text-slate-600 truncate font-normal">
                <strong className={isMinh ? "text-amber-800" : "text-blue-800"}>
                  {currentLine?.speaker}:
                </strong>{" "}
                {renderTextWithMath(currentLine?.text || "")}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={skipPreviousLine}
              disabled={currentLineIndex === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-35 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Câu trước"
              aria-label="Câu trước"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
              aria-label={isPlaying ? "Tạm dừng" : "Phát tiếp"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={skipNextLine}
              disabled={currentLineIndex >= currentEpisode.dialogue.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-35 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Câu tiếp theo"
              aria-label="Câu tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onNavigateToPodcast}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Mở toàn màn hình podcast"
              aria-label="Mở toàn màn hình podcast"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={closePlayer}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Đóng trình phát"
              aria-label="Đóng trình phát"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playback Speed Selector Row (0.5x, 0.75x, 1x) */}
        <div
          className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100"
          role="group"
          aria-label="Tốc độ đọc tiếng Việt"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 min-w-0">
            <Gauge className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Tốc độ đọc:</span>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 gap-0.5 shrink-0">
            {MINI_SPEED_OPTIONS.map((option) => {
              const isSelected = Math.abs(playbackSpeed - option.value) < 0.03;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSpeed(option.value)}
                  aria-pressed={isSelected}
                  title={option.description}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? option.isSlowFocus
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                  }`}
                >
                  <span className="font-mono">{option.shortLabel}</span>
                  <span className={`text-[11px] ${isSelected ? "text-white/95" : "text-slate-500"}`}>
                    {option.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom progress bar */}
        <div 
          onClick={onNavigateToPodcast}
          className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden cursor-pointer"
          title={`Tiến độ bài nghe: ${progressPercent}%`}
        >
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
