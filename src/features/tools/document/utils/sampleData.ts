import { ImageTranslationResult, PdfConversionResult } from '../types/document';

export function createSamplePdfConversionResult(): PdfConversionResult {
  return {
    title: 'Kế hoạch Triển khai Học kỳ II — Năm học 2025–2026',
    sourceFileName: 'Ke-hoach-hoc-ky-II.pdf',
    fileSizeBytes: 248320,
    detectedLanguage: 'Tiếng Việt',
    targetLanguage: null,
    pageCountEstimate: 2,
    createdAt: new Date().toISOString(),
    blocks: [
      {
        id: 'sample-1',
        type: 'heading1',
        text: 'Kế hoạch Triển khai Học kỳ II — Năm học 2025–2026',
      },
      {
        id: 'sample-2',
        type: 'paragraph',
        text: 'Tài liệu mẫu này minh họa kết quả chuyển đổi từ tệp PDF sang định dạng Word (.docx), giữ nguyên cấu trúc đề mục, danh sách gạch đầu dòng và bảng tổng hợp để bạn chỉnh sửa trực tiếp trước khi tải xuống.',
      },
      {
        id: 'sample-3',
        type: 'heading2',
        text: '1. Mục tiêu trọng tâm',
      },
      {
        id: 'sample-4',
        type: 'bullet',
        text: 'Hoàn thiện bộ tài liệu hướng dẫn thực hành trước ngày 15/02/2026.',
      },
      {
        id: 'sample-5',
        type: 'bullet',
        text: 'Chuẩn hóa biểu mẫu báo cáo tiến độ hàng tuần cho các tổ chuyên môn.',
      },
      {
        id: 'sample-6',
        type: 'bullet',
        text: 'Rà soát thiết bị phòng máy và hệ thống lưu trữ bài tập định kỳ.',
      },
      {
        id: 'sample-7',
        type: 'heading2',
        text: '2. Lịch mốc thời gian dự kiến',
      },
      {
        id: 'sample-8',
        type: 'table',
        rows: [
          ['Giai đoạn', 'Nội dung công việc', 'Thời hạn', 'Phụ trách'],
          ['Tuần 1–2', 'Thu thập và tổng hợp tài liệu gốc', '20/02/2026', 'Nhóm Biên tập'],
          ['Tuần 3–4', 'Kiểm tra kỹ thuật và chạy thử nghiệm', '06/03/2026', 'Tổ Kỹ thuật'],
          ['Tuần 5', 'Ban hành bản chính thức', '14/03/2026', 'Ban Điều phối'],
        ],
      },
    ],
  };
}

export function createSampleScreenshotDataUrl(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 460;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean document screenshot background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle top bar like a real desktop screenshot
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(0, 0, canvas.width, 44);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 44.5);
  ctx.lineTo(canvas.width, 44.5);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '500 13px sans-serif';
  ctx.fillText('release-notes-v2.4.txt — Preview', 20, 27);

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 24px sans-serif';
  ctx.fillText('System Update & Maintenance Notice', 36, 98);

  // Body lines
  ctx.fillStyle = '#334155';
  ctx.font = '400 16px sans-serif';
  ctx.fillText('Scheduled maintenance will take place on Sunday from 02:00 to 04:00 UTC.', 36, 144);
  ctx.fillText('During this window, file synchronization may pause briefly.', 36, 172);

  // Subheading
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 18px sans-serif';
  ctx.fillText('Key improvements included in this release:', 36, 224);

  // Bullets
  ctx.fillStyle = '#1E293B';
  ctx.font = '400 16px sans-serif';
  ctx.fillText('• Faster document export with preserved table layout.', 44, 260);
  ctx.fillText('• Automatic keyboard shortcut support for pasting screenshots.', 44, 290);
  ctx.fillText('• Improved character recognition for scanned academic papers.', 44, 320);

  // Callout footer box
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(36, 356, 688, 66);
  ctx.strokeStyle = '#BFDBFE';
  ctx.strokeRect(36.5, 356.5, 687, 65);
  ctx.fillStyle = '#1E40AF';
  ctx.font = '500 15px sans-serif';
  ctx.fillText('Note: Please save all open drafts before midnight to avoid losing edits.', 54, 395);

  return canvas.toDataURL('image/png');
}

export function createSampleImageTranslationResult(imageDataUrl: string): ImageTranslationResult {
  return {
    sourceLabel: 'Ảnh chụp màn hình mẫu (Ctrl+V)',
    sourceMethod: 'sample',
    detectedLanguage: 'Tiếng Anh',
    targetLanguage: 'vi',
    imageDataUrl,
    createdAt: new Date().toISOString(),
    originalText: [
      'System Update & Maintenance Notice',
      'Scheduled maintenance will take place on Sunday from 02:00 to 04:00 UTC. During this window, file synchronization may pause briefly.',
      'Key improvements included in this release:',
      '• Faster document export with preserved table layout.',
      '• Automatic keyboard shortcut support for pasting screenshots.',
      '• Improved character recognition for scanned academic papers.',
      'Note: Please save all open drafts before midnight to avoid losing edits.',
    ].join('\n\n'),
    translatedText: [
      'Thông báo Cập nhật và Bảo trì Hệ thống',
      'Lịch bảo trì định kỳ sẽ diễn ra vào Chủ nhật từ 02:00 đến 04:00 UTC. Trong khoảng thời gian này, quá trình đồng bộ tệp có thể tạm dừng trong chốc lát.',
      'Các cải tiến chính có trong bản phát hành này:',
      '• Xuất tài liệu nhanh hơn và giữ nguyên bố cục bảng biểu.',
      '• Tự động hỗ trợ phím tắt dán ảnh chụp màn hình.',
      '• Cải thiện độ chính xác nhận diện chữ cho tài liệu học thuật dạng scan.',
      'Lưu ý: Vui lòng lưu tất cả bản nháp đang mở trước nửa đêm để tránh mất nội dung đã chỉnh sửa.',
    ].join('\n\n'),
    segments: [
      {
        id: 'seg-1',
        context: 'Tiêu đề',
        original: 'System Update & Maintenance Notice',
        translated: 'Thông báo Cập nhật và Bảo trì Hệ thống',
      },
      {
        id: 'seg-2',
        context: 'Đoạn văn',
        original:
          'Scheduled maintenance will take place on Sunday from 02:00 to 04:00 UTC. During this window, file synchronization may pause briefly.',
        translated:
          'Lịch bảo trì định kỳ sẽ diễn ra vào Chủ nhật từ 02:00 đến 04:00 UTC. Trong khoảng thời gian này, quá trình đồng bộ tệp có thể tạm dừng trong chốc lát.',
      },
      {
        id: 'seg-3',
        context: 'Danh sách',
        original:
          'Key improvements included in this release:\n• Faster document export with preserved table layout.\n• Automatic keyboard shortcut support for pasting screenshots.\n• Improved character recognition for scanned academic papers.',
        translated:
          'Các cải tiến chính có trong bản phát hành này:\n• Xuất tài liệu nhanh hơn và giữ nguyên bố cục bảng biểu.\n• Tự động hỗ trợ phím tắt dán ảnh chụp màn hình.\n• Cải thiện độ chính xác nhận diện chữ cho tài liệu học thuật dạng scan.',
      },
      {
        id: 'seg-4',
        context: 'Ghi chú',
        original: 'Note: Please save all open drafts before midnight to avoid losing edits.',
        translated:
          'Lưu ý: Vui lòng lưu tất cả bản nháp đang mở trước nửa đêm để tránh mất nội dung đã chỉnh sửa.',
      },
    ],
  };
}
