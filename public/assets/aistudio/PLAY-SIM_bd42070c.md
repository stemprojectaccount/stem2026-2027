# PLAY-SIM: learning games, simulations and 3D

Companion to `SKILL.md`. Read it when the task is a learning game, an interactive activity, a 2D or 3D simulation, or a virtual lab. Everything in `SKILL.md` still applies: the locked requirements, the inherited identity, the craft and learning rules, the lean ladder and the QA gate. This file adds the rules for the **stage**, the one region where the activity happens.

**Contents:** 1 Choosing the form · 2 Learning games (G) · 3 Simulations (V) · 4 3D (D) · 5 Stage engineering · 6 Subject patterns · 7 QA additions · Skeleton A (2D simulation) · Skeleton B (3D model)

---

## 1. Choosing the form

Apply the lean ladder to interactivity: build **the smallest interactive form that teaches the thing**. A bigger form costs load time, battery, accessibility and build effort, and usually teaches no more.

| The student needs to… | Smallest form that works | Not |
|---|---|---|
| recall a fact, a word, a formula | flashcards, a short quiz | a game world |
| build fluency by repetition (mental arithmetic, vocabulary, spelling) | a short game round | a long lesson |
| see how one quantity depends on another | a 2D simulation with one or two controls and a readout or graph | a video |
| understand a shape or an arrangement in space | a 3D model they can turn | a 3D "experience" with nothing to manipulate |
| follow a procedure (an experiment, a construction) | a stepped virtual lab | free exploration with no task |
| apply knowledge to a new case | a problem set with worked feedback | a game |

**2D or 3D?** Choose 3D only when depth carries the meaning: solids in geometry (hình hộp, lăng trụ, hình trụ, hình nón, hình cầu), molecules and crystal structures, the Earth-Moon-Sun system, anatomy. If a cross-section, a graph or a top view explains it, build that in 2D: it loads faster, runs on every phone and is easier to read.

**Which technology?** Stop at the first that fits.
1. **DOM and CSS:** card, word, matching, sorting, ordering and quiz games. Most learning games belong here, and accessibility comes almost free.
2. **SVG:** diagrams with a few moving parts, geometric constructions, graphs, draggable points.
3. **Canvas 2D:** many moving objects, particles, continuous drawing, simple physics.
4. **WebGL through three.js:** real 3D (Section 4).
5. **A game engine:** only when the project already uses one or the game truly needs tilemaps, scenes and physics. Pinned (K3).

---

## 2. Learning games (G)

- **G1 The learning action is the game action.** What the player does to win is the thing they are meant to learn. Test: take the learning content out. If the game plays the same, it is a reward wrapper, not a learning game. Answering five questions and then playing an unrelated jumping game fails the test. Sorting falling numbers into "số nguyên tố" and "hợp số", or placing a fraction on a number line before time runs out, passes it.
- **G2 One loop, stated.** Challenge → action → feedback → progress → next challenge. Write the loop in one line in the brief. A round lasts 2-5 minutes and has a clear end.
- **G3 Difficulty.** The first 20 seconds must be winnable. Raise **one** variable at a time: speed, range or number of items. Ease off after two misses in a row. Never make a game harder by making it less readable.
- **G4 Mistakes are part of play.** A miss shows the right answer briefly and the item returns later in the round. No "game over" in the first minute. Lives are optional and, if used, generous. Never punish with waiting.
- **G5 Feedback budget.** Every action gets a response within 100ms. Effects are small, shorter than 300ms and stay inside the stage. No screen shake, no flashes. Sound is off by default, with a visible mute toggle whose choice is remembered.
- **G6 The score means learning.** The result shows accuracy and what was learned ("12 từ, sai 2: …") before any points. A personal best beats a global rank. Combos reward consecutive correct answers; speed is rewarded only when fluency is the goal.
- **G7 The HUD is minimal and honest:** position in the round, score, pause. Pause is always available and engages by itself when the tab is hidden. Leaving keeps progress.
- **G8 Time pressure is opt-in.** Use it only when fluency is the goal, and always offer an untimed mode ("Chế độ thong thả").
- **G9 Fair and safe** (`SKILL.md` E5). No paid advantage, no loot boxes, no random rewards of value, no public shaming. Competitive features are opt-in and use display names.
- **G10 Content is data.** The item bank (questions, words, levels) is a data array or a JSON file with stable ids. The engine never hard-codes content. A round samples from the bank, and results are stored per item, so the product can tell the student what to review.
- **G11 One state machine.** `ready → playing ⇄ paused → result`, held in one variable, with one function per transition. The result screen shows what was learned, the items to review, "Chơi lại" and "Thoát".
- **G12 Input.** Pointer events (touch and mouse) and the keyboard can each complete the game. Targets in the stage are ≥ 48px on phones. No hover. No precision dragging. Portrait and landscape both work, or the game says which one it needs.
- **G13 Access.** Color is never the only cue: add a shape or a label. Text in the stage is ≥ 16px. Reduced motion keeps the gameplay and drops decorative effects. A DOM game uses real buttons. A canvas game puts its essential state and results in the DOM (a live region) and, where feasible, offers an equivalent DOM mode.
- **G14 Save.** The round result and per-item correctness go to the progress store. After a reload the game returns to `ready` with the last result shown, not to the middle of a real-time round.

