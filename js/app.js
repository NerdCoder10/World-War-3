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
  function computeDeployment(iso) {
    const zones = deploymentFor(iso), c = BY[iso];
    const totals = { tanks: c.tanks, afv: c.afv, arty: c.arty, fighters: c.fighters, aircraft: Math.max(0, c.aircraft - c.fighters), helis: c.helis, ships: c.ships, subs: c.subs, carriers: c.carriers };
    zones.forEach(z => (z.kit = {}));
    KIT.forEach(([key]) => {
      const n = totals[key];
      const w = zones.map(z => kitWeight(z, key)), tw = w.reduce((a, b) => a + b, 0);
      if (!n || !tw) return;
      // Largest-remainder rounding keeps whole units that add up to the national total.
      const raw = w.map(x => (n * x) / tw), out = raw.map(Math.floor);
      let left = n - out.reduce((a, b) => a + b, 0);
      raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
      zones.forEach((z, i) => (z.kit[key] = out[i]));
    });
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
  // States / provinces of the selected country (Natural Earth admin-1, loaded on demand).
  const provLayer = root.append("g").attr("class", "prov-layer");
  const markerSel = root.append("g").selectAll("circle").data(markers).join("circle")
    .attr("class", "marker")
    .on("click", (e, m) => select(m.c.iso3))
    .on("mousemove", (e, m) => showTip(e, { iso: m.c.iso3 }))
    .on("mouseleave", hideTip);
  const deployLayer = root.append("g").attr("class", "deploy-layer");
  const armyLayer = root.append("g").attr("class", "army-layer");
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
  Object.entries(ICONS).forEach(([type, tiers]) => Object.entries(tiers).forEach(([tier, body]) =>
    defs.append("symbol").attr("id", `ic-${type}-${tier}`).attr("viewBox", "0 0 24 24").html(body)));

  // Effective technology of a nation's forces: its design generation plus your weapons research.
  const effGen = iso => BY[iso].tech.gen + 0.15 * G.techLvl(iso, "weapons");
  const iconClass = iso => `unit-icon tier-${window.techTier(effGen(iso))}${BY[iso].tech.ready < 0.6 ? " worn" : ""}`;
  const iconHref = (type, iso) => `#ic-${type}-${window.techTier(effGen(iso))}`;
  // Most important kind of force at a base: fleet, air wing, armour or infantry.
  function zoneType(c, z) {
    const kit = z.kit || {};
    if (z.navalPct > z.groundPct && (kit.ships || kit.subs || kit.carriers)) return "ship";
    if (z.airPct > z.groundPct * 2 && (kit.fighters || kit.aircraft || kit.helis)) return "jet";
    if ((kit.tanks || 0) >= 5 && (kit.tanks || 0) >= c.tanks * z.groundPct * 0.8) return "tank";
    return "soldier";
  }
  // Most powerful kind of unit in an army.
  function armyType(units) {
    const p = { soldier: 0, tank: 0, jet: 0, ship: 0 };
    window.UNITS.forEach(u => {
      const v = (units[u.key] || 0) * u.power;
      p[u.kind === "naval" ? "ship" : u.kind === "air" ? "jet" : u.key === "troops" ? "soldier" : "tank"] += v;
    });
    return Object.keys(p).reduce((a, b) => (p[b] > p[a] ? b : a));
  }
  const techLine = iso => { const t = BY[iso].tech; return `Gen ${effGen(iso).toFixed(1)} ${window.techTier(effGen(iso))} kit · readiness ${Math.round(t.ready * 100)}% (${window.readyLabel(t.ready)})`; };

  let k = 1;
  // Markers grow gently up to 10× zoom, then hold their on-screen size for the province and base views.
  const shrink = () => (k <= 10 ? Math.sqrt(k) : Math.sqrt(10) * Math.pow(k / 10, 0.8));
  function garrR(z) { return (2.5 + 16 * Math.sqrt(Math.max(z.groundPct, z.navalPct * 0.6, z.airPct * 0.5, 0.003))) / shrink(); }
  const iconR = r => Math.max(r * 1.25, 5 / shrink());
  function drawDeploy() {
    // Largest rings first so smaller bases sit on top and stay hoverable.
    const zones = (selected ? computeDeployment(selected) : []).sort((x, y) => garrR(y) - garrR(x));
    const c = selected && BY[selected];
    const g = deployLayer.selectAll("g.base").data(zones, z => z.name).join(enter => {
      const e = enter.append("g").attr("class", "base");
      e.append("circle");
      e.append("use");
      return e;
    });
    g.select("circle")
      .attr("class", z => "garrison" + (z.navalPct > z.groundPct ? " naval" : "") + (z.host ? " abroad" : ""))
      .classed("picked", z => z.name === pickedZone)
      .on("mousemove", (e, z) => zoneTip(e, z))
      .on("mouseleave", hideTip)
      .on("click", (e, z) => { e.stopPropagation(); hideTip(); pickZone(z, false); });
    g.select("use").attr("href", z => iconHref(zoneType(c, z), selected)).attr("class", iconClass(selected || "USA"));
    placeBases();
  }
  function placeBases() {
    deployLayer.selectAll("g.base").each(function (z) {
      const [x, y] = projection(z.at), r = garrR(z), ir = iconR(r);
      const g = d3.select(this);
      g.select("circle").attr("cx", x).attr("cy", y).attr("r", r);
      g.select("use").attr("x", x - ir / 2).attr("y", y - ir / 2).attr("width", ir).attr("height", ir);
    });
  }
  const zoom = d3.zoom().scaleExtent([1, 400]).on("zoom", e => {
    k = e.transform.k;
    root.attr("transform", e.transform);
    markerSel.attr("r", 3.2 / shrink());
    placeBases();
    placeArmies();
  });
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
  }
  // Army routes (dashed lines) and unit icons for armies on the move, battles, revolts and stations.
  // Icons show each army's main unit type in its nation's technology tier.
  function drawArmies() {
    const s = G.state, P = window.CENTROIDS;
    const moving = s.armies.filter(a => !G.arrived(a) && P[a.from] && P[a.to]);
    const foes = s.enemies.filter(e => !G.arrived(e) && P[e.from] && P[e.to]);
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
  const hostLabel = z => (z.host ? (z.host === "TERR" ? "Overseas territory" : BY[z.host] ? BY[z.host].name : z.host) : "");
  // Counts at one base; anything that rounds to zero is left out.
  const countOf = (n, one, many) => { const r = Math.round(n); return r >= 1 ? `${num(r)} ${r === 1 ? one : many}` : ""; };
  function zoneStats(c, z) {
    return [z.groundPct > 0 ? `${kPers(c.active * z.groundPct)} troops` : ""]
      .concat(KIT.map(([k, one, many]) => countOf(z.kit[k] || 0, one, many))).filter(Boolean);
  }
  // Hover details for a base / garrison circle.
  function zoneTip(e, z) {
    const c = BY[selected], host = hostLabel(z);
    tip.innerHTML = `<b>${esc(z.name)}</b>${host ? `<div class="k">${esc(host)}</div>` : ""}<div class="k">${esc(zoneStats(c, z).join(" · "))}</div><div class="k">${esc(techLine(selected))}</div><div class="tipnote">${esc(z.note)}</div><div class="k">Click for details</div>`;
    placeTip(e);
  }
  // Clicking a base pins its card on the map and highlights it in the dossier list.
  function pickZone(z, fly) {
    pickedZone = z.name;
    deployLayer.selectAll("circle.garrison").classed("picked", d => d.name === pickedZone);
    const c = BY[selected], host = hostLabel(z);
    baseCard.innerHTML = `<button class="bc-close" aria-label="Close base card">×</button>
      <div class="bc-kind">${z.host ? "Forces abroad" : "Home base"} · ${esc(c.name)}</div>
      <h4>${esc(z.name)}</h4>${host ? `<span class="tag">${esc(host)}</span>` : ""}
      <dl>${zoneStats(c, z).map(t => { const [n, ...rest] = t.split(" "); return `<div><dd>${n}</dd><dt>${rest.join(" ")}</dt></div>`; }).join("")}</dl>
      <p>${esc(z.note)}</p>
      <button class="bc-fly">Zoom to base</button>`;
    baseCard.hidden = false;
    baseCard.querySelector(".bc-close").onclick = unpickZone;
    // Bases zoom in past the country and province views.
    const baseK = () => Math.max(d3.zoomTransform(svg.node()).k * 2.5, province ? 120 : 70);
    baseCard.querySelector(".bc-fly").onclick = () => flyTo(z.at, baseK());
    if (fly) flyTo(z.at, baseK());
    if (tab !== "dossier") setTab("dossier");
    const pane = $("#pane-dossier");
    pane.querySelectorAll("li.picked").forEach(x => x.classList.remove("picked"));
    const li = pane.querySelector(`li[data-zone="${CSS.escape(z.name)}"]`);
    if (li) { const d = li.closest("details"); if (d) d.open = true; li.classList.add("picked"); li.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
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
    const t = d3.zoomIdentity.translate(w / 2, h / 2).scale(Math.min(400, kk)).translate(-x, -y);
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
      vs = ` Army strength ${p.power.toFixed(0)} vs defence ${D.total.toFixed(0)}${D.allyMult > 0.01 ? ` (incl. +${pct(D.allyMult)} from ${D.allies.blocs.join(", ")} allies)` : ""}.`;
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
  function frontHtml(c) {
    const s = G.state, here = s.armies.filter(a => a.to === c.iso3);
    let front = "";
    if (s.wars[c.iso3] || (!G.owns(c.iso3) && here.some(G.arrived))) {
      const D = G.defenceOf(c.iso3), A = G.armiesAt(c.iso3).reduce((x, a) => x + G.armyPower(a), 0), prog = G.warProgress(c.iso3);
      front = `<div class="front"><h4>⚔️ At war${s.wars[c.iso3] ? ` since turn ${s.wars[c.iso3].start}` : ""}</h4>
        <div class="bar"><i style="width:${prog * 100}%;background:${COL.danger}"></i></div>
        <p class="hint">Defences ${Math.round(prog * 100)}% broken (conquest at 100%). Your strength here ${A.toFixed(0)} vs defence ${D.total.toFixed(0)}.</p>
        <p class="hint">Remaining defenders: ${esc(G.unitList(G.forces(c.iso3)) || "almost none")}.</p></div>`;
    } else if (G.inRevolt(c.iso3)) {
      const rv = s.revolts[c.iso3], R = G.rawPower(rv.units, c.iso3) * 1.1 + 5, L = G.loyalPower(c.iso3);
      front = `<div class="front revolt"><h4>🔥 Revolt since turn ${rv.start}</h4>
        <div class="bar"><i style="width:${Math.min(100, rv.progress)}%;background:#f0a03c"></i></div>
        <p class="hint">Rebels are ${Math.round(rv.progress)}% of the way to independence. Loyal strength ${L.toFixed(0)} vs rebels ${R.toFixed(0)} (${esc(G.unitList(rv.units))}). Crush 85% of the rebels to end it, or send more forces.</p></div>`;
    } else if (!G.owns(c.iso3) && s.player) {
      const D = G.defenceOf(c.iso3);
      front = `<p class="hint">Defence strength ${D.total.toFixed(0)}${D.allyMult > 0.01 ? ` (incl. +${pct(D.allyMult)} from ${esc(D.allies.blocs.join(", "))} allies)` : ""}. Forces: ${esc(G.unitList(G.forces(c.iso3)) || "none")}.${c.nukes ? " ☢️ Nuclear power: it may strike your armies before it falls." : ""}</p>`;
    }
    const foes = s.enemies.filter(e => e.to === c.iso3);
    if (foes.length && G.owns(c.iso3)) {
      const at = foes.filter(G.arrived), inv = (s.invasions || {})[c.iso3];
      const E = at.reduce((x, e) => x + G.enemyPower(e), 0);
      front += `<div class="front"><h4>🚨 ${at.length ? "Under attack" : "Attack incoming"}</h4>
        ${inv ? `<div class="bar"><i style="width:${Math.min(100, inv.progress)}%;background:${COL.danger}"></i></div><p class="hint">The enemy is ${Math.round(inv.progress)}% of the way to taking ${esc(c.name)}. Enemy strength ${E.toFixed(0)} vs your defence ${G.homeDefence(c.iso3).toFixed(0)}.</p>` : ""}
        ${foes.map(e => `<p class="hint"><b>${esc(BY[e.nat].name)}</b>: ${esc(G.unitList(e.units))}${G.arrived(e) ? " (fighting)" : `, arrives turn ${e.eta}`}.</p>`).join("")}
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
    const f = G.forces(c.iso3), b = G.baseForces(c), dep = {};
    G.state.armies.filter(a => a.nat === c.iso3).forEach(a => window.UNITS.forEach(u => (dep[u.key] = (dep[u.key] || 0) + (a.units[u.key] || 0))));
    const tiles = window.UNITS.filter(u => b[u.key] > 0 || f[u.key] > 0).map(u => {
      const ok = G.usable(c.iso3, u.key);
      return `<div class="${ok ? "" : "lockedw"}"><dt>${ok ? "" : "🔒 "}${u.label}</dt><dd>${unitFmt(u.key, f[u.key])}</dd>${dep[u.key] ? `<small class="hint">+${unitFmt(u.key, dep[u.key])} deployed</small>` : ""}</div>`;
    }).join("");
    return `<div class="section"><h3>Home forces <small>regrow each turn</small></h3><dl class="assets">${tiles}</dl>
      <p class="hint">Units at home are free to send. Open any country's dossier to send them there. Locked types (🔒) must be unlocked above first.</p></div>`;
  }

  function techHtml(c, mine) {
    const rows = window.TECH.map(t => {
      const lvl = G.techLvl(c.iso3, t.key), max = lvl >= window.TECH_MAX, cost = window.techCost(c, lvl);
      const pips = d3.range(window.TECH_MAX).map(i => `<i class="${i < lvl ? "on" : ""}"></i>`).join("");
      const btn = !mine ? "" : max ? `<span class="tag">max</span>` :
        `<button class="unlock" data-tech="${t.key}" ${G.state.coins < cost ? "aria-disabled=\"true\"" : ""}><span class="coin" aria-hidden="true"></span>${G.fmtCoins(cost)}</button>`;
      return `<li><div><b>${t.label}</b> <small>Lv ${lvl}/${window.TECH_MAX}</small><div class="pips">${pips}</div><span class="hint">${t.per} per level</span></div>${btn}</li>`;
    }).join("");
    return `<ul class="tech">${rows}</ul>${mine ? "" : `<p class="hint">Bring this nation into your empire to research upgrades for it.</p>`}`;
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
      inside.forEach(z => { sum.troops = (sum.troops || 0) + c.active * z.groundPct; KIT.forEach(([k2]) => (sum[k2] = (sum[k2] || 0) + (z.kit[k2] || 0))); });
      provBody = `<div class="provcard"><b>${esc(pf.properties.name)}</b> <span class="tag">${esc(pf.properties.type)}</span>
        <p class="hint">${inside.length ? `${inside.length} base${inside.length === 1 ? "" : "s"}: ${esc(zoneStats(c, { groundPct: (sum.troops || 0) / Math.max(c.active, 1e-9), kit: sum }).join(" · "))}. Click a base to zoom in further.` : "No listed bases in this region."}</p>
        ${inside.length ? `<ul class="zones">${inside.map(zoneLi).join("")}</ul>` : ""}</div>`;
    }
    const ms = c.milStats;
    const provHtml = `<div class="section"><h3>State / province <small>${provs.length ? `${provs.length} regions` : "loading…"}</small></h3>
        ${provs.length ? `<select id="prov-sel" class="provsel" aria-label="State or province"><option value="">Whole country</option>${provs.map(f => `<option ${f.properties.name === province ? "selected" : ""}>${esc(f.properties.name)}</option>`).join("")}</select>` : ""}
        ${provBody}</div>`;
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
          <div><dt>Purchase price</dt><dd>${G.fmtCoins(c.price)} <small>coins${c.pricePremium ? ` · +${Math.round(c.pricePremium * 100)}%` : ""}</small></dd></div>
        </dl>${c.valueNote ? `<p class="note">${esc(c.valueNote)}</p>` : ""}</div>

      <div class="section"><h3>Military power <small>declared · rank #${c.powerRank}/${C.length}</small></h3>
        <div class="big"><strong>${c.power}</strong><span>/ 100 power index</span></div>
        <div class="techrow"><svg class="${iconClass(c.iso3)}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-jet-${window.techTier(effGen(c.iso3))}"/></svg>
          <span><b>Gen ${effGen(c.iso3).toFixed(1)}</b> ${window.techTier(effGen(c.iso3))} technology · readiness <b>${Math.round(c.tech.ready * 100)}%</b> (${window.readyLabel(c.tech.ready)})${c.tech.estimated ? " <small>estimated</small>" : ""}</span></div>
        <div class="bar"><i style="width:${c.power}%;background:${MODES.power.hi}"></i></div>
        ${mine ? `<p class="hint armory">${lockedCount ? `${lockedCount} weapon ${lockedCount === 1 ? "category is" : "categories are"} locked. Locked weapons don't fight. You have <b>${G.fmtCoins(G.state.coins)}</b> coins.` : "All weapons unlocked and ready."} Usable strength ${window.truePowerWith(c, have).toFixed(1)} of ${c.truePower}.</p>` : ""}
        <dl class="assets">${base.join("")}${weaponTiles.join("")}
          <div class="nuke" style="grid-column:span 3"><dt>Nuclear warheads${mine ? " · always ready" : ""}</dt><dd>${c.nukes ? num(c.nukes) + (c.iso3 === "ISR" ? " (undeclared, est.)" : "") : "None"}</dd></div></dl></div>

      ${profileHtml}

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
      const err = G.upgradeTech(c.iso3, b.dataset.tech);
      if (err) return toast(err);
      toast(G.state.log[0].msg); refresh();
    }));
    pane.querySelectorAll("[data-act]").forEach(b => (b.onclick = () => act(b.dataset.act, c.iso3)));
    const ps = pane.querySelector("#prov-sel");
    if (ps) ps.onchange = () => { if (ps.value) selectProvince(ps.value); else { province = null; unpickZone(); drawProvinces(); zoomTo(c.iso3); dossier(); } };
    pane.querySelectorAll("li[data-zone]").forEach(li => {
      const go = () => { const z = zones.find(x => x.name === li.dataset.zone); if (z) pickZone(z, true); };
      li.onclick = go;
      li.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    });
    if (pickedZone) { const li = pane.querySelector(`li[data-zone="${CSS.escape(pickedZone)}"]`); if (li) li.classList.add("picked"); }
    pane.querySelectorAll("[data-unlock]").forEach(b => (b.onclick = () => {
      const err = G.unlockWeapon(c.iso3, b.dataset.unlock);
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
        ${s.enemies.filter(e => e.vsPlayer).map(e => `<p class="hint">🚨 <b>${esc(BY[e.nat].name)}</b> ${G.arrived(e) ? "is attacking" : `will hit`} <a href="#" data-goto="${e.to}">${esc(BY[e.to].name)}</a>${G.arrived(e) ? "" : ` on turn ${e.eta}`}: ${esc(G.unitList(e.units))}.</p>`).join("")}
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
    wireArmies(pane);
    pane.querySelectorAll("a[data-goto]").forEach(a => (a.onclick = e => { e.preventDefault(); select(a.dataset.goto); }));
    if ($("#endturn2")) $("#endturn2").onclick = () => $("#endturn").click();
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
    refresh();
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
    selected = iso; paint(); drawDeploy(); drawProvinces(); zoomTo(iso); setTab("dossier"); $("#pane-dossier").scrollTop = 0;
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
    frame(mainPart(f), 0.85, 160);
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
