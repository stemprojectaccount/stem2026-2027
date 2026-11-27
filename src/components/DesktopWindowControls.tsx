// Minimise / maximise / close for the frameless Windows app (Chrome style).
// Transparent buttons drawn inside the app, so they always match the header behind them;
// Windows-like hover colours (close turns red). Mounted by src/lib/desktopTitleBar.ts.
import React, { useEffect, useState } from "react";

interface Bridge {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
  isMaximized(): Promise<boolean>;
  onMaximizedChange(cb: (m: boolean) => void): () => void;
}

export default function DesktopWindowControls({ bridge, showStrip }: { bridge: Bridge; showStrip: boolean }) {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    bridge.isMaximized().then(setMaximized).catch(() => {});
    return bridge.onMaximizedChange(setMaximized);
  }, [bridge]);

  return (
    <>
      {showStrip && (
        <div className="wc-drag-strip" onDoubleClick={() => bridge.toggleMaximize()}>
          <span className="wc-strip-title">SmartStudy</span>
        </div>
      )}
      <div className="wc-root" role="toolbar" aria-label="Điều khiển cửa sổ">
        <button type="button" className="wc-btn" onClick={() => bridge.minimize()} aria-label="Thu nhỏ" title="Thu nhỏ">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>
        </button>
        <button type="button" className="wc-btn" onClick={() => bridge.toggleMaximize()} aria-label={maximized ? "Khôi phục" : "Phóng to"} title={maximized ? "Khôi phục" : "Phóng to"}>
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="2.5" width="7" height="7" />
              <path d="M2.5 2.5V0.5h7v7h-2" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="9" height="9" /></svg>
          )}
        </button>
        <button type="button" className="wc-btn wc-close" onClick={() => bridge.close()} aria-label="Đóng" title="Đóng">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.1" /></svg>
        </button>
      </div>
    </>
  );
}
