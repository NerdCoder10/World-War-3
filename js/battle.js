// Battle scenes: a side-on view of one day's fighting in a country at war, on land, at sea or in
// the air. Each icon is one unit of its kind, scaled so a side shows at most 14 of each: the legend
// says how many real units an icon stands for. Icons are knocked out in proportion to the day's real
// losses (the same odds the battle round uses); positions and timing are fixed by the battle, so the
// same battle always plays the same way.
//   Land: tanks, armoured vehicles, guns, infantry squads, jets, helicopters and anti-aircraft
//         launchers; artillery arcs, AA tracers and missiles, strafing jets.
//   Sea:  warships, carriers launching jets, submarines below the surface; anti-ship missiles
//         skimming the waves, torpedoes, close-in gun tracers, burning and sinking ships.
//   Air:  fighters fight mostly beyond visual range, holding patrol lines and trading lofted
//         long-range missiles; only late, and less between modern air forces, do survivors merge
//         into a within-visual-range fight. Bombers and drones strike ground targets, and
//         surface-to-air missiles climb from below.
// Units down for maintenance (mission-capable rate and war wear) sit out the fight, parked and
// grey; better kit (each model's real abilities, js/models.js) fires faster.
// The ground follows the country's terrain and weather, the sky its day or night.
(() => {
  const LABEL = { tanks: "tank", afv: "armoured vehicle", arty: "artillery piece", troops: "infantry squad", fighters: "fighter", aircraft: "bomber or drone", helis: "helicopter", aa: "anti-aircraft launcher", ships: "warship", subs: "submarine", carriers: "carrier" };
  const MODE_KINDS = { land: ["tanks", "afv", "arty", "troops", "fighters", "helis", "aa"], sea: ["carriers", "ships", "subs", "fighters"], air: ["fighters", "aircraft", "helis", "aa"] };
  let open = null;
  const hashRand = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function tokens(units, aa, kinds) {
    const out = {};
    kinds.forEach(k => {
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
    const wheel = (i, r) => { ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(i, 1, r, 0, 7); ctx.fill(); ctx.fillStyle = col; };
    if (k === "tanks") { P([[-12, 0], [12, 0], [14, -4], [-14, -4]]); P([[-6, -4], [6, -4], [5, -8], [-5, -8]]); ctx.fillRect(4, -7, 13, 1.6); for (let i = -10; i <= 10; i += 4) wheel(i, 1.6); }
    else if (k === "afv") { P([[-11, 0], [11, 0], [12, -6], [-9, -7], [-11, -4]]); ctx.fillRect(1, -9, 4, 2.4); ctx.fillRect(4, -8.4, 7, 1); [-7, -2, 3, 8].forEach(i => wheel(i, 2)); }
    else if (k === "arty") { P([[-9, 0], [7, 0], [7, -4], [-9, -4]]); ctx.save(); ctx.translate(2, -5); ctx.rotate(-0.55); ctx.fillRect(0, -1, 18, 2.2); ctx.restore(); [-6, 4].forEach(i => wheel(i, 2.2)); }
    else if (k === "troops") { for (let j = 0; j < 3; j++) { const ox = j * 5 - 5, step = Math.sin(t / 120 + j) * 1.2; ctx.beginPath(); ctx.arc(ox, -10, 1.6, 0, 7); ctx.fill(); ctx.fillRect(ox - 1, -8.5, 2, 5); ctx.fillRect(ox - 1 + step * 0.3, -3.5, 1, 3.5); ctx.fillRect(ox + 0.2 - step * 0.3, -3.5, 1, 3.5); ctx.fillRect(ox, -7.5, 5, 0.9); } }
    else if (k === "fighters") { P([[14, 0], [6, -1.6], [-6, -1.6], [-10, -6], [-12, -6], [-11, -1], [-13, 0], [-11, 1.6], [6, 1.8]]); P([[2, 0], [-4, 0], [-8, 3.5], [-5, 3.5]]); }
    else if (k === "aircraft") { P([[18, 0], [12, -2.4], [-12, -2.4], [-16, -8], [-19, -8], [-17, -1.5], [-19, 0], [-17, 2.4], [12, 2.6]]); P([[4, 0], [-6, 0], [-12, 6], [-8, 6]]); ctx.fillStyle = dark; ctx.fillRect(-2, 2, 4, 1.6); ctx.fillRect(-8, 3.5, 4, 1.6); }
    else if (k === "helis") { P([[10, -2], [4, -5], [-4, -5], [-6, -2], [-16, -1.5], [-16, -3], [-18, -3], [-18, 1], [-6, 1], [-2, 3], [6, 3]]); ctx.fillStyle = dark; const r = 14 * Math.abs(Math.sin(t / 40)); ctx.fillRect(-r, -7, 2 * r, 1.1); ctx.fillRect(-1, -7, 2, 2); }
    else if (k === "aa") { P([[-10, 0], [10, 0], [10, -5], [-10, -5]]); ctx.save(); ctx.translate(-2, -6); ctx.rotate(-0.8); ctx.fillRect(0, -2.5, 12, 5); ctx.restore(); [-7, 0, 7].forEach(i => wheel(i, 2)); }
    else if (k === "ships") { P([[26, -2], [18, 4], [-20, 4], [-24, -2]]); P([[-8, -2], [6, -2], [5, -9], [-6, -9]]); P([[-2, -9], [2, -9], [1, -15], [-1, -15]]); ctx.fillRect(10, -4.5, 11, 1.4); ctx.fillStyle = dark; ctx.fillRect(9, -5.5, 4, 3); }
    else if (k === "carriers") { P([[34, -4], [30, 5], [-30, 5], [-34, -4]]); ctx.fillStyle = dark; ctx.fillRect(-34, -5.5, 68, 1.6); ctx.fillStyle = col; P([[6, -5], [14, -5], [13, -14], [8, -14]]); ctx.fillStyle = dark; for (let i = -26; i < 0; i += 8) ctx.fillRect(i, -7.5, 5, 2); }
    else if (k === "subs") { ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(0, 0, 24, 3.6, 0, 0, 7); ctx.fill(); ctx.stroke(); P([[-2, -3], [6, -3], [5, -8], [-1, -8]]); P([[-24, 0], [-28, -4], [-28, 4]]); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  // One scene (land, sea or air) on the canvas, until it is switched or closed.
  function scene(cv, W, H, DPR, info, mode) {
    const ctx = cv.getContext("2d"), kinds = MODE_KINDS[mode];
    const A = tokens(info.att.units, mode === "sea" ? 0 : info.att.aa, kinds), D = tokens(info.def.units, mode === "sea" ? 0 : info.def.aa, kinds);
    const rnd = hashRand(info.seed + mode.length * 7919);
    const horizon = mode === "sea" ? H * 0.46 : mode === "air" ? H * 0.86 : H * 0.62;
    const units = [];
    const place = (T, side) => {
      const dir = side === "att" ? 1 : -1, x0 = side === "att" ? W * 0.06 : W * 0.94;
      const add = (k, n, f) => { for (let i = 0; i < n; i++) units.push({ k, side, alive: true, ...f(i, n) }); };
      if (mode === "land") {
        const rows = { arty: 0.02, aa: 0.08, afv: 0.17, tanks: 0.25, troops: 0.33 };
        Object.entries(rows).forEach(([k, depth]) => add(k, T[k].n, (i, n) => ({ x: x0 + dir * (depth + 0.012 * (i % 3)) * W, y: horizon + 8 + (i / Math.max(1, n - 1 || 1)) * (H - horizon - 26) })));
        add("fighters", T.fighters.n, i => ({ air: true, lane: 0.1 + 0.05 * (i % 5), phase: rnd() }));
        add("helis", T.helis.n, i => ({ heli: true, x: x0 + dir * (0.06 + 0.075 * (i % 5)) * W, y: horizon - 46 - 34 * Math.floor(i / 5) - 9 * (i % 2) }));
      } else if (mode === "sea") {
        const rowY = i => horizon + 14 + (i % 3) * 22;
        add("carriers", T.carriers.n, i => ({ ship: true, x: x0 + dir * (0.07 + 0.09 * i) * W, y: horizon + 30, big: true }));
        add("ships", T.ships.n, i => ({ ship: true, x: x0 + dir * (0.05 + 0.065 * Math.floor(i / 3) + 0.02 * (i % 3)) * W, y: rowY(i) + 34 }));
        add("subs", T.subs.n, i => ({ sub: true, x: x0 + dir * (0.12 + 0.05 * i) * W, y: H * 0.86 - (i % 3) * 18, phase: rnd() }));
        add("fighters", T.fighters.n, i => ({ air: true, lane: 0.08 + 0.05 * (i % 6), phase: rnd() }));
      } else {
        add("fighters", T.fighters.n, i => ({ air: true, lane: 0.1 + 0.045 * (i % 8), phase: rnd(), dog: true }));
        add("aircraft", T.aircraft.n, i => ({ air: true, lane: 0.5 + 0.05 * (i % 5), phase: rnd(), bomber: true }));
        add("helis", T.helis.n, i => ({ heli: true, x: x0 + dir * (0.05 + 0.06 * (i % 6)) * W, y: horizon - 30 - 22 * Math.floor(i / 6) }));
        add("aa", T.aa.n, (i, n) => ({ x: x0 + dir * (0.03 + 0.05 * i) * W, y: horizon + 10 }));
      }
    };
    place(A, "att"); place(D, "def");
    // Units down for maintenance (the country's mission-capable rate, worn down further by a long
    // war) sit out the fight: parked and grey, at the back, on the airfield or alongside in port.
    const parked = [];
    ["att", "def"].forEach(side => {
      const ready = info[side].ready || {}, T = side === "att" ? A : D, dir = side === "att" ? 1 : -1, edge = side === "att" ? 0.02 : 0.98;
      let j = 0;
      kinds.forEach(k => {
        const mine = units.filter(u => u.side === side && u.k === k), down = Math.min(mine.length, Math.round(mine.length * (1 - (ready[k] ?? 1))));
        T[k].down = down;
        mine.slice(mine.length - down).forEach(u => {
          units.splice(units.indexOf(u), 1);
          if (u.air || u.heli || u.ship || u.sub) {
            if (mode === "sea" && (u.air || u.heli)) return;
            u.x = W * (edge + dir * 0.03 * (j % 6)); u.y = mode === "sea" ? horizon + 10 + 12 * (j % 3) : horizon + 10 + 8 * Math.floor(j / 6); j++;
          }
          parked.push(u);
        });
      });
    });
    const q = (u, k = u.k) => ((u.side === "att" ? info.att.q : info.def.q) || {})[k] || 1;
    const kill = (side, frac) => { const mine = units.filter(u => u.side === side), n = Math.round(mine.length * frac); mine.map(u => [u, rnd()]).sort((a, b) => a[1] - b[1]).slice(0, n).forEach(([u], i) => (u.dieAt = 2500 + (i / Math.max(1, n)) * 8500)); };
    kill("att", info.lossAtt); kill("def", info.lossDef);
    const shots = [], booms = [], tracers = [];
    const sky = info.night ? ["#0b1430", "#1a2550"] : ["#6fa8d6", "#bcd8ec"];
    const colOf = side => (side === "att" ? [info.att.col, info.att.dark] : [info.def.col, info.def.dark]);
    const t0 = performance.now();
    let raf = 0;
    const foesOf = (u, f) => units.filter(v => v.side !== u.side && v.alive && f(v));
    function frame(now) {
      const t = (now - t0) % 12000;
      if (t < 30) { units.forEach(u => { u.alive = true; u.sinkT = null; }); shots.length = 0; booms.length = 0; tracers.length = 0; }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon);
      if (mode === "sea") {
        const sg = ctx.createLinearGradient(0, horizon, 0, H); sg.addColorStop(0, info.night ? "#123049" : "#2d6e98"); sg.addColorStop(1, info.night ? "#06121d" : "#0d2f48");
        ctx.fillStyle = sg; ctx.fillRect(0, horizon, W, H - horizon);
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
        for (let i = 0; i < 26; i++) { const y = horizon + 6 + (i % 13) * 9, x = ((i * 131 + now / 30) % (W + 60)) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 3, x + 20, y); ctx.stroke(); }
        ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, H * 0.74, W, H * 0.26); // the depths where submarines run
      } else {
        ctx.fillStyle = info.ground; ctx.fillRect(0, horizon, W, H - horizon);
        ctx.fillStyle = "rgba(0,0,0,0.12)"; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, horizon + ((i * 53) % Math.max(1, H - horizon)), 30, 2);
      }
      if (mode === "air") { ctx.fillStyle = "rgba(255,255,255,0.18)"; for (let i = 0; i < 7; i++) { const x = ((i * 173 + now / 60) % (W + 200)) - 100, y = 30 + (i * 61) % (horizon * 0.6); ctx.beginPath(); ctx.ellipse(x, y, 60, 14, 0, 0, 7); ctx.fill(); } }
      if (info.weather) { ctx.fillStyle = info.weather.fill; for (let i = 0; i < 120; i++) { const x = (i * 83 + t * info.weather.dx) % W, y = (i * 47 + t * info.weather.dy) % H; ctx.fillRect(x, y, info.weather.w, info.weather.h); } }
      // Deaths at their time: explosions; ships burn and sink, aircraft fall.
      units.forEach(u => { if (u.alive && u.dieAt != null && t >= u.dieAt) { u.alive = false; u.sinkT = t; booms.push({ x: u.cx ?? u.x, y: u.cy ?? u.y, t, big: true }); } });
      // ── Fire ──
      if (mode === "land") {
        // Direct fire, faster and more often from better kit (sights, fire control, autoloaders):
        // tank guns, autocannon and anti-tank missiles from armoured vehicles, infantry small arms.
        units.filter(u => (u.k === "tanks" || u.k === "afv" || u.k === "troops") && u.alive).forEach((u, i) => {
          const beat = Math.round((u.k === "troops" ? 900 : 1900 + (i % 4) * 230) / q(u));
          if (Math.floor((t + i * 137) / beat) !== u.lastShot) {
            u.lastShot = Math.floor((t + i * 137) / beat);
            const fs = foesOf(u, v => !v.air && !v.heli), tg = fs.length ? fs[(u.lastShot + i) % fs.length] : null;
            if (tg) { const dir = u.side === "att" ? 1 : -1; tracers.push({ x0: u.x + dir * 14, y0: u.y - 6, x1: tg.x, y1: tg.y - 4, t, missile: u.k === "afv" && u.lastShot % 3 === 0 && ((u.side === "att" ? info.att.atgm : info.def.atgm) || 0) > 0.3, small: u.k === "troops" }); }
          }
        });
        units.filter(u => u.k === "arty" && u.alive).forEach((u, i) => {
          const beat = Math.round((1100 + (i % 5) * 170) / q(u));
          if (Math.floor(t / beat) !== u.lastShot) { u.lastShot = Math.floor(t / beat); const fs = foesOf(u, v => !v.air && !v.heli), tg = fs.length ? fs[(u.lastShot + i) % fs.length] : null; shots.push({ x0: u.x, y0: u.y - 8, x1: tg ? tg.x + (((i * 37) % 30) - 15) : W / 2, y1: tg ? tg.y : horizon + 20, t, dur: 1200, arc: 0.35 }); }
        });
      }
      if (mode === "sea") {
        units.filter(u => (u.k === "ships" || u.k === "carriers") && u.alive).forEach((u, i) => {
          const beat = Math.round((1500 + (i % 4) * 230) / q(u));
          if (Math.floor(t / beat) !== u.lastShot) {
            u.lastShot = Math.floor(t / beat);
            const fs = foesOf(u, v => v.ship), tg = fs.length ? fs[(u.lastShot + i) % fs.length] : null;
            if (tg && u.k === "ships") shots.push({ x0: u.x, y0: u.y - 10, x1: tg.x, y1: tg.y - 4, t, dur: 1600, arc: 0.06, missile: true });
            const air = foesOf(u, v => v.air && v.cx != null);
            if (air.length) tracers.push({ x0: u.x, y0: u.y - 12, x1: air[i % air.length].cx, y1: air[i % air.length].cy, t, missile: i % 3 === 0 });
          }
        });
        units.filter(u => u.k === "subs" && u.alive).forEach((u, i) => {
          if ((t + i * 900) % 3200 < 30) { const fs = foesOf(u, v => v.ship); if (fs.length) { const tg = fs[i % fs.length]; shots.push({ x0: u.x, y0: u.y, x1: tg.x, y1: tg.y + 6, t, dur: 2200, arc: 0, torpedo: true }); } }
        });
        units.filter(u => u.k === "carriers" && u.alive).forEach(u => { u.launch = (t % 2000) / 2000; });
      }
      if (mode === "air" || mode === "land") {
        units.filter(u => u.k === "aa" && u.alive).forEach((u, i) => {
          const air = foesOf(u, v => (v.air || v.heli) && v.cx != null);
          if (air.length && (t + i * 211) % (mode === "air" ? 1500 : 700) < 40) { const a = air[i % air.length]; tracers.push({ x0: u.x, y0: u.y - 10, x1: a.cx, y1: a.cy, t, missile: i % 2 === 0, sam: mode === "air" }); }
        });
      }
      // ── Units in maintenance ──
      parked.forEach(u => {
        ctx.save(); ctx.globalAlpha = 0.45;
        if (u.side === "def") { ctx.translate(u.x, 0); ctx.scale(-1, 1); ctx.translate(-u.x, 0); }
        drawUnit(ctx, u.k, u.x, u.y, u.k === "carriers" ? 0.7 : u.ship || u.sub ? 0.6 : u.air || u.heli ? 0.8 : 1.1, "#8a8a8a", "#3a3a3a", 0);
        ctx.restore(); ctx.fillStyle = "#f39c34"; ctx.beginPath(); ctx.arc(u.x, u.y - 12, 2.2, 0, 7); ctx.fill();
      });
      // ── Surface units ──
      units.filter(u => !u.air && !u.heli).forEach(u => {
        const [c1, c2] = colOf(u.side);
        if (!u.alive) {
          if (u.ship || u.sub) { const f = Math.min(1, (t - (u.sinkT || t)) / 3000); if (f >= 1) return; ctx.save(); ctx.globalAlpha = 1 - f * 0.7; ctx.translate(u.x, u.y + f * 26); ctx.rotate((u.side === "att" ? 1 : -1) * f * 0.5); if (u.side === "def") ctx.scale(-1, 1); drawUnit(ctx, u.k, 0, 0, u.big ? 1.15 : 1.0, "#555", "#222", now); ctx.restore(); ctx.fillStyle = `rgba(255,140,40,${0.8 - f * 0.8})`; ctx.beginPath(); ctx.arc(u.x, u.y - 8 + f * 26, 6, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(50,50,50,${0.5 - f * 0.5})`; ctx.beginPath(); ctx.arc(u.x - 4, u.y - 20 + f * 20, 9, 0, 7); ctx.fill(); return; }
          ctx.globalAlpha = 0.5; ctx.fillStyle = "#222"; ctx.beginPath(); ctx.ellipse(u.x, u.y + 1, 8, 2.5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; return;
        }
        const adv = u.side === "att" && mode === "land" && u.k !== "arty" && u.k !== "aa" ? (t / 12000) * W * 0.06 : mode === "sea" && u.side === "att" ? (t / 12000) * W * 0.04 : 0;
        u.x0 = u.x0 ?? u.x; u.x = u.x0 + adv;
        const bob = u.ship ? Math.sin(now / 600 + u.x0) * 1.4 : u.sub ? Math.sin(now / 900 + u.phase * 9) * 3 : 0;
        ctx.save(); if (u.side === "def") { ctx.translate(u.x, 0); ctx.scale(-1, 1); ctx.translate(-u.x, 0); }
        drawUnit(ctx, u.k, u.x, u.y + bob, u.big ? 1.15 : u.ship ? 1.0 : 1.1, c1, c2, now + u.x);
        ctx.restore();
        if (u.ship) { ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.moveTo(u.x - (u.side === "att" ? 26 : -26), u.y + 4 + bob); ctx.lineTo(u.x - (u.side === "att" ? 50 : -50), u.y + 7 + bob); ctx.stroke(); }
        if (u.k === "carriers" && u.launch != null && u.launch < 0.4) { const f = u.launch / 0.4, dir = u.side === "att" ? 1 : -1; ctx.save(); ctx.translate(u.x + dir * (-20 + 60 * f), u.y - 8 - 40 * f * f); if (dir < 0) ctx.scale(-1, 1); drawUnit(ctx, "fighters", 0, 0, 0.7, c1, c2, now); ctx.restore(); }
      });
      // ── Aircraft ──
      units.filter(u => u.air || u.heli).forEach(u => {
        const [c1, c2] = colOf(u.side), dir = u.side === "att" ? 1 : -1;
        if (!u.alive) {
          if (u.sinkT != null && u.air) { const f = Math.min(1, (t - u.sinkT) / 1500); if (f < 1) { ctx.fillStyle = `rgba(60,60,60,${0.6 * (1 - f)})`; ctx.beginPath(); ctx.arc(u.cx + dir * f * 40, u.cy + f * f * (horizon - u.cy), 4 + 6 * f, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(255,150,40,${1 - f})`; ctx.beginPath(); ctx.arc(u.cx + dir * f * 40, u.cy + f * f * (horizon - u.cy), 3, 0, 7); ctx.fill(); } }
          return;
        }
        if (u.air) {
          if (u.dog) {
            // Modern air combat is fought beyond visual range: fighters hold a patrol line on their
            // own side and trade long-range radar missiles (AMRAAM, R-77, PL-15, Meteor) across a
            // gap of 50-150 km. Only late, and less often between modern air forces, do survivors
            // close to a within-visual-range merge with short-range missiles and guns.
            const bvr = (u.side === "att" ? info.att.bvr : info.def.bvr) ?? 0.7;
            const merge = t > 7500 ? Math.min(1, (t - 7500) / 2500) * (1 - 0.6 * bvr) : 0;
            const patrol = 0.07 + 0.16 * (0.5 + 0.5 * Math.sin(now / 1500 + u.phase * 9));
            const close = 0.44 + 0.08 * Math.sin(now / 350 + u.phase * 9);
            const f = patrol + (close - patrol) * merge;
            u.cx = u.side === "att" ? W * f : W * (1 - f);
            u.cy = H * u.lane + Math.sin(now / 700 + u.phase * 20) * (6 + 16 * merge);
            u.merge = merge;
          } else {
            const speed = u.bomber ? 6000 : 4000, ph = ((t / speed) + u.phase) % 1;
            u.cx = u.side === "att" ? ph * (W + 80) - 40 : W + 40 - ph * (W + 80);
            u.cy = H * u.lane;
          }
        } else { u.cx = u.x + Math.sin(now / 900 + u.y) * 6; u.cy = u.y + Math.sin(now / 500 + u.x) * 3; }
        ctx.save(); ctx.translate(u.cx, u.cy); if (dir < 0) ctx.scale(-1, 1);
        if (u.dog) ctx.rotate(Math.cos(now / 700 + u.phase * 20) * (0.08 + 0.3 * (u.merge || 0)));
        drawUnit(ctx, u.k, 0, 0, u.air ? (u.bomber ? 1.1 : 1.2) : 1.1, c1, c2, now);
        ctx.restore();
        if (u.air) { ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(u.cx - dir * 14, u.cy); ctx.lineTo(u.cx - dir * 60, u.cy); ctx.stroke(); }
        // Fighters fire missiles at enemy aircraft; bombers and strike jets bomb surface targets.
        if (u.dog && (t + u.lane * 9000) % Math.round(1800 / q(u)) < 40) {
          const air = foesOf(u, v => v.air && v.cx != null);
          if (air.length) {
            const a = air[Math.floor(u.lane * 97) % air.length];
            // Beyond visual range: a lofted long-range shot that climbs and dives on its target.
            if (!(u.merge > 0.3)) shots.push({ x0: u.cx, y0: u.cy, x1: a.cx, y1: a.cy, t, dur: 2400, arc: 0.12, missile: true, bvr: true });
            else tracers.push({ x0: u.cx, y0: u.cy, x1: a.cx, y1: a.cy, t, missile: (t / 1800 | 0) % 2 === 0, aam: true });
          }
        }
        if ((u.bomber || (u.air && mode !== "air")) && (t + u.lane * 9000) % 2600 < 40) {
          const fs = foesOf(u, v => !v.air && !v.heli && !v.sub);
          if (fs.length) { const f = fs[Math.floor(u.lane * 97) % fs.length]; shots.push({ x0: u.cx, y0: u.cy, x1: f.x, y1: f.y, t, dur: 600, arc: 0, bomb: true }); }
          else if (mode === "air") shots.push({ x0: u.cx, y0: u.cy, x1: u.cx + dir * 40, y1: horizon + 6, t, dur: 700, arc: 0, bomb: true });
        }
      });
      // ── Shots, tracers, explosions ──
      for (let i = shots.length - 1; i >= 0; i--) {
        const sh = shots[i], f = (t - sh.t) / sh.dur;
        if (f < 0 || f > 1) { if (f > 1) booms.push({ x: sh.x1, y: sh.y1, t, splash: mode === "sea" && !sh.bvr }); shots.splice(i, 1); continue; }
        const x = sh.x0 + (sh.x1 - sh.x0) * f, y = sh.y0 + (sh.y1 - sh.y0) * f - Math.sin(Math.PI * f) * H * (sh.arc || 0);
        if (sh.torpedo) { ctx.strokeStyle = "rgba(220,240,255,0.6)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sh.x0, sh.y0); ctx.lineTo(x, y); ctx.stroke(); }
        else if (sh.bvr) { ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.3; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const g = Math.max(0, f - 0.3) + (f - Math.max(0, f - 0.3)) * k / 12; const xx = sh.x0 + (sh.x1 - sh.x0) * g, yy = sh.y0 + (sh.y1 - sh.y0) * g - Math.sin(Math.PI * g) * H * sh.arc; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.fillStyle = "#ffcf6e"; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); }
        else if (sh.missile) { ctx.strokeStyle = "rgba(240,240,240,0.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - (sh.x1 - sh.x0) * 0.08, y); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); }
      }
      for (let i = tracers.length - 1; i >= 0; i--) {
        const tr = tracers[i], dur = tr.sam ? 1100 : tr.aam ? 700 : 450, f = (t - tr.t) / dur;
        if (f < 0 || f > 1) { tracers.splice(i, 1); continue; }
        const xe = tr.x0 + (tr.x1 - tr.x0) * f, ye = tr.y0 + (tr.y1 - tr.y0) * f;
        if (tr.missile) { ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = tr.sam ? 2 : 1.4; ctx.beginPath(); ctx.moveTo(tr.x0 + (tr.x1 - tr.x0) * Math.max(0, f - 0.35), tr.y0 + (tr.y1 - tr.y0) * Math.max(0, f - 0.35)); ctx.lineTo(xe, ye); ctx.stroke(); ctx.fillStyle = "#ffcf6e"; ctx.beginPath(); ctx.arc(xe, ye, 1.8, 0, 7); ctx.fill(); }
        else if (tr.small) { ctx.fillStyle = "rgba(255,220,120,0.9)"; ctx.fillRect(xe - 1, ye - 0.5, 3, 1); }
        else { ctx.strokeStyle = "rgba(255,190,80,0.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tr.x0 + (tr.x1 - tr.x0) * Math.max(0, f - 0.25), tr.y0 + (tr.y1 - tr.y0) * Math.max(0, f - 0.25)); ctx.lineTo(xe, ye); ctx.stroke(); }
      }
      for (let i = booms.length - 1; i >= 0; i--) {
        const b = booms[i], f = (t - b.t) / (b.big ? 900 : 600);
        if (f < 0 || f > 1) { booms.splice(i, 1); continue; }
        const r = (b.big ? 16 : 9) * (0.4 + f);
        if (b.splash && !b.big) { ctx.fillStyle = `rgba(230,245,255,${0.8 - 0.8 * f})`; ctx.fillRect(b.x - 2, b.y - 18 * (1 - f), 4, 18 * (1 - f)); continue; }
        ctx.fillStyle = `rgba(255,${Math.round(200 - 150 * f)},60,${1 - f})`; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill();
        ctx.fillStyle = `rgba(60,60,60,${0.6 * (1 - f)})`; ctx.beginPath(); ctx.arc(b.x, b.y - r, r * 0.8, 0, 7); ctx.fill();
      }
      ctx.font = "600 13px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(info.att.label, 10, 20); ctx.textAlign = "right"; ctx.fillText(info.def.label, W - 10, 20);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const legend = (T, side) => kinds.filter(k => T[k].n).map(k => {
      const qq = ((info[side].q || {})[k]), bits = [];
      if (T[k].per > 1) bits.push(`each ≈ ${Math.round(T[k].real / T[k].n).toLocaleString("en-US")}${k === "troops" ? " soldiers" : ""}`);
      if (qq != null && k !== "aa") bits.push(`quality ×${qq.toFixed(2)}`);
      if (T[k].down) bits.push(`${T[k].down} in maintenance`);
      return `${T[k].n} × ${LABEL[k]}${bits.length ? ` <small>(${bits.join(", ")})</small>` : ""}`;
    }).join(" · ");
    return { stop: () => cancelAnimationFrame(raf), legendA: legend(A, "att"), legendD: legend(D, "def") };
  }
  // Which theatres a battle has: land if ground forces fight, sea if either side brings a fleet into
  // it, air if aircraft are involved. The default is what the attack really is.
  window.battleModes = (att, def) => {
    const has = (u, ks) => ks.some(k => (u[k] || 0) >= 1);
    const modes = [];
    if (has(att, ["tanks", "afv", "arty", "troops"])) modes.push("land");
    if (has(att, ["ships", "subs", "carriers"])) modes.push("sea");
    if (has(att, ["fighters", "aircraft", "helis"])) modes.push("air");
    if (!modes.length) modes.push("land");
    return modes;
  };
  window.openBattle = info => {
    if (open) open.close();
    const wrap = document.createElement("div");
    wrap.className = "battle-overlay";
    const NAMES = { land: "⚔️ Land", sea: "⚓ Sea", air: "✈️ Air" };
    wrap.innerHTML = `<div class="battle-box"><div class="battle-head"><b></b><span class="battle-tabs">${info.modes.length > 1 ? info.modes.map(m => `<button data-mode="${m}">${NAMES[m]}</button>`).join("") : ""}</span><button class="battle-x" aria-label="Close">×</button></div><canvas></canvas><div class="battle-legend"></div></div>`;
    document.body.appendChild(wrap);
    const cv = wrap.querySelector("canvas"), DPR = window.devicePixelRatio || 1;
    const W = Math.min(980, window.innerWidth - 32), H = Math.round(W * 0.52);
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px";
    let cur = null;
    const show = mode => {
      if (cur) cur.stop();
      cur = scene(cv, W, H, DPR, info, mode);
      wrap.querySelector(".battle-head b").innerHTML = `${{ land: "Battle for", sea: "Sea battle off", air: "Air battle over" }[mode]} ${info.place} · ${info.wx}`;
      wrap.querySelectorAll(".battle-tabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === mode));
      wrap.querySelector(".battle-legend").innerHTML = `<p><b style="color:${info.att.col}">${info.att.label}</b>: ${cur.legendA || "no forces in this fight"}</p><p><b style="color:${info.def.col}">${info.def.label}</b>: ${cur.legendD || "no forces in this fight"}</p><p class="hint">${info.summary}</p>`;
    };
    wrap.querySelectorAll(".battle-tabs button").forEach(b => (b.onclick = () => show(b.dataset.mode)));
    show(info.mode || info.modes[0]);
    const close = () => { if (cur) cur.stop(); wrap.remove(); open = null; };
    wrap.querySelector(".battle-x").onclick = close;
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    open = { close };
  };
})();
