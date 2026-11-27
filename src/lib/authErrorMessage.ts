// Turns Firebase / sign-in error codes into plain Vietnamese for students.
// Raw messages such as "Firebase: Error (auth/...)" are never shown.
export function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy bấm nút \"Đăng nhập chuyển trang\" bên dưới.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Bạn đã đóng cửa sổ Google trước khi xong. Bấm đăng nhập để thử lại.";
    case "auth/network-request-failed":
      return "Mất kết nối mạng. Kiểm tra Wi‑Fi hoặc 4G rồi thử lại.";
    case "auth/operation-not-supported-in-this-environment":
      return "Trình duyệt này không mở được cửa sổ đăng nhập. Hãy dùng \"Đăng nhập chuyển trang\".";
    case "auth/unauthorized-domain":
      return "Phiên bản app này chưa được cấp phép đăng nhập Google. Bạn vẫn học được ở chế độ Khách.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị khoá. Hãy liên hệ thầy cô hoặc người quản lý app.";
    case "smartstudy/google-not-configured":
      return "Đăng nhập Google trong app chưa được cài đặt xong. Bạn vẫn học được ở chế độ Khách.";
    case "smartstudy/desktop-login-timeout":
      return "Chưa thấy bạn đăng nhập trong trình duyệt. Bấm đăng nhập để thử lại.";
    default:
      return "Chưa đăng nhập được. Hãy thử lại sau ít phút, hoặc vào học ở chế độ Khách.";
  }
}

/** Errors that mean "the user backed out", which need no red error box. */
export function isUserCancelled(code: string, message = ""): boolean {
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    /cancel/i.test(message)
  );
}
