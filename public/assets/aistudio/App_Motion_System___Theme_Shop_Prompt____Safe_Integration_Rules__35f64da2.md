# 🚀 PROMPT BỔ SUNG: App Motion System + Theme Shop

> **Nối tiếp Mega Prompt ASCII Theme.** Prompt này bổ sung 3 lớp còn thiếu:
> 
> 1. **Motion System** — mọi chuyển động trong app phải mượt mà, có cảm giác vật lý
> 2. **Theme Shop UI** — màn hình cửa hàng kiếm điểm + mở khóa theme
> 3. **Point Economy** — hệ thống tích điểm ASCII trong app

---

## PHẦN 1 — APP MOTION & TRANSITION SYSTEM

### 1.1 Nguyên tắc chuyển động (Motion Principles)

Toàn bộ app phải tuân theo 3 nguyên tắc:

| Nguyên tắc | Mô tả | Easing |
| --- | --- | --- |
| **Physical** | Mọi thứ có quán tính, không teleport | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| **Responsive** | UI phản hồi trong \< 100ms | `cubic-bezier(0.4, 0, 0.2, 1)` (fast-out) |
| **Meaningful** | Chuyển động truyền đạt thông tin | Custom per-component |

### 1.2 CSS Motion Tokens (thêm vào `:root`)

```css
:root {
  /* Duration */
  --dur-instant:  80ms;
  --dur-fast:    150ms;
  --dur-normal:  280ms;
  --dur-slow:    450ms;
  --dur-scenic:  700ms;

  /* Easing */
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);   /* bounce vào */
  --ease-out:      cubic-bezier(0.0, 0.0, 0.2, 1);       /* decelerate */
  --ease-in:       cubic-bezier(0.4, 0.0, 1.0, 1);       /* accelerate */
  --ease-in-out:   cubic-bezier(0.4, 0.0, 0.2, 1);       /* material */
  --ease-snap:     cubic-bezier(0.175, 0.885, 0.32, 1.275); /* magnetic */
  --ease-glitch:   steps(4, end);                          /* retro/digital */

  /* Scale factors */
  --scale-press:  0.96;
  --scale-hover:  1.02;
  --scale-pop:    1.08;
}
```

### 1.3 Theme Switch — Transition Toàn Màn Hình

Khi người dùng đổi theme, KHÔNG được flash trắng. Phải có transition:

```js
/**
 * switchTheme(newThemeId)
 * 
 * Phase 1 (0–200ms):   Canvas fade out + UI elements slide down 8px + fade
 * Phase 2 (200–400ms): Background color cross-fade đến màu theme mới
 * Phase 3 (400–700ms): Canvas fade in với theme mới + UI elements slide back up
 * 
 * Thực hiện bằng Web Animations API để không block main thread.
 */
async function switchTheme(newThemeId) {
  const root = document.getElementById('root');
  const canvas = document.getElementById('sea');
  const uiEls = document.querySelectorAll('.pill, .head, .box');

  // Phase 1: fade out
  await Promise.all([
    canvas.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 200, easing: 'ease-in', fill: 'forwards' }
    ).finished,
    ...Array.from(uiEls).map(el =>
      el.animate(
        [{ opacity: 1, transform: 'translateY(0px)' },
         { opacity: 0, transform: 'translateY(8px)' }],
        { duration: 150, easing: 'ease-in', fill: 'forwards' }
      ).finished
    )
  ]);

  // Phase 2: swap theme data + CSS vars
  applyThemeCSS(newThemeId);      // inject new CSS override
  currentTheme = THEMES.find(t => t.id === newThemeId);

  // Phase 3: fade in
  await Promise.all([
    canvas.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 350, easing: 'ease-out', fill: 'forwards' }
    ).finished,
    ...Array.from(uiEls).map((el, i) =>
      el.animate(
        [{ opacity: 0, transform: 'translateY(-6px)' },
         { opacity: 1, transform: 'translateY(0px)' }],
        { duration: 280, delay: i * 40, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
      ).finished
    )
  ]);

  // Clean up fill: forwards
  [canvas, ...uiEls].forEach(el => el.getAnimations().forEach(a => a.commitStyles()));
}
```

### 1.4 Input Box — Micro-interactions

```css
/* Input box hover */
.box {
  transition:
    transform        var(--dur-fast)   var(--ease-spring),
    box-shadow       var(--dur-normal) var(--ease-out),
    border-color     var(--dur-normal) var(--ease-out),
    background-color var(--dur-slow)   var(--ease-out);
}
.box:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-hover);   /* theme defines this */
}
.box:focus-within {
  transform: translateY(-3px) scale(1.004);
  border-color: var(--accent-color);
}

/* Send button press */
.send {
  transition:
    transform    var(--dur-fast)    var(--ease-spring),
    background   var(--dur-fast)    var(--ease-out),
    box-shadow   var(--dur-normal)  var(--ease-out);
  cursor: pointer;
}
.send:hover  { transform: scale(var(--scale-hover)); }
.send:active { transform: scale(var(--scale-press)); }

/* Send button → ASCII point earned animation */
.send.earned::after {
  content: '+' attr(data-pts) ' pts';
  position: absolute;
  top: -32px; left: 50%;
  transform: translateX(-50%) translateY(0);
  animation: floatUp 1.2s var(--ease-out) forwards;
  font-family: 'Geist Mono', monospace;
  font-size: 18px;
  color: var(--accent-color);
  pointer-events: none;
  white-space: nowrap;
}
@keyframes floatUp {
  0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
  70%  { opacity: 1; transform: translateX(-50%) translateY(-28px); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-44px); }
}
```

