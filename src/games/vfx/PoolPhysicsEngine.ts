/**
 * MODULE: PoolPhysicsEngine.ts
 * Phụ trách bởi: CLAUDE CODE 2
 *
 * Vật lý nhảy hồ bơi 2D cho canvas, chạy ở bước thời gian cố định 1/60 s (60 FPS):
 *   Lớp 1 – Mặt nước đàn hồi 1D: N cột lò xo Hooke có giảm chấn, cách nhau Δx = 8 px,
 *           a_i = -k (y_i - y0) - d v_i, lan truyền sóng sang 2 cột lân cận 6 lượt / khung.
 *   Lớp 2 – Tia nước bắn: giọt elip xoay theo atan2(vy, vx), kéo giãn theo |v|;
 *           giọt rơi lại mặt nước tạo gợn sóng thứ cấp.
 *   Lớp 3 – Lực nổi Ác-si-mét: a = -b (y - y_mặt) - c vy khi ngập nước;
 *           bọt khí bay lên theo x(t) = x0 + A sin(ωt + φ), vỡ khi chạm mặt nước.
 *
 * Module thuần (không React, không CSS, không DOM ngoài CanvasRenderingContext2D) nên
 * dùng được ở mọi game. Đơn vị: pixel CSS, thời gian: 1 bước = 1/60 giây.
 *
 * Hợp đồng (AGENT_SYNC): new PoolPhysicsEngine(width, height, waterLevelY)
 *   .triggerSplash(x, vy, radius, label?) .updateEntityPhysics(entity, gravity?)
 *   .update() .render(ctx) .resize(w, h, waterY) .getWaterHeightAt(x)
 */

export interface PoolEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  /** Do engine tự ghi: khung trước có đang ở dưới nước không. */
  wasInWater?: boolean;
  /** Chữ hiện lên khi chạm nước (ví dụ "+15"). */
  splashLabel?: string;
  /** Màu chữ hiện lên khi chạm nước. */
  splashLabelColor?: string;
  /** Hệ số cỡ cú bắn nước (1 = bình thường, 1.6 = rơi bụng). */
  splashScale?: number;
}

export interface PoolPalette {
  waterTop: string;
  waterMid: string;
  waterDeep: string;
  foam: string;
  foamGlow: string;
  droplet: string;
  dropletAlt: string;
}

export interface PoolEngineOptions {
  /** Khoảng cách cột lò xo Δx (px). Mặc định 8. */
  springSpacing?: number;
  /** Độ căng k. Mặc định 0.028. */
  tension?: number;
  /** Giảm chấn d. Mặc định 0.022. */
  damping?: number;
  /** Hệ số lan truyền s. Mặc định 0.26. */
  spread?: number;
  /** Số lượt lan truyền mỗi khung. Mặc định 6. */
  passes?: number;
  /** Hệ số nổi b. Mặc định 0.019. */
  buoyancy?: number;
  /** Hệ số cản nước c (theo vy). Mặc định 0.09. */
  waterDrag?: number;
  /** Nhân số hạt (0.3 khi giảm chuyển động). Mặc định 1. */
  particleScale?: number;
  /** Đáy hồ (px, tính từ trên). Mặc định = height - 4. */
  floorY?: number;
  palette?: Partial<PoolPalette>;
}

interface Spring { x: number; y: number; vy: number }
interface Droplet { x: number; y: number; vx: number; vy: number; r: number; color: string }
interface Bubble { x0: number; x: number; y: number; vx: number; vy: number; r: number; phase: number; omega: number; amp: number; alpha: number }
interface Ring { x: number; radius: number; maxRadius: number; alpha: number }
interface FloatText { x: number; y: number; vy: number; text: string; color: string; alpha: number; size: number }

const MAX_DROPLETS = 220;
const MAX_BUBBLES = 160;
const MAX_RINGS = 12;
const MAX_TEXTS = 8;

