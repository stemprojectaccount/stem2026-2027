import mammoth from 'mammoth';
import { classifyUploadedFile } from './translationHelpers';

export interface LoadedDocument {
  ok: boolean;
  text?: string;
  fileName: string;
  error?: string;
}

/**
 * Loads plain text (.txt, .md) or Word (.docx) files directly in the browser.
 */
export async function loadDocumentFile(file: File): Promise<LoadedDocument> {
  const kind = classifyUploadedFile(file.name, file.type);

  if (kind === 'legacy-doc') {
    return {
      ok: false,
      fileName: file.name,
      error: `Tệp "${file.name}" ở định dạng Word cũ (.doc). Vui lòng lưu lại thành .docx rồi tải lên.`,
    };
  }

  if (kind === 'unsupported') {
    return {
      ok: false,
      fileName: file.name,
      error: `Không hỗ trợ tệp "${file.name}". Vui lòng chọn tệp Word (.docx), .txt hoặc .md.`,
    };
  }

  if (kind === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extracted = result.value.replace(/\r\n?/g, '\n').trim();
      if (!extracted) {
        return {
          ok: false,
          fileName: file.name,
          error: `Tệp Word "${file.name}" không có nội dung văn bản để trích xuất.`,
        };
      }
      return {
        ok: true,
        text: extracted,
        fileName: file.name,
      };
    } catch {
      return {
        ok: false,
        fileName: file.name,
        error: `Không thể đọc tệp Word "${file.name}". Tệp có thể bị hỏng hoặc đặt mật khẩu.`,
      };
    }
  }

  try {
    const content = await file.text();
    return {
      ok: true,
      text: content,
      fileName: file.name,
    };
  } catch {
    return {
      ok: false,
      fileName: file.name,
      error: `Không thể đọc tệp "${file.name}". Vui lòng thử lại.`,
    };
  }
}