### 1.5 Spotlight Toolbar — Magnetic Snap + Glow Beam

```css
/* Toolbar container */
#app_root .spotlight-toolbar {
  position: relative;
  --glow-x: 50%;
  --glow-y: 50%;
  --accent-rgb: 82, 168, 255;   /* update per theme */
}

/* Cursor-following glow underlay */
#app_root .spotlight-toolbar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle 90px at var(--glow-x) var(--glow-y),
    rgba(var(--accent-rgb), 0.22) 0%,
    transparent 100%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
  z-index: 0;
}
#app_root .spotlight-toolbar:hover::before { opacity: 1; }

/* Tab buttons — magnetic spring snap */
#app_root .spotlight-toolbar .tab-btn {
  position: relative;
  transition: transform var(--dur-instant) var(--ease-snap);
  z-index: 1;
}
#app_root .spotlight-toolbar .tab-btn:hover {
  transform: scale(1.06) translateY(-1px);
}
#app_root .spotlight-toolbar .tab-btn:active {
  transform: scale(0.95);
  transition-duration: 60ms;
}

/* Active tab indicator — sliding pill */
#app_root .spotlight-toolbar .tab-indicator {
  position: absolute;
  border-radius: inherit;
  background: rgba(var(--accent-rgb), 0.15);
  border: 1px solid rgba(var(--accent-rgb), 0.4);
  transition:
    left     var(--dur-normal) var(--ease-spring),
    width    var(--dur-normal) var(--ease-spring),
    opacity  var(--dur-fast)   var(--ease-out);
  pointer-events: none;
}
```

```js
// Toolbar JS: cursor tracking + magnetic hit area
const toolbar = document.querySelector('#app_root .spotlight-toolbar');
if (toolbar) {
  toolbar.addEventListener('mousemove', (e) => {
    const rect = toolbar.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
    toolbar.style.setProperty('--glow-x', x);
    toolbar.style.setProperty('--glow-y', y);
  });

  // Magnetic snap: buttons pull cursor when within 20px
  toolbar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * 0.18, dy = (e.clientY - cy) * 0.14;
      btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}
```

### 1.6 Page-level Scroll & Route Transitions

```css
/* Màn hình mới trượt vào từ bên phải */
.page-enter {
  animation: pageSlideIn var(--dur-slow) var(--ease-out) forwards;
}
.page-exit {
  animation: pageSlideOut var(--dur-normal) var(--ease-in) forwards;
}

@keyframes pageSlideIn {
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes pageSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-20px); }
}

/* Shop overlay — rise from bottom */
.shop-overlay-enter {
  animation: shopRise var(--dur-scenic) var(--ease-spring) forwards;
}
.shop-overlay-exit {
  animation: shopSink var(--dur-slow) var(--ease-in) forwards;
}

@keyframes shopRise {
  from { opacity: 0; transform: translateY(60px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes shopSink {
  from { opacity: 1; transform: translateY(0)    scale(1); }
  to   { opacity: 0; transform: translateY(40px) scale(0.98); }
}
```

### 1.7 Canvas Performance (cho animation 60fps)

```js
/**
 * Tối ưu vòng lặp render:
 * - Dùng OffscreenCanvas cho web worker nếu browser hỗ trợ
 * - Cache static layers (reef, background) — chỉ vẽ lại khi theme đổi
 * - requestAnimationFrame với timestamp delta để tốc độ không phụ thuộc frame rate
 * - Tạm dừng animation khi tab bị ẩn (visibilitychange)
 */
let rafId = null, lastT = null, accumT = 0;
const TARGET_FPS = 60, FRAME_MS = 1000 / TARGET_FPS;

function loop(now) {
  rafId = requestAnimationFrame(loop);
  if (lastT === null) { lastT = now; return; }

  const dt = Math.min(now - lastT, 50); // cap delta at 50ms (tab switch recovery)
  lastT = now;
  accumT += dt;

  // throttle to target FPS on slow devices
  if (accumT < FRAME_MS) return;
  accumT -= FRAME_MS;

  draw(sceneTime);
  sceneTime += dt / 1000;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
    lastT = null;
  } else {
    rafId = requestAnimationFrame(loop);
  }
});
```

---

## PHẦN 2 — THEME SHOP UI

