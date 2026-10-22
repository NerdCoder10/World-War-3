// Map rendering and UI.
(function () {
  const C = window.COUNTRIES, BY = window.BY_ISO, G = window.GAME;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const css = getComputedStyle(document.documentElement);
  const T = k => css.getPropertyValue(k).trim();
  const VALUE_COL = { human: "#e9c46a", realEstate: "#8fb3c9", business: "#b49ae0", cultural: "#d98fb0", infrastructure: "#6f8f96", natural: "#7fbf7a", gold: "#f3e3a2", hardware: "#e2654f" };
  const COL = { land: T("--land"), locked: T("--locked"), brass: T("--brass"), teal: T("--teal"), danger: T("--danger"), muted: T("--muted") };

  let mode = "campaign";
  let selected = null;
  let tab = "dossier";

  // ── Formatting ─────────────────────────────────────────────
  const money = bn => bn >= 1e6 ? `$${(bn / 1e6).toFixed(2)} quadrillion` : bn >= 1000 ? `$${(bn / 1000).toFixed(bn >= 10000 ? 1 : 2)}trn` : bn >= 1 ? `$${bn >= 100 ? Math.round(bn) : bn.toFixed(1)}bn` : bn > 0 ? `$${Math.round(bn * 1000)}m` : "—";
  const num = n => n === 0 ? "0" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1e3) + "k" : Math.round(n).toLocaleString("en-US");
  const kPers = k => k === 0 ? "0" : k >= 1000 ? (k / 1000).toFixed(2) + "M" : k >= 1 ? Math.round(k) + "k" : Math.round(k * 1000).toString();
  const popFmt = m => m >= 1000 ? (m / 1000).toFixed(2) + "bn" : m >= 1 ? m.toFixed(1) + "M" : Math.round(m * 1000) + "k";
  const flag = iso2 => String.fromCodePoint(...[...iso2].map(ch => 0x1f1a5 + ch.charCodeAt(0)));
  const pct = p => Math.round(p * 100) + "%";

  // ── Map data ───────────────────────────────────────────────
  const topo = window.WORLD_TOPO;
  const geoms = topo.objects.countries.geometries;
  const features = topojson.feature(topo, topo.objects.countries).features;
  features.forEach(f => {
    const name = f.properties.name;
    const own = window.BY_ID[f.id] ? window.BY_ID[f.id].iso3 : window.TERRITORY_OWNER[f.id] || window.TERRITORY_OWNER_BY_NAME[name] || null;
    f.iso = own;
    f.territory = !!own && !window.BY_ID[f.id];
    f.disputed = !own ? (window.DISPUTED[f.id] || window.DISPUTED[name] || name) : null;
  });

  // Land neighbours at country level (territories count for their sovereign).
  const NB = {};
  topojson.neighbors(geoms).forEach((list, i) => {
    const a = features[i].iso; if (!a) return;
    list.forEach(j => { const b = features[j].iso; if (b && b !== a) (NB[a] = NB[a] || new Set()).add(b); });
  });
  window.NEIGHBORS = Object.fromEntries(Object.entries(NB).map(([k, v]) => [k, [...v]]));

  // Microstates and islands get a clickable marker.
  const markers = [];
  C.forEach(c => {
    const f = features.find(x => x.id === c.id);
    if (!f) { markers.push({ c, at: c.iso3 === "TUV" ? [179.2, -8.5] : [0, 0] }); return; }
    if (d3.geoArea(f) < 4e-5) markers.push({ c, at: d3.geoCentroid(f) });
  });

  // ── Force disposition ──────────────────────────────────────
  // Best-guess peacetime basing: forces sit mostly at home garrisons near the capital and along
  // borders in proportion to real tension, with the fleet at its main ports. This models where
  // militaries actually are, not an optimal defensive spread.
  const mainFeat = {};
  features.forEach(f => { if (!f.iso) return; f._a = d3.geoArea(f); if (!mainFeat[f.iso] || f._a > mainFeat[f.iso]._a) mainFeat[f.iso] = f; });
  function centroidOf(iso) {
    if (mainFeat[iso]) return d3.geoCentroid(mainFeat[iso]);
    const m = markers.find(x => x.c.iso3 === iso);
    return m ? m.at : [0, 0];
  }
  function towardInside(feat, from, to) {
    for (let t = 0.5; t >= 0.1; t -= 0.05) {
      const p = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
      if (d3.geoContains(feat, p)) return p;
    }
    return from;
  }
  function coastalPoint(feat, refs) {
    const geo = feat.geometry, pts = [];
    (geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates).forEach(poly => poly[0].forEach(p => pts.push(p)));
    if (!pts.length) return d3.geoCentroid(feat);
    const r = refs.length ? refs : [d3.geoCentroid(feat)];
    // The boundary point farthest from land neighbours is the one facing open sea.
    let best = pts[0], score = -1;
    pts.forEach(p => { const sc = r.reduce((a, q) => a + d3.geoDistance(p, q), 0); if (sc > score) { score = sc; best = p; } });
    return best;
  }
  function computeDeployment(iso) {
    const hand = window.DEPLOYMENTS && window.DEPLOYMENTS[iso];
    if (hand) {
      const zones = hand.map(([name, lon, lat, ground, air, naval, note, host]) => ({ name, at: [lon, lat], ground, air, naval, note, host }));
      const norm = key => { const t = zones.reduce((a, z) => a + z[key], 0) || 1; zones.forEach(z => (z[key + "Pct"] = z[key] / t)); };
      norm("air"); norm("naval");
      // Forces abroad are absolute personnel (thousands); home rows fill the rest of the active force.
      const active = BY[iso].active;
      const abroadK = zones.filter(z => z.host).reduce((a, z) => a + z.ground, 0);
      const homeW = zones.filter(z => !z.host).reduce((a, z) => a + z.ground, 0) || 1;
      const total = Math.max(active, abroadK * 1.05);
      zones.forEach(z => (z.groundPct = z.host ? z.ground / total : (z.ground / homeW) * (total - abroadK) / total));
      zones.hand = true;
      return zones;
    }
    const c = BY[iso], feat = mainFeat[iso], cen = centroidOf(iso);
    const nbs = (window.NEIGHBORS[iso] || []).filter(n => BY[n]);
    const allies = new Set();
    (window.ALLIES_OF[iso] || []).forEach(a => a.members.forEach(m => allies.add(m)));
    const borders = nbs.map(n => ({ n, allied: allies.has(n), threat: (BY[n].truePower || 5) * (allies.has(n) ? 0.2 : 1) }));
    const totalThreat = borders.reduce((a, b) => a + b.threat, 0);
    const hasNavy = c.ships + c.subs + c.carriers > 0;
    const home = nbs.length ? 0.4 : hasNavy ? 0.7 : 0.9;
    const coast = hasNavy ? 0.12 : 0;
    const borderBudget = Math.max(0, 1 - home - coast);
    // Token or ceremonial forces (under ~1,000 troops) are all at the capital.
    if (c.active < 1) return [{ name: "Capital", at: cen, ground: 1, air: 1, naval: 1, groundPct: 1, airPct: 1, navalPct: 1,
      note: c.active > 0 ? "A small ceremonial or police-style force kept entirely in the capital." : "No standing army. Security is handled by police or a coast guard based in the capital." }];
    const zones = [{ name: "Capital region & central reserve", at: cen, ground: home, air: 0.6, naval: 0,
      note: "Command HQ, reserve and training formations and most peacetime garrisons sit in the interior near the capital." }];
    borders.forEach(b => {
      if (totalThreat <= 0) return;
      const sh = borderBudget * b.threat / totalThreat;
      if (sh < 0.03) return;
      zones.push({ name: `${BY[b.n].name} frontier`, at: feat ? towardInside(feat, cen, centroidOf(b.n)) : cen, ground: sh, air: 0.3, naval: 0,
        note: b.allied ? `Light screening force only. ${BY[b.n].name} is a treaty partner.` : `Units facing ${BY[b.n].name}, sized to that border's tension rather than to ideal coverage.` });
    });
    if (hasNavy) {
      const at = feat ? coastalPoint(feat, nbs.map(centroidOf)) : cen;
      zones.push({ name: "Coastal & naval bases", at, ground: nbs.length ? 0 : 1 - home, air: 0.1, naval: 1,
        note: nbs.length ? "Fleet, naval aviation and coastal-defence units at the main ports." : "Fleet plus marines and coastal-defence brigades at the main ports and outlying islands." });
    }
    // Bigger armies spread their home share over more regional garrisons and training areas.
    const nRegional = feat ? Math.max(0, Math.min(12, Math.round(Math.log2(1 + c.active) * 1.5) - zones.length)) : 0;
    const pts = nRegional ? interiorPoints(feat, iso, nRegional, zones.map(z => z.at)) : [];
    if (pts.length) {
      const each = (home * 0.55) / pts.length;
      zones[0].ground = home * 0.45;
      const used = {};
      pts.forEach(p => {
        let name = compass(cen, p) + " garrison";
        used[name] = (used[name] || 0) + 1;
        if (used[name] > 1) name += " " + used[name];
        zones.push({ name, at: p, ground: each, air: 0.12, naval: 0, note: "Regional garrison, air base and training area (modelled)." });
      });
    }
    const norm = key => { const t = zones.reduce((a, z) => a + z[key], 0) || 1; zones.forEach(z => (z[key + "Pct"] = z[key] / t)); };
    norm("ground"); norm("air"); norm("naval");
    return zones;
  }
  // Seeded sample of points inside a country, spread out by farthest-point selection.
  function interiorPoints(feat, iso, n, existing) {
    let seed = [...iso].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7);
    const rand = () => { // mulberry32
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let [[w, so], [e, no]] = d3.geoBounds(feat);
    if (e < w) e += 360; // crosses the antimeridian
    const cand = [];
    for (let i = 0; i < 700 && cand.length < 250; i++) {
      let lon = w + rand() * (e - w);
      if (lon > 180) lon -= 360;
      const p = [lon, so + rand() * (no - so)];
      if (d3.geoContains(feat, p)) cand.push(p);
    }
    const chosen = [], anchors = existing.slice();
    while (chosen.length < n && cand.length) {
      let bi = 0, bd = -1;
      cand.forEach((p, i) => { const d = Math.min(...anchors.map(q => d3.geoDistance(p, q))); if (d > bd) { bd = d; bi = i; } });
      const p = cand.splice(bi, 1)[0];
      chosen.push(p); anchors.push(p);
    }
    return chosen;
  }
  function compass(from, to) {
    const dx = (to[0] - from[0]) * Math.cos((from[1] * Math.PI) / 180), dy = to[1] - from[1];
    if (Math.hypot(dx, dy) < 0.6) return "Central";
    const names = ["Eastern", "Northeastern", "Northern", "Northwestern", "Western", "Southwestern", "Southern", "Southeastern"];
    return names[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
  }

  // ── SVG ────────────────────────────────────────────────────
  const wrap = $(".mapwrap");
  const svg = d3.select(wrap).append("svg").attr("role", "img").attr("aria-label", `World map of ${C.length} countries`);
  const defs = svg.append("defs");
  const hatch = defs.append("pattern").attr("id", "hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
  hatch.append("rect").attr("width", 6).attr("height", 6).attr("fill", COL.locked);
  hatch.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).attr("stroke", "#ffffff14").attr("stroke-width", 2);

  const root = svg.append("g");
  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);
  const sphere = root.append("path").datum({ type: "Sphere" }).attr("class", "sphere");
  const grat = root.append("path").datum(d3.geoGraticule10()).attr("class", "graticule");
  const countryPaths = root.append("g").selectAll("path").data(features).join("path")
    .attr("class", f => "country" + (f.iso ? " clickable" : ""))
    .on("click", (e, f) => f.iso && select(f.iso))
    .on("mousemove", (e, f) => showTip(e, f))
    .on("mouseleave", hideTip);
  const markerSel = root.append("g").selectAll("circle").data(markers).join("circle")
    .attr("class", "marker")
    .on("click", (e, m) => select(m.c.iso3))
    .on("mousemove", (e, m) => showTip(e, { iso: m.c.iso3 }))
    .on("mouseleave", hideTip);
  const deployLayer = root.append("g").attr("class", "deploy-layer");

  let k = 1;
  function garrR(z) { return (2.5 + 16 * Math.sqrt(Math.max(z.groundPct, z.navalPct * 0.6, z.airPct * 0.5, 0.003))) / Math.sqrt(k); }
  function drawDeploy() {
    // Largest rings first so smaller bases sit on top and stay hoverable.
    const zones = (selected ? computeDeployment(selected) : []).sort((x, y) => garrR(y) - garrR(x));
    deployLayer.selectAll("circle").data(zones).join("circle")
      .attr("class", z => "garrison" + (z.navalPct > z.groundPct ? " naval" : "") + (z.host ? " abroad" : ""))
      .attr("cx", z => projection(z.at)[0]).attr("cy", z => projection(z.at)[1]).attr("r", garrR)
      .on("mousemove", (e, z) => zoneTip(e, z))
      .on("mouseleave", hideTip);
  }
  const zoom = d3.zoom().scaleExtent([1, 40]).on("zoom", e => {
    k = e.transform.k;
    root.attr("transform", e.transform);
    markerSel.attr("r", 3.2 / Math.sqrt(k));
    deployLayer.selectAll("circle").attr("r", garrR);
  });
  svg.call(zoom).on("dblclick.zoom", null);

  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    projection.fitExtent([[8, 8], [w - 8, h - 8]], { type: "Sphere" });
    sphere.attr("d", path); grat.attr("d", path); countryPaths.attr("d", path);
    markerSel.attr("cx", m => projection(m.at)[0]).attr("cy", m => projection(m.at)[1]).attr("r", 3.2 / Math.sqrt(k));
    zoom.translateExtent([[-w * 0.2, -h * 0.2], [w * 1.2, h * 1.2]]);
    drawDeploy();
  }
  window.addEventListener("resize", layout);
  layout();
  $("#zin").onclick = () => svg.transition().call(zoom.scaleBy, 1.8);
  $("#zout").onclick = () => svg.transition().call(zoom.scaleBy, 1 / 1.8);
  $("#zreset").onclick = () => svg.transition().call(zoom.transform, d3.zoomIdentity);

  // ── Colour modes ───────────────────────────────────────────
  const ramp = (hi, key, scale) => {
    const vals = C.map(c => c[key]);
    const s = (scale === "log" ? d3.scaleLog().domain([Math.max(0.05, d3.min(vals.filter(v => v > 0))), d3.max(vals)]) : d3.scaleSqrt().domain([0, d3.max(vals)])).clamp(true);
    const interp = d3.interpolateLab(COL.land, hi);
    return { color: c => interp(s(Math.max(c[key], scale === "log" ? 0.05 : 0)) ** (scale === "log" ? 1.4 : 1)), interp, domain: s.domain() };
  };
  const MODES = {
    campaign: { label: "Campaign" },
    power: { label: "Military power", key: "power", hi: "#e8734f", unit: "index", ...{} },
    hidden: { label: "Secret assets", key: "secretIndex", hi: "#c79bf2", unit: "index" },
    gdp: { label: "GDP", key: "gdp", hi: "#8fd16a", unit: "US$ bn", scale: "log" },
    soft: { label: "Soft power", key: "soft", hi: "#6fb6f0", unit: "score" },
    value: { label: "National value", key: "nationalValue", hi: "#e9c46a", unit: "US$ bn", scale: "log" },
  };
  for (const m of Object.values(MODES)) if (m.key) Object.assign(m, ramp(m.hi, m.key, m.scale));

  function campaignColor(iso) {
    const s = G.state;
    if (s.player) {
      if (s.owner[iso] === s.player) return iso === s.player ? COL.brass : d3.interpolateLab(COL.brass, COL.land)(0.35);
      if (G.isLocked(iso)) return "url(#hatch)";
      return COL.land;
    }
    return G.isLocked(iso) ? "url(#hatch)" : COL.teal;
  }
  function fillFor(iso) {
    if (!iso) return "#161f21";
    if (mode === "campaign") return campaignColor(iso);
    return MODES[mode].color(BY[iso]);
  }
  function paint() {
    countryPaths.attr("fill", f => fillFor(f.iso)).classed("selected", f => f.iso && f.iso === selected);
    markerSel.attr("fill", m => { const v = fillFor(m.c.iso3); return v.startsWith("url") ? COL.muted : v; })
      .classed("selected", m => m.c.iso3 === selected);
    legend();
  }

  function legend() {
    const L = $(".legend");
    if (mode === "campaign") {
      const s = G.state;
      const rows = s.player
        ? [[COL.brass, `Your nation (${BY[s.player].name})`], [d3.interpolateLab(COL.brass, COL.land)(0.35), "Conquered / annexed"], [COL.land, "Independent"], ["hatch", "Locked independent"]]
        : [[COL.teal, `Playable (${s.unlocked.length})`], ["hatch", "Locked"]];
      L.innerHTML = `<div class="title">Campaign · Turn ${s.turn}</div>` + rows.map(([c, t]) =>
        `<div class="row"><span class="sw" style="${c === "hatch" ? `background:repeating-linear-gradient(45deg,${COL.locked} 0 3px,#33403f 3px 5px);border:1px dashed ${COL.muted}` : `background:${c}`}"></span>${esc(t)}</div>`).join("");
      return;
    }
    const m = MODES[mode];
    const stops = d3.range(0, 1.01, 0.1).map(t => m.interp(t)).join(",");
    const fmt = v => m.key === "gdp" || m.key === "nationalValue" ? money(v) : Math.round(v);
    L.innerHTML = `<div class="title">${m.label}${m.key === "nationalValue" ? ` · world ${money(window.WORLD_VALUE)}` : ""}</div><div class="ramp" style="background:linear-gradient(90deg,${stops})"></div>
      <div class="ends"><span>${fmt(m.domain[0])}</span><span>${m.scale === "log" ? "log scale" : m.unit}</span><span>${fmt(m.domain[1])}</span></div>`;
  }

  // ── Tooltip ────────────────────────────────────────────────
  const tip = $(".tooltip");
  function showTip(e, f) {
    const r = wrap.getBoundingClientRect();
    let html;
    if (!f.iso) html = `<b>${esc(f.disputed)}</b><div class="k">Disputed · not among the ${C.length}</div>`;
    else {
      const c = BY[f.iso];
      const terr = f.territory ? `<div class="k">${esc(f.properties.name)} — territory of</div>` : "";
      const metric = mode === "power" ? `Power ${c.power} · #${c.powerRank}` : mode === "hidden" ? `Secret assets ${c.secretIndex} · #${c.secretRank}` :
        mode === "soft" ? `Soft power ${c.soft} · #${c.softRank}` : mode === "gdp" ? `GDP ${money(c.gdp)} · #${c.gdpRank}` :
        mode === "value" ? `Value ${money(c.nationalValue)} · #${c.valueRank}` :
        G.state.owner[c.iso3] !== c.iso3 ? `Held by ${BY[G.state.owner[c.iso3]].name}` : G.isLocked(c.iso3) ? "Locked" : "Playable";
      html = `${terr}<b>${esc(c.name)}</b><div class="k">${esc(metric)}</div>`;
    }
    tip.innerHTML = html; tip.hidden = false;
    const x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
    tip.style.left = Math.min(x, r.width - tip.offsetWidth - 6) + "px";
    tip.style.top = Math.min(y, r.height - tip.offsetHeight - 6) + "px";
  }
  function hideTip() { tip.hidden = true; }
  function placeTip(e) {
    const r = wrap.getBoundingClientRect();
    tip.hidden = false;
    tip.style.left = Math.min(e.clientX - r.left + 14, r.width - tip.offsetWidth - 6) + "px";
    tip.style.top = Math.min(e.clientY - r.top + 14, r.height - tip.offsetHeight - 6) + "px";
  }
  // Hover details for a base / garrison circle.
  function zoneTip(e, z) {
    const c = BY[selected];
    const host = z.host ? (z.host === "TERR" ? "Overseas territory" : BY[z.host] ? BY[z.host].name : z.host) : "";
    const parts = [
      z.groundPct > 0 ? `${kPers(c.active * z.groundPct)} troops` : "",
      c.aircraft && z.airPct > 0 ? `${num(Math.round(c.aircraft * z.airPct))} aircraft` : "",
      c.ships && z.navalPct > 0 ? `${num(Math.round(c.ships * z.navalPct))} vessels` : "",
    ].filter(Boolean).join(" · ");
    tip.innerHTML = `<b>${esc(z.name)}</b>${host ? `<div class="k">${esc(host)}</div>` : ""}<div class="k">${esc(parts)}</div><div class="tipnote">${esc(z.note)}</div>`;
    placeTip(e);
  }

  // ── Dossier card ───────────────────────────────────────────
  function statusPill(c) {
    const s = G.state, o = s.owner[c.iso3];
    if (s.player && o === s.player) return `<span class="pill mine">${c.iso3 === s.player ? "Your nation" : "Your empire"}</span>`;
    if (o !== c.iso3) return `<span class="pill occupied">Occupied by ${esc(BY[o].name)}</span>`;
    return G.isLocked(c.iso3) ? `<span class="pill locked">🔒 Locked</span>` : `<span class="pill playable">Playable</span>`;
  }
  const meter = (label, v) => `<div class="meter"><span>${label}</span><span class="ticks">${d3.range(10).map(i => `<i class="${i < v ? "on" : ""}"></i>`).join("")}</span><b>${v}</b></div>`;

  function buyHtml(c) {
    const s = G.state, short = s.coins < c.price;
    const prem = c.pricePremium ? ` incl. +${Math.round(c.pricePremium * 100)}% top-${window.PRICE_PREMIUMS.find(t => c.valueRank <= t.upTo).upTo} premium` : "";
    return `<button class="btn buy" data-act="buy" ${short ? "aria-disabled=\"true\"" : ""}>${s.player ? "Buy into empire" : "Buy & unlock"} <small><span class="coin" aria-hidden="true"></span>${G.fmtCoins(c.price)}</small></button>
      <p class="hint">Price is its national value in coins (1 coin = $1)${prem}.${short ? ` You have ${G.fmtCoins(s.coins)}.` : ""}</p>`;
  }

  function actionsHtml(c) {
    const s = G.state;
    if (!s.player) {
      if (G.isLocked(c.iso3)) return `<p class="hint">This nation is locked. Buy it to make it playable, or pick one of the ${s.unlocked.length} playable nations (teal on the map).</p>${buyHtml(c)}`;
      return `<button class="btn primary" data-act="choose">Play as ${esc(c.name)} <small>start campaign</small></button>`;
    }
    if (s.over) return `<p class="hint">Campaign finished. Start a new one from the Campaign tab.</p>`;
    if (G.owns(c.iso3)) return `<p class="hint">Part of your empire. Garrison at ${pct(s.garrison[c.iso3])} strength.</p>`;
    const a = G.attackOdds(c.iso3), d = G.diplomacyOdds(c.iso3);
    const allies = a.D.allies.blocs.length ? `<p class="hint">Defended by ${esc(a.D.allies.blocs.join(", "))} allies (+${a.D.allies.strength.toFixed(1)} strength).</p>` : "";
    const reach = a.adjacent ? "shares a border with your empire" : `overseas strike at ${pct(a.proj)} force projection`;
    return `${allies}
      <button class="btn attack" data-act="attack">Invade <small>${pct(a.p)} win odds</small></button>
      <button class="btn diplo" data-act="influence" ${d.p <= 0 ? "disabled" : ""}>Diplomatic union <small>${d.p > 0 ? pct(d.p) + " odds" : "impossible"}</small></button>
      <p class="hint">Target ${reach}. Your strength ${a.A.toFixed(1)} vs defence ${a.D.total.toFixed(1)}.${c.nukes ? " ☢️ Nuclear power: a winning invasion may trigger retaliation." : ""}</p>
      ${buyHtml(c)}`;
  }

  function dossier() {
    const pane = $("#pane-dossier");
    if (!selected) {
      pane.innerHTML = `<div class="empty"><h2>Select a country</h2>
        <p>Click any country on the map, or search above, to open its dossier: GDP, military inventory, estimated secret assets and soft power.</p>
        <p>${G.state.player ? `You lead <b>${esc(BY[G.state.player].name)}</b>. Pick a target to invade or court.` : `Choose one of the <b>${G.state.unlocked.length}</b> playable nations to start a campaign. All other countries are locked.`}</p></div>`;
      return;
    }
    const c = BY[selected], s = c.secret;
    const share = c.gdp / window.WORLD_GDP;
    const mine = G.owns(c.iso3), have = G.arsenal(c.iso3);
    const base = [["Defence budget", money(c.mil)], ["Active troops", kPers(c.active)], ["Reserves", kPers(c.reserve)]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`);
    const weaponTiles = c.weapons.map(w => {
      const val = num(w.count);
      if (!mine || !w.count) return `<div><dt>${w.label}</dt><dd>${val}</dd></div>`;
      if (have.includes(w.key)) return `<div class="unlocked"><dt>${w.label} · ready</dt><dd>${val}</dd></div>`;
      const short = G.state.coins < w.cost;
      return `<div class="lockedw"><dt>🔒 ${w.label}</dt><dd>${val}</dd>
        <button class="unlock" data-unlock="${w.key}" ${short ? "aria-disabled=\"true\"" : ""}><span class="coin" aria-hidden="true"></span>${w.cost.toLocaleString("en-US")}</button></div>`;
    });
    const lockedCount = mine ? c.weapons.filter(w => w.count && !have.includes(w.key)).length : 0;
    const v = c.value, vt = v.total;
    const zones = computeDeployment(c.iso3);
    const homeZ = zones.filter(z => !z.host), abroadZ = zones.filter(z => z.host);
    const abroadTroops = abroadZ.reduce((a, z) => a + c.active * z.groundPct, 0);
    const hosts = new Set(abroadZ.map(z => z.host));
    const hostName = h => (h === "TERR" ? "Overseas territory" : BY[h] ? BY[h].name : h);
    const maxShare = Math.max(...zones.map(z => Math.max(z.groundPct, z.navalPct, z.airPct))) || 1;
    const shareTxt = p => (p >= 0.995 ? "100%" : p >= 0.01 ? Math.round(p * 100) + "%" : "<1%");
    const zoneLi = z => `<li>
          <div class="z-h"><b>${esc(z.name)}</b><span>${z.groundPct > 0 ? shareTxt(z.groundPct) + " of troops" : z.navalPct > 0 ? shareTxt(z.navalPct) + " of navy" : shareTxt(z.airPct) + " of aircraft"}</span></div>
          ${z.host ? `<span class="tag">${esc(hostName(z.host))}</span>` : ""}
          <div class="z-bar"><i style="width:${(Math.max(z.groundPct, z.navalPct, z.airPct) / maxShare) * 100}%;background:${z.navalPct > z.groundPct ? COL.teal : COL.brass}"></i></div>
          <div class="z-stats">${[
            z.groundPct > 0 ? `${kPers(c.active * z.groundPct)} troops` : "",
            c.tanks && tankW(z) > 0 ? `${num(Math.round((c.tanks * tankW(z)) / tankTotal))} tanks` : "",
            c.aircraft && z.airPct > 0 ? `${num(Math.round(c.aircraft * z.airPct))} aircraft` : "",
            z.navalPct > 0 && c.ships ? `${num(Math.round(c.ships * z.navalPct))} vessels` : "",
          ].filter(Boolean).join(" · ")}</div>
          <p class="z-note">${esc(z.note)}</p></li>`;
    const weight = z => z.groundPct + z.navalPct * 0.5 + z.airPct * 0.3;
    const tankW = z => (z.navalPct > 0 ? 0 : z.groundPct * (z.airPct > z.groundPct * 3 ? 0.2 : 1));
    const tankTotal = zones.reduce((a, z) => a + tankW(z), 0) || 1;
    const zoneList = (list, show) => {
      const sorted = [...list].sort((x, y) => weight(y) - weight(x));
      return `<ul class="zones">${sorted.slice(0, show).map(zoneLi).join("")}</ul>` +
        (sorted.length > show ? `<details class="more"><summary>Show ${sorted.length - show} more</summary><ul class="zones">${sorted.slice(show).map(zoneLi).join("")}</ul></details>` : "");
    };
    const allies = (window.ALLIES_OF[c.iso3] || []).map(a => a.bloc);
    pane.innerHTML = `
      <div class="card-head"><div class="flag" aria-hidden="true">${flag(c.iso2)}</div>
        <div><h2>${esc(c.name)}</h2><div class="sub">${esc(c.region)} · ${c.iso3}${allies.length ? " · " + esc(allies.join(", ")) : ""}</div>${statusPill(c)}</div></div>

      <div class="section"><h3>Economy <small>2025 est.</small></h3>
        <dl class="kv">
          <div><dt>GDP (nominal)</dt><dd>${money(c.gdp)} <small>#${c.gdpRank}</small></dd></div>
          <div><dt>Share of world</dt><dd>${share >= 0.001 ? (share * 100).toFixed(share >= 0.01 ? 1 : 2) + "%" : "<0.1%"}</dd></div>
          <div><dt>GDP per capita</dt><dd>$${num(c.gdpPerCap)}</dd></div>
          <div><dt>Population</dt><dd>${popFmt(c.pop)}</dd></div>
        </dl></div>

      <div class="section"><h3>National value <small>rank #${c.valueRank}/${C.length}</small></h3>
        <div class="big"><strong>${money(vt)}</strong><span>${(vt / window.WORLD_VALUE * 100).toFixed(vt / window.WORLD_VALUE >= 0.01 ? 1 : 3)}% of the world's ${money(window.WORLD_VALUE)}</span></div>
        <div class="stack" role="img" aria-label="Value breakdown">${window.VALUE_PARTS.map(([k]) => `<i style="width:${v[k] / vt * 100}%;background:${VALUE_COL[k]}"></i>`).join("")}</div>
        <dl class="kv">${window.VALUE_PARTS.map(([k, label]) => `<div><dt><span class="sw" style="background:${VALUE_COL[k]}"></span>${label}</dt><dd>${money(v[k])}</dd></div>`).join("")}
          <div><dt>Value per citizen</dt><dd>$${num(c.valuePerCap)}</dd></div>
          <div><dt>Purchase price</dt><dd>${G.fmtCoins(c.price)} <small>coins${c.pricePremium ? ` · +${Math.round(c.pricePremium * 100)}%` : ""}</small></dd></div>
        </dl>${c.valueNote ? `<p class="note">${esc(c.valueNote)}</p>` : ""}</div>

      <div class="section"><h3>Military power <small>declared · rank #${c.powerRank}/${C.length}</small></h3>
        <div class="big"><strong>${c.power}</strong><span>/ 100 power index</span></div>
        <div class="bar"><i style="width:${c.power}%;background:${MODES.power.hi}"></i></div>
        ${mine ? `<p class="hint armory">${lockedCount ? `${lockedCount} weapon ${lockedCount === 1 ? "category is" : "categories are"} locked. Locked weapons don't fight. You have <b>${G.fmtCoins(G.state.coins)}</b> coins.` : "All weapons unlocked and ready."} Usable strength ${window.truePowerWith(c, have).toFixed(1)} of ${c.truePower}.</p>` : ""}
        <dl class="assets">${base.join("")}${weaponTiles.join("")}
          <div class="nuke" style="grid-column:span 3"><dt>Nuclear warheads${mine ? " · always ready" : ""}</dt><dd>${c.nukes ? num(c.nukes) + (c.iso3 === "ISR" ? " (undeclared, est.)" : "") : "None"}</dd></div></dl></div>

      <div class="section"><h3>Force disposition <small>${zones.hand ? "hand-placed" : "modelled"}</small></h3>
        <p class="hint">${zones.hand ? "Hand-placed from open sources: command HQs, corps, division and brigade garrisons, air and naval bases, and declared overseas deployments." : "Modelled: the capital reserve, regional garrisons, units on tense borders sized by threat, and the fleet on the coast."} Shown as rings on the map, with dashed rings for forces abroad. These are where forces sit, not an ideal spread.</p>
        <dl class="kv">
          <div><dt>Locations</dt><dd>${zones.length} <small>${homeZ.length} at home</small></dd></div>
          <div><dt>Forward deployed</dt><dd>${abroadZ.length ? kPers(abroadTroops) + " troops" : "None"} <small>${abroadZ.length ? `${abroadZ.length} sites · ${hosts.size} ${hosts.size === 1 ? "country" : "countries & territories"}` : ""}</small></dd></div>
        </dl>
        ${abroadZ.length ? `<h4 class="zgroup">At home</h4>` : ""}${zoneList(homeZ, 10)}
        ${abroadZ.length ? `<h4 class="zgroup">Abroad</h4>${zoneList(abroadZ, 8)}` : ""}</div>

      <div class="section"><h3>Secret assets <span class="tag">${s.estimated ? "modelled estimate" : "researched profile"}</span></h3>
        <div class="big"><strong>${c.secretIndex}</strong><span>/ 100 secret-assets index · #${c.secretRank}</span></div>
        <dl class="kv">
          <div><dt>Est. true strength</dt><dd>${c.truePower} <small>#${c.truePowerRank} · +${c.hiddenUplift}% vs declared</small></dd></div>
          <div><dt>Est. real defence spend</dt><dd>${money(s.trueBudget)} <small>${s.offbook ? "+" + s.offbook + "% off-book" : ""}</small></dd></div>
          <div><dt>Gold reserves</dt><dd>${s.gold ? num(s.gold) + " t" : "minor / unknown"}</dd></div>
          <div><dt>Sovereign funds</dt><dd>${s.swf ? money(s.swf) : "none major"}</dd></div>
        </dl>
        <div class="meters">${meter("Intelligence", s.intel)}${meter("Offensive cyber", s.cyber)}${meter("Nuclear capability", s.latency)}${meter("Proxies / irregulars", s.proxies)}</div>
        <p class="note">${esc(s.note)}</p></div>

      <div class="section"><h3>Soft power <small>rank #${c.softRank}/${C.length}</small></h3>
        <div class="big"><strong>${c.soft}</strong><span>/ 100 · ${window.softTier(c.soft)}</span></div>
        <div class="bar"><i style="width:${c.soft}%;background:${MODES.soft.hi}"></i></div>
        <dl class="kv"><div style="grid-column:span 2"><dt>Cultural assets</dt><dd class="culture">${esc(c.culture)}</dd></div></dl></div>

      <div class="section actions">${actionsHtml(c)}</div>`;
    pane.querySelectorAll("[data-act]").forEach(b => (b.onclick = () => act(b.dataset.act, c.iso3)));
    pane.querySelectorAll("[data-unlock]").forEach(b => (b.onclick = () => {
      const err = G.unlockWeapon(c.iso3, b.dataset.unlock);
      if (err) return toast(err);
      toast(G.state.log[0].msg); refresh();
    }));
  }

  function act(kind, iso) {
    const err = kind === "choose" ? G.choose(iso) : kind === "buy" ? G.buy(iso) : kind === "attack" ? G.attack(iso) : G.influence(iso);
    if (err) return toast(err);
    const last = G.state.log[0];
    if (last) toast(last.msg);
    refresh();
  }

  // ── Rankings ───────────────────────────────────────────────
  const RANKS = {
    power: ["Military power (declared)", c => c.power, v => v.toFixed(1)],
    truePower: ["Est. true strength (incl. secret assets)", c => c.truePower, v => v.toFixed(1)],
    secretIndex: ["Secret-assets index", c => c.secretIndex, v => v.toFixed(1)],
    gdp: ["GDP (nominal)", c => c.gdp, money],
    gdpPerCap: ["GDP per capita", c => c.gdpPerCap, v => "$" + num(v)],
    nationalValue: ["National value", c => c.nationalValue, money],
    soft: ["Soft power", c => c.soft, v => v],
    mil: ["Defence budget", c => c.mil, money],
    active: ["Active troops", c => c.active, kPers],
    nukes: ["Nuclear warheads", c => c.nukes, num],
  };
  function rankings() {
    const pane = $("#pane-rankings");
    const key = pane.querySelector("#rank-key")?.value || "power";
    const region = pane.querySelector("#rank-region")?.value || "";
    const [, get, fmt] = RANKS[key];
    const list = C.filter(c => !region || c.region === region).sort((a, b) => get(b) - get(a));
    const top = get(list[0]) || 1;
    const color = key === "nationalValue" ? MODES.value.hi : key === "gdp" || key === "gdpPerCap" ? MODES.gdp.hi : key === "soft" ? MODES.soft.hi : key === "secretIndex" || key === "truePower" ? MODES.hidden.hi : MODES.power.hi;
    pane.innerHTML = `<div class="rank-ctl">
        <select id="rank-key" aria-label="Ranking metric">${Object.entries(RANKS).map(([k, [l]]) => `<option value="${k}" ${k === key ? "selected" : ""}>${l}</option>`).join("")}</select>
        <select id="rank-region" aria-label="Region filter"><option value="">All regions</option>${["Africa", "Europe", "Asia", "North America", "South America", "Oceania"].map(r => `<option ${r === region ? "selected" : ""}>${r}</option>`).join("")}</select></div>
      <ol class="ranklist">${list.map((c, i) => `<li data-iso="${c.iso3}" class="${G.isLocked(c.iso3) ? "lk" : ""}"><span class="n">${i + 1}</span><span aria-hidden="true">${flag(c.iso2)}</span>
        <span class="nm">${esc(c.name)}${G.isLocked(c.iso3) ? "" : " ★"}<i style="width:${Math.max(1, (100 * get(c)) / top)}%;background:${color}"></i></span><span class="v">${fmt(get(c))}</span></li>`).join("")}</ol>
      <p class="hint">★ = playable this campaign. Faded rows are locked.</p>`;
    pane.querySelectorAll("select").forEach(s => (s.onchange = rankings));
    pane.querySelectorAll("li").forEach(li => (li.onclick = () => select(li.dataset.iso)));
  }

  // ── Campaign ───────────────────────────────────────────────
  function campaign() {
    const pane = $("#pane-campaign"), s = G.state;
    const groups = {};
    s.unlocked.forEach(iso => (groups[BY[iso].region] = groups[BY[iso].region] || []).push(BY[iso]));
    const roster = Object.entries(groups).map(([r, list]) => `<div class="grp">${r}</div><div class="roster">${list.map(c =>
      `<button data-iso="${c.iso3}" class="${s.player === c.iso3 ? "me" : ""}"><span aria-hidden="true">${flag(c.iso2)}</span><span>${esc(c.name)}</span><small>PWR ${c.power} · ${money(c.gdp)}</small></button>`).join("")}</div>`).join("");
    let empire = "";
    if (s.player) {
      const e = G.empire(), share = G.empireGdp() / window.WORLD_GDP;
      empire = `<div class="section"><h3>Your empire <small>turn ${s.turn}</small></h3>
        <dl class="kv">
          <div><dt>Leader nation</dt><dd>${esc(BY[s.player].name)}</dd></div>
          <div><dt>Territories</dt><dd>${e.length}</dd></div>
          <div><dt>Empire GDP</dt><dd>${money(G.empireGdp())}</dd></div>
          <div><dt>World GDP share</dt><dd>${(share * 100).toFixed(1)}% <small>goal 50%</small></dd></div>
          <div><dt>Strike strength</dt><dd>${G.empireStrength().toFixed(1)}</dd></div>
          <div><dt>Force projection</dt><dd>${pct(G.projection())}</dd></div>
          <div><dt>Soft power</dt><dd>${G.empireSoft().toFixed(0)}</dd></div>
          <div><dt>Warheads</dt><dd>${G.empireNukes() || "None"}</dd></div>
          <div><dt>Coins</dt><dd>${G.fmtCoins(s.coins)} <small>+${G.income()}/turn</small></dd></div>
          <div><dt>Empire value</dt><dd>${money(e.reduce((a, c) => a + c.nationalValue, 0))}</dd></div>
        </dl>
        <div class="bar" style="margin-top:10px"><i style="width:${Math.min(100, share * 200)}%;background:${COL.brass}"></i></div></div>`;
    }
    pane.innerHTML = `${empire}
      <div class="${s.player ? "section" : ""}"><h3>Playable nations <small>${s.unlocked.length} of ${C.length} unlocked</small></h3>
      <p class="hint">Rules: 4 random African nations (never South Africa), 3 random European, Argentina plus 2 random South American (never Brazil), and Mexico, Mongolia, Kazakhstan and Bangladesh. Every other country is locked until you buy it at its national value (1 coin = $1).</p>
      ${roster}</div>
      <div class="section row2">
        <button class="btn ghost" id="reroll" ${s.player ? "disabled" : ""}>Reroll random picks</button>
        <button class="btn ghost" id="newgame">New campaign</button></div>
      <div class="section"><h3>How to play</h3>
        <p class="hint">Pick a playable nation. Each turn, take one action against any other country: <b>Invade</b> (military strength vs. defence, with home advantage, morale from soft power and help from treaty allies) or <b>Diplomatic union</b> (your soft power and GDP vs. theirs). Bordering targets get your full strength; overseas targets depend on your navy, carriers and air force. Weakly held territories can revolt. Control 50% of world GDP to win.</p>
        <p class="hint"><b>Coins & weapons.</b> Every nation you control starts with its weapons locked: only troops, budget and nukes fight. Open a nation's dossier and spend coins to unlock each weapon category (tanks, aircraft, ships and so on). Prices scale with the hardware's real replacement value. You earn coins every turn from your empire's GDP, from each conquest or union, and from promo codes.</p></div>
      ${s.log.length ? `<div class="section"><h3>War log</h3><ul class="log">${s.log.map(l => `<li class="${l.kind}"><span>T${l.t}</span>${esc(l.msg)}</li>`).join("")}</ul></div>` : ""}
      <div class="section method"><details><summary>Methodology & sources</summary>
        <p>GDP: IMF WEO 2025 estimates. Population: UN WPP. Defence budgets: SIPRI, IISS Military Balance and national budgets. Equipment: IISS and Global Firepower-style active inventories, rounded. Warheads: FAS Nuclear Notebook. Soft power: modelled on Brand Finance Global Soft Power Index rankings.</p>
        <p>Military power index: square-root-scaled share of the world maximum across 14 weighted capabilities (budget 20%, fighters 10%, troops, armour, artillery, air, naval, submarines, carriers, GDP and population), discounted for equipment age using GDP per capita, plus a nuclear deterrent bonus.</p>
        <p>National value is the gross value of everything a country owns. It adds up global asset estimates: human capital ($1,620trn, 40 years of labour income), real estate and land ($410trn), business equity ($165trn), infrastructure ($85trn), resources in the ground (about $477trn), gold (about $26trn) and military hardware (about $3trn). That gives a world value of ${money(window.WORLD_VALUE)}. Each country gets its share of each pool, weighted by GDP, population and income level, plus its own resources, gold and arsenal. Business equity partly overlaps the property companies own, so treat the total as gross. A $70trn cultural and brand pool is shared out by soft power, and the Vatican gets a hand-set estimate for its property, art and faith brand.</p>
        <p>Soft power also counts toward military power (5% weight), as cultural pull, alliances and morale. Force disposition is a best guess at peacetime basing: about 40% of ground forces near the capital, the rest on borders in proportion to each neighbour's strength (treaty allies count for one fifth), and the fleet at the coast facing open sea.</p>
        <p>Secret assets: nobody outside governments knows the real numbers. Researched profiles (${C.filter(c => !c.secret.estimated).length} countries) draw on published think-tank, SIPRI, FAS, World Gold Council and SWF Institute estimates; the rest are extrapolated from budget and economy. Treat all figures as informed estimates for gameplay.</p>
      </details></div>`;
    pane.querySelectorAll(".roster button").forEach(b => (b.onclick = () => select(b.dataset.iso)));
    $("#reroll").onclick = () => { G.newGame(false); toast("New random nations unlocked."); refresh(); };
    let armed = false;
    $("#newgame").onclick = e => {
      if (s.player && !armed) { armed = true; e.currentTarget.textContent = "Click again to confirm"; return; }
      G.newGame(false); selected = null; drawDeploy(); toast("New campaign started with fresh random picks."); refresh();
    };
  }

  // ── Tabs / selection / search ──────────────────────────────
  function setTab(t) {
    tab = t;
    document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
    document.querySelectorAll(".pane").forEach(p => (p.hidden = p.id !== "pane-" + t));
    render();
  }
  function render() { tab === "dossier" ? dossier() : tab === "rankings" ? rankings() : campaign(); }
  function refresh() { paint(); render(); coinChip(); }
  function coinChip() { $("#coins").textContent = G.fmtCoins(G.state.coins); }

  // ── Promo codes ────────────────────────────────────────────
  const promo = $("#promo"), promoIn = $("#promo-code"), promoMsg = $("#promo-msg");
  function openPromo() { promo.hidden = false; promoMsg.textContent = ""; promoMsg.className = "promo-msg"; promoIn.value = ""; promoIn.focus(); }
  $("#promo-btn").onclick = () => (promo.hidden ? openPromo() : (promo.hidden = true));
  $("#promo-close").onclick = () => (promo.hidden = true);
  $("#promo-form").onsubmit = e => {
    e.preventDefault();
    const r = G.redeem(promoIn.value);
    promoMsg.className = "promo-msg " + (r.err ? "bad" : "good");
    promoMsg.textContent = r.err || `Redeemed: +${r.amount.toLocaleString("en-US")} coins.`;
    if (!r.err) { promoIn.value = ""; refresh(); }
  };
  document.addEventListener("keydown", e => { if (e.key === "Escape") promo.hidden = true; });
  function select(iso) { selected = iso; paint(); drawDeploy(); setTab("dossier"); $("#pane-dossier").scrollTop = 0; }
  document.querySelectorAll(".tabs button").forEach(b => (b.onclick = () => setTab(b.dataset.tab)));
  document.querySelectorAll(".modes button").forEach(b => (b.onclick = () => {
    mode = b.dataset.mode;
    document.querySelectorAll(".modes button").forEach(x => x.setAttribute("aria-pressed", x === b));
    paint();
  }));

  const q = $("#search"), ul = $("#search-results");
  let hits = [], active = 0;
  function drawHits() {
    ul.hidden = !hits.length;
    ul.innerHTML = hits.map((c, i) => `<li data-iso="${c.iso3}" class="${i === active ? "active" : ""}"><span>${flag(c.iso2)} ${esc(c.name)}</span><small>${G.isLocked(c.iso3) ? "locked" : "playable"}</small></li>`).join("");
    ul.querySelectorAll("li").forEach(li => (li.onmousedown = () => pick(li.dataset.iso)));
  }
  function pick(iso) { q.value = ""; hits = []; drawHits(); select(iso); }
  q.oninput = () => {
    const v = q.value.trim().toLowerCase();
    hits = v ? C.filter(c => c.name.toLowerCase().includes(v) || c.iso3.toLowerCase() === v).slice(0, 12) : [];
    active = 0; drawHits();
  };
  q.onkeydown = e => {
    if (e.key === "ArrowDown") { active = Math.min(hits.length - 1, active + 1); drawHits(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = Math.max(0, active - 1); drawHits(); e.preventDefault(); }
    else if (e.key === "Enter" && hits[active]) pick(hits[active].iso3);
    else if (e.key === "Escape") { hits = []; drawHits(); }
  };
  q.onblur = () => setTimeout(() => { hits = []; drawHits(); }, 100);

  let toastTimer;
  function toast(msg) {
    const t = $(".toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }

  paint();
  coinChip();
  setTab(G.state.player ? "dossier" : "campaign");
})();