---

## 3. Simulations (V)

- **V1 A simulation is a question with a model attached.** Structure every one as predict → observe → explain: a task asks for a prediction, the student changes or runs the model, a short question checks the explanation. Free play with no task teaches little.
- **V2 Truth first.** Formulas, constants and units are correct. Assumptions are on screen ("bỏ qua ma sát"). A simplified model says so ("mô hình đơn giản hóa"). Never fake behavior to look nicer. If you are unsure of the science, say so and flag it for teacher review (`SKILL.md` I8).
- **V3 Few variables.** The student changes 1-3 things; everything else is fixed and listed. Each control has a label, a unit, its current value as a number, sensible minimum, maximum and step, and there is one reset.
- **V4 Readouts.** Quantities appear as numbers with units, at sensible precision (2-3 significant figures), in Vietnamese number format, with tabular numerals, next to the stage. Add a graph when the relation over time is the point. A value that changes many times per second must **not** sit in an `<output>` or any live region, which would flood a screen reader. Announce the result once, when it settles.
- **V5 Time control** for dynamic models: play and pause, reset, optionally step and speed (0.5× 1× 2×). Say whether it runs in real time. Never autoplay on load.
- **V6 Layout.** Stage, controls, readouts and task are visible together. Phone: stage on top (about 40% of the height), controls and readouts below, the primary action reachable; a panel never covers the stage. Wide screens: stage on one side, panel on the other.
- **V7 Numerics.** Advance the model with a **fixed time step** decoupled from the frame rate. Clamp long frames so a tab switch does not fast-forward it. Compute end conditions exactly instead of overshooting. Keep SI units inside the model and format only at the edge.
- **V8 Direct manipulation** when it helps: drag the object itself (a point, a vector, a weight), always paired with an equivalent form control for the keyboard and for screen readers.
- **V9 Text alternative.** The stage has `role="img"` and a label saying what it shows. The numbers that matter live in the DOM. Important events are announced once through the live region.
- **V10 State is a small plain object** of parameters: storable, resettable, and ready to hand in to a teacher if the product supports that.

---

## 4. 3D (D)