### 2.1 Cấu trúc màn hình Shop

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════╗   │
│  ║  🎨  ASCII THEME SHOP          [Balance: 2,450 pts ▸]   ║   │
│  ╚═══════════════════════════════════════════════════════════╝   │
│                                                                   │
│  [All]  [Unlocked ✓]  [1K]  [2.5K]  [5K]  [10K]  [Active ●]   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ░░▒▒▓▓██▓▓▒▒│  │ ░░▒▒▓▓██▓▓▒▒│  │ ░░▒▒▓▓██▓▓▒▒│          │
│  │  [PREVIEW]   │  │  [PREVIEW]   │  │  [PREVIEW]   │          │
│  │              │  │              │  │  🔒 LOCKED   │          │
│  │ Honu Lagoon  │  │ Matrix Rain  │  │ Neon Tokyo   │          │
│  │ ● ACTIVE     │  │ ✓ UNLOCKED  │  │  2,500 pts   │          │
│  │    [USE]     │  │  [USE]      │  │  [UNLOCK]    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HOW TO EARN POINTS                                       │   │
│  │  ──────────────────────────────────────────────────────  │   │
│  │  💬 Send a message          +10 pts                       │   │
│  │  📅 Daily login streak      +50 pts/day                  │   │
│  │  ⭐ Rate a response         +25 pts                       │   │
│  │  🔥 7-day streak bonus      +200 pts                     │   │
│  │  📤 Share a conversation    +100 pts                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Theme Card Component (HTML/CSS)

```html
<div class="theme-card" data-id="neon_tokyo" data-tier="2" data-cost="2500" data-state="locked">

  <!-- Preview canvas thumbnail -->
  <div class="card-preview">
    <canvas class="mini-canvas" width="320" height="200"></canvas>
    <div class="card-tier-badge">TIER 2</div>
    <div class="card-lock-overlay">
      <svg class="lock-icon"><!-- lock SVG --></svg>
      <span class="lock-cost">2,500 pts</span>
    </div>
  </div>

  <!-- Info -->
  <div class="card-body">
    <div class="card-name">Neon Tokyo</div>
    <div class="card-desc">Cyberpunk streets at midnight</div>
    <div class="card-meta">
      <span class="card-ascii">ASCII: |\~·</span>
      <span class="card-dot" style="background: #ff2bd6"></span>
    </div>
  </div>

  <!-- Action button -->
  <button class="card-action locked">
    <span class="action-label">UNLOCK</span>
    <span class="action-cost">2,500</span>
    <svg class="action-coin"><!-- coin icon --></svg>
  </button>

</div>
```

### 2.3 Theme Card CSS

```css
.theme-card {
  --card-accent: #52a8ff;   /* overridden per theme */
  position: relative;
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform     var(--dur-normal) var(--ease-spring),
    border-color  var(--dur-normal) var(--ease-out),
    box-shadow    var(--dur-normal) var(--ease-out);
}

.theme-card:hover {
  transform: translateY(-4px) scale(1.015);
  border-color: rgba(255,255,255,0.22);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.theme-card:hover .mini-canvas {
  animation: previewPlay 0.3s ease forwards;  /* resume mini animation */
}

/* Lock overlay */
.card-lock-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  transition: opacity var(--dur-normal) var(--ease-out);
}
.theme-card[data-state="unlocked"] .card-lock-overlay,
.theme-card[data-state="active"]   .card-lock-overlay { opacity: 0; pointer-events: none; }

/* Active theme highlight */
.theme-card[data-state="active"] {
  border-color: var(--card-accent);
  box-shadow: 0 0 0 1px var(--card-accent), 0 0 32px rgba(var(--accent-rgb), 0.3);
}
.theme-card[data-state="active"]::before {
  content: '● ACTIVE';
  position: absolute; top: 10px; right: 10px;
  font-family: 'Geist Mono', monospace;
  font-size: 11px; color: var(--card-accent);
  background: rgba(var(--accent-rgb), 0.15);
  padding: 3px 8px; border-radius: 100px;
  border: 1px solid rgba(var(--accent-rgb), 0.4);
}

/* Action button */
.card-action {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 16px;
  border: none; cursor: pointer;
  font-family: 'Geist Mono', monospace;
  font-size: 13px; font-weight: 500; letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: 0 0 15px 15px;
  transition:
    background    var(--dur-fast)   var(--ease-out),
    transform     var(--dur-fast)   var(--ease-spring),
    box-shadow    var(--dur-normal) var(--ease-out);
}
.card-action:active { transform: scale(0.97); }

/* State variants */
.card-action.locked    { background: #1f1f1f; color: #999; }
.card-action.locked:hover { background: #2a2a2a; }
.card-action.unlocked  { background: rgba(var(--accent-rgb), 0.12); color: var(--card-accent); border-top: 1px solid rgba(var(--accent-rgb), 0.2); }
.card-action.active    { background: var(--card-accent); color: #000; font-weight: 600; }
.card-action.active:hover { box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.5); }

/* Insufficient funds shake */
.card-action.shake {
  animation: shake 0.4s var(--ease-snap);
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(5px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(3px); }
}

/* Unlock success burst */
.theme-card.just-unlocked::after {
  content: '';
  position: absolute; inset: -2px;
  border-radius: 17px;
  border: 2px solid var(--card-accent);
  animation: unlockRing 0.8s var(--ease-out) forwards;
  pointer-events: none;
}
@keyframes unlockRing {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.08); }
}
```

