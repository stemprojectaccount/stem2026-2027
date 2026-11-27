/**
 * ASCII Motion System & Theme Transition Choreography
 * Additive-only module: 3-phase Web Animations API theme switch, #app_root CSS variables,
 * --accent-primary / --text-secondary / color-contrast computation, and passive hooks.
 */
(function () {
  'use strict';

  let isSwitchingTheme = false;
  let currentAppliedThemeId = 'lagoon';

  const THEME_TOKEN_MAP = {
    toolbarBg: '--theme-toolbar-bg',
    toolbarBorder: '--theme-toolbar-border',
    toolbarShadow: '--theme-toolbar-shadow',
    tabBg: '--theme-tab-bg',
    tabText: '--theme-tab-text',
    tabBorder: '--theme-tab-border',
    tabActiveBg: '--theme-tab-active-bg',
    tabActiveText: '--theme-tab-active-text',
    tabActiveBorder: '--theme-tab-active-border',
    tabActiveShadow: '--theme-tab-active-shadow',
    tabHoverBg: '--theme-tab-hover-bg',
    tabHoverBorder: '--theme-tab-hover-border',
    tabHoverShadow: '--theme-tab-hover-shadow',
    sidebarBg: '--theme-sidebar-bg',
    sidebarHeaderBg: '--theme-sidebar-header-bg',
    sidebarFooterBg: '--theme-sidebar-footer-bg',
    sidebarBorder: '--theme-sidebar-border',
    sidebarCtaBg: '--theme-sidebar-cta-bg',
    sidebarCtaBorder: '--theme-sidebar-cta-border',
    sidebarTabActiveBg: '--theme-sidebar-tab-active-bg',
    sidebarTabHoverBg: '--theme-sidebar-tab-hover-bg',
    sidebarBadgeBg: '--theme-sidebar-badge-bg',
    mascotCardBg: '--theme-mascot-card-bg',
    dropdownBg: '--theme-dropdown-bg',
    dropdownBorder: '--theme-dropdown-border',
    workspaceBg: '--theme-workspace-bg',
    cardBg: '--theme-card-bg',
    cardSubtleBg: '--theme-card-subtle-bg',
    cardBorder: '--theme-card-border',
    cardHoverBorder: '--theme-card-hover-border',
    primaryBtnBg: '--theme-primary-btn-bg',
    primaryBtnHover: '--theme-primary-btn-hover'
  };

  /**
   * Computes WCAG 2.1 relative luminance and returns optimal contrast text color (#ffffff or #0f172a)
   * to pair with CSS color-contrast(var(--accent-primary) vs #ffffff, #0f172a).
   */
  function computeContrastTextColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return '#ffffff';
    const hexMatch = colorStr.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
    if (!hexMatch) return '#ffffff';
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    const contrastWithWhite = (1.0 + 0.05) / (lum + 0.05);
    const contrastWithDark = (lum + 0.05) / (0.015 + 0.05);
    return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#0f172a';
  }

  function clearThemeVarsFromElement(el) {
    if (!el || !el.style) return;
    el.removeAttribute('data-ascii-theme');
    Object.values(THEME_TOKEN_MAP).forEach((cssVar) => {
      el.style.removeProperty(cssVar);
    });
    el.style.removeProperty('--accent-color');
    el.style.removeProperty('--accent-rgb');
    el.style.removeProperty('--ascii-accent');
    el.style.removeProperty('--ascii-accent-rgb');
    el.style.removeProperty('--accent-primary');
    el.style.removeProperty('--text-secondary');
    el.style.removeProperty('--accent-contrast-text');
  }

  function setThemeVarsOnElement(el, theme) {
    if (!el || !el.style || !theme) return;
    // Keep app_root and root purely untouched so ASCII themes never alter the global app UI
    if (el.id === 'app_root' || el === document.documentElement) {
      clearThemeVarsFromElement(el);
      return;
    }
    el.dataset.asciiTheme = theme.id;
    el.style.setProperty('--accent-color', theme.accent);
    el.style.setProperty('--accent-rgb', theme.accentRgb);
    el.style.setProperty('--ascii-accent', theme.accent);
    el.style.setProperty('--ascii-accent-rgb', theme.accentRgb);
  }

  function syncAppRootVariables() {
    const appRoot = document.getElementById('app_root');
    if (appRoot) {
      clearThemeVarsFromElement(appRoot);
    }
    return true;
  }

  function notifyThemeChanged(themeId) {
    try {
      window.dispatchEvent(
        new CustomEvent('ascii-theme-changed', {
          detail: { themeId: themeId || 'none' }
        })
      );
    } catch (_) {}
  }

  function applyThemeCSS(themeId) {
    const root = document.documentElement;
    const appRoot = document.getElementById('app_root');
    currentAppliedThemeId = themeId || 'none';

    // Clear any theme vars from root and appRoot to preserve app's blue-white system UI
    clearThemeVarsFromElement(root);
    if (appRoot) clearThemeVarsFromElement(appRoot);

    if (themeId === 'none') {
      if (window.AsciiThemes) {
        window.AsciiThemes.setMainCanvasTheme('none');
      }
      if (window.AsciiShop && typeof window.AsciiShop.setActiveThemeState === 'function') {
        window.AsciiShop.setActiveThemeState('none');
      }
      notifyThemeChanged('none');
      return;
    }

    if (!window.AsciiThemes) return;
    const theme = window.AsciiThemes.getThemeById(themeId);
    if (!theme) return;

    if (window.AsciiThemes) {
      window.AsciiThemes.setMainCanvasTheme(theme.id);
    }

    if (window.AsciiShop && typeof window.AsciiShop.setActiveThemeState === 'function') {
      window.AsciiShop.setActiveThemeState(theme.id);
    }
    notifyThemeChanged(theme.id);
  }

  async function switchTheme(newThemeId) {
    if (isSwitchingTheme) return;

    const reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (newThemeId === 'none') {
      applyThemeCSS('none');
      if (window.AsciiShop && typeof window.AsciiShop.showPointToast === 'function') {
        window.AsciiShop.showPointToast(0, 'Đã khôi phục Giao diện Xanh Dương Mặc định', '#38bdf8');
      }
      return;
    }

    if (!window.AsciiThemes) return;
    const theme = window.AsciiThemes.getThemeById(newThemeId);
    if (!theme) return;

    if (reducedMotion) {
      applyThemeCSS(theme.id);
      if (window.AsciiShop && typeof window.AsciiShop.showPointToast === 'function') {
        window.AsciiShop.showPointToast(0, `Đang áp dụng Theme: ${theme.name}`, theme.accent);
      }
      return;
    }

    isSwitchingTheme = true;

    try {
      const canvas = document.querySelector('#ascii-bg-canvas');
      const widget = document.querySelector('#ascii-pts-widget');

      const fadeOutAnims = [];
      if (canvas && canvas.animate) {
        const outAnim = canvas.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 180,
          easing: 'cubic-bezier(0.4, 0, 1, 1)'
        });
        fadeOutAnims.push(outAnim.finished);
      }
      if (widget && widget.animate) {
        fadeOutAnims.push(
          widget.animate(
            [
              { opacity: 1, transform: 'translateY(0)' },
              { opacity: 0.8, transform: 'translateY(2px)' }
            ],
            { duration: 150, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
          ).finished
        );
      }

      await Promise.allSettled(fadeOutAnims);

      applyThemeCSS(theme.id);

      if (window.AsciiShop && typeof window.AsciiShop.showPointToast === 'function') {
        window.AsciiShop.showPointToast(0, `Đã đổi giao diện: ${theme.name}`, theme.accent);
      }

      const fadeInAnims = [];
      if (canvas && canvas.animate) {
        fadeInAnims.push(
          canvas.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 280,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }).finished
        );
      }
      if (widget && widget.animate) {
        fadeInAnims.push(
          widget.animate(
            [
              { opacity: 0.8, transform: 'translateY(2px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            { duration: 240, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
          ).finished
        );
      }

      await Promise.allSettled(fadeInAnims);
    } finally {
      isSwitchingTheme = false;
    }
  }

  function themeToggle(targetThemeId) {
    if (targetThemeId) {
      const next = currentAppliedThemeId === targetThemeId ? 'lagoon' : targetThemeId;
      return switchTheme(next);
    }
    const themes = (window.AsciiThemes && window.AsciiThemes.THEMES) || [];
    if (themes.length === 0) return;
    const idx = themes.findIndex((t) => t.id === currentAppliedThemeId);
    const nextTheme = themes[(idx + 1) % themes.length];
    return switchTheme(nextTheme.id);
  }

  function initMotionTokens() {
    const root = document.documentElement;
    root.style.setProperty('--ease-spring', 'cubic-bezier(0.34, 1.56, 0.64, 1)');
    root.style.setProperty('--ease-smooth', 'cubic-bezier(0.16, 1, 0.3, 1)');
    root.style.setProperty('--ease-snappy', 'cubic-bezier(0.4, 0, 0.2, 1)');
    root.style.setProperty('--ease-out-expo', 'cubic-bezier(0.19, 1, 0.22, 1)');
  }

  function initToolbarEffects() {
    document.addEventListener(
      'pointermove',
      (e) => {
        const target = e.target && e.target.closest ? e.target.closest('#app_root .spotlight-toolbar') : null;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          target.style.setProperty('--glow-x', `${x.toFixed(1)}%`);
          target.style.setProperty('--glow-y', `${y.toFixed(1)}%`);
        }
      },
      { passive: true }
    );
  }

  function triggerSendButtonEarnedBurst(btnEl) {
    if (!btnEl) return;
    btnEl.classList.remove('send', 'earned');
    void btnEl.offsetWidth;
    btnEl.classList.add('send', 'earned');
    setTimeout(() => {
      btnEl.classList.remove('earned');
    }, 950);
  }

  function initPointHooks() {
    document.addEventListener(
      'click',
      (e) => {
        if (!window.AsciiShop || typeof window.AsciiShop.earnPoints !== 'function') return;
        const target = e.target && e.target.closest ? e.target.closest('button, [role="button"]') : null;
        if (!target) return;

        if (target.closest('#ascii-shop-portal') || target.closest('#ascii-pts-widget')) return;

        const text = (target.textContent || '').trim().toLowerCase();
        const aria = (target.getAttribute('aria-label') || '').toLowerCase();
        const title = (target.getAttribute('title') || '').toLowerCase();
        const combined = `${text} ${aria} ${title}`;

        if (
          target.classList.contains('send') ||
          target.type === 'submit' ||
          /gửi|send|kiểm tra|nộp bài|hoàn thành|check|submit|luyện tập|bắt đầu/i.test(combined)
        ) {
          const res = window.AsciiShop.earnPoints('message_sent');
          if (res && res.earned > 0) {
            triggerSendButtonEarnedBurst(target);
          }
          return;
        }

        if (/chia sẻ|share|sao chép|copy|export/i.test(combined)) {
          window.AsciiShop.earnPoints('share_conversation');
          return;
        }

        if (/đánh giá|rate|like|thích|sao|star|feedback|lưu/i.test(combined)) {
          window.AsciiShop.earnPoints('rate_response');
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Enter' || e.shiftKey) return;
        const el = e.target;
        if (!el || (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT')) return;
        if (el.closest('#ascii-shop-portal')) return;
        if ((el.value || '').trim().length > 0) {
          if (window.AsciiShop && typeof window.AsciiShop.earnPoints === 'function') {
            window.AsciiShop.earnPoints('message_sent');
          }
        }
      },
      { passive: true }
    );
  }

  window.switchTheme = switchTheme;
  window.applyThemeCSS = applyThemeCSS;
  window.themeToggle = themeToggle;
  window.computeContrastTextColor = computeContrastTextColor;
  window.AsciiMotion = {
    initMotionTokens,
    initToolbarEffects,
    initPointHooks,
    switchTheme,
    applyThemeCSS,
    themeToggle,
    computeContrastTextColor,
    syncAppRootVariables,
    getCurrentThemeId: () => currentAppliedThemeId
  };
})();
