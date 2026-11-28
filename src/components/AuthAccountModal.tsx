import React, { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut, Cloud, CloudCheck, RefreshCw, ShieldCheck, X, CheckCircle2, Flame, Trophy, ExternalLink, AlertCircle, Globe } from "lucide-react";
import { User } from "firebase/auth";
import { SyncStatus } from "../hooks/useFirestoreSync";
import { isDesktopApp, isNativeMobileApp } from "../firebase";
import { authErrorMessage, isUserCancelled } from "../lib/authErrorMessage";
import { UserProgress } from "../types";
import { WisdomCoinIcon } from "./CustomMascots";
import { UserAvatar } from "./UserAvatar";

interface AuthAccountWidgetProps {
  user: User | null | undefined;
  authLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncedTime: Date | null;
  progress: UserProgress;
  onLogIn: (options?: { forceRedirect?: boolean }) => Promise<any>;
  onLogOut: () => Promise<any>;
  onForceSync: () => Promise<void>;
  onOpenProfile: () => void;
  onOpenAuthPortal?: () => void;
}

export default function AuthAccountWidget({
  user,
  authLoading,
  syncStatus,
  lastSyncedTime,
  progress,
  onLogIn,
  onLogOut,
  onForceSync,
  onOpenProfile,
  onOpenAuthPortal
}: AuthAccountWidgetProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState<boolean>(() => {
    return typeof window !== "undefined" && (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
    );
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Lock background scroll and support Android Back button when modal or dropdown is open on mobile
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let pushedState = false;
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      window.history.pushState({ mobileSheet: "auth-modal" }, "");
      pushedState = true;
    }

    const handlePopState = () => {
      setIsModalOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("popstate", handlePopState);
      if (pushedState && window.history.state?.mobileSheet === "auth-modal") {
        window.history.back();
      }
    };
  }, [isModalOpen]);

  const handleSignIn = async (forceRedirect = false) => {
    try {
      setIsLoggingIn(true);
      setErrorMessage(null);
      await onLogIn({ forceRedirect });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Lỗi đăng nhập AuthAccountWidget:", err);
      const code = err?.code || "";
      const inApp = isNativeMobileApp() || isDesktopApp();
      setErrorMessage(inApp && isUserCancelled(code, err?.message || "") ? null : authErrorMessage(code));
      // "Chuyển trang" (redirect) only works in a real browser, never inside the apps
      setShowRedirectOption(
        !inApp &&
          ["auth/popup-blocked", "auth/popup-closed-by-user", "auth/operation-not-supported-in-this-environment", "auth/internal-error"].includes(code)
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await onLogOut();
      setIsDropdownOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* 1. Top Bar Trigger Button */}
      <div className="relative" ref={dropdownRef}>
        {authLoading ? (
          <div className="flex items-center gap-2 min-h-[44px] px-3 py-1.5 rounded-xl bg-sky-100/90 border border-sky-300/70 text-xs font-bold text-sky-800 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
            <span className="hidden sm:inline">Đang kiểm tra...</span>
          </div>
        ) : user ? (
          /* User is Logged In */
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Tài khoản và trạng thái đồng bộ đám mây"
            className="flex items-center gap-2 min-h-[44px] min-w-[44px] p-1 sm:pr-3 rounded-2xl border border-sky-300/80 bg-white/90 hover:bg-sky-50 shadow-2xs transition-all cursor-pointer group"
            title="Tài khoản và Trạng thái đồng bộ đám mây"
          >
            <div className="relative">
              <UserAvatar
                avatarUrl={progress.avatarUrl || user.photoURL || undefined}
                displayName={progress.displayName || user.displayName || "Học sinh"}
                level={progress.level}
                equippedOutfit={progress.equippedOutfit}
                size={32}
                className="rounded-xl border border-sky-300 shadow-2xs group-hover:scale-105 transition-transform"
              />
              {/* Cloud Sync indicator dot */}
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                syncStatus === 'syncing' 
                  ? 'bg-amber-500 animate-pulse' 
                  : syncStatus === 'quota-exhausted'
                  ? 'bg-sky-500'
                  : syncStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}>
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-2 h-2 text-white animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                )}
              </span>
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-black text-sky-950 line-clamp-1 max-w-[110px] group-hover:text-sky-700 transition-colors">
                {progress.displayName || user.displayName || "Học sinh"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-500" />
                    <span className="text-amber-600">Đang lưu...</span>
                  </>
                ) : syncStatus === 'quota-exhausted' ? (
                  <>
                    <Cloud className="w-3 h-3 text-sky-600" />
                    <span className="text-sky-700 font-semibold">Lưu máy an toàn</span>
                  </>
                ) : (
                  <>
                    <CloudCheck className="w-3 h-3 text-emerald-600" />
                    <span>Đã đồng bộ</span>
                  </>
                )}
              </span>
            </div>
          </button>
        ) : (
          /* User is Guest / Not Logged In */
          <button
            type="button"
            onClick={() => {
              if (onOpenAuthPortal) {
                onOpenAuthPortal();
              } else {
                setIsModalOpen(true);
              }
            }}
            aria-label="Đăng nhập tài khoản"
            className="flex items-center gap-2 min-h-[44px] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer transform active:scale-95 whitespace-nowrap"
            title="Mở cổng đăng nhập để đồng bộ tiến độ học tập trên đám mây"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-3.5 h-3.5" 
              />
            </div>
            <span className="tracking-tight">Tài khoản</span>
          </button>
        )}

        {/* 2. User Account Dropdown Menu */}
        {isDropdownOpen && user && (
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:right-0 sm:mt-2 w-full sm:w-72 max-h-[85dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-sky-200 p-4 sm:p-3 z-[110] space-y-3">
            {/* Header profile info */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-sky-100">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  avatarUrl={progress.avatarUrl || user.photoURL || undefined}
                  displayName={progress.displayName || user.displayName || "Học sinh"}
                  level={progress.level}
                  equippedOutfit={progress.equippedOutfit}
                  size={44}
                  className="rounded-2xl border border-sky-300 shadow-2xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-sky-950 truncate">{progress.displayName || user.displayName || "Học sinh"}</p>
                  <p className="text-xs font-semibold text-slate-600 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-black uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                      Cấp {progress.level}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                aria-label="Đóng bảng tài khoản"
                className="sm:hidden w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-sky-50/80 rounded-xl border border-sky-150 text-center">
              <div>
                <p className="text-xs font-bold text-slate-500">Điểm XP</p>
                <p className="text-sm font-black text-sky-900">{progress.points}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Xu Thưởng</p>
                <p className="text-sm font-black text-amber-600 flex items-center justify-center gap-0.5">
                  <WisdomCoinIcon size={12} />
                  <span>{progress.coins || 0}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Chuỗi ngày</p>
                <p className="text-sm font-black text-orange-600 flex items-center justify-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span>{progress.streak}d</span>
                </p>
              </div>
            </div>

            {/* Cloud Sync Status & Action */}
            <div className="p-2.5 bg-gradient-to-r from-sky-50 to-blue-50/60 rounded-xl border border-sky-200/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {syncStatus === 'quota-exhausted' ? (
                  <Cloud className="w-4 h-4 text-sky-600 shrink-0" />
                ) : (
                  <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-sky-950">
                    {syncStatus === 'syncing' 
                      ? "Đang đồng bộ..." 
                      : syncStatus === 'quota-exhausted'
                      ? "Đã lưu an toàn trên máy"
                      : "Đã lưu đám mây"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {syncStatus === 'quota-exhausted'
                      ? "Đã chuyển sang lưu cục bộ an toàn"
                      : lastSyncedTime ? `Vừa lưu lúc ${lastSyncedTime.toLocaleTimeString()}` : "Dữ liệu an toàn"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onForceSync}
                aria-label="Đồng bộ ngay bây giờ"
                className="w-11 h-11 rounded-xl bg-white hover:bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
                title="Đồng bộ ngay bây giờ"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Menu Actions */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenProfile();
                  setIsDropdownOpen(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-sky-900 hover:bg-sky-50 transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-sky-600" />
                <span>Xem hồ sơ và đổi danh hiệu</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Auth Modal (Bottom Sheet on mobile <=768px, centered modal on desktop) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Đăng nhập SmartStudy Cloud"
            className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sky-200 animate-scale-up"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Modal Header with solid high-contrast background */}
            <div className="relative bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-5 sm:p-6 text-white text-center overflow-hidden">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng cửa sổ đăng nhập"
                className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/25 hover:bg-black/35 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-2.5 shadow-inner border border-white/30">
                <Cloud className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
              </div>

              <h2 className="text-lg sm:text-xl font-display font-black tracking-tight">
                Đăng nhập SmartStudy Cloud
              </h2>
              <p className="text-sm text-sky-100 font-medium mt-1">
                Lưu trữ tiến độ vĩnh viễn và đồng bộ trên mọi thiết bị
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Feature Highlights */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-sky-950">Đồng bộ đám mây tức thì</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Giữ nguyên điểm XP, Xu Tri Thức, Chuỗi ngày học và bài tập trên mọi thiết bị.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-sky-950">Vinh danh trên Bảng Vàng</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Ghi danh thứ hạng thật của bạn trên Bảng Vàng toàn trường và cùng khối lớp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error banner if any */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Stacked Action Buttons (1 per row, full-width, >= 48px) */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSignIn(false)}
                  disabled={isLoggingIn}
                  className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-300 hover:border-sky-500 rounded-2xl shadow-xs text-slate-800 font-black text-base transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-sky-600 shrink-0" />
                      <span>Đang kết nối Google...</span>
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="Google" 
                        className="w-5 h-5 shrink-0" 
                      />
                      <span>Tiếp tục với Google</span>
                    </>
                  )}
                </button>

                {showRedirectOption && (
                  <button
                    type="button"
                    onClick={() => handleSignIn(true)}
                    disabled={isLoggingIn}
                    className="w-full min-h-[48px] py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Globe className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Đăng nhập Chuyển Trang (Điện thoại)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full min-h-[48px] py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