- **D1 Earn the third dimension** (Section 1). A spinning decoration is not a lesson.
- **D2 Loading three.js.** Current releases ship **ES modules only**. Load them through an import map, pinning one exact version for both entries, with addons from `three/addons/…` at the same version. The old global build (`<script src="…/three.min.js">`) and the `examples/js/` files are gone; never write them. In a bundler project, `npm install three` and import normally. Do not invent any other CDN path. If you cannot be certain of the version and path, use the pattern in Skeleton B unchanged.
- **D3 Fallback first.** A static description or diagram is in the HTML and visible by default. The script hides it once the scene has rendered. If WebGL is missing, the CDN is blocked or the context is lost, the fallback is what the student sees, and everything that is not 3D (controls, readouts, the task) still works.
- **D4 The budget of a weak phone.** Cap the pixel ratio at 2 (1.5 if it stutters). **Render on demand** when the model sits still: draw only when the camera or a value changes, with no permanent loop. Pause any loop when the page is hidden or the stage is off-screen. Low-poly geometry, shared materials, no post-processing, no real-time shadows by default, textures ≤ 1024px. Dispose of geometries, materials, textures and the renderer on teardown.
- **D5 Camera.** Orbit with limits: a minimum and maximum distance, and no view from under the floor. A "Đặt lại góc nhìn" button. Preset views (Trước, Trên, Bên) that double as the keyboard path. No auto-rotation that fights the student, and none at all under reduced motion. `touch-action: none` on the canvas only, with enough page around it to scroll.
- **D6 Readable 3D.** A neutral ground, soft even light, visible edges where shape matters, measurements in the DOM rather than as tiny 3D text. Colors mirror the product palette in a small constants block next to the scene, because materials cannot read CSS variables. Object against background ≥ 3:1.
- **D7 The scene is a stage** (V6) with a set height. Never full-bleed behind text. Controls sit outside the canvas as real form controls.
- **D8 Honest scale.** Say when sizes or distances are not to scale (the solar system never is).
- **D9 Stay on the stable API.** three.js deprecates and removes things often; for example its `Clock` helper has been deprecated in recent releases. Keep to the long-stable core (scene, camera, renderer, mesh, standard geometries and materials, lights, `OrbitControls`), time your own animation with `requestAnimationFrame` timestamps, and when a project pins a version, follow that version's documentation. If you are not sure an API exists in the pinned version, do not use it.

---

## 5. Stage engineering (games, simulations and 3D alike)

- **Size.** CSS decides the box (`width: 100%` plus a height or `aspect-ratio`). The script sizes the backing store from a `ResizeObserver`, with the device pixel ratio capped at 2, and draws in CSS pixels.
- **Color.** Canvas 2D accepts any CSS color, so read the tokens with `getComputedStyle(canvas).getPropertyValue('--accent')` and re-read them when the theme changes. 3D materials need a constants block (D6).
- **The loop runs only while something moves.** Cancel the animation frame on pause, finish, hide and teardown. A stage at rest uses no CPU.
- **Input.** Pointer Events with `setPointerCapture` and `touch-action`, reset on `pointercancel`, `lostpointercapture` and window `blur` (`SKILL.md` A7). Every pointer path has a keyboard twin.
- **Audio** is created only after a user gesture, is never required, and its mute state is remembered.
- **Hot loop hygiene.** No allocation per frame, object pools for many entities, a steady 30 fps or better on a low-end Android.
- **Sandbox.** The rules of `SKILL.md` 7.3 apply: guarded storage, actions on button clicks, no `#hash` navigation, no fullscreen or device-motion dependence without a failure path.

---

## 6. Subject patterns (starting points, not templates)

The user's curriculum and content always decide. Never invent a curriculum claim.

- **Toán:** number line for integers and fractions · coordinate plane with draggable points (đồ thị y = ax + b) · constructions in SVG (tam giác, đường tròn, góc) · solids in 3D with their nets (hình khai triển) · dice and spinners with tallies for probability.
- **Khoa học tự nhiên, vật lí:** motion with s-t graphs · levers and balance · density and floating · series and parallel circuits with meter readouts · reflection, refraction and lenses as ray diagrams.
- **Khoa học tự nhiên, hóa học:** particle models of the three states · schematic atom shells · a periodic-table explorer · balancing equations as a puzzle · the pH scale with indicator colors · molecules in 3D.
- **Khoa học tự nhiên, sinh học:** a labeled schematic cell explorer · food webs built by dragging relations · a microscope focus simulation · photosynthesis with light and CO₂ as the variables.
- **Lịch sử và Địa lí:** zoomable timelines · layered maps · Earth, Sun and Moon in 3D for day, night and seasons · climate charts. **Never draw a country's map or borders from memory.** Use an image slot for an official map supplied by the user: borders and territory are legally and politically sensitive, and a wrong map is a serious content error.
- **Ngữ văn and Tiếng Anh:** sentence ordering · cloze (điền từ) · matching · spaced-repetition flashcards · pronunciation with audio plus text (IPA or a transcript).
- **Tin học:** ordering the steps of an algorithm · a simple grid robot driven by command blocks.