### 2.4 Mini Preview Canvas (animated thumbnail)

```js
/**
 * Mỗi theme card có một canvas nhỏ chạy theme animation thu nhỏ.
 * Chạy ở 24fps (tiết kiệm CPU), chỉ animate khi card visible (IntersectionObserver).
 */
function initMiniPreviews() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      const canvas = target.querySelector('.mini-canvas');
      if (!canvas) return;
      const themeId = target.dataset.id;
      if (isIntersecting) startMiniPreview(canvas, themeId);
      else stopMiniPreview(canvas);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.theme-card').forEach(card => observer.observe(card));
}

function startMiniPreview(canvas, themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme || canvas._rafId) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const k = W / 1944;  // scale factor relative to full canvas
  let t = 0, last = null;

  const miniEnv = createMiniEnv(W, H, k);  // stripped-down env object

  function frame(now) {
    if (last) t += Math.min((now - last) / 1000, 0.05);
    last = now;

    ctx.clearRect(0, 0, W, H);
    miniEnv.t = t; miniEnv.k = k;

    // Draw background
    if (theme.bg) theme.bg(ctx, { W, H, t, k });

    // Draw scene (simplified: no hitboxes, no mouse interaction)
    if (theme.scene) {
      try { theme.scene(ctx, miniEnv); } catch(e) {}
    }

    // Draw a few ambient glyphs
    ctx.font = '500 7px "Geist Mono"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (theme.ambient) {
      try {
        theme.ambient({ W, H, t, cw: 8, ch: 10, mouse: null },
          (c, r, ch, color) => {
            ctx.fillStyle = color;
            ctx.fillText(ch, c*8 + 4, r*10 + 5);
          }, { rows: Math.ceil(H/10), cols: Math.ceil(W/8) });
      } catch(e) {}
    }

    canvas._rafId = requestAnimationFrame(frame);
  }

  canvas._rafId = requestAnimationFrame(frame);
}

function stopMiniPreview(canvas) {
  if (canvas._rafId) { cancelAnimationFrame(canvas._rafId); canvas._rafId = null; }
}
```

### 2.5 Filter & Sort Tabs

```js
// Filter state
const shopState = {
  filter: 'all',     // 'all' | 'unlocked' | '1k' | '2.5k' | '5k' | '10k' | 'active'
  sort:   'tier',    // 'tier' | 'name' | 'new'
};

function renderShop() {
  const cards = document.querySelectorAll('.theme-card');
  cards.forEach(card => {
    const cost  = parseInt(card.dataset.cost);
    const state = card.dataset.state;
    const tier  = parseInt(card.dataset.tier);

    let visible = true;
    if (shopState.filter === 'unlocked') visible = state !== 'locked';
    else if (shopState.filter === 'active')  visible = state === 'active';
    else if (shopState.filter === '1k')   visible = cost <= 1000;
    else if (shopState.filter === '2.5k') visible = cost === 2500;
    else if (shopState.filter === '5k')   visible = cost === 5000;
    else if (shopState.filter === '10k')  visible = cost === 10000;

    // Animate in/out
    if (visible) {
      card.style.display = '';
      card.animate(
        [{ opacity: 0, transform: 'scale(0.94)' },
         { opacity: 1, transform: 'scale(1)' }],
        { duration: 200, delay: [...cards].indexOf(card) * 25,
          easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
      );
    } else {
      card.animate(
        [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.94)' }],
        { duration: 120, easing: 'ease-in', fill: 'forwards' }
      ).finished.then(() => { card.style.display = 'none'; });
    }
  });
}
```

---

## PHẦN 3 — POINT ECONOMY SYSTEM

### 3.1 Point Data Schema (localStorage)

```js
// Key: 'ascii_points_v1'
const defaultPointData = {
  balance: 0,
  lifetime: 0,
  streak: 0,
  lastLoginDate: null,
  unlockedThemes: ['lagoon', 'claude', 'clouds'],  // free themes
  activeTheme: 'lagoon',
  history: [],  // [{ action, pts, ts }] — last 50 entries
  stats: {
    messagesSent: 0,
    ratingsGiven: 0,
    sharesDone: 0,
    longestStreak: 0,
  }
};

function loadPoints() {
  try {
    return JSON.parse(localStorage.getItem('ascii_points_v1')) ?? defaultPointData;
  } catch { return defaultPointData; }
}

function savePoints(data) {
  localStorage.setItem('ascii_points_v1', JSON.stringify(data));
}
```

### 3.2 Earn Points Actions

