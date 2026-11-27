import React, { useState, useRef } from "react";
import { xpAtLevel, xpForNextLevel } from "../lib/levels";
import { Trophy, Award, Flame, Zap, CheckCircle2, Calendar, Lock, User, Heart, BookOpen, ArrowRight, Bell, Clock, Cloud, CloudCheck, RefreshCw, LogOut, LogIn, ShieldCheck, AlertCircle, Edit3, School, GraduationCap, Upload, X, Trash2, RotateCcw, Camera, Loader2, AtSign, Check } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserProgress, Lesson } from "../types";
import { AVATAR_EVOLUTIONS, getAvatarAtLevel, getNextStageAtLevel } from "../lib/avatarEvolution";
import { getMascotComponent } from "./CustomMascots";
import { getOutfitById } from "../lib/mascotOutfits";
import { Shirt, HardDrive } from "lucide-react";
import { TITLE_BADGES } from "./EditProfileModal";
import { UserAvatar } from "./UserAvatar";
import {
  deleteAvatarOnServer,
  validateAvatarFile,
  uploadAndPersistAvatarFile,
  CUSTOM_AVATAR_CACHE_KEY
} from "./AvatarManager";
import { SyncStatus } from "../hooks/useFirestoreSync";
import { checkIsQuotaExhausted, isFirestoreQuotaError, markQuotaExhausted } from "../lib/firestoreError";
import { Achievements, computeUserAchievements } from "./Achievements";

interface ProfileProps {
  studyReminder: any;
  progress: UserProgress;
  lessons: Lesson[];
  onResetProgress: () => void;
  selectedAvatarIdx: number;
  onSelectAvatar: (idx: number) => void;
  onNavigateTab?: (tab: string) => void;
  user?: any;
  authLoading?: boolean;
  syncStatus?: SyncStatus;
  lastSyncedTime?: Date | null;
  onLogIn?: () => Promise<any>;
  onLogOut?: () => Promise<any>;
  onForceSync?: (overrideProgress?: UserProgress, overrideLessons?: Lesson[]) => Promise<void>;
  onUpdateProgress?: (updated: Partial<UserProgress>) => void;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  color: string;
}

