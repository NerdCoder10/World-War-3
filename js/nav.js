// Routing over land and sea (data in js/navgrid.js): ships sail only through water (the ocean, with
// the Suez and Panama canals and narrow straits open, or an inland sea like the Caspian), and tanks
// and other vehicles drive only over land. A* search on the 0.5° grid, then the path is
// straightened wherever a direct line stays on the same surface. Results are cached.
(() => {
  const N = window.NAV_GRID, W = N.W, H = N.H, raw = atob(N.land), n = W * H;
  const land = new Uint8Array(n), sea = new Uint8Array(n);
  for (let i = 0; i < n; i++) land[i] = (raw.charCodeAt(i >> 3) >> (i & 7)) & 1;
  for (let i = 0; i < n; i++) sea[i] = land[i] ? 0 : 1;
  N.carve.forEach(i => (sea[i] = 1));
  // Sea basins: the world ocean and each inland sea or lake.
  const basin = new Int32Array(n);
  let nb = 0;
  const q = new Int32Array(n);
  for (let s0 = 0; s0 < n; s0++) {
    if (!sea[s0] || basin[s0]) continue;
    nb++; let h = 0, t = 0; q[t++] = s0; basin[s0] = nb;
    while (h < t) {
      const i = q[h++], x = i % W, y = (i / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy; if ((!dx && !dy) || yy < 0 || yy >= H) continue;
        const j = yy * W + ((x + dx + W) % W);
        if (sea[j] && !basin[j]) { basin[j] = nb; q[t++] = j; }
      }
    }
  }
  const cellOf = (lon, lat) => Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H))) * W + ((Math.floor(((lon + 180) / 360) * W) % W) + W) % W;
  const ptOf = i => [-180 + ((i % W) + 0.5) * (360 / W), 90 - (((i / W) | 0) + 0.5) * (180 / H)];
  const km = (a, b) => d3.geoDistance(a, b) * 6371;
  // Nearest passable cell within r rings.
  function nearest(p, pass, r = 10) {
    const c = cellOf(p[0], p[1]);
    if (pass[c]) return c;
    const x0 = c % W, y0 = (c / W) | 0;
    let best = -1, bd = Infinity;
    for (let ring = 1; ring <= r && best < 0; ring++) {
      for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const yy = y0 + dy; if (yy < 0 || yy >= H) continue;
        const j = yy * W + ((x0 + dx + W) % W);
        if (pass[j]) { const d = km(p, ptOf(j)); if (d < bd) { bd = d; best = j; } }
      }
    }
    return best;
  }
  // A* with a binary heap; step costs in km.
  const g = new Float64Array(n), from = new Int32Array(n), seen = new Uint32Array(n);
  let gen = 0;
  const cellKm = 20015 / H; // one cell north–south
  function astar(s, t, pass) {
    gen++;
    const tp = ptOf(t), heap = [], hv = [];
    const push = (i, f) => { heap.push(i); hv.push(f); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (hv[p] <= hv[k]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; [hv[p], hv[k]] = [hv[k], hv[p]]; k = p; } };
    const pop = () => { const top = heap[0], lv = hv.pop(), li = heap.pop(); if (heap.length) { heap[0] = li; hv[0] = lv; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && hv[l] < hv[m]) m = l; if (r < heap.length && hv[r] < hv[m]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; [hv[m], hv[k]] = [hv[k], hv[m]]; k = m; } } return top; };
    seen[s] = gen; g[s] = 0; from[s] = -1; push(s, km(ptOf(s), tp));
    let steps = 0;
    while (heap.length) {
      const i = pop();
      if (i === t) break;
      if (++steps > 400000) return null;
      const x = i % W, y = (i / W) | 0, cx = cellKm * Math.cos(((90 - (y + 0.5) * (180 / H)) * Math.PI) / 180);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy; if ((!dx && !dy) || yy < 0 || yy >= H) continue;
        const j = yy * W + ((x + dx + W) % W);
        if (!pass[j]) continue;
        const ng = g[i] + Math.sqrt((dx * cx) ** 2 + (dy * cellKm) ** 2);
        if (seen[j] !== gen || ng < g[j]) { seen[j] = gen; g[j] = ng; from[j] = i; push(j, ng + km(ptOf(j), tp) * 0.98); }
      }
    }
    if (seen[t] !== gen) return null;
    const cells = [];
    for (let i = t; i !== -1; i = from[i]) cells.push(i);
    return cells.reverse();
  }
  // Straighten: keep a point only where a direct line from the last kept point would leave the surface.
  function clear(a, b, pass) {
    const steps = Math.ceil(km(a, b) / 15) + 1, interp = d3.geoInterpolate(a, b);
    for (let k = 1; k < steps; k++) { const p = interp(k / steps); if (!pass[cellOf(p[0], p[1])]) return false; }
    return true;
  }
  function smooth(pts, pass) {
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !clear(pts[i], pts[j], pass)) j = Math.max(i + 1, i + ((j - i) >> 1));
      out.push(pts[j]); i = j;
    }
    return out;
  }
  const cache = new Map();
  function route(a, b, pass, kind) {
    const key = kind + a.map(v => v.toFixed(2)) + b.map(v => v.toFixed(2));
    if (cache.has(key)) return cache.get(key);
    const s = nearest(a, pass), t = nearest(b, pass);
    let res = null;
    if (s >= 0 && t >= 0 && (kind !== "sea" || basin[s] === basin[t])) {
      const cells = s === t ? [s] : astar(s, t, pass);
      if (cells) {
        const pts = smooth([a].concat(cells.map(ptOf), [b]), pass).map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
        let d = 0; for (let k = 1; k < pts.length; k++) d += km(pts[k - 1], pts[k]);
        res = { pts, km: d };
      }
    }
    if (cache.size > 3000) cache.clear();
    cache.set(key, res);
    return res;
  }
  // Ships: a sea route between two points (each snapped to the nearest water), or null.
  window.navSea = (a, b) => route(a, b, sea, "sea");
  // Vehicles: a land route, or null when water is in the way.
  window.navLand = (a, b) => route(a, b, land, "land");
  window.navIsSea = p => !!sea[cellOf(p[0], p[1])];
  window.navBasin = p => { const c = nearest(p, sea, 6); return c >= 0 ? basin[c] : 0; };
  // A country's landing point nearest a given point (its coast facing that way), in the same sea
  // basin as `near` if possible. Tiny island states smaller than a grid cell land at their centre.
  window.navCoast = (iso, near) => {
    const list = (window.NAV_COAST || {})[iso];
    if (!list || !list.length) return null;
    const b = near ? window.navBasin(near) : 0, same = b ? list.filter(c => c[2] === b) : list;
    const pool = same.length ? same : list;
    return pool.reduce((best, c) => (!best || km([c[0], c[1]], near || [c[0], c[1]]) < km([best[0], best[1]], near || [best[0], best[1]]) ? c : best), null).slice(0, 2);
  };
})();
// The nearest open water within r grid cells (~55 km each) of a point, or null if it's inland.
window.navNearSea = (p, r = 3) => {
  if (!p) return null;
  const N = window.NAV_GRID, W = N.W, H = N.H;
  for (let ring = 0; ring <= r; ring++) {
    let best = null, bd = Infinity;
    for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
      const q = [p[0] + (dx * 360) / W, p[1] - (dy * 180) / H];
      if (q[1] < -89 || q[1] > 89) continue;
      if (window.navIsSea(q)) { const d = Math.abs(dx) + Math.abs(dy); if (d < bd) { bd = d; best = q; } }
    }
    if (best) return best;
  }
  return null;
};