```js
const POINT_ACTIONS = {
  message_sent:       { pts: 10,  label: '+10 pts', icon: '💬', max_per_day: 200 },
  daily_login:        { pts: 50,  label: '+50 pts', icon: '📅', max_per_day: 1 },
  rate_response:      { pts: 25,  label: '+25 pts', icon: '⭐', max_per_day: 100 },
  share_conversation: { pts: 100, label: '+100 pts', icon: '📤', max_per_day: 3 },
  streak_3day:        { pts: 100, label: '+100 pts streak', icon: '🔥', trigger: 3 },
  streak_7day:        { pts: 200, label: '+200 pts streak', icon: '🔥', trigger: 7 },
  streak_30day:       { pts: 1000,label: '+1K streak!', icon: '👑', trigger: 30 },
};

async function earnPoints(action, data = {}) {
  const ptData = loadPoints();
  const def = POINT_ACTIONS[action];
  if (!def) return;

  // Check daily cap
  const today = new Date().toDateString();
  const todayLog = ptData.history.filter(e => new Date(e.ts).toDateString() === today && e.action === action);
  const dayTotal = todayLog.reduce((s, e) => s + e.pts, 0);
  if (def.max_per_day && dayTotal >= def.max_per_day) return;

  ptData.balance  += def.pts;
  ptData.lifetime += def.pts;
  ptData.history.unshift({ action, pts: def.pts, ts: Date.now(), ...data });
  ptData.history = ptData.history.slice(0, 50);  // keep last 50

  savePoints(ptData);
  showPointToast(def.pts, def.label, def.icon);
  updateBalanceDisplay(ptData.balance);
}
```

### 3.3 Point Toast Notification

```js
/**
 * Toast nhỏ xuất hiện góc màn hình, slide in → stay 2s → slide out.
 * Theme-aware: dùng accent color của theme hiện tại.
 */
function showPointToast(pts, label, icon) {
  const toast = document.createElement('div');
  toast.className = 'point-toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-pts">+${pts}</span>
    <span class="toast-label">ASCII pts</span>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  });
}
```

```css
.point-toast {
  position: fixed;
  bottom: 32px; right: 32px;
  z-index: 9999;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px;
  background: #0a0a0a;
  border: 1px solid rgba(var(--accent-rgb), 0.5);
  border-radius: 100px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(var(--accent-rgb), 0.2);
  font-family: 'Geist Mono', monospace;
  font-size: 14px; color: #fff;
  transform: translateX(120%);
  transition: transform var(--dur-normal) var(--ease-spring);
}
.point-toast.show { transform: translateX(0); }
.point-toast.hide { transform: translateX(120%); transition-timing-function: var(--ease-in); }
.point-toast .toast-pts { color: var(--accent-color); font-size: 18px; font-weight: 600; }
```

### 3.4 Unlock Theme Flow

```js
async function unlockTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;

  const ptData = loadPoints();
  const cost = THEME_COSTS[themeId] ?? 1000;

  if (ptData.balance < cost) {
    // Insufficient funds: shake card + show deficit toast
    const card = document.querySelector(`.theme-card[data-id="${themeId}"]`);
    card?.querySelector('.card-action')?.classList.add('shake');
    setTimeout(() => card?.querySelector('.card-action')?.classList.remove('shake'), 500);

    showDeficitToast(cost - ptData.balance);
    return;
  }

  // Confirm modal (optional, skip for small amounts)
  if (cost >= 5000) {
    const confirmed = await showConfirmModal({
      title: `Unlock ${theme.name}?`,
      body:  `This will spend ${cost.toLocaleString()} ASCII points.`,
      accent: theme.accent,
    });
    if (!confirmed) return;
  }

  // Deduct points
  ptData.balance -= cost;
  ptData.unlockedThemes.push(themeId);
  ptData.history.unshift({ action: 'unlock', themeId, pts: -cost, ts: Date.now() });
  savePoints(ptData);

  // Update card state with celebration
  const card = document.querySelector(`.theme-card[data-id="${themeId}"]`);
  if (card) {
    card.dataset.state = 'unlocked';
    card.classList.add('just-unlocked');
    setTimeout(() => card.classList.remove('just-unlocked'), 1000);
    card.querySelector('.card-action').className = 'card-action unlocked';
    card.querySelector('.action-label').textContent = 'USE';
    card.querySelector('.action-cost').style.display = 'none';
  }

  updateBalanceDisplay(ptData.balance);
  showPointToast(-cost, 'Theme unlocked! 🎨', '🔓');

  // Auto-apply theme
  setTimeout(() => applyTheme(themeId), 600);
}
```

### 3.5 Balance Display Widget

```html
<!-- Pinned to top-right of app shell -->
<button class="pts-badge" onclick="openShop()">
  <svg class="pts-coin"><!-- coin/sparkle icon --></svg>
  <span class="pts-value" id="pts-display">2,450</span>
  <span class="pts-unit">pts</span>
  <svg class="pts-shop-arrow"><!-- chevron right --></svg>
</button>
```

