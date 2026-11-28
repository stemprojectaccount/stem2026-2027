import React, { useEffect, useRef, useState } from "react";
import { useWordbookDueCount } from "../features/dictionary/useDueCount";
import { createPortal } from "react-dom";
import { MessageSquareText, Home, Compass, BookOpen, Gamepad2, Trophy, Layers, Zap, Headphones, ShoppingBag, Settings, User, GraduationCap, ShieldCheck, MessageSquare, Plus, Accessibility, Sparkles, PanelLeftClose, X, Download, PencilRuler, Languages, Medal, ChevronDown, ArrowRight, Wrench } from "lucide-react";
import { isDesktopApp, isNativeMobileApp } from "../firebase";
import { UserProgress } from "../types";
import { useSupportMode, useSupportNeed } from "../lib/support/profile";
import { openTool } from "../features/tools/openTool";
import { SyncStatus } from "../hooks/useFirestoreSync";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  progress: UserProgress;
  user?: any;
  syncStatus?: SyncStatus;
  onOpenAuthPortal?: () => void;
  selectedAvatarIdx?: number;
  onOpenAIChat?: () => void;
  onOpenSettings?: () => void;
  lessonsCount?: number;
  gamesCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  isDesktopDocked?: boolean;
  isDesktopVisible?: boolean;
  onToggleDesktopVisible?: () => void;
}

interface QuestoraNavItem {
  id: string;
  label: string;
  countBadge?: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: "settings" | "ai-chat";
}

// Menu kiểu "khung công cụ xổ xuống" (giống IOE): mục cha bấm vào thì mở/thu các mục con.
interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: QuestoraNavItem[];
}
type NavEntry = { kind: "item"; item: QuestoraNavItem } | { kind: "group"; group: NavGroup };

const GROUPS_KEY = "smartstudy_sidebar_groups_v1";
const DEFAULT_OPEN_GROUPS = ["hoc-tap", "luyen-tap"];

function loadOpenGroups(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(GROUPS_KEY) || "null");
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v;
  } catch {
    // bộ nhớ bị chặn: dùng mặc định
  }
  return DEFAULT_OPEN_GROUPS;
}