---

## 7. QA additions (run with `SKILL.md` Section 10)

- [ ] The form is the smallest that teaches the goal (Section 1). 3D is present only because depth carries meaning.
- [ ] Game: the learning action is the game action; the first 20 seconds are winnable; a round ends; mistakes teach.
- [ ] Simulation: a task with a prediction exists; formulas, units and assumptions are correct and visible; 1-3 controls, each with label, unit, value and reset.
- [ ] The whole activity can be completed by touch and by keyboard. Results and key values are in the DOM, not only painted on a canvas.
- [ ] Nothing autoplays. Pause works and engages when the tab is hidden. Reduced motion keeps the activity usable.
- [ ] The loop stops when nothing moves. Pixel ratio is capped. The stage resizes without stretching.
- [ ] No rapidly changing value sits in a live region.
- [ ] 3D: an import map with one pinned version; a fallback that is visible by default; the non-3D parts work alone; camera limits and a reset view.
- [ ] Progress and results are saved in data shaped per item, with content coming from data, not from code.

---

## Skeleton A. A 2D simulation: "Tốc độ chuyển động"

A complete small simulation that follows V1-V10 and Section 5. It plugs into `SCAFFOLD.html`: it uses the scaffold's tokens and its `.stack`, `.btn`, `.action-bar`, `.note`, `.num` and `.visually-hidden` classes, and goes inside a view. Verified in headless Chrome at 360×640 and 1366×650, light and dark: the task, the stage, the readouts and the primary action fit one screen; it finishes at exactly 2,0 s for 10 m/s and 4,0 s for 5 m/s, also after a pause and under CPU throttling; it pauses when the tab is hidden, resets, works by keyboard alone, and redraws sharply on resize.

```html
<section class="sim stack" aria-labelledby="sim-title">
  <h1 id="sim-title">Tốc độ chuyển động</h1>
  <p class="sim-task"><strong>Dự đoán:</strong> viên bi lăn với tốc độ 5 m/s thì đi hết 20 m trong bao lâu? Bấm Chạy để kiểm tra.</p>
  <div class="sim-stage">
    <dl class="sim-readouts">
      <div><dt>Thời gian</dt><dd><span class="num" id="sim-t">0,0</span> s</dd></div>
      <div><dt>Quãng đường</dt><dd><span class="num" id="sim-s">0,0</span> m</dd></div>
    </dl>
    <canvas id="sim-canvas" role="img" aria-label="Viên bi lăn trên một đường thẳng dài 20 mét, có vạch chia mỗi 5 mét"></canvas>
  </div>
  <div class="field">
    <label for="sim-speed">Tốc độ: <output class="num" id="sim-v" for="sim-speed">5</output> m/s</label>
    <input id="sim-speed" type="range" min="1" max="10" step="1" value="5">
  </div>
  <div class="action-bar">
    <button class="btn btn--primary" type="button" id="sim-play">Chạy</button>
    <button class="btn" type="button" id="sim-reset">Đặt lại</button>
  </div>
  <p class="note">Mô hình đơn giản hóa: viên bi chuyển động đều, bỏ qua ma sát.</p>
  <p class="visually-hidden" id="sim-status" role="status"></p>
</section>
```