```css
.pts-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px 6px 10px;
  background: rgba(var(--accent-rgb), 0.1);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
  border-radius: 100px;
  font-family: 'Geist Mono', monospace;
  font-size: 13px; color: var(--accent-color);
  cursor: pointer;
  transition:
    background  var(--dur-fast) var(--ease-out),
    transform   var(--dur-fast) var(--ease-spring),
    box-shadow  var(--dur-normal) var(--ease-out);
}
.pts-badge:hover {
  background: rgba(var(--accent-rgb), 0.18);
  transform: scale(1.03);
  box-shadow: 0 0 16px rgba(var(--accent-rgb), 0.25);
}
.pts-badge:active { transform: scale(0.97); }

/* Animated number tick when balance updates */
.pts-value.ticking {
  animation: numTick 0.6s var(--ease-spring);
}
@keyframes numTick {
  0%  { transform: translateY(0); }
  30% { transform: translateY(-4px); color: #62c073; }
  60% { transform: translateY(2px); }
  100%{ transform: translateY(0); }
}
```

```js
function updateBalanceDisplay(newBalance) {
  const el = document.getElementById('pts-display');
  if (!el) return;
  el.textContent = newBalance.toLocaleString();
  el.classList.remove('ticking');
  void el.offsetWidth;  // reflow to restart animation
  el.classList.add('ticking');
  setTimeout(() => el.classList.remove('ticking'), 700);
}
```

---

## PHẦN 4 — THEME METADATA (bổ sung vào THEMES array)

Mỗi theme object cần thêm các fields sau để Shop hoạt động:

```js
{
  id: "neon_tokyo",
  name: "Neon Tokyo",
  // ... existing fields ...

  // Shop metadata
  cost:    2500,               // ASCII points để mở khóa
  tier:    2,                  // 1|2|3|4
  free:    false,              // true = không cần điểm
  accent:  "#ff2bd6",          // màu accent cho card highlight
  accentRgb: "255,43,214",     // rgb tuple cho CSS vars
  cardBg:  "#120412",          // màu preview background
  preview: {
    // Gợi ý render preview (mini canvas sẽ dùng)
    bgColor:   "#120412",
    glowColor: "rgba(255,43,214,0.3)",
    sampleGlyphs: "|\\ ·~",
  },
  tags: ["cyberpunk", "dark", "neon", "city"],
  description: "Rain-soaked streets lit by neon kanji, electric magenta and cyan.",
  since: "2025-01",            // version/date added
}
```

### Free themes (mở khóa mặc định)

```js
const FREE_THEMES = ['claude', 'clouds', 'lagoon'];
// Người dùng mới có ngay 3 theme này, không cần điểm.
```

---

## TỔNG HỢP: INTEGRATION CHECKLIST

Khi triển khai, đảm bảo:

- [ ] `--accent-rgb` CSS var được cập nhật khi đổi theme (để glow/border đúng màu)
- [ ] `switchTheme()` được gọi sau unlock (delay 600ms cho animation card xong trước)
- [ ] Mini preview canvas chỉ chạy khi card trong viewport (IntersectionObserver)
- [ ] Point toast stack: nhiều toast cùng lúc → offset `bottom` theo số toast hiện tại
- [ ] `earnPoints('message_sent')` được hook vào event submit message
- [ ] `earnPoints('daily_login')` được gọi khi app mount, check `lastLoginDate`
- [ ] Balance display update ngay sau mọi earn/spend action
- [ ] Shop filter animation dùng `display: none` chỉ sau khi animation fade out xong
- [ ] `localStorage` có fallback (private mode / storage full): dùng `sessionStorage` hoặc in-memory
- [ ] Theme cost được validate ở cả client và backend (nếu có sync)
- [ ] Unlock không thể bị double-spent (check `unlockedThemes.includes(id)` trước khi deduct)

---

## ⚠️ PHẦN 5 — QUY TẮC TÍCH HỢP AN TOÀN (BẮT BUỘC ĐỌC TRƯỚC)

> **Tất cả những gì ở Phần 1–4 chỉ là LỚP BỔ SUNG bên ngoài.** Không được chạm vào logic nghiệp vụ, routing, API, state management, hay bất kỳ tính năng hiện có nào của app. Đây là nguyên tắc số một, không có ngoại lệ.

### 5.1 Triết lý tích hợp — "Additive Only"

Toàn bộ hệ thống Theme Shop + Motion + Points phải được xây dựng theo mô hình **Additive Layer**: chỉ thêm vào, không sửa, không xóa, không bọc lại code cũ.

