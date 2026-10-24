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
  const kPers = k => k === 0 ? "0" : k >= 1000 ? (k / 1000).toFixed(2) + "M" : k >= 0.95 ? Math.max(1, Math.round(k)) + "k" : Math.round(k * 1000).toString();
  const popFmt = m => m >= 1000 ? (m / 1000).toFixed(2) + "bn" : m >= 1 ? m.toFixed(1) + "M" : Math.round(m * 1000) + "k";
  const flag = iso2 => String.fromCodePoint(...[...iso2].map(ch => 0x1f1a5 + ch.charCodeAt(0)));
  const pct = p => Math.round(p * 100) + "%";
  const fxVal = (k, v) => {
    const kind = window.TRAIT_EFFECTS[k][1], n = +(v * 100).toFixed(1);
    return kind === "coins" ? `+${v}` : kind === "pts" ? `+${n} pts` : kind === "neg" ? `−${n}%` : `+${n}%`;
  };
  const fxList = fx => Object.entries(fx).map(([k, v]) => `<li><span>${window.TRAIT_EFFECTS[k][0]}</span><b>${fxVal(k, v)}</b></li>`).join("");

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
  // Country centres for army routes and travel times.
  window.CENTROIDS = {};
  C.forEach(c => {
    const f = mainFeat[c.iso3], m = markers.find(x => x.c.iso3 === c.iso3);
    window.CENTROIDS[c.iso3] = f ? d3.geoCentroid(f) : m ? m.at : null;
  });
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
  // Which weapons sit at each base. Each type is shared out by the base's ground, air or naval
  // share, weighted by what the base is (fighter wing, submarine base, armoured division...),
  // then rounded so the bases add up to the national inventory.
  const RX = {
    armour: /armou?r|tank|mechani[sz]ed|cavalry|heavy brigade|panzer/i,
    light: /airborne|air assault|marine|mountain|light|special forces|commando|school|academy|headquarters|\bHQ\b|command\b|logistic|training|peacekeep|UN mission|UN peacekeeping|ceremonial|guard/i,
    infantry: /mechani[sz]ed|motori[sz]ed|infantry|armou?r|brigade|division/i,
    arty: /artillery|fires|rocket|MLRS|missile brigade|HIMARS/i,
    fighter: /F-\d|F\/A-18|fighter|Su-\d|MiG|Rafale|Typhoon|Gripen|Mirage|J-\d|JF-17|Tornado|interceptor|strike wing|attack aircraft|combat aircraft/i,
    support: /airlift|transport|tanker|C-1\d\d|C-17|A400M|bomber|B-\d|reconnaissance|AWACS|maritime patrol|P-8|trainer|training|flight school|UAV|drone|U-2/i,
    heli: /helicopter|aviation|Apache|airmobile|air assault|Black Hawk|Mi-\d/i,
    sub: /submarine|SSBN|SSN/i,
    carrier: /carrier|LHD|amphibious assault ship/i,
  };
  const KIT = [
    ["tanks", "tank", "tanks"], ["afv", "armoured vehicle", "armoured vehicles"], ["arty", "artillery piece", "artillery"],
    ["fighters", "fighter/attack jet", "fighter/attack jets"], ["aircraft", "other aircraft", "other aircraft"],
    ["helis", "helicopter", "helicopters"], ["ships", "naval vessel", "naval vessels"], ["subs", "submarine", "submarines"], ["carriers", "carrier", "carriers"],
  ];
  function kitWeight(z, key) {
    const t = z.name + " " + z.note, has = k => RX[k].test(t);
    const army = z.navalPct > z.groundPct || z.airPct > z.groundPct * 3 ? z.groundPct * 0.15 : z.groundPct;
    switch (key) {
      case "tanks": return army * (has("armour") ? 3 : 1) * (has("light") ? 0.25 : 1);
      case "afv": return army * (has("infantry") ? 2 : 1) * (has("light") ? 0.5 : 1);
      case "arty": return army * (has("arty") ? 4 : 1) * (has("light") ? 0.4 : 1);
      case "fighters": return z.airPct * (has("fighter") ? 4 : 1) * (has("support") && !has("fighter") ? 0.3 : 1);
      case "aircraft": return z.airPct * (has("support") ? 4 : 1) * (has("fighter") && !has("support") ? 0.5 : 1);
      case "helis": return (0.6 * z.airPct + 0.4 * z.groundPct) * (has("heli") ? 5 : 1);
      case "ships": return z.navalPct;
      case "subs": return z.navalPct * (has("sub") ? 6 : 0.4);
      case "carriers": return z.navalPct * (has("carrier") ? 10 : 0.2);
    }
    return 0;
  }
  window.computeDeployment = iso => computeDeployment(iso);
  // Every known unit (nukes excluded) is assigned to a base, at home or abroad. During a campaign
  // the totals are the nation's current home pool, so losses and units sent away show up.
  function computeDeployment(iso) {
    const zones = deploymentFor(iso), c = BY[iso];
    const live = G.state.forces[iso];
    const totals = live ? { ...live } : G.baseForces(c);
    zones.forEach(z => (z.kit = {}));
    KIT.forEach(([key]) => {
      const n = Math.round(totals[key] || 0);
      let w = zones.map(z => kitWeight(z, key)), tw = w.reduce((a, b) => a + b, 0);
      // Nowhere fits this kind (e.g. helicopters in a navy-only force): spread it by overall base size.
      if (!tw) { w = zones.map(z => z.groundPct + z.airPct + z.navalPct + 1e-6); tw = w.reduce((a, b) => a + b, 0); }
      if (!n || !tw) return;
      // Largest-remainder rounding keeps whole units that add up to the national total.
      const raw = w.map(x => (n * x) / tw), out = raw.map(Math.floor);
      let left = n - out.reduce((a, b) => a + b, 0);
      raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
      zones.forEach((z, i) => (z.kit[key] = out[i]));
    });
    zones.forEach(z => (z.kit.troops = (totals.troops || 0) * z.groundPct));
    return zones;
  }
  function deploymentFor(iso) {
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
      if (total > 0) zones.forEach(z => (z.groundPct = z.host ? z.ground / total : (z.ground / homeW) * (total - abroadK) / total));
      else norm("ground"); // no standing army: police and border units still hold the ground kit
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
  // States / provinces of the selected country (Natural Earth admin-1, loaded on demand).
  const provLayer = root.append("g").attr("class", "prov-layer");
  const markerSel = root.append("g").selectAll("circle").data(markers).join("circle")
    .attr("class", "marker")
    .on("click", (e, m) => select(m.c.iso3))
    .on("mousemove", (e, m) => showTip(e, { iso: m.c.iso3 }))
    .on("mouseleave", hideTip);
  const deployLayer = root.append("g").attr("class", "deploy-layer");
  const armyLayer = root.append("g").attr("class", "army-layer");
  const fleetLayer = root.append("g").attr("class", "fleet-layer");
  const frontLayer = root.insert("g", ".army-layer").attr("class", "front-layer");
  const satLayer = root.append("g").attr("class", "sat-layer");
  let pickedZone = null;
  const baseCard = document.createElement("div");
  baseCard.className = "basecard";
  baseCard.hidden = true;
  wrap.appendChild(baseCard);

  // ── Unit icons ─────────────────────────────────────────────
  // Soldier, tank, jet and ship silhouettes in three technology tiers: dated (1960s–80s kit,
  // propeller planes, tall tanks, gunboats), standard (modern-ish) and advanced (stealth jets,
  // low angular tanks, stealth destroyers). Colour follows the tier; poorly maintained forces
  // are drawn faded and grey.
  const ICONS = {
    soldier: {
      dated: '<path d="M9 4a3 3 0 0 1 6 0v1H9z"/><path d="M10 6h4v2h-4z"/><path d="M8 9h8l1 7h-2l-1 6h-4l-1-6H7z"/><path d="M17 8l4-6 1 1-4 6z"/>',
      standard: '<path d="M8.5 5a3.5 3.5 0 0 1 7 0v1.5h-7z"/><path d="M10 7h4v2h-4z"/><path d="M7 10h10l1 6h-2l-1 6h-6l-1-6H6z"/><path d="M17 9.5h6V11h-6z"/>',
      advanced: '<path d="M8 5a4 4 0 0 1 8 0v2H8z"/><path d="M10.5 1.2h3v2.6h-3z"/><path d="M10 8h4v1.5h-4z"/><path d="M6.5 10.5h11l.5 5.5h-2l-1 6h-7l-1-6H6z"/><path d="M9 12h6v3H9z" opacity=".45"/><path d="M17 11h6.5v1.5H17z"/><path d="M19.5 9.5h2v1.5h-2z"/>',
    },
    tank: {
      dated: '<path d="M3 14h18l-2 5H5z"/><path d="M8 8.5h7v5.5H8z"/><path d="M15 10.5h4.5V12H15z"/><circle cx="7" cy="17" r="1" opacity=".4"/><circle cx="12" cy="17" r="1" opacity=".4"/><circle cx="17" cy="17" r="1" opacity=".4"/>',
      standard: '<path d="M2 14h20l-2 5H4z"/><path d="M7 10h9l1 4H6z"/><path d="M16 11h7v1.5h-7z"/>',
      advanced: '<path d="M1 15h22l-2 4H3z"/><path d="M6 11.5l2-2.5h8l2 2.5V15H6z"/><path d="M18 11.4h6v1.1h-6z"/><path d="M10 6.5h3V9h-3z"/>',
    },
    jet: {
      dated: '<path d="M11 4h2v3.5h8v3h-8v6h3v2h-8v-2h3v-6H3v-3h8z"/><path d="M8 2.5h8v1H8z"/>',
      standard: '<path d="M12 1l1.5 6 8 5v2l-8-2-.5 6 3 2.5V22l-4-1-4 1v-1.5l3-2.5-.5-6-8 2v-2l8-5z"/>',
      advanced: '<path d="M12 1l3 7 8 7-1 2-6-1-1 3H9l-1-3-6 1-1-2 8-7z"/><path d="M9.3 15.5l-1.2 4h1.4l.8-4zM14.7 15.5l1.2 4h-1.4l-.8-4z" opacity=".55"/>',
    },
    ship: {
      dated: '<path d="M2 15h20l-3 5H5z"/><path d="M8 11h6v4H8z"/><path d="M15 9h2v6h-2z"/><path d="M10 6h1v5h-1z"/>',
      standard: '<path d="M1 15h22l-3 5H4z"/><path d="M7 10h8v5H7z"/><path d="M10 5h1.5v5H10z"/><path d="M3 13h3v2H3z"/>',
      advanced: '<path d="M1 15h22l-4 5H5z"/><path d="M6 15l2-6h7l3 6z"/><path d="M11 4.5h2l1 4.5h-4z"/>',
    },
  };
  const one = body => ({ dated: body, standard: body, advanced: body });
  Object.assign(ICONS, {
    // Wheeled armoured vehicle: long hull on four wheels with a small turret.
    afv: one('<path d="M2 11h18l3 3v3H1v-3z"/><path d="M9 7.5h5V11H9z"/><path d="M14 8.5h5.5v1.2H14z"/><circle cx="5" cy="18" r="2"/><circle cx="10" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>'),
    // Self-propelled gun: low tracked body and a long raised barrel.
    arty: one('<path d="M2 15h14l-1.5 4H3.5z"/><path d="M4 11h8v4H4z"/><path d="M11 11.6l10.2-6.2.8 1.3-10.2 6.2z"/><circle cx="5.5" cy="19.5" r="1.2" opacity=".5"/><circle cx="12" cy="19.5" r="1.2" opacity=".5"/>'),
    // Transport / tanker / bomber: straight wide wings with engine pods.
    transport: one('<path d="M11 1h2l.6 7.5L23 12v2l-9.4-2-.6 6.5 3 2V22l-4-.8-4 .8v-1.5l3-2-.6-6.5L1 14v-2l9.4-3.5z"/><path d="M5 9.5h2v3H5zM17 9.5h2v3h-2z" opacity=".55"/>'),
    // Helicopter: rotor, cabin, tail boom and skids.
    heli: one('<path d="M2 5.5h20v1.2H2z"/><path d="M11.4 6.5h1.2v2.5h-1.2z"/><path d="M6 13a4.5 4 0 0 1 9 0v1.5a3 2.5 0 0 1-3 2.5H9a3 2.5 0 0 1-3-2.5z"/><path d="M14.5 12.4H21v1.4h-6.5z"/><path d="M20 10.2h1.3v5.6H20z"/><path d="M6 19h9v1.1H6z"/>'),
    // Submarine: long hull with a sail.
    sub: one('<path d="M1.5 14.5c0-2 2-3.2 5-3.2h11.5c2.6 0 4.5 1.3 4.5 3.2s-1.9 3.2-4.5 3.2H6.5c-3 0-5-1.2-5-3.2z"/><path d="M9 8h4l.6 3.4H8.4z"/><path d="M10.6 5.5h.9V8h-.9z"/>'),
    // Aircraft carrier: flat deck with an island.
    carrier: one('<path d="M1 13.5h22l-2.2 5H3.6z"/><path d="M15 7.5h3.2v6H15z"/><path d="M16 5h1.2v2.5H16z"/><path d="M3 11.6h11v1.2H3z" opacity=".6"/>'),
  });
  // Icon for each kind of unit.
  const KIT_ICON = { troops: "soldier", tanks: "tank", afv: "afv", arty: "arty", fighters: "jet", aircraft: "transport", helis: "heli", ships: "ship", subs: "sub", carriers: "carrier" };
  Object.entries(ICONS).forEach(([type, tiers]) => Object.entries(tiers).forEach(([tier, body]) =>
    defs.append("symbol").attr("id", `ic-${type}-${tier}`).attr("viewBox", "0 0 24 24").html(body)));

  // Effective technology of a nation's forces: its design generation plus your weapons research.
  const effGen = iso => BY[iso].tech.gen + 0.75 * G.techShare(iso, "weapons");
  const iconClass = iso => `unit-icon tier-${window.techTier(effGen(iso))}${BY[iso].tech.ready < 0.6 ? " worn" : ""}`;
  const iconHref = (type, iso) => `#ic-${type}-${window.techTier(effGen(iso))}`;
  // Most important kind of force at a base: fleet, air wing, armour or infantry.
  // Units at a base or in an army as {key: count}, troops in thousands.
  const zoneUnits = (c, z) => ({ troops: c.active * z.groundPct, ...(z.kit || {}) });
  // Strongest kind of unit (count × combat value) decides the main icon.
  function mainKind(units) {
    let best = "troops", bv = -1;
    window.UNITS.forEach(u => { const v = (units[u.key] || 0) * u.power; if (v > bv) { bv = v; best = u.key; } });
    return KIT_ICON[best];
  }
  const zoneType = (c, z) => mainKind(zoneUnits(c, z));
  const armyType = units => mainKind(units);
  const techLine = iso => { const t = BY[iso].tech; return `Gen ${effGen(iso).toFixed(1)} ${window.techTier(effGen(iso))} kit · readiness ${Math.round(t.ready * 100)}% (${window.readyLabel(t.ready)})`; };

  let k = 1;
  // Markers grow gently up to 10× zoom, then hold their on-screen size for the province and base views.
  // Past 200× they stop growing altogether.
  const shrink = () => (k <= 10 ? Math.sqrt(k) : k <= 200 ? Math.sqrt(10) * Math.pow(k / 10, 0.8) : Math.sqrt(10) * Math.pow(20, 0.8) * (k / 200));
  // The selected country's bases are SVG, sized by their share of its forces. Every other
  // country's bases are drawn on one canvas (far cheaper than ~1,800 SVG groups), fainter and
  // sized by their absolute strength. Zoomed in past 30×, the other bases in view are moved into
  // the SVG layer so they get their unit rings.
  const basePower = z => window.UNITS.reduce((a, u) => a + (z.kit[u.key] || 0) * u.power, 0);
  let maxBasePower = 1;
  function garrR(z) {
    if (z.iso !== selected) return (1.4 + 9 * Math.sqrt(Math.max(z.pw / maxBasePower, 0.0004))) / shrink();
    return (2.5 + 16 * Math.sqrt(Math.max(z.groundPct, z.navalPct * 0.6, z.airPct * 0.5, 0.003))) / shrink();
  }
  const iconR = r => Math.max(r * 1.25, 5 / shrink());
  let allBases = true;
  try { allBases = localStorage.getItem("ww3-bases") !== "off"; } catch (e) { /* storage unavailable */ }
  const zoneKey = z => z.iso + "|" + z.name;
  const isPicked = z => z.iso === selected && z.name === pickedZone;
  // One country's bases, tagged with their country, absolute strength and projected position.
  const basesOf = iso => computeDeployment(iso).map(z => { z.iso = iso; z.pw = basePower(z); z.xy = projection(z.at); return z; });
  let otherBases = [], myBases = [], liftedBases = [];
  function drawDeploy() {
    otherBases = allBases ? C.filter(c => c.iso3 !== selected).flatMap(c => basesOf(c.iso3)) : [];
    myBases = selected ? basesOf(selected) : [];
    maxBasePower = Math.max(1, ...otherBases.concat(myBases).map(z => z.pw));
    otherBases.sort((x, y) => y.pw - x.pw);
    liftBases();
  }
  // Other countries' bases in view at deep zoom join the SVG layer (with unit rings); the rest stay on the canvas.
  function liftBases() {
    const t = d3.zoomTransform(svg.node()), w = wrap.clientWidth, h = wrap.clientHeight;
    liftedBases = k < 30 ? [] : otherBases.filter(z => { const sx = t.applyX(z.xy[0]), sy = t.applyY(z.xy[1]); return sx > -60 && sx < w + 60 && sy > -60 && sy < h + 60; }).slice(0, 150);
    syncBases();
  }
  function syncBases() {
    // Largest rings first so smaller bases sit on top and stay hoverable; the selected country above the rest.
    const zones = liftedBases.concat(myBases.slice().sort((x, y) => garrR(y) - garrR(x)));
    const g = deployLayer.selectAll("g.base").data(zones, zoneKey).join(enter => {
      const e = enter.append("g").attr("class", "base");
      e.append("circle");
      e.append("use");
      e.append("g").attr("class", "kits");
      return e;
    }).order();
    g.classed("other", z => z.iso !== selected);
    // Unit rings are built for the selected country now, and for other bases when first seen up close.
    g.select("g.kits").each(function (z) { if (this.__for === z) return; this.__for = z; this.__built = false; d3.select(this).selectAll("*").remove(); if (z.iso === selected) buildKits(this, z); });
    g.select("circle")
      .attr("class", z => "garrison" + (z.navalPct > z.groundPct ? " naval" : "") + (z.host ? " abroad" : ""))
      .classed("picked", isPicked)
      .on("mousemove", (e, z) => zoneTip(e, z))
      .on("mouseleave", hideTip)
      .on("click", (e, z) => { e.stopPropagation(); openBase(z); });
    g.select("use").attr("href", z => iconHref(zoneType(BY[z.iso], z), z.iso)).attr("class", z => iconClass(z.iso));
    placeBases();
  }
  // Click on a base: its card, opening its country first if it's another country's.
  function openBase(z) {
    hideTip();
    if (z.iso === selected) return pickZone(z, true);
    const name = z.name;
    select(z.iso);
    const own = myBases.find(x => x.name === name);
    if (own) pickZone(own, true);
  }
  // A ring of icons around a base, one per kind of unit stationed there, with counts.
  function buildKits(node, z) {
    node.__built = true;
    const c = BY[z.iso], units = zoneUnits(c, z), kinds = window.UNITS.filter(u => (u.key === "troops" ? units.troops >= 0.05 : units[u.key] >= 1));
    const kg = d3.select(node).selectAll("g.kit").data(kinds.map(u => ({ key: u.key, n: units[u.key], label: u.label })), d => d.key).join(en => {
      const x = en.append("g").attr("class", "kit");
      x.append("circle").attr("class", "kit-bg");
      x.append("use");
      x.append("text");
      return x;
    });
    kg.select("use").attr("href", d => iconHref(KIT_ICON[d.key], z.iso)).attr("class", iconClass(z.iso));
    kg.select("text").text(d => (d.key === "troops" ? kPers(d.n) : num(d.n)));
    kg.on("mousemove", (e, d) => { const ms = window.splitModels(c, d.key, Math.round(d.n));
      tip.innerHTML = `<b>${esc(d.key === "troops" ? kPers(d.n) + " troops" : num(d.n) + " " + d.label.toLowerCase())}</b><div class="k">${esc(z.name)} · ${esc(c.name)}</div>${d.key === "troops" ? `<div class="tipnote">${esc(c.equipment.small)}</div>` : ms.length ? `<div class="tipnote">${ms.map(m => `${num(m[1])} × ${esc(m[0])}`).join("<br>")}</div>` : ""}`; placeTip(e); })
      .on("mouseleave", hideTip);
  }
  function placeBases() {
    deployLayer.selectAll("g.base").each(function (z) {
      const [x, y] = z.xy, r = garrR(z), ir = iconR(r);
      const g = d3.select(this);
      g.select("circle").attr("cx", x).attr("cy", y).attr("r", r);
      g.select("use").attr("x", x - ir / 2).attr("y", y - ir / 2).attr("width", ir).attr("height", ir);
      const kitsNode = g.select("g.kits").node(), kits = d3.select(kitsNode).style("display", k >= 60 ? null : "none");
      if (k < 60) return;
      if (!kitsNode.__built) buildKits(kitsNode, z);
      const items = kits.selectAll("g.kit"), n = items.size(), s2 = 18 / k, R = r + s2 * 1.2 + n * 1.5 / k;
      items.each(function (d, i) {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, n), kx = x + R * Math.cos(a), ky = y + R * Math.sin(a);
        const it = d3.select(this);
        it.select("circle").attr("cx", kx).attr("cy", ky).attr("r", s2 * 0.75);
        it.select("use").attr("x", kx - s2 / 2).attr("y", ky - s2 / 2).attr("width", s2).attr("height", s2);
        it.select("text").attr("x", kx).attr("y", ky + s2 * 1.3).style("font-size", 10 / k + "px").style("stroke-width", 2.5 / k + "px");
      });
    });
    drawBaseCanvas();
  }

  // ── Canvas of other countries' bases ──
  const baseCv = document.createElement("canvas");
  baseCv.className = "base-canvas";
  wrap.insertBefore(baseCv, svg.node().nextSibling);
  // Unit icons rasterised once per kind and colour, for drawing on the canvas.
  const TIER_COL = { advanced: "#9eefff", standard: "#f0c66a", dated: "#b98a5e" };
  const iconImgs = {};
  function iconImg(type, tier) {
    const key = type + "-" + tier;
    if (!iconImgs[key]) {
      const img = new Image();
      img.onload = () => { img.ready = true; drawBaseCanvas(); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="${TIER_COL[tier]}">${ICONS[type][tier]}</svg>`);
      iconImgs[key] = img;
    }
    return iconImgs[key];
  }
  let baseDrawn = [], baseFrame = 0;
  function drawBaseCanvas() {
    if (baseFrame) return;
    baseFrame = requestAnimationFrame(() => {
      baseFrame = 0;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (baseCv.width !== Math.round(w * DPR) || baseCv.height !== Math.round(h * DPR)) { baseCv.width = Math.round(w * DPR); baseCv.height = Math.round(h * DPR); }
      const ctx = baseCv.getContext("2d");
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      baseDrawn = [];
      if (!otherBases.length) return;
      const t = d3.zoomTransform(svg.node()), lifted = new Set(liftedBases), icons = k >= 4;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      // Smallest last so they sit on top, as in the SVG layer.
      for (const z of otherBases) {
        if (lifted.has(z)) continue;
        const sx = t.applyX(z.xy[0]), sy = t.applyY(z.xy[1]), r = garrR(z) * k;
        if (sx < -r || sx > w + r || sy < -r || sy > h + r) continue;
        const naval = z.navalPct > z.groundPct;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#0c131699";
        ctx.fill();
        ctx.setLineDash(z.host ? [3, 2] : []);
        ctx.strokeStyle = naval ? COL.teal : COL.brass;
        ctx.stroke();
        if (icons) {
          const tier = window.techTier(effGen(z.iso)), img = iconImg(zoneType(BY[z.iso], z), tier), ir = iconR(r / k) * k;
          if (img.ready) {
            ctx.globalAlpha = BY[z.iso].tech.ready < 0.6 ? 0.3 : 0.6;
            ctx.drawImage(img, sx - ir / 2, sy - ir / 2, ir, ir);
            ctx.globalAlpha = 0.6;
          }
        }
        baseDrawn.push({ z, sx, sy, r });
      }
      ctx.setLineDash([]);
    });
  }
  // Hover and click for canvas bases. SVG markers (your bases, armies, ships) keep priority.
  function canvasBaseAt(e) {
    if (!baseDrawn.length || e.target.closest(".base, .army, .ship, .kit, .sat")) return null;
    const rect = wrap.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
    let hit = null;
    for (const b of baseDrawn) { const d = Math.hypot(b.sx - x, b.sy - y); if (d <= Math.max(b.r, 4) + 1) hit = b; } // last drawn is on top
    return hit && hit.z;
  }
  svg.node().addEventListener("mousemove", e => {
    const z = canvasBaseAt(e);
    svg.classed("on-base", !!z);
    if (z) { e.stopPropagation(); zoneTip(e, z); }
  }, true);
  svg.node().addEventListener("click", e => {
    const z = canvasBaseAt(e);
    if (z) { e.stopPropagation(); openBase(z); }
  }, true);
  // ── Terrain ───────────────────────────────────────────────
  // NASA Blue Marble (topography and bathymetry, December 2004, public domain) warped onto the
  // map's Natural Earth projection. The equirectangular image is cut into small longitude /
  // latitude cells and each is drawn with its own affine transform, so no pixels are read back
  // and it also works when the game is opened from a file. A world layer is drawn once; a sharper
  // patch is drawn for the selected country or province from 45° × 45° tiles of a 10,800-pixel image.
  const attrib = document.createElement("div");
  attrib.className = "attrib";
  wrap.appendChild(attrib);
  // Credits for every source drawn in the current view.
  const CREDITS = {
    esri: "Esri World Imagery: Esri, Maxar, Earthstar Geographics and the GIS User Community",
    roads: "Roads and places: Esri, HERE, Garmin, © OpenStreetMap contributors",
    osm: `Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors`,
    google: `<b>Google</b> · Map data and imagery ©${new Date().getFullYear()} Google`,
    s2: `<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless 2016</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016), CC BY 4.0`,
  };
  let credits = new Set();
  function credit(src) {
    const k2 = src === "labels" ? "roads" : src;
    if (credits.has(k2)) return;
    credits.add(k2);
    attribution();
  }
  function attribution(reset) {
    if (reset) credits = new Set();
    attrib.hidden = !terrainOn;
    attrib.innerHTML = [`Imagery: NASA Blue Marble`].concat([...credits].map(c => CREDITS[c])).join(" · ");
  }
  const terrainBox = document.createElement("div");
  terrainBox.className = "terrain";
  wrap.insertBefore(terrainBox, wrap.firstChild);
  const worldCv = document.createElement("canvas"), detailCv = document.createElement("canvas"), overlayCv = document.createElement("canvas");
  terrainBox.append(worldCv, detailCv, overlayCv);
  let terrainOn = true;
  try { terrainOn = localStorage.getItem("ww3-terrain") !== "off"; } catch (e) { /* storage unavailable */ }
  const imgCache = {};
  const loadImg = src => imgCache[src] || (imgCache[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
  // Streamed satellite tiles: EOX Sentinel-2 cloudless 2016 (CC BY 4.0), about 10 m per pixel,
  // in WGS84 tiles of 256 px that span 180° / 2^z. Kept in a small cache (oldest dropped).
  const S2_URL = (z, row, col) => `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless/default/WGS84/${z}/${row}/${col}.jpg`;
  const s2Cache = new Map();
  function loadS2(z, row, col) {
    const key = `${z}/${row}/${col}`;
    if (s2Cache.has(key)) { const v = s2Cache.get(key); s2Cache.delete(key); s2Cache.set(key, v); return v; }
    const p = new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = S2_URL(z, row, col); });
    s2Cache.set(key, p);
    if (s2Cache.size > 400) s2Cache.delete(s2Cache.keys().next().value);
    p.catch(() => s2Cache.delete(key));
    return p;
  }
  const S2_FROM = 40; // zoom at which Sentinel-2 takes over if Esri imagery is unavailable
  // Streamed Web Mercator tile layers (256 px), like a navigation app:
  //  · Esri World Imagery: aerial and satellite photos, sub-metre in most populated areas.
  //  · Esri World Transportation + Boundaries and Places: roads, railways and place names,
  //    laid over the photos in the Hybrid style.
  //  · OpenStreetMap: the street map behind most navigation apps, for the Map style.
  //  · Google Maps (Map Tiles API), used instead of all of these when you add your own API key.
  // If Esri imagery can't load, Sentinel-2 and then the bundled NASA terrain are used instead.
  const ESRI = name => (z, y, x) => `https://server.arcgisonline.com/ArcGIS/rest/services/${name}/MapServer/tile/${z}/${y}/${x}`;
  const TILES = {
    esri: { url: ESRI("World_Imagery"), max: 19 },
    roads: { url: ESRI("Reference/World_Transportation"), max: 19 },
    labels: { url: ESRI("Reference/World_Boundaries_and_Places"), max: 19 },
    osm: { url: (z, y, x) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`, max: 19 },
    google: { url: (z, y, x) => `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?session=${gSess[mapStyle].session}&key=${encodeURIComponent(googleKey)}`, max: 22 },
  };
  let esriOK = true;
  const tileCache = new Map();
  function loadTile(src, z, y, x) {
    const key = `${src}/${src === "google" ? mapStyle : ""}/${z}/${y}/${x}`;
    if (tileCache.has(key)) { const v = tileCache.get(key); tileCache.delete(key); tileCache.set(key, v); return v; }
    const url = TILES[src].url(z, y, x);
    const p = new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = url; });
    tileCache.set(key, p);
    if (tileCache.size > 900) tileCache.delete(tileCache.keys().next().value);
    p.catch(() => tileCache.delete(key));
    return p;
  }
  // Map style: "satellite" (photos), "hybrid" (photos with roads and names) or "map" (street map).
  const MAP_STYLES = { satellite: "Satellite", hybrid: "Hybrid", map: "Map" };
  let mapStyle = "hybrid", googleKey = "";
  try { mapStyle = MAP_STYLES[localStorage.getItem("ww3-mapstyle")] ? localStorage.getItem("ww3-mapstyle") : "hybrid"; googleKey = localStorage.getItem("ww3-gmaps-key") || ""; } catch (e) { /* storage unavailable */ }
  // Google Map Tiles API sessions, one per style, created with the player's own key.
  const gSess = {};
  function googleSession() {
    if (!googleKey) return null;
    const s = gSess[mapStyle];
    if (s && s.session && s.expiry * 1000 > Date.now() + 60000) return s;
    if (s && (s.pending || s.failed)) return null;
    gSess[mapStyle] = { pending: true };
    const body = { mapType: mapStyle === "map" ? "roadmap" : "satellite", language: "en-US", region: "US" };
    if (mapStyle === "hybrid") body.layerTypes = ["layerRoadmap"];
    fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(googleKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json().then(j => { if (!r.ok || !j.session) throw new Error((j.error && j.error.message) || r.statusText); return j; }))
      .then(j => { gSess[mapStyle] = { session: j.session, expiry: +j.expiry }; drawViewTerrain(); })
      .catch(err => { gSess[mapStyle] = { failed: true }; toast(`Google Maps tiles unavailable (${err.message}). Using Esri and OpenStreetMap instead.`); });
    return null;
  }
  const mercY = lat => { const r = (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; };
  const tileLat = (y, n) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  // Draw Web Mercator tiles covering the view onto a canvas. Each tile's layers are drawn in order
  // once all of them have loaded (roads under names). Overlays use no cell overlap, so their
  // semi-transparent pixels aren't doubled along cell seams.
  function drawTiles(job, v, cv, layers, onFail) {
    const screenPpd = (v.w * DPR) / Math.max(1e-9, v.lon1 - v.lon0), max = Math.min(...layers.map(l => TILES[l].max));
    let z = 2;
    // Oversample ~1.6× (one level finer than strictly needed) so full zoom stays crisp.
    while (z < max && (256 * 2 ** z) / 360 < screenPpd * 1.6) z++;
    const n = 2 ** z;
    const x0 = Math.max(0, Math.floor(((v.lon0 + 180) / 360) * n)), x1 = Math.min(n - 1, Math.floor(((v.lon1 + 180) / 360) * n));
    const y0 = Math.max(0, Math.floor(mercY(Math.min(85, v.lat1)) * n)), y1 = Math.min(n - 1, Math.floor(mercY(Math.max(-85, v.lat0)) * n));
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 160) return;
    const ctx = cv.getContext("2d"), overlay = cv === overlayCv;
    ctx.imageSmoothingQuality = "high";
    let failed = 0;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const tl0 = (tx / n) * 360 - 180, tl1 = ((tx + 1) / n) * 360 - 180, tb1 = tileLat(ty, n), tb0 = tileLat(ty + 1, n);
      const src = (lon, lat) => [((lon + 180) / 360) * n * 256 - tx * 256, mercY(lat) * n * 256 - ty * 256];
      const step = Math.min(v.step, tl1 - tl0, tb1 - tb0);
      Promise.all(layers.map(l => loadTile(l, z, ty, tx))).then(imgs => {
        if (job !== detailJob) return;
        imgs.forEach(img => drawMapped(ctx, img, src, Math.max(v.lon0, tl0), Math.min(v.lon1, tl1), Math.max(v.lat0, tb0), Math.min(v.lat1, tb1), step, v.s, v.x0, v.y0, overlay ? 0 : 0.08));
        layers.forEach(l => credit(l));
      }).catch(() => { if (++failed === 1 && job === detailJob && onFail) onFail(); });
    }
  }
  let worldBox = null, detailBox = null, overlayBox = null, detailJob = 0;
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  // Projected bounding box (at zoom 1) of a lon/lat rectangle, from a grid of sample points.
  function boxOf(lon0, lon1, lat0, lat1) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
      const p = projection([lon0 + (lon1 - lon0) * i / 12, lat0 + (lat1 - lat0) * j / 12]);
      if (!p) continue;
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    return { x0, y0, x1, y1 };
  }
  // Draw the part of one image (covering lon ilon0.., lat ..ilat1 at ppd pixels per degree) that
  // falls in [lonA, lonB] × [latA, latB], in cells of `step` degrees, onto a canvas whose pixel
  // (0,0) is projected point (ox, oy) and which has s canvas pixels per map unit.
  function drawCells(ctx, img, ilon0, ilat1, ppd, lonA, lonB, latA, latB, step, s, ox, oy) {
    const ilon1 = ilon0 + img.width / ppd, ilat0 = ilat1 - img.height / ppd, pad = step * 0.08;
    for (let lon = lonA; lon < lonB - 1e-9; lon += step) {
      for (let lat = latB; lat > latA + 1e-9; lat -= step) {
        const e1 = Math.min(lon + step + pad, lonB + pad, ilon1), e0 = Math.max(lat - step - pad, latA - pad, ilat0);
        const sx = (lon - ilon0) * ppd, sy = (ilat1 - lat) * ppd, sw = (e1 - lon) * ppd, sh = (lat - e0) * ppd;
        if (sw <= 0 || sh <= 0) continue;
        const p0 = projection([lon, lat]), p1 = projection([e1, lat]), p2 = projection([lon, e0]);
        ctx.setTransform((p1[0] - p0[0]) * s / sw, (p1[1] - p0[1]) * s / sw, (p2[0] - p0[0]) * s / sh, (p2[1] - p0[1]) * s / sh, (p0[0] - ox) * s, (p0[1] - oy) * s);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // Same idea for any image whose pixel position is a function of lon/lat (e.g. Web Mercator tiles).
  function drawMapped(ctx, img, src, lonA, lonB, latA, latB, step, s, ox, oy, overlap = 0.08) {
    const pad = step * overlap;
    for (let lon = lonA; lon < lonB - 1e-12; lon += step) {
      for (let lat = latB; lat > latA + 1e-12; lat -= step) {
        const e1 = Math.min(lon + step + pad, lonB), e0 = Math.max(lat - step - pad, latA);
        const [sx, sy] = src(lon, lat), sw = src(e1, lat)[0] - sx, sh = src(lon, e0)[1] - sy;
        if (sw <= 0 || sh <= 0) continue;
        const p0 = projection([lon, lat]), p1 = projection([e1, lat]), p2 = projection([lon, e0]);
        ctx.setTransform((p1[0] - p0[0]) * s / sw, (p1[1] - p0[1]) * s / sw, (p2[0] - p0[0]) * s / sh, (p2[1] - p0[1]) * s / sh, (p0[0] - ox) * s, (p0[1] - oy) * s);
        ctx.drawImage(img, Math.max(0, sx), Math.max(0, sy), Math.min(sw, img.width - sx), Math.min(sh, img.height - sy), 0, 0, Math.min(sw, img.width - sx), Math.min(sh, img.height - sy));
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawWorldTerrain() {
    if (!terrainOn) return;
    loadImg("vendor/terrain/world.jpg?v=15").then(img => {
      const b = path.bounds({ type: "Sphere" }), [x0, y0] = b[0], [x1, y1] = b[1];
      const s = Math.min(2 * DPR, 4096 / (x1 - x0));
      worldCv.width = Math.ceil((x1 - x0) * s); worldCv.height = Math.ceil((y1 - y0) * s);
      const ctx = worldCv.getContext("2d");
      ctx.save();
      ctx.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
      ctx.beginPath(); d3.geoPath(projection, ctx)({ type: "Sphere" }); ctx.clip();
      drawCells(ctx, img, -180, 90, img.width / 360, -180, 180, -90, 90, 3, s, x0, y0);
      ctx.restore();
      worldBox = { x0, y0, x1, y1, cv: worldCv, kr: 1 };
      positionTerrain(d3.zoomTransform(svg.node()));
    }).catch(() => {});
  }
  // Sharper terrain for whatever is on screen, redrawn at screen resolution whenever zooming
  // or panning stops (a single stretched image turns black at deep zoom). Mid zoom uses 45°
  // tiles of a 10,800-px world; province and base zoom use 22.5° tiles of a 21,600-px world.
  let viewTimer = null;
  const scheduleView = () => { clearTimeout(viewTimer); viewTimer = setTimeout(drawViewTerrain, 160); };
  function drawViewTerrain() {
    const job = ++detailJob;
    const t = d3.zoomTransform(svg.node());
    attribution(true);
    if (!terrainOn || t.k < 2.5) { detailBox = overlayBox = null; detailCv.style.display = overlayCv.style.display = "none"; return; }
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const x0 = -t.x / t.k, y0 = -t.y / t.k, x1 = (w - t.x) / t.k, y1 = (h - t.y) / t.k;
    let lon0 = 180, lon1 = -180, lat0 = 90, lat1 = -90, any = false;
    for (let i = 0; i <= 14; i++) for (let j = 0; j <= 14; j++) {
      const g = projection.invert([x0 + (x1 - x0) * i / 14, y0 + (y1 - y0) * j / 14]);
      if (!g || !isFinite(g[0]) || Math.abs(g[1]) > 90) continue;
      any = true;
      lon0 = Math.min(lon0, g[0]); lon1 = Math.max(lon1, g[0]); lat0 = Math.min(lat0, g[1]); lat1 = Math.max(lat1, g[1]);
    }
    if (!any) return;
    const pl = (lon1 - lon0) * 0.06 + 0.0005, pt = (lat1 - lat0) * 0.06 + 0.0005;
    lon0 = Math.max(-180, lon0 - pl); lon1 = Math.min(180, lon1 + pl); lat0 = Math.max(-90, lat0 - pt); lat1 = Math.min(90, lat1 + pt);
    const s = t.k * DPR, step = Math.max(0.00005, Math.min(3, (lon1 - lon0) / Math.max(6, w / 28)));
    const hi = t.k >= 25, deg = hi ? 22.5 : 45, dir = hi ? "hi" : "tiles";
    const tiles = [];
    for (let tx = 0; tx < 360 / deg; tx++) for (let ty = 0; ty < 180 / deg; ty++) {
      const tl0 = -180 + deg * tx, tl1 = tl0 + deg, tb1 = 90 - deg * ty, tb0 = tb1 - deg;
      if (tl1 > lon0 && tl0 < lon1 && tb1 > lat0 && tb0 < lat1) tiles.push({ tx, ty, tl0, tl1, tb0, tb1 });
    }
    if (tiles.length > 24) return; // too wide a view for detail; the world layer covers it
    Promise.all(tiles.map(tl => loadImg(`vendor/terrain/${dir}/${tl.tx}_${tl.ty}.jpg?v=15`).then(img => ({ ...tl, img })))).then(list => {
      if (job !== detailJob) return;
      const cv = document.createElement("canvas");
      cv.width = Math.ceil((x1 - x0) * s); cv.height = Math.ceil((y1 - y0) * s);
      const ctx = cv.getContext("2d");
      ctx.save();
      ctx.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
      ctx.beginPath(); d3.geoPath(projection, ctx)({ type: "Sphere" }); ctx.clip();
      list.forEach(tl => drawCells(ctx, tl.img, tl.tl0, tl.tb1, tl.img.width / deg,
        Math.max(lon0, tl.tl0), Math.min(lon1, tl.tl1), Math.max(lat0, tl.tb0), Math.min(lat1, tl.tb1), step, s, x0, y0));
      ctx.restore();
      // Swap in the finished canvas so the old view stays up while the new one draws.
      detailCv.width = cv.width; detailCv.height = cv.height;
      detailCv.getContext("2d").drawImage(cv, 0, 0);
      detailBox = { x0, y0, x1, y1, cv: detailCv, kr: t.k };
      overlayCv.width = cv.width; overlayCv.height = cv.height;
      overlayBox = { x0, y0, x1, y1, cv: overlayCv, kr: t.k };
      detailCv.style.display = overlayCv.style.display = "";
      positionTerrain(d3.zoomTransform(svg.node()));
      const view = { x0, y0, x1, y1, lon0, lon1, lat0, lat1, s, step, w, k: t.k };
      const fallback = () => { esriOK = false; if (t.k >= S2_FROM) drawS2(job, view); };
      if (googleSession()) return drawTiles(job, view, detailCv, ["google"], () => { gSess[mapStyle] = { failed: true }; drawViewTerrain(); });
      if (mapStyle === "map") return drawTiles(job, view, detailCv, ["osm"], () => esriOK && drawTiles(job, view, detailCv, ["esri"], fallback));
      if (esriOK) drawTiles(job, view, detailCv, ["esri"], fallback); else if (t.k >= S2_FROM) drawS2(job, view);
      // Roads, railways and place names, once the view is regional rather than continental.
      if (mapStyle === "hybrid" && t.k >= 6) drawTiles(job, view, overlayCv, ["roads", "labels"]);
    }).catch(() => {});
  }
  // Sharper Sentinel-2 tiles drawn over the bundled terrain as they arrive. If they can't load
  // (offline, blocked), the NASA terrain underneath stays.
  function drawS2(job, v) {
    // Pick the tile level whose pixels are at least as fine as the screen's.
    const screenPpd = (v.w * DPR) / Math.max(1e-6, v.lon1 - v.lon0);
    let z = 3;
    while (z < 14 && (256 * 2 ** z) / 180 < screenPpd) z++;
    const span = 180 / 2 ** z;
    const c0 = Math.max(0, Math.floor((v.lon0 + 180) / span)), c1 = Math.min(2 ** (z + 1) - 1, Math.floor((v.lon1 + 180) / span));
    const r0 = Math.max(0, Math.floor((90 - v.lat1) / span)), r1 = Math.min(2 ** z - 1, Math.floor((90 - v.lat0) / span));
    if ((c1 - c0 + 1) * (r1 - r0 + 1) > 80) return;
    const ctx = detailCv.getContext("2d");
    const step = Math.min(v.step, span);
    for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
      const tl0 = -180 + col * span, tb1 = 90 - row * span;
      loadS2(z, row, col).then(img => {
        if (job !== detailJob) return;
        drawCells(ctx, img, tl0, tb1, 256 / span, Math.max(v.lon0, tl0), Math.min(v.lon1, tl0 + span), Math.max(v.lat0, tb1 - span), Math.min(v.lat1, tb1), step, v.s, v.x0, v.y0);
        credit("s2");
      }).catch(() => {});
    }
  }
  // Each canvas is laid out at the zoom it was drawn for (kr) and only scaled by the change since,
  // so a deep-zoom canvas isn't squeezed into a sub-pixel box and blown up again.
  function positionTerrain(t) {
    [worldBox, detailBox, overlayBox].forEach(bx => {
      if (!bx) return;
      bx.cv.style.width = (bx.x1 - bx.x0) * bx.kr + "px"; bx.cv.style.height = (bx.y1 - bx.y0) * bx.kr + "px";
      bx.cv.style.transform = `translate(${t.x + t.k * bx.x0}px, ${t.y + t.k * bx.y0}px) scale(${t.k / bx.kr})`;
    });
  }
  // Cycle or set the zoomed-in map style; Google sessions are per style.
  function setMapStyle(st) {
    mapStyle = st;
    try { localStorage.setItem("ww3-mapstyle", st); } catch (e) { /* ignore */ }
    const b = $("#zstyle");
    b.title = `Map style: ${MAP_STYLES[st]} (click to change)`;
    b.dataset.style = st;
    if (!terrainOn) setTerrain(true); else drawViewTerrain();
    if (tab === "campaign") render();
  }
  function setGoogleKey(key) {
    googleKey = (key || "").trim();
    try { googleKey ? localStorage.setItem("ww3-gmaps-key", googleKey) : localStorage.removeItem("ww3-gmaps-key"); } catch (e) { /* ignore */ }
    Object.keys(gSess).forEach(k2 => delete gSess[k2]);
    drawViewTerrain();
  }
  function setTerrain(on) {
    terrainOn = on;
    try { localStorage.setItem("ww3-terrain", on ? "on" : "off"); } catch (e) { /* ignore */ }
    wrap.classList.toggle("terrain-on", on);
    terrainBox.hidden = !on;
    $("#zterrain").setAttribute("aria-pressed", on);
    if (on) { if (!worldBox) drawWorldTerrain(); drawViewTerrain(); }
    paint();
  }

  const zoom = d3.zoom().scaleExtent([1, 30000]).on("zoom", e => {
    k = e.transform.k;
    root.attr("transform", e.transform);
    positionTerrain(e.transform);
    scheduleView();
    // SVG patterns break up at deep zoom, so locked countries switch to a plain fill past 6×.
    if ((k > 6) !== deepZoom || (k > 25) !== streetZoom) { deepZoom = k > 6; streetZoom = k > 25; paint(); }
    markerSel.attr("r", 3.2 / shrink());
    placeBases();
    placeArmies();
    placeShips();
  }).on("end", () => liftBases());
  svg.call(zoom).on("dblclick.zoom", null);

  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    projection.fitExtent([[8, 8], [w - 8, h - 8]], { type: "Sphere" });
    sphere.attr("d", path); grat.attr("d", path); countryPaths.attr("d", path);
    provLayer.selectAll("path").attr("d", path);
    markerSel.attr("cx", m => projection(m.at)[0]).attr("cy", m => projection(m.at)[1]).attr("r", 3.2 / Math.sqrt(k));
    zoom.translateExtent([[-w * 0.2, -h * 0.2], [w * 1.2, h * 1.2]]);
    drawDeploy();
    drawArmies();
    drawShips();
    worldBox = null;
    drawWorldTerrain();
    scheduleView();
  }
  // Army routes (dashed lines) and unit icons for armies on the move, battles, revolts and stations.
  // Icons show each army's main unit type in its nation's technology tier.
  // ── Fronts: invasions advance as a wave ─────────────────────
  // Each war draws the ground the attacker holds as a ragged wave spreading from where it
  // crossed in (the border or coast point nearest the attacker) across the country, clipped to
  // the country's outline. Its reach follows the war's progress, so the front moves turn by turn.
  function dest([lon, lat], brg, d) {
    const p1 = (lat * Math.PI) / 180, l1 = (lon * Math.PI) / 180, th = (brg * Math.PI) / 180;
    const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(th));
    const l2 = l1 + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    return [((((l2 * 180) / Math.PI) + 540) % 360) - 180, (p2 * 180) / Math.PI];
  }
  function frontGeom(fr) {
    const f = mainFeat[fr.to], src = window.CENTROIDS[fr.from] || window.CENTROIDS[fr.nat];
    if (!f || !src) return null;
    const ring = [], geo = f.geometry;
    (geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates).forEach(poly => poly[0].forEach(v => ring.push(v)));
    let entry = ring[0], bd = Infinity;
    ring.forEach(v => { const d = d3.geoDistance(v, src); if (d < bd) { bd = d; entry = v; } });
    let reach = 0;
    ring.forEach(v => (reach = Math.max(reach, d3.geoDistance(v, entry))));
    const R = Math.min(Math.PI / 2.2, Math.max(0.05, fr.p) * reach * 1.02), ph = G.state.turn * 0.9 + fr.to.charCodeAt(0);
    // Bearings run clockwise, which d3 reads as a small polygon around the entry point.
    const pts = d3.range(0, 361, 3).map(b => { const a = (b * Math.PI) / 180; return dest(entry, b, R * (1 + 0.08 * Math.sin(5 * a + ph) + 0.05 * Math.sin(11 * a + ph * 1.7))); });
    return { type: "Polygon", coordinates: [pts] };
  }
  function drawFronts() {
    const list = G.state.player ? G.fronts() : [];
    const clips = defs.selectAll("clipPath.front-clip").data(list, d => d.to).join(en => { const e = en.append("clipPath").attr("class", "front-clip"); e.append("path"); return e; });
    clips.attr("id", d => "fc-" + d.to).select("path").attr("d", d => path({ type: "FeatureCollection", features: features.filter(f => f.iso === d.to) }));
    const g = frontLayer.selectAll("g.frontline").data(list, d => d.to).join(en => { const e = en.append("g").attr("class", "frontline"); e.append("path").attr("class", "front-area"); e.append("path").attr("class", "front-edge"); return e; });
    g.attr("clip-path", d => `url(#fc-${d.to})`).attr("data-kind", d => d.kind);
    g.each(function (d) { const geo = frontGeom(d), dd = geo ? path(geo) : null; d3.select(this).selectAll("path").attr("d", dd); });
  }

  // ── Satellites: the selected country's constellations in orbit ─────────
  // A sample of up to 60 satellites (government in cyan, private in white, private mobilised for
  // war in gold) moving along ground tracks at a sped-up rate. Geostationary satellites hold
  // their spot over the equator. Shown at world zoom; the 🛰 button toggles them.
  let satsOn = true, satAnim = null;
  try { satsOn = localStorage.getItem("ww3-sats") !== "off"; } catch (e) { /* ignore */ }
  function satSample(c) {
    let seed = [...c.iso3].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 11);
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const g = c.space.gov, out = [];
    const kinds = [["recon", 97, 1, "gov"], ["sigint", 63, 1, "gov"], ["comms", 0, 0, "gov"], ["nav", 55, 0.5, "gov"], ["warn", 0, 0, "gov"]].map(([k, inc, sp, who]) => [g[k], inc, sp, who, k]);
    c.space.priv.forEach(([n, cnt, t]) => kinds.push([cnt, t === "comms" ? 53 : 97, 1, "priv", n]));
    const tot = kinds.reduce((a, x) => a + x[0], 0);
    if (!tot) return out;
    const lon0 = (window.CENTROIDS[c.iso3] || [0, 0])[0];
    kinds.forEach(([cnt, inc, sp, who, name]) => {
      const n = Math.min(cnt, Math.max(cnt > 0 ? 1 : 0, Math.round((60 * cnt) / tot)));
      for (let i = 0; i < n; i++) {
        const geo = sp === 0;
        out.push({ who, name, geo, inc: (inc * Math.PI) / 180, raan: rnd() * 2 * Math.PI, u: rnd() * 2 * Math.PI, rate: (0.25 + 0.1 * rnd()) * sp, glon: lon0 + (rnd() - 0.5) * 60 });
      }
    });
    return out;
  }
  function drawSats() {
    cancelAnimationFrame(satAnim);
    const c = selected && BY[selected];
    const sats = satsOn && c ? satSample(c) : [];
    const war = c && G.state.player ? G.atWar(c.iso3) : false;
    satLayer.selectAll("circle").data(sats).join("circle").attr("class", d => "sat " + (d.who === "gov" ? "gov" : war ? "mob" : "priv"))
      .on("mousemove", (e, d) => { tip.innerHTML = `<b>${esc(d.who === "gov" ? `${c.name} government satellite` : d.name)}</b><div class="k">${d.who === "gov" ? esc(d.name) : war ? "Private, mobilised for the war effort" : "Private (joins the national effort in wartime)"}${d.geo ? " · geostationary" : ""}</div>`; placeTip(e); })
      .on("mouseleave", hideTip);
    if (!sats.length) return;
    const t0 = performance.now();
    const step = () => {
      const t = (performance.now() - t0) / 1000, show = k < 8;
      satLayer.style("display", show ? null : "none");
      if (show) satLayer.selectAll("circle").each(function (d) {
        let lon, lat;
        if (d.geo) { lon = d.glon; lat = 0; } else {
          const u = d.u + d.rate * t;
          lat = (Math.asin(Math.sin(d.inc) * Math.sin(u)) * 180) / Math.PI;
          lon = ((((d.raan + Math.atan2(Math.cos(d.inc) * Math.sin(u), Math.cos(u)) - 0.02 * t) * 180) / Math.PI + 540) % 360) - 180;
        }
        const p = projection([lon, lat]);
        d3.select(this).attr("cx", p[0]).attr("cy", p[1]).attr("r", 2.2 / Math.sqrt(k));
      });
      satAnim = requestAnimationFrame(step);
    };
    step();
  }

  function drawArmies() {
    drawFronts();
    const s = G.state, P = window.CENTROIDS;
    const moving = s.armies.filter(a => !G.arrived(a) && P[a.from] && P[a.to]);
    const foes = s.enemies.filter(e => !G.arrived(e) && (!e.vsPlayer || e.detected) && P[e.from] && P[e.to]);
    armyLayer.selectAll("path").data([...moving, ...foes.map(e => ({ ...e, enemy: true }))]).join("path").attr("class", a => "route" + (a.enemy ? (a.vsPlayer ? " enemy" : " aiwar") : ""))
      .attr("d", a => path({ type: "LineString", coordinates: [P[a.from], P[a.to]] }));
    const marks = [];
    const progress = a => Math.max(0.15, Math.min(0.9, (s.turn - a.sent) / Math.max(1, a.eta - a.sent)));
    const name = iso => esc(BY[iso].name);
    moving.forEach(a => marks.push({ at: d3.geoInterpolate(P[a.from], P[a.to])(progress(a)), kind: "move", type: armyType(a.units), nat: a.nat, go: a.to,
      tip: `<b>Army ${a.id}</b><div class="k">${name(a.nat)} units → ${name(a.to)}, arrives turn ${a.eta}</div>` }));
    foes.forEach(e => marks.push({ at: d3.geoInterpolate(P[e.from], P[e.to])(progress(e)), kind: e.vsPlayer ? "attack" : "aiwar", type: armyType(e.units), nat: e.nat, go: e.to,
      tip: `<b>${name(e.nat)} ${e.vsPlayer ? "attack force" : "invasion force"}</b><div class="k">→ ${name(e.to)}, arrives turn ${e.eta}</div>` }));
    const seen = new Set();
    s.armies.filter(G.arrived).forEach(a => {
      const kind = !G.owns(a.to) ? "war" : G.inRevolt(a.to) ? "revolt" : a.to === a.nat ? null : "station";
      if (!kind || seen.has(a.to) || !P[a.to]) return;
      seen.add(a.to);
      marks.push({ at: P[a.to], kind, type: armyType(a.units), nat: a.nat, go: a.to,
        tip: `<b>${name(a.to)}</b><div class="k">${{ war: "Battle", revolt: "Revolt", station: "Your army is stationed here" }[kind]}</div>` });
    });
    Object.keys(s.revolts).forEach(iso => { if (!seen.has(iso) && P[iso]) { seen.add(iso); marks.push({ at: P[iso], kind: "revolt", type: "soldier", nat: iso, go: iso, tip: `<b>${name(iso)}</b><div class="k">Revolt</div>` }); } });
    s.enemies.filter(G.arrived).forEach(e => { if (P[e.to]) marks.push({ at: P[e.to], kind: e.vsPlayer ? "attack" : "aiwar", type: armyType(e.units), nat: e.nat, go: e.to, off: true, tip: `<b>${name(e.to)}</b><div class="k">${e.vsPlayer ? "Under attack" : "At war: invaded"} by ${name(e.nat)}</div>` }); });
    marks.forEach(m => (m.tip += `<div class="k">${esc(techLine(m.nat))}</div>`));
    const g = armyLayer.selectAll("g.army").data(marks).join(enter => {
      const e = enter.append("g").attr("class", "army");
      e.append("circle");
      e.append("use");
      return e;
    });
    g.select("circle").attr("class", d => "spot " + d.kind);
    g.select("use").attr("href", d => iconHref(d.type, d.nat)).attr("class", d => iconClass(d.nat));
    g.on("click", (e, d) => { e.stopPropagation(); select(d.go); })
      .on("mousemove", (e, d) => { tip.innerHTML = d.tip; placeTip(e); })
      .on("mouseleave", hideTip);
    placeArmies();
  }
  function placeArmies() {
    const r = 7 / shrink(), ir = r * 1.7;
    armyLayer.selectAll("g.army").each(function (d) {
      let [x, y] = projection(d.at);
      if (d.off) { x += r * 1.6; y -= r * 1.2; }
      const g = d3.select(this);
      g.select("circle").attr("cx", x).attr("cy", y).attr("r", r);
      g.select("use").attr("x", x - ir / 2).attr("y", y - ir / 2).attr("width", ir).attr("height", ir);
    });
  }
  window.addEventListener("resize", layout);
  layout();
  $("#zin").onclick = () => svg.transition().call(zoom.scaleBy, 1.8);
  $("#zout").onclick = () => svg.transition().call(zoom.scaleBy, 1 / 1.8);
  $("#zreset").onclick = () => svg.transition().call(zoom.transform, d3.zoomIdentity);
  $("#zterrain").onclick = () => setTerrain(!terrainOn);
  $("#zstyle").title = `Map style: ${MAP_STYLES[mapStyle]} (click to change)`;
  $("#zstyle").dataset.style = mapStyle;
  $("#zstyle").onclick = () => { const order = Object.keys(MAP_STYLES); const next = order[(order.indexOf(mapStyle) + 1) % order.length]; setMapStyle(next); toast(`Map style: ${MAP_STYLES[next]}.`); };
  $("#zbases").setAttribute("aria-pressed", allBases);
  $("#zbases").onclick = () => {
    allBases = !allBases;
    try { localStorage.setItem("ww3-bases", allBases ? "on" : "off"); } catch (e) { /* ignore */ }
    $("#zbases").setAttribute("aria-pressed", allBases);
    drawDeploy();
  };
  $("#zsats").setAttribute("aria-pressed", satsOn);
  $("#zsats").onclick = () => {
    satsOn = !satsOn;
    try { localStorage.setItem("ww3-sats", satsOn ? "on" : "off"); } catch (e) { /* ignore */ }
    $("#zsats").setAttribute("aria-pressed", satsOn);
    drawSats();
  };
  wrap.classList.toggle("terrain-on", terrainOn);
  terrainBox.hidden = !terrainOn;
  $("#zterrain").setAttribute("aria-pressed", terrainOn);

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
      if (s.owner[iso] !== iso) return d3.interpolateLab("#a05fd0", COL.land)(0.45); // taken by another AI country
      if (G.isLocked(iso)) return "url(#hatch)";
      return COL.land;
    }
    return G.isLocked(iso) ? "url(#hatch)" : COL.teal;
  }
  let deepZoom = false, streetZoom = false;
  function fillFor(iso) {
    if (!iso) return "#161f21";
    if (mode === "campaign") { const v = campaignColor(iso); return deepZoom && v.startsWith("url") ? COL.locked : v; }
    return MODES[mode].color(BY[iso]);
  }
  // With terrain on, country colours are translucent so the land shows through.
  // At street level the colour wash fades to 30% so the photos and street map read true to life.
  function fillOpacity(iso) {
    const o = baseOpacity(iso);
    return o == null || k <= 25 ? o : o * 0.3;
  }
  function baseOpacity(iso) {
    if (!terrainOn) return null;
    if (!iso) return 0.15;
    if (mode !== "campaign") return 0.62;
    const s = G.state;
    if (s.player) return s.owner[iso] === s.player ? 0.55 : s.owner[iso] !== iso ? 0.5 : G.isLocked(iso) ? 0.35 : 0.1;
    return G.isLocked(iso) ? 0.35 : 0.45;
  }
  function paint() {
    countryPaths.attr("fill", f => fillFor(f.iso)).attr("fill-opacity", f => fillOpacity(f.iso)).classed("selected", f => f.iso && f.iso === selected);
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
  const hostLabel = z => (z.host ? (z.host === "TERR" ? "Overseas territory" : BY[z.host] ? BY[z.host].name : z.host) : "");
  // Counts at one base; anything that rounds to zero is left out.
  const countOf = (n, one, many) => { const r = Math.round(n); return r >= 1 ? `${num(r)} ${r === 1 ? one : many}` : ""; };
  function zoneStats(c, z) {
    return [(z.kit.troops ?? c.active * z.groundPct) > 0 ? `${kPers(z.kit.troops ?? c.active * z.groundPct)} troops` : ""]
      .concat(KIT.map(([k, one, many]) => countOf(z.kit[k] || 0, one, many))).filter(Boolean);
  }
  // Hover details for a base / garrison circle.
  function zoneTip(e, z) {
    const iso = z.iso || selected, c = BY[iso], host = hostLabel(z);
    tip.innerHTML = `<b>${esc(z.name)}</b>${iso !== selected ? `<div class="k">${esc(c.name)}${z.host ? " · forces abroad" : ""}</div>` : ""}${host ? `<div class="k">${esc(host)}</div>` : ""}<div class="k">${esc(zoneStats(c, z).join(" · "))}</div><div class="k">${esc(techLine(iso))}</div><div class="tipnote">${esc(z.note)}</div><div class="k">Click for details</div>`;
    placeTip(e);
  }
  // Weapon models behind a set of unit counts, one line per kind, with its icon.
  function modelLines(c, units) {
    return window.UNITS.filter(u => (u.key === "troops" ? units.troops >= 0.05 : units[u.key] >= 1)).map(u => {
      const icon = `<svg class="${iconClass(c.iso3)}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-${KIT_ICON[u.key]}-${window.techTier(effGen(c.iso3))}"/></svg>`;
      const body = u.key === "troops" ? `${kPers(units.troops)} troops: ${esc(c.equipment.small)}` :
        `${esc(u.label)}: ${window.splitModels(c, u.key, Math.round(units[u.key])).map(m => `${num(m[1])} ${esc(m[0])}`).join(", ") || num(units[u.key])}`;
      return `<div class="mline">${icon}<span>${body}</span></div>`;
    }).join("");
  }
  // Clicking a base pins its card on the map and highlights it in the dossier list.
  function pickZone(z, fly) {
    pickedZone = z.name;
    deployLayer.selectAll("circle.garrison").classed("picked", isPicked);
    const c = BY[selected], host = hostLabel(z);
    baseCard.innerHTML = `<button class="bc-close" aria-label="Close base card">×</button>
      <div class="bc-kind">${z.host ? "Forces abroad" : "Home base"} · ${esc(c.name)}</div>
      <h4>${esc(z.name)}</h4>${host ? `<span class="tag">${esc(host)}</span>` : ""}
      <dl>${zoneStats(c, z).map(t => { const [n, ...rest] = t.split(" "); return `<div><dd>${n}</dd><dt>${rest.join(" ")}</dt></div>`; }).join("")}</dl>
      <p>${esc(z.note)}</p>
      <div class="bc-models">${modelLines(c, zoneUnits(c, z))}</div>
      <button class="bc-fly">Zoom to base</button>`;
    baseCard.hidden = false;
    baseCard.querySelector(".bc-close").onclick = unpickZone;
    // Bases zoom in past the country and province views.
    const baseK = () => Math.min(12000, Math.max(d3.zoomTransform(svg.node()).k * 6, 6000));
    baseCard.querySelector(".bc-fly").onclick = () => flyTo(z.at, baseK());
    if (fly) flyTo(z.at, baseK());
    if (tab !== "dossier") setTab("dossier");
    const pane = $("#pane-dossier");
    pane.querySelectorAll("li.picked").forEach(x => x.classList.remove("picked"));
    const li = pane.querySelector(`li[data-zone="${CSS.escape(z.name)}"]`);
    if (li) { const d = li.closest("details"); if (d) d.open = true; li.classList.add("picked"); li.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  // ── Named capital ships (js/fleet.js) ─────────────────────
  // The selected country's carriers, assault ships and flagships at their 2025 positions.
  const shipsOf = iso => (window.FLEET || []).filter(sh => sh.nat === iso);
  function drawShips() {
    const ships = selected ? shipsOf(selected) : [];
    const g = fleetLayer.selectAll("g.ship").data(ships, sh => sh.hull).join(en => {
      const e = en.append("g").attr("class", "ship");
      e.append("circle");
      e.append("use");
      e.append("text");
      return e;
    });
    g.classed("inactive", sh => !sh.active);
    g.select("use").attr("href", sh => iconHref(sh.kind === "command" ? "ship" : "carrier", sh.nat)).attr("class", sh => iconClass(sh.nat));
    g.select("text").text(sh => sh.name);
    g.on("click", (e, sh) => { e.stopPropagation(); hideTip(); pickShip(sh, true); })
      .on("mousemove", (e, sh) => { tip.innerHTML = `<b>${esc(sh.name)}</b> <span class="k">${esc(sh.hull)}</span><div class="k">${esc(sh.cls)}-class · ${esc(sh.status)}</div><div class="k">${esc(sh.where)}</div>`; placeTip(e); })
      .on("mouseleave", hideTip);
    placeShips();
  }
  function placeShips() {
    const r = Math.min(9 / shrink(), 15 / k);
    fleetLayer.selectAll("g.ship").each(function (sh) {
      const [x, y] = projection(sh.at), g = d3.select(this), ir = r * 1.6;
      g.select("circle").attr("cx", x).attr("cy", y).attr("r", r);
      g.select("use").attr("x", x - ir / 2).attr("y", y - ir / 2).attr("width", ir).attr("height", ir);
      g.select("text").attr("x", x).attr("y", y + r * 2.1).style("font-size", Math.min(9 / shrink(), 12 / k) + "px").style("stroke-width", Math.min(2.5 / shrink(), 3 / k) + "px").style("display", k >= 8 ? null : "none");
    });
  }
  function shipStats(sh) {
    return [["Displacement", `${num(sh.disp)} t`], ["Length", `${sh.len} m`], ["Speed", `${sh.kn} kn`], ["Aircraft", sh.air], ["Crew", num(sh.crew)], [sh.active ? "Commissioned" : "Expected", sh.year]];
  }
  // Ship card: class, status, location and approximate capabilities; flies to its pier or sea area.
  function pickShip(sh, fly) {
    unpickZone();
    baseCard.innerHTML = `<button class="bc-close" aria-label="Close ship card">×</button>
      <div class="bc-kind">${esc(sh.kind === "carrier" ? "Aircraft carrier" : sh.kind === "amphib" ? "Amphibious assault ship" : "Flagship")} · ${esc(BY[sh.nat].name)}</div>
      <h4>${esc(sh.name)} <small>${esc(sh.hull)}</small></h4><span class="tag">${esc(sh.cls)} class</span> <span class="tag ${sh.active ? "" : "warn"}">${esc(sh.status)}</span>
      <dl>${shipStats(sh).map(([t, v]) => `<div><dd>${esc(String(v))}</dd><dt>${esc(t)}</dt></div>`).join("")}</dl>
      <p><b>${esc(sh.power)}</b>. ${esc(sh.note)}</p>
      <p class="hint">${esc(sh.where)}. Positions at sea are approximate.</p>
      <button class="bc-fly">Zoom to ship</button>`;
    baseCard.hidden = false;
    baseCard.querySelector(".bc-close").onclick = unpickZone;
    // In port the satellite view can show the pier; at sea a wider view makes more sense.
    const kk = /deployed|sea|ocean/i.test(sh.where) && !/port|base|yard|naval station/i.test(sh.where) ? 300 : 9000;
    baseCard.querySelector(".bc-fly").onclick = () => flyTo(sh.at, kk);
    if (fly) flyTo(sh.at, kk);
  }

  function unpickZone() {
    pickedZone = null;
    baseCard.hidden = true;
    deployLayer.selectAll("circle.garrison").classed("picked", false);
    document.querySelectorAll("#pane-dossier li.picked").forEach(x => x.classList.remove("picked"));
  }
  function flyTo(at, minK) {
    const w = wrap.clientWidth, h = wrap.clientHeight, [x, y] = projection(at);
    const kk = Math.max(minK, d3.zoomTransform(svg.node()).k);
    const t = d3.zoomIdentity.translate(w / 2, h / 2).scale(Math.min(30000, kk)).translate(-x, -y);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (reduce ? svg : svg.transition().duration(650)).call(zoom.transform, t);
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
    const prem = c.priceFixed ? `, but this superpower has a fixed price of ${G.fmtCoins(c.price)} (${(c.price / (c.nationalValue * 1e9)).toFixed(0)}× its value)` : c.pricePremium ? ` incl. +${Math.round(c.pricePremium * 100)}% top-${window.PRICE_PREMIUMS.find(t => c.valueRank <= t.upTo).upTo} premium` : "";
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
    if (G.owns(c.iso3)) return `<p class="hint">Part of your empire. Order at ${pct(s.garrison[c.iso3])}${G.inRevolt(c.iso3) ? ", in revolt" : ""}.</p>`;
    const d = G.diplomacyOdds(c.iso3), tried = s.courted[c.iso3] === s.turn;
    return `<button class="btn diplo" data-act="influence" ${d.p <= 0 || tried ? "disabled" : ""}>Diplomatic union <small>${tried ? "tried this turn" : d.p > 0 ? pct(d.p) + " odds" : "impossible"}</small></button>
      ${d.p <= 0 && d.why ? `<p class="hint">${esc(d.why)}</p>` : ""}
      ${buyHtml(c)}`;
  }

  // ── Armies: send forces, battles, revolts ──────────────────
  const unitFmt = (k, v) => (k === "troops" ? kPers(v) : num(Math.floor(v)));
  let sendSrc = null, sendAmt = {}, sendTo = null;
  function sendHtml(c) {
    const s = G.state, mine = G.owns(c.iso3);
    if (!s.player || s.over) return "";
    if (sendTo !== c.iso3) { sendTo = c.iso3; sendAmt = {}; }
    const srcs = G.sources(c.iso3);
    const title = mine ? (G.inRevolt(c.iso3) ? "Send forces to crush the revolt" : "Move forces here") : "Send an invasion force";
    if (!srcs.length) return `<div class="section"><h3>${title}</h3><p class="hint">No units are free to send. Unlock weapons in a nation's dossier, wait for forces to regrow, or bring armies home.</p></div>`;
    if (!srcs.some(x => x.key === sendSrc)) { sendSrc = srcs[0].key; sendAmt = {}; }
    const src = srcs.find(x => x.key === sendSrc);
    const rows = window.UNITS.filter(u => src.avail[u.key] > 0).map(u => `<div class="srow"><label for="amt-${u.key}">${u.label}</label>
        <span class="avail">of ${unitFmt(u.key, src.avail[u.key])}</span>
        <input id="amt-${u.key}" type="number" inputmode="decimal" min="0" step="${u.key === "troops" ? 0.1 : 1}" data-amt="${u.key}" value="${sendAmt[u.key] ?? ""}" placeholder="0">
        <button class="mini" data-max="${u.key}" data-v="${u.key === "troops" ? +src.avail[u.key].toFixed(1) : Math.floor(src.avail[u.key])}">All</button></div>`).join("");
    return `<div class="section"><h3>${title} <small>arrives over the next turns</small></h3>
      <div class="send">
        <label class="srcl">From<select id="send-src">${srcs.map(x => `<option value="${x.key}" ${x.key === sendSrc ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        <div class="srows">${rows}</div>
        <div class="row2"><button class="mini" id="send-all">Select everything</button><button class="mini" id="send-none">Clear</button></div>
        <p class="hint" id="send-preview"></p>
        <button class="btn ${mine ? "diplo" : "attack"}" id="send-go">${mine ? "Send forces" : "Launch invasion"} <small id="send-eta"></small></button>
      </div>
      <p class="hint">Only troops and unlocked weapon types can be sent. Ground units crossing the sea need sealift from ships, carriers or transport aircraft in the same army. Armies fight once per turn when you press End turn.</p></div>`;
  }
  function sendPreview(c) {
    const out = $("#send-preview"); if (!out) return;
    const p = G.preview(sendSrc, c.iso3, sendAmt);
    const go = $("#send-go"), eta = $("#send-eta");
    if (p.err || p.empty) { out.textContent = p.err || "Enter how many of each unit to send."; go.disabled = true; eta.textContent = ""; return; }
    const r = p.route, by = r.sea ? "by sea" : r.land ? "by land" : "by air";
    let vs = "";
    if (!G.owns(c.iso3)) {
      const D = G.defenceOf(c.iso3);
      const de = G.estimate(D.total, c.iso3);
      vs = ` Army strength ${p.power.toFixed(0)} vs defence ~${de.est.toFixed(0)} (±${Math.round(de.err * 100)}% intel estimate)${D.allyMult > 0.01 ? ` incl. +${pct(D.allyMult)} from ${D.allies.blocs.join(", ")} allies` : ""}.`;
    } else if (G.inRevolt(c.iso3)) vs = ` Adds ${p.power.toFixed(0)} strength against the rebels.`;
    const lift = r.need > 0 ? ` Sealift ${Math.ceil(r.need)} needed / ${Math.floor(r.cap)} available${r.sea ? "" : " (not needed overland)"}.` : "";
    out.innerHTML = `${esc(Math.round(r.km).toLocaleString("en-US"))} km ${by}, arrives turn ${G.state.turn + r.turns}.${esc(lift)}${esc(vs)}${r.ok ? "" : ` <b class="bad">Not enough sealift.</b>`}`;
    go.disabled = !r.ok; eta.textContent = `${r.turns} turn${r.turns === 1 ? "" : "s"}`;
  }
  function wireSend(pane, c) {
    const sel = pane.querySelector("#send-src");
    if (!sel) return;
    sel.onchange = () => { sendSrc = sel.value; sendAmt = {}; dossier(); };
    pane.querySelectorAll("[data-amt]").forEach(i => (i.oninput = () => { sendAmt[i.dataset.amt] = i.value; sendPreview(c); }));
    pane.querySelectorAll("[data-max]").forEach(b => (b.onclick = () => { const i = pane.querySelector(`#amt-${b.dataset.max}`); i.value = b.dataset.v; sendAmt[b.dataset.max] = b.dataset.v; sendPreview(c); }));
    pane.querySelector("#send-all").onclick = () => pane.querySelectorAll("[data-max]").forEach(b => b.click());
    pane.querySelector("#send-none").onclick = () => { sendAmt = {}; pane.querySelectorAll("[data-amt]").forEach(i => (i.value = "")); sendPreview(c); };
    pane.querySelector("#send-go").onclick = () => {
      const err = G.dispatch(sendSrc, c.iso3, sendAmt);
      if (err) return toast(err);
      sendAmt = {}; toast(G.state.log[0].msg); refresh();
    };
    sendPreview(c);
  }

  function armyLi(a) {
    const to = esc(BY[a.to].name);
    const st = !G.arrived(a) ? `en route to ${to}, arrives turn ${a.eta}` : !G.owns(a.to) ? `fighting in ${to}` :
      G.inRevolt(a.to) ? `fighting rebels in ${to}` : a.to === a.nat ? "home" : `stationed in ${to}`;
    return `<li><div class="z-h"><b>Army ${a.id}</b><span>${G.armyPower(a).toFixed(0)} strength</span></div>
      <div class="z-stats">${esc(BY[a.nat].name)} units · ${st}</div>
      <p class="z-note">${esc(G.unitList(a.units))}</p>
      <div class="arow"><button class="mini" data-goto="${a.to}">Show ${to}</button><button class="mini" data-recall="${a.id}">Recall home</button></div></li>`;
  }
  function wireArmies(pane) {
    pane.querySelectorAll("[data-goto]").forEach(b => (b.onclick = () => select(b.dataset.goto)));
    pane.querySelectorAll("[data-recall]").forEach(b => (b.onclick = () => {
      const err = G.recall(+b.dataset.recall);
      if (err) return toast(err);
      toast(G.state.log[0].msg); refresh();
    }));
  }

  // Battle or revolt status plus the armies heading to / sitting in this country.
  // What your intelligence can tell you about a foreign force: an estimate with an error band.
  const est = (v, iso, salt) => { const e = G.estimate(v, iso, salt); return e.err ? `~${e.est.toFixed(0)} <small>(±${Math.round(e.err * 100)}% — intel estimate)</small>` : v.toFixed(0); };
  const estUnits = iso => (G.owns(iso) ? G.unitList(G.forces(iso)) : "about " + G.unitList(G.fuzzUnits(G.forces(iso), iso)));
  function frontHtml(c) {
    const s = G.state, here = s.armies.filter(a => a.to === c.iso3);
    let front = "";
    if (s.wars[c.iso3] || (!G.owns(c.iso3) && here.some(G.arrived))) {
      const D = G.defenceOf(c.iso3), A = G.armiesAt(c.iso3).reduce((x, a) => x + G.armyPower(a), 0), prog = G.warProgress(c.iso3);
      front = `<div class="front"><h4>⚔️ At war${s.wars[c.iso3] ? ` since turn ${s.wars[c.iso3].start}` : ""}</h4>
        <div class="bar"><i style="width:${prog * 100}%;background:${COL.danger}"></i></div>
        <p class="hint">Defences ${Math.round(prog * 100)}% broken (conquest at 100%). Your strength here ${A.toFixed(0)} vs defence ${est(D.total, c.iso3)}.</p>
        <p class="hint">Remaining defenders: ${esc(estUnits(c.iso3) || "almost none")}.</p></div>`;
    } else if (G.inRevolt(c.iso3)) {
      const rv = s.revolts[c.iso3], R = G.rawPower(rv.units, c.iso3) * 1.1 + 5, L = G.loyalPower(c.iso3);
      front = `<div class="front revolt"><h4>🔥 Revolt since turn ${rv.start}</h4>
        <div class="bar"><i style="width:${Math.min(100, rv.progress)}%;background:#f0a03c"></i></div>
        <p class="hint">Rebels are ${Math.round(rv.progress)}% of the way to independence. Loyal strength ${L.toFixed(0)} vs rebels ${R.toFixed(0)} (${esc(G.unitList(rv.units))}). Crush 85% of the rebels to end it, or send more forces.</p></div>`;
    } else if (!G.owns(c.iso3) && s.player) {
      const D = G.defenceOf(c.iso3);
      front = `<p class="hint">Defence strength ${est(D.total, c.iso3)}${D.allyMult > 0.01 ? ` (incl. +${pct(D.allyMult)} from ${esc(D.allies.blocs.join(", "))} allies)` : ""}. Forces: ${esc(estUnits(c.iso3) || "none")}.${c.nukes ? " ☢️ Nuclear power: it may strike your armies before it falls." : ""}</p>`;
    }
    const foes = s.enemies.filter(e => e.to === c.iso3 && (!e.vsPlayer || e.detected));
    if (foes.length && G.owns(c.iso3)) {
      const at = foes.filter(G.arrived), inv = (s.invasions || {})[c.iso3];
      const E = at.reduce((x, e) => x + G.enemyPower(e), 0);
      front += `<div class="front"><h4>🚨 ${at.length ? "Under attack" : "Attack incoming"}</h4>
        ${inv ? `<div class="bar"><i style="width:${Math.min(100, inv.progress)}%;background:${COL.danger}"></i></div><p class="hint">The enemy is ${Math.round(inv.progress)}% of the way to taking ${esc(c.name)}. Enemy strength ${E.toFixed(0)} vs your defence ${G.homeDefence(c.iso3).toFixed(0)}.</p>` : ""}
        ${foes.map(e => `<p class="hint"><b>${esc(BY[e.nat].name)}</b>: about ${esc(G.unitList(G.fuzzUnits(e.units, e.nat)))}${G.arrived(e) ? " (fighting)" : `, arrives turn ${e.eta}`}.</p>`).join("")}
        <p class="hint">Your defence: ${G.homeDefence(c.iso3).toFixed(0)} (this nation's unlocked forces, order and any armies stationed here). Send armies here or unlock weapons to hold it.</p></div>`;
    }
    if (!G.owns(c.iso3) && G.isHostile(c.iso3)) front += `<p class="hint">⚠️ ${esc(c.name)} is hostile and may attack your nations.</p>`;
    const invaders = s.enemies.filter(e => e.to === c.iso3 && !e.vsPlayer), outgoing = s.enemies.filter(e => e.nat === c.iso3 && !e.vsPlayer);
    if (invaders.length) front += `<div class="front aiwar"><h4>🌍 Invaded by ${esc([...new Set(invaders.map(e => BY[e.nat].name))].join(", "))}</h4>
      ${invaders.map(e => `<p class="hint">${esc(G.unitList(e.units))}${G.arrived(e) ? " (fighting)" : `, arrives turn ${e.eta}`}.</p>`).join("")}
      <p class="hint">Defence ${G.defenceOf(c.iso3).total.toFixed(0)}. It falls when 80% of its forces are destroyed.</p></div>`;
    if (outgoing.length) front += `<p class="hint">🌍 ${esc(c.name)} is invading ${outgoing.map(e => esc(BY[e.to].name)).join(", ")}.</p>`;
    const list = here.length ? `<ul class="armies">${here.map(armyLi).join("")}</ul>` : "";
    if (!front && !list) return "";
    return `<div class="section"><h3>${G.owns(c.iso3) ? "Security" : "War room"}</h3>${front}${list}</div>`;
  }

  // Home forces of one of your nations: ready, deployed, and locked.
  function forcesHtml(c) {
    const f = G.forces(c.iso3), b = G.baseForces(c), dep = {}, av = G.accessible(c.iso3);
    G.state.armies.filter(a => a.nat === c.iso3).forEach(a => window.UNITS.forEach(u => (dep[u.key] = (dep[u.key] || 0) + (a.units[u.key] || 0))));
    const tiles = window.UNITS.filter(u => b[u.key] > 0 || f[u.key] > 0).map(u => {
      const ok = G.usable(c.iso3, u.key);
      return `<div class="${ok ? "" : "lockedw"}"><dt>${ok ? "" : "🔒 "}${u.label}</dt><dd>${unitFmt(u.key, av[u.key] || 0)}</dd><small class="hint">of ${unitFmt(u.key, f[u.key])} at home${dep[u.key] ? ` · +${unitFmt(u.key, dep[u.key])} deployed` : ""}</small></div>`;
    }).join("");
    return `<div class="section"><h3>Home forces <small>accessible now · regrow each turn</small></h3><dl class="assets">${tiles}</dl>
      <p class="hint">The big number is what this nation's access levels let you send or defend with. Open any country's dossier to send units there. Raise access levels under Military power to call on more.</p></div>`;
  }

  // One tiered upgrade row: level bar (0–100, full access at 90) and +1 / +10 / Max buttons.
  function levelRow(attr, key, label, lvl, info, quote, mine) {
    const L = window.LEVEL_MAX, F = window.LEVEL_FULL;
    const btn = n => {
      let q = quote(n);
      const none = n === "max" && !q.n;
      if (none) q = quote(1);
      if (!q.n) return "";
      const short = none || G.state.coins < q.cost;
      return `<button class="unlock" data-${attr}="${key}" data-n="${n}" title="${n === "max" ? `Buy ${q.n} level${q.n === 1 ? "" : "s"}` : `+${q.n} level${q.n === 1 ? "" : "s"}`} for ${G.fmtCoins(q.cost)} coins" ${short ? "aria-disabled=\"true\"" : ""}>${n === "max" ? "Max" : "+" + n} <span class="coin" aria-hidden="true"></span>${G.fmtCoins(q.cost)}</button>`;
    };
    const btns = !mine ? "" : lvl >= L ? `<span class="tag">max</span>` : `<span class="lvbtns">${btn(1)}${btn(10)}${btn("max")}</span>`;
    return `<li><div class="lvhead"><b>${label}</b> <small>Lv ${lvl}/${L}</small>${btns}</div>
      <div class="lvbar" aria-hidden="true"><i style="width:${lvl}%"></i><span style="left:${F}%"></span></div>
      <span class="hint">${info}</span></li>`;
  }
  const pctTxt = x => `${Math.round(x * 100)}%`;
  function accessInfo(lvl) {
    const sh = window.tierShare(lvl), su = window.tierSurge(lvl);
    return lvl <= 0 ? "Locked: none of it can fight." : `${pctTxt(sh)} of the force accessible${su ? ` · +${pctTxt(su)} surge combat power` : ""}`;
  }

  function techHtml(c, mine) {
    const rows = window.TECH.map(t => {
      const lvl = G.techLvl(c.iso3, t.key), now = window.tierShare(lvl) + window.tierSurge(lvl);
      return levelRow("tech", t.key, t.label, lvl, `${lvl ? `Now ${pctTxt(now)} of full effect. ` : ""}At 100% (level ${window.LEVEL_FULL}): ${t.per}.`, n => G.techQuote(c.iso3, t.key, n), mine);
    }).join("");
    return `<ul class="tech">${rows}</ul><p class="hint">Level 1 gives 10% of a track's effect, rising linearly to 100% at level ${window.LEVEL_FULL}. Levels ${window.LEVEL_FULL + 1}–${window.LEVEL_MAX} add +1% each beyond that.${mine ? "" : " Bring this nation into your empire to research upgrades for it."}</p>`;
  }

  // Access levels for each weapon category (troops included) of one of your nations.
  function accessHtml(c) {
    const cats = [{ key: "troops", label: "Troops", count: c.active }].concat(c.weapons.filter(w => w.count));
    const rows = cats.map(w => {
      const lvl = G.accessLvl(c.iso3, w.key);
      return levelRow("access", w.key, w.label, lvl, accessInfo(lvl), n => G.accessQuote(c.iso3, w.key, n), true);
    }).join("");
    return `<h4 class="zgroup">Access levels</h4><ul class="tech">${rows}</ul>`;
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
    const mine = G.owns(c.iso3), accShare = mine ? Object.fromEntries(window.UNITS.map(u => [u.key, G.accessShare(c.iso3, u.key)])) : null;
    const base = [["Defence budget", money(c.mil)], ["Active troops", kPers(c.active)], ["Reserves", kPers(c.reserve)]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`);
    const weaponTiles = c.weapons.map(w => {
      const val = num(w.count);
      if (!mine || !w.count) return `<div><dt>${w.label}</dt><dd>${val}</dd></div>`;
      const lvl = G.accessLvl(c.iso3, w.key);
      return `<div class="${lvl ? "unlocked" : "lockedw"}"><dt>${lvl ? "" : "🔒 "}${w.label} · Lv ${lvl}</dt><dd>${val}</dd></div>`;
    });
    const lockedCount = mine ? c.weapons.filter(w => w.count && !G.accessLvl(c.iso3, w.key)).length : 0;
    const v = c.value, vt = v.total;
    const zones = computeDeployment(c.iso3);
    const homeZ = zones.filter(z => !z.host), abroadZ = zones.filter(z => z.host);
    const abroadTroops = abroadZ.reduce((a, z) => a + z.kit.troops, 0);
    const hosts = new Set(abroadZ.map(z => z.host));
    const hostName = h => (h === "TERR" ? "Overseas territory" : BY[h] ? BY[h].name : h);
    const maxShare = Math.max(...zones.map(z => Math.max(z.groundPct, z.navalPct, z.airPct))) || 1;
    const shareTxt = p => (p >= 0.995 ? "100%" : p >= 0.01 ? Math.round(p * 100) + "%" : "<1%");
    const zoneLi = z => `<li data-zone="${esc(z.name)}" tabindex="0" title="Show on map">
          <div class="z-h"><b>${esc(z.name)}</b><span>${z.groundPct > 0 ? shareTxt(z.groundPct) + " of troops" : z.navalPct > 0 ? shareTxt(z.navalPct) + " of navy" : shareTxt(z.airPct) + " of aircraft"}</span></div>
          ${z.host ? `<span class="tag">${esc(hostName(z.host))}</span>` : ""}
          <div class="z-bar"><i style="width:${(Math.max(z.groundPct, z.navalPct, z.airPct) / maxShare) * 100}%;background:${z.navalPct > z.groundPct ? COL.teal : COL.brass}"></i></div>
          <div class="z-stats">${zoneStats(c, z).join(" · ")}</div>
          <p class="z-note">${esc(z.note)}</p></li>`;
    const weight = z => z.groundPct + z.navalPct * 0.5 + z.airPct * 0.3;
    const zoneList = (list, show) => {
      const sorted = [...list].sort((x, y) => weight(y) - weight(x));
      return `<ul class="zones">${sorted.slice(0, show).map(zoneLi).join("")}</ul>` +
        (sorted.length > show ? `<details class="more"><summary>Show ${sorted.length - show} more</summary><ul class="zones">${sorted.slice(show).map(zoneLi).join("")}</ul></details>` : "");
    };
    const allies = (window.ALLIES_OF[c.iso3] || []).map(a => a.bloc);
    // State / province picker and the bases inside the chosen one.
    const provs = provincesOf(c.iso3).slice().sort((a, b) => a.properties.name.localeCompare(b.properties.name));
    const pf = province && provs.find(f => f.properties.name === province);
    let provBody = `<p class="hint">Click a state or province on the map, or choose one here, to zoom in and see the bases there.</p>`;
    if (pf) {
      const inside = basesIn(pf, zones), sum = {};
      inside.forEach(z => { sum.troops = (sum.troops || 0) + z.kit.troops; KIT.forEach(([k2]) => (sum[k2] = (sum[k2] || 0) + (z.kit[k2] || 0))); });
      provBody = `<div class="provcard"><b>${esc(pf.properties.name)}</b> <span class="tag">${esc(pf.properties.type)}</span>
        <p class="hint">${inside.length ? `${inside.length} base${inside.length === 1 ? "" : "s"}: ${esc(zoneStats(c, { groundPct: (sum.troops || 0) / Math.max(c.active, 1e-9), kit: sum }).join(" · "))}. Click a base to zoom in further.` : "No listed bases in this region."}</p>
        ${inside.length ? `<ul class="zones">${inside.map(zoneLi).join("")}</ul>` : ""}</div>`;
    }
    const ms = c.milStats;
    const provHtml = `<div class="section"><h3>State / province <small>${provs.length ? `${provs.length} regions` : "loading…"}</small></h3>
        ${provs.length ? `<select id="prov-sel" class="provsel" aria-label="State or province"><option value="">Whole country</option>${provs.map(f => `<option ${f.properties.name === province ? "selected" : ""}>${esc(f.properties.name)}</option>`).join("")}</select>` : ""}
        ${provBody}</div>`;
    const sp = c.space, ip = c.intelProfile, war = G.state.player ? G.atWar(c.iso3) : false;
    const spaceHtml = `<div class="section"><h3>Space <small>${num(sp.govTotal)} government · ${num(sp.privTotal)} private satellites</small></h3>
        <dl class="kv">
          <div><dt>Reconnaissance</dt><dd>${num(sp.gov.recon)} <small>+${num(sp.privBy.recon || 0)} private</small></dd></div>
          <div><dt>Signals intelligence</dt><dd>${num(sp.gov.sigint)} <small>+${num(sp.privBy.sigint || 0)} private</small></dd></div>
          <div><dt>Communications</dt><dd>${num(sp.gov.comms)} <small>+${num(sp.privBy.comms || 0)} private</small></dd></div>
          <div><dt>Navigation · early warning</dt><dd>${sp.gov.nav} · ${sp.gov.warn}</dd></div>
          <div><dt>Anti-satellite weapons</dt><dd>${["None", "Tested", "Proven", "Proven, several types"][sp.asat]}</dd></div>
          <div><dt>Combat bonus</dt><dd>×${window.spaceMult(c, war).toFixed(2)} <small>${war ? "at war: private satellites mobilised" : "peacetime"}</small></dd></div>
        </dl>
        ${sp.priv.length ? `<p class="hint">Private constellations (join the national effort in wartime): ${sp.priv.map(([n, k, t]) => `${esc(n)} ${num(k)} (${t})`).join(" · ")}.</p>` : ""}
        <p class="hint">Satellites sharpen reconnaissance, communications and navigation: up to about +25% combat strength. Private satellites count for 30% in peacetime and in full once the country is at war.</p></div>`;
    const intelHtml = `<div class="section"><h3>Intelligence <small>score ${ip.score}/10</small></h3>
        <div class="meters">${meter("Human (HUMINT)", Math.round(ip.humint))}${meter("Signals (SIGINT)", Math.round(ip.sigint))}${meter("Imagery (IMINT)", Math.round(ip.imint))}${meter("Cyber", Math.round(ip.cyber))}${meter("Counter-intel", Math.round(ip.counter))}</div>
        ${ip.agencies ? `<p class="hint"><b>Agencies:</b> ${esc(ip.agencies)}.</p>` : ""}${ip.alliance ? `<p class="hint"><b>Sharing:</b> ${esc(ip.alliance)}.</p>` : ""}
        <p class="hint">${G.owns(c.iso3) ? "Your best intelligence score sets how precisely you see enemy strength and whether you spot attacks when they launch." :
          G.state.player ? `Your estimates of ${esc(c.name)}'s forces are off by up to ±${Math.round(G.intelError(c.iso3) * 100)}% (your intelligence ${G.myIntel().toFixed(1)} against its counter-intelligence ${ip.counter}).` : ""}</p></div>`;
    const equipHtml = `<div class="section"><h3>Equipment <span class="tag">${c.equipSource === "researched" ? "researched" : esc(c.equipSource.replace("_", " ")) + " template"}</span></h3>
        <div class="bc-models">${modelLines(c, G.baseForces(c))}</div></div>`;
    const profileHtml = `<div class="section"><h3>Military profile <span class="tag">${ms.estimated ? "estimated" : "researched"}</span></h3>
        <div class="meters">${window.MIL_STATS.map(([k2, label]) => meter(label, ms[k2])).join("")}</div>
        <p class="hint">Unit skill ×${ms.skill.toFixed(2)} (training, experience and leadership, minus corruption) · defending ×${ms.defend.toFixed(2)} (patriotism) · fighting overland ×${ms.near.toFixed(2)}, overseas ×${ms.far.toFixed(2)} (logistics).</p></div>`;
    pane.innerHTML = `
      <div class="card-head"><div class="flag" aria-hidden="true">${flag(c.iso2)}</div>
        <div><h2>${esc(c.name)}</h2><div class="sub">${esc(c.region)} · ${c.iso3}${allies.length ? " · " + esc(allies.join(", ")) : ""}</div>${statusPill(c)}</div></div>

      ${provHtml}
      ${frontHtml(c)}
      ${mine ? forcesHtml(c) : ""}
      ${sendHtml(c)}
      <div class="section actions">${actionsHtml(c)}</div>

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
          <div><dt>Purchase price</dt><dd>${G.fmtCoins(c.price)} <small>coins${c.priceFixed ? " · fixed" : c.pricePremium ? ` · +${Math.round(c.pricePremium * 100)}%` : ""}</small></dd></div>
        </dl>${c.valueNote ? `<p class="note">${esc(c.valueNote)}</p>` : ""}</div>

      <div class="section"><h3>Military power <small>declared · rank #${c.powerRank}/${C.length}</small></h3>
        <div class="big"><strong>${c.power}</strong><span>/ 100 power index</span></div>
        <div class="techrow"><svg class="${iconClass(c.iso3)}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-jet-${window.techTier(effGen(c.iso3))}"/></svg>
          <span><b>Gen ${effGen(c.iso3).toFixed(1)}</b> ${window.techTier(effGen(c.iso3))} technology · readiness <b>${Math.round(c.tech.ready * 100)}%</b> (${window.readyLabel(c.tech.ready)})${c.tech.estimated ? " <small>estimated</small>" : ""}</span></div>
        <div class="bar"><i style="width:${c.power}%;background:${MODES.power.hi}"></i></div>
        ${mine ? `<p class="hint armory">Each category has an access level from 1 to ${window.LEVEL_MAX}: level 1 lets you call on 10% of it, rising to 100% at level ${window.LEVEL_FULL}.${lockedCount ? ` ${lockedCount} weapon ${lockedCount === 1 ? "category is" : "categories are"} still at level 0 and can't fight.` : ""} You have <b>${G.fmtCoins(G.state.coins)}</b> coins. Usable strength ${window.truePowerWith(c, accShare).toFixed(1)} of ${c.truePower}.</p>` : ""}
        <dl class="assets">${base.join("")}${weaponTiles.join("")}
          <div class="nuke" style="grid-column:span 3"><dt>Nuclear warheads${mine ? " · always ready, outside access levels" : ""}</dt><dd>${c.nukes ? num(c.nukes) + (c.iso3 === "ISR" ? " (undeclared, est.)" : "") : "None"}</dd></div></dl>
        ${mine ? accessHtml(c) : ""}</div>

      ${profileHtml}
      ${intelHtml}
      ${spaceHtml}
      ${equipHtml}
      ${shipsOf(c.iso3).length ? `<div class="section"><h3>Capital ships <small>2025 positions</small></h3><ul class="zones">${shipsOf(c.iso3).map((sh, i) => `<li data-ship="${i}" tabindex="0" title="Show on map">
          <div class="z-h"><b>${esc(sh.name)}</b><span>${esc(sh.hull)}</span></div>
          <div class="z-stats">${esc(sh.cls)}-class · ${num(sh.disp)} t · ${sh.air} aircraft · ${esc(sh.power)}</div>
          <p class="z-note">${sh.active ? "" : "⚠️ "}${esc(sh.status)} — ${esc(sh.where)}</p></li>`).join("")}</ul></div>` : ""}

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
          <div><dt>Est. true strength</dt><dd>${c.truePower} <small>#${c.truePowerRank} · ${c.hiddenUplift >= 0 ? "+" : ""}${c.hiddenUplift}% vs declared</small></dd></div>
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

      <div class="section"><h3>National trait <span class="tag">draft</span></h3>
        <p class="trait-name">${esc(c.trait.name)}</p>
        <p class="hint">${esc(c.trait.desc)}</p>
        <ul class="fx">${fxList(c.trait.fx)}</ul>
        <p class="hint">${mine ? "Active: this nation is in your empire." : "Takes effect when this nation joins your empire. Defence and union-resistance effects apply while you're targeting it."}</p></div>

      <div class="section"><h3>Technology <small>${mine ? "research with coins" : "your empire only"}</small></h3>
        ${techHtml(c, mine)}</div>

`;
    wireSend(pane, c);
    wireArmies(pane);
    pane.querySelectorAll("[data-tech]").forEach(b => (b.onclick = () => {
      const err = G.upgradeTech(c.iso3, b.dataset.tech, b.dataset.n === "max" ? "max" : +b.dataset.n);
      if (err) return toast(err);
      toast(G.state.log[0].msg); refresh();
    }));
    pane.querySelectorAll("[data-act]").forEach(b => (b.onclick = () => act(b.dataset.act, c.iso3)));
    pane.querySelectorAll("li[data-ship]").forEach(li => {
      const go = () => pickShip(shipsOf(c.iso3)[+li.dataset.ship], true);
      li.onclick = go;
      li.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    });
    const ps = pane.querySelector("#prov-sel");
    if (ps) ps.onchange = () => { if (ps.value) selectProvince(ps.value); else { province = null; unpickZone(); drawProvinces(); zoomTo(c.iso3); dossier(); } };
    pane.querySelectorAll("li[data-zone]").forEach(li => {
      const go = () => { const z = zones.find(x => x.name === li.dataset.zone); if (z) pickZone(z, true); };
      li.onclick = go;
      li.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    });
    if (pickedZone) { const li = pane.querySelector(`li[data-zone="${CSS.escape(pickedZone)}"]`); if (li) li.classList.add("picked"); }
    pane.querySelectorAll("[data-access]").forEach(b => (b.onclick = () => {
      const err = G.raiseAccess(c.iso3, b.dataset.access, b.dataset.n === "max" ? "max" : +b.dataset.n);
      if (err) return toast(err);
      toast(G.state.log[0].msg); refresh();
    }));
  }

  function act(kind, iso) {
    const err = kind === "choose" ? G.choose(iso) : kind === "buy" ? G.buy(iso) : G.influence(iso);
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
          <div><dt>Armies</dt><dd>${s.armies.length} <small>${s.armies.reduce((x, a) => x + G.armyPower(a), 0).toFixed(0)} strength</small></dd></div>
          <div><dt>Wars · revolts · attacks</dt><dd>${Object.keys(s.wars).length} · ${Object.keys(s.revolts).length} · ${s.enemies.filter(e => e.vsPlayer).length}</dd></div>
          <div><dt>Soft power</dt><dd>${G.empireSoft().toFixed(0)}</dd></div>
          <div><dt>Warheads</dt><dd>${G.empireNukes() || "None"}</dd></div>
          <div><dt>Coins</dt><dd>${G.fmtCoins(s.coins)} <small>+${G.income()}/turn</small></dd></div>
          <div><dt>Empire value</dt><dd>${money(e.reduce((a, c) => a + c.nationalValue, 0))}</dd></div>
        </dl>
        <h4 class="zgroup">Trait bonuses <span class="tag">draft</span></h4>
        ${(() => { const fx = Object.fromEntries(["atk", "dip", "loot", "proj", "inc"].map(k => [k, G.bonus(k)]).filter(([, v]) => v > 0));
          return Object.keys(fx).length ? `<ul class="fx">${fxList(fx)}</ul>` : `<p class="hint">None of your nations has an empire-wide trait yet.</p>`; })()}
        <div class="bar" style="margin-top:10px"><i style="width:${Math.min(100, share * 200)}%;background:${COL.brass}"></i></div></div>`;
    }
    const ops = s.player ? `<div class="section"><h3>Operations <small>turn ${s.turn}</small></h3>
        ${Object.keys(s.revolts).map(iso => `<p class="hint">🔥 <a href="#" data-goto="${iso}">${esc(BY[iso].name)}</a> is in revolt: rebels ${Math.round(s.revolts[iso].progress)}% of the way to independence.</p>`).join("")}
        ${s.enemies.filter(e => !e.vsPlayer).length ? `<h4 class="zgroup">World conflicts</h4>${s.enemies.filter(e => !e.vsPlayer).map(e => `<p class="hint">🌍 <a href="#" data-goto="${e.nat}">${esc(BY[e.nat].name)}</a> ${G.arrived(e) ? "is fighting in" : "is invading"} <a href="#" data-goto="${e.to}">${esc(BY[e.to].name)}</a>${G.arrived(e) ? "" : `, arriving turn ${e.eta}`}.</p>`).join("")}` : ""}
        ${s.enemies.filter(e => e.vsPlayer && (e.detected || G.arrived(e))).map(e => `<p class="hint">🚨 <b>${esc(BY[e.nat].name)}</b> ${G.arrived(e) ? "is attacking" : `will hit`} <a href="#" data-goto="${e.to}">${esc(BY[e.to].name)}</a>${G.arrived(e) ? "" : ` on turn ${e.eta}`}: about ${esc(G.unitList(G.fuzzUnits(e.units, e.nat)))}.</p>`).join("")}
        ${Object.keys(s.wars).map(iso => `<p class="hint">⚔️ War in <a href="#" data-goto="${iso}">${esc(BY[iso].name)}</a>: defences ${Math.round(G.warProgress(iso) * 100)}% broken.</p>`).join("")}
        ${s.armies.length ? `<ul class="armies">${s.armies.map(armyLi).join("")}</ul>` : `<p class="hint">No armies in the field. Open any country's dossier and use "Send an invasion force" to pick units and launch an attack.</p>`}
        <button class="btn attack" id="endturn2" style="margin-top:10px" ${s.over ? "disabled" : ""}>End turn <small>+${G.income()} coins</small></button></div>` : "";
    pane.innerHTML = `${empire}${ops}
      <div class="${s.player ? "section" : ""}"><h3>Playable nations <small>${s.unlocked.length} of ${C.length} unlocked</small></h3>
      <p class="hint">Rules: 4 random African nations (never South Africa), 3 random European, Argentina plus 2 random South American (never Brazil), and Mexico, Mongolia, Kazakhstan and Bangladesh. Every other country is locked until you buy it at its national value (1 coin = $1).</p>
      ${roster}</div>
      <div class="section row2">
        <button class="btn ghost" id="reroll" ${s.player ? "disabled" : ""}>Reroll random picks</button>
        <button class="btn ghost" id="newgame">New campaign</button></div>
      <div class="section"><h3>How to play</h3>
        <p class="hint">Pick a playable nation. Then open any country's dossier and <b>send an invasion force</b>: choose which of your nations (or armies) the units come from and exactly how many troops, tanks, aircraft, ships and so on to send. Armies take turns to arrive, by land if the target borders your territory, otherwise by sea, which needs enough sealift. Each <b>End turn</b>, every battle fights one round with losses on both sides. Conquer a country by destroying 80% of its forces; defenders get home advantage, morale from soft power and help from treaty allies. You can reinforce, recall or redirect armies at any time. <b>Diplomatic union</b> can be tried once per turn per country. Occupied lands can revolt: rebels then fight your garrison over several turns, and you can send armies to crush them before they win independence. Control 50% of world GDP to win.</p>
        <p class="hint"><b>Coins & weapons.</b> Every upgrade is tiered from level 1 to 100. Each nation you control starts with troops at level 1 (10% of its troops) and every weapon category at level 0 (locked). Level 1 gives access to 10% of that category, rising linearly to 100% at level 90; levels 91–100 add up to +10% surge combat power. Access is a ceiling on what you can send or defend with, not what every attack must use. Nukes sit outside the levels and always count. Open a nation's dossier and spend coins on access levels (Military power) and technology tracks. Prices scale with the hardware's real replacement value; Max buys as many levels as you can afford up to 90, then up to 100. You earn coins every turn from your empire's GDP, from each conquest or union, and from promo codes.</p></div>
      <div class="section"><h3>Map imagery <small>zoomed-in views</small></h3>
        <div class="seg" role="group" aria-label="Map style">${Object.entries(MAP_STYLES).map(([st, lab]) => `<button class="btn ghost${st === mapStyle ? " on" : ""}" data-style="${st}" aria-pressed="${st === mapStyle}">${lab}</button>`).join("")}</div>
        <p class="hint"><b>Satellite</b> shows Esri World Imagery aerial photos. <b>Hybrid</b> adds roads, railways and place names on top, like a navigation app's satellite view. <b>Map</b> shows the OpenStreetMap street map that many navigation apps are built on.</p>
        <label class="hint" for="gkey">Google Maps API key (optional). With a key that has the Map Tiles API enabled, zoomed-in views use Google's own satellite, hybrid and road tiles. The key is stored only in this browser and is sent only to Google.</label>
        <div class="keyrow"><input id="gkey" type="password" autocomplete="off" placeholder="${googleKey ? "Key saved" : "Paste API key"}" class="gkey"><button class="btn ghost" id="gkey-save">${googleKey ? "Replace" : "Use key"}</button>${googleKey ? `<button class="btn ghost" id="gkey-clear">Remove</button>` : ""}</div></div>
      ${s.log.length ? `<div class="section"><h3>War log</h3><ul class="log">${s.log.map(l => `<li class="${l.kind}"><span>T${l.t}</span>${esc(l.msg)}</li>`).join("")}</ul></div>` : ""}
      <div class="section method"><details><summary>Methodology & sources</summary>
        <p>GDP: IMF WEO 2025 estimates. Population: UN WPP. Defence budgets: SIPRI, IISS Military Balance and national budgets. Equipment: IISS and Global Firepower-style active inventories, rounded. Warheads: FAS Nuclear Notebook. Soft power: modelled on Brand Finance Global Soft Power Index rankings.</p>
        <p>Military power index: square-root-scaled share of the world maximum across 14 weighted capabilities (budget 20%, fighters 10%, troops, armour, artillery, air, naval, submarines, carriers, GDP and population), discounted for equipment age using GDP per capita, plus a nuclear deterrent bonus.</p>
        <p>National value is the gross value of everything a country owns. It adds up global asset estimates: human capital ($1,620trn, 40 years of labour income), real estate and land ($410trn), business equity ($165trn), infrastructure ($85trn), resources in the ground (about $477trn), gold (about $26trn) and military hardware (about $3trn). That gives a world value of ${money(window.WORLD_VALUE)}. Each country gets its share of each pool, weighted by GDP, population and income level, plus its own resources, gold and arsenal. Business equity partly overlaps the property companies own, so treat the total as gross. A $70trn cultural and brand pool is shared out by soft power, and the Vatican gets a hand-set estimate for its property, art and faith brand.</p>
        <p>Soft power also counts toward military power (5% weight), as cultural pull, alliances and morale. Force disposition is a best guess at peacetime basing: about 40% of ground forces near the capital, the rest on borders in proportion to each neighbour's strength (treaty allies count for one fifth), and the fleet at the coast facing open sea.</p>
        <p>Secret assets: nobody outside governments knows the real numbers. Researched profiles (${C.filter(c => !c.secret.estimated).length} countries) draw on published think-tank, SIPRI, FAS, World Gold Council and SWF Institute estimates; the rest are extrapolated from budget and economy. Treat all figures as informed estimates for gameplay.</p>
      </details></div>`;
    pane.querySelectorAll(".roster button").forEach(b => (b.onclick = () => select(b.dataset.iso)));
    wireArmies(pane);
    pane.querySelectorAll("a[data-goto]").forEach(a => (a.onclick = e => { e.preventDefault(); select(a.dataset.goto); }));
    if ($("#endturn2")) $("#endturn2").onclick = () => $("#endturn").click();
    pane.querySelectorAll("[data-style]").forEach(b => (b.onclick = () => setMapStyle(b.dataset.style)));
    $("#gkey-save").onclick = () => { const v = $("#gkey").value.trim(); if (!v) return toast("Paste a Google Maps API key first."); setGoogleKey(v); toast("Google Maps key saved in this browser. Zoom in to see Google tiles."); render(); };
    if ($("#gkey-clear")) $("#gkey-clear").onclick = () => { setGoogleKey(""); toast("Google Maps key removed."); render(); };
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
  function refresh() { paint(); render(); coinChip(); drawArmies(); }
  function coinChip() {
    $("#coins").textContent = G.fmtCoins(G.state.coins);
    $("#turnno").textContent = G.state.turn;
    $("#endturn").disabled = !G.state.player || G.state.over;
  }
  $("#endturn").onclick = () => {
    const err = G.endTurn();
    if (err) return toast(err);
    const news = G.state.log.filter(l => l.t === G.state.turn && !l.msg.startsWith("📍"));
    toast(news.length ? news.slice(0, 2).map(l => l.msg).join("  ") + (news.length > 2 ? `  (+${news.length - 2} more in the war log)` : "") : `Turn ${G.state.turn}. +${G.income()} coins.`);
    refresh(); drawDeploy();
  };

  // ── Promo codes ────────────────────────────────────────────
  const promo = $("#promo"), promoIn = $("#promo-code"), promoMsg = $("#promo-msg");
  function openPromo() { promo.hidden = false; promoMsg.textContent = ""; promoMsg.className = "promo-msg"; promoIn.value = ""; promoIn.focus(); }
  $("#promo-btn").onclick = () => (promo.hidden ? openPromo() : (promo.hidden = true));
  $("#promo-close").onclick = () => (promo.hidden = true);
  $("#promo-form").onsubmit = e => {
    e.preventDefault();
    const r = G.redeem(promoIn.value);
    promoMsg.className = "promo-msg " + (r.err ? "bad" : "good");
    promoMsg.textContent = r.err || `Redeemed: +${G.fmtCoins(r.amount)} coins.`;
    if (!r.err) { promoIn.value = ""; refresh(); }
  };
  document.addEventListener("keydown", e => { if (e.key === "Escape") promo.hidden = true; });
  // Reset everything: needs a second click within 4 seconds to confirm.
  let resetArmed = null;
  $("#reset-btn").onclick = e => {
    const b = e.currentTarget;
    if (!resetArmed) {
      b.textContent = "Click again to erase all"; b.classList.add("armed");
      resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Reset"; b.classList.remove("armed"); }, 4000);
      return;
    }
    clearTimeout(resetArmed); resetArmed = null; b.textContent = "Reset"; b.classList.remove("armed");
    G.resetAll(); selected = null; unpickZone(); drawDeploy(); setTab("campaign"); refresh();
    toast("Everything was reset: new campaign, 300 coins, fresh random nations, promo codes usable again.");
  };
  function select(iso) {
    if (iso !== selected) { unpickZone(); province = null; }
    selected = iso; paint(); drawDeploy(); drawShips(); drawSats(); drawProvinces(); zoomTo(iso); setTab("dossier"); $("#pane-dossier").scrollTop = 0;
    loadAdmin1(iso, () => { if (selected === iso) { drawProvinces(); if (tab === "dossier") dossier(); } });
  }

  // Largest polygon of a feature, so overseas islands don't shrink the view.
  function mainPart(f) {
    if (f.geometry.type !== "MultiPolygon") return f;
    const polys = f.geometry.coordinates.map(c => ({ type: "Feature", geometry: { type: "Polygon", coordinates: c } }));
    return polys.reduce((a, b) => (d3.geoArea(b) > d3.geoArea(a) ? b : a));
  }
  function frame(geo, fill, maxK) {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const [[x0, y0], [x1, y1]] = path.bounds(geo);
    const kk = Math.max(1, Math.min(maxK, fill / Math.max((x1 - x0) / w, (y1 - y0) / h, 1e-6)));
    const t = d3.zoomIdentity.translate(w / 2, h / 2).scale(kk).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (reduce ? svg : svg.transition().duration(750)).call(zoom.transform, t);
    return kk;
  }
  // Fly the map to a country, framing its largest landmass (e.g. the contiguous US, metropolitan France).
  function zoomTo(iso) {
    const f = mainFeat[iso];
    if (f) return frame(mainPart(f), 0.92, 60);
    const m = markers.find(x => x.c.iso3 === iso);
    if (m) flyTo(m.at, 40);
  }

  // ── States and provinces ───────────────────────────────────
  let province = null;
  const admin1Loading = {};
  function loadAdmin1(iso, done) {
    window.ADMIN1 = window.ADMIN1 || {};
    if (window.ADMIN1[iso]) return done();
    if (admin1Loading[iso]) return admin1Loading[iso].push(done);
    admin1Loading[iso] = [done];
    const sc = document.createElement("script");
    sc.src = `vendor/admin1/${iso}.js?v=14`;
    sc.onload = () => {
      // GeoJSON winds outer rings counter-clockwise; d3 wants clockwise, or a ring means "everything outside it".
      (window.ADMIN1[iso] ? window.ADMIN1[iso].features : []).forEach(f => {
        const g = f.geometry, fix = poly => { if (d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI) poly.forEach(ring => ring.reverse()); };
        if (g.type === "Polygon") fix(g.coordinates); else if (g.type === "MultiPolygon") g.coordinates.forEach(fix);
      });
      admin1Loading[iso].forEach(f => f()); delete admin1Loading[iso];
    };
    sc.onerror = () => delete admin1Loading[iso];
    document.head.appendChild(sc);
  }
  const provincesOf = iso => (window.ADMIN1 && window.ADMIN1[iso] ? window.ADMIN1[iso].features : []);
  function drawProvinces() {
    provLayer.selectAll("path").data(selected ? provincesOf(selected) : [], f => f.properties.name).join("path")
      .attr("class", f => "prov" + (f.properties.name === province ? " picked" : ""))
      .attr("d", path)
      .on("click", (e, f) => { e.stopPropagation(); selectProvince(f.properties.name); })
      .on("mousemove", (e, f) => { tip.innerHTML = `<b>${esc(f.properties.name)}</b><div class="k">${esc(f.properties.type)} of ${esc(BY[selected].name)} · click to zoom in</div>`; placeTip(e); })
      .on("mouseleave", hideTip);
  }
  function selectProvince(name) {
    const f = provincesOf(selected).find(x => x.properties.name === name);
    if (!f) return;
    unpickZone();
    province = name;
    drawProvinces();
    frame(mainPart(f), 0.85, 600);
    setTab("dossier");
    $("#pane-dossier").scrollTop = 0;
  }
  // Bases that sit inside a province.
  const basesIn = (f, zones) => zones.filter(z => !z.host && d3.geoContains(f, z.at));
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
