import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { 
  Upload, 
  Trash2, 
  RotateCcw, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  RefreshCw,
  Camera
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export interface AvatarManagerProps {
  currentAvatarUrl?: string;
  displayName?: string;
  selectedAvatarIdx?: number;
  level?: number;
  userId?: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
  className?: string;
  compact?: boolean;
}

export interface AvatarManagerHandle {
  openFilePicker: () => void;
  confirmDelete: () => void;
  restoreDefault: () => Promise<void>;
  cancelPreview: () => void;
  uploadSelectedFile: () => Promise<void>;
  getSelectedFile: () => File | null;
  getPreviewUrl: () => string | null;
}

export const CUSTOM_AVATAR_CACHE_KEY = "smart_study_custom_avatar_data_v1";

/**
 * Compresses and center-crops an image file into a crisp 256x256 JPEG Data URL (~12-25KB)
 * so it persists reliably in localStorage and Firestore progress without relying solely on ephemeral disk storage.
 */
export async function compressAvatarToDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(String(reader.result || ""));
            return;
          }
          // Fill white background for transparent PNGs
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, maxSize, maxSize);

          // Center-crop square
          const minSide = Math.min(img.width, img.height);
          const sx = Math.max(0, (img.width - minSide) / 2);
          const sy = Math.max(0, (img.height - minSide) / 2);
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
          resolve(dataUrl);
        } catch (err) {
          resolve(String(reader.result || ""));
        }
      };
      img.onerror = () => reject(new Error("Không thể đọc dữ liệu hình ảnh."));
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh từ thiết bị."));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads the avatar to /api/upload-avatar AND caches a compressed 256x256 Data URL in localStorage.
 * Returns a persistent avatar URL (preferring the self-contained Data URL so it never disappears on container restart).
 */
export async function uploadAndPersistAvatarFile(
  file: File,
  userId: string = "student",
  oldAvatarUrl?: string
): Promise<string> {
  const compactDataUrl = await compressAvatarToDataUrl(file, 256);
  try {
    localStorage.setItem(CUSTOM_AVATAR_CACHE_KEY, compactDataUrl);
  } catch {}

  try {
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("userId", userId);
    if (oldAvatarUrl && oldAvatarUrl.startsWith("/uploads/avatars/")) {
      formData.append("oldAvatarUrl", oldAvatarUrl);
    }

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (res.ok && data?.success && data?.avatarUrl) {
      return compactDataUrl || (data.avatarUrl as string);
    }
  } catch (err) {
    console.warn("Server avatar upload fallback to persistent Data URL:", err);
  }

  return compactDataUrl;
}

/**
 * Service: safely delete custom uploaded avatar from backend disk
 */
export async function deleteAvatarOnServer(avatarUrl: string): Promise<boolean> {
  try {
    localStorage.removeItem(CUSTOM_AVATAR_CACHE_KEY);
  } catch {}
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) return true;
  try {
    const res = await fetch("/api/delete-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl })
    });
    return res.ok;
  } catch (err) {
    console.warn("Could not delete avatar file on server:", err);
    return false;
  }
}

/**
 * Service: restore default system avatar without page reload
 */
export async function restoreDefaultAvatar(
  currentAvatarUrl: string,
  onAvatarUpdated: (newAvatarUrl: string) => void
): Promise<void> {
  try {
    localStorage.removeItem(CUSTOM_AVATAR_CACHE_KEY);
  } catch {}
  if (currentAvatarUrl.startsWith("/uploads/avatars/")) {
    await deleteAvatarOnServer(currentAvatarUrl);
  }
  onAvatarUpdated("mascot:0");
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FORBIDDEN_EXTENSIONS = [
  ".exe", ".bat", ".js", ".svg", ".gif", 
  ".pdf", ".zip", ".sh", ".php", ".html", ".py"
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates selected avatar file against size, empty content, extension, and MIME type rules.
 */
export function validateAvatarFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: "Chưa chọn tệp ảnh nào." };
  }

  // 1. Check empty file (0 bytes)
  if (file.size === 0) {
    return { 
      valid: false, 
      error: "Tệp được chọn là tệp rỗng (0 bytes). Vui lòng chọn tệp ảnh thực tế!" 
    };
  }

  // 2. Check maximum size (10MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `Kích thước tệp (${sizeInMB}MB) vượt quá giới hạn tối đa cho phép (10MB)! Vui lòng chọn ảnh nhỏ hơn.` 
    };
  }

  // 3. Check extension
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return { 
      valid: false, 
      error: `Định dạng tệp ${ext} bị từ chối vì lý do an toàn bảo mật!` 
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { 
      valid: false, 
      error: `Định dạng ${ext} không được hỗ trợ. Chỉ cho phép các định dạng ảnh: JPG, JPEG, PNG, WEBP!` 
    };
  }

  // 4. Check MIME type
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return { 
      valid: false, 
      error: `Loại tệp (${mime || "không xác định"}) không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WEBP!` 
    };
  }

  return { valid: true };
}