| ✅ ĐƯỢC PHÉP | ❌ CẤM TUYỆT ĐỐI |
| --- | --- |
| Thêm CSS class mới vào element có sẵn | Sửa CSS của class/ID hiện tại |
| Thêm `<div>` / `<canvas>` / `<script>` mới vào DOM | Xóa hoặc thay thế DOM node hiện có |
| Lắng nghe event bằng `addEventListener` | Override hoặc `removeEventListener` listener cũ |
| Đọc state app qua DOM / data attribute | Ghi thẳng vào state / store của app |
| Dùng `MutationObserver` để react theo app | Monkey-patch method của framework (React, Vue…) |
| Inject `<style>` tag mới với selector riêng | Sửa `<style>` tag hoặc stylesheet có sẵn |
| Wrap UI bằng overlay/portal ngoài `#root` | Thay đổi `#root` hoặc `#frame` structure |
| Hook vào lifecycle app bằng `CustomEvent` | Intercept hoặc cancel event của app |
| Lưu dữ liệu điểm vào `localStorage` riêng | Đọc/ghi `localStorage` key của app gốc |
| Đổi CSS custom property (`--var`) trên `:root` | Đổi giá trị `style` inline trên element app |

### 5.2 Cấu trúc file — Tách biệt hoàn toàn

Toàn bộ code bổ sung phải nằm trong các file **riêng biệt**, không được nhúng vào file app gốc:

```
📁 project/
├── 📁 app/                    ← VÙNG CẤM — không chỉnh sửa
│   ├── index.html
│   ├── main.js
│   ├── styles.css
│   └── ...
│
└── 📁 ascii-layer/            ← VÙNG LÀM VIỆC — chỉ thêm ở đây
    ├── ascii-layer.css        ← CSS theme + motion tokens (import sau app CSS)
    ├── ascii-themes.js        ← THEMES array + canvas engine
    ├── ascii-shop.js          ← Shop UI, unlock logic, point economy
    ├── ascii-motion.js        ← Transition system, toolbar effects
    └── ascii-init.js          ← Entry point: mount sau khi app đã render xong
```

Trong `index.html` gốc, chỉ được thêm **duy nhất 2 dòng** ở cuối `<body>`, không chạm gì khác:

```html
<!-- ASCII Layer — additive only, safe to remove -->
<link rel="stylesheet" href="/ascii-layer/ascii-layer.css">
<script src="/ascii-layer/ascii-init.js" defer></script>
```

### 5.3 Mount Pattern — Chờ app render xong mới chạy

Layer này KHÔNG được chạy trước app. Phải đợi app render hoàn chỉnh rồi mới mount:

```js
// ascii-init.js
(function asciiLayerInit() {

  // 1. Không tự động chạy ngay — đợi DOM và app sẵn sàng
  function waitForApp(selector, timeout = 8000) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) return resolve();
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject('timeout'); }, timeout);
    });
  }

  // 2. Mount chỉ khi app shell đã có mặt
  waitForApp('#root').then(() => {
    mountThemeCanvas();   // thêm canvas layer bên dưới UI
    mountShopButton();    // thêm nút mở Shop vào shell
    initMotionTokens();   // inject CSS vars, KHÔNG override existing styles
    initPointSystem();    // khởi động point tracking
    initToolbarEffects(); // magnetic snap, glow beam
    console.log('[ASCII Layer] mounted successfully');
  }).catch(() => {
    console.warn('[ASCII Layer] app root not found — skipping mount');
  });

})();
```

### 5.4 CSS Selector Safety — Không được xung đột

Mọi selector CSS của layer này phải có prefix **`.ascii-`** hoặc nằm trong **`#ascii-layer`**. Tuyệt đối không viết selector naked có thể vô tình match element của app:

```css
/* ❌ SAI — có thể override style app */
.pill { background: red; }
button { transition: all 0.3s; }
:root { --color: blue; }

/* ✅ ĐÚNG — scoped, an toàn */
#ascii-layer .ascii-shop { background: #0a0a0a; }
.ascii-pts-badge { border-radius: 100px; }

/* ✅ ĐÚNG — CSS vars mới, không ghi đè var cũ */
:root {
  --ascii-dur-fast: 150ms;
  --ascii-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ascii-accent: #52a8ff;
}

/* ✅ ĐÚNG — thêm class vào element app để augment, không override */
/* (class được thêm bằng JS: el.classList.add('ascii-enhanced')) */
.ascii-enhanced.pill { box-shadow: 0 0 20px rgba(var(--ascii-accent-rgb), 0.3); }
```

### 5.5 Event Handling — Chỉ lắng nghe, không can thiệp

```js
// ❌ SAI — block event của app, gây bug
document.querySelector('.send').onclick = (e) => {
  e.preventDefault();  // NGUY HIỂM: ngăn app gửi tin nhắn
  myHandler(e);
};

// ❌ SAI — override handler gốc
const originalHandler = btn.__reactEventHandlers.onClick;
btn.__reactEventHandlers.onClick = () => { myHandler(); originalHandler(); };

// ✅ ĐÚNG — passive listener, không ảnh hưởng event gốc
document.querySelector('.send')?.addEventListener('click', (e) => {
  // Chỉ earn points, không stopPropagation, không preventDefault
  earnPoints('message_sent');
}, { passive: true });

// ✅ ĐÚNG — dùng MutationObserver để detect app state change
const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    // React theo DOM change của app, không can thiệp
    if (m.target.matches('.message-list')) updatePointUI();
  });
});
observer.observe(document.querySelector('#root'), {
  childList: true, subtree: true, attributeFilter: ['class', 'data-state']
});
```