```css
.sim { --stack: var(--space-5); }
.sim-task { padding: var(--space-3) var(--space-4); border-radius: var(--radius-control); background: var(--accent-soft); }
.sim-stage { border: 1px solid var(--line); border-radius: var(--radius-panel); background: var(--surface); overflow: hidden; }
.sim-stage canvas { display: block; width: 100%; height: clamp(8rem, 22vh, 13rem); }
.sim-readouts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--line); }
.sim-readouts dt { color: var(--ink-muted); font-size: var(--text-sm); }
.sim-readouts dd { font: 600 var(--text-lg)/1.3 var(--font-display); }
.field { display: grid; gap: var(--space-2); }
.field label { font-weight: 600; }
.field input[type="range"] { width: 100%; min-height: 2.75rem; margin: 0; }
```

```js
(() => {
  const canvas = document.getElementById('sim-canvas');
  const ctx = canvas.getContext('2d');
  const out = { t: document.getElementById('sim-t'), s: document.getElementById('sim-s'), v: document.getElementById('sim-v') };
  const speedInput = document.getElementById('sim-speed');
  const playButton = document.getElementById('sim-play');
  const resetButton = document.getElementById('sim-reset');
  const status = document.getElementById('sim-status');
  const decimal = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const TRACK = 20;       // metres
  const STEP = 1 / 120;   // model step in seconds: fixed, so the result does not depend on the frame rate
  const LABELS = { ready: 'Chạy', playing: 'Tạm dừng', paused: 'Chạy tiếp', done: 'Chạy lại' };
  const model = { t: 0, x: 0, v: Number(speedInput.value) };
  let state = 'ready';    // ready | playing | paused | done
  let frameId = 0;
  let lastTime = 0;
  let backlog = 0;
  let width = 0;
  let height = 0;
  let colors = {};

  function advance(dt) {
    const used = Math.min(dt, (TRACK - model.x) / model.v);   // land exactly on the finish line instead of overshooting
    model.x += model.v * used;
    model.t += used;
    if (TRACK - model.x < 1e-9) { model.x = TRACK; finish(); }
  }

  function draw() {
    const pad = 28;
    const baseline = Math.round(height * 0.6);
    const scale = (width - pad * 2) / TRACK;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.line;
    ctx.fillStyle = colors.label;
    ctx.beginPath();
    ctx.moveTo(pad, baseline);
    ctx.lineTo(width - pad, baseline);
    for (let metre = 0; metre <= TRACK; metre += 5) {
      const x = pad + metre * scale;
      ctx.moveTo(x, baseline);
      ctx.lineTo(x, baseline + 8);
      ctx.fillText(`${metre} m`, x, baseline + 14);
    }
    ctx.stroke();
    ctx.fillStyle = colors.ball;
    ctx.beginPath();
    ctx.arc(pad + model.x * scale, baseline - 13, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  function render() {
    out.t.textContent = decimal.format(model.t);
    out.s.textContent = decimal.format(model.x);
    draw();
  }

  function syncControls() {
    playButton.textContent = LABELS[state];
    speedInput.disabled = state === 'playing' || state === 'paused';
  }

  function frame(now) {
    frameId = requestAnimationFrame(frame);
    backlog += Math.min(Math.max(now - lastTime, 0) / 1000, 0.1);   // a long gap must not fast-forward the model
    lastTime = now;
    while (backlog >= STEP && state === 'playing') { advance(STEP); backlog -= STEP; }
    render();
  }

  function play() {
    if (state === 'done') reset();
    state = 'playing';
    lastTime = performance.now();
    backlog = 0;
    frameId = requestAnimationFrame(frame);
    syncControls();
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    cancelAnimationFrame(frameId);
    syncControls();
  }

  function finish() {
    state = 'done';
    cancelAnimationFrame(frameId);
    syncControls();
    status.textContent = `Viên bi đi hết ${TRACK} m trong ${decimal.format(model.t)} giây.`;
  }

  function reset() {
    cancelAnimationFrame(frameId);
    state = 'ready';
    model.t = 0;
    model.x = 0;
    status.textContent = '';
    syncControls();
    render();
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);   // phones report 3 or more; capping at 2 more than halves the pixels to fill
    const style = getComputedStyle(canvas);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = `500 14px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    colors = {
      line: style.getPropertyValue('--line-strong').trim(),
      label: style.getPropertyValue('--ink-muted').trim(),
      ball: style.getPropertyValue('--accent').trim()
    };
    render();
  }

  playButton.addEventListener('click', () => { if (state === 'playing') pause(); else play(); });
  resetButton.addEventListener('click', reset);
  speedInput.addEventListener('input', () => {
    model.v = Number(speedInput.value);
    out.v.textContent = speedInput.value;
    if (state === 'done') reset();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', resize);
  new ResizeObserver(resize).observe(canvas);
  syncControls();
})();
```

**What to keep when you adapt it:** the task with a prediction; the fixed-step `advance` with an exact end condition; one `state` variable with one function per transition; a loop that exists only while playing; readouts in the DOM, with the fast-changing ones outside any live region; colors read from tokens; the capped pixel ratio; pausing when hidden.

---

## Skeleton B. A 3D model: "Hình hộp chữ nhật"

A model the student resizes and turns, following D1-D9. It also plugs into `SCAFFOLD.html` and reuses the `.sim-*` and `.field` styles of Skeleton A. The architecture is the point: **a plain script makes the controls and readouts work on their own, and a separate module adds the 3D on top.** If the module cannot load, the student still has a working activity and reads the fallback line.

How far this was verified: the plain script, the fallback path and the module's own logic were run in headless Chrome, with the module running against a stand-in for the library, because the CDN could not be reached from the test environment. Its three.js calls follow the documented import-map pattern and long-stable API, but were **not** executed against the real library there. Run it once in a browser before relying on it.

```html
<section class="sim stack" aria-labelledby="box-title">
  <h1 id="box-title">Hình hộp chữ nhật</h1>
  <p class="sim-task"><strong>Dự đoán:</strong> nếu gấp đôi chiều cao thì thể tích thay đổi thế nào? Kéo thanh trượt để kiểm tra.</p>
  <div class="sim-stage">
    <dl class="sim-readouts">
      <div><dt>Thể tích</dt><dd><span class="num" id="box-volume">48</span> cm³</dd></div>
      <div><dt>Diện tích xung quanh</dt><dd><span class="num" id="box-lateral">56</span> cm²</dd></div>
    </dl>
    <div class="sim-view" id="box-stage">
      <p class="sim-fallback" id="box-fallback">Mô hình 3D chưa tải được trên thiết bị này. Bạn vẫn đổi được kích thước bên dưới và xem thể tích thay đổi.</p>
    </div>
  </div>
  <div class="actions" id="box-views" hidden>
    <button class="btn" type="button" data-view="front">Nhìn từ trước</button>
    <button class="btn" type="button" data-view="top">Nhìn từ trên</button>
    <button class="btn" type="button" data-view="home">Đặt lại góc nhìn</button>
  </div>
  <div class="sim-controls">
    <div class="field">
      <label for="box-a">Chiều dài: <output class="num" id="box-a-out" for="box-a">4</output> cm</label>
      <input id="box-a" type="range" min="1" max="8" step="1" value="4">
    </div>
    <div class="field">
      <label for="box-b">Chiều rộng: <output class="num" id="box-b-out" for="box-b">3</output> cm</label>
      <input id="box-b" type="range" min="1" max="8" step="1" value="3">
    </div>
    <div class="field">
      <label for="box-c">Chiều cao: <output class="num" id="box-c-out" for="box-c">4</output> cm</label>
      <input id="box-c" type="range" min="1" max="8" step="1" value="4">
    </div>
  </div>
  <p class="note">Thể tích V = dài × rộng × cao. Diện tích xung quanh = chu vi đáy × cao.</p>
</section>
```

```css
.sim-view { height: clamp(13rem, 38vh, 22rem); }
.sim-view canvas { height: 100%; }
.sim-fallback { display: grid; place-items: center; height: 100%; max-width: none; padding: var(--space-5); color: var(--ink-muted); text-align: center; }
.sim-controls { display: grid; gap: var(--space-4); }
```

The plain script: controls and readouts, independent of 3D.

```js
(() => {
  const number = new Intl.NumberFormat('vi-VN');
  const inputs = ['box-a', 'box-b', 'box-c'].map((id) => document.getElementById(id));

  function update() {
    const [a, b, c] = inputs.map((input) => Number(input.value));
    inputs.forEach((input) => { document.getElementById(`${input.id}-out`).textContent = input.value; });
    document.getElementById('box-volume').textContent = number.format(a * b * c);
    document.getElementById('box-lateral').textContent = number.format(2 * (a + b) * c);
  }

  inputs.forEach((input) => input.addEventListener('input', update));
  update();
})();
```

The import map goes in `<head>`, before any module script. Both entries use the same exact version.

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
  }
}
</script>
```

The module: goes in `<script type="module">` after the markup.

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stage = document.getElementById('box-stage');
const fallback = document.getElementById('box-fallback');
const views = document.getElementById('box-views');
const inputs = ['box-a', 'box-b', 'box-c'].map((id) => document.getElementById(id));

