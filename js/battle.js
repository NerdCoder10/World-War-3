// Battle scenes: a side-on view of one day's fighting in a country at war. Each icon is one unit of
// its kind (a tank, an armoured vehicle, a gun, an infantry squad, a jet, a helicopter, an
// anti-aircraft launcher), scaled so a side shows at most 14 of each: the legend says how many real
// units an icon stands for. Artillery fires arcing shells at the enemy line, anti-aircraft guns and
// missiles fire at aircraft, jets make strafing passes, and icons are knocked out in proportion to
// the day's real losses (the same odds the battle round uses). The ground follows the country's
// terrain and weather, the sky its day or night. Positions and timing are fixed by the battle, not
// rolled, so the same battle always plays the same way.
(() => {
  const KINDS = [["tanks", "tank"], ["afv", "armoured vehicle"], ["arty", "artillery piece"], ["troops", "infantry squad"], ["fighters", "jet"], ["helis", "helicopter"], ["aa", "anti-aircraft launcher"]];
  let open = null;
  const hashRand = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function tokens(units, aa) {
    const out = {};
    KINDS.forEach(([k]) => {
      const n = k === "aa" ? aa : k === "troops" ? (units.troops || 0) * 1000 : units[k] || 0;
      if (n < 1) { out[k] = { n: 0, per: 0 }; return; }
      const per = Math.max(1, Math.ceil(n / 14));
      out[k] = { n: Math.min(14, Math.max(1, Math.round(n / per))), per, real: n };
    });
    return out;
  }
  // Silhouettes, side view, facing right (mirrored for the defender).
  function drawUnit(ctx, k, x, y, s, col, dark, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = 1 / s;
    const P = pts => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    if (k === "tanks") { P([[-12, 0], [12, 0], [14, -4], [-14, -4]]); P([[-6, -4], [6, -4], [5, -8], [-5, -8]]); ctx.fillRect(4, -7, 13, 1.6); ctx.fillStyle = dark; for (let i = -10; i <= 10; i += 4) { ctx.beginPath(); ctx.arc(i, 1, 1.6, 0, 7); ctx.fill(); } }
    else if (k === "afv") { P([[-11, 0], [11, 0], [12, -6], [-9, -7], [-11, -4]]); ctx.fillRect(1, -9, 4, 2.4); ctx.fillRect(4, -8.4, 7, 1); ctx.fillStyle = dark; [-7, -2, 3, 8].forEach(i => { ctx.beginPath(); ctx.arc(i, 1, 2, 0, 7); ctx.fill(); }); }
    else if (k === "arty") { P([[-9, 0], [7, 0], [7, -4], [-9, -4]]); ctx.save(); ctx.translate(2, -5); ctx.rotate(-0.55); ctx.fillRect(0, -1, 18, 2.2); ctx.restore(); ctx.fillStyle = dark; [-6, 4].forEach(i => { ctx.beginPath(); ctx.arc(i, 1, 2.2, 0, 7); ctx.fill(); }); }
    else if (k === "troops") { for (let j = 0; j < 3; j++) { const ox = j * 5 - 5, step = Math.sin(t / 120 + j) * 1.2; ctx.beginPath(); ctx.arc(ox, -10, 1.6, 0, 7); ctx.fill(); ctx.fillRect(ox - 1, -8.5, 2, 5); ctx.fillRect(ox - 1 + step * 0.3, -3.5, 1, 3.5); ctx.fillRect(ox + 0.2 - step * 0.3, -3.5, 1, 3.5); ctx.fillRect(ox, -7.5, 5, 0.9); } }
    else if (k === "fighters") { P([[14, 0], [6, -1.6], [-6, -1.6], [-10, -6], [-12, -6], [-11, -1], [-13, 0], [-11, 1.6], [6, 1.8]]); P([[2, 0], [-4, 0], [-8, 3.5], [-5, 3.5]]); }
    else if (k === "helis") { P([[10, -2], [4, -5], [-4, -5], [-6, -2], [-16, -1.5], [-16, -3], [-18, -3], [-18, 1], [-6, 1], [-2, 3], [6, 3]]); ctx.fillStyle = dark; const r = 14 * Math.abs(Math.sin(t / 40)); ctx.fillRect(-r, -7, 2 * r, 1.1); ctx.fillRect(-1, -7, 2, 2); }
    else if (k === "aa") { P([[-10, 0], [10, 0], [10, -5], [-10, -5]]); ctx.save(); ctx.translate(-2, -6); ctx.rotate(-0.8); ctx.fillRect(0, -2.5, 12, 5); ctx.restore(); ctx.fillStyle = dark; [-7, 0, 7].forEach(i => { ctx.beginPath(); ctx.arc(i, 1, 2, 0, 7); ctx.fill(); }); }
    ctx.restore();
  }
  window.openBattle = info => {
    if (open) open.close();
    const wrap = document.createElement("div");
    wrap.className = "battle-overlay";
    wrap.innerHTML = `<div class="battle-box"><div class="battle-head"><b></b><button class="battle-x" aria-label="Close">×</button></div><canvas></canvas><div class="battle-legend"></div></div>`;
    document.body.appendChild(wrap);
    const cv = wrap.querySelector("canvas"), ctx = cv.getContext("2d"), DPR = window.devicePixelRatio || 1;
    const W = Math.min(980, window.innerWidth - 32), H = Math.round(W * 0.52);
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px";
    wrap.querySelector(".battle-head b").innerHTML = info.title;
    const A = tokens(info.att.units, info.att.aa), D = tokens(info.def.units, info.def.aa);
    const rnd = hashRand(info.seed);
    const ground = H * 0.62;
    // Place icons: artillery and AA at the back, armour in the middle, infantry in front; aircraft above.
    const place = (T, side) => {
      const list = [], dir = side === "att" ? 1 : -1, x0 = side === "att" ? W * 0.06 : W * 0.94;
      const rows = { arty: 0.02, aa: 0.08, afv: 0.17, tanks: 0.25, troops: 0.33 };
      Object.entries(rows).forEach(([k, depth]) => {
        for (let i = 0; i < T[k].n; i++) list.push({ k, x: x0 + dir * (depth + 0.012 * (i % 3)) * W, y: ground + 8 + (i / Math.max(1, T[k].n - 1 || 1)) * (H - ground - 26), alive: true, side });
      });
      for (let i = 0; i < T.fighters.n; i++) list.push({ k: "fighters", air: true, lane: 0.1 + 0.05 * (i % 5), phase: rnd() * 1, alive: true, side });
      for (let i = 0; i < T.helis.n; i++) list.push({ k: "helis", heli: true, x: x0 + dir * (0.06 + 0.075 * (i % 5)) * W, y: ground - 46 - 34 * Math.floor(i / 5) - 9 * (i % 2), alive: true, side });
      return list;
    };
    const units = place(A, "att").concat(place(D, "def"));
    // Losses: the share of each side's icons knocked out over the scene, from the day's odds.
    const kill = (side, frac) => { const mine = units.filter(u => u.side === side), n = Math.round(mine.length * frac); mine.map(u => [u, rnd()]).sort((a, b) => a[1] - b[1]).slice(0, n).forEach(([u], i) => (u.dieAt = 2500 + (i / Math.max(1, n)) * 8500)); };
    kill("att", info.lossAtt); kill("def", info.lossDef);
    const shells = [], booms = [], tracers = [];
    const skyDay = info.night ? ["#0b1430", "#1a2550"] : ["#6fa8d6", "#bcd8ec"], groundCol = info.ground;
    const t0 = performance.now();
    let raf = 0;
    const colOf = side => (side === "att" ? [info.att.col, info.att.dark] : [info.def.col, info.def.dark]);
    function frame(now) {
      const t = (now - t0) % 12000, loop = Math.floor((now - t0) / 12000);
      if (t < 30) { units.forEach(u => (u.alive = true)); shells.length = 0; booms.length = 0; }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, ground); g.addColorStop(0, skyDay[0]); g.addColorStop(1, skyDay[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, ground);
      ctx.fillStyle = groundCol; ctx.fillRect(0, ground, W, H - ground);
      ctx.fillStyle = "rgba(0,0,0,0.12)"; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, ground + ((i * 53) % (H - ground)), 30, 2);
      if (info.weather) { ctx.fillStyle = info.weather.fill; for (let i = 0; i < 120; i++) { const x = (i * 83 + t * info.weather.dx) % W, y = (i * 47 + t * info.weather.dy) % H; ctx.fillRect(x, y, info.weather.w, info.weather.h); } }
      // Deaths at their time, with an explosion.
      units.forEach(u => { if (u.alive && u.dieAt != null && t >= u.dieAt) { u.alive = false; booms.push({ x: u.air ? u.cx : u.x, y: u.air ? u.cy : u.y, t, big: true }); } });
      // Artillery fire: each live gun fires on its own beat at the enemy front.
      units.filter(u => u.k === "arty" && u.alive).forEach((u, i) => {
        const beat = 1100 + (i % 5) * 170;
        if (Math.floor(t / beat) !== u.lastShot) {
          u.lastShot = Math.floor(t / beat);
          const foes = units.filter(v => v.side !== u.side && !v.air && !v.heli && v.alive);
          const tgt = foes.length ? foes[(u.lastShot + i) % foes.length] : null;
          shells.push({ x0: u.x, y0: u.y - 8, x1: tgt ? tgt.x + (((i * 37) % 30) - 15) : W / 2, y1: tgt ? tgt.y : ground + 20, t, dur: 1200 });
        }
      });
      // AA fire at the nearest enemy aircraft.
      units.filter(u => u.k === "aa" && u.alive).forEach((u, i) => {
        const air = units.filter(v => v.side !== u.side && (v.air || v.heli) && v.alive && v.cx != null);
        if (air.length && (t + i * 211) % 700 < 40) { const a = air[i % air.length]; tracers.push({ x0: u.x, y0: u.y - 10, x1: a.cx, y1: a.cy, t, missile: i % 2 === 0 }); }
      });
      // Ground units, gently advancing (attacker) or holding (defender).
      units.filter(u => !u.air && !u.heli).forEach(u => {
        if (!u.alive) { ctx.globalAlpha = 0.5; ctx.fillStyle = "#222"; ctx.beginPath(); ctx.ellipse(u.x, u.y + 1, 8, 2.5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; return; }
        const adv = u.side === "att" && u.k !== "arty" && u.k !== "aa" ? (t / 12000) * W * 0.06 : 0;
        u.x0 = u.x0 ?? u.x; u.x = u.x0 + adv;
        const [c1, c2] = colOf(u.side);
        ctx.save(); if (u.side === "def") { ctx.translate(u.x, 0); ctx.scale(-1, 1); ctx.translate(-u.x, 0); }
        drawUnit(ctx, u.k, u.x, u.y, 1.1, c1, c2, now + u.x);
        ctx.restore();
      });
      // Aircraft: jets cross the sky toward the enemy and back; helicopters hover and fire.
      units.filter(u => u.air || u.heli).forEach(u => {
        if (!u.alive) return;
        const [c1, c2] = colOf(u.side), dir = u.side === "att" ? 1 : -1;
        if (u.air) { const ph = ((t / 4000) + u.phase) % 1; u.cx = u.side === "att" ? ph * (W + 80) - 40 : W + 40 - ph * (W + 80); u.cy = H * u.lane; }
        else { u.cx = u.x + Math.sin(now / 900 + u.y) * 6; u.cy = u.y + Math.sin(now / 500 + u.x) * 3; }
        ctx.save(); ctx.translate(u.cx, u.cy); if (dir < 0) ctx.scale(-1, 1);
        drawUnit(ctx, u.k, 0, 0, u.air ? 1.2 : 1.1, c1, c2, now);
        ctx.restore();
        if (u.air) { ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(u.cx - dir * 14, u.cy); ctx.lineTo(u.cx - dir * 60, u.cy); ctx.stroke(); }
        if (u.air && (t + u.lane * 9000) % 2600 < 40) { const foes = units.filter(v => v.side !== u.side && !v.air && v.alive); if (foes.length) { const f = foes[Math.floor(u.lane * 97) % foes.length]; shells.push({ x0: u.cx, y0: u.cy, x1: f.x, y1: f.y, t, dur: 500, bomb: true }); } }
      });
      // Shells in flight and their explosions.
      for (let i = shells.length - 1; i >= 0; i--) {
        const sh = shells[i], f = (t - sh.t) / sh.dur;
        if (f < 0 || f > 1) { if (f > 1) booms.push({ x: sh.x1, y: sh.y1, t }); shells.splice(i, 1); continue; }
        const x = sh.x0 + (sh.x1 - sh.x0) * f, y = sh.y0 + (sh.y1 - sh.y0) * f - (sh.bomb ? 0 : Math.sin(Math.PI * f) * H * 0.35);
        ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill();
      }
      for (let i = tracers.length - 1; i >= 0; i--) {
        const tr = tracers[i], f = (t - tr.t) / 450;
        if (f < 0 || f > 1) { tracers.splice(i, 1); continue; }
        ctx.strokeStyle = tr.missile ? "rgba(255,255,255,0.8)" : "rgba(255,190,80,0.9)"; ctx.lineWidth = tr.missile ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(tr.x0, tr.y0); ctx.lineTo(tr.x0 + (tr.x1 - tr.x0) * f, tr.y0 + (tr.y1 - tr.y0) * f); ctx.stroke();
      }
      for (let i = booms.length - 1; i >= 0; i--) {
        const b = booms[i], f = (t - b.t) / (b.big ? 900 : 600);
        if (f < 0 || f > 1) { booms.splice(i, 1); continue; }
        const r = (b.big ? 16 : 9) * (0.4 + f);
        ctx.fillStyle = `rgba(255,${Math.round(200 - 150 * f)},60,${1 - f})`; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill();
        ctx.fillStyle = `rgba(60,60,60,${0.6 * (1 - f)})`; ctx.beginPath(); ctx.arc(b.x, b.y - r, r * 0.8, 0, 7); ctx.fill();
      }
      // Side labels.
      ctx.font = "600 13px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(info.att.label, 10, 20); ctx.textAlign = "right"; ctx.fillText(info.def.label, W - 10, 20);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const legend = side => { const T = side === "att" ? A : D; return KINDS.filter(([k]) => T[k].n).map(([k, label]) => `${T[k].n} × ${label}${T[k].per > 1 ? ` <small>(each ≈ ${Math.round(T[k].real / T[k].n).toLocaleString("en-US")}${k === "troops" ? " soldiers" : ""})</small>` : ""}`).join(" · "); };
    wrap.querySelector(".battle-legend").innerHTML = `<p><b style="color:${info.att.col}">${info.att.label}</b>: ${legend("att") || "no forces in the field"}</p><p><b style="color:${info.def.col}">${info.def.label}</b>: ${legend("def") || "no forces in the field"}</p><p class="hint">${info.summary}</p>`;
    const close = () => { cancelAnimationFrame(raf); wrap.remove(); open = null; };
    wrap.querySelector(".battle-x").onclick = close;
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    open = { close };
  };
})();
