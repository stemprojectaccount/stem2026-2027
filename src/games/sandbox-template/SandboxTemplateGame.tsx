import React, { useState } from "react";
import { GameComponentProps } from "../types";
import { Play, RotateCcw, Wrench, PlusCircle, CheckCircle2, Code2, Sparkles, Terminal } from "lucide-react";

export default function SandboxTemplateGame({
  gameId,
  isTestMode,
  highScore,
  onSaveHighScore,
  onAwardReward,
  onLogEvent,
}: GameComponentProps) {
  const [stage, setStage] = useState<"ready" | "running" | "completed">("ready");
  const [score, setScore] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);
  const [customConfigName, setCustomConfigName] = useState<string>("Thử nghiệm cơ chế trả lời nhanh");
  const [customPointsPerAction, setCustomPointsPerAction] = useState<number>(15);

  const handleStartTestRun = () => {
    setScore(0);
    setStepCount(0);
    setStage("running");
    onLogEvent("state", `[Sandbox: ${gameId}] Khởi chạy kịch bản "${customConfigName}" (+${customPointsPerAction} điểm/tương tác).`);
  };

  const handleSimulateAction = () => {
    const nextStep = stepCount + 1;
    const nextScore = score + customPointsPerAction;
    setStepCount(nextStep);
    setScore(nextScore);
    onLogEvent("score", `[Sandbox] Tương tác bước #${nextStep}: +${customPointsPerAction} điểm (Tổng: ${nextScore}).`);
  };

  const handleCompleteTestRun = () => {
    setStage("completed");
    if (score > highScore) {
      onSaveHighScore(score);
      onLogEvent("score", `[Sandbox] Lưu kỷ lục mới: ${score} điểm.`);
    }
    onLogEvent("state", `[Sandbox] Hoàn tất phiên chạy thử nghiệm với ${score} điểm sau ${stepCount} bước.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Khung Mẫu Thử Nghiệm Game (Sandbox Starter)
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold">
            ID: {gameId}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Đây là khung mẫu chuẩn trong thư mục <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800">/src/games/sandbox-template/</code>. Khi tạo một thư mục game mới, bạn có thể sao chép file này để kiểm tra ngay luồng tính điểm, lưu kỷ lục và cộng thưởng XP/Xu vào hồ sơ học sinh.
        </p>

        {/* Parameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label htmlFor="sandbox-scenario-name" className="block text-xs font-semibold text-slate-700">
              Tên kịch bản đang test
            </label>
            <input
              id="sandbox-scenario-name"
              type="text"
              value={customConfigName}
              onChange={(e) => setCustomConfigName(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="sandbox-points-step" className="block text-xs font-semibold text-slate-700">
              Điểm cộng mỗi lượt tương tác
            </label>
            <input
              id="sandbox-points-step"
              type="number"
              min={1}
              max={500}
              value={customPointsPerAction}
              onChange={(e) => setCustomPointsPerAction(Math.max(1, Number(e.target.value) || 10))}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Live state metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Trạng thái</span>
          <span className="text-xs font-bold font-mono uppercase text-blue-600">{stage}</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Số bước test</span>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900">{stepCount}</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Điểm phiên</span>
          <span className="text-base font-bold font-mono tabular-nums text-blue-600">{score}</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Kỷ lục đã lưu</span>
          <span className="text-base font-bold font-mono tabular-nums text-emerald-700">{highScore}</span>
        </div>
      </div>

      {/* Interactive stage */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center space-y-4">
        {stage === "ready" && (
          <>
            <h4 className="text-lg font-bold text-slate-900">
              Sẵn sàng chạy kịch bản: {customConfigName}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Nhấn nút bên dưới để kiểm tra vòng lặp trạng thái game và ghi log trực tiếp xuống bảng điều khiển bên dưới.
            </p>
            <button
              type="button"
              onClick={handleStartTestRun}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Khởi chạy phiên Test
            </button>
          </>
        )}

        {stage === "running" && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-900">
              Đang chạy thử nghiệm ({stepCount} lượt tương tác)
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSimulateAction}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Mô phỏng thao tác đúng (+{customPointsPerAction} điểm)
              </button>

              <button
                type="button"
                onClick={handleCompleteTestRun}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Kết thúc và Lưu kỷ lục
              </button>
            </div>
          </div>
        )}

        {stage === "completed" && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-900">
              Phiên Test hoàn tất ({score} điểm)
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleStartTestRun}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Chạy lại kịch bản
              </button>
              <button
                type="button"
                onClick={() =>
                  onAwardReward({
                    xp: 15,
                    coins: 10,
                    reason: `Test cộng thưởng từ ${gameId}`,
                  })
                }
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Test cộng thưởng (+15 XP, +10 Xu)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick code structure reference when in test mode */}
      {isTestMode && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
            <Code2 className="w-4 h-4" />
            <span>Cấu trúc chuẩn khi thêm thư mục game mới vào /src/games/</span>
          </div>
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// 1. Tạo thư mục mới: /src/games/ten-game-moi/TenGameMoi.tsx
// 2. Đăng ký vào /src/games/registry.ts trong mảng DEFAULT_GAMES:
{
  id: "ten-game-moi",
  folderId: "sandbox-lab", // hoặc thư mục môn học
  title: "Tên Game Mới",
  sourcePath: "/src/games/ten-game-moi/TenGameMoi.tsx",
  status: "testing",
  component: TenGameMoi,
}`}
          </pre>
        </div>
      )}
    </div>
  );
}