### 5.6 Canvas Layer — Render dưới UI, không chặn click

Canvas ASCII phải được mount sao cho không bao giờ chặn interaction của user với app:

```js
function mountThemeCanvas() {
  // Tạo wrapper riêng, KHÔNG thay thế #sea hoặc #root
  const wrapper = document.createElement('div');
  wrapper.id = 'ascii-canvas-layer';
  wrapper.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 0;              /* dưới mọi thứ */
    pointer-events: none;    /* QUAN TRỌNG: không block click */
    overflow: hidden;
  `;

  const canvas = document.createElement('canvas');
  canvas.id = 'ascii-bg-canvas';
  canvas.style.cssText = 'width:100%;height:100%;pointer-events:none;';
  wrapper.appendChild(canvas);

  // Insert TRƯỚC #frame, không bên trong
  document.body.insertBefore(wrapper, document.body.firstChild);
}
```

### 5.7 Shop UI — Overlay độc lập, không sửa layout app

Màn hình Shop là một **portal overlay** hoàn toàn độc lập. Nó hiện lên trên cùng và đóng lại, không ảnh hưởng gì đến layout bên dưới:

```js
function mountShopOverlay() {
  // Portal ngoài #root để tránh stacking context conflict
  const portal = document.createElement('div');
  portal.id = 'ascii-shop-portal';
  portal.style.cssText = `
    position: fixed; inset: 0;
    z-index: 99999;
    display: none;         /* ẩn mặc định */
    pointer-events: none;  /* chỉ bật khi mở shop */
  `;
  portal.innerHTML = buildShopHTML();
  document.body.appendChild(portal);  // append vào body, KHÔNG vào #root
}

function openShop() {
  const portal = document.getElementById('ascii-shop-portal');
  portal.style.display = 'flex';
  portal.style.pointerEvents = 'auto';
  portal.classList.add('ascii-shop-enter');
  // App vẫn chạy bình thường phía dưới
}

function closeShop() {
  const portal = document.getElementById('ascii-shop-portal');
  portal.classList.remove('ascii-shop-enter');
  portal.classList.add('ascii-shop-exit');
  setTimeout(() => {
    portal.style.display = 'none';
    portal.style.pointerEvents = 'none';
    portal.classList.remove('ascii-shop-exit');
  }, 450);
}
```

### 5.8 Graceful Degradation — Layer phải tự tắt nếu có vấn đề

Nếu layer bị lỗi vì bất kỳ lý do gì (app update DOM structure, browser cũ, conflict…), app phải vẫn hoạt động bình thường. Layer tự xử lý lỗi của chính nó:

```js
// Bọc toàn bộ init trong try-catch
try {
  await waitForApp('#root');
  mountThemeCanvas();
  mountShopButton();
  // ...
} catch (err) {
  console.warn('[ASCII Layer] failed to mount, disabling:', err);
  // Tự dọn dẹp nếu mount nửa chừng
  document.getElementById('ascii-canvas-layer')?.remove();
  document.getElementById('ascii-shop-portal')?.remove();
  document.getElementById('ascii-pts-widget')?.remove();
  // App gốc không bị ảnh hưởng
}

// Nút tắt khẩn cấp — dành cho debug
window.__asciiLayerDisable = () => {
  document.getElementById('ascii-canvas-layer')?.remove();
  document.getElementById('ascii-shop-portal')?.remove();
  document.getElementById('ascii-pts-widget')?.remove();
  document.querySelectorAll('.ascii-enhanced').forEach(el => {
    el.classList.remove('ascii-enhanced');
  });
  console.log('[ASCII Layer] fully disabled');
};
```

### 5.9 Checklist Kiểm Tra Trước Khi Merge

Trước mỗi lần tích hợp, phải pass hết danh sách này:

- [ ] **Smoke test:** Xóa 2 dòng script/link của ascii-layer → app chạy hoàn toàn bình thường, không lỗi
- [ ] **Click test:** Mọi button, link, input của app vẫn nhận được click khi layer đang bật
- [ ] **Route test:** Điều hướng giữa các trang app không bị block hoặc delay bởi layer
- [ ] **Submit test:** Gửi tin nhắn / submit form vẫn hoạt động, `earnPoints()` chỉ là side effect
- [ ] **Scroll test:** Scroll trong app không bị capture bởi shop overlay
- [ ] **Console test:** Không có error, không có warning từ app gốc sau khi thêm layer
- [ ] **localStorage test:** Key của app gốc không bị đọc/ghi/xóa bởi layer
- [ ] **Stress test:** Mở shop → đóng shop → gửi tin nhắn → đổi theme → lặp 20 lần → không memory leak, không lag
- [ ] **Disable test:** Gọi `window.__asciiLayerDisable()` → app sạch hoàn toàn, không còn dấu vết của layer
- [ ] **Mobile test:** Canvas layer không gây scroll lag trên iOS/Android, pointer-events: none hoạt động đúng