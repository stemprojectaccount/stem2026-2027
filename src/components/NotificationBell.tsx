import React, { useState, useEffect, useRef } from "react";
import { Bell, X, ArrowRight, CheckCircle2 } from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  actionTab?: string;
  actionText?: string;
  timestamp: Date;
}

interface NotificationBellProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (tab?: string) => void;
}

export default function NotificationBell({
  notification,
  isOpen,
  onToggle,
  onClose,
  onAction
}: NotificationBellProps) {
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // 10-second countdown display for active notification
  useEffect(() => {
    if (!isOpen || !notification) {
      setTimeLeft(10);
      return;
    }
    setTimeLeft(10);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, notification]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={onToggle}
        aria-label="Thông báo"
        className={`w-9 h-9 rounded-xl border flex items-center justify-center relative cursor-pointer transition-all ${
          isOpen
            ? "bg-sky-200 border-sky-400 text-sky-900 shadow-sm"
            : notification
            ? "bg-sky-100/90 hover:bg-sky-200/90 border-sky-300 text-sky-700 shadow-2xs"
            : "hover:bg-sky-200/80 border-sky-300/60 text-sky-700"
        }`}
        title="Thông báo hệ thống"
      >
        <Bell className={`w-4.5 h-4.5 ${notification ? "animate-bounce text-sky-600" : ""}`} />
        
        {/* Pulsing indicator when there is an active notification */}
        {notification && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping opacity-75" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
          </>
        )}
      </button>

      {/* Dropdown Popover attached directly to the Bell */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-92 z-50 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-sky-300/80 shadow-2xl shadow-sky-950/15 animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-black tracking-tight">Chuông thông báo</span>
            </div>

            <div className="flex items-center gap-2">
              {notification && (
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-sky-100 flex items-center gap-1">
                  <span>Tự đóng {timeLeft}s</span>
                </span>
              )}
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer text-white"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 10-second shrinking countdown progress bar */}
          {notification && (
            <div className="w-full bg-sky-200/50 h-1 overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all ease-linear"
                style={{
                  width: `${(timeLeft / 10) * 100}%`,
                  transitionDuration: "1000ms"
                }}
              />
            </div>
          )}

          {/* Content Area */}
          <div className="p-4">
            {notification ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0 text-sky-600 mt-0.5 shadow-2xs">
                    <Bell className="w-4.5 h-4.5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 pb-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                        SmartStudy
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Vừa xong
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-sky-950 leading-snug">
                      {notification.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      {notification.body}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-sky-100 flex items-center justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  {notification.actionTab && (
                    <button
                      onClick={() => {
                        onAction(notification.actionTab);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 group"
                    >
                      <span>{notification.actionText || "Xem Ngay"}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-sky-950">Không có thông báo mới</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Em đã nắm bắt đầy đủ thông tin học tập hôm nay!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
