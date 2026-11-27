import { RefObject, useEffect } from "react";

/**
 * Keyboard focus for a modal rendered with createPortal(…, document.body): while it is open the app
 * behind it (#root) is inert, so Tab stays inside the modal; focus moves into it, and goes back to the
 * button that opened it when it closes (WCAG 2.4.3).
 * shortcut: only for modals portaled outside #root; a modal inside #root would become inert itself.
 */
export function useModalFocus(open: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");
    const id = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")?.focus()
    );
    return () => {
      cancelAnimationFrame(id);
      root?.removeAttribute("inert");
      opener?.focus?.();
    };
  }, [open, ref]);
}
