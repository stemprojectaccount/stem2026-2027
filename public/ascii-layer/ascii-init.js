/**
 * ASCII Layer — Safe Additive Initializer
 * Waits for #root to finish rendering, then mounts themes, motion, and shop portals.
 */
(function () {
  'use strict';

  function loadScriptSequential(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = (err) => reject(err);
      document.head.appendChild(s);
    });
  }

  function waitForApp(selector, timeout) {
    const maxWait = timeout || 5000;
    return new Promise((resolve) => {
      const target = document.querySelector(selector);
      if (target && target.children.length > 0) {
        return resolve(target);
      }

      const obs = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el && el.children.length > 0) {
          obs.disconnect();
          resolve(el);
        }
      });

      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        obs.disconnect();
        resolve(document.body);
      }, maxWait);
    });
  }

  async function initAsciiLayer() {
    try {
      await loadScriptSequential('/ascii-layer/ascii-themes.js');
      await loadScriptSequential('/ascii-layer/ascii-motion.js');
      await loadScriptSequential('/ascii-layer/ascii-shop.js');

      await waitForApp('#root');

      // Global library view (#app_root) keeps clean default blue-white styling with no ASCII canvas or overlays.
      if (typeof window.__asciiLayerDisable === 'function') {
        window.__asciiLayerDisable();
      }
    } catch (err) {
      console.warn('[ASCII Layer] Non-critical init error, app continues:', err);
    }
  }

  window.__asciiLayerDisable = function () {
    try {
      if (window.AsciiThemes && typeof window.AsciiThemes.stopMainCanvas === 'function') {
        window.AsciiThemes.stopMainCanvas();
        window.AsciiThemes.stopAllMiniPreviews();
      }
      ['#ascii-canvas-layer', '#ascii-shop-portal', '#ascii-pts-widget'].forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) el.remove();
      });
      document.querySelectorAll('.pts-badge--toolbar, .ascii-toolbar-glow-beam').forEach((el) => {
        el.remove();
      });
    } catch (_) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAsciiLayer);
  } else {
    initAsciiLayer();
  }
})();
