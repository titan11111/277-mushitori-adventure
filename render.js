// render.js — 虫・背景・プレイヤーの描画関数

function lerp(a, b, t) { return a + (b - a) * t; }

function drawBackground(c, w, h, period, t) {
  const P = PERIODS[period];
  const sky = c.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, P.sky[0]);
  sky.addColorStop(1, P.sky[1]);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h * 0.72);

  // 太陽/月
  const cx = w * (period === 'evening' ? 0.18 : period === 'night' ? 0.8 : 0.78);
  const cy = h * 0.14;
  c.save();
  c.globalAlpha = 0.9;
  c.fillStyle = period === 'night' ? '#eef4d8' : '#fff1a0';
  c.beginPath(); c.arc(cx, cy, period === 'night' ? 26 : 34, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.25;
  c.beginPath(); c.arc(cx, cy, period === 'night' ? 44 : 58, 0, Math.PI * 2); c.fill();
  c.restore();

  if (period === 'night') {
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 173.3) % w;
      const sy = (i * 97.7) % (h * 0.5);
      c.globalAlpha = 0.3 + ((i * 37) % 60) / 100;
      c.fillRect(sx, sy, 1.6, 1.6);
    }
    c.globalAlpha = 1;
  }

  // 遠景の山
  c.fillStyle = P.hill2;
  c.beginPath();
  c.moveTo(0, h * 0.5);
  for (let x = 0; x <= w; x += 40) c.lineTo(x, h * 0.5 - Math.sin(x * 0.004 + 1.4) * 22 - 18);
  c.lineTo(w, h * 0.72); c.lineTo(0, h * 0.72); c.closePath(); c.fill();

  c.fillStyle = P.hill;
  c.beginPath();
  c.moveTo(0, h * 0.58);
  for (let x = 0; x <= w; x += 36) c.lineTo(x, h * 0.58 - Math.sin(x * 0.006 + 4) * 16 - 10);
  c.lineTo(w, h * 0.72); c.lineTo(0, h * 0.72); c.closePath(); c.fill();

  // 地面
  const g = c.createLinearGradient(0, h * 0.62, 0, h);
  g.addColorStop(0, P.ground[0]);
  g.addColorStop(1, P.ground[1]);
  c.fillStyle = g;
  c.fillRect(0, h * 0.66, w, h * 0.34);

  if (P.accent) { c.fillStyle = P.accent; c.fillRect(0, 0, w, h); }
}

function drawPond(c, x, y, rx, ry, period) {
  c.save();
  c.globalAlpha = 0.85;
  c.fillStyle = period === 'night' ? '#1c3450' : '#3f7ea0';
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(x, y, rx * 0.6, ry * 0.5, 0, 0.3, 2.6); c.stroke();
  c.restore();
}

