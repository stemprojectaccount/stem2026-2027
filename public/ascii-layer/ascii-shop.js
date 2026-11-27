/**
 * ASCII Theme Shop & Point Economy System
 * Additive-only module: Persistent points store, unlockAllThemes persistence in localStorage,
 * earn toasts, shop portal, and seamless theme switching on #app_root.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ascii_points_v1';
  const UNLOCK_ALL_STORAGE_KEY = 'ascii_unlock_all_themes_v1';
  const ALL_THEME_IDS = [
    'lagoon',
    'claude',
    'clouds',
    'aurora',
    'sakura',
    'cyber-matrix',
    'synthwave',
    'solar-flare',
    'deep-cosmos',
    'singularity-omega'
  ];
  const BASE_FREE_THEMES = ['lagoon', 'claude', 'clouds'];

  let memoryFallbackState = null;

  function loadUnlockAllPreference() {
    try {
      const storedFlag = localStorage.getItem(UNLOCK_ALL_STORAGE_KEY);
      if (storedFlag === 'false') return false;
      if (storedFlag === 'true') return true;
    } catch (_) {}
    return true;
  }

  function saveUnlockAllPreference(unlockAll) {
    try {
      localStorage.setItem(UNLOCK_ALL_STORAGE_KEY, String(Boolean(unlockAll)));
    } catch (_) {}
  }

  function createDefaultState() {
    return {
      balance: 50000,
      totalEarned: 50000,
      unlocked: [...ALL_THEME_IDS],
      unlockAllThemes: true,
      activeTheme: 'lagoon',
      history: [],
      streak: { count: 1, lastDate: null },
      testUnlockedAllV2: true
    };
  }

  function sanitizeState(parsed) {
    const def = createDefaultState();
    if (!parsed || typeof parsed !== 'object') return def;

    const unlockAllThemes =
      typeof parsed.unlockAllThemes === 'boolean'
        ? parsed.unlockAllThemes
        : loadUnlockAllPreference();

    const rawUnlocked = Array.isArray(parsed.unlocked) ? parsed.unlocked : [];
    const unlockedSet = new Set(
      unlockAllThemes ? [...ALL_THEME_IDS] : [...BASE_FREE_THEMES, ...rawUnlocked]
    );

    const balance =
      typeof parsed.balance === 'number' && !Number.isNaN(parsed.balance) && parsed.balance >= 0
        ? Math.floor(parsed.balance)
        : def.balance;

    const totalEarned =
      typeof parsed.totalEarned === 'number' && !Number.isNaN(parsed.totalEarned)
        ? Math.max(balance, Math.floor(parsed.totalEarned))
        : balance;

    const activeTheme =
      parsed.activeTheme === 'none' ||
      (typeof parsed.activeTheme === 'string' && ALL_THEME_IDS.includes(parsed.activeTheme))
        ? parsed.activeTheme
        : 'lagoon';

    const history = Array.isArray(parsed.history) ? parsed.history.slice(-100) : [];
    const streak =
      parsed.streak && typeof parsed.streak === 'object'
        ? {
            count: typeof parsed.streak.count === 'number' ? parsed.streak.count : 1,
            lastDate: typeof parsed.streak.lastDate === 'string' ? parsed.streak.lastDate : null
          }
        : def.streak;

    return {
      balance,
      totalEarned,
      unlocked: Array.from(unlockedSet),
      unlockAllThemes,
      activeTheme,
      history,
      streak,
      testUnlockedAllV2: true
    };
  }

  function loadPoints() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const clean = sanitizeState(parsed);
        if (
          typeof parsed.unlockAllThemes !== 'boolean' ||
          (clean.unlockAllThemes && clean.unlocked.length < ALL_THEME_IDS.length)
        ) {
          savePoints(clean);
        }
        return clean;
      }
    } catch (_) {
      try {
        const rawSession = sessionStorage.getItem(STORAGE_KEY);
        if (rawSession) return sanitizeState(JSON.parse(rawSession));
      } catch (_2) {}
    }
    if (memoryFallbackState) return sanitizeState(memoryFallbackState);
    const initial = createDefaultState();
    savePoints(initial);
    return initial;
  }

  function savePoints(state) {
    const unlockAllThemes =
      typeof state.unlockAllThemes === 'boolean' ? state.unlockAllThemes : true;
    saveUnlockAllPreference(unlockAllThemes);

    const clean = sanitizeState({
      ...state,
      unlockAllThemes,
      testUnlockedAllV2: true
    });
    memoryFallbackState = clean;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch (_) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch (_2) {}
    }
  }

  const POINT_ACTIONS = {
    message_sent: { pts: 10, label: 'Sent a message', dailyCap: 50 },
    daily_login: { pts: 50, label: 'Daily login bonus', dailyCap: 1 },
    streak_7: { pts: 200, label: '7-day streak!', dailyCap: 1 },
    streak_30: { pts: 1000, label: '30-day streak!', dailyCap: 1 },
    share_conversation: { pts: 25, label: 'Shared a conversation', dailyCap: 5 },
    rate_response: { pts: 5, label: 'Rated a response', dailyCap: 20 },
    long_session: { pts: 30, label: '30 min active session', dailyCap: 3 },
    first_theme_unlock: { pts: 100, label: 'First theme unlocked!', dailyCap: 1 }
  };

  /* ==========================================================================
     TOAST STACK & BALANCE DISPLAY
     ========================================================================== */
  const activeToastEls = [];

  function restackToasts() {
    activeToastEls.forEach((el, idx) => {
      const offset = (activeToastEls.length - 1 - idx) * 44;
      el.style.transform = `translateY(-${offset}px)`;
    });
  }

  function showPointToast(pts, label, customColor) {
    const toast = document.createElement('div');
    toast.className = 'point-toast';
    if (customColor) {
      toast.style.borderColor = customColor;
    }
    const ptsHtml =
      pts > 0
        ? `<span class="pts-plus">+${pts}</span>`
        : pts < 0
        ? `<span class="pts-plus">${pts}</span>`
        : `<span class="pts-plus">✦</span>`;
    toast.innerHTML = `${ptsHtml}<span class="pts-label">${label}</span>`;
    document.body.appendChild(toast);
    activeToastEls.push(toast);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
      restackToasts();
    });

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        const idx = activeToastEls.indexOf(toast);
        if (idx !== -1) activeToastEls.splice(idx, 1);
        toast.remove();
        restackToasts();
      }, 300);
    }, 2200);
  }

  function showDeficitToast(deficit) {
    showPointToast(0, `Cần thêm ${deficit.toLocaleString()} pts để mở khóa`, '#f87171');
  }

  function updateBalanceDisplay(newBalance, delta) {
    const formatted = Number(newBalance || 0).toLocaleString();
    const counters = document.querySelectorAll('.pts-count, #shop-balance');
    counters.forEach((el) => {
      el.textContent = formatted;
      if (delta) {
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
      }
    });
  }

  function earnPoints(actionKey) {
    const action = POINT_ACTIONS[actionKey];
    if (!action) return null;

    const state = loadPoints();
    const today = new Date().toDateString();

    const todayCount = state.history.filter(
      (h) => h.action === actionKey && new Date(h.ts).toDateString() === today
    ).length;

    if (todayCount >= action.dailyCap) return null;

    state.balance += action.pts;
    state.totalEarned += action.pts;
    state.history.push({ action: actionKey, pts: action.pts, ts: Date.now() });
    if (state.history.length > 100) {
      state.history = state.history.slice(-100);
    }

    savePoints(state);
    showPointToast(action.pts, action.label);
    updateBalanceDisplay(state.balance, action.pts);

    const overlay = document.getElementById('theme-shop-overlay');
    if (overlay && overlay.classList.contains('open')) {
      renderShop(false);
    }

    return { earned: action.pts, newBalance: state.balance };
  }

  function checkDailyStreak() {
    const state = loadPoints();
    const today = new Date().toDateString();
    if (state.streak.lastDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.streak.lastDate === yesterday) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastDate = today;
    savePoints(state);

    setTimeout(() => {
      earnPoints('daily_login');
      if (state.streak.count === 7) earnPoints('streak_7');
      if (state.streak.count === 30) earnPoints('streak_30');
    }, 900);
  }

  /* ==========================================================================
     THEME SHOP FILTERING, SORTING & UNLOCK FLOW
     ========================================================================== */
  let currentFilter = 'all';
  let currentSort = 'tier';
  const unlockingInProgress = new Set();

  function getFilteredAndSortedThemes(state) {
    const themes = (window.AsciiThemes && window.AsciiThemes.THEMES) || [];
    const filtered = themes.filter((theme) => {
      const isUnlocked = state.unlockAllThemes || state.unlocked.includes(theme.id);
      const isActive = state.activeTheme === theme.id;

      switch (currentFilter) {
        case 'unlocked':
          return isUnlocked;
        case '1k':
          return theme.cost === 1000;
        case '2.5k':
          return theme.cost === 2500;
        case '5k':
          return theme.cost === 5000;
        case '10k':
          return theme.cost === 10000;
        case 'active':
          return isActive;
        case 'all':
        default:
          return true;
      }
    });

    return filtered.slice().sort((a, b) => {
      if (currentSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (currentSort === 'new') {
        return parseFloat(b.since || '1.0') - parseFloat(a.since || '1.0');
      }
      return a.cost - b.cost;
    });
  }

  function buildCardHTML(theme, state) {
    const isUnlocked = true;
    const isActive = state.activeTheme === theme.id;

    const statusClasses = [
      'theme-card',
      'unlocked',
      isActive ? 'active' : ''
    ]
      .filter(Boolean)
      .join(' ');

    const badgeHTML = isActive
      ? `<span class="badge-active">● Đang dùng</span>`
      : `<span class="badge-unlocked">✓ Miễn phí</span>`;

    const actionFooterHTML = isActive
      ? `<button type="button" class="use-btn active-btn" disabled>✓ Đang kích hoạt</button>`
      : `<button type="button" class="use-btn" data-use-theme="${theme.id}">Áp dụng Giao diện này</button>`;

    return `
      <div class="${statusClasses}" data-theme-id="${theme.id}" data-tier="${theme.tier}" style="--card-accent: ${theme.accent}; --card-accent-rgb: ${theme.accentRgb};">
        <div class="card-preview" style="background: ${theme.previewBg || theme.cardBg}">
          <canvas class="theme-preview-canvas" width="220" height="130" data-theme="${theme.id}"></canvas>
          ${isActive ? '<div class="active-indicator">● ACTIVE</div>' : ''}
        </div>
        <div class="card-info">
          <span class="card-name">${theme.name}</span>
          <span class="card-badge">${badgeHTML}</span>
        </div>
        <div class="card-meta">
          <div class="card-mood">${theme.preview ? theme.preview.moodLabel : ''}</div>
          <div class="card-desc">${theme.description}</div>
          ${actionFooterHTML}
        </div>
      </div>
    `;
  }

  function showConfirmModal(theme, onConfirm) {
    const existing = document.getElementById('ascii-confirm-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'ascii-confirm-backdrop';
    backdrop.className = 'ascii-confirm-backdrop';
    backdrop.innerHTML = `
      <div class="ascii-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="ascii-confirm-title">
        <h3 id="ascii-confirm-title">Mở khóa ${theme.name}?</h3>
        <p>Dùng <strong>✦ ${theme.cost.toLocaleString()} pts</strong> để mở khóa vĩnh viễn chủ đề <strong>${theme.name}</strong> và áp dụng ngay?</p>
        <div class="ascii-confirm-actions">
          <button type="button" class="ascii-confirm-btn cancel">Hủy</button>
          <button type="button" class="ascii-confirm-btn confirm">Xác nhận · ✦ ${theme.cost.toLocaleString()}</button>
        </div>
      </div>
    `;

    const portal = document.getElementById('ascii-shop-portal') || document.body;
    portal.appendChild(backdrop);

    const cancelBtn = backdrop.querySelector('.cancel');
    const confirmBtn = backdrop.querySelector('.confirm');

    cancelBtn.addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });
    confirmBtn.addEventListener('click', () => {
      backdrop.remove();
      onConfirm();
    });
  }

  function executeUnlock(themeId) {
    if (unlockingInProgress.has(themeId)) return;
    unlockingInProgress.add(themeId);

    try {
      const state = loadPoints();
      const theme = window.AsciiThemes && window.AsciiThemes.getThemeById(themeId);
      if (!theme) return;
      if (state.unlocked.includes(themeId)) {
        if (window.switchTheme) window.switchTheme(themeId);
        return;
      }
      if (state.balance < theme.cost) return;

      const hadPaidThemeBefore = state.unlocked.some((id) => !BASE_FREE_THEMES.includes(id));

      state.balance -= theme.cost;
      state.unlocked.push(themeId);
      state.activeTheme = themeId;
      savePoints(state);

      updateBalanceDisplay(state.balance, -theme.cost);
      showPointToast(-theme.cost, `Đã mở khóa ${theme.name}!`, theme.accent);

      if (!hadPaidThemeBefore) {
        setTimeout(() => earnPoints('first_theme_unlock'), 350);
      }

      renderShop(false);

      const card = document.querySelector(`.theme-card[data-theme-id="${themeId}"]`);
      if (card) {
        card.classList.add('just-unlocked');
        setTimeout(() => card.classList.remove('just-unlocked'), 900);
      }

      setTimeout(() => {
        if (window.switchTheme) {
          window.switchTheme(themeId);
        }
      }, 250);
    } finally {
      setTimeout(() => {
        unlockingInProgress.delete(themeId);
      }, 400);
    }
  }

  function unlockTheme(themeId) {
    if (window.switchTheme) window.switchTheme(themeId);
    const state = loadPoints();
    state.activeTheme = themeId;
    savePoints(state);
    renderShop(false);
  }

  function setUnlockAllThemes(enabled) {
    const state = loadPoints();
    state.unlockAllThemes = Boolean(enabled);
    if (state.unlockAllThemes) {
      state.unlocked = [...ALL_THEME_IDS];
      state.balance = Math.max(state.balance, 50000);
    } else {
      state.unlocked = [...BASE_FREE_THEMES];
      if (!state.unlocked.includes(state.activeTheme) && state.activeTheme !== 'none') {
        state.activeTheme = 'lagoon';
        if (window.switchTheme) window.switchTheme('lagoon');
      }
      state.balance = Math.max(state.balance, 25000);
    }
    savePoints(state);
    updateBalanceDisplay(state.balance, 0);
    renderShop(false);
    showPointToast(
      0,
      state.unlockAllThemes
        ? 'Đã mở khóa toàn bộ 10 Theme (Lưu vào localStorage)!'
        : 'Đã chuyển sang chế độ Test Mua Theme bằng điểm!',
      state.unlockAllThemes ? '#4ade80' : '#fbbf24'
    );
  }

  function unlockAllThemesForTest() {
    setUnlockAllThemes(true);
  }

  function lockPaidThemesForTest() {
    setUnlockAllThemes(false);
  }

  function renderShop(animateFilter) {
    const grid = document.getElementById('theme-grid');
    if (!grid) return;

    const state = loadPoints();
    updateBalanceDisplay(state.balance, 0);

    const filterBtns = document.querySelectorAll('#theme-shop-overlay .shop-filters .filter-btn');
    filterBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });

    const defaultBtn = document.getElementById('ascii-restore-default-btn');
    if (defaultBtn) {
      defaultBtn.classList.toggle('active', state.activeTheme === 'none');
      defaultBtn.textContent =
        state.activeTheme === 'none' ? '✓ Mặc Định Xanh Dương (Đang bật)' : '☀ Mặc Định Xanh Dương';
    }

    const unlockAllBtn = document.getElementById('ascii-unlock-all-btn');
    const lockTestBtn = document.getElementById('ascii-lock-test-btn');
    if (unlockAllBtn) {
      unlockAllBtn.classList.toggle('active', Boolean(state.unlockAllThemes));
    }
    if (lockTestBtn) {
      lockTestBtn.classList.toggle('active', !state.unlockAllThemes);
    }

    const themes = getFilteredAndSortedThemes(state);

    const updateDOM = () => {
      if (themes.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 36px 16px; color: rgba(255,255,255,0.45); font-size: 13px;">Không có theme nào trong mục lọc này.</div>`;
        return;
      }
      grid.innerHTML = themes.map((t) => buildCardHTML(t, state)).join('');
      if (window.AsciiThemes && typeof window.AsciiThemes.initMiniPreviews === 'function') {
        window.AsciiThemes.initMiniPreviews(grid);
      }
    };

    if (animateFilter && grid.children.length > 0 && grid.animate) {
      const outAnim = grid.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.97)' }
        ],
        { duration: 140, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      );
      outAnim.onfinish = () => {
        updateDOM();
        const cards = grid.querySelectorAll('.theme-card');
        cards.forEach((card, idx) => {
          if (card.animate) {
            card.animate(
              [
                { opacity: 0, transform: 'scale(0.92) translateY(8px)' },
                { opacity: 1, transform: 'scale(1) translateY(0)' }
              ],
              {
                duration: 240,
                delay: idx * 25,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                fill: 'both'
              }
            );
          }
        });
      };
    } else {
      updateDOM();
    }
  }

  function openShop() {
    let overlay = document.getElementById('theme-shop-overlay');
    if (!overlay) {
      mountShopOverlay();
      overlay = document.getElementById('theme-shop-overlay');
    }
    if (!overlay) return;

    renderShop(false);
    requestAnimationFrame(() => {
      overlay.classList.add('open');
    });
  }

  function closeShop() {
    const overlay = document.getElementById('theme-shop-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    if (window.AsciiThemes && typeof window.AsciiThemes.stopAllMiniPreviews === 'function') {
      window.AsciiThemes.stopAllMiniPreviews();
    }
  }

  function setActiveThemeState(themeId) {
    const state = loadPoints();
    state.activeTheme = themeId;
    savePoints(state);
    const overlay = document.getElementById('theme-shop-overlay');
    if (overlay && overlay.classList.contains('open')) {
      renderShop(false);
    }
  }

  /* ==========================================================================
     MOUNT SHOP PORTAL & BALANCE WIDGET (Strictly outside #root)
     ========================================================================== */
  function ensureToolbarBadge() {}

  function mountShopButton() {
    // User requested to remove points from themeshop and relocate points to the gift redemption shop
    const existing = document.getElementById('ascii-pts-widget');
    if (existing) {
      existing.remove();
    }
  }

  function mountShopOverlay() {
    let portal = document.getElementById('ascii-shop-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'ascii-shop-portal';
      document.body.appendChild(portal);
    }

    portal.innerHTML = `
      <div class="shop-overlay" id="theme-shop-overlay" role="dialog" aria-modal="true" aria-labelledby="ascii-shop-title">
        <div class="shop-panel">
          <div class="shop-header">
            <div class="shop-title">
              <span class="shop-icon">◈</span>
              <span id="ascii-shop-title">BỘ SƯU TẬP 10 THEME ASCII (100% MIỄN PHÍ)</span>
            </div>
            <div class="shop-balance-wrap">
              <button type="button" class="filter-btn" id="ascii-restore-default-btn" title="Chuyển về giao diện sáng xanh-trắng mặc định">
                ☀ Mặc Định Xanh Dương
              </button>
              <button type="button" class="shop-close" id="ascii-shop-close-btn" aria-label="Close Theme Shop">✕</button>
            </div>
          </div>

          <div class="shop-controls-row">
            <div class="shop-filters">
              <button type="button" class="filter-btn active" data-filter="all">Tất cả (10 Theme)</button>
              <button type="button" class="filter-btn" data-filter="active">Đang dùng ●</button>
            </div>
            <select class="shop-sort-select" id="ascii-shop-sort" aria-label="Sort themes">
              <option value="name">Sắp xếp: Tên (A–Z)</option>
              <option value="tier">Sắp xếp: Bậc hiển thị</option>
            </select>
          </div>

          <div class="theme-grid" id="theme-grid"></div>

          <div style="margin-top: 16px; padding: 12px 16px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="font-size: 12px; color: #bae6fd; font-family: sans-serif;">
              🎁 <strong>Điểm Thưởng Học Tập:</strong> Toàn bộ điểm thưởng ASCII đã được chuyển vào <strong>Cửa hàng Đổi Quà</strong>. Em có thể dùng điểm đổi Xu Trí Tuệ và Gói thẻ ma thuật!
            </div>
          </div>
        </div>
      </div>
    `;

    const overlay = portal.querySelector('#theme-shop-overlay');
    const closeBtn = portal.querySelector('#ascii-shop-close-btn');
    const sortSelect = portal.querySelector('#ascii-shop-sort');
    const restoreDefaultBtn = portal.querySelector('#ascii-restore-default-btn');

    closeBtn.addEventListener('click', closeShop);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeShop();
    });

    if (restoreDefaultBtn) {
      restoreDefaultBtn.addEventListener('click', () => {
        if (window.switchTheme) window.switchTheme('none');
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeShop();
      }
    });

    portal.querySelectorAll('.shop-filters .filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextFilter = btn.dataset.filter || 'all';
        if (nextFilter === currentFilter) return;
        currentFilter = nextFilter;
        renderShop(true);
      });
    });

    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value || 'tier';
      renderShop(true);
    });

    const grid = portal.querySelector('#theme-grid');
    grid.addEventListener('click', (e) => {
      const unlockBtn = e.target.closest('[data-unlock-theme]');
      if (unlockBtn) {
        e.stopPropagation();
        unlockTheme(unlockBtn.dataset.unlockTheme);
        return;
      }

      const useBtn = e.target.closest('[data-use-theme]');
      if (useBtn) {
        e.stopPropagation();
        const themeId = useBtn.dataset.useTheme;
        if (window.switchTheme) window.switchTheme(themeId);
        return;
      }

      const card = e.target.closest('.theme-card');
      if (card) {
        const themeId = card.dataset.themeId;
        const st = loadPoints();
        const isUnlocked = Boolean(st.unlockAllThemes || st.unlocked.includes(themeId));
        if (isUnlocked) {
          if (window.switchTheme) {
            window.switchTheme(themeId);
          }
        } else {
          unlockTheme(themeId);
        }
      }
    });

    portal.querySelectorAll('[data-earn-action]').forEach((item) => {
      item.addEventListener('click', () => {
        const key = item.dataset.earnAction;
        const res = earnPoints(key);
        if (!res) {
          const st = loadPoints();
          st.balance += 1000;
          savePoints(st);
          updateBalanceDisplay(st.balance, 1000);
          showPointToast(1000, 'Thưởng thêm +1,000 pts test!', '#4ade80');
        }
      });
    });
  }

  function initPointSystem() {
    const state = loadPoints();
    updateBalanceDisplay(state.balance, 0);
    checkDailyStreak();

    setInterval(() => {
      if (!document.hidden) {
        earnPoints('long_session');
      }
    }, 30 * 60 * 1000);
  }

  window.openShop = openShop;
  window.closeShop = closeShop;
  window.unlockTheme = unlockTheme;
  window.setUnlockAllThemes = setUnlockAllThemes;
  window.earnPoints = earnPoints;
  window.AsciiShop = {
    STORAGE_KEY,
    UNLOCK_ALL_STORAGE_KEY,
    POINT_ACTIONS,
    loadPoints,
    savePoints,
    earnPoints,
    unlockTheme,
    setUnlockAllThemes,
    unlockAllThemesForTest,
    lockPaidThemesForTest,
    openShop,
    closeShop,
    renderShop,
    mountShopButton,
    mountShopOverlay,
    ensureToolbarBadge,
    setActiveThemeState,
    showPointToast,
    initPointSystem
  };
})();
