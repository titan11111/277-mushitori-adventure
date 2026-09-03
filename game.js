// game.js — むしとりアドベンチャー ループ・入力・状態機械

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ---------- DOM ----------
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  const startBtn = $('startBtn');
  const startOverlay = $('start');
  const periodIconEl = $('periodIcon');
  const periodNameEl = $('periodName');
  const clockEl = $('clock');
  const catchCountEl = $('catchCount');
  const messageEl = $('message');
  const heartsEl = $('hearts');
  const swingBtn = $('swingBtn');
  const bookBtn = $('bookBtn');
  const bagBtn = $('bagBtn');
  const menuBtn = $('menuBtn');
  const muteBtn = $('muteBtn');
  const bookOverlay = $('book');
  const bookGrid = $('bookGrid');
  const bookStatus = $('bookStatus');
  const bookTabs = document.querySelectorAll('.tab-btn');
  const bookClose = $('bookClose');
  const bagOverlay = $('bag');
  const bagList = $('bagList');
  const bagClose = $('bagClose');
  const menuOverlay = $('menu');
  const menuClose = $('menuClose');
  const skipTimeBtn = $('skipTimeBtn');
  const resetBtn = $('resetBtn');
  const clearOverlay = $('clear');
  const clearContinueBtn = $('clearContinueBtn');
  const catchCard = $('catchCard');
  const catchIcon = $('catchIcon');
  const catchLabel = $('catchLabel');
  const catchName = $('catchName');
  const catchNote = $('catchNote');
  const actionIcons = {
    idle: $('act-idle'), walk: $('act-walk'), run: $('act-run'),
    windup: $('act-windup'), swing: $('act-swing'), caught: $('act-caught')
  };
  const rightCards = { morning: $('card-morning'), day: $('card-day'), evening: $('card-evening'), night: $('card-night') };
  const stick = $('stick');
  const stickBase = $('stickBase');
  const stickKnob = $('stickKnob');

  // ---------- 保存 ----------
  const BOOK_KEY = 'mushitori-adv-book-v1';
  const MUTE_KEY = 'mushitori-adv-mute';
  function loadBook() {
    try { return JSON.parse(localStorage.getItem(BOOK_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveBook() {
    try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); } catch (e) { /* noop */ }
  }
  let book = loadBook(); // id -> catch count
  let muted = localStorage.getItem(MUTE_KEY) === '1';

  // ---------- オーディオ ----------
  let actx = null;
  function unlockAudio() {
    if (actx) { if (actx.state === 'suspended') actx.resume().catch(() => {}); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume().catch(() => {});
    } catch (e) { actx = null; }
  }
  function beep(freq, dur, type, vol) {
    if (muted || !actx) return;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = (vol == null ? 0.08 : vol);
    o.connect(g); g.connect(actx.destination);
    const now = actx.currentTime;
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (dur || 0.15));
    o.start(now); o.stop(now + (dur || 0.15) + 0.02);
  }
  function sfxSwing() { beep(520, 0.08, 'square', 0.05); }
  function sfxCatch() { beep(880, 0.12, 'triangle', 0.09); setTimeout(() => beep(1180, 0.14, 'triangle', 0.08), 70); }
  function sfxNew() { beep(660, 0.1, 'triangle', 0.08); setTimeout(() => beep(990, 0.1, 'triangle', 0.08), 90); setTimeout(() => beep(1320, 0.16, 'triangle', 0.08), 180); }
  function sfxMiss() { beep(180, 0.12, 'sawtooth', 0.05); }
  function sfxHop() { beep(320, 0.06, 'square', 0.04); }

  // ---------- 状態 ----------
  const state = {
    running: false,
    t: 0,
    gameHour: 6.2, // 0-24 の実数
    period: 'morning',
    player: {
      x: STAGE_W * 0.5, y: STAGE_H * 0.62, facing: -Math.PI / 2,
      speedMode: 'idle', // idle/sneak/walk/run
      stamina: 3, staminaMax: 3,
      pose: 'idle', swingPhase: null, swingT: 0
    },
    insects: [],
    input: { x: 0, y: 0, run: false, sneak: false },
    stick: { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 },
    totalCatches: 0,
    message: '',
    messageT: 0,
    badges: [], // {text, t}
    bookTab: 'all',
    lastPeriod: 'morning'
  };

  const SWING_WINDUP = 0.14, SWING_ACTIVE = 0.16, SWING_RESOLVE = 0.26;
  const SWING_RANGE = 78, SWING_CONE = 0.62; // ラジアン半角

  function periodForHour(h) {
    const hh = h % 24;
    for (const p of PERIOD_ORDER) {
      const P = PERIODS[p];
      if (P.hourEnd <= 24) {
        if (hh >= P.hourStart && hh < P.hourEnd) return p;
      } else {
        if (hh >= P.hourStart || hh < P.hourEnd - 24) return p;
      }
    }
    return 'morning';
  }

  function fmtClock(h) {
    const hh = Math.floor(h % 24);
    const mm = Math.floor((h % 1) * 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }

  // ---------- 虫の生成 ----------
  function pseudoRand01(n) {
    const v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  }
  function pickHabitatPos(habitat, idx) {
    const zones = HABITAT_ZONES[habitat] || HABITAT_ZONES.grass;
    const z = zones[idx % zones.length];
    const jx = (pseudoRand01(idx * 3 + 1) - 0.5) * 0.12;
    const jy = (pseudoRand01(idx * 7 + 2) - 0.5) * 0.1;
    return { x: (z.x + jx) * STAGE_W, y: (z.y + jy) * STAGE_H };
  }

  function spawnPeriodInsects() {
    const list = SPECIES_BY_PERIOD[state.period];
    state.insects = list.map((spec, i) => {
      const home = pickHabitatPos(spec.habitat, i + state.period.length);
      return {
        spec,
        x: home.x, y: home.y,
        homeX: home.x, homeY: home.y,
        vx: 0, vy: 0,
        phase: Math.random() * 10,
        fleeT: 0,
        jumpT: 0,
        wanderT: Math.random() * 2,
        targetX: home.x, targetY: home.y,
        caughtFade: 0,
        alive: true
      };
    });
  }

  // ---------- 入力 ----------
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') { e.preventDefault(); tryStartSwing(); }
    if (!state.running && (e.key === 'Enter' || e.key === ' ')) beginGame();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  // iOS Safari のダブルタップ拡大を抑止（viewportのuser-scalable=noだけでは古いWebViewで防げないため）
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 340) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  function readKeyboardInput() {
    let x = 0, y = 0;
    if (keys['arrowleft'] || keys['a']) x -= 1;
    if (keys['arrowright'] || keys['d']) x += 1;
    if (keys['arrowup'] || keys['w']) y -= 1;
    if (keys['arrowdown'] || keys['s']) y += 1;
    const run = !!(keys['shift']);
    const sneak = !!(keys['c']);
    return { x, y, run, sneak };
  }

  // 仮想スティック（タッチ）
  function stickPointerDown(e) {
    const rect = stickBase.getBoundingClientRect();
    state.stick.active = true;
    state.stick.id = e.pointerId;
    state.stick.cx = rect.left + rect.width / 2;
    state.stick.cy = rect.top + rect.height / 2;
    stickBase.setPointerCapture(e.pointerId);
    updateStickFromPointer(e);
  }
  function updateStickFromPointer(e) {
    if (!state.stick.active) return;
    let dx = e.clientX - state.stick.cx;
    let dy = e.clientY - state.stick.cy;
    const max = 34;
    const d = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(d, max);
    dx = dx / d * clamped; dy = dy / d * clamped;
    state.stick.dx = dx / max; state.stick.dy = dy / max;
    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  function stickPointerUp() {
    state.stick.active = false; state.stick.dx = 0; state.stick.dy = 0;
    stickKnob.style.transform = 'translate(0,0)';
  }
  stickBase.addEventListener('pointerdown', (e) => { unlockAudio(); stickPointerDown(e); });
  stickBase.addEventListener('pointermove', updateStickFromPointer);
  stickBase.addEventListener('pointerup', stickPointerUp);
  stickBase.addEventListener('pointercancel', stickPointerUp);

  swingBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); unlockAudio(); tryStartSwing(); });

  // ---------- スイング ----------
  function tryStartSwing() {
    if (!state.running) return;
    const p = state.player;
    if (p.swingPhase) return;
    p.swingPhase = 'windup';
    p.swingT = 0;
    pushBadge('① ふりかぶり');
    sfxSwing();
  }

  function pushBadge(text) {
    state.badges.push({ text, t: 0 });
    if (state.badges.length > 3) state.badges.shift();
  }

  function resolveSwing() {
    const p = state.player;
    let best = null, bestD = Infinity;
    for (const b of state.insects) {
      if (!b.alive) continue;
      const dx = b.x - p.x, dy = b.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > SWING_RANGE) continue;
      const ang = Math.abs(wrapAngle(Math.atan2(dy, dx) - p.facing));
      if (ang > SWING_CONE) continue;
      if (dist < bestD) { bestD = dist; best = b; }
    }
    if (best) {
      catchInsect(best);
      pushBadge('③ つかまえた！');
    } else {
      pushBadge('からぶり…');
      sfxMiss();
      // 周囲の虫が少し逃げる
      for (const b of state.insects) {
        if (!b.alive) continue;
        const d = Math.hypot(b.x - p.x, b.y - p.y);
        if (d < SWING_RANGE * 1.4) startFlee(b, p, 0.5);
      }
    }
  }

  function catchInsect(b) {
    const id = b.spec.id;
    const wasNew = !book[id];
    book[id] = (book[id] || 0) + 1;
    saveBook();
    state.totalCatches++;
    b.alive = false;
    b.caughtFade = 1;
    setTimeout(() => { if (!b.alive) { const home = { x: b.homeX, y: b.homeY }; b.x = home.x; b.y = home.y; b.alive = true; b.caughtFade = 0; } }, 3400);
    showCatchCard(b.spec, wasNew);
    if (wasNew) sfxNew(); else sfxCatch();
    syncHud();
    if (uniqueDiscovered() >= TOTAL_SPECIES) setTimeout(showClear, 900);
  }

  function uniqueDiscovered() { return Object.keys(book).filter(k => book[k] > 0).length; }

  function showCatchCard(spec, wasNew) {
    catchLabel.textContent = wasNew ? 'NEW' : 'GET';
    catchName.textContent = spec.name;
    catchNote.textContent = spec.note;
    const cctx = catchIcon.getContext('2d');
    cctx.clearRect(0, 0, catchIcon.width, catchIcon.height);
    cctx.save();
    cctx.translate(catchIcon.width / 2, catchIcon.height / 2 + 6);
    cctx.scale(3.2, 3.2);
    drawBug(cctx, spec, 0, 0, 0, state.t, 0);
    cctx.restore();
    catchCard.classList.add('show');
    clearTimeout(showCatchCard._t);
    showCatchCard._t = setTimeout(() => catchCard.classList.remove('show'), 1900);
  }

  function wrapAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

  // ---------- 虫の逃走・徘徊 ----------
  function startFlee(b, p, power) {
    const dx = b.x - p.x, dy = b.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    const dist = (b.spec.fly > 0 ? 90 : 30) * (power || 1);
    b.targetX = clamp(b.x + nx * dist, 20, STAGE_W - 20);
    b.targetY = clamp(b.y + ny * dist, STAGE_H * 0.18, STAGE_H - 20);
    b.fleeT = 0.9;
    if (b.spec.type === 'hopper' || b.spec.type === 'cricket') sfxHop();
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function updateInsects(dt) {
    const p = state.player;
    for (const b of state.insects) {
      if (!b.alive) continue;
      const dx = b.x - p.x, dy = b.y - p.y;
      const dist = Math.hypot(dx, dy);
      const mode = p.speedMode;
      const alertDist = b.spec.alert[mode === 'idle' ? 'sneak' : mode] || 0;
      if (mode !== 'idle' && dist < alertDist && b.fleeT <= 0) startFlee(b, p, 1);

      if (b.fleeT > 0) {
        b.fleeT -= dt;
        b.x = lerp(b.x, b.targetX, Math.min(1, dt * 6));
        b.y = lerp(b.y, b.targetY, Math.min(1, dt * 6));
      } else {
        b.wanderT -= dt;
        if (b.wanderT <= 0) {
          b.wanderT = 1.2 + Math.random() * 1.8;
          const roam = b.spec.fly > 0 ? 46 : (b.spec.type === 'caterpillar' ? 14 : 22);
          b.targetX = clamp(b.homeX + (Math.random() * 2 - 1) * roam, 20, STAGE_W - 20);
          b.targetY = clamp(b.homeY + (Math.random() * 2 - 1) * roam, STAGE_H * 0.18, STAGE_H - 20);
        }
        const speed = b.spec.fly > 0 ? 0.9 : 0.35;
        b.x = lerp(b.x, b.targetX, Math.min(1, dt * speed));
        b.y = lerp(b.y, b.targetY, Math.min(1, dt * speed));
      }
    }
  }

  // ---------- プレイヤー更新 ----------
  function updatePlayer(dt) {
    const p = state.player;
    const kb = readKeyboardInput();
    let ix = kb.x, iy = kb.y, run = kb.run, sneak = kb.sneak;
    if (state.stick.active) {
      ix = state.stick.dx; iy = state.stick.dy;
      const mag = Math.hypot(ix, iy);
      run = mag > 0.72; sneak = mag > 0 && mag < 0.34;
    }
    const mag = Math.hypot(ix, iy);

    if (p.swingPhase) {
      p.swingT += dt;
      if (p.swingPhase === 'windup' && p.swingT >= SWING_WINDUP) {
        p.swingPhase = 'active'; p.swingT = 0; pushBadge('② スイング'); resolveSwing();
      } else if (p.swingPhase === 'active' && p.swingT >= SWING_ACTIVE) {
        p.swingPhase = 'resolve'; p.swingT = 0;
      } else if (p.swingPhase === 'resolve' && p.swingT >= SWING_RESOLVE) {
        p.swingPhase = null; p.swingT = 0;
      }
      p.pose = p.swingPhase === 'windup' ? 'windup' : (p.swingPhase === 'active' ? 'swing' : 'caught');
    } else if (mag > 0.05) {
      const canRun = run && p.stamina > 0.05;
      const modeSpeed = sneak ? 40 : (canRun ? 190 : 95);
      p.speedMode = sneak ? 'sneak' : (canRun ? 'run' : 'walk');
      const nx = ix / (mag || 1), ny = iy / (mag || 1);
      p.x = clamp(p.x + nx * modeSpeed * dt, 24, STAGE_W - 24);
      p.y = clamp(p.y + ny * modeSpeed * dt, STAGE_H * 0.2, STAGE_H - 20);
      p.facing = Math.atan2(ny, nx);
      p.pose = p.speedMode === 'run' ? 'run' : 'walk';
      if (p.speedMode === 'run') p.stamina = Math.max(0, p.stamina - dt * 0.5);
      else p.stamina = Math.min(p.staminaMax, p.stamina + dt * 0.25);
    } else {
      p.speedMode = 'idle';
      p.pose = 'idle';
      p.stamina = Math.min(p.staminaMax, p.stamina + dt * 0.4);
    }
  }

  // ---------- 時間帯 ----------
  function updateClock(dt) {
    state.gameHour += (24 / DAY_LENGTH_SEC) * dt;
    if (state.gameHour >= 24) state.gameHour -= 24;
    const p = periodForHour(state.gameHour);
    if (p !== state.period) {
      state.period = p;
      spawnPeriodInsects();
      flashPeriodChange();
    }
  }

  function flashPeriodChange() {
    setMessage(`${PERIODS[state.period].name}になった。${PERIODS[state.period].sub}へ`, 3.2);
  }

  function setMessage(text, dur) {
    state.message = text; state.messageT = dur || 2.4;
  }

  // ---------- 描画 ----------
  function render() {
    const w = STAGE_W, h = STAGE_H;
    ctx.clearRect(0, 0, w, h);
    drawBackground(ctx, w, h, state.period, state.t);

    const pond = HABITAT_ZONES.pond[0];
    drawPond(ctx, pond.x * w, pond.y * h, 90, 34, state.period);
    [{ x: 0.1, y: 0.24 }, { x: 0.86, y: 0.2 }, { x: 0.68, y: 0.34 }].forEach((t, i) => drawTree(ctx, t.x * w, t.y * h, 1 + (i % 2) * 0.2));
    [{ x: 0.22, y: 0.62 }, { x: 0.6, y: 0.7 }, { x: 0.4, y: 0.5 }].forEach((t) => drawFlowerPatch(ctx, t.x * w, t.y * h, 1));
    [{ x: 0.15, y: 0.42 }, { x: 0.5, y: 0.32 }, { x: 0.78, y: 0.56 }].forEach((t) => drawGrassTuft(ctx, t.x * w, t.y * h, 1.4));

    for (const b of state.insects) {
      if (!b.alive && b.caughtFade <= 0) continue;
      ctx.save();
      if (!b.alive) ctx.globalAlpha = 0.0;
      drawBug(ctx, b.spec, b.x, b.y, clamp((b.targetX - b.x) * 0.01, -0.4, 0.4), state.t, b.phase);
      ctx.restore();
    }

    const p = state.player;
    let swingU = 0.5;
    if (p.swingPhase === 'active') swingU = p.swingT / SWING_ACTIVE;
    else if (p.swingPhase === 'windup') swingU = 0;
    else if (p.swingPhase === 'resolve') swingU = 1;
    drawPlayer(ctx, p.x, p.y, p.facing, p.pose, state.t, { swingU });

    // バッジ（①②③）
    ctx.save();
    ctx.textAlign = 'center';
    state.badges.forEach((bd, i) => {
      const age = bd.t;
      const alpha = clamp(1 - age / 1.1, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 15px "Hiragino Sans", sans-serif';
      const bx = p.x, by = p.y - 46 - i * 20 - age * 14;
      ctx.fillStyle = 'rgba(20,20,20,0.72)';
      const tw = ctx.measureText(bd.text).width;
      roundRect(ctx, bx - tw / 2 - 10, by - 14, tw + 20, 22, 11);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(bd.text, bx, by + 2);
    });
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---------- HUD 同期 ----------
  function syncHud() {
    periodIconEl.textContent = PERIODS[state.period].icon;
    periodNameEl.textContent = PERIODS[state.period].name;
    clockEl.textContent = fmtClock(state.gameHour);
    catchCountEl.textContent = `${state.totalCatches} / ${TOTAL_SPECIES}`;
    heartsEl.innerHTML = '';
    const full = Math.round(state.player.stamina);
    for (let i = 0; i < state.player.staminaMax; i++) {
      const s = document.createElement('span');
      s.className = 'heart' + (i < full ? ' full' : '');
      s.textContent = i < full ? '❤' : '♡';
      heartsEl.appendChild(s);
    }
    Object.entries(actionIcons).forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle('active', k === state.player.pose);
    });
    messageEl.textContent = state.message || defaultMessage();
    renderRightCards();
    if (bookOverlay.classList.contains('open')) renderBook();
  }

  function defaultMessage() {
    return '近づいて正面で網を振ろう。走ると虫は逃げやすい';
  }

  function renderRightCards() {
    PERIOD_ORDER.forEach((p) => {
      const card = rightCards[p];
      if (!card) return;
      card.classList.toggle('current', p === state.period);
      const grid = card.querySelector('.mini-grid');
      if (grid.childElementCount) return; // 一度だけ生成
      SPECIES_BY_PERIOD[p].forEach((spec) => {
        const cell = document.createElement('canvas');
        cell.width = 40; cell.height = 40;
        cell.className = 'mini-cell';
        grid.appendChild(cell);
      });
    });
    // 発見状態に応じて塗り直し（毎フレームは重いので捕獲時のみでも良いが軽量なので許容）
    PERIOD_ORDER.forEach((p) => {
      const card = rightCards[p];
      const grid = card.querySelector('.mini-grid');
      SPECIES_BY_PERIOD[p].forEach((spec, i) => {
        const cell = grid.children[i];
        if (!cell) return;
        const cctx = cell.getContext('2d');
        cctx.clearRect(0, 0, 40, 40);
        const found = !!book[spec.id];
        cctx.save();
        cctx.translate(20, 24);
        cctx.scale(1.3, 1.3);
        if (found) {
          drawBug(cctx, spec, 0, 0, 0, state.t, i);
        } else {
          cctx.globalAlpha = 0.35;
          cctx.fillStyle = '#8a8a8a';
          cctx.beginPath(); cctx.arc(0, 0, 7, 0, Math.PI * 2); cctx.fill();
        }
        cctx.restore();
      });
    });
  }

  function renderBook() {
    const list = state.bookTab === 'all' ? SPECIES : SPECIES_BY_PERIOD[state.bookTab];
    bookGrid.innerHTML = '';
    list.forEach((spec) => {
      const n = book[spec.id] || 0;
      const cell = document.createElement('div');
      cell.className = 'book-cell' + (n ? ' found' : '');
      const cvs = document.createElement('canvas');
      cvs.width = 56; cvs.height = 56;
      const cctx = cvs.getContext('2d');
      cctx.save(); cctx.translate(28, 32); cctx.scale(1.7, 1.7);
      if (n) drawBug(cctx, spec, 0, 0, 0, state.t, 0);
      else { cctx.globalAlpha = 0.3; cctx.fillStyle = '#8a8a8a'; cctx.font = '18px sans-serif'; cctx.textAlign = 'center'; cctx.fillText('?', 0, 4); }
      cctx.restore();
      const stars = Math.min(5, n);
      cell.appendChild(cvs);
      const nameEl = document.createElement('b');
      nameEl.textContent = n ? spec.name : '？？？';
      cell.appendChild(nameEl);
      const starEl = document.createElement('small');
      starEl.textContent = n ? '★'.repeat(stars) + '☆'.repeat(5 - stars) : '－－－－－';
      cell.appendChild(starEl);
      bookGrid.appendChild(cell);
    });
    const found = uniqueDiscovered();
    bookStatus.innerHTML = found >= TOTAL_SPECIES
      ? `<b>${found} / ${TOTAL_SPECIES}</b> 🏆 コンプリート！すべてのむしを見つけた！`
      : `発見したむし <b>${found} / ${TOTAL_SPECIES}</b> 種類`;
  }

  bookTabs.forEach((btn) => btn.addEventListener('click', () => {
    bookTabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.bookTab = btn.dataset.tab;
    renderBook();
  }));

  Object.entries(rightCards).forEach(([p, card]) => {
    if (!card) return;
    card.addEventListener('click', () => {
      state.bookTab = p;
      bookTabs.forEach((b) => b.classList.toggle('active', b.dataset.tab === p));
      openBook();
    });
  });

  function openBook() { bookOverlay.classList.add('open'); renderBook(); }
  bookBtn.addEventListener('click', openBook);
  bookClose.addEventListener('click', () => bookOverlay.classList.remove('open'));

  function renderBag() {
    bagList.innerHTML = '';
    const caughtIds = Object.keys(book).filter((k) => book[k] > 0).sort((a, b) => book[b] - book[a]);
    if (!caughtIds.length) {
      bagList.innerHTML = '<p class="bag-empty">まだ虫かごは空っぽ。網を振って捕まえよう。</p>';
      return;
    }
    caughtIds.forEach((id) => {
      const spec = SPECIES_BY_ID[id];
      const row = document.createElement('div');
      row.className = 'bag-row';
      const cvs = document.createElement('canvas'); cvs.width = 40; cvs.height = 40;
      const cctx = cvs.getContext('2d');
      cctx.save(); cctx.translate(20, 22); cctx.scale(1.3, 1.3);
      drawBug(cctx, spec, 0, 0, 0, state.t, 0);
      cctx.restore();
      row.appendChild(cvs);
      const label = document.createElement('span');
      label.textContent = spec.name;
      row.appendChild(label);
      const count = document.createElement('b');
      count.textContent = `×${book[id]}`;
      row.appendChild(count);
      bagList.appendChild(row);
    });
  }
  bagBtn.addEventListener('click', () => { bagOverlay.classList.add('open'); renderBag(); });
  bagClose.addEventListener('click', () => bagOverlay.classList.remove('open'));

  menuBtn.addEventListener('click', () => menuOverlay.classList.add('open'));
  menuClose.addEventListener('click', () => menuOverlay.classList.remove('open'));
  skipTimeBtn.addEventListener('click', () => { state.gameHour = (state.gameHour + 5) % 24; menuOverlay.classList.remove('open'); });
  resetBtn.addEventListener('click', () => {
    if (!confirm('図鑑の記録を消してもよいですか？')) return;
    book = {}; saveBook(); state.totalCatches = 0; syncHud(); menuOverlay.classList.remove('open');
  });

  function updateMute() {
    muteBtn.textContent = muted ? '🔇' : '♪';
    muteBtn.classList.toggle('is-muted', muted);
  }
  muteBtn.addEventListener('click', () => { muted = !muted; localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); updateMute(); });

  function showClear() {
    clearOverlay.classList.add('open');
  }
  clearContinueBtn.addEventListener('click', () => { clearOverlay.classList.remove('open'); openBook(); });

  catchCard.addEventListener('click', () => catchCard.classList.remove('show'));

  // ---------- ループ ----------
  let lastTs = 0;
  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    dt = Math.min(dt, 0.05);
    lastTs = ts;
    state.t = ts;

    if (state.running) {
      updatePlayer(dt);
      updateInsects(dt);
      updateClock(dt);
      if (state.messageT > 0) { state.messageT -= dt; if (state.messageT <= 0) state.message = ''; }
      state.badges.forEach((b) => (b.t += dt));
      state.badges = state.badges.filter((b) => b.t < 1.3);
      render();
      syncHud();
    }
    requestAnimationFrame(frame);
  }

  function beginGame() {
    if (state.running) return;
    unlockAudio();
    startOverlay.classList.remove('open');
    state.running = true;
    spawnPeriodInsects();
    setMessage('近づいて正面で網を振ろう', 3);
  }
  startBtn.addEventListener('click', beginGame);

  // ---------- レスポンシブ：狭幅ではスティック表示 ----------
  function applyLayoutMode() {
    const narrow = window.innerWidth < 1100;
    document.body.classList.toggle('narrow', narrow);
  }
  window.addEventListener('resize', applyLayoutMode);
  applyLayoutMode();

  // ---------- アクションプレビュー（左パネル） ----------
  function drawActionPreviews() {
    const poses = {
      idle: { pose: 'idle', swingU: 0.5 },
      walk: { pose: 'walk', swingU: 0.5 },
      run: { pose: 'run', swingU: 0.5 },
      windup: { pose: 'windup', swingU: 0 },
      swing: { pose: 'swing', swingU: 0.6 },
      caught: { pose: 'caught', swingU: 1 }
    };
    Object.entries(actionIcons).forEach(([key, el]) => {
      if (!el) return;
      const cvs = el.querySelector('canvas');
      if (!cvs) return;
      const c = cvs.getContext('2d');
      c.clearRect(0, 0, cvs.width, cvs.height);
      drawPlayer(c, cvs.width / 2, cvs.height / 2 + 8, -Math.PI / 2, poses[key].pose, 0, { scale: 1.1, swingU: poses[key].swingU });
    });
  }

  // ---------- 初期化 ----------
  updateMute();
  spawnPeriodInsects();
  drawActionPreviews();
  syncHud();
  requestAnimationFrame(frame);
})();