function drawTree(c, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.fillStyle = 'rgba(10,20,10,0.2)';
  c.beginPath(); c.ellipse(0, 8, 34, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#6a4328';
  c.fillRect(-5, -34, 10, 40);
  c.fillStyle = '#1e4a30';
  c.beginPath(); c.arc(-14, -40, 22, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2f6a42';
  c.beginPath(); c.arc(12, -46, 26, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3d8650';
  c.beginPath(); c.arc(0, -60, 20, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawFlowerPatch(c, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const cols = ['#fff', '#ffd8ea', '#fff2a0'];
  for (let i = 0; i < 6; i++) {
    const fx = Math.sin(i * 2.1) * 26;
    const fy = Math.cos(i * 1.7) * 10;
    c.fillStyle = 'rgba(30,70,30,0.5)';
    c.fillRect(fx - 1, fy, 2, 10);
    c.fillStyle = cols[i % cols.length];
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      c.beginPath(); c.ellipse(fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 2.6, 1.7, a, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#f0c23a';
    c.beginPath(); c.arc(fx, fy, 1.6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

function drawGrassTuft(c, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.strokeStyle = 'rgba(20,50,20,0.55)';
  c.lineWidth = 2.4;
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(i * 4, 6);
    c.quadraticCurveTo(i * 4 + i, -10, i * 3, -18);
    c.stroke();
  }
  c.restore();
}

// ---- 虫の描画（種のtypeで分岐。041-mushi系のベクター描画を継承・拡張） ----
function drawBug(c, spec, x, y, rot, t, phase) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  const col = spec.color;
  const k = spec.mark || '#1a1a1a';
  const flap = 0.5 + Math.abs(Math.sin(t * 0.014 + (phase || 0))) * 0.85;
  const type = spec.type;
  c.lineJoin = 'round'; c.lineCap = 'round';

  if (type === 'butterfly' || type === 'moth') {
    c.fillStyle = col; c.strokeStyle = k; c.lineWidth = 1.4;
    const lift = 6 + 9 * flap;
    c.beginPath();
    c.moveTo(1, -2); c.quadraticCurveTo(-20, -lift, -15, 8); c.quadraticCurveTo(-5, 9, 1, 4); c.closePath();
    c.moveTo(-1, -2); c.quadraticCurveTo(20, -lift, 15, 8); c.quadraticCurveTo(5, 9, -1, 4); c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = k;
    c.beginPath(); c.arc(-8, 0, 1.8, 0, Math.PI * 2); c.arc(8, 0, 1.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a3028'; c.fillRect(-1.2, -8, 2.4, 16);
  } else if (type === 'dragonfly') {
    c.fillStyle = 'rgba(235,255,250,0.65)'; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.8;
    c.beginPath();
    c.ellipse(-12, -5, 13, 3.4, 0.26, 0, Math.PI * 2);
    c.ellipse(12, -5, 13, 3.4, -0.26, 0, Math.PI * 2);
    c.ellipse(-11, 4, 11, 2.8, -0.2, 0, Math.PI * 2);
    c.ellipse(11, 4, 11, 2.8, 0.2, 0, Math.PI * 2);
    c.fill(); c.stroke();
    c.strokeStyle = col; c.lineWidth = 3.6;
    c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 15); c.stroke();
    c.fillStyle = k; c.beginPath(); c.arc(0, -10, 3.2, 0, Math.PI * 2); c.fill();
  } else if (type === 'bee') {
    c.fillStyle = 'rgba(245,252,255,0.8)';
    c.beginPath(); c.ellipse(-8, -6, 7, 4, -0.26, 0, Math.PI * 2); c.ellipse(8, -6, 7, 4, 0.26, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 1, 6.4, 9, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = k; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-5.4, -2); c.lineTo(5.4, -2); c.moveTo(-5.4, 4); c.lineTo(5.4, 4); c.stroke();
    c.fillStyle = k; c.beginPath(); c.arc(0, -9, 3, 0, Math.PI * 2); c.fill();
  } else if (type === 'firefly') {
    c.fillStyle = col;
    c.globalAlpha = 0.22; c.beginPath(); c.arc(0, 6, 16, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.55; c.beginPath(); c.arc(0, 6, 8, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1; c.fillStyle = k; c.beginPath(); c.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 6, 3.6, 4, 0, 0, Math.PI * 2); c.fill();
  } else if (type === 'cicada') {
    c.fillStyle = 'rgba(225,238,220,0.78)';
    c.beginPath(); c.ellipse(-8, 3, 9, 13, -0.1, 0, Math.PI * 2); c.ellipse(8, 3, 9, 13, 0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 1, 4.6, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = k; c.beginPath(); c.arc(0, -10, 3.4, 0, Math.PI * 2); c.fill();
  } else if (type === 'caterpillar') {
    c.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.ellipse(-9 + i * 6, Math.sin(t * 0.006 + i) * 1.2, 4.2, 3.6, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = k; c.beginPath(); c.arc(-11, 0, 2.4, 0, Math.PI * 2); c.fill();
  } else if (type === 'hopper' || type === 'cricket' || type === 'mantis') {
    c.strokeStyle = col; c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-2, 3); c.lineTo(-12, 11); c.moveTo(2, 3); c.lineTo(12, 11);
    if (type !== 'hopper') { c.moveTo(-2, -4); c.lineTo(-9, -12); c.moveTo(2, -4); c.lineTo(9, -12); }
    c.stroke();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 3.8, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = k; c.beginPath(); c.arc(0, -9, 2.8, 0, Math.PI * 2); c.fill();
    if (type === 'mantis') {
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-2, -2); c.lineTo(-11, -1); c.moveTo(2, -2); c.lineTo(11, -1); c.stroke();
    }
  } else if (type === 'ladybeetle') {
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 2, 7, 8, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = k; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -5); c.lineTo(0, 10); c.stroke();
    c.fillStyle = k;
    c.beginPath(); c.arc(-3, 0, 1.3, 0, Math.PI * 2); c.arc(3, 3, 1.3, 0, Math.PI * 2); c.arc(-2.5, 6, 1.3, 0, Math.PI * 2); c.arc(2.5, -2, 1.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(0, -7, 3.4, 0, Math.PI * 2); c.fill();
  } else {
    // stag / rhinoceros / longhorn / jewelbeetle / fallback
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 3, 8, 11, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = k; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 13); c.stroke();
    c.fillStyle = 'rgba(255,255,230,0.26)';
    c.beginPath(); c.ellipse(-2.6, 2, 3, 5.4, -0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = k; c.beginPath(); c.arc(0, -8, 3.6, 0, Math.PI * 2); c.fill();
    if (type === 'stag') {
      c.strokeStyle = k; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-2, -10); c.quadraticCurveTo(-11, -20, -8, -7); c.moveTo(2, -10); c.quadraticCurveTo(11, -20, 8, -7); c.stroke();
    } else if (type === 'rhinoceros') {
      c.fillStyle = col; c.beginPath(); c.moveTo(1, -8); c.quadraticCurveTo(9, -22, 2, -8); c.fill();
    } else if (type === 'longhorn') {
      c.strokeStyle = k; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(-2, -10); c.quadraticCurveTo(-14, -22, -16, -7); c.moveTo(2, -10); c.quadraticCurveTo(14, -22, 16, -7); c.stroke();
    } else if (type === 'jewelbeetle') {
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath(); c.ellipse(0, 1, 2, 7, 0, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
}

// ---- プレイヤー（チビキャラ）描画 ----
// pose: 'idle' | 'walk' | 'run' | 'windup' | 'swing' | 'caught'
function drawPlayer(c, x, y, facing, pose, t, opts) {
  opts = opts || {};
  const scale = opts.scale || 1;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const bob = (pose === 'walk') ? Math.sin(t * 0.012) * 2.4 : (pose === 'run') ? Math.sin(t * 0.02) * 4 : 0;
  c.translate(0, bob);

  const faceRight = Math.cos(facing) >= 0;
  const dir = faceRight ? 1 : -1;

  // 影
  c.fillStyle = 'rgba(20,30,15,0.3)';
  c.beginPath(); c.ellipse(0, 30, 14, 4.5, 0, 0, Math.PI * 2); c.fill();

  c.save();
  c.scale(dir, 1);

  // 脚
  const stride = (pose === 'walk') ? Math.sin(t * 0.012) * 8 : (pose === 'run') ? Math.sin(t * 0.02) * 12 : 0;
  c.strokeStyle = '#5a4330'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3, 14); c.lineTo(-3 + stride * 0.3, 28); c.stroke();
  c.beginPath(); c.moveTo(3, 14); c.lineTo(3 - stride * 0.3, 28); c.stroke();

  // 体
  c.fillStyle = '#f0ead8';
  c.beginPath(); c.moveTo(-9, 4); c.lineTo(9, 4); c.lineTo(7, 16); c.lineTo(-7, 16); c.closePath(); c.fill();
  c.fillStyle = '#6a5a3a';
  c.fillRect(-9, 12, 18, 4);

  // 頭
  c.fillStyle = '#f4c9a0';
  c.beginPath(); c.arc(0, -8, 10, 0, Math.PI * 2); c.fill();
  // 帽子
  c.fillStyle = '#c9a24a';
  c.beginPath(); c.ellipse(0, -14, 12, 4, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(0, -18, 8, Math.PI, 0); c.fill();
  c.fillStyle = '#a8823a'; c.fillRect(-12, -15.5, 24, 2.4);

  // 腕＋網
  const armPivotX = 8, armPivotY = 0;
  let netAngle = -0.6;
  let netExtend = 1;
  if (pose === 'windup') netAngle = -1.5 + Math.sin(t * 0.02) * 0.05;
  else if (pose === 'swing') { netAngle = lerp(-1.5, 1.3, opts.swingU != null ? opts.swingU : 0.5); netExtend = 1.15; }
  else if (pose === 'caught') netAngle = 1.3;
  else if (pose === 'run') netAngle = -0.9 + Math.sin(t * 0.02) * 0.3;
  else if (pose === 'walk') netAngle = -0.7 + Math.sin(t * 0.012) * 0.2;

  c.save();
  c.translate(armPivotX, armPivotY);
  c.rotate(netAngle);
  c.strokeStyle = '#f4c9a0'; c.lineWidth = 4.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(14 * netExtend, 0); c.stroke();
  // 網の柄
  c.strokeStyle = '#7a5a34'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(14 * netExtend, 0); c.lineTo(30 * netExtend, 0); c.stroke();
  // 網の輪
  c.strokeStyle = '#dfe6ea'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(34 * netExtend, 0, 9, 12, 0, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(230,240,245,0.28)';
  c.beginPath(); c.ellipse(34 * netExtend, 0, 9, 12, 0, 0, Math.PI * 2); c.fill();
  c.restore();

  // 反対の腕
  c.fillStyle = '#f4c9a0';
  c.beginPath(); c.ellipse(-9, 6, 3.6, 8, 0.3, 0, Math.PI * 2); c.fill();

  // 目
  c.fillStyle = '#2a2018';
  c.beginPath(); c.arc(3.5, -8, 1.3, 0, Math.PI * 2); c.fill();

  c.restore(); // dir scale
  c.restore(); // main
}

// スイングの捕獲判定弧（デバッグ/視覚用の薄いガイド。実際の当たり判定と同じ範囲）
function drawSwingArc(c, x, y, facing, range, coneHalf) {
  c.save();
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.lineWidth = 1.5;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.arc(x, y, range, facing - coneHalf, facing + coneHalf);
  c.stroke();
  c.restore();
}
