/**
 * ASCII Themes & Canvas Rendering Engine
 * Harmonized with SmartStudy's system architecture:
 * Full per-theme token palettes for Toolbar, Tab buttons, Sidebar, Dropdowns, Cards, and System Buttons.
 */
(function () {
  'use strict';

  const FREE_THEMES = [
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

  const THEMES = [
    {
      id: 'lagoon',
      name: 'Ocean Lagoon (Xanh Đại Dương)',
      cost: 0,
      tier: 'free',
      free: true,
      accent: '#0284c7',
      accentBright: '#38bdf8',
      accentRgb: '56, 189, 248',
      cardBg: 'linear-gradient(155deg, #0b2545 0%, #134074 55%, #07192e 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(30, 58, 110, 0.94) 0%, rgba(37, 74, 142, 0.94) 50%, rgba(2, 106, 167, 0.94) 100%)',
        toolbarBorder: 'rgba(125, 211, 252, 0.45)',
        toolbarShadow: '0 15px 35px -8px rgba(15, 23, 42, 0.32), 0 6px 20px -4px rgba(2, 132, 199, 0.28), inset 0 -1px 0 rgba(125, 211, 252, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.13)',
        tabText: '#f0f9ff',
        tabBorder: 'rgba(186, 230, 253, 0.30)',
        tabActiveBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#7dd3fc',
        tabActiveShadow: '0 6px 16px -2px rgba(2, 132, 199, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        tabHoverBg: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
        tabHoverBorder: '#e0f2fe',
        tabHoverShadow: '0 14px 28px -4px rgba(15, 23, 42, 0.42), 0 0 22px 2px rgba(56, 189, 248, 0.58)',
        sidebarBg: 'linear-gradient(180deg, #1e3a6e 0%, #1d4e89 55%, #162d59 100%)',
        sidebarHeaderBg: 'rgba(22, 45, 89, 0.55)',
        sidebarFooterBg: '#162d59',
        sidebarBorder: 'rgba(56, 189, 248, 0.35)',
        sidebarCtaBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
        sidebarCtaBorder: 'rgba(125, 211, 252, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
        sidebarTabHoverBg: '#0284c7',
        sidebarBadgeBg: 'rgba(12, 74, 110, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #0369a1 0%, #1e3a8a 100%)',
        dropdownBg: 'rgba(20, 42, 82, 0.97)',
        dropdownBorder: 'rgba(125, 211, 252, 0.42)',
        workspaceBg: 'linear-gradient(180deg, rgba(235, 246, 255, 0.78) 0%, rgba(244, 250, 255, 0.82) 50%, rgba(230, 243, 254, 0.78) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.93)',
        cardSubtleBg: '#eef7ff',
        cardBorder: '#bae6fd',
        cardHoverBorder: '#38bdf8',
        primaryBtnBg: '#0284c7',
        primaryBtnHover: '#0369a1'
      },
      preview: {
        glyphSample: '~ ≈ ≋ · ° ∘ ~',
        moodLabel: 'Ocean Blue · Harmonized · Calm Waves'
      },
      tags: ['blue', 'water', 'calm', 'animated'],
      description: 'Sóng biển xanh ngọc hài hòa hoàn hảo với giao diện học tập chuẩn của hệ thống.',
      since: '1.0',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, 0, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#071b34');
          g.addColorStop(0.55, '#0e355e');
          g.addColorStop(1, '#051324');
        } else {
          g.addColorStop(0, '#e6f3fe');
          g.addColorStop(0.5, '#f0f8ff');
          g.addColorStop(1, '#e0f0fe');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const yBase = H * (0.28 + i * 0.24);
          const grad = ctx.createRadialGradient(
            W * (0.5 + 0.28 * Math.sin(t * 0.4 + i)),
            yBase,
            10,
            W * 0.5,
            yBase,
            W * 0.6
          );
          grad.addColorStop(0, isMini ? `rgba(56, 189, 248, ${0.22 - i * 0.04})` : `rgba(2, 132, 199, ${0.10 - i * 0.02})`);
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const waves = ['~', '≈', '≋', '·', '∘', '°'];
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const waveVal = Math.sin(c * 0.28 + t * 1.6 + r * 0.45) + Math.cos(r * 0.35 - t * 1.1);
            if (waveVal > 0.95) {
              const idx = Math.floor(((waveVal - 0.95) * 4 + c + r) % waves.length);
              const alpha = Math.min(isMini ? 0.88 : 0.42, (waveVal - 0.9) * (isMini ? 0.68 : 0.32));
              const color = isMini
                ? waveVal > 1.5 ? '#bae6fd' : '#38bdf8'
                : waveVal > 1.5 ? '#0284c7' : '#38bdf8';
              drawGlyph(c, r, waves[idx], color, alpha);
            }
          }
        }
      }
    },
    {
      id: 'claude',
      name: 'Claude Warmth (Xanh Lam & Cam Ấm)',
      cost: 0,
      tier: 'free',
      free: true,
      accent: '#d97706',
      accentBright: '#f59e0b',
      accentRgb: '245, 158, 11',
      cardBg: 'linear-gradient(155deg, #271a12 0%, #3d271a 55%, #1c120c 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(36, 59, 97, 0.95) 0%, rgba(68, 64, 92, 0.94) 52%, rgba(146, 64, 14, 0.92) 100%)',
        toolbarBorder: 'rgba(251, 191, 36, 0.45)',
        toolbarShadow: '0 15px 35px -8px rgba(15, 23, 42, 0.32), 0 6px 20px -4px rgba(217, 119, 6, 0.24), inset 0 -1px 0 rgba(252, 211, 77, 0.5)',
        tabBg: 'rgba(255, 255, 255, 0.13)',
        tabText: '#fef3c7',
        tabBorder: 'rgba(253, 230, 138, 0.28)',
        tabActiveBg: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#fde68a',
        tabActiveShadow: '0 6px 16px -2px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        tabHoverBg: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
        tabHoverBorder: '#fef3c7',
        tabHoverShadow: '0 14px 28px -4px rgba(15, 23, 42, 0.42), 0 0 22px 2px rgba(245, 158, 11, 0.55)',
        sidebarBg: 'linear-gradient(180deg, #243b61 0%, #334155 55%, #452719 100%)',
        sidebarHeaderBg: 'rgba(30, 41, 59, 0.55)',
        sidebarFooterBg: '#362015',
        sidebarBorder: 'rgba(251, 191, 36, 0.32)',
        sidebarCtaBg: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
        sidebarCtaBorder: 'rgba(253, 230, 138, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
        sidebarTabHoverBg: '#d97706',
        sidebarBadgeBg: 'rgba(120, 53, 15, 0.55)',
        mascotCardBg: 'linear-gradient(135deg, #b45309 0%, #243b61 100%)',
        dropdownBg: 'rgba(30, 41, 59, 0.97)',
        dropdownBorder: 'rgba(251, 191, 36, 0.4)',
        workspaceBg: 'linear-gradient(180deg, rgba(254, 249, 242, 0.80) 0%, rgba(245, 248, 254, 0.84) 55%, rgba(254, 246, 235, 0.80) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#fef8f0',
        cardBorder: '#fed7aa',
        cardHoverBorder: '#f59e0b',
        primaryBtnBg: '#d97706',
        primaryBtnHover: '#b45309'
      },
      preview: {
        glyphSample: '✦ · * ˚ ⋄ · ✦',
        moodLabel: 'Warm Amber · Slate Blue · Editorial'
      },
      tags: ['warm', 'calm', 'minimal', 'editorial'],
      description: 'Sự kết hợp tinh tế giữa xanh slate học thuật và sắc cam hổ phách ấm áp.',
      since: '1.0',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, env.W, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#1f140e');
          g.addColorStop(0.5, '#2e1d14');
          g.addColorStop(1, '#140d09');
        } else {
          g.addColorStop(0, '#fdf6ed');
          g.addColorStop(0.5, '#f4f7fc');
          g.addColorStop(1, '#fef3e6');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const g = ctx.createRadialGradient(
          W * (0.5 + Math.sin(t * 0.3) * 0.18),
          H * (0.45 + Math.cos(t * 0.25) * 0.12),
          10,
          W * 0.5,
          H * 0.5,
          Math.max(W, H) * 0.65
        );
        g.addColorStop(0, isMini ? 'rgba(245, 158, 11, 0.24)' : 'rgba(217, 119, 6, 0.09)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const glyphs = ['·', '✦', '⋄', '˚', '*', '•'];
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const seed = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
            const frac = seed - Math.floor(seed);
            if (frac > 0.82) {
              const pulse = 0.5 + 0.5 * Math.sin(t * (1.3 + (frac - 0.82) * 8) + c + r);
              if (pulse > 0.28) {
                const ch = glyphs[Math.floor((frac * 100) % glyphs.length)];
                const color = isMini
                  ? frac > 0.93 ? '#fde68a' : '#f59e0b'
                  : frac > 0.93 ? '#d97706' : '#ea580c';
                drawGlyph(c, r, ch, color, pulse * (isMini ? 0.82 : 0.38));
              }
            }
          }
        }
      }
    },
    {
      id: 'clouds',
      name: 'Stratus Clouds (Xanh Lam Mây Trời)',
      cost: 0,
      tier: 'free',
      free: true,
      accent: '#4f46e5',
      accentBright: '#818cf8',
      accentRgb: '129, 140, 248',
      cardBg: 'linear-gradient(155deg, #151b38 0%, #232d59 55%, #0f1329 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(37, 56, 120, 0.94) 0%, rgba(55, 48, 163, 0.94) 55%, rgba(79, 70, 229, 0.94) 100%)',
        toolbarBorder: 'rgba(165, 180, 252, 0.45)',
        toolbarShadow: '0 15px 35px -8px rgba(30, 27, 75, 0.35), 0 6px 20px -4px rgba(79, 70, 229, 0.28), inset 0 -1px 0 rgba(165, 180, 252, 0.5)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#eef2ff',
        tabBorder: 'rgba(199, 210, 254, 0.30)',
        tabActiveBg: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#a5b4fc',
        tabActiveShadow: '0 6px 16px -2px rgba(79, 70, 229, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        tabHoverBg: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
        tabHoverBorder: '#e0e7ff',
        tabHoverShadow: '0 14px 28px -4px rgba(30, 27, 75, 0.45), 0 0 22px 2px rgba(129, 140, 248, 0.58)',
        sidebarBg: 'linear-gradient(180deg, #253878 0%, #312e81 55%, #1e245c 100%)',
        sidebarHeaderBg: 'rgba(30, 36, 92, 0.55)',
        sidebarFooterBg: '#1e245c',
        sidebarBorder: 'rgba(129, 140, 248, 0.35)',
        sidebarCtaBg: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
        sidebarCtaBorder: 'rgba(165, 180, 252, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
        sidebarTabHoverBg: '#4f46e5',
        sidebarBadgeBg: 'rgba(49, 46, 129, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #4338ca 0%, #1e3a8a 100%)',
        dropdownBg: 'rgba(30, 36, 92, 0.97)',
        dropdownBorder: 'rgba(165, 180, 252, 0.42)',
        workspaceBg: 'linear-gradient(180deg, rgba(238, 242, 255, 0.78) 0%, rgba(244, 247, 255, 0.82) 55%, rgba(235, 240, 255, 0.78) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#eef2ff',
        cardBorder: '#c7d2fe',
        cardHoverBorder: '#818cf8',
        primaryBtnBg: '#4f46e5',
        primaryBtnHover: '#4338ca'
      },
      preview: {
        glyphSample: '☁ ░ ▒ · ° ░ ☁',
        moodLabel: 'Airy Indigo · Sky Blue · Soft Drift'
      },
      tags: ['sky', 'calm', 'soft', 'animated'],
      description: 'Tầng mây xanh chàm bồng bềnh hòa quyện cùng sắc xanh chủ đạo của ứng dụng.',
      since: '1.0',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, 0, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#111633');
          g.addColorStop(0.55, '#1f2859');
          g.addColorStop(1, '#10152e');
        } else {
          g.addColorStop(0, '#eaefff');
          g.addColorStop(0.55, '#f3f6ff');
          g.addColorStop(1, '#e6ecff');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const g = ctx.createRadialGradient(
          W * (0.45 + 0.22 * Math.cos(t * 0.25)),
          H * 0.35,
          20,
          W * 0.5,
          H * 0.4,
          W * 0.65
        );
        g.addColorStop(0, isMini ? 'rgba(129, 140, 248, 0.24)' : 'rgba(79, 70, 229, 0.10)');
        g.addColorStop(1, 'rgba(129, 140, 248, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const chars = ['·', '░', '▒', '∘', '°', '☁'];
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const drift = c * 0.18 - t * 0.8 + Math.sin(r * 0.5) * 0.8;
            const n = Math.sin(drift) * Math.cos(r * 0.32 + Math.sin(drift * 0.5));
            if (n > 0.28) {
              const idx = Math.min(chars.length - 1, Math.floor((n - 0.28) * 7));
              const alpha = Math.min(isMini ? 0.82 : 0.38, (n - 0.25) * (isMini ? 0.85 : 0.42));
              drawGlyph(c, r, chars[idx], isMini ? '#c7d2fe' : '#6366f1', alpha);
            }
          }
        }
      }
    },
    {
      id: 'aurora',
      name: 'Polar Aurora (Xanh Ngọc Cực Quang)',
      cost: 1000,
      tier: '1k',
      free: false,
      accent: '#0d9488',
      accentBright: '#2dd4bf',
      accentRgb: '45, 212, 191',
      cardBg: 'linear-gradient(155deg, #062422 0%, #0d3b3e 55%, #061821 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(19, 78, 74, 0.94) 0%, rgba(15, 118, 110, 0.94) 52%, rgba(3, 105, 161, 0.94) 100%)',
        toolbarBorder: 'rgba(94, 234, 212, 0.48)',
        toolbarShadow: '0 15px 35px -8px rgba(19, 78, 74, 0.35), 0 6px 20px -4px rgba(13, 148, 136, 0.28), inset 0 -1px 0 rgba(94, 234, 212, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#f0fdfa',
        tabBorder: 'rgba(153, 246, 228, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#5eead4',
        tabActiveShadow: '0 6px 16px -2px rgba(13, 148, 136, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.42)',
        tabHoverBg: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        tabHoverBorder: '#ccfbf1',
        tabHoverShadow: '0 14px 28px -4px rgba(19, 78, 74, 0.45), 0 0 22px 2px rgba(45, 212, 191, 0.58)',
        sidebarBg: 'linear-gradient(180deg, #134e4a 0%, #0f5c5c 55%, #163a59 100%)',
        sidebarHeaderBg: 'rgba(19, 78, 74, 0.55)',
        sidebarFooterBg: '#12374a',
        sidebarBorder: 'rgba(45, 212, 191, 0.35)',
        sidebarCtaBg: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
        sidebarCtaBorder: 'rgba(94, 234, 212, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
        sidebarTabHoverBg: '#0d9488',
        sidebarBadgeBg: 'rgba(19, 78, 74, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
        dropdownBg: 'rgba(15, 62, 66, 0.97)',
        dropdownBorder: 'rgba(94, 234, 212, 0.42)',
        workspaceBg: 'linear-gradient(180deg, rgba(236, 253, 245, 0.78) 0%, rgba(240, 249, 255, 0.82) 55%, rgba(230, 250, 245, 0.78) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#f0fdfa',
        cardBorder: '#99f6e4',
        cardHoverBorder: '#2dd4bf',
        primaryBtnBg: '#0d9488',
        primaryBtnHover: '#0f766e'
      },
      preview: {
        glyphSample: '⋮ ╎ ¦ ░ ✦ ╎ ⋮',
        moodLabel: 'Arctic Teal · Ocean Cyan · Shimmer'
      },
      tags: ['teal', 'nature', 'aurora', 'animated'],
      description: 'Dải cực quang xanh ngọc lục bảo pha xanh dương thanh mát cho toàn bộ nút và thanh tab.',
      since: '1.0',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, 0, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#041719');
          g.addColorStop(0.5, '#093033');
          g.addColorStop(1, '#04121a');
        } else {
          g.addColorStop(0, '#e6fcf7');
          g.addColorStop(0.5, '#eef8ff');
          g.addColorStop(1, '#e3faf4');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const g = ctx.createLinearGradient(0, H * 0.1, W, H * 0.8);
        g.addColorStop(0, 'rgba(45, 212, 191, 0.05)');
        g.addColorStop(0.5, isMini ? `rgba(52, 211, 153, ${0.22 + 0.05 * Math.sin(t * 0.9)})` : `rgba(13, 148, 136, ${0.10 + 0.03 * Math.sin(t * 0.9)})`);
        g.addColorStop(1, 'rgba(56, 189, 248, 0.06)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const ribbons = ['⋮', '╎', '¦', '│', '·', '✦'];
        for (let c = 0; c < grid.cols; c++) {
          const curtainCenter =
            grid.rows * (0.42 + 0.24 * Math.sin(c * 0.22 + t * 1.1) * Math.cos(c * 0.11 - t * 0.5));
          for (let r = 0; r < grid.rows; r++) {
            const dist = Math.abs(r - curtainCenter);
            if (dist < 4.0) {
              const alpha = Math.max(0.12, (1 - dist / 4.0) * (isMini ? 0.85 : 0.42));
              const ch = ribbons[(r + c + Math.floor(t * 3)) % ribbons.length];
              const color = isMini
                ? r < curtainCenter ? '#5eead4' : '#38bdf8'
                : r < curtainCenter ? '#0d9488' : '#0284c7';
              drawGlyph(c, r, ch, color, alpha);
            }
          }
        }
      }
    },
    {
      id: 'sakura',
      name: 'Sakura Sky (Anh Đào & Xanh Lam)',
      cost: 1000,
      tier: '1k',
      free: false,
      accent: '#db2777',
      accentBright: '#f472b6',
      accentRgb: '244, 114, 182',
      cardBg: 'linear-gradient(155deg, #2b122b 0%, #42193d 55%, #1c0c1c 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(42, 56, 112, 0.94) 0%, rgba(107, 33, 104, 0.93) 55%, rgba(157, 23, 77, 0.93) 100%)',
        toolbarBorder: 'rgba(249, 168, 212, 0.48)',
        toolbarShadow: '0 15px 35px -8px rgba(80, 7, 36, 0.32), 0 6px 20px -4px rgba(219, 39, 119, 0.26), inset 0 -1px 0 rgba(249, 168, 212, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#fdf2f8',
        tabBorder: 'rgba(251, 207, 232, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#f9a8d4',
        tabActiveShadow: '0 6px 16px -2px rgba(219, 39, 119, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.42)',
        tabHoverBg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
        tabHoverBorder: '#fce7f3',
        tabHoverShadow: '0 14px 28px -4px rgba(80, 7, 36, 0.42), 0 0 22px 2px rgba(244, 114, 182, 0.58)',
        sidebarBg: 'linear-gradient(180deg, #2a3870 0%, #581c5c 55%, #6b1442 100%)',
        sidebarHeaderBg: 'rgba(42, 56, 112, 0.45)',
        sidebarFooterBg: '#4c1134',
        sidebarBorder: 'rgba(244, 114, 182, 0.35)',
        sidebarCtaBg: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
        sidebarCtaBorder: 'rgba(249, 168, 212, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
        sidebarTabHoverBg: '#db2777',
        sidebarBadgeBg: 'rgba(131, 24, 67, 0.55)',
        mascotCardBg: 'linear-gradient(135deg, #db2777 0%, #3730a3 100%)',
        dropdownBg: 'rgba(62, 20, 64, 0.97)',
        dropdownBorder: 'rgba(249, 168, 212, 0.42)',
        workspaceBg: 'linear-gradient(180deg, rgba(253, 242, 248, 0.78) 0%, rgba(243, 246, 255, 0.84) 55%, rgba(252, 238, 246, 0.78) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#fdf2f8',
        cardBorder: '#fbcfe8',
        cardHoverBorder: '#f472b6',
        primaryBtnBg: '#db2777',
        primaryBtnHover: '#be185d'
      },
      preview: {
        glyphSample: '✿ ❀ · ˚ ✿ ❀',
        moodLabel: 'Spring Blossom · Sky Indigo · Poetic'
      },
      tags: ['floral', 'warm', 'calm', 'animated'],
      description: 'Cánh hoa anh đào bay nhẹ trên nền trời xanh chàm thanh lịch.',
      since: '1.1',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, env.W, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#1f0d21');
          g.addColorStop(0.55, '#361634');
          g.addColorStop(1, '#140816');
        } else {
          g.addColorStop(0, '#fdf0f7');
          g.addColorStop(0.55, '#f0f5ff');
          g.addColorStop(1, '#fcebf4');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const g = ctx.createRadialGradient(
          W * 0.7,
          H * (0.3 + 0.08 * Math.sin(t * 0.5)),
          10,
          W * 0.65,
          H * 0.35,
          W * 0.6
        );
        g.addColorStop(0, isMini ? 'rgba(244, 114, 182, 0.24)' : 'rgba(219, 39, 119, 0.09)');
        g.addColorStop(1, 'rgba(244, 114, 182, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const petals = ['✿', '❀', '·', '˚', '⋄', '•'];
        for (let i = 0; i < grid.cols * 2.5; i++) {
          const seed = (i * 73.13) % 1;
          const speed = 0.7 + seed * 0.9;
          const c = Math.floor((i * 3.7 + t * speed * 2.2 + Math.sin(t + i) * 1.5) % grid.cols);
          const r = Math.floor((i * 2.3 + t * speed * 1.5) % grid.rows);
          const ch = petals[i % petals.length];
          const alpha = (0.38 + 0.42 * Math.sin(t * 1.5 + i)) * (isMini ? 1 : 0.52);
          const color = isMini
            ? i % 3 === 0 ? '#fbcfe8' : '#f472b6'
            : i % 3 === 0 ? '#ec4899' : '#db2777';
          if (c >= 0 && c < grid.cols && r >= 0 && r < grid.rows) {
            drawGlyph(c, r, ch, color, Math.max(0.16, alpha));
          }
        }
      }
    },
    {
      id: 'cyber-matrix',
      name: 'Emerald Terminal (Xanh Lục Công Nghệ)',
      cost: 2500,
      tier: '2.5k',
      free: false,
      accent: '#059669',
      accentBright: '#10b981',
      accentRgb: '16, 185, 129',
      cardBg: 'linear-gradient(155deg, #042118 0%, #073627 55%, #02140e 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(6, 78, 59, 0.95) 0%, rgba(4, 120, 87, 0.94) 52%, rgba(15, 118, 110, 0.94) 100%)',
        toolbarBorder: 'rgba(110, 231, 183, 0.48)',
        toolbarShadow: '0 15px 35px -8px rgba(6, 78, 59, 0.36), 0 6px 20px -4px rgba(5, 150, 105, 0.28), inset 0 -1px 0 rgba(110, 231, 183, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#ecfdf5',
        tabBorder: 'rgba(167, 243, 208, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#6ee7b7',
        tabActiveShadow: '0 6px 16px -2px rgba(5, 150, 105, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.42)',
        tabHoverBg: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
        tabHoverBorder: '#d1fae5',
        tabHoverShadow: '0 14px 28px -4px rgba(6, 78, 59, 0.45), 0 0 22px 2px rgba(16, 185, 129, 0.58)',
        sidebarBg: 'linear-gradient(180deg, #064e3b 0%, #065f46 55%, #0f3f4a 100%)',
        sidebarHeaderBg: 'rgba(6, 78, 59, 0.55)',
        sidebarFooterBg: '#063e34',
        sidebarBorder: 'rgba(16, 185, 129, 0.35)',
        sidebarCtaBg: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        sidebarCtaBorder: 'rgba(110, 231, 183, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        sidebarTabHoverBg: '#059669',
        sidebarBadgeBg: 'rgba(6, 78, 59, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #059669 0%, #0f766e 100%)',
        dropdownBg: 'rgba(6, 62, 48, 0.97)',
        dropdownBorder: 'rgba(110, 231, 183, 0.42)',
        workspaceBg: 'linear-gradient(180deg, rgba(236, 253, 245, 0.80) 0%, rgba(240, 253, 250, 0.84) 55%, rgba(232, 250, 241, 0.80) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#ecfdf5',
        cardBorder: '#a7f3d0',
        cardHoverBorder: '#10b981',
        primaryBtnBg: '#059669',
        primaryBtnHover: '#047857'
      },
      preview: {
        glyphSample: '0 1 ｱ ｲ ｳ ｴ ｵ 9',
        moodLabel: 'Emerald Code · Mint Ice · Mainframe'
      },
      tags: ['cyber', 'emerald', 'code', 'animated'],
      description: 'Dòng mã ma trận xanh ngọc lục bảo sắc nét và hiện đại.',
      since: '1.1',
      bg(ctx, env) {
        if (env.isMini) {
          ctx.fillStyle = '#03140e';
          ctx.fillRect(0, 0, env.W, env.H);
        } else {
          const g = ctx.createLinearGradient(0, 0, 0, env.H);
          g.addColorStop(0, '#e6faef');
          g.addColorStop(0.5, '#f0fdf9');
          g.addColorStop(1, '#e2f8ec');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, env.W, env.H);
        }
      },
      scene(ctx, env) {
        const { W, H, isMini } = env;
        const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 10, W * 0.5, H * 0.5, W * 0.65);
        g.addColorStop(0, isMini ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.08)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const glyphs = '012345789ABCDEF<>+=-:*#%&@';
        for (let c = 0; c < grid.cols; c++) {
          const colSpeed = 1.8 + ((c * 19) % 7) * 0.38;
          const head = (t * colSpeed + ((c * 31) % 17)) % (grid.rows + 6);
          for (let r = 0; r < grid.rows; r++) {
            const dist = head - r;
            if (dist >= 0 && dist < 7) {
              const alpha = (1 - dist / 7) * (isMini ? 0.85 : 0.36);
              const charIdx = Math.floor((c * 7 + r * 13 + Math.floor(t * 6)) % glyphs.length);
              const color = isMini
                ? dist < 1.2 ? '#d1fae5' : '#10b981'
                : dist < 1.2 ? '#047857' : '#10b981';
              drawGlyph(c, r, glyphs[charIdx], color, alpha);
            }
          }
        }
      }
    },
    {
      id: 'synthwave',
      name: 'Outrun Horizon (Xanh Tím Hoàng Hôn)',
      cost: 2500,
      tier: '2.5k',
      free: false,
      accent: '#7c3aed',
      accentBright: '#c084fc',
      accentRgb: '192, 132, 252',
      cardBg: 'linear-gradient(155deg, #210e3b 0%, #38155c 55%, #160829 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(49, 46, 129, 0.95) 0%, rgba(91, 33, 182, 0.94) 52%, rgba(126, 34, 206, 0.94) 100%)',
        toolbarBorder: 'rgba(216, 180, 254, 0.48)',
        toolbarShadow: '0 15px 35px -8px rgba(59, 7, 100, 0.35), 0 6px 20px -4px rgba(124, 58, 237, 0.28), inset 0 -1px 0 rgba(216, 180, 254, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#f5f3ff',
        tabBorder: 'rgba(221, 214, 254, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#d8b4fe',
        tabActiveShadow: '0 6px 16px -2px rgba(124, 58, 237, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.42)',
        tabHoverBg: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
        tabHoverBorder: '#ede9fe',
        tabHoverShadow: '0 14px 28px -4px rgba(59, 7, 100, 0.45), 0 0 22px 2px rgba(192, 132, 252, 0.58)',
        sidebarBg: 'linear-gradient(180deg, #312e81 0%, #4c1d95 55%, #3b0764 100%)',
        sidebarHeaderBg: 'rgba(49, 46, 129, 0.55)',
        sidebarFooterBg: '#2e1065',
        sidebarBorder: 'rgba(192, 132, 252, 0.35)',
        sidebarCtaBg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
        sidebarCtaBorder: 'rgba(216, 180, 254, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
        sidebarTabHoverBg: '#7c3aed',
        sidebarBadgeBg: 'rgba(76, 29, 149, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)',
        dropdownBg: 'rgba(46, 16, 101, 0.97)',
        dropdownBorder: 'rgba(216, 180, 254, 0.42)',
        workspaceBg: 'linear-gradient(180deg, rgba(245, 243, 255, 0.80) 0%, rgba(243, 246, 255, 0.84) 55%, rgba(250, 240, 255, 0.80) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#f5f3ff',
        cardBorder: '#ddd6fe',
        cardHoverBorder: '#c084fc',
        primaryBtnBg: '#7c3aed',
        primaryBtnHover: '#6d28d9'
      },
      preview: {
        glyphSample: '═ ╬ ═ ◢ ◣ ═ ╬ ═',
        moodLabel: 'Retro Grid · Violet Blue · 1984'
      },
      tags: ['retro', 'neon', 'grid', 'animated'],
      description: 'Lưới chân trời vector tím lam hiện đại phối hợp đồng bộ từng nút điều hướng.',
      since: '1.2',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, 0, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#16092b');
          g.addColorStop(0.55, '#311157');
          g.addColorStop(1, '#120621');
        } else {
          g.addColorStop(0, '#f2eeff');
          g.addColorStop(0.55, '#f2f6ff');
          g.addColorStop(1, '#f8eefc');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const sunY = H * 0.42;
        const g = ctx.createRadialGradient(W * 0.5, sunY, 5, W * 0.5, sunY, H * 0.42);
        g.addColorStop(0, isMini ? 'rgba(244, 114, 182, 0.30)' : 'rgba(168, 85, 247, 0.10)');
        g.addColorStop(0.5, isMini ? 'rgba(192, 132, 252, 0.14)' : 'rgba(124, 58, 237, 0.05)');
        g.addColorStop(1, 'rgba(192, 132, 252, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = isMini
          ? `rgba(244, 114, 182, ${0.28 + 0.08 * Math.sin(t * 2)})`
          : `rgba(124, 58, 237, ${0.14 + 0.05 * Math.sin(t * 2)})`;
        ctx.beginPath();
        ctx.moveTo(0, sunY);
        ctx.lineTo(W, sunY);
        ctx.stroke();
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const horizonRow = Math.floor(grid.rows * 0.42);
        for (let r = horizonRow; r < grid.rows; r++) {
          const depth = (r - horizonRow + 1) / Math.max(1, grid.rows - horizonRow);
          for (let c = 0; c < grid.cols; c++) {
            const scroll = (r + t * 3.5) % 2.5;
            const isGridLine = scroll < 0.7 || c % 4 === 0;
            if (isGridLine) {
              const ch = scroll < 0.7 ? '─' : '│';
              const color = isMini
                ? c % 4 === 0 ? '#f472b6' : '#c084fc'
                : c % 4 === 0 ? '#db2777' : '#7c3aed';
              drawGlyph(c, r, ch, color, Math.min(isMini ? 0.85 : 0.36, depth * (isMini ? 0.78 : 0.38)));
            }
          }
        }
      }
    },
    {
      id: 'solar-flare',
      name: 'Helios Corona (Vàng Hoàng Kim & Xanh)',
      cost: 5000,
      tier: '5k',
      free: false,
      accent: '#d97706',
      accentBright: '#fbbf24',
      accentRgb: '245, 158, 11',
      cardBg: 'linear-gradient(155deg, #2b1605 0%, #452208 55%, #1a0c02 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(30, 58, 110, 0.95) 0%, rgba(120, 53, 15, 0.93) 55%, rgba(180, 83, 9, 0.94) 100%)',
        toolbarBorder: 'rgba(253, 224, 71, 0.5)',
        toolbarShadow: '0 15px 35px -8px rgba(69, 26, 3, 0.34), 0 6px 20px -4px rgba(217, 119, 6, 0.28), inset 0 -1px 0 rgba(253, 224, 71, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#fef9c3',
        tabBorder: 'rgba(254, 240, 138, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #d97706 0%, #2563eb 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#fde047',
        tabActiveShadow: '0 6px 16px -2px rgba(217, 119, 6, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        tabHoverBg: 'linear-gradient(135deg, #b45309 0%, #eab308 100%)',
        tabHoverBorder: '#fef9c3',
        tabHoverShadow: '0 14px 28px -4px rgba(69, 26, 3, 0.45), 0 0 22px 2px rgba(251, 191, 36, 0.6)',
        sidebarBg: 'linear-gradient(180deg, #1e3a6e 0%, #5c2d0c 60%, #451a03 100%)',
        sidebarHeaderBg: 'rgba(30, 58, 110, 0.55)',
        sidebarFooterBg: '#3b1704',
        sidebarBorder: 'rgba(251, 191, 36, 0.38)',
        sidebarCtaBg: 'linear-gradient(135deg, #d97706 0%, #2563eb 100%)',
        sidebarCtaBorder: 'rgba(253, 224, 71, 0.5)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #d97706 0%, #2563eb 100%)',
        sidebarTabHoverBg: '#d97706',
        sidebarBadgeBg: 'rgba(120, 53, 15, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #d97706 0%, #1e3a8a 100%)',
        dropdownBg: 'rgba(54, 27, 8, 0.97)',
        dropdownBorder: 'rgba(253, 224, 71, 0.45)',
        workspaceBg: 'linear-gradient(180deg, rgba(255, 251, 235, 0.80) 0%, rgba(242, 247, 255, 0.84) 55%, rgba(254, 249, 225, 0.80) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#fffbeb',
        cardBorder: '#fde68a',
        cardHoverBorder: '#fbbf24',
        primaryBtnBg: '#d97706',
        primaryBtnHover: '#b45309'
      },
      preview: {
        glyphSample: '☀ ✶ ✴ ✹ · ✴ ✶ ☀',
        moodLabel: 'Royal Gold · Sapphire Blue · Stellar'
      },
      tags: ['gold', 'cosmic', 'energy', 'animated'],
      description: 'Hào quang vàng hoàng kim phối xanh sapphire sang trọng cho toàn bộ nút và bảng biểu.',
      since: '1.3',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, env.W, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#1c0d03');
          g.addColorStop(0.5, '#331805');
          g.addColorStop(1, '#120701');
        } else {
          g.addColorStop(0, '#fff9e6');
          g.addColorStop(0.5, '#f0f6ff');
          g.addColorStop(1, '#fef5d9');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const g = ctx.createRadialGradient(
          W * 0.5,
          H * 0.5,
          8,
          W * 0.5,
          H * 0.5,
          Math.min(W, H) * (0.5 + 0.05 * Math.sin(t * 1.5))
        );
        g.addColorStop(0, isMini ? 'rgba(251, 191, 36, 0.28)' : 'rgba(245, 158, 11, 0.10)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const cx = (grid.cols - 1) / 2;
        const cy = (grid.rows - 1) / 2;
        const sparks = ['✶', '✴', '✹', '✦', '·', '°'];
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const dx = (c - cx) / Math.max(1, grid.cols * 0.35);
            const dy = (r - cy) / Math.max(1, grid.rows * 0.35);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const wave = Math.sin(dist * 6 - t * 2.6 + Math.sin(angle * 4 + t));
            if (dist < 1.4 && wave > 0.32) {
              const ch = sparks[Math.floor(((wave + dist) * 5) % sparks.length)];
              const color = isMini
                ? dist < 0.6 ? '#fde68a' : '#f59e0b'
                : dist < 0.6 ? '#d97706' : '#2563eb';
              drawGlyph(c, r, ch, color, Math.min(isMini ? 0.85 : 0.38, (1.4 - dist) * (isMini ? 0.72 : 0.34)));
            }
          }
        }
      }
    },
    {
      id: 'deep-cosmos',
      name: 'Event Horizon (Xanh Vũ Trụ Tinh Vân)',
      cost: 5000,
      tier: '5k',
      free: false,
      accent: '#2563eb',
      accentBright: '#60a5fa',
      accentRgb: '96, 165, 250',
      cardBg: 'linear-gradient(155deg, #0b102b 0%, #162254 55%, #070a1c 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(23, 37, 84, 0.95) 0%, rgba(30, 58, 138, 0.95) 50%, rgba(49, 46, 129, 0.95) 100%)',
        toolbarBorder: 'rgba(147, 197, 253, 0.5)',
        toolbarShadow: '0 15px 35px -8px rgba(15, 23, 42, 0.4), 0 6px 20px -4px rgba(37, 99, 235, 0.34), inset 0 -1px 0 rgba(147, 197, 253, 0.58)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#eff6ff',
        tabBorder: 'rgba(191, 219, 254, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#93c5fd',
        tabActiveShadow: '0 6px 16px -2px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        tabHoverBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        tabHoverBorder: '#dbeafe',
        tabHoverShadow: '0 14px 28px -4px rgba(15, 23, 42, 0.48), 0 0 24px 3px rgba(96, 165, 250, 0.62)',
        sidebarBg: 'linear-gradient(180deg, #172554 0%, #1e3a8a 55%, #1e1b4b 100%)',
        sidebarHeaderBg: 'rgba(23, 37, 84, 0.55)',
        sidebarFooterBg: '#17204a',
        sidebarBorder: 'rgba(96, 165, 250, 0.38)',
        sidebarCtaBg: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        sidebarCtaBorder: 'rgba(147, 197, 253, 0.52)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        sidebarTabHoverBg: '#2563eb',
        sidebarBadgeBg: 'rgba(30, 58, 138, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #2563eb 0%, #312e81 100%)',
        dropdownBg: 'rgba(23, 37, 84, 0.97)',
        dropdownBorder: 'rgba(147, 197, 253, 0.45)',
        workspaceBg: 'linear-gradient(180deg, rgba(235, 244, 255, 0.78) 0%, rgba(243, 247, 255, 0.84) 55%, rgba(232, 240, 255, 0.78) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#eff6ff',
        cardBorder: '#bfdbfe',
        cardHoverBorder: '#60a5fa',
        primaryBtnBg: '#2563eb',
        primaryBtnHover: '#1d4ed8'
      },
      preview: {
        glyphSample: '✦ ✧ ★ · ∘ ✧ ✦',
        moodLabel: 'Deep Sapphire · Starlight · Orbital'
      },
      tags: ['space', 'blue', 'orbital', 'animated'],
      description: 'Quỹ đạo ánh sao xanh vũ trụ đồng điệu tuyệt đối với tông xanh chuẩn của hệ thống.',
      since: '1.3',
      bg(ctx, env) {
        if (env.isMini) {
          const g = ctx.createRadialGradient(
            env.W * 0.5,
            env.H * 0.5,
            5,
            env.W * 0.5,
            env.H * 0.5,
            Math.max(env.W, env.H) * 0.75
          );
          g.addColorStop(0, '#172352');
          g.addColorStop(0.55, '#0a0f26');
          g.addColorStop(1, '#050713');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, env.W, env.H);
        } else {
          const g = ctx.createLinearGradient(0, 0, env.W, env.H);
          g.addColorStop(0, '#e6f0ff');
          g.addColorStop(0.55, '#f2f7ff');
          g.addColorStop(1, '#e3edff');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, env.W, env.H);
        }
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        ctx.rotate(t * 0.18);
        ctx.strokeStyle = isMini ? 'rgba(96, 165, 250, 0.28)' : 'rgba(37, 99, 235, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, W * 0.3, H * 0.14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const cx = (grid.cols - 1) / 2;
        const cy = (grid.rows - 1) / 2;
        const stars = ['✦', '✧', '★', '·', '∘', '+'];
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const dx = c - cx;
            const dy = (r - cy) * 1.8;
            const radius = Math.sqrt(dx * dx + dy * dy);
            const theta = Math.atan2(dy, dx) + t * (1.4 / Math.max(1.5, radius * 0.35));
            const spiral = Math.sin(theta * 3 + radius * 0.65);
            if (spiral > 0.48 && radius > 1.0) {
              const ch = stars[(c + r) % stars.length];
              const color = isMini
                ? radius < 5 ? '#bfdbfe' : '#60a5fa'
                : radius < 5 ? '#2563eb' : '#4f46e5';
              const alpha = Math.min(isMini ? 0.85 : 0.4, (spiral - 0.42) * (isMini ? 1.35 : 0.6));
              drawGlyph(c, r, ch, color, alpha);
            }
          }
        }
      }
    },
    {
      id: 'singularity-omega',
      name: 'Singularity Omega (Hồng Ngọc & Lam Vũ Trụ)',
      cost: 10000,
      tier: '10k',
      free: false,
      accent: '#e11d48',
      accentBright: '#f43f5e',
      accentRgb: '244, 63, 94',
      cardBg: 'linear-gradient(155deg, #2b0817 0%, #450c2a 50%, #17040e 100%)',
      tokens: {
        toolbarBg: 'linear-gradient(90deg, rgba(30, 58, 110, 0.95) 0%, rgba(136, 19, 55, 0.94) 55%, rgba(190, 18, 60, 0.94) 100%)',
        toolbarBorder: 'rgba(253, 164, 175, 0.5)',
        toolbarShadow: '0 15px 35px -8px rgba(76, 5, 25, 0.35), 0 6px 20px -4px rgba(225, 29, 72, 0.28), inset 0 -1px 0 rgba(253, 164, 175, 0.55)',
        tabBg: 'rgba(255, 255, 255, 0.14)',
        tabText: '#fff1f2',
        tabBorder: 'rgba(254, 205, 211, 0.32)',
        tabActiveBg: 'linear-gradient(135deg, #e11d48 0%, #2563eb 100%)',
        tabActiveText: '#ffffff',
        tabActiveBorder: '#fda4af',
        tabActiveShadow: '0 6px 16px -2px rgba(225, 29, 72, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        tabHoverBg: 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
        tabHoverBorder: '#ffe4e6',
        tabHoverShadow: '0 14px 28px -4px rgba(76, 5, 25, 0.45), 0 0 22px 2px rgba(244, 63, 94, 0.6)',
        sidebarBg: 'linear-gradient(180deg, #1e3a6e 0%, #701a46 58%, #4c0519 100%)',
        sidebarHeaderBg: 'rgba(30, 58, 110, 0.55)',
        sidebarFooterBg: '#4c0519',
        sidebarBorder: 'rgba(244, 63, 94, 0.38)',
        sidebarCtaBg: 'linear-gradient(135deg, #e11d48 0%, #2563eb 100%)',
        sidebarCtaBorder: 'rgba(253, 164, 175, 0.52)',
        sidebarTabActiveBg: 'linear-gradient(135deg, #e11d48 0%, #2563eb 100%)',
        sidebarTabHoverBg: '#e11d48',
        sidebarBadgeBg: 'rgba(136, 19, 55, 0.65)',
        mascotCardBg: 'linear-gradient(135deg, #e11d48 0%, #1e3a8a 100%)',
        dropdownBg: 'rgba(69, 10, 31, 0.97)',
        dropdownBorder: 'rgba(253, 164, 175, 0.45)',
        workspaceBg: 'linear-gradient(180deg, rgba(255, 241, 242, 0.78) 0%, rgba(242, 246, 255, 0.84) 55%, rgba(255, 238, 242, 0.78) 100%)',
        cardBg: 'rgba(255, 255, 255, 0.94)',
        cardSubtleBg: '#fff1f2',
        cardBorder: '#fecdd3',
        cardHoverBorder: '#f43f5e',
        primaryBtnBg: '#e11d48',
        primaryBtnHover: '#be123c'
      },
      preview: {
        glyphSample: '◈ ❖ ⟡ ✧ ❂ ⟡ ◈',
        moodLabel: 'Mythic Ruby · Sapphire · Quantum Lattice'
      },
      tags: ['mythic', 'crimson', 'quantum', 'animated'],
      description: 'Mạng tinh thể lượng tử Đỏ Ruby phối Xanh Sapphire tối thượng dành cho bậc thầy.',
      since: '1.4',
      bg(ctx, env) {
        const g = ctx.createLinearGradient(0, 0, env.W, env.H);
        if (env.isMini) {
          g.addColorStop(0, '#1a040d');
          g.addColorStop(0.5, '#33091d');
          g.addColorStop(1, '#0e0207');
        } else {
          g.addColorStop(0, '#ffedf0');
          g.addColorStop(0.5, '#f0f5ff');
          g.addColorStop(1, '#ffe8ed');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, env.W, env.H);
      },
      scene(ctx, env) {
        const { W, H, t, isMini } = env;
        const g = ctx.createRadialGradient(
          W * (0.5 + 0.14 * Math.sin(t * 0.9)),
          H * (0.5 + 0.14 * Math.cos(t * 0.9)),
          6,
          W * 0.5,
          H * 0.5,
          Math.max(W, H) * 0.62
        );
        g.addColorStop(0, isMini ? 'rgba(244, 63, 94, 0.30)' : 'rgba(225, 29, 72, 0.09)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      },
      ambient(env, drawGlyph, grid) {
        const { t, isMini } = env;
        const cx = (grid.cols - 1) / 2;
        const cy = (grid.rows - 1) / 2;
        const runes = ['◈', '❖', '⟡', '✧', '❂', '·'];
        for (let r = 0; r < grid.rows; r++) {
          for (let c = 0; c < grid.cols; c++) {
            const dx = c - cx;
            const dy = r - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            const harmonic =
              Math.sin(dx * 0.45 + t * 2.0) * Math.cos(dy * 0.45 - t * 1.5) +
              Math.sin(d * 0.7 - t * 2.4);
            if (harmonic > 0.55) {
              const idx = Math.floor(((harmonic - 0.55) * 8 + c + r) % runes.length);
              const color = isMini
                ? harmonic > 1.25 ? '#fecdd3' : '#f43f5e'
                : harmonic > 1.2 ? '#2563eb' : '#e11d48';
              const alpha = Math.min(isMini ? 0.88 : 0.4, (harmonic - 0.5) * (isMini ? 0.78 : 0.38));
              drawGlyph(c, r, runes[idx], color, alpha);
            }
          }
        }
      }
    }
  ];

  /* ==========================================================================
     MAIN BACKGROUND CANVAS ENGINE (60fps, visibility-aware)
     ========================================================================== */
  let mainCanvas = null;
  let mainCtx = null;
  let mainRafId = null;
  let mainRunning = false;
  let activeThemeId = 'lagoon';
  let startTime = performance.now();

  function getThemeById(id) {
    return THEMES.find((t) => t.id === id) || THEMES[0];
  }

  function resizeMainCanvas() {
    if (!mainCanvas || !mainCtx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    mainCanvas.width = Math.floor(w * dpr);
    mainCanvas.height = Math.floor(h * dpr);
    mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function renderMainFrame(now) {
    if (!mainRunning || !mainCanvas || !mainCtx) return;

    const theme = getThemeById(activeThemeId);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const t = (now - startTime) * 0.001;

    mainCtx.clearRect(0, 0, W, H);

    const cellW = 28;
    const cellH = 26;
    const cols = Math.max(12, Math.ceil(W / cellW));
    const rows = Math.max(8, Math.ceil(H / cellH));

    const isDarkApp = Boolean(
      document.getElementById('app_root')?.classList.contains('fullscreen-dark-mode')
    );

    const env = { W, H, t, theme, isMini: isDarkApp };
    if (theme.bg) theme.bg(mainCtx, env);
    if (theme.scene) theme.scene(mainCtx, env);

    mainCtx.font = 'bold 13px "JetBrains Mono", "Fira Code", monospace';
    mainCtx.textBaseline = 'top';

    const drawGlyph = (col, row, ch, color, alpha) => {
      mainCtx.globalAlpha = Math.max(0, Math.min(1, alpha ?? 0.45));
      mainCtx.fillStyle = color || theme.accent;
      mainCtx.fillText(ch, col * cellW + 5, row * cellH + 4);
    };

    if (theme.ambient) {
      theme.ambient(env, drawGlyph, { cols, rows });
    }
    mainCtx.globalAlpha = 1;

    mainRafId = requestAnimationFrame(renderMainFrame);
  }

  function startMainCanvas() {
    if (mainRunning) return;
    mainRunning = true;
    mainRafId = requestAnimationFrame(renderMainFrame);
  }

  function stopMainCanvas() {
    mainRunning = false;
    if (mainRafId) {
      cancelAnimationFrame(mainRafId);
      mainRafId = null;
    }
  }

  function mountThemeCanvas(initialThemeId) {
    if (initialThemeId && initialThemeId !== 'none') {
      activeThemeId = initialThemeId;
    }
    let wrapper = document.getElementById('ascii-canvas-layer');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'ascii-canvas-layer';
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.style.cssText =
        'position:fixed;inset:0;top:0;left:0;width:100vw;height:100dvh;z-index:0;pointer-events:none;overflow:hidden;';
      mainCanvas = document.createElement('canvas');
      mainCanvas.id = 'ascii-bg-canvas';
      mainCanvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
      wrapper.appendChild(mainCanvas);
      document.body.appendChild(wrapper);
    } else {
      mainCanvas = document.getElementById('ascii-bg-canvas');
    }

    mainCtx = mainCanvas.getContext('2d');
    resizeMainCanvas();

    window.addEventListener('resize', resizeMainCanvas, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopMainCanvas();
      } else if (document.documentElement.dataset.asciiTheme !== 'none') {
        startMainCanvas();
      }
    });

    if (initialThemeId !== 'none') {
      startMainCanvas();
    }
    return wrapper;
  }

  function setMainCanvasTheme(themeId) {
    const wrapper = document.getElementById('ascii-canvas-layer');
    if (themeId === 'none') {
      stopMainCanvas();
      if (wrapper) wrapper.style.display = 'none';
      return;
    }
    if (wrapper) wrapper.style.display = 'block';
    if (THEMES.some((t) => t.id === themeId)) {
      activeThemeId = themeId;
      startMainCanvas();
    }
  }

  /* ==========================================================================
     MINI PREVIEW CANVAS ENGINE (24fps, IntersectionObserver-controlled)
     ========================================================================== */
  const previewLoops = new Map();
  let previewObserver = null;

  function startMiniPreview(canvas, themeId) {
    if (!canvas || previewLoops.has(themeId)) return;
    const theme = getThemeById(themeId);
    if (!theme) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width || 220;
    const H = canvas.height || 130;
    const SCALE = 0.25;
    const COLS = Math.floor((W * SCALE) / 4.2);
    const ROWS = Math.floor((H * SCALE) / 7.5);
    const cellW = W / Math.max(1, COLS);
    const cellH = H / Math.max(1, ROWS);

    let t = Math.random() * 100;
    let rafId = null;
    let lastFrame = 0;
    const FPS_CAP = 1000 / 24;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (now - lastFrame < FPS_CAP) return;
      lastFrame = now;
      t += 0.025;

      ctx.clearRect(0, 0, W, H);
      const miniEnv = { W, H, t, theme, isMini: true };
      if (theme.bg) theme.bg(ctx, miniEnv);
      if (theme.scene) theme.scene(ctx, miniEnv);

      ctx.font = `${Math.max(8, Math.round(cellH * 0.75))}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';

      const drawMiniGlyph = (col, row, ch, color, alpha) => {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        ctx.globalAlpha = Math.min(1, (alpha ?? 0.6) * 1.15);
        ctx.fillStyle = color || theme.accentBright || theme.accent;
        ctx.fillText(ch, col * cellW, row * cellH);
      };

      if (theme.ambient) {
        theme.ambient(miniEnv, drawMiniGlyph, { cols: COLS, rows: ROWS });
      }
      ctx.globalAlpha = 1;
    }

    rafId = requestAnimationFrame(tick);
    previewLoops.set(themeId, () => {
      if (rafId) cancelAnimationFrame(rafId);
    });
  }

  function stopMiniPreview(themeId) {
    const cancel = previewLoops.get(themeId);
    if (cancel) {
      cancel();
      previewLoops.delete(themeId);
    }
  }

  function stopAllMiniPreviews() {
    previewLoops.forEach((cancel) => cancel());
    previewLoops.clear();
    if (previewObserver) {
      previewObserver.disconnect();
      previewObserver = null;
    }
  }

  function initMiniPreviews(rootEl) {
    stopAllMiniPreviews();
    const container = rootEl || document;
    const canvases = container.querySelectorAll('.theme-preview-canvas');
    if (!canvases.length) return;

    if ('IntersectionObserver' in window) {
      previewObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = entry.target.dataset.theme;
            if (!id) return;
            if (entry.isIntersecting) {
              startMiniPreview(entry.target, id);
            } else {
              stopMiniPreview(id);
            }
          });
        },
        { threshold: 0.1 }
      );
      canvases.forEach((c) => previewObserver.observe(c));
    } else {
      canvases.forEach((c) => {
        if (c.dataset.theme) startMiniPreview(c, c.dataset.theme);
      });
    }
  }

  window.ASCII_FREE_THEMES = FREE_THEMES;
  window.ASCII_THEMES = THEMES;
  window.AsciiThemes = {
    FREE_THEMES,
    THEMES,
    getThemeById,
    mountThemeCanvas,
    setMainCanvasTheme,
    startMainCanvas,
    stopMainCanvas,
    initMiniPreviews,
    startMiniPreview,
    stopMiniPreview,
    stopAllMiniPreviews
  };
})();