function Sidebar({
  activeTab,
  setActiveTab,
  progress,
  onOpenAIChat,
  onOpenSettings,
  lessonsCount = 10,
  gamesCount = 8,
  isOpen = false,
  onClose,
  isDesktopDocked = false,
  isDesktopVisible = true,
  onToggleDesktopVisible,
}: SidebarProps) {
  // Keep the latest onClose without re-running the open/close effect on every parent render
  // (re-running it would call history.back() and instantly close the sheet).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || isDesktopDocked) return;
    const onClose = () => onCloseRef.current?.();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    let pushedState = false;
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      window.history.pushState({ mobileSheet: "sidebar-more" }, "");
      pushedState = true;
    }

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      if (pushedState && window.history.state?.mobileSheet === "sidebar-more") {
        window.history.back();
      }
    };
  }, [isOpen, isDesktopDocked]);

  const wordsDue = useWordbookDueCount();
  const supportMode = useSupportMode();
  const supportNeed = useSupportNeed();
  const navItems: QuestoraNavItem[] = [
    {
      id: "dashboard",
      label: "Trang chủ",
      icon: Home,
    },
    {
      id: "knowledge-map",
      label: "Khám phá",
      countBadge: 328,
      icon: Compass,
    },
    {
      id: "review",
      label: "Thư viện của tôi",
      countBadge: lessonsCount,
      icon: BookOpen,
    },
    {
      id: "games",
      label: "Trò chơi",
      countBadge: gamesCount,
      icon: Gamepad2,
    },
    {
      id: "quiz",
      label: "Luyện đề",
      icon: Trophy,
    },
    {
      id: "flashcards",
      label: "Flashcard",
      icon: Layers,
    },
    {
      id: "dictionary",
      label: "Tra từ và Dịch",
      countBadge: wordsDue > 0 ? wordsDue : undefined,
      icon: Languages,
    },
    {
      id: "geomath",
      label: "Vẽ hình nháp",
      icon: PencilRuler,
    },
    {
      id: "tools",
      label: "Hộp công cụ",
      countBadge: 12,
      icon: Wrench,
    },
    {
      id: "study-lock",
      label: "Khoá học tập",
      icon: ShieldCheck,
    },
    {
      id: "pk",
      label: "Đấu trường",
      icon: Zap,
    },
    {
      id: "podcast",
      label: "Podcast",
      icon: Headphones,
    },
    {
      id: "shop",
      label: "Cửa hàng quà",
      icon: ShoppingBag,
    },
    {
      id: "parent-teacher",
      label: "Báo cáo Học tập",
      icon: GraduationCap,
    },
    // Only offered on the website: inside the installed apps there is nothing to download
    ...(isNativeMobileApp() || isDesktopApp()
      ? []
      : [{ id: "download-app", label: "Tải app về máy", icon: Download } as QuestoraNavItem]),
    // its own entry right under Trang chủ: a student who skipped the first-run question finds it again easily
    // (the support card is the first thing in Cài đặt)
    {
      id: "support-trigger",
      label: "Hỗ trợ học tập",
      icon: Accessibility,
      isAction: "settings",
    },
    {
      id: "settings-trigger",
      label: "Cài đặt",
      icon: Settings,
      isAction: "settings",
    },
    // hard of hearing: type instead of talk, face to face (the two-way conversation board)
    {
      id: "talk-tool",
      label: "Gõ thay nói",
      icon: MessageSquareText,
    },
    {
      id: "ai-chat-trigger",
      label: "Trợ lý AI",
      icon: MessageSquare,
      isAction: "ai-chat",
    },
    {
      id: "profile",
      label: "Tài khoản",
      icon: User,
    },
    {
      id: "leaderboard",
      label: "Bảng vàng",
      icon: Medal,
    },
  ];

  const handleItemClick = (item: QuestoraNavItem) => {
    if (item.id === "talk-tool") {
      openTool("conversation");
      if (onClose) onClose();
      return;
    }
    if (item.isAction === "settings" && onOpenSettings) {
      if (onClose) onClose();
      // the phone sheet closes with history.back(); its popstate would also close Settings, so open it after
      window.setTimeout(onOpenSettings, onClose && window.innerWidth <= 768 ? 300 : 0);
      return;
    }
    if (item.isAction === "ai-chat" && onOpenAIChat) {
      onOpenAIChat();
      if (onClose) onClose();
      return;
    }
    setActiveTab(item.id);
    if (onClose) onClose();
  };

  const isItemActive = (item: QuestoraNavItem) =>
    !item.isAction &&
    (item.id === "review" ? ["review", "reading", "essay"].includes(activeTab) : activeTab === item.id);

  // Gom các mục thành nhóm (giữ nguyên id tab; mục nào không có thì nhóm tự bỏ qua).
  const byId = new Map(navItems.map((i) => [i.id, i] as const));
  const pick = (...ids: string[]) => ids.map((id) => byId.get(id)).filter((i): i is QuestoraNavItem => !!i);
  // Support mode: one short flat list of the core study screens, no games / shop / ranking / extra tools
  const navEntries: NavEntry[] = supportMode
    ? pick(
        "dashboard", "review", "quiz", "flashcards",
        // hard of hearing: no audio podcast, the typing board instead
        ...(supportNeed === "hearing" ? ["talk-tool"] : ["podcast"]),
        "ai-chat-trigger", "support-trigger", "profile", "settings-trigger"
      ).map(
        (item): NavEntry => ({ kind: "item", item })
      )
    : (
    [
      { kind: "item", item: byId.get("dashboard")! },
      { kind: "item", item: byId.get("support-trigger")! },
      { kind: "group", group: { id: "hoc-tap", label: "Học tập", icon: BookOpen, items: pick("knowledge-map", "review", "podcast", "ai-chat-trigger") } },
      { kind: "group", group: { id: "luyen-tap", label: "Luyện tập", icon: Trophy, items: pick("quiz", "flashcards", "pk", "leaderboard") } },
      { kind: "group", group: { id: "giai-tri", label: "Giải trí", icon: Gamepad2, items: pick("games", "shop") } },
      { kind: "group", group: { id: "cong-cu", label: "Công cụ", icon: PencilRuler, items: pick("tools", "dictionary", "geomath") } },
      { kind: "group", group: { id: "phu-huynh", label: "Phụ huynh", icon: GraduationCap, items: pick("parent-teacher", "study-lock") } },
      { kind: "group", group: { id: "tai-khoan", label: "Tài khoản", icon: User, items: pick("profile", "settings-trigger", "download-app") } },
    ] as NavEntry[]
  ).filter((e) => (e.kind === "item" ? !!e.item : e.group.items.length > 0));

  const [openGroups, setOpenGroups] = useState<string[]>(loadOpenGroups);
  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups));
    } catch {
      // bỏ qua
    }
  }, [openGroups]);
  // Nhóm chứa trang đang mở luôn được xổ ra.
  const activeGroup = navEntries.find(
    (e): e is { kind: "group"; group: NavGroup } => e.kind === "group" && e.group.items.some(isItemActive)
  );
  const activeGroupId = activeGroup ? activeGroup.group.id : null;
  useEffect(() => {
    if (activeGroupId) setOpenGroups((g) => (g.includes(activeGroupId) ? g : [...g, activeGroupId]));
  }, [activeGroupId]);
  const toggleGroup = (id: string) => setOpenGroups((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  // ---- Mục trong thanh bên máy tính (nền xanh đậm) ----
  const renderDesktopItem = (item: QuestoraNavItem, nested: boolean) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleItemClick(item)}
        aria-current={isActive ? "page" : undefined}
        title={item.label}
        className={`sidebar-spotlight-btn group relative w-full ${nested ? "min-h-[36px] pl-2 pr-2 py-1.5 gap-1.5" : "min-h-[40px] px-3.5 py-2 gap-2.5"} rounded-xl flex items-center justify-between text-xs sm:text-[13px] font-semibold cursor-pointer border ${
          isActive ? "bg-gradient-to-r from-[#2e5cb8] to-[#0e8a6a] text-white border-transparent shadow-sm font-bold" : "bg-transparent text-[#243c6e] border-transparent"
        }`}
      >
        <div className={`flex items-center ${nested ? "gap-2" : "gap-3"} min-w-0`}>
          <Icon
            className={`${nested ? "w-3.5 h-3.5" : "w-4 h-4"} shrink-0 transition-transform duration-150 group-hover:scale-110 ${
              isActive ? "text-white" : "text-[#2e5cb8] group-hover:text-white"
            }`}
          />
          {/* Tên dài tự xuống dòng thay vì bị cắt "…" (chữ to trên màn hình phóng 125 %) */}
          <span className="min-w-0 text-left leading-tight break-words">{item.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.countBadge !== undefined && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 border transition-colors duration-150 ${
                isActive ? "bg-white text-[#0e5e66] border-white" : "bg-white/75 text-[#243c6e] border-[#c9dcf4] group-hover:bg-white/20 group-hover:text-white"
              }`}
            >
              {item.countBadge}
            </span>
          )}
          {isActive && <ArrowRight className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />}
        </div>
      </button>
    );
  };

  // ---- Mục trong bảng "Thêm" trên điện thoại (nền trắng) ----
  const renderMobileItem = (item: QuestoraNavItem, nested: boolean) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleItemClick(item)}
        aria-current={isActive ? "page" : undefined}
        className={`w-full ${nested ? "min-h-[44px] text-[15px]" : "min-h-[48px] text-base"} px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 font-bold cursor-pointer border transition-colors ${
          isActive ? "bg-[#243c6e] text-white border-[#243c6e]" : "bg-slate-50 text-slate-800 border-slate-200/90 active:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 text-left">
          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-sky-200" : "text-[#2e5cb8]"}`} />
          <span className="leading-snug">{item.label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.countBadge !== undefined && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-sm font-mono font-bold tabular-nums shrink-0 border ${
                isActive ? "bg-white text-[#0e5e66] border-white" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {item.countBadge}
            </span>
          )}
          {isActive && <ArrowRight className="w-4 h-4 text-sky-200" aria-hidden="true" />}
        </div>
      </button>
    );
  };

  // ---- Danh sách có nhóm xổ xuống (dùng cho cả máy tính và điện thoại) ----
  const renderNav = (mobile: boolean) =>
    navEntries.map((entry) => {
      if (entry.kind === "item") return mobile ? renderMobileItem(entry.item, false) : renderDesktopItem(entry.item, false);
      const { group } = entry;
      const open = openGroups.includes(group.id);
      const hasActive = group.items.some(isItemActive);
      const panelId = `sb-group-${group.id}-${mobile ? "m" : "d"}`;
      const GroupIcon = group.icon;
      return (
        <div key={group.id}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => toggleGroup(group.id)}
            className={
              mobile
                ? `w-full min-h-[48px] px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-base font-extrabold cursor-pointer border transition-colors ${
                    hasActive && !open ? "bg-[#eef4fc] text-[#243c6e] border-[#93b8e8]" : "bg-white text-slate-900 border-slate-200 active:bg-slate-50"
                  }`
                : `sidebar-spotlight-btn group relative w-full min-h-[40px] px-3.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-xs sm:text-[13px] font-bold cursor-pointer border ${
                    hasActive && !open ? "bg-[#e6f6ef] text-[#0e5e4a] border-[#bfe8d3]" : "bg-transparent text-slate-900 border-transparent"
                  }`
            }
          >
            <div className="flex items-center gap-3 min-w-0">
              <GroupIcon className={mobile ? "w-5 h-5 shrink-0 text-[#2e5cb8]" : "w-4 h-4 shrink-0 text-[#2e5cb8] group-hover:text-white"} />
              <span className="min-w-0 text-left leading-tight break-words">{group.label}</span>
            </div>
            <ChevronDown
              className={`${mobile ? "w-5 h-5 text-slate-500" : "w-4 h-4 text-slate-500"} shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {/* Xổ xuống mượt bằng grid-rows; khi thu lại thì inert (không Tab vào được, trình đọc màn hình bỏ qua) */}
          <div
            id={panelId}
            inert={!open}
            className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className={mobile ? "pt-2 pb-1 pl-4 ml-2 border-l-2 border-slate-200 space-y-2" : "pt-1 pb-1 pl-1.5 ml-3 border-l border-[#c9dcf4] space-y-0.5"}>
                {group.items.map((item) => (mobile ? renderMobileItem(item, true) : renderDesktopItem(item, true)))}
              </div>
            </div>
          </div>
        </div>
      );
    });

  const renderSidebarContent = (isDrawer: boolean) => (
    <aside
      aria-label="Thanh điều hướng SmartStudy"
      className={`${
        isDrawer ? "w-[260px] max-w-[85vw] flex" : "hidden md:flex w-[clamp(212px,16vw,244px)]"
      } h-[100dvh] bg-gradient-to-b from-[#dceafd] via-[#e2f1f5] to-[#d6f2e3] text-slate-900 flex-col justify-between shrink-0 select-none border-r border-[#c3dcef] shadow-sm overflow-hidden`}
    >
      {/* Top Brand Header + Student-Friendly CTA Button */}
      <div className="p-4 space-y-4 shrink-0 border-b border-[#c9ddef] bg-white/55">
        <div className="sidebar-brand-row flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("dashboard");
              if (onClose) onClose();
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <img
              src="/logo-mark.png"
              alt=""
              width={36}
              height={36}
              draggable={false}
              className="w-9 h-9 rounded-xl shrink-0 shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-black text-xl tracking-tight text-[#243c6e]">
              Smart<span className="text-[#13808a]">Study</span>
            </span>
          </button>

          {isDrawer ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng thanh điều hướng"
              className="w-11 h-11 rounded-xl bg-[#eef4fc] hover:bg-[#e3edfa] text-[#243c6e] border border-[#d8e5f7] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            onToggleDesktopVisible && (
              <button
                type="button"
                onClick={onToggleDesktopVisible}
                title="Thu gọn / Ẩn thanh bên trái"
                aria-label="Thu gọn thanh bên trái"
                className="w-8 h-8 shrink-0 rounded-lg bg-[#eef4fc] hover:bg-[#e3edfa] text-[#243c6e] border border-[#d8e5f7] flex items-center justify-center cursor-pointer transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Student-Friendly Primary CTA Button */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("learn");
            if (onClose) onClose();
          }}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3563b8] to-[#23806f] hover:from-[#3e6fc9] hover:to-[#2a9480] text-white border border-emerald-200/30 whitespace-nowrap font-extrabold text-xs sm:text-[13px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-sky-200 shrink-0" />
          <span>Học bài và Ôn tập</span>
        </button>
      </div>

      {/* Navigation Links List (100% Pure CSS Spotlight, 0 React Re-renders) */}
      <nav
        aria-label="Danh mục chính"
        className="sidebar-spotlight-nav sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1"
      >
        {renderNav(false)}
      </nav>

      {/* Bottom Medium-Blue Mascot Card */}
      {/* Hidden on short screens so every menu item stays visible */}
      <div className={`p-3 shrink-0 border-t border-[#c9ddef] bg-white/40 [@media(max-height:960px)]:hidden ${supportMode ? "hidden" : ""}`}>
        <div
          onClick={() => {
            setActiveTab("games");
            if (onClose) onClose();
          }}
          className="relative rounded-2xl bg-gradient-to-br from-[#2e5cb8] to-[#13808a] p-3.5 overflow-hidden border border-[#c9dcf4] cursor-pointer group shadow-xs"
        >
          <p className="text-xs font-bold text-white leading-snug max-w-[130px] relative z-10">
            Biến việc học thành niềm vui mỗi ngày
          </p>
          <p className="text-[10px] font-semibold text-sky-200 mt-0.5 relative z-10">
            Lv.{progress.level || 1} · {progress.points || 0} XP
          </p>

          {/* Cute Mascot Illustration in Balanced Blue & White at Bottom Right */}
          <svg
            viewBox="0 0 120 90"
            className="w-20 h-16 absolute -bottom-1 -right-1 opacity-95 group-hover:scale-105 transition-transform"
            aria-hidden="true"
          >
            <polygon points="28,38 38,10 55,32" fill="#60a5fa" />
            <polygon points="92,38 82,10 65,32" fill="#60a5fa" />
            <polygon points="24,20 60,6 96,20 60,32" fill="#1e3a8a" />
            <ellipse cx="60" cy="56" rx="34" ry="28" fill="#dbeafe" />
            <ellipse cx="60" cy="64" rx="25" ry="18" fill="#ffffff" />
            <circle cx="47" cy="52" r="10" fill="#ffffff" stroke="#1e3a8a" strokeWidth="3" />
            <circle cx="73" cy="52" r="10" fill="#ffffff" stroke="#1e3a8a" strokeWidth="3" />
            <line x1="57" y1="52" x2="63" y2="52" stroke="#1e3a8a" strokeWidth="3" />
            <circle cx="47" cy="52" r="3.5" fill="#1e3a8a" />
            <circle cx="73" cy="52" r="3.5" fill="#1e3a8a" />
          </svg>
        </div>
      </div>
    </aside>
  );

  // Desktop Docked Mode (Permanent Left Sidebar like Questora on >= 769px)
  if (isDesktopDocked) {
    if (!isDesktopVisible) return null;
    return renderSidebarContent(false);
  }

  // Mobile Bottom Sheet / Drawer Mode (when opened via 'Thêm')
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center">
      <div
        className="fixed inset-0 bg-slate-950/70 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Mobile / Touch Bottom Sheet (works seamlessly across 100%, 75%, 50% zoom) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Danh mục tính năng mở rộng"
        className="relative z-10 w-full max-w-2xl mx-auto max-h-[85dvh] bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" width={36} height={36} draggable={false} className="w-9 h-9 rounded-xl shrink-0" />
            <div>
              <h2 className="font-display font-black text-base text-slate-900 leading-tight">
                Thêm tính năng và Công cụ
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Lv.{progress.level || 1} · {progress.points || 0} XP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng Thêm"
            className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Single scroll container for mobile bottom sheet */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("learn");
              if (onClose) onClose();
            }}
            className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#2e5cb8] text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xs cursor-pointer active:scale-98"
          >
            <Sparkles className="w-5 h-5 text-sky-200 shrink-0" />
            <span>Học bài mới và Ôn tập cùng AI</span>
          </button>

          <div className="grid grid-cols-1 gap-2">{renderNav(true)}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default React.memo(Sidebar);