export default function Profile({ 
  progress, 
  lessons, 
  onResetProgress,
  selectedAvatarIdx,
  onSelectAvatar,
  studyReminder,
  onNavigateTab,
  user,
  authLoading,
  syncStatus = 'idle',
  lastSyncedTime,
  onLogIn,
  onLogOut,
  onForceSync,
  onUpdateProgress
}: ProfileProps) {
  const completedCount = lessons.filter(l => l.completed).length;
  const noteWroteCount = lessons.filter(l => l.notes && l.notes.trim().length > 0).length;
  const [confirmingReset, setConfirmingReset] = React.useState<boolean>(false);
  const [reminderNotice, setReminderNotice] = React.useState<string | null>(null);

  const activeMascotIdx = React.useMemo(() => {
    if (progress.avatarUrl && progress.avatarUrl.startsWith("mascot:")) {
      const idx = parseInt(progress.avatarUrl.replace("mascot:", ""), 10);
      if (!isNaN(idx) && idx >= 0 && idx < AVATAR_EVOLUTIONS.length) return idx;
    }
    return selectedAvatarIdx >= 0 && selectedAvatarIdx < AVATAR_EVOLUTIONS.length ? selectedAvatarIdx : 0;
  }, [progress.avatarUrl, selectedAvatarIdx]);

  const currentEvolution = getAvatarAtLevel(activeMascotIdx, progress.level);
  const nextEvolution = getNextStageAtLevel(activeMascotIdx, progress.level);
  // bar inside the stored level (older accounts may sit above the slower curve: their bar starts from 0)
  const xpNeed = xpForNextLevel(progress.level);
  const xpInto = Math.min(xpNeed, Math.max(0, progress.points - xpAtLevel(progress.level)));
  const xpBar = { into: xpInto, need: xpNeed, pct: Math.round((xpInto / xpNeed) * 100) };
  const activeAvatarData = AVATAR_EVOLUTIONS[activeMascotIdx] || AVATAR_EVOLUTIONS[0];

  const BADGES: Badge[] = [
    {
      id: "badge-1",
      title: "Học Sinh Mới",
      description: "Gia nhập giảng đường SmartStudy",
      emoji: "🎒",
      unlocked: true,
      color: "from-sky-400 to-blue-600 text-white"
    },
    {
      id: "badge-2",
      title: "Chúa Tể Ghi Chú",
      description: "Viết ghi chép tự học trong ít nhất 1 bài",
      emoji: "✍️",
      unlocked: noteWroteCount >= 1,
      color: "from-sky-500 to-indigo-600 text-white"
    },
    {
      id: "badge-3",
      title: "Vua Khám Phá",
      description: "Tạo thành công 3 bài học tự luyện mới tinh",
      emoji: "🧭",
      unlocked: lessons.length >= 3,
      color: "from-blue-500 to-sky-600 text-white"
    },
    {
      id: "badge-4",
      title: "Bất Bại Đấu Trường",
      description: "Đạt số điểm tuyệt đối trong bài kiểm tra",
      emoji: "👑",
      unlocked: progress.points >= 100,
      color: "from-amber-400 to-yellow-500 text-white"
    },
    {
      id: "badge-5",
      title: "Kiên Trì Bền Bỉ",
      description: "Duy trì chuỗi học tập từ 3 ngày trở lên",
      emoji: "🔥",
      unlocked: progress.streak >= 3,
      color: "from-amber-500 to-orange-500 text-white"
    },
    {
      id: "badge-6",
      title: "Nhà Bác Học Trẻ",
      description: "Hoàn thành xong 2 bài học",
      emoji: "🧠",
      unlocked: completedCount >= 2,
      color: "from-cyan-500 to-sky-600 text-white"
    }
  ];

  const unlockedCount = BADGES.filter(b => b.unlocked).length;
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isAvatarProcessing, setIsAvatarProcessing] = useState(false);
  const [avatarToast, setAvatarToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State cho khu vực chỉnh sửa hợp nhất duy nhất (Avatar, Tên tài khoản, Biệt danh tự đặt, Danh hiệu trong app)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState<string>(
    progress.displayName || (user ? user.displayName : "Học sinh SmartStudy") || "Học sinh SmartStudy"
  );
  const [editNickname, setEditNickname] = useState<string>(progress.nickname || "");
  const [editTitleBadge, setEditTitleBadge] = useState<string>(
    progress.titleBadge || "🌟 Thủ Khoa Tương Lai"
  );
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  React.useEffect(() => {
    setEditDisplayName(
      progress.displayName || (user ? user.displayName : "Học sinh SmartStudy") || "Học sinh SmartStudy"
    );
    setEditNickname(progress.nickname || "");
    setEditTitleBadge(progress.titleBadge || "🌟 Thủ Khoa Tương Lai");
  }, [progress.displayName, progress.nickname, progress.titleBadge, user]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Danh sách toàn bộ danh hiệu có trong app (kết hợp danh hiệu học tập + danh hiệu thành tựu mở khóa)
  const unlockedAchievementTitles = React.useMemo(() => {
    return computeUserAchievements(progress, lessons)
      .filter((item) => item.unlocked)
      .map((item) => item.titleBadgeValue);
  }, [completedCount, noteWroteCount, lessons, progress]);

  const allAppTitles = React.useMemo(() => {
    const badgeTitles = BADGES.filter((b) => b.unlocked).map((b) => `${b.emoji} ${b.title}`);
    return Array.from(new Set([...TITLE_BADGES, ...unlockedAchievementTitles, ...badgeTitles]));
  }, [unlockedAchievementTitles, completedCount, noteWroteCount, lessons.length, progress.points, progress.streak]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setAvatarToast({ type, message });
    setTimeout(() => setAvatarToast(null), 3200);
  };

  /**
   * Core logic: Update avatar & profile fields in progress state immediately and sync to Firebase Firestore
   */
  const persistProfileUpdates = async (updates: Partial<UserProgress>, successMsg: string) => {
    setIsAvatarProcessing(true);
    try {
      const nextProgress: UserProgress = {
        ...progress,
        ...updates
      };

      if (onUpdateProgress) {
        onUpdateProgress(updates);
      }

      if (updates.avatarUrl && updates.avatarUrl.startsWith("mascot:")) {
        const idx = parseInt(updates.avatarUrl.replace("mascot:", ""), 10);
        if (!isNaN(idx)) {
          onSelectAvatar(idx);
          try {
            localStorage.setItem("smart_study_avatar_idx_v2", idx.toString());
          } catch {}
        }
      }

      try {
        const currentStored = localStorage.getItem("smart_study_progress_v2");
        if (currentStored) {
          const parsed = JSON.parse(currentStored);
          Object.assign(parsed, updates);
          localStorage.setItem("smart_study_progress_v2", JSON.stringify(parsed));
        } else {
          localStorage.setItem("smart_study_progress_v2", JSON.stringify(nextProgress));
        }
      } catch {}

      if (user?.uid && !checkIsQuotaExhausted()) {
        try {
          if (onForceSync) {
            await onForceSync(nextProgress, lessons);
          } else {
            const safeTopLevelPhotoURL =
              nextProgress.avatarUrl && nextProgress.avatarUrl.length <= 950
                ? nextProgress.avatarUrl
                : (user.photoURL && user.photoURL.length <= 950 ? user.photoURL : "");

            await setDoc(
              doc(db, "users", user.uid),
              {
                ...(safeTopLevelPhotoURL ? { photoURL: safeTopLevelPhotoURL } : {}),
                ...(updates.displayName ? { displayName: updates.displayName } : {}),
                progress: nextProgress,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );
          }
        } catch (syncErr) {
          if (isFirestoreQuotaError(syncErr)) {
            markQuotaExhausted();
          }
          console.warn("Saved locally, cloud sync notice:", syncErr);
        }
      }

      showToast("success", successMsg);
    } catch (err) {
      console.error("Lỗi khi lưu hồ sơ:", err);
      showToast("error", "Đã lưu trên thiết bị nhưng chưa thể đồng bộ đám mây.");
    } finally {
      setIsAvatarProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      showToast("error", validation.error || "Tệp ảnh không hợp lệ.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
    setSelectedFile(file);

    // Immediately process, upload, and persist the selected avatar so it sticks right away
    setIsAvatarProcessing(true);
    try {
      const persistentAvatarUrl = await uploadAndPersistAvatarFile(
        file,
        user?.uid || "student",
        progress.avatarUrl
      );
      await persistProfileUpdates(
        { avatarUrl: persistentAvatarUrl },
        "Đã cập nhật và lưu ảnh đại diện mới thành công!"
      );
      setSelectedFile(null);
      URL.revokeObjectURL(objUrl);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error("Lỗi xử lý ảnh đại diện:", err);
      showToast("error", err?.message || "Không thể xử lý ảnh đại diện. Vui lòng thử lại!");
    } finally {
      setIsAvatarProcessing(false);
    }
  };

  const handleCancelSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  };

  const uploadSelectedAvatarFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    const persistentAvatarUrl = await uploadAndPersistAvatarFile(
      selectedFile,
      user?.uid || "student",
      progress.avatarUrl
    );

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    return persistentAvatarUrl;
  };

  const handleSaveUnifiedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      let updatedAvatarUrl = progress.avatarUrl || "mascot:0";
      if (selectedFile) {
        const uploadedUrl = await uploadSelectedAvatarFile();
        if (uploadedUrl) {
          updatedAvatarUrl = uploadedUrl;
        }
      }

      const cleanedName = editDisplayName.trim() || "Học sinh SmartStudy";
      const cleanedNickname = editNickname.trim();

      await persistProfileUpdates(
        {
          displayName: cleanedName,
          nickname: cleanedNickname,
          titleBadge: editTitleBadge,
          avatarUrl: updatedAvatarUrl
        },
        "Đã lưu thông tin hồ sơ và ảnh đại diện thành công!"
      );
    } catch (err: any) {
      showToast("error", err?.message || "Không thể lưu thay đổi. Vui lòng thử lại!");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmDeleteAvatar = async () => {
    setShowDeleteConfirmModal(false);
    setIsAvatarProcessing(true);
    try {
      try {
        localStorage.removeItem(CUSTOM_AVATAR_CACHE_KEY);
      } catch {}
      const oldAvatar = progress.avatarUrl;
      if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
        await deleteAvatarOnServer(oldAvatar);
      }
      handleCancelSelectedFile();
      await persistProfileUpdates({ avatarUrl: "mascot:0" }, "Đã xóa ảnh tải lên và đặt về linh vật mặc định!");
    } finally {
      setIsAvatarProcessing(false);
    }
  };

  const handleRestoreDefaultAvatar = async () => {
    setIsAvatarProcessing(true);
    try {
      try {
        localStorage.removeItem(CUSTOM_AVATAR_CACHE_KEY);
      } catch {}
      const oldAvatar = progress.avatarUrl;
      if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
        await deleteAvatarOnServer(oldAvatar);
      }
      handleCancelSelectedFile();
      await persistProfileUpdates({ avatarUrl: "mascot:0" }, "Đã khôi phục avatar mặc định thành công!");
    } finally {
      setIsAvatarProcessing(false);
    }
  };

  const isCustomUploadedAvatar = Boolean(
    progress.avatarUrl &&
      (progress.avatarUrl.startsWith("/uploads/avatars/") ||
        progress.avatarUrl.startsWith("http") ||
        progress.avatarUrl.startsWith("data:image/"))
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
      {/* Thông báo trạng thái lưu Hồ sơ / Avatar */}
      {avatarToast && (
        <div 
          className={`fixed top-5 right-5 z-[150] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border animate-slide-in text-xs font-bold ${
            avatarToast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {avatarToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{avatarToast.message}</span>
        </div>
      )}

      {/* KHU VỰC CHỈNH SỬA HỒ SƠ & AVATAR DUY NHẤT (Gọn gàng, tối giản: Avatar, Tên tài khoản, Biệt danh tự đặt, Danh hiệu trong app) */}
      <form
        onSubmit={handleSaveUnifiedProfile}
        className="rounded-2xl p-5 sm:p-7 bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden space-y-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hàng tiêu đề: Xem nhanh hồ sơ hiện tại */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl text-slate-900">
              Hồ sơ Cá nhân và Ảnh đại diện
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy chỉnh ảnh đại diện, tên tài khoản, biệt danh riêng và danh hiệu hiển thị trong ứng dụng
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{user ? "Đã liên kết Google" : "Lưu trực tiếp trên thiết bị"}</span>
          </div>
        </div>

        {/* Nội dung chính: Cột trái (Avatar) + Cột phải (Tên tài khoản, Biệt danh, Danh hiệu) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* 1. Cột trái: Ảnh đại diện & nút thao tác ảnh gọn gàng */}
          <div className="md:col-span-4 flex flex-col items-center text-center p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-sky-400 shadow-md bg-white flex items-center justify-center relative cursor-pointer group"
              title="Nhấn để chọn ảnh đại diện mới"
            >
              <UserAvatar
                avatarUrl={previewUrl || progress.avatarUrl}
                displayName={editDisplayName || "Học sinh"}
                selectedAvatarIdx={selectedAvatarIdx}
                level={progress.level}
                equippedOutfit={progress.equippedOutfit}
                size={112}
              />
              <div className="absolute inset-0 bg-slate-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-extrabold gap-1">
                <Camera className="w-5 h-5" />
                <span>Đổi ảnh</span>
              </div>
              {previewUrl && (
                <span className="absolute bottom-0 inset-x-0 bg-amber-400 text-amber-950 text-[10px] font-black py-0.5 uppercase">
                  Xem trước
                </span>
              )}
            </div>

            {/* Trạng thái tên + biệt danh xem trực tiếp dưới ảnh */}
            <div className="space-y-0.5 max-w-full px-1">
              <p className="font-display font-black text-sm text-slate-900 truncate">
                {editDisplayName || "Học sinh SmartStudy"}
              </p>
              {editNickname.trim() ? (
                <p className="text-xs font-bold text-blue-600 truncate">
                  @{editNickname.trim().replace(/^@/, "")}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">Chưa đặt biệt danh</p>
              )}
              <p className="text-[11px] font-extrabold text-amber-700 pt-0.5 truncate">
                {editTitleBadge}
              </p>
            </div>

            {/* Cụm nút điều khiển Avatar duy nhất */}
            <div className="w-full space-y-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarProcessing || isSavingProfile}
                data-testid="change-avatar-button"
                className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{previewUrl ? "Chọn ảnh khác" : "Tải ảnh lên"}</span>
              </button>

              {previewUrl ? (
                <button
                  type="button"
                  onClick={handleCancelSelectedFile}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Hủy ảnh vừa chọn
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultAvatar}
                    disabled={isAvatarProcessing || isSavingProfile}
                    data-testid="restore-default-avatar-button"
                    className="py-1.5 px-2 rounded-xl bg-white hover:bg-sky-100/80 text-slate-700 font-bold text-[11px] border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Khôi phục về linh vật mặc định"
                  >
                    <RotateCcw className="w-3 h-3 text-sky-600 shrink-0" />
                    <span>Mặc định</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    disabled={isAvatarProcessing || isSavingProfile || !isCustomUploadedAvatar}
                    data-testid="delete-avatar-button"
                    className="py-1.5 px-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-[11px] border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Xóa ảnh đại diện tải lên"
                  >
                    <Trash2 className="w-3 h-3 shrink-0" />
                    <span>Xóa ảnh</span>
                  </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 leading-tight">
                Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)
              </p>
            </div>
          </div>

          {/* 2. Cột phải: Chỉnh sửa Tên tài khoản, Biệt danh (tự đặt) và Danh hiệu trong app */}
          <div className="md:col-span-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trường 1: Tên tài khoản */}
              <div className="space-y-1.5">
                <label htmlFor="profile-account-name" className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Tên tài khoản</span>
                </label>
                <input
                  id="profile-account-name"
                  type="text"
                  required
                  maxLength={40}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Nhập tên tài khoản của em..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none text-sm font-bold text-slate-900 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Hiển thị trên thanh công cụ và Bảng vàng danh dự.
                </p>
              </div>

              {/* Trường 2: Biệt danh tự đặt */}
              <div className="space-y-1.5">
                <label htmlFor="profile-custom-nickname" className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Biệt danh (Tự đặt)</span>
                </label>
                <input
                  id="profile-custom-nickname"
                  type="text"
                  maxLength={35}
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="VD: Cáo Nhỏ Thông Thái, Phương Chăm Chỉ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none text-sm font-bold text-slate-900 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Biệt danh cá nhân do bạn tự do sáng tạo.
                </p>
              </div>
            </div>

            {/* Trường 3: Các danh hiệu có trong app */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Danh hiệu trong ứng dụng</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Đang chọn: <strong className="text-slate-800">{editTitleBadge}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {allAppTitles.map((titleItem) => {
                  const isSelected = editTitleBadge === titleItem;
                  return (
                    <button
                      key={titleItem}
                      type="button"
                      onClick={() => setEditTitleBadge(titleItem)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-amber-50/90 border-amber-400 text-amber-950 shadow-2xs"
                          : "bg-slate-50/70 border-slate-200/90 text-slate-700 hover:bg-sky-50/70 hover:border-sky-300"
                      }`}
                    >
                      <span className="truncate">{titleItem}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nút Lưu duy nhất cho toàn bộ phần chỉnh sửa */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                {selectedFile
                  ? "Ảnh mới đã sẵn sàng — bấm Lưu thay đổi để áp dụng."
                  : "Mọi thay đổi được cập nhật tức thì mà không cần tải lại trang."}
              </span>
              <button
                type="submit"
                disabled={isSavingProfile || isAvatarProcessing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60 ml-auto"
              >
                {isSavingProfile || isAvatarProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 1. Header & Character Card with Evolved State */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-2xs flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Animated Evolved Mascot with Equipped Outfit */}
        <div className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center relative group shrink-0">
          <div className="hover:scale-105 transition-transform flex items-center justify-center">
            {getMascotComponent(
              activeMascotIdx, 
              104,
              currentEvolution.stageNum,
              progress.equippedOutfit || "default"
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white shadow-2xs uppercase tracking-wider">
            Cấp {currentEvolution.stageNum}
          </div>
        </div>

        <div className="space-y-3.5 text-center md:text-left flex-1 w-full">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center justify-center md:justify-start gap-2">
              <span>Đồng hành cùng: {currentEvolution.title}</span>
            </h2>
            <p className="text-slate-600 text-xs font-medium leading-relaxed">
              "{currentEvolution.description}"
            </p>
          </div>

          {/* Equipped Outfit Badge */}
          <div className="flex items-center gap-2 pt-0.5 justify-center md:justify-start">
            <span className="text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-blue-600" />
              <span>Trang phục: {getOutfitById(progress.equippedOutfit || "default").name}</span>
            </span>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("shop")}
                className="min-h-6 py-1 text-[11px] font-extrabold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
              >
                Đổi đồ trong Shop →
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[11px] font-extrabold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-100" /> {progress.points} XP tích lũy
            </span>
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-100" /> Chuỗi {progress.streak} ngày
            </span>
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã xong {completedCount} bài
            </span>
          </div>

          {/* Level progress meter */}
          <div className="space-y-2 max-w-sm mx-auto md:mx-0">
            <div className="flex justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Kinh nghiệm level {progress.level}</span>
              <span className="text-blue-600 font-black tabular-nums">{xpBar.into} / {xpBar.need} XP</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${xpBar.pct}%` }}
              />
            </div>
            {nextEvolution ? (
              <p className="text-xs font-semibold text-slate-600">
                Thăng cấp lên <span className="text-blue-600 font-extrabold">Level {nextEvolution.minLevel}</span> để tiến hóa thành <strong>{nextEvolution.emoji} {nextEvolution.title}</strong>!
              </p>
            ) : (
              <p className="text-xs font-extrabold text-amber-600 flex items-center gap-1 justify-center md:justify-start">
                Đã đạt trạng thái tiến hóa Thần Thú tối cao!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Evolution Route / Timeline */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Tuyến Đường Tiến Hóa: {activeAvatarData.label}</span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">Sơ đồ 4 giai đoạn</span>
          </h3>
          <p className="text-xs text-slate-500">Tích lũy kinh nghiệm tự học để chứng kiến sự thay đổi diệu kỳ của người bạn đồng hành!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {activeAvatarData.stages.map((stage) => {
            const isUnlocked = progress.level >= stage.minLevel;
            const isCurrent = currentEvolution.stageNum === stage.stageNum;
            return (
              <div 
                key={stage.stageNum}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col items-center text-center space-y-2 ${
                  isCurrent 
                    ? "border-sky-500 bg-sky-200/90 ring-2 ring-sky-500/20 shadow-md"
                    : isUnlocked 
                      ? "border-sky-200/80 bg-sky-100/90" 
                      : "border-sky-200/40 bg-sky-100/40 opacity-60"
                }`}
              >
                {/* Evolution status indicator */}
                {isCurrent && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
                  </span>
                )}

                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner relative ${
                  isUnlocked ? "bg-white/70" : "bg-sky-200/40"
                }`}>
                  {isUnlocked ? (
                    getMascotComponent(activeMascotIdx, 72, stage.stageNum)
                  ) : (
                    <div className="relative">
                      <span className="block blur-[3px] grayscale opacity-60">{getMascotComponent(activeMascotIdx, 72, stage.stageNum)}</span>
                      <Lock className="w-5 h-5 text-slate-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className={`text-xs font-extrabold block truncate ${isUnlocked ? "text-sky-950" : "text-slate-400"}`}>
                    {stage.title}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                    isCurrent 
                      ? "bg-sky-600 text-white" 
                      : isUnlocked 
                        ? "bg-sky-200 text-sky-800" 
                        : "bg-sky-200/50 text-slate-500"
                  }`}>
                    {isUnlocked ? (isCurrent ? "Đang đồng hành" : "Đã mở khóa") : `Yêu cầu Lv ${stage.minLevel}`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal font-medium">{stage.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Thành tựu & huy chương (Achievements Component) */}
      <Achievements
        progress={progress}
        lessons={lessons}
        activeTitleBadge={editTitleBadge}
        onEquipTitleBadge={(newTitleBadge) => {
          setEditTitleBadge(newTitleBadge);
          void persistProfileUpdates(
            { titleBadge: newTitleBadge },
            `Đã trang bị danh hiệu "${newTitleBadge}"!`
          );
        }}
        onNavigateTab={onNavigateTab}
      />

      {/* Reminder Settings */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-200/70">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">Nhắc nhở học tập</h3>
            <p className="text-xs text-slate-500">Nhận thông báo từ trình duyệt để không quên ôn bài mỗi ngày</p>
          </div>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={studyReminder.enabled}
                onChange={async (e) => {
                  const success = await studyReminder.toggleReminder(e.target.checked);
                  if (!success && e.target.checked) {
                    setReminderNotice("Trình duyệt đang chặn thông báo. Vui lòng cấp quyền trong cài đặt trình duyệt nhé!");
                  } else {
                    setReminderNotice(null);
                  }
                }}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-semibold text-slate-900">
              {studyReminder.enabled ? "Đã bật thông báo" : "Đã tắt thông báo"}
            </span>
          </div>
          
          <div className={`flex items-center gap-2 transition-all ${studyReminder.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <Clock className="w-4 h-4 text-blue-600" />
            <input 
              type="time" aria-label="Giờ nhắc học" 
              value={studyReminder.time}
              onChange={(e) => studyReminder.updateTime(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-2.5 py-1.5 font-semibold"
            />
          </div>
        </div>
        
        {(reminderNotice || (studyReminder.enabled && studyReminder.permission !== 'granted')) && (
          <p className="text-xs text-rose-600 font-semibold">
            ⚠️ {reminderNotice || "Ứng dụng chưa được cấp quyền gửi thông báo. Hãy kiểm tra cài đặt trình duyệt của em nhé."}
          </p>
        )}
      </div>

      {/* 4. Tài Khoản & Đồng Bộ Đám Mây Firebase */}
      <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-sky-950 flex items-center gap-2">
                <span>Tài khoản và dữ liệu đám mây</span>
                <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                  Firebase
                </span>
              </h3>
              <p className="text-slate-500 text-xs">
                Bảo vệ toàn vẹn điểm XP, cấp độ, chuỗi ngày học và các bài soạn trên máy chủ đám mây
              </p>
            </div>
          </div>

          {user && onForceSync && (
            <button
              onClick={() => onForceSync()}
              disabled={syncStatus === 'syncing' || syncStatus === 'quota-exhausted'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
              title={syncStatus === 'quota-exhausted' ? "Đang lưu trữ cục bộ an toàn trên máy (Đám mây đạt hạn mức)" : "Đồng bộ ngay dữ liệu lên đám mây"}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'syncing' ? "Đang lưu..." : syncStatus === 'quota-exhausted' ? "Đã lưu trên máy" : "Lưu ngay"}</span>
            </button>
          )}
        </div>

        {user ? (
          /* User Logged In */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  avatarUrl={progress.avatarUrl || user.photoURL}
                  displayName={progress.displayName || user.displayName || "Học sinh"}
                  selectedAvatarIdx={selectedAvatarIdx}
                  level={progress.level}
                  equippedOutfit={progress.equippedOutfit}
                  size={48}
                  className="rounded-2xl border-2 border-sky-300 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-sky-950">{progress.displayName || user.displayName || "Học sinh"}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Google Verified
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">{user.email}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Firebase UID: {user.uid}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onLogOut && (
                  <button
                    onClick={() => onLogOut()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Đăng xuất</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {syncStatus === 'quota-exhausted' ? (
                <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-300 flex items-center gap-2.5 text-sky-950">
                  <HardDrive className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-bold flex items-center gap-1.5">
                      <span>Lưu trữ an toàn trên máy</span>
                      <span className="text-[10px] bg-sky-200 text-sky-800 font-extrabold px-1.5 py-0.2 rounded">Offline Safe</span>
                    </span>
                    <span className="text-[10px] text-sky-700 font-medium">
                      Đám mây đạt hạn mức hôm nay. Toàn bộ điểm XP và bài học đã lưu trên máy!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2.5 text-emerald-900">
                  <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Đồng bộ cơ sở dữ liệu thời gian thực</span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {lastSyncedTime ? `Đã đồng bộ lúc: ${lastSyncedTime.toLocaleTimeString()}` : "Dữ liệu được bảo toàn tự động"}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-2.5 text-blue-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold block">Cơ chế bảo mật dữ liệu học tập</span>
                  <span className="text-[10px] text-blue-700 font-medium">
                    {syncStatus === 'quota-exhausted'
                      ? "Dữ liệu lưu trữ an toàn trong trình duyệt của em"
                      : "Chỉ tài khoản chính chủ mới có quyền truy cập dữ liệu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* User Not Logged In */
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-black text-sm text-sky-950 flex items-center justify-center sm:justify-start gap-2">
                <span>Chưa liên kết tài khoản Google</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </span>
              <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                Hiện tại dữ liệu bài học và điểm thưởng chỉ được lưu tạm thời trên trình duyệt này. Hãy đăng nhập bằng Google để lưu trữ vĩnh viễn trên đám mây Firestore và học trên mọi thiết bị!
              </p>
            </div>

            {onLogIn && (
              <button
                onClick={() => onLogIn()}
                disabled={authLoading}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-3.5 h-3.5" />
                </div>
                <span>{authLoading ? "Đang kết nối..." : "Đăng nhập Google"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. Reset options & telemetry details */}
      <div className="bg-sky-200/50 border border-sky-300/60 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-sky-950 block">Dữ liệu hồ sơ học tập</span>
          <span className="text-[10px] text-slate-500">Toàn bộ thông tin được đồng bộ trực tiếp với trình duyệt của em.</span>
        </div>
        {confirmingReset ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmingReset(false);
                onResetProgress();
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer"
            >
              Xác nhận đặt lại
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Đặt lại toàn bộ
          </button>
        )}
      </div>

      {/* Confirmation Modal for Delete Avatar */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-rose-200 text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="font-display font-black text-base sm:text-lg text-slate-900 leading-snug">
                Bạn có chắc muốn xóa avatar hiện tại không?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sau khi xóa, tài khoản sẽ được đặt lại về avatar mặc định của hệ thống.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={isAvatarProcessing}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAvatar}
                disabled={isAvatarProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-xs text-white transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                {isAvatarProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
