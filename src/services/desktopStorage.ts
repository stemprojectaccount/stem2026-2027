/**
 * MODULE: Desktop Direct File Storage
 * Phụ trách bởi: ANTIGRAVITY 1 (Kiến trúc sư trưởng & Điều phối)
 * Tự động lưu trữ dữ liệu học tập & cấu hình trực tiếp vào thư mục máy tính người dùng
 */

const STORAGE_PREFIX = "APP_LOCAL_DATA_";

export interface DesktopStorageInterface {
  saveUserData(fileName: string, dataPayload: unknown): Promise<boolean>;
  loadUserData<T = unknown>(fileName: string, defaultValue?: T): Promise<T>;
}

export const desktopStorage: DesktopStorageInterface = {
  /**
   * Kiểm tra nếu đang chạy trong môi trường Desktop (Electron / Tauri / Node)
   * thì ghi file trực tiếp vào thư mục máy tính, nếu trên Web thì fallback về LocalStorage / IndexedDB
   */
  async saveUserData(fileName: string, dataPayload: unknown): Promise<boolean> {
    try {
      const serialized = JSON.stringify(dataPayload, null, 2);

      // 1. Cầu nối IPC window.desktopAPI (Desktop App standard)
      if (typeof window !== "undefined" && (window as any).desktopAPI?.writeLocalFile) {
        return await (window as any).desktopAPI.writeLocalFile(`${fileName}.json`, serialized);
      }

      // 2. Cầu nối IPC window.smartstudyDesktop?.localData
      if (typeof window !== "undefined" && (window as any).smartstudyDesktop?.localData?.writeFile) {
        try {
          await (window as any).smartstudyDesktop.localData.writeFile("app_data", `${fileName}.json`, serialized);
          return true;
        } catch {
          // fallback to backups / documents if app_data folder is not yet set up
          try {
            await (window as any).smartstudyDesktop.localData.writeFile("backups", `${fileName}.json`, serialized);
            return true;
          } catch (e) {
            console.warn("[DesktopStorage] smartstudyDesktop IPC write fallback:", e);
          }
        }
      }

      // 3. Fallback an toàn vào LocalStorage
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`${STORAGE_PREFIX}${fileName}`, serialized);
        return true;
      }
    } catch (err) {
      console.error(`[DesktopStorage] Lỗi khi lưu dữ liệu vào ${fileName}:`, err);
    }
    return false;
  },

  async loadUserData<T = unknown>(fileName: string, defaultValue: T = null as unknown as T): Promise<T> {
    try {
      // 1. Cầu nối IPC window.desktopAPI
      if (typeof window !== "undefined" && (window as any).desktopAPI?.readLocalFile) {
        const raw = await (window as any).desktopAPI.readLocalFile(`${fileName}.json`);
        if (raw) return JSON.parse(raw);
      }

      // 2. Cầu nối IPC window.smartstudyDesktop?.localData
      if (typeof window !== "undefined" && (window as any).smartstudyDesktop?.localData?.readFile) {
        try {
          const res = await (window as any).smartstudyDesktop.localData.readFile("app_data", `${fileName}.json`);
          if (res) return JSON.parse(res);
        } catch {
          try {
            const resBackup = await (window as any).smartstudyDesktop.localData.readFile("backups", `${fileName}.json`);
            if (resBackup) return JSON.parse(resBackup);
          } catch {
            // pass through to localStorage
          }
        }
      }

      // 3. Fallback an toàn vào LocalStorage
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${fileName}`);
        if (raw) return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[DesktopStorage] Không thể đọc file ${fileName}, sử dụng giá trị mặc định:`, err);
    }
    return defaultValue;
  }
};

export default desktopStorage;