export const AvatarManager = forwardRef<AvatarManagerHandle, AvatarManagerProps>(function AvatarManager({
  currentAvatarUrl = "mascot:0",
  displayName = "Học sinh",
  selectedAvatarIdx = 0,
  level = 1,
  userId = "student",
  onAvatarUpdated,
  className = "",
  compact = false
}: AvatarManagerProps, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Selection and preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Network & notification states
  const [uploading, setUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ 
    type: "success" | "error"; 
    text: string 
  } | null>(null);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Auto revoke preview object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file inspection, preview setup & immediate persistence
  const processSelectedFile = useCallback(async (file: File) => {
    setStatusMessage(null);

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setStatusMessage({
        type: "error",
        text: validation.error || "Tệp ảnh không hợp lệ."
      });
      return;
    }

    // Revoke previous preview if any
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setUploading(true);

    try {
      const newUrl = await uploadAndPersistAvatarFile(file, userId, currentAvatarUrl);
      onAvatarUpdated(newUrl);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setStatusMessage({
        type: "success",
        text: "Đã cập nhật và lưu ảnh đại diện mới thành công!"
      });
    } catch (err: any) {
      console.error("Lỗi tải lên avatar:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Không thể xử lý ảnh đại diện. Vui lòng thử lại!"
      });
    } finally {
      setUploading(false);
    }
  }, [previewUrl, userId, currentAvatarUrl, onAvatarUpdated]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processSelectedFile(file);
    }
    // Reset file input value so selecting the same file again triggers change
    e.target.value = "";
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Cancel chosen preview before upload
  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setStatusMessage(null);
  };

  // 1. Upload chosen avatar to backend & persist compressed Data URL
  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      setStatusMessage({
        type: "error",
        text: "Vui lòng chọn một tệp ảnh từ thiết bị trước khi nhấn Lưu Avatar!"
      });
      return;
    }

    // Double check validation before request
    const validation = validateAvatarFile(selectedFile);
    if (!validation.valid) {
      setStatusMessage({
        type: "error",
        text: validation.error || "Tệp ảnh không hợp lệ."
      });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const newUrl = await uploadAndPersistAvatarFile(selectedFile, userId, currentAvatarUrl);
      onAvatarUpdated(newUrl);

      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);

      setStatusMessage({
        type: "success",
        text: "Cập nhật ảnh đại diện mới thành công!"
      });
    } catch (err: any) {
      console.error("Lỗi tải lên avatar:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Lỗi kết nối khi tải lên ảnh đại diện. Vui lòng thử lại!"
      });
    } finally {
      setUploading(false);
    }
  };

  // 2. Delete custom avatar (reverts to default)
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);

    if (currentAvatarUrl.startsWith("mascot:")) {
      setStatusMessage({
        type: "success",
        text: "Tài khoản hiện đang sử dụng hình đại diện mặc định!"
      });
      return;
    }

    try {
      localStorage.removeItem(CUSTOM_AVATAR_CACHE_KEY);
      if (currentAvatarUrl.startsWith("/uploads/avatars/")) {
        await fetch("/api/delete-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: currentAvatarUrl })
        });
      }
    } catch (e) {
      console.warn("Không thể xóa tệp avatar cũ trên máy chủ:", e);
    }

    const defaultAvatar = "mascot:0";
    onAvatarUpdated(defaultAvatar);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);

    setStatusMessage({
      type: "success",
      text: "Đã xóa avatar và đặt lại về hình đại diện mặc định!"
    });
  };

  // 3. Restore default avatar (immediate, no upload)
  const handleRestoreDefault = async () => {
    if (currentAvatarUrl === "mascot:0" && !previewUrl) {
      setStatusMessage({
        type: "success",
        text: "Tài khoản đang sử dụng avatar mặc định ban đầu!"
      });
      return;
    }

    try {
      localStorage.removeItem(CUSTOM_AVATAR_CACHE_KEY);
      if (currentAvatarUrl.startsWith("/uploads/avatars/")) {
        await fetch("/api/delete-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: currentAvatarUrl })
        });
      }
    } catch (e) {}

    const defaultAvatar = "mascot:0";
    onAvatarUpdated(defaultAvatar);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);

    setStatusMessage({
      type: "success",
      text: "Đã khôi phục avatar mặc định của hệ thống thành công!"
    });
  };

  // Expose imperative control handle to parent components (such as Profile)
  useImperativeHandle(ref, () => ({
    openFilePicker: () => {
      fileInputRef.current?.click();
    },
    confirmDelete: () => {
      setShowDeleteConfirm(true);
    },
    restoreDefault: async () => {
      await handleRestoreDefault();
    },
    cancelPreview: () => {
      handleCancelPreview();
    },
    uploadSelectedFile: async () => {
      await handleUploadAvatar();
    },
    getSelectedFile: () => selectedFile,
    getPreviewUrl: () => previewUrl
  }), [handleRestoreDefault, handleUploadAvatar, previewUrl, selectedFile]);

  const isCustomUploadedAvatar =
    currentAvatarUrl.startsWith("/uploads/avatars/") ||
    currentAvatarUrl.startsWith("http") ||
    currentAvatarUrl.startsWith("data:image/");

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Avatar Selection & Preview Container */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all ${
          isDragging 
            ? "border-sky-500 bg-sky-100/90 ring-4 ring-sky-300/40" 
            : "border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-white"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar Box with Live Preview and Status Tag */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-3 border-sky-400 shadow-md bg-white flex items-center justify-center relative cursor-pointer group"
              title="Nhấn để chọn ảnh mới từ thiết bị"
            >
              <UserAvatar
                avatarUrl={previewUrl || currentAvatarUrl}
                displayName={displayName}
                selectedAvatarIdx={selectedAvatarIdx}
                level={level}
                size={112}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-sky-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black gap-1 text-center p-1">
                <Camera className="w-5 h-5 text-white animate-bounce-subtle" />
                <span>Đổi Ảnh</span>
              </div>

              {/* Tag if showing unsaved preview */}
              {previewUrl && (
                <div className="absolute top-0 inset-x-0 bg-amber-500 text-amber-950 font-black text-[9px] py-0.5 text-center uppercase tracking-wider shadow-xs">
                  Xem Trước
                </div>
              )}
            </div>

            <span className="mt-2 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-200/80 text-sky-800 border border-sky-300/60">
              Cấp {level}
            </span>
          </div>

          {/* Details & Controls */}
          <div className="space-y-3 flex-1 text-center sm:text-left min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h4 className="font-display font-black text-base text-sky-950">
                  {displayName}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isCustomUploadedAvatar 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-sky-100 text-sky-800 border-sky-200"
                }`}>
                  {isCustomUploadedAvatar ? "Ảnh tải lên" : "Linh vật mặc định"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kéo thả ảnh vào đây hoặc bấm nút để chọn tệp từ máy tính / điện thoại.
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Cho phép: JPG, PNG, WEBP • Kích thước tối đa: 10MB
              </p>
            </div>

            {/* Actions Buttons Group */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* 1. [ Chọn Ảnh ] */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn Ảnh</span>
              </button>

              {/* 2. [ Lưu Avatar ] (shown when new file is picked) */}
              {selectedFile && (
                <>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleUploadAvatar}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-75 animate-pulse"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Lưu Avatar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    disabled={uploading}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    title="Hủy xem trước ảnh này"
                  >
                    Hủy Chọn
                  </button>
                </>
              )}

              {/* 3. [ Xóa Avatar ] */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Xóa avatar đang dùng"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa Avatar</span>
              </button>

              {/* 4. [ Khôi phục Avatar Mặc Định ] */}
              <button
                type="button"
                onClick={handleRestoreDefault}
                className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs border border-sky-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Đặt lại linh vật mặc định của hệ thống"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-700" />
                <span>Khôi phục Mặc Định</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback / Alert Banner */}
        {statusMessage && (
          <div className={`mt-3.5 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}>
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete Avatar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-rose-300 space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display font-black text-lg text-slate-900">
                Xác nhận xóa avatar
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Bạn có chắc muốn xóa avatar hiện tại không?
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AvatarManager;
