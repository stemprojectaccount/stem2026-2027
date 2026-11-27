import React, { useState, useEffect } from "react";
import { X, Check, User, Edit3, Award, CheckCircle2, AtSign, Save } from "lucide-react";
import { UserProgress } from "../types";
import AvatarManager from "./AvatarManager";

export const TITLE_BADGES = [
  "🌟 Thủ Khoa Tương Lai",
  "⚡ Thần Tốc Tính Nhẩm",
  "🚀 Nhà Thám Hiểm Tri Thức",
  "🧙‍♂️ Phù Thủy Toán Học",
  "📚 Bách Khoa Toàn Thư",
  "🏆 Siêu Sao Trắc Nghiệm",
  "👑 Cao Thủ Đấu Trường",
  "🔥 Chiến Thần Chăm Chỉ",
  "🎯 Đại Sứ Tri Thức",
  "⭐ Học Sinh Gương Mẫu"
];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onSaveProgress: (updated: Partial<UserProgress>) => void;
  user?: any;
  selectedAvatarIdx?: number;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  progress,
  onSaveProgress,
  user,
  selectedAvatarIdx = 0
}: EditProfileModalProps) {
  if (!isOpen) return null;

  const [displayName, setDisplayName] = useState(
    progress.displayName || (user ? user.displayName : "Học sinh SmartStudy") || "Học sinh SmartStudy"
  );
  const [nickname, setNickname] = useState(progress.nickname || "");
  const [titleBadge, setTitleBadge] = useState(
    progress.titleBadge || "🌟 Thủ Khoa Tương Lai"
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string>(progress.avatarUrl || "mascot:0");

  useEffect(() => {
    setCurrentAvatar(progress.avatarUrl || "mascot:0");
    setDisplayName(progress.displayName || (user ? user.displayName : "Học sinh SmartStudy") || "Học sinh SmartStudy");
    setNickname(progress.nickname || "");
    setTitleBadge(progress.titleBadge || "🌟 Thủ Khoa Tương Lai");
  }, [isOpen, progress.avatarUrl, progress.displayName, progress.nickname, progress.titleBadge, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Partial<UserProgress> = {
      displayName: displayName.trim() || "Học sinh SmartStudy",
      nickname: nickname.trim(),
      titleBadge: titleBadge,
      avatarUrl: currentAvatar
    };

    onSaveProgress(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto font-sans">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-sky-200 overflow-hidden my-auto animate-scale-up">
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-black text-base">
                Chỉnh sửa Hồ sơ và Avatar
              </h3>
              <p className="text-sky-100 text-xs">
                Cập nhật ảnh đại diện, tên tài khoản, biệt danh và danh hiệu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <AvatarManager
            currentAvatarUrl={currentAvatar}
            displayName={displayName}
            selectedAvatarIdx={selectedAvatarIdx}
            level={progress.level}
            userId={user?.uid || "student"}
            onAvatarUpdated={(newUrl) => {
              setCurrentAvatar(newUrl);
              onSaveProgress({ avatarUrl: newUrl });
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Tên tài khoản</span>
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên tài khoản..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-blue-600" />
                <span>Biệt danh (Tự đặt)</span>
              </label>
              <input
                type="text"
                maxLength={35}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="VD: Cáo Nhỏ Chăm Chỉ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Danh hiệu trong ứng dụng</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TITLE_BADGES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitleBadge(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer truncate ${
                    titleBadge === t
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300/50"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đồng bộ tức thì</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={saveSuccess}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã lưu!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu hồ sơ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