// materials cannot read CSS variables: these mirror the product tokens
const PALETTE = { face: 0x3f6fd1, edge: 0x16233d, grid: 0xb9c4d8 };
const HOME = [9, 7, 12];
const VIEW_DISTANCE = 16;

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch {
  renderer = null;   // no WebGL: the fallback line stays, the controls and readouts still work
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(...HOME);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7bd, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(5, 9, 6);
  scene.add(keyLight);
  scene.add(new THREE.GridHelper(12, 12, PALETTE.grid, PALETTE.grid));

  // one unit box, scaled on input: no geometry is rebuilt and nothing leaks
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const box = new THREE.Mesh(unit, new THREE.MeshStandardMaterial({ color: PALETTE.face, roughness: 0.7 }));
  box.add(new THREE.LineSegments(new THREE.EdgesGeometry(unit), new THREE.LineBasicMaterial({ color: PALETTE.edge })));
  scene.add(box);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;   // never look from under the floor

  // on demand: nothing moves by itself, so there is no animation loop
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);

  function update() {
    const [length, depth, tall] = inputs.map((input) => Number(input.value));
    box.scale.set(length, tall, depth);
    box.position.y = tall / 2;                   // the box sits on the ground
    controls.target.set(0, tall / 2, 0);
    controls.update();
    render();
  }

  function setView(name) {
    const target = controls.target;
    if (name === 'front') camera.position.set(target.x, target.y, target.z + VIEW_DISTANCE);
    else if (name === 'top') camera.position.set(target.x, target.y + VIEW_DISTANCE, target.z + 0.01);
    else camera.position.set(...HOME);
    controls.update();
    render();
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }

  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Mô hình 3D của hình hộp chữ nhật. Kéo để xoay, hoặc dùng các nút góc nhìn.');
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); canvas.hidden = true; fallback.hidden = false; });
  canvas.addEventListener('webglcontextrestored', () => { canvas.hidden = false; fallback.hidden = true; render(); });

  stage.append(canvas);
  fallback.hidden = true;
  views.hidden = false;
  views.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (button) setView(button.dataset.view);
  });
  inputs.forEach((input) => input.addEventListener('input', update));
  new ResizeObserver(resize).observe(stage);
  update();
}
```

**What to keep when you adapt it:** the working activity without 3D; the fallback that is visible until the scene renders; the import map with one pinned version; rendering on demand; a unit geometry that is scaled rather than rebuilt; camera limits with preset views as the keyboard path; the capped pixel ratio; context-loss handling. When a model must animate (an orbit, a rotation), add a `requestAnimationFrame` loop timed with its own timestamps, pause it when the page is hidden, and skip it under `prefers-reduced-motion`.

*End of PLAY-SIM.*
