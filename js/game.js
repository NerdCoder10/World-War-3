// Campaign engine: unlock rules, armies and turn-based wars, diplomacy, revolts. State persists in localStorage.
(function () {
  const STORE = "ww3-campaign-v3";
  const C = window.COUNTRIES, BY = window.BY_ISO, UNITS = window.UNITS;
  const UNIT = Object.fromEntries(UNITS.map(u => [u.key, u]));

  // ── Unlock rules ─────────────────────────────────────────────
  // 4 random African (never South Africa), 3 random European, 3 South American (Argentina
  // always, never Brazil, plus 2 random), plus Mexico, Mongolia, Kazakhstan and Bangladesh.
  // Everything else is locked until bought.
  const FIXED = ["ARG", "MEX", "MNG", "KAZ", "BGD"];
  const PICKS = [
    { region: "Africa", n: 4, exclude: ["ZAF"] },
    { region: "Europe", n: 3, exclude: [] },
    { region: "South America", n: 2, exclude: ["ARG", "BRA"] },
  ];

  function rng(seed) {
    // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rollUnlocked(seed) {
    const rand = rng(seed);
    const out = [];
    PICKS.forEach(({ region, n, exclude }) => {
      const pool = C.filter(c => c.region === region && !exclude.includes(c.iso3)).map(c => c.iso3);
      for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    });
    return out.concat(FIXED);
  }

  // forces: unit counts per country, created on first use from its inventory. armies: task forces
  // you have sent out. wars / revolts: fighting that resolves one round per turn.
  // enemies: AI armies sent against your nations. hostile: turn each country last turned on you.
  const EXTRA = () => ({ forces: {}, armies: [], wars: {}, revolts: {}, courted: {}, nextArmy: 1, enemies: [], hostile: {}, nextEnemy: 1, clock: 0, moves: [], nextMove: 1 });

  function fresh(seed) {
    seed = seed ?? Math.floor(Math.random() * 2 ** 31);
    const owner = {}, garrison = {};
    C.forEach(c => { owner[c.iso3] = c.iso3; garrison[c.iso3] = 1; });
    return {
      seed, unlocked: rollUnlocked(seed), player: null, owner, garrison, turn: 1, log: [], over: false, timeV: 1,
      coins: window.START_COINS, access: {}, tech: {}, tiers: 3, redeemed: [], purchased: [], ...EXTRA(),
    };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.owner && Object.keys(s.owner).length === C.length) return migrate(Object.assign(EXTRA(), s));
    } catch (e) { /* storage unavailable */ }
    return fresh();
  }
  // Saves from before real-time travel: arrival turns become hours on the new clock.
  function migrateClock(s) {
    if (s.timeV) return;
    s.clock = Math.max(s.clock || 0, (s.turn - 1) * 24);
    [...(s.armies || []), ...(s.enemies || [])].forEach(a => {
      if (a.etaH != null) return;
      a.sentH = Math.max(0, (a.sent - 1) * 24);
      a.etaH = Math.max(a.sentH, (a.eta - 1) * 24);
      if (a.eta <= s.turn) a.landed = true;
    });
    s.moves = s.moves || [];
    s.timeV = 1;
  }
  // Saves from before tiered access: an unlocked category (and troops) becomes level 90 (100%),
  // and each of the old 5 technology levels becomes 18 of the new 100.
  function migrate(s) {
    migrateClock(s);
    // Tiers 2: the old Weapons systems track (a combat bonus) became Arms production.
    if (s.tiers === 1) {
      Object.values(s.tech || {}).forEach(t => { if (t.weapons) { t.production = Math.max(t.production || 0, t.weapons); delete t.weapons; } });
      s.tiers = 2;
    }
    if (s.tiers) return s;
    s.access = {};
    Object.keys(s.owner).filter(iso => s.player && s.owner[iso] === s.player).forEach(iso => (s.access[iso] = { troops: window.LEVEL_FULL }));
    Object.entries(s.arsenal || {}).forEach(([iso, keys]) => keys.forEach(k => ((s.access[iso] = s.access[iso] || {})[k] = window.LEVEL_FULL)));
    Object.values(s.tech || {}).forEach(t => Object.keys(t).forEach(k => (t[k] = Math.min(window.LEVEL_FULL, t[k] * 18))));
    delete s.arsenal;
    Object.values(s.tech || {}).forEach(t => { if (t.weapons) { t.production = t.weapons; delete t.weapons; } });
    s.tiers = 2;
    return s;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(G.state)); } catch (e) { /* ignore */ } }

  // ── Strength helpers ─────────────────────────────────────────
  const empire = () => C.filter(c => G.state.owner[c.iso3] === G.state.player);
  const owns = iso => G.state.player && G.state.owner[iso] === G.state.player;

  // Access levels (0–100) the player has bought for each weapon category of one of their nations.
  // Troops start at level 1 (10%); every other category starts at 0 (locked).
  const accessLvl = (iso, k) => (((G.state.access || {})[iso] || {})[k] ?? (k === "troops" ? 1 : 0));
  const accessShare = (iso, k) => window.tierShare(accessLvl(iso, k));
  const usable = (iso, k) => accessShare(iso, k) > 0;
  // Surge levels (91–100) replace that kind of unit up to 10% faster, for nations you hold.
  const surge = (iso, k) => (owns(iso) ? window.tierSurge(accessLvl(iso, k)) : 0);
  const shareMap = iso => Object.fromEntries(UNITS.map(u => [u.key, accessShare(iso, u.key)]));

  // Researched technology levels (0–100) for one of their nations, as a share of the track's full effect.
  const TFULL = Object.fromEntries(window.TECH.map(t => [t.key, t.full]));
  const techLvl = (iso, k) => ((G.state.tech || {})[iso] || {})[k] || 0;
  const techShare = (iso, k) => window.tierShare(techLvl(iso, k)) + window.tierSurge(techLvl(iso, k));
  const usableStrength = c => window.truePowerWith(c, shareMap(c.iso3));

  // National traits: a nation's own effect, and empire-wide bonuses summed over every nation you control (capped).
  const fx = (iso, k) => BY[iso].trait.fx[k] || 0;
  function bonus(k) {
    const sum = empire().reduce((s, c) => s + fx(c.iso3, k), 0);
    return k in window.TRAIT_CAPS ? Math.min(window.TRAIT_CAPS[k], sum) : sum;
  }
  const industryCoins = c => Math.max(10, c.gdp * TFULL.industry) * techShare(c.iso3, "industry");

  function empireStrength() {
    // Home nation at full weight; occupied lands contribute 60% of their (remaining) strength.
    // Only the share of each category you have access to counts. Used for diplomacy.
    return empire().reduce((s, c) => s + usableStrength(c) * G.state.garrison[c.iso3] * (c.iso3 === G.state.player ? 1 : 0.6), 0);
  }
  const inRevolt = iso => !!G.state.revolts[iso];
  // Nations in revolt pay nothing; nations being invaded lose the share the enemy holds.
  const heldShare = iso => 1 - Math.min(1, ((G.state.invasions || {})[iso] || { progress: 0 }).progress / 100);
  const income = () => Math.round(20 + empire().filter(c => !inRevolt(c.iso3)).reduce((s, c) => s + (c.gdp * 0.02 + industryCoins(c)) * heldShare(c.iso3), 0) + bonus("inc"));
  const loot = t => Math.round((25 + t.gdp * 0.05) * (1 + bonus("loot")));
  function empireSoft() {
    const e = empire();
    return Math.max(...e.map(c => c.soft)) + 3 * Math.log2(e.length);
  }
  const empireGdp = () => empire().reduce((s, c) => s + c.gdp, 0);
  const empireNukes = () => empire().reduce((s, c) => s + c.nukes, 0);

  function bordersEmpire(iso) {
    const nb = window.NEIGHBORS[iso] || [];
    return nb.some(n => owns(n));
  }

  function alliedSupport(iso) {
    // Each free ally in a mutual-defence bloc sends 12% of its strength.
    const seen = new Set();
    let s = 0;
    const blocs = [];
    (window.ALLIES_OF[iso] || []).forEach(({ bloc, members }) => {
      if (!members.some(m => G.state.owner[m] === G.state.player)) blocs.push(bloc);
      members.forEach(m => {
        if (m === iso || seen.has(m) || owns(m) || G.state.owner[m] !== m) return;
        seen.add(m);
        s += 0.12 * BY[m].truePower * G.state.garrison[m];
      });
    });
    return { strength: s, blocs };
  }

  // ── Units, armies and power ─────────────────────────────────
  const baseForces = c => ({
    troops: c.active, tanks: c.tanks, afv: c.afv, arty: c.arty, aircraft: Math.max(0, c.aircraft - c.fighters),
    fighters: c.fighters, helis: c.helis, ships: c.ships, subs: c.subs, carriers: c.carriers,
  });
  const forces = iso => (G.state.forces[iso] = G.state.forces[iso] || baseForces(BY[iso]));
  // Each kind of unit counts by its real models (js/models.js) and the country's readiness.
  // `models` ({kind: {model: count}}) gives an army's actual mix; otherwise the national fleet mix is used.
  const rawPower = (units, iso, models) => UNITS.reduce((s, u) => s + (units[u.key] || 0) * u.power * window.unitQuality(BY[iso], u.key, models && models[u.key]), 0);
  // Military profile (js/techlevels.js): skill for every unit, patriotism when defending,
  // logistics when fighting away from home (near = overland, far = across the sea).
  const ms = iso => BY[iso].milStats;
  // Fixed fortification of a country's bases (js/app.js nationFort, 1–10): every point above 3
  // adds 4% to its defence, so a 10/10 tunnel network defends about 28% harder.
  const fortMult = iso => (window.nationFort ? Math.max(0.96, Math.min(1.3, 1 + 0.04 * (window.nationFort(iso) - 3))) : 1);
  const reach = (iso, sea) => (sea ? ms(iso).far : ms(iso).near);
  // Is a country fighting right now? (Private satellites join the national effort only then.)
  function atWar(iso) {
    const s = G.state;
    if (owns(iso)) return Object.keys(s.wars).length > 0 || s.enemies.some(e => e.vsPlayer) || Object.keys(s.revolts).length > 0;
    return !!(s.wars[iso] || (s.aiWars || {})[iso] || s.enemies.some(e => e.nat === iso || e.to === iso));
  }
  const space = iso => window.spaceMult(BY[iso], atWar(iso));
  const armyPower = a => rawPower(a.units, a.nat, a.models) * (1 + bonus("atk")) * ms(a.nat).skill * reach(a.nat, a.sea) * space(a.nat);
  const total = units => UNITS.reduce((s, u) => s + (units[u.key] || 0), 0);
  function scaleUnits(units, f) {
    UNITS.forEach(u => {
      const v = (units[u.key] || 0) * f;
      units[u.key] = u.key === "troops" ? (v < 0.05 ? 0 : v) : (v < 0.5 ? 0 : v);
    });
  }

  // Defence of an independent country: its remaining forces, home advantage, morale, its trait and allies.
  function defenceOf(iso) {
    const c = BY[iso];
    const allies = alliedSupport(iso);
    const allyMult = Math.min(2, allies.strength / Math.max(5, c.truePower));
    const base = rawPower(forces(iso), iso) * 1.25 * ms(iso).skill * ms(iso).defend * fortMult(iso) * space(iso) * (1 + fx(iso, "def")) + 20;
    return { base, allies, allyMult, total: base * (1 + allyMult) };
  }

  const arrived = a => (a.etaH != null ? a.etaH <= (G.state.clock || 0) : a.eta <= G.state.turn);
  const armiesAt = iso => G.state.armies.filter(a => a.to === iso && arrived(a));
  const deployedFrom = iso => {
    const d = {};
    G.state.armies.filter(a => a.nat === iso).forEach(a => UNITS.forEach(u => (d[u.key] = (d[u.key] || 0) + (a.units[u.key] || 0))));
    return d;
  };

  // Ground units can march to a target that borders the source or any of your nations linked to it by land.
  function landLinked(from, to) {
    const NB = window.NEIGHBORS, seen = new Set([from]), q = [from];
    while (q.length) {
      const x = q.shift();
      if ((NB[x] || []).includes(to)) return true;
      (NB[x] || []).forEach(n => { if (!seen.has(n) && owns(n)) { seen.add(n); q.push(n); } });
    }
    return false;
  }
  const distKm = (a, b) => {
    const P = window.CENTROIDS || {};
    return P[a] && P[b] ? d3.geoDistance(P[a], P[b]) * 6371 : 3000;
  };
  // Sealift: ships, carriers and transport aircraft carry ground units overseas.
  const liftMult = nat => 1 + bonus("proj") + TFULL.logistics * techShare(nat, "logistics");
  // ── Travel in real time ── 1 game hour passes every 30 real seconds, so a game day is 12 minutes.
  // Each unit moves at its real effective speed (km/h averaged over a day's movement, with halts,
  // refuelling and rest): a tank column road-marches ~300 km a day, a frigate makes ~16 knots,
  // a jet ferries at ~650 km/h. An army moves as fast as its slowest part. Roads wind (×1.25 the
  // straight line) and sea lanes go around land (×1.3).
  const SPEED = { troops: 30, tanks: 12, afv: 20, arty: 15, helis: 180, fighters: 650, aircraft: 550, ships: 30, subs: 22, carriers: 37 };
  // Airlift: only real transport aircraft can fly ground units, and only heavy lifters (C-17,
  // C-5, An-124, Il-76, A400M, Y-20, KC-390, Kawasaki C-2) can carry vehicles. Most countries have
  // a few tactical transports at most, so their armour can't fly. Only part of the fleet is free
  // for the job (15% of heavy lifters, 25% of tactical; the rest are in maintenance or busy),
  // times readiness.
  const HEAVY_LIFT = /C-17|C-5|An-124|An-22|Il-76|A400M|Y-20|KC-390|C-2\b/;
  function airlift(nat, units, km) {
    const c = BY[nat], f = forces(nat);
    const n = Math.round((f.aircraft || 0) * (owns(nat) ? accessShare(nat, "aircraft") : 1));
    let heavy = 0, tactical = 0;
    window.splitModels(c, "aircraft", n).forEach(([m, cnt]) => {
      if (window.modelSpec("aircraft", m).family !== "Transport aircraft" && !HEAVY_LIFT.test(m)) return;
      if (HEAVY_LIFT.test(m)) heavy += cnt; else tactical += cnt;
    });
    const H = Math.floor(heavy * 0.15 * c.tech.ready), T = Math.floor(tactical * 0.25 * c.tech.ready);
    const vehicles = (units.tanks || 0) + (units.afv || 0) / 2 + (units.arty || 0) / 2, troops = units.troops || 0;
    if ((vehicles > 0 && H < 1) || (troops > 0 && H + T < 1) || (!vehicles && !troops)) return { ok: false, H, T };
    // Per sortie a heavy lifter carries 1 tank, 2 lighter vehicles or ~100 troops; a tactical one ~80 troops.
    const trips = (vehicles ? Math.ceil(vehicles / H) : 0) + (troops ? Math.ceil(troops / (0.1 * H + 0.08 * T)) : 0);
    if (trips > 60) return { ok: false, H, T, trips };
    return { ok: true, H, T, trips, hours: 12 + (2 * trips - 1) * (km * 1.05) / 600 };
  }
  // fromPt (optional): the exact starting point, e.g. a base, instead of the source country's centre.
  function route(from, to, units, nat, fromPt) {
    const P = window.CENTROIDS || {};
    const km = fromPt && P[to] ? d3.geoDistance(fromPt, P[to]) * 6371 : distKm(from, to);
    const has = u => (units[u.key] || 0) > 0;
    const ground = UNITS.some(u => u.kind === "ground" && has(u));
    const naval = UNITS.some(u => u.kind === "naval" && has(u));
    const land = landLinked(from, to);
    const need = UNITS.reduce((s, u) => s + (u.lift || 0) * (units[u.key] || 0), 0);
    const cap = UNITS.reduce((s, u) => s + (u.carry || 0) * (units[u.key] || 0), 0) * liftMult(nat);
    const legs = [];
    UNITS.filter(u => u.kind === "air" && has(u)).forEach(u => legs.push((km * 1.05) / SPEED[u.key]));
    const navalUnits = UNITS.filter(u => u.kind === "naval" && has(u));
    navalUnits.forEach(u => legs.push((km * 1.3) / SPEED[u.key]));
    let mode = !ground && !naval ? "air" : naval ? "sea" : "land", ok = true, air = null;
    if (ground) {
      const slowest = Math.min(...UNITS.filter(u => u.kind === "ground" && has(u)).map(u => SPEED[u.key]));
      const byLand = land ? (km * 1.25) / slowest : Infinity;
      // Ground units overseas ride the army's own ships (sealift), with ~2 days to load and unload.
      const seaSpeed = navalUnits.length ? Math.min(...navalUnits.map(u => SPEED[u.key])) : 30;
      const bySea = !land && need <= cap ? (km * 1.3) / seaSpeed + 48 : Infinity;
      air = airlift(nat, units, km);
      const byAir = air.ok ? air.hours : Infinity;
      const best = Math.min(byLand, bySea, byAir);
      if (best === Infinity) ok = false;
      else { legs.push(best); mode = best === byAir ? "airlift" : best === bySea ? "sea" : "land"; }
    }
    const hours = legs.length ? Math.max(...legs) : 1;
    return { km, land, sea: mode === "sea" && ground, mode, need, cap, air, hours: Math.max(0.5, hours), turns: Math.max(1, Math.ceil(hours / 24)), ok };
  }
  // When an army leaving now with this route arrives: hours on the clock, and the day (turn).
  const etaOf = hours => { const h = (G.state.clock || 0) + hours; return { etaH: h, eta: Math.floor(h / 24) + 1 }; };

  // What a nation's access levels let you call on from its home pool: the accessible share of its
  // whole force (home plus deployed), less what is already deployed.
  function accessible(iso) {
    const f = forces(iso), dep = deployedFrom(iso), out = {};
    UNITS.forEach(u => {
      const sh = accessShare(iso, u.key);
      if (!sh || !(f[u.key] > 0)) return;
      const v = Math.min(f[u.key], sh * (f[u.key] + (dep[u.key] || 0)) - (dep[u.key] || 0));
      const r = u.key === "troops" ? v : Math.floor(v + 1e-9);
      if (r > 0) out[u.key] = r;
    });
    return out;
  }
  // Units at home that defend: the accessible share of each category.
  const homeShare = iso => { const f = forces(iso), u = {}; UNITS.forEach(x => (u[x.key] = (f[x.key] || 0) * accessShare(iso, x.key))); return u; };

  // Where units can be sent from: your nations' home pools (accessible share only) and armies that have arrived.
  function sources(to) {
    const out = [];
    empire().forEach(c => {
      if (c.iso3 === to) return;
      const avail = accessible(c.iso3);
      if (total(avail) > 0) out.push({ key: "n:" + c.iso3, label: `${c.name} (home forces)`, at: c.iso3, nat: c.iso3, avail });
    });
    G.state.armies.filter(a => arrived(a) && a.to !== to).forEach(a => {
      out.push({ key: "a:" + a.id, label: `Army ${a.id} at ${BY[a.to].name}`, at: a.to, nat: a.nat, avail: { ...a.units }, army: a });
    });
    return out;
  }
  // A single base of one of your nations ("b:ISO|base name"): what it holds, capped by the nation's access levels.
  function baseSource(key) {
    const [iso, name] = key.slice(2).split("|");
    if (!owns(iso) || !window.baseKit) return null;
    const kit = window.baseKit(iso, name);
    if (!kit) return null;
    const acc = accessible(iso), avail = {};
    UNITS.forEach(u => { const v = Math.min(kit[u.key] || 0, acc[u.key] || 0); if (v > 0) avail[u.key] = v; });
    return { key, label: `${name} (${BY[iso].name})`, at: iso, nat: iso, base: name, avail, pt: window.basePoint && window.basePoint(iso, name) };
  }
  const findSource = (key, to) => (key.startsWith("b:") ? baseSource(key) : sources(to).find(s => s.key === key));

  function clean(units, avail) {
    const out = {};
    UNITS.forEach(u => {
      const v = Math.max(0, Math.min(Number(units[u.key]) || 0, (avail && avail[u.key]) || 0));
      if (v > 0) out[u.key] = u.key === "troops" ? v : Math.floor(v + 1e-9);
    });
    return out;
  }

  function preview(srcKey, to, units, models) {
    const src = findSource(srcKey, to);
    if (!src) return { err: "Choose where the units come from." };
    if (src.at === to) return { err: `Those units are already in ${BY[to].name}.` };
    const u = clean(units, src.avail);
    const r = route(src.at, to, u, src.nat, src.pt);
    const power = rawPower(u, src.nat, models) * (1 + bonus("atk")) * ms(src.nat).skill * reach(src.nat, r.sea) * space(src.nat);
    return { src, units: u, route: r, power, empty: total(u) === 0 };
  }

  // ── Actions ─────────────────────────────────────────────────
  function log(msg, kind) { G.state.log.unshift({ t: G.state.turn, msg, kind: kind || "info" }); G.state.log.length = Math.min(G.state.log.length, 120); }
  const unitList = units => UNITS.filter(u => units[u.key] > 0).map(u => u.key === "troops" ? (units.troops >= 1000 ? `${(units.troops / 1000).toFixed(2)}M troops` : `${fmt(units.troops)}k troops`) : `${Math.round(units[u.key]).toLocaleString("en-US")} ${u.label.toLowerCase()}`).join(", ");

  function ready() {
    const s = G.state;
    if (!s.player) return "Choose a nation to play first.";
    if (s.over) return "The campaign is over. Start a new one from the Campaign tab.";
    return null;
  }

  // Send units from a home pool or an army to any country. Nothing fights until the next End turn.
  // `models` ({kind: {model: count}}) records exactly which models were picked, e.g. at a base.
  function dispatch(srcKey, to, units, models) {
    const err = ready(); if (err) return err;
    const s = G.state, p = preview(srcKey, to, units, models);
    if (p.err) return p.err;
    if (p.empty) return "Pick at least one unit to send.";
    if (!p.route.ok) {
      const a2 = p.route.air || {};
      return `These ground units can't get there: overland is blocked, your ships give ${Math.floor(p.route.cap)} of the ${Math.ceil(p.route.need)} sealift needed, and ${a2.H || a2.T ? `${BY[p.src.nat].name}'s ${a2.H} heavy and ${a2.T} tactical transports available ${a2.H < 1 && (p.units.tanks || p.units.afv || p.units.arty) ? "can't lift vehicles (that needs heavy lifters like the C-17 or Il-76)" : "would need too many sorties"}` : `${BY[p.src.nat].name} has no transport aircraft for an airlift`}. Add ships or carriers, or send fewer ground units.`;
    }
    const src = p.src, { etaH, eta } = etaOf(p.route.hours);
    if (src.army) {
      UNITS.forEach(u => (src.army.units[u.key] = (src.army.units[u.key] || 0) - (p.units[u.key] || 0)));
      if (total(src.army.units) < 0.05) s.armies = s.armies.filter(a => a !== src.army);
    } else {
      const f = forces(src.at);
      UNITS.forEach(u => (f[u.key] -= p.units[u.key] || 0));
      // Units taken from a particular base leave that base (see baseOut in js/app.js computeDeployment).
      if (src.base) {
        const out = (((s.baseOut = s.baseOut || {})[src.at] = s.baseOut[src.at] || {})[src.base] = s.baseOut[src.at][src.base] || {});
        UNITS.forEach(u => { if (p.units[u.key]) out[u.key] = (out[u.key] || 0) + p.units[u.key]; });
      }
    }
    const a = { id: s.nextArmy++, nat: src.nat, from: src.at, to, units: p.units, eta, etaH, sent: s.turn, sentH: s.clock || 0, sea: p.route.sea, mode: p.route.mode, fromPt: src.pt };
    if (models) a.models = JSON.parse(JSON.stringify(models));
    else if (src.army && src.army.models) a.models = JSON.parse(JSON.stringify(src.army.models));
    s.armies.push(a);
    if (!owns(to)) provoke(s.owner[to]);
    const t = BY[to];
    const goal = owns(to) ? (inRevolt(to) ? "to put down the revolt in" : "to") : "to invade";
    log(`🚚 Army ${a.id} (${unitList(p.units)}) left ${src.base ? src.base + ", " : ""}${BY[src.at].name} ${goal} ${t.name} by ${MODE_LABEL[p.route.mode]}${p.route.mode === "airlift" ? ` (${p.route.air.trips} sorties)` : ""}. ${Math.round(p.route.km).toLocaleString("en-US")} km: arrives in ${fmtDur(p.route.hours)} (${clockLabel(etaH)}).`, "info");
    save();
    return null;
  }

  // Redeploy units between two bases of the same nation (within the country: no travel turn).
  // Stored as per-base offsets in G.state.baseMoves and applied by computeDeployment (js/app.js).
  // Distance and travel time of a base-to-base move (no state change). { err } if it can't happen.
  function moveQuote(iso, from, to, units) {
    const err = ready(); if (err) return { err };
    if (!owns(iso)) return { err: "You can only move units of nations in your empire." };
    if (from === to) return { err: "Those units are already at that base." };
    const kit = window.baseKit && window.baseKit(iso, from);
    if (!kit || !window.baseKit(iso, to)) return { err: "Unknown base." };
    const u = clean(units, kit);
    if (!total(u)) return { err: "Pick at least one unit to move." };
    const pa = window.basePoint(iso, from), pb = window.basePoint(iso, to), km = d3.geoDistance(pa, pb) * 6371;
    const hours = Math.max(0.5, ...UNITS.filter(x => u[x.key]).map(x => (km * (x.kind === "air" ? 1.05 : x.kind === "naval" ? 1.3 : 1.25)) / SPEED[x.key]));
    return { u, km, hours, pa, pb };
  }
  function moveUnits(iso, from, to, units) {
    const q = moveQuote(iso, from, to, units);
    if (q.err) return q.err;
    const s = G.state, u = q.u;
    // They leave now and join the other base when they get there.
    const mv = ((s.baseMoves = s.baseMoves || {})[iso] = s.baseMoves[iso] || {});
    const a = (mv[from] = mv[from] || {});
    UNITS.forEach(x => { if (u[x.key]) a[x.key] = (a[x.key] || 0) - u[x.key]; });
    const { pa, pb, km, hours } = q;
    const m = { id: s.nextMove = (s.nextMove || 1), iso, from, to, units: u, sentH: s.clock || 0, ...etaOf(hours), a: pa, b: pb };
    s.nextMove++;
    (s.moves = s.moves || []).push(m);
    log(`🚛 ${unitList(u)} left ${from} for ${to} (${BY[iso].name}, ${Math.round(km)} km): arrive in ${fmtDur(hours)} (${clockLabel(m.etaH)}).`, "info");
    save();
    return null;
  }

  const MODE_LABEL = { land: "road", sea: "sea", air: "air", airlift: "airlift" };
  // Game-time durations and clock labels. 1 game hour = 30 real seconds.
  function fmtDur(h) {
    if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
    const d = Math.floor(h / 24), hh = Math.floor(h % 24), mm = Math.round((h % 1) * 60);
    return d ? `${d} d ${hh} h` : `${hh} h${mm ? ` ${mm} min` : ""}`;
  }
  const clockLabel = h => `day ${Math.floor(h / 24) + 1}, ${String(Math.floor(h % 24)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
  // Time left until something (an army, enemy force or base move) arrives.
  const etaLeft = x => fmtDur(Math.max(0, (x.etaH != null ? x.etaH : (x.eta - 1) * 24) - (G.state.clock || 0)));

  // Bring an army back to its home nation (no sealift needed to come home).
  function recall(id) {
    const s = G.state, a = s.armies.find(x => x.id === id);
    if (!a) return "That army no longer exists.";
    const home = owns(a.nat) ? a.nat : s.player;
    const at = arrived(a) ? a.to : a.from;
    if (at === home && arrived(a)) return disband(id);
    const r = route(at, home, a.units, a.nat);
    const back = r.ok ? r.hours : (r.km * 1.3) / 30 + 48; // home by any means
    Object.assign(a, { from: at, to: home, sent: s.turn, sentH: s.clock || 0, landed: false, fromPt: null }, etaOf(back));
    log(`↩️ Army ${a.id} is heading home to ${BY[home].name}, arriving in ${fmtDur(back)} (${clockLabel(a.etaH)}).`, "info");
    save();
    return null;
  }

  // Merge an army into its home nation's forces.
  function disband(id) {
    const s = G.state, a = s.armies.find(x => x.id === id);
    if (!a) return "That army no longer exists.";
    if (!arrived(a) || a.to !== a.nat || !owns(a.nat)) return "An army can only stand down once it is back in its home nation.";
    const f = forces(a.nat);
    UNITS.forEach(u => (f[u.key] += a.units[u.key] || 0));
    s.armies = s.armies.filter(x => x !== a);
    // With nothing of this nation's out in the field, its bases fill up evenly again.
    if (!s.armies.some(x => x.nat === a.nat) && s.baseOut) delete s.baseOut[a.nat];
    save();
    return null;
  }

  function diplomacyOdds(iso) {
    const t = BY[iso];
    if (t.nukes > 0) return { p: 0, why: "Nuclear powers cannot be absorbed diplomatically." };
    if (G.state.wars[iso]) return { p: 0, why: `You are at war with ${t.name}.` };
    const S = empireSoft(), Gp = empireGdp(), A = empireStrength();
    const D = BY[iso].truePower * 1.25 * (1 + t.soft / 400) + 0.3;
    let p = 0.75 * (S / (S + t.soft)) * (Gp / (Gp + t.gdp)) * (A / (A + D));
    if (!bordersEmpire(iso)) p *= 0.6;
    if ((window.ALLIES_OF[iso] || []).length) p *= 0.5;
    p *= (1 + bonus("dip")) * (1 - fx(iso, "res"));
    return { p: Math.min(0.9, p) };
  }

  function influence(iso) {
    const err = ready(); if (err) return err;
    const s = G.state, t = BY[iso];
    if (owns(iso)) return "Already part of your empire.";
    if (s.courted[iso] === s.turn) return `You have already courted ${t.name} this turn. Try again next turn.`;
    const d = diplomacyOdds(iso);
    if (d.p <= 0) return d.why;
    s.courted[iso] = s.turn;
    if (Math.random() < d.p) {
      annex(iso, 0.9);
      s.coins += loot(t);
      log(`🤝 ${t.name} joined your union peacefully (${Math.round(d.p * 100)}% odds). +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins.`, "good");
    } else {
      log(`📜 ${t.name} rejected your diplomatic overtures (${Math.round(d.p * 100)}% odds).`, "info");
    }
    save();
    return null;
  }

  function annex(iso, garrison) {
    const s = G.state;
    s.owner[iso] = s.player;
    s.garrison[iso] = garrison;
    delete s.wars[iso];
  }

  // ── Turn resolution ─────────────────────────────────────────
  const noise = () => 0.75 + 0.5 * Math.random();

  // One round of fighting in a country you are invading.
  function warRound(iso) {
    const s = G.state, t = BY[iso], armies = armiesAt(iso);
    const war = (s.wars[iso] = s.wars[iso] || { start: s.turn, p0: rawPower(forces(iso), iso), nuked: false });
    const A = armies.reduce((x, a) => x + armyPower(a), 0), D = defenceOf(iso).total;
    const r = A / (A + D);
    scaleUnits(forces(iso), 1 - Math.min(0.6, 0.3 * r * noise()));
    const al = Math.min(0.6, 0.3 * (1 - r) * noise());
    armies.forEach(a => scaleUnits(a.units, 1 - al));
    s.armies = s.armies.filter(a => total(a.units) >= 0.05);
    const left = armiesAt(iso);
    const prog = warProgress(iso);
    if (!left.length) {
      delete s.wars[iso];
      log(`🛡️ Your invasion of ${t.name} was destroyed. ${t.name} holds.`, "bad");
      return;
    }
    if (prog >= 1) {
      // Nuclear-armed defenders may escalate rather than lose (once per war).
      if (t.nukes > 0 && !war.nuked && Math.random() < (empireNukes() > 0 ? 0.3 : 0.6)) {
        war.nuked = true;
        left.forEach(a => scaleUnits(a.units, 0.4));
        empire().forEach(c => { scaleUnits(forces(c.iso3), 0.75); s.garrison[c.iso3] *= 0.7; });
        log(`☢️ ${t.name} launched a nuclear strike to stop your invasion! Your armies there lost 60%, and your home forces lost 25%.`, "bad");
        return;
      }
      annex(iso, 0.5);
      scaleUnits(forces(iso), 0.5); // survivors surrender and join you, weapons locked
      s.coins += loot(t);
      log(`⚔️ Conquered ${t.name} after ${s.turn - war.start + 1} turn(s) of fighting. +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins${t.nukes ? `, +${t.nukes} warheads` : ""}. Your armies are now stationed there.`, "good");
      return;
    }
    log(`⚔️ Fighting in ${t.name}: your strength ${A.toFixed(0)} vs ${D.toFixed(0)}. Defences ${Math.round(prog * 100)}% broken.`, r >= 0.5 ? "good" : "info");
  }
  // 0 → 1: share of the defender's pre-war forces destroyed, where 80% destroyed = conquest.
  const warProgress = iso => {
    const w = G.state.wars[iso];
    return w && w.p0 > 0 ? Math.max(0, Math.min(1, (1 - rawPower(forces(iso), iso) / w.p0) / 0.8)) : 0;
  };

  // Loyal side in a revolt: the territory's own accessible forces plus your armies stationed there.
  function loyalPower(iso) {
    const u = homeShare(iso);
    return rawPower(u, iso) * ms(iso).skill * ms(iso).defend * space(iso) * (0.5 + 0.5 * G.state.garrison[iso]) + armiesAt(iso).reduce((x, a) => x + armyPower(a), 0);
  }

  function startRevolt(c) {
    const s = G.state, b = baseForces(c), size = 0.15 + 0.35 * (1 - s.garrison[c.iso3]);
    const units = { troops: Math.max(1, b.troops * size), tanks: b.tanks * size * 0.3, afv: b.afv * size * 0.3, arty: b.arty * size * 0.5 };
    UNITS.forEach(u => (units[u.key] = units[u.key] || 0));
    s.revolts[c.iso3] = { start: s.turn, units, r0: rawPower(units, c.iso3), progress: 0 };
    log(`🔥 ${c.name} rose in revolt! ${fmt(units.troops)}k rebels are fighting your garrison. Send forces before they win independence.`, "bad");
  }

  function revoltRound(iso) {
    const s = G.state, c = BY[iso], rv = s.revolts[iso];
    const L = loyalPower(iso), R = rawPower(rv.units, iso) * 1.1 + 5;
    const r = L / (L + R);
    scaleUnits(rv.units, 1 - Math.min(0.6, 0.35 * r * noise()));
    const ll = Math.min(0.6, 0.3 * (1 - r) * noise());
    scaleUnits(forces(iso), 1 - ll * 0.5);
    armiesAt(iso).forEach(a => scaleUnits(a.units, 1 - ll));
    s.armies = s.armies.filter(a => total(a.units) >= 0.05);
    rv.progress = Math.max(0, rv.progress + 50 * (0.5 - r) * noise());
    if (rawPower(rv.units, iso) <= 0.15 * rv.r0) {
      delete s.revolts[iso];
      s.garrison[iso] = Math.max(s.garrison[iso], 0.6);
      log(`✅ The revolt in ${c.name} was crushed after ${s.turn - rv.start + 1} turn(s).`, "good");
    } else if (rv.progress >= 100) {
      delete s.revolts[iso];
      s.owner[iso] = iso; s.garrison[iso] = 0.6;
      const f = forces(iso);
      UNITS.forEach(u => (f[u.key] = (f[u.key] || 0) * 0.5 + (rv.units[u.key] || 0)));
      s.armies.filter(a => a.to === iso).forEach(a => recall(a.id));
      log(`🏳️ ${c.name} won its independence. Your armies there are withdrawing.`, "bad");
    } else {
      log(`🔥 Revolt in ${c.name}: loyal ${L.toFixed(0)} vs rebels ${R.toFixed(0)}. Rebel progress ${Math.round(rv.progress)}%.`, r >= 0.5 ? "info" : "bad");
    }
  }

  // Units regrow toward their pre-war size: 5% a turn for independent countries not at war,
  // 3% for your nations (less whatever is deployed in armies), plus trait and logistics bonuses.
  function regrow(c, rate, deployed) {
    const f = forces(c.iso3), b = baseForces(c);
    UNITS.forEach(u => {
      const cap = Math.max(0, b[u.key] - ((deployed && deployed[u.key]) || 0));
      if (f[u.key] < cap) f[u.key] = Math.min(cap, f[u.key] + b[u.key] * rate * (1 + surge(c.iso3, u.key)));
    });
  }

  // ── Enemy AI: counter-attacks on your nations ───────────────
  // Invading a country makes it hostile for 12 turns and it strikes back. Other neighbours of
  // your empire strike now and then when your border looks weak. Treaty allies stay out of it.
  // Their armies travel and fight round by round like yours.
  const HOSTILE_TURNS = 12;
  function provoke(iso) { G.state.hostile[iso] = G.state.turn; }
  const isHostile = iso => G.state.hostile[iso] != null && G.state.turn - G.state.hostile[iso] <= HOSTILE_TURNS;
  const enemyPower = e => rawPower(e.units, e.nat) * ms(e.nat).skill * reach(e.nat, e.sea) * space(e.nat);
  const enemiesAt = iso => G.state.enemies.filter(e => e.to === iso && arrived(e));
  const enemyDeployed = iso => {
    const d = {};
    G.state.enemies.filter(e => e.nat === iso).forEach(e => UNITS.forEach(u => (d[u.key] = (d[u.key] || 0) + (e.units[u.key] || 0))));
    return d;
  };
  // Your side when one of your nations is attacked: its own accessible forces, order, trait and stationed armies.
  function homeDefence(iso) {
    const u = homeShare(iso);
    return rawPower(u, iso) * 1.25 * ms(iso).skill * ms(iso).defend * fortMult(iso) * space(iso) * (1 + fx(iso, "def")) * (0.5 + 0.5 * G.state.garrison[iso]) +
      armiesAt(iso).reduce((x, a) => x + armyPower(a), 0) + 10;
  }

  // Defence of any target: yours (homeDefence) or an AI country's (defenceOf).
  const targetDefence = T => (owns(T) ? homeDefence(T) : defenceOf(T).total);
  function launchEnemy(A, T) {
    const s = G.state, f = forces(A), land = (window.NEIGHBORS[A] || []).includes(T), vsPlayer = owns(T);
    // Send roughly 0.9–2× what defends the target, within a share of the army that grows with hostility.
    const cap = !vsPlayer ? 0.45 : isHostile(A) ? 0.45 : 0.3;
    const want = targetDefence(T) * (0.9 + 1.1 * Math.random()) / Math.max(1, rawPower(f, A) * ms(A).skill);
    const share = Math.max(0.03, Math.min(cap, want));
    const units = {};
    UNITS.forEach(u => { if (u.kind !== "naval" || !land) units[u.key] = (f[u.key] || 0) * share; });
    if (!land) {
      // Overseas: ground units only as far as their ships and transports can carry them.
      const need = UNITS.reduce((x, u) => x + (u.lift || 0) * (units[u.key] || 0), 0);
      const cap = UNITS.reduce((x, u) => x + (u.carry || 0) * (units[u.key] || 0), 0);
      if (need > cap) UNITS.forEach(u => { if (u.kind === "ground") units[u.key] *= cap / need; });
    }
    scaleUnits(units, 1);
    if (rawPower(units, A) < 30) return;
    UNITS.forEach(u => (f[u.key] -= units[u.key] || 0));
    const r = route(A, T, units, A), hours = r.ok ? r.hours : (r.km * 1.3) / 30 + 48, { eta, etaH } = etaOf(hours);
    // Your intelligence decides whether you see the attack coming or only when it lands.
    const detected = !vsPlayer || Math.random() < Math.max(0.1, Math.min(0.97, 0.25 + 0.075 * myIntel() - 0.04 * BY[A].intelProfile.counter));
    const e = { id: s.nextEnemy++, nat: A, from: A, to: T, units, eta, etaH, sent: s.turn, sentH: s.clock || 0, sea: !land, vsPlayer, detected };
    s.enemies.push(e);
    if (vsPlayer) {
      s.hostile[A] = s.turn;
      if (detected) log(`🚨 Intelligence warning: ${BY[A].name} launched an attack on ${BY[T].name}: about ${unitList(fuzzUnits(units, A))}. Arrives in ${fmtDur(hours)} (${clockLabel(etaH)}). Send forces to defend it.`, "bad");
    } else log(`🌍 ${BY[A].name} invaded ${BY[T].name} with ${unitList(units)}. Arrives in ${fmtDur(hours)}.`, "world");
  }

  // ── Intelligence: what you can see of others ───────────────
  // Your best intelligence score across your nations. Estimates of enemy strength carry an error
  // band that shrinks with your intelligence and widens with their counter-intelligence.
  const myIntel = () => (G.state.player ? Math.max(...empire().map(c => c.intelProfile.score)) : 5);
  function intelError(iso) {
    return Math.max(0.05, Math.min(0.6, 0.55 - 0.045 * myIntel() + 0.03 * BY[iso].intelProfile.counter));
  }
  // Deterministic per turn and country, so estimates don't flicker between redraws.
  function noiseFor(iso, salt) {
    let h = 2166136261 ^ G.state.turn ^ (salt || 0);
    for (const ch of iso) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return ((h >>> 0) % 10000) / 10000 * 2 - 1;
  }
  function estimate(value, iso, salt) {
    const err = owns(iso) ? 0 : intelError(iso);
    return { est: value * (1 + err * noiseFor(iso, salt)), err };
  }
  function fuzzUnits(units, iso) {
    const err = intelError(iso), out = {};
    UNITS.forEach((u, i) => (out[u.key] = (units[u.key] || 0) * (1 + err * noiseFor(iso, i + 7))));
    return out;
  }

  function aiTurn() {
    const s = G.state;
    const mine = empire().map(c => c.iso3);
    C.forEach(c => {
      const A = c.iso3;
      if (s.owner[A] !== A || owns(A) || s.enemies.some(e => e.nat === A)) return;
      const hostile = isHostile(A);
      if (!hostile && s.turn < 10) return;
      const pa = rawPower(forces(A), A);
      if (pa < 50) return;
      const nb = window.NEIGHBORS[A] || [];
      const navy = (forces(A).ships || 0) + (forces(A).carriers || 0) * 10 >= 15;
      const targets = mine.filter(T => nb.includes(T) || (hostile && navy && distKm(A, T) < 6000));
      if (!targets.length) return;
      const T = targets.reduce((best, t) => (homeDefence(t) < homeDefence(best) ? t : best));
      const ratio = pa * 0.4 / homeDefence(T);
      const p = hostile ? 0.25 * Math.min(1.5, Math.max(0.4, ratio)) : ratio > 2 ? Math.min(0.03, 0.005 * ratio) : 0;
      if (Math.random() < p) launchEnemy(A, T);
    });
    aiWorldTurn();
  }

  // ── Wars between AI countries ───────────────────────────────
  // Long-running rivalries flare up now and then; elsewhere a much stronger neighbour may pick
  // on a weak one. At most six such wars run at once.
  const RIVALS = [["RUS", "UKR"], ["IND", "PAK"], ["ARM", "AZE"], ["ETH", "ERI"], ["SDN", "SSD"], ["KOR", "PRK"], ["CHN", "TWN"],
    ["ISR", "IRN"], ["SAU", "YEM"], ["GRC", "TUR"], ["COD", "RWA"], ["VEN", "GUY"], ["MAR", "DZA"], ["AFG", "PAK"], ["CHN", "IND"], ["THA", "KHM"], ["EGY", "ETH"]];
  const RIVAL = new Map();
  RIVALS.forEach(([a, b]) => { RIVAL.set(a, (RIVAL.get(a) || []).concat(b)); RIVAL.set(b, (RIVAL.get(b) || []).concat(a)); });
  const aiFree = iso => !owns(iso) && G.state.owner[iso] === iso;
  function aiWorldTurn() {
    const s = G.state;
    if (s.turn < 3) return;
    let active = s.enemies.filter(e => !e.vsPlayer).length;
    C.forEach(c => {
      const A = c.iso3;
      if (active >= 6 || !aiFree(A) || s.enemies.some(e => e.nat === A)) return;
      const pa = rawPower(forces(A), A) * ms(A).skill;
      if (pa < 80) return;
      const nb = window.NEIGHBORS[A] || [];
      const rivals = (RIVAL.get(A) || []).filter(T => !owns(T) && s.owner[T] !== A);
      // Opportunism skips treaty allies and pairs of stable, well-liked countries (no France–Luxembourg wars).
      const allied = T => (window.ALLIES_OF[A] || []).some(({ members }) => members.includes(T));
      const weak = nb.filter(T => !owns(T) && s.owner[T] !== A && T !== A && !allied(T) && !(c.soft >= 45 && BY[T].soft >= 35) &&
        pa * 0.4 > 2 * defenceOf(T).total);
      let T = null;
      if (rivals.length && Math.random() < 0.025) T = rivals[Math.floor(Math.random() * rivals.length)];
      else if (weak.length && Math.random() < 0.004) T = weak[Math.floor(Math.random() * weak.length)];
      if (!T) return;
      const before = s.enemies.length;
      launchEnemy(A, T);
      if (s.enemies.length > before) active++;
    });
  }

  // One round of a war between AI countries.
  function aiWarRound(T) {
    const s = G.state, c = BY[T], foes = enemiesAt(T);
    const w = ((s.aiWars = s.aiWars || {})[T] = s.aiWars[T] || { by: foes[0].nat, start: s.turn, p0: rawPower(forces(T), T) });
    const E = foes.reduce((x, e) => x + enemyPower(e), 0), D = defenceOf(T).total, r = E / (E + D);
    foes.forEach(e => scaleUnits(e.units, 1 - Math.min(0.6, 0.3 * (1 - r) * noise())));
    scaleUnits(forces(T), 1 - Math.min(0.6, 0.3 * r * noise()));
    s.enemies = s.enemies.filter(e => rawPower(e.units, e.nat) >= 3);
    const left = enemiesAt(T), by = BY[w.by].name;
    if (!left.length) {
      delete s.aiWars[T];
      log(`🌍 ${c.name} defeated the invasion by ${by}.`, "world");
    } else if (rawPower(forces(T), T) <= 0.2 * w.p0) {
      const f = forces(T);
      UNITS.forEach(u => (f[u.key] = (f[u.key] || 0) * 0.3 + left.reduce((x, e) => x + (e.units[u.key] || 0), 0)));
      s.enemies = s.enemies.filter(e => !left.includes(e));
      s.owner[T] = s.owner[w.by] || w.by; s.garrison[T] = 0.6;
      delete s.aiWars[T];
      log(`🌍 ${by} conquered ${c.name} after ${s.turn - w.start + 1} turn(s) of war.`, "world");
    }
  }

  // One round of an enemy assault on one of your nations.
  function defendRound(iso) {
    const s = G.state, c = BY[iso], foes = enemiesAt(iso);
    const inv = (s.invasions = s.invasions || {})[iso] || (s.invasions[iso] = { start: s.turn, progress: 0, e0: foes.reduce((x, e) => x + enemyPower(e), 0) });
    const E = foes.reduce((x, e) => x + enemyPower(e), 0), D = homeDefence(iso);
    const r = E / (E + D);
    const el = Math.min(0.6, 0.3 * (1 - r) * noise());
    foes.forEach(e => scaleUnits(e.units, 1 - el));
    const dl = Math.min(0.6, 0.3 * r * noise());
    scaleUnits(forces(iso), 1 - dl);
    armiesAt(iso).forEach(a => scaleUnits(a.units, 1 - dl));
    s.armies = s.armies.filter(a => total(a.units) >= 0.05);
    s.enemies = s.enemies.filter(e => rawPower(e.units, e.nat) >= 3);
    inv.progress = Math.max(0, inv.progress + 50 * (r - 0.5) * noise());
    const by = [...new Set(foes.map(e => BY[e.nat].name))].join(" and ");
    const left = enemiesAt(iso);
    if (!left.length || left.reduce((x, e) => x + enemyPower(e), 0) <= 0.1 * inv.e0) {
      left.forEach(e => (s.enemies = s.enemies.filter(x => x !== e)));
      delete s.invasions[iso];
      s.coins += Math.round(loot(c) * 0.3);
      log(`🛡️ ${c.name} beat off the attack by ${by}. +${Math.round(loot(c) * 0.3)} coins in captured equipment.`, "good");
    } else if (inv.progress >= 100) {
      delete s.invasions[iso];
      loseNation(iso, left[0].nat, left);
    } else {
      log(`🚨 ${by} attacking ${c.name}: enemy ${E.toFixed(0)} vs your ${D.toFixed(0)}. Enemy ${Math.round(inv.progress)}% of the way to taking it.`, r < 0.5 ? "info" : "bad");
    }
  }

  // An enemy took one of your nations. Losing your home nation moves your capital, or ends the game.
  function loseNation(iso, by, foes) {
    const s = G.state, c = BY[iso], f = forces(iso);
    s.armies.filter(a => a.to === iso).forEach(a => recall(a.id));
    delete s.revolts[iso];
    UNITS.forEach(u => (f[u.key] = (f[u.key] || 0) * 0.3 + foes.reduce((x, e) => x + (e.units[u.key] || 0), 0)));
    s.enemies = s.enemies.filter(e => !foes.includes(e));
    s.owner[iso] = by; s.garrison[iso] = 0.6;
    log(`💥 ${BY[by].name} captured ${c.name} from you.`, "bad");
    if (iso !== s.player) return;
    const rest = empire().sort((a, b) => b.gdp - a.gdp);
    if (!rest.length) { s.over = true; log(`💀 Defeat. ${c.name} fell and your empire is gone. Start a new campaign from the Campaign tab.`, "bad"); return; }
    const cap = rest[0].iso3, old = s.player;
    C.forEach(x => { if (s.owner[x.iso3] === old) s.owner[x.iso3] = cap; });
    s.player = cap;
    log(`🏛️ Your government fled to ${BY[cap].name}, the new capital of your empire.`, "bad");
  }

  // Armies, enemy forces and base moves that have reached their destination by the clock.
  // Returns the number of new arrivals.
  function arrivals() {
    const s = G.state;
    let n = 0;
    s.armies.filter(a => !a.landed && arrived(a)).forEach(a => {
      a.landed = true; n++;
      if (a.to === a.nat && owns(a.nat)) { disband(a.id); log(`🏠 Army ${a.id} is home in ${BY[a.nat].name} and back in reserve.`, "info"); }
      else log(`📍 Army ${a.id} arrived in ${BY[a.to].name}${owns(a.to) ? "" : ". It fights at the end of the day"}.`, "info");
    });
    s.enemies.filter(e => !e.landed && arrived(e)).forEach(e => {
      e.landed = true;
      if (e.vsPlayer && !e.detected) {
        e.detected = true; n++;
        log(`💥 Surprise attack! ${BY[e.nat].name} struck ${BY[e.to].name} without warning: about ${unitList(fuzzUnits(e.units, e.nat))}. Better intelligence would have seen it coming.`, "bad");
      } else if (e.vsPlayer) { n++; log(`⚔️ ${BY[e.nat].name}'s forces reached ${BY[e.to].name}.`, "bad"); }
    });
    (s.moves || []).filter(m => arrived(m)).forEach(m => {
      if (owns(m.iso)) {
        const mv = ((s.baseMoves = s.baseMoves || {})[m.iso] = s.baseMoves[m.iso] || {}), b = (mv[m.to] = mv[m.to] || {});
        UNITS.forEach(x => { if (m.units[x.key]) b[x.key] = (b[x.key] || 0) + m.units[x.key]; });
        log(`📍 ${unitList(m.units)} reached ${m.to}.`, "info");
        n++;
      }
      s.moves = s.moves.filter(x => x !== m);
    });
    return n;
  }
  // Advance the clock by `ms` real milliseconds (30 real seconds = 1 game hour). At midnight the
  // day's fighting resolves (endTurn). Returns { arrived, newDay }.
  const REAL_MS_PER_HOUR = 30000; // a game day lasts 12 real minutes
  function tick(ms) {
    const s = G.state;
    if (!s.player || s.over || s.paused) return { arrived: 0, newDay: false };
    s.clock = (s.clock || 0) + ms / REAL_MS_PER_HOUR;
    let arrivedN = arrivals(), newDay = false;
    while (!s.over && s.clock >= s.turn * 24) { endTurn(); newDay = true; }
    if (arrivedN || newDay) save();
    else if (Math.random() < 0.1) save(); // keep the clock saved without writing every second
    return { arrived: arrivedN, newDay };
  }
  function setPaused(p) { G.state.paused = !!p; save(); }

  function endTurn() {
    const err = ready(); if (err) return err;
    const s = G.state;
    // A turn is one game day: the clock moves on to the start of the next day.
    s.clock = Math.max(s.clock || 0, s.turn * 24);
    s.turn++;
    arrivals();
    // Enemy armies go home when their target changed hands (no longer yours, now yours, or already theirs).
    s.enemies.filter(e => arrived(e) && (e.vsPlayer ? !owns(e.to) : owns(e.to) || s.owner[e.to] === e.nat)).forEach(e => {
      const f = forces(e.nat);
      UNITS.forEach(u => (f[u.key] += e.units[u.key] || 0));
      s.enemies = s.enemies.filter(x => x !== e);
    });
    // Fighting: invasions, then revolts.
    [...new Set(s.armies.filter(a => arrived(a) && !owns(a.to)).map(a => a.to))].forEach(warRound);
    Object.keys(s.revolts).forEach(revoltRound);
    [...new Set(s.enemies.filter(arrived).map(e => e.to))].forEach(iso => (owns(iso) ? defendRound(iso) : aiWarRound(iso)));
    Object.keys(s.aiWars || {}).forEach(iso => { if (!s.enemies.some(e => e.to === iso)) delete s.aiWars[iso]; });
    Object.keys(s.wars).forEach(iso => (s.hostile[iso] = s.turn));
    // A war ends when you have no armies fighting in or heading to that country.
    // (If an AI army is also fighting there, yours and theirs both fight the defender.)
    Object.keys(s.wars).forEach(iso => { if (!s.armies.some(x => x.to === iso)) delete s.wars[iso]; });
    // Bases whose units are all back home or lost fill up evenly again.
    Object.keys(s.baseOut || {}).forEach(iso => { if (!owns(iso) || !s.armies.some(x => x.nat === iso)) delete s.baseOut[iso]; });
    // Recovery: home 8%/turn up to 100%, occupied 5%/turn up to 85%.
    C.forEach(c => {
      const iso = c.iso3, cap = owns(iso) && iso !== s.player ? 0.85 : 1;
      if (!inRevolt(iso)) s.garrison[iso] = Math.min(cap, s.garrison[iso] + (cap === 1 ? 0.08 : 0.05) + fx(iso, "rec") + 0.05 * techShare(iso, "governance"));
      if (!s.forces[iso] || inRevolt(iso) || s.wars[iso] || (s.aiWars || {})[iso]) return;
      if (owns(iso)) regrow(c, (0.03 + fx(iso, "rec")) * (1 + TFULL.production * techShare(iso, "production")), deployedFrom(iso));
      else regrow(c, 0.05 + fx(iso, "rec"), enemyDeployed(iso));
    });
    // Occupied territories may rise up when weakly held; your armies stationed there calm them.
    empire().forEach(c => {
      const iso = c.iso3;
      if (iso === s.player || inRevolt(iso) || (s.purchased || []).includes(iso)) return;
      const calm = (1 - fx(iso, "stab")) * (1 - TFULL.governance * Math.min(1, techShare(iso, "governance"))) * (armiesAt(iso).length ? 0.3 : 1);
      if (Math.random() < (0.06 * (1 - s.garrison[iso]) + 0.01) * calm) startRevolt(c);
    });
    if (!s.over) aiTurn();
    s.coins += income();
    const share = empireGdp() / window.WORLD_GDP;
    if (share >= 0.5 && !s.over) { s.over = true; log(`🏆 Victory! Your empire controls ${Math.round(share * 100)}% of world GDP.`, "good"); }
    save();
    return null;
  }

  function choose(iso) {
    if (G.state.player) return "You already lead a nation. Start a new campaign to switch.";
    if (!G.state.unlocked.includes(iso)) return "That nation is locked.";
    G.state.player = iso;
    log(`🎖️ You now lead ${BY[iso].name}. Goal: control 50% of world GDP.`, "good");
    save();
    return null;
  }

  // Buy a country for its price in coins. Before a campaign starts this unlocks it as playable;
  // during a campaign it joins your empire peacefully (its access levels start at troops level 1).
  function buy(iso) {
    const s = G.state, t = BY[iso];
    if (s.over) return "The campaign is over. Start a new one to keep buying.";
    if (!s.player && !G.isLocked(iso)) return `${t.name} is already playable.`;
    if (s.player && owns(iso)) return `${t.name} is already part of your empire.`;
    if (s.coins < t.price) return `You need ${fmtCoins(t.price - s.coins)} more coins to buy ${t.name}.`;
    s.coins -= t.price;
    if (!s.player) {
      s.unlocked.push(iso);
      log(`💰 Bought ${t.name} for ${fmtCoins(t.price)} coins. It is now playable.`, "good");
    } else {
      annex(iso, 1);
      s.purchased = (s.purchased || []).concat([iso]);
      log(`💰 Bought ${t.name} for ${fmtCoins(t.price)} coins. It joins your empire; raise its access levels to use more of its forces.`, "good");
    }
    save();
    return null;
  }

  // Price of raising a level n times from `from`, stopping at `cap`. Returns { n, cost } for the
  // levels bought, up to `budget` coins if given.
  function levelPrice(full, from, n, cap, budget) {
    let cost = 0, k = 0;
    while (k < n && from + k < cap) {
      const c = window.levelCost(full, from + k);
      if (budget != null && cost + c > budget) break;
      cost += c; k++;
    }
    return { n: k, cost };
  }
  // "max" buys up to level 90 (100% access), then up to 100 once there.
  const capFor = (lvl, n) => (n === "max" && lvl < window.LEVEL_FULL ? window.LEVEL_FULL : window.LEVEL_MAX);
  const steps = n => (n === "max" ? window.LEVEL_MAX : Math.max(1, Math.floor(n) || 1));
  const accessFull = (c, key) => (key === "troops" ? c.troopCost : (c.weapons.find(w => w.key === key) || {}).cost || 0);
  const accessQuote = (iso, key, n) => { const l = accessLvl(iso, key); return levelPrice(accessFull(BY[iso], key), l, steps(n), capFor(l, n), n === "max" ? G.state.coins : null); };
  const techQuote = (iso, key, n) => { const l = techLvl(iso, key); return levelPrice(window.techFull(BY[iso]), l, steps(n), capFor(l, n), n === "max" ? G.state.coins : null); };

  // Raise a weapon category's access level by n levels (or "max").
  function raiseAccess(iso, key, n) {
    const s = G.state, c = BY[iso];
    if (!owns(iso)) return "You can only raise access for nations in your empire.";
    const label = key === "troops" ? "Troops" : ((c.weapons.find(w => w.key === key) || {}).label);
    if (!accessFull(c, key)) return "This nation has none of that.";
    const lvl = accessLvl(iso, key);
    if (lvl >= window.LEVEL_MAX) return `${label} are already at level ${window.LEVEL_MAX}.`;
    const q = accessQuote(iso, key, n);
    if (!q.n || s.coins < q.cost) {
      const one = window.levelCost(accessFull(c, key), lvl);
      return `You need ${fmtCoins(Math.max(one, q.cost) - s.coins)} more coins to raise ${label.toLowerCase()} access.`;
    }
    s.coins -= q.cost;
    s.access = s.access || {};
    s.access[iso] = Object.assign({}, s.access[iso], { [key]: lvl + q.n });
    const L = lvl + q.n, sur = window.tierSurge(L);
    log(`🔓 ${c.name}'s ${label.toLowerCase()} access is now level ${L} (${Math.round(window.tierShare(L) * 100)}% of the force${sur ? `, +${Math.round(sur * 100)}% surge` : ""}) for ${fmtCoins(q.cost)} coins.`, "good");
    save();
    return null;
  }

  function upgradeTech(iso, key, n) {
    const s = G.state, c = BY[iso], t = window.TECH.find(x => x.key === key);
    if (!owns(iso)) return "You can only research technology for nations in your empire.";
    if (!t) return "Unknown technology.";
    const lvl = techLvl(iso, key);
    if (lvl >= window.LEVEL_MAX) return `${t.label} is already at the maximum level.`;
    const q = techQuote(iso, key, n);
    if (!q.n || s.coins < q.cost) {
      const one = window.levelCost(window.techFull(c), lvl);
      return `You need ${fmtCoins(Math.max(one, q.cost) - s.coins)} more coins to research ${t.label.toLowerCase()}.`;
    }
    s.coins -= q.cost;
    s.tech = s.tech || {};
    s.tech[iso] = Object.assign({}, s.tech[iso], { [key]: lvl + q.n });
    log(`🔬 ${c.name} researched ${t.label.toLowerCase()} to level ${lvl + q.n} for ${fmtCoins(q.cost)} coins.`, "good");
    save();
    return null;
  }

  function redeem(raw) {
    const code = String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return { err: "Type a promo code first." };
    const amount = window.PROMO_CODES[code];
    if (!amount) return { err: `"${code}" isn't a valid promo code. Check the spelling and try again.` };
    if (G.state.redeemed.includes(code)) return { err: `${code} has already been redeemed this campaign.` };
    G.state.redeemed.push(code);
    G.state.coins += amount;
    log(`🎟️ Promo code ${code} redeemed: +${fmtCoins(amount)} coins.`, "good");
    save();
    return { amount };
  }

  // Wipe everything saved by the game (campaign, coins, purchases, promo codes, armies) and start over.
  function resetAll() {
    try { Object.keys(localStorage).filter(k => k.startsWith("ww3-")).forEach(k => localStorage.removeItem(k)); } catch (e) { /* storage unavailable */ }
    G.state = fresh();
    save();
  }

  function newGame(keepRoster) {
    G.state = fresh(keepRoster ? G.state.seed : undefined);
    save();
  }

  const fmtCoins = n => n >= 1e15 ? (n / 1e15).toFixed(2) + " quadrillion" : n >= 1e12 ? (n / 1e12).toFixed(2) + "trn" : n >= 1e9 ? (n / 1e9).toFixed(2) + "bn" : n >= 1e6 ? (n / 1e6).toFixed(2) + "m" : Math.round(n).toLocaleString("en-US");
  const fmt = n => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n >= 10 ? Math.round(n) : n.toFixed(1));

  // Active fronts for the map: who is pushing into which country and how far (0–1).
  function fronts() {
    const s = G.state, out = [];
    Object.keys(s.wars).forEach(iso => { const a = armiesAt(iso)[0]; if (a) out.push({ to: iso, from: a.from, nat: a.nat, p: warProgress(iso), kind: "player" }); });
    Object.entries(s.invasions || {}).forEach(([iso, inv]) => { const e = enemiesAt(iso)[0]; if (e) out.push({ to: iso, from: e.from, nat: e.nat, p: inv.progress / 100, kind: "enemy" }); });
    Object.entries(s.aiWars || {}).forEach(([iso, w]) => {
      const e = enemiesAt(iso)[0];
      if (e && w.p0 > 0) out.push({ to: iso, from: e.from, nat: e.nat, p: Math.max(0, Math.min(1, (1 - rawPower(forces(iso), iso) / w.p0) / 0.8)), kind: "ai" });
    });
    return out;
  }

  const G = (window.GAME = {
    state: load(),
    isLocked: iso => !G.state.unlocked.includes(iso),
    baseSource, moveUnits, moveQuote, fortMult, tick, setPaused, fmtDur, clockLabel, etaLeft, SPEED, owns, empire, empireStrength, empireSoft, empireGdp, empireNukes, income, accessLvl, accessShare, accessible, accessQuote, techQuote, techShare, usable, bonus, techLvl, upgradeTech, industryCoins,
    forces, baseForces, rawPower, enemyPower, atWar, estimate, fuzzUnits, intelError, myIntel, fronts, heldShare, enemiesAt, homeDefence, isHostile, armyPower, defenceOf, armiesAt, arrived, sources, preview, dispatch, recall, disband, warProgress, loyalPower,
    inRevolt, liftMult, unitList, endTurn, diplomacyOdds, influence, choose, newGame, resetAll, bordersEmpire, raiseAccess, redeem, buy, fmtCoins,
  });
})();