export const DEFAULT_POOL_PALETTE: PoolPalette = {
  waterTop: "rgba(0, 212, 255, 0.72)",
  waterMid: "rgba(9, 132, 227, 0.84)",
  waterDeep: "rgba(10, 61, 98, 0.95)",
  foam: "rgba(224, 247, 250, 0.9)",
  foamGlow: "#80deea",
  droplet: "#e0f7fa",
  dropletAlt: "#80deea",
};

export class PoolPhysicsEngine {
  width: number;
  height: number;
  baseY: number;
  floorY: number;

  readonly springSpacing: number;
  numSprings = 0;
  springs: Spring[] = [];
  tension: number;
  damping: number;
  spread: number;
  passes: number;
  buoyancy: number;
  waterDrag: number;
  particleScale: number;
  palette: PoolPalette;

  droplets: Droplet[] = [];
  bubbles: Bubble[] = [];
  rings: Ring[] = [];
  floatingTexts: FloatText[] = [];

  /** Số bước mô phỏng đã chạy (dùng cho hiệu ứng theo thời gian). */
  tick = 0;

  private leftDeltas = new Float32Array(0);
  private rightDeltas = new Float32Array(0);
  private customFloor: boolean;

  constructor(canvasWidth: number, canvasHeight: number, waterLevelY: number, options: PoolEngineOptions = {}) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.baseY = waterLevelY;
    this.springSpacing = options.springSpacing ?? 8;
    this.tension = options.tension ?? 0.028;
    this.damping = options.damping ?? 0.022;
    this.spread = options.spread ?? 0.26;
    this.passes = options.passes ?? 6;
    this.buoyancy = options.buoyancy ?? 0.019;
    this.waterDrag = options.waterDrag ?? 0.09;
    this.particleScale = options.particleScale ?? 1;
    this.customFloor = options.floorY !== undefined;
    this.floorY = options.floorY ?? canvasHeight - 4;
    this.palette = { ...DEFAULT_POOL_PALETTE, ...options.palette };
    this.initSprings();
  }

  initSprings(): void {
    this.numSprings = Math.max(2, Math.ceil(this.width / this.springSpacing) + 1);
    this.springs = [];
    for (let i = 0; i < this.numSprings; i++) {
      this.springs.push({ x: i * this.springSpacing, y: this.baseY, vy: 0 });
    }
    this.leftDeltas = new Float32Array(this.numSprings);
    this.rightDeltas = new Float32Array(this.numSprings);
  }

  resize(newWidth: number, newHeight: number, newWaterLevelY: number): void {
    const dy = newWaterLevelY - this.baseY;
    this.width = newWidth;
    this.height = newHeight;
    this.baseY = newWaterLevelY;
    if (!this.customFloor) this.floorY = newHeight - 4;
    this.initSprings();
    // Hạt đang bay dời theo mực nước mới để không bị "nhảy".
    for (const d of this.droplets) d.y += dy;
    for (const b of this.bubbles) b.y += dy;
  }

  setPalette(p: Partial<PoolPalette>): void {
    this.palette = { ...this.palette, ...p };
  }

  /** Độ cao mặt nước tại x (nội suy tuyến tính giữa 2 cột lò xo). */
  getWaterHeightAt(x: number): number {
    const s = this.springs;
    const index = Math.floor(x / this.springSpacing);
    if (index < 0) return s[0].y;
    if (index >= this.numSprings - 1) return s[this.numSprings - 1].y;
    const s1 = s[index];
    const s2 = s[index + 1];
    const t = (x - s1.x) / this.springSpacing;
    return s1.y + (s2.y - s1.y) * t;
  }

  /** Đẩy một xung nhỏ vào mặt nước (gợn lăn tăn, gió…). */
  impulse(x: number, velocity: number): void {
    const idx = Math.round(x / this.springSpacing);
    if (idx >= 0 && idx < this.numSprings) this.springs[idx].vy += velocity;
  }

  /** Thêm chữ nổi (Combo / điểm) tại vị trí bất kỳ. */
  addFloatingText(x: number, y: number, text: string, color = "#ffffff", size = 16): void {
    if (this.floatingTexts.length >= MAX_TEXTS) this.floatingTexts.shift();
    this.floatingTexts.push({ x, y, vy: -1.6, text, color, alpha: 1, size });
  }

  /** Kích hoạt cú bắn nước: ép lõm mặt nước + vòng sóng + giọt bắn + bọt khí + chữ nổi. */
  triggerSplash(x: number, impactVelocity = 14, bodyRadius = 24, labelText = "", labelColor = "#ffffff", scale = 1): void {
    const v = Math.max(0, impactVelocity) * scale;
    const centerIndex = Math.floor(x / this.springSpacing);
    const radiusIndices = Math.max(1, Math.ceil((bodyRadius * Math.sqrt(scale)) / this.springSpacing));

    // 1. Ép lõm các cột lò xo tại vùng tiếp nước (falloff cos).
    for (let i = centerIndex - radiusIndices; i <= centerIndex + radiusIndices; i++) {
      if (i >= 0 && i < this.numSprings) {
        const dist = Math.abs(i - centerIndex) / radiusIndices;
        this.springs[i].vy += v * Math.cos(dist * (Math.PI / 2)) * 1.35;
      }
    }

    // 2. Vòng sóng lan toả trên mặt nước.
    if (this.rings.length >= MAX_RINGS) this.rings.shift();
    this.rings.push({ x, radius: bodyRadius * 0.6, maxRadius: bodyRadius * 4 * Math.sqrt(scale), alpha: 0.92 });

    // 3. Giọt nước bắn vọt lên từ 2 mép hố lõm.
    const surface = this.getWaterHeightAt(x);
    const dropletCount = Math.min(48, Math.floor(v * 2.4 * this.particleScale));
    for (let i = 0; i < dropletCount && this.droplets.length < MAX_DROPLETS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const angle = -Math.PI / 2 + side * (0.16 + Math.random() * 0.68);
      const speed = v * 0.45 + Math.random() * (v * 0.55);
      this.droplets.push({
        x: x + side * (Math.random() * bodyRadius * 0.7),
        y: surface - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.6 + Math.random() * 3,
        color: Math.random() > 0.35 ? this.palette.droplet : this.palette.dropletAlt,
      });
    }

    // 4. Bọt khí bị cuốn theo xuống nước.
    const depthRoom = Math.max(6, this.floorY - this.baseY - 6);
    const bubbleCount = Math.min(32, Math.floor(v * 1.7 * this.particleScale));
    for (let i = 0; i < bubbleCount; i++) {
      this.spawnBubble(
        x + (Math.random() - 0.5) * bodyRadius * 1.8,
        this.baseY + 8 + Math.random() * Math.min(depthRoom, v * 4.2),
        (Math.random() - 0.5) * 2.4,
        -0.9 - Math.random() * 2.2,
        1.5 + Math.random() * 4,
      );
    }

    // 5. Chữ nổi (ví dụ "+15 Lộn 2 vòng!").
    if (labelText) this.addFloatingText(x, this.baseY - bodyRadius - 8, labelText, labelColor, 16);
  }

  private spawnBubble(x: number, y: number, vx: number, vy: number, r: number): void {
    if (this.bubbles.length >= MAX_BUBBLES) return;
    this.bubbles.push({
      x0: x,
      x,
      y,
      vx,
      vy,
      r,
      phase: Math.random() * Math.PI * 2,
      omega: 0.08 + Math.random() * 0.08,
      amp: 0.8 + Math.random() * 1.6,
      alpha: 0.65 + Math.random() * 0.3,
    });
  }

  /**
   * Trọng lực + lực nổi Ác-si-mét + cản nước cho 1 nhân vật; tự bắn nước khi vừa chạm mặt.
   * Gọi 1 lần mỗi bước (trước hoặc sau update()).
   */
  updateEntityPhysics(entity: PoolEntity, gravity = 0.45): void {
    entity.vy += gravity;
    const surfaceY = this.getWaterHeightAt(entity.x);
    const submergedDepth = entity.y + entity.radius * 0.5 - surfaceY;
    const inWater = submergedDepth > 0;

    if (!entity.wasInWater && inWater && entity.vy > 2.2) {
      this.triggerSplash(entity.x, entity.vy, entity.radius, entity.splashLabel || "", entity.splashLabelColor, entity.splashScale ?? 1);
      entity.splashLabel = "";
    }
    entity.wasInWater = inWater;

    if (inWater) {
      // a_nổi = -b·(độ ngập) - c·vy; độ ngập tối đa = cả thân (ngập hết thì lực nổi không tăng thêm).
      const depth = Math.min(submergedDepth, entity.radius * 2.2);
      entity.vy += -this.buoyancy * depth - this.waterDrag * entity.vy;
      entity.vx *= 0.94;

      if (Math.abs(entity.vy) > 0.65 && Math.random() < 0.35 * this.particleScale) {
        this.spawnBubble(
          entity.x + (Math.random() - 0.5) * entity.radius,
          entity.y + entity.radius * 0.4,
          (Math.random() - 0.5) * 0.6,
          -1.1 - Math.random() * 1.4,
          1.5 + Math.random() * 2.5,
        );
      }
    }

    entity.x += entity.vx;
    entity.y += entity.vy;

    // Chạm đáy hồ: nảy nhẹ lên.
    if (entity.y + entity.radius > this.floorY) {
      entity.y = this.floorY - entity.radius;
      if (entity.vy > 0) entity.vy *= -0.3;
    }
  }

  /** Một bước mô phỏng 1/60 s. */
  update(): void {
    this.tick++;
    const springs = this.springs;
    const n = this.numSprings;

    // Lớp 1a: Hooke có giảm chấn kéo mỗi cột về mực cân bằng.
    for (let i = 0; i < n; i++) {
      const s = springs[i];
      s.vy += -this.tension * (s.y - this.baseY) - this.damping * s.vy;
      s.y += s.vy;
    }

    // Lớp 1b: lan truyền chênh lệch độ cao sang 2 cột lân cận, 6 lượt.
    const L = this.leftDeltas;
    const R = this.rightDeltas;
    for (let pass = 0; pass < this.passes; pass++) {
      for (let i = 0; i < n; i++) {
        if (i > 0) {
          L[i] = this.spread * (springs[i].y - springs[i - 1].y);
          springs[i - 1].vy += L[i];
        }
        if (i < n - 1) {
          R[i] = this.spread * (springs[i].y - springs[i + 1].y);
          springs[i + 1].vy += R[i];
        }
      }
      for (let i = 0; i < n; i++) {
        if (i > 0) springs[i - 1].y += L[i];
        if (i < n - 1) springs[i + 1].y += R[i];
      }
    }

    // Lớp 2: giọt nước bay theo trọng lực, rơi lại mặt nước thì tạo gợn thứ cấp.
    const drops = this.droplets;
    let w = 0;
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.vx *= 0.99;
      d.vy += 0.42;
      d.x += d.vx;
      d.y += d.vy;
      let alive = d.x >= 0 && d.x <= this.width && d.y <= this.height;
      if (alive && d.vy > 0 && d.y >= this.getWaterHeightAt(d.x)) {
        const idx = Math.floor(d.x / this.springSpacing);
        if (idx >= 0 && idx < n) springs[idx].vy += d.vy * 0.18;
        alive = false;
      }
      if (alive) drops[w++] = d;
    }
    drops.length = w;

    // Lớp 3: bọt khí lắc lư hình sin, vỡ khi chạm mặt nước.
    const bubbles = this.bubbles;
    w = 0;
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.phase += b.omega;
      b.x0 += b.vx;
      b.vx *= 0.95;
      b.x = b.x0 + b.amp * Math.sin(b.phase);
      b.y += b.vy;
      if (b.y <= this.getWaterHeightAt(b.x) + 2) {
        if (b.r > 3.2) this.impulse(b.x, -0.6); // bọt to vỡ tạo gợn nhỏ
        continue;
      }
      bubbles[w++] = b;
    }
    bubbles.length = w;

    const rings = this.rings;
    w = 0;
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      r.radius += (r.maxRadius - r.radius) * 0.12;
      r.alpha *= 0.92;
      if (r.alpha >= 0.04) rings[w++] = r;
    }
    rings.length = w;

    const texts = this.floatingTexts;
    w = 0;
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      t.y += t.vy;
      t.vy *= 0.97;
      t.alpha -= 0.016;
      if (t.alpha > 0) texts[w++] = t;
    }
    texts.length = w;
  }

  /** Mặt nước gần như đứng yên và không còn hạt nào (có thể giảm tần suất vẽ). */
  isCalm(epsilon = 0.05): boolean {
    if (this.droplets.length || this.bubbles.length || this.rings.length || this.floatingTexts.length) return false;
    for (const s of this.springs) if (Math.abs(s.vy) > epsilon || Math.abs(s.y - this.baseY) > epsilon) return false;
    return true;
  }

  /** Số liệu cho kiểm thử hiệu năng (OpenCode). */
  getStats() {
    return { springs: this.numSprings, droplets: this.droplets.length, bubbles: this.bubbles.length, rings: this.rings.length, texts: this.floatingTexts.length };
  }

  clear(): void {
    this.droplets.length = 0;
    this.bubbles.length = 0;
    this.rings.length = 0;
    this.floatingTexts.length = 0;
    for (const s of this.springs) {
      s.y = this.baseY;
      s.vy = 0;
    }
  }

  /** Vẽ đường mặt nước. continuePath = true: nối tiếp path đang vẽ (không mở subpath mới). */
  private traceSurface(ctx: CanvasRenderingContext2D, continuePath = false): void {
    const s = this.springs;
    if (continuePath) ctx.lineTo(s[0].x, s[0].y);
    else ctx.moveTo(s[0].x, s[0].y);
    for (let i = 0; i < this.numSprings - 1; i++) {
      const curr = s[i];
      const next = s[i + 1];
      ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) * 0.5, (curr.y + next.y) * 0.5);
    }
    const last = s[this.numSprings - 1];
    ctx.lineTo(last.x, last.y);
  }

  /** Vẽ phần dưới nước (thân nước + bọt khí). Gọi trước khi vẽ nhân vật nếu muốn nhân vật nằm trên lớp nước. */
  renderWater(ctx: CanvasRenderingContext2D): void {
    const p = this.palette;
    ctx.save();
    const grad = ctx.createLinearGradient(0, this.baseY - 20, 0, this.height);
    grad.addColorStop(0, p.waterTop);
    grad.addColorStop(0.35, p.waterMid);
    grad.addColorStop(1, p.waterDeep);
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    this.traceSurface(ctx, true);
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(b.alpha * 0.3).toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(224,247,250,${b.alpha.toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Vẽ viền bọt trắng phát sáng, vòng sóng, giọt bắn và chữ nổi (lớp trên cùng). */
  renderSurface(ctx: CanvasRenderingContext2D): void {
    const p = this.palette;
    ctx.save();
    ctx.beginPath();
    this.traceSurface(ctx);
    ctx.strokeStyle = p.foam;
    ctx.lineWidth = 3;
    ctx.shadowColor = p.foamGlow;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.lineWidth = 2;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      ctx.beginPath();
      ctx.ellipse(r.x, this.getWaterHeightAt(r.x), r.radius, r.radius * 0.22, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${r.alpha.toFixed(3)})`;
      ctx.stroke();
    }

    // Giọt nước: elip xoay theo hướng bay, kéo dài theo tốc độ.
    for (let i = 0; i < this.droplets.length; i++) {
      const d = this.droplets[i];
      const speed = Math.hypot(d.vx, d.vy);
      const angle = Math.atan2(d.vy, d.vx);
      const stretch = Math.min(2.6, 1 + speed * 0.09);
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r * stretch, d.r * 0.85, angle, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));
      ctx.font = `900 ${t.size}px system-ui, sans-serif`;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(15,23,42,0.55)";
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  /** Vẽ toàn bộ (nước + mặt nước + hạt). */
  render(ctx: CanvasRenderingContext2D): void {
    this.renderWater(ctx);
    this.renderSurface(ctx);
  }
}

export default PoolPhysicsEngine;
