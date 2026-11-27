import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { downloadDataUrl } from '../core/browserActions';
import { normalizeShareCode } from '../core/shareCodec';

interface QrCodeDisplayProps {
  url: string;
  code: string;
  size?: number;
  showDownload?: boolean;
}

/**
 * Decoupled QR rendering component.
 * Accepts any share URL and renders a crisp, scannable QR image with optional PNG download.
 */
export function QrCodeDisplay({
  url,
  code,
  size = 196,
  showDownload = true,
}: QrCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setError(false);

    QRCode.toDataURL(url, {
      width: Math.max(size * 2, 384),
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#141923',
        light: '#FFFFFF',
      },
    })
      .then((generated) => {
        if (active) {
          setDataUrl(generated);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [url, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const filename = `quickshare-qr-${normalizeShareCode(code).toLowerCase()}.png`;
    downloadDataUrl(filename, dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-xl border border-[#E1E6EF] bg-white p-3"
        style={{ width: size + 24, height: size + 24 }}
      >
        {error ? (
          <p className="px-3 text-center text-sm text-[#556174]">
            Không tạo được mã QR. Bạn vẫn có thể dùng mã ngắn hoặc đường link bên cạnh.
          </p>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`Mã QR để mở nội dung chia sẻ ${code}`}
            width={size}
            height={size}
            className="block rounded-md"
          />
        ) : (
          <div
            className="animate-pulse rounded-md bg-[#EEF1F6]"
            style={{ width: size, height: size }}
            aria-label="Đang tạo mã QR"
          />
        )}
      </div>

      {showDownload && dataUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#E1E6EF] bg-white px-4 py-2 text-sm font-medium text-[#141923] transition-colors hover:border-[#C9D2E1] hover:bg-[#F7F8FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#475467]" aria-hidden="true" />
          <span>Tải ảnh QR</span>
        </button>
      )}
    </div>
  );
}
