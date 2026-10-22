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
  const EXTRA = () => ({ forces: {}, armies: [], wars: {}, revolts: {}, courted: {}, nextArmy: 1, enemies: [], hostile: {}, nextEnemy: 1 });

  function fresh(seed) {
    seed = seed ?? Math.floor(Math.random() * 2 ** 31);
    const owner = {}, garrison = {};
    C.forEach(c => { owner[c.iso3] = c.iso3; garrison[c.iso3] = 1; });
    return {
      seed, unlocked: rollUnlocked(seed), player: null, owner, garrison, turn: 1, log: [], over: false,
      coins: window.START_COINS, arsenal: {}, tech: {}, redeemed: [], purchased: [], ...EXTRA(),
    };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.owner && Object.keys(s.owner).length === C.length) return Object.assign(EXTRA(), s);
    } catch (e) { /* storage unavailable */ }
    return fresh();
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(G.state)); } catch (e) { /* ignore */ } }

  // ── Strength helpers ─────────────────────────────────────────
  const empire = () => C.filter(c => G.state.owner[c.iso3] === G.state.player);
  const owns = iso => G.state.player && G.state.owner[iso] === G.state.player;

  // Weapon categories the player has bought for one of their nations.
  const arsenal = iso => G.state.arsenal[iso] || [];
  // Troops always fight; every other unit type must be unlocked for that nation.
  const usable = (iso, k) => k === "troops" || arsenal(iso).includes(k);

  // Researched technology levels for one of their nations.
  const TSTEP = Object.fromEntries(window.TECH.map(t => [t.key, t.step]));
  const techLvl = (iso, k) => ((G.state.tech || {})[iso] || {})[k] || 0;
  const usableStrength = c => window.truePowerWith(c, arsenal(c.iso3)) * (1 + TSTEP.weapons * techLvl(c.iso3, "weapons"));

  // National traits: a nation's own effect, and empire-wide bonuses summed over every nation you control (capped).
  const fx = (iso, k) => BY[iso].trait.fx[k] || 0;
  function bonus(k) {
    const sum = empire().reduce((s, c) => s + fx(c.iso3, k), 0);
    return k in window.TRAIT_CAPS ? Math.min(window.TRAIT_CAPS[k], sum) : sum;
  }
  const industryCoins = c => Math.max(2, c.gdp * TSTEP.industry) * techLvl(c.iso3, "industry");

  function empireStrength() {
    // Home nation at full weight; occupied lands contribute 60% of their (remaining) strength.
    // Only unlocked weapon categories count. Used for diplomacy.
    return empire().reduce((s, c) => s + usableStrength(c) * G.state.garrison[c.iso3] * (c.iso3 === G.state.player ? 1 : 0.6), 0);
  }
  const inRevolt = iso => !!G.state.revolts[iso];
  const income = () => Math.round(20 + empire().filter(c => !inRevolt(c.iso3)).reduce((s, c) => s + c.gdp * 0.02 + industryCoins(c), 0) + bonus("inc"));
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
  const rawPower = (units, iso) => UNITS.reduce((s, u) => s + (units[u.key] || 0) * u.power, 0) * window.combatQuality(BY[iso]);
  const techMult = iso => 1 + TSTEP.weapons * techLvl(iso, "weapons");
  const armyPower = a => rawPower(a.units, a.nat) * techMult(a.nat) * (1 + bonus("atk"));
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
    const base = rawPower(forces(iso), iso) * 1.25 * (1 + c.soft / 400) * (1 + fx(iso, "def")) + 20;
    return { base, allies, allyMult, total: base * (1 + allyMult) };
  }

  const arrived = a => a.eta <= G.state.turn;
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
  const liftMult = nat => 1 + bonus("proj") + TSTEP.logistics * techLvl(nat, "logistics");
  function route(from, to, units, nat) {
    const km = distKm(from, to);
    const ground = UNITS.some(u => u.kind === "ground" && units[u.key] > 0);
    const naval = UNITS.some(u => u.kind === "naval" && units[u.key] > 0);
    const land = landLinked(from, to);
    const need = UNITS.reduce((s, u) => s + (u.lift || 0) * (units[u.key] || 0), 0);
    const cap = UNITS.reduce((s, u) => s + (u.carry || 0) * (units[u.key] || 0), 0) * liftMult(nat);
    const sea = ground && !land;
    const turns = !ground && !naval ? 1 : land && !naval ? 1 + Math.floor(km / 2500) : 1 + Math.ceil(km / 4000);
    return { km, land, sea, need, cap, turns, ok: !sea || need <= cap };
  }

  // Where units can be sent from: your nations' home pools (unlocked kinds only) and armies that have arrived.
  function sources(to) {
    const out = [];
    empire().forEach(c => {
      if (c.iso3 === to) return;
      const f = forces(c.iso3), avail = {};
      UNITS.forEach(u => { if (usable(c.iso3, u.key) && f[u.key] > 0) avail[u.key] = f[u.key]; });
      if (total(avail) > 0) out.push({ key: "n:" + c.iso3, label: `${c.name} (home forces)`, at: c.iso3, nat: c.iso3, avail });
    });
    G.state.armies.filter(a => arrived(a) && a.to !== to).forEach(a => {
      out.push({ key: "a:" + a.id, label: `Army ${a.id} at ${BY[a.to].name}`, at: a.to, nat: a.nat, avail: { ...a.units }, army: a });
    });
    return out;
  }
  const findSource = (key, to) => sources(to).find(s => s.key === key);

  function clean(units, avail) {
    const out = {};
    UNITS.forEach(u => {
      const v = Math.max(0, Math.min(Number(units[u.key]) || 0, (avail && avail[u.key]) || 0));
      if (v > 0) out[u.key] = u.key === "troops" ? v : Math.floor(v + 1e-9);
    });
    return out;
  }

  function preview(srcKey, to, units) {
    const src = findSource(srcKey, to);
    if (!src) return { err: "Choose where the units come from." };
    const u = clean(units, src.avail);
    const r = route(src.at, to, u, src.nat);
    const power = rawPower(u, src.nat) * techMult(src.nat) * (1 + bonus("atk"));
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
  function dispatch(srcKey, to, units) {
    const err = ready(); if (err) return err;
    const s = G.state, p = preview(srcKey, to, units);
    if (p.err) return p.err;
    if (p.empty) return "Pick at least one unit to send.";
    if (!p.route.ok) return `Not enough sealift: these ground units need ${Math.ceil(p.route.need)} lift and your ships and transports give ${Math.floor(p.route.cap)}. Add ships, carriers or transport aircraft, or send fewer ground units.`;
    const src = p.src, eta = s.turn + p.route.turns;
    if (src.army) {
      UNITS.forEach(u => (src.army.units[u.key] = (src.army.units[u.key] || 0) - (p.units[u.key] || 0)));
      if (total(src.army.units) < 0.05) s.armies = s.armies.filter(a => a !== src.army);
    } else {
      const f = forces(src.at);
      UNITS.forEach(u => (f[u.key] -= p.units[u.key] || 0));
    }
    const a = { id: s.nextArmy++, nat: src.nat, from: src.at, to, units: p.units, eta, sent: s.turn };
    s.armies.push(a);
    if (!owns(to)) provoke(to);
    const t = BY[to];
    const goal = owns(to) ? (inRevolt(to) ? "to put down the revolt in" : "to") : "to invade";
    log(`🚚 Army ${a.id} (${unitList(p.units)}) left ${BY[src.at].name} ${goal} ${t.name}. Arrives turn ${eta} by ${p.route.sea ? "sea" : p.route.land ? "land" : "air"}.`, "info");
    save();
    return null;
  }

  // Bring an army back to its home nation (no sealift needed to come home).
  function recall(id) {
    const s = G.state, a = s.armies.find(x => x.id === id);
    if (!a) return "That army no longer exists.";
    const home = owns(a.nat) ? a.nat : s.player;
    const at = arrived(a) ? a.to : a.from;
    if (at === home && arrived(a)) return disband(id);
    const r = route(at, home, a.units, a.nat);
    a.from = at; a.to = home; a.eta = s.turn + r.turns; a.sent = s.turn;
    log(`↩️ Army ${a.id} is heading home to ${BY[home].name}, arriving turn ${a.eta}.`, "info");
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

  // Loyal side in a revolt: the territory's own unlocked forces plus your armies stationed there.
  function loyalPower(iso) {
    const f = forces(iso), u = {};
    UNITS.forEach(x => { if (usable(iso, x.key)) u[x.key] = f[x.key]; });
    return rawPower(u, iso) * (0.5 + 0.5 * G.state.garrison[iso]) + armiesAt(iso).reduce((x, a) => x + armyPower(a), 0);
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
      if (f[u.key] < cap) f[u.key] = Math.min(cap, f[u.key] + b[u.key] * rate);
    });
  }

  // ── Enemy AI: counter-attacks on your nations ───────────────
  // Invading a country makes it hostile for 12 turns and it strikes back. Other neighbours of
  // your empire strike now and then when your border looks weak. Treaty allies stay out of it.
  // Their armies travel and fight round by round like yours.
  const HOSTILE_TURNS = 12;
  function provoke(iso) { G.state.hostile[iso] = G.state.turn; }
  const isHostile = iso => G.state.hostile[iso] != null && G.state.turn - G.state.hostile[iso] <= HOSTILE_TURNS;
  const enemyPower = e => rawPower(e.units, e.nat);
  const enemiesAt = iso => G.state.enemies.filter(e => e.to === iso && arrived(e));
  const enemyDeployed = iso => {
    const d = {};
    G.state.enemies.filter(e => e.nat === iso).forEach(e => UNITS.forEach(u => (d[u.key] = (d[u.key] || 0) + (e.units[u.key] || 0))));
    return d;
  };
  // Your side when one of your nations is attacked: its own unlocked forces, order, trait and stationed armies.
  function homeDefence(iso) {
    const f = forces(iso), u = {};
    UNITS.forEach(x => { if (usable(iso, x.key)) u[x.key] = f[x.key]; });
    return rawPower(u, iso) * techMult(iso) * 1.25 * (1 + fx(iso, "def")) * (0.5 + 0.5 * G.state.garrison[iso]) +
      armiesAt(iso).reduce((x, a) => x + armyPower(a), 0) + 10;
  }

  function launchEnemy(A, T) {
    const s = G.state, f = forces(A), land = (window.NEIGHBORS[A] || []).includes(T);
    // Send roughly 0.9–2× what defends the target, within a share of the army that grows with hostility.
    const cap = isHostile(A) ? 0.45 : 0.3;
    const want = homeDefence(T) * (0.9 + 1.1 * Math.random()) / Math.max(1, rawPower(f, A));
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
    const km = distKm(A, T), eta = s.turn + (land ? 1 + Math.floor(km / 2500) : 1 + Math.ceil(km / 4000));
    const e = { id: s.nextEnemy++, nat: A, from: A, to: T, units, eta, sent: s.turn };
    s.enemies.push(e);
    s.hostile[A] = s.turn;
    log(`🚨 ${BY[A].name} launched an attack on ${BY[T].name}: ${unitList(units)}. Arrives turn ${eta}. Send forces to defend it.`, "bad");
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

  function endTurn() {
    const err = ready(); if (err) return err;
    const s = G.state;
    s.turn++;
    // Armies arriving home stand down; arriving elsewhere they station or start fighting.
    s.armies.filter(a => a.eta === s.turn).forEach(a => {
      if (a.to === a.nat && owns(a.nat)) { disband(a.id); log(`🏠 Army ${a.id} is home in ${BY[a.nat].name} and back in reserve.`, "info"); }
      else log(`📍 Army ${a.id} arrived in ${BY[a.to].name}.`, "info");
    });
    // Enemy armies whose target is no longer yours go home.
    s.enemies.filter(e => arrived(e) && !owns(e.to)).forEach(e => {
      const f = forces(e.nat);
      UNITS.forEach(u => (f[u.key] += e.units[u.key] || 0));
      s.enemies = s.enemies.filter(x => x !== e);
    });
    // Fighting: invasions, then revolts.
    [...new Set(s.armies.filter(a => arrived(a) && !owns(a.to)).map(a => a.to))].forEach(warRound);
    Object.keys(s.revolts).forEach(revoltRound);
    [...new Set(s.enemies.filter(arrived).map(e => e.to))].forEach(iso => { if (owns(iso)) defendRound(iso); });
    Object.keys(s.wars).forEach(iso => (s.hostile[iso] = s.turn));
    // A war ends when you have no armies fighting in or heading to that country.
    Object.keys(s.wars).forEach(iso => { if (!s.armies.some(x => x.to === iso)) delete s.wars[iso]; });
    // Recovery: home 8%/turn up to 100%, occupied 5%/turn up to 85%.
    C.forEach(c => {
      const iso = c.iso3, cap = owns(iso) && iso !== s.player ? 0.85 : 1;
      if (!inRevolt(iso)) s.garrison[iso] = Math.min(cap, s.garrison[iso] + (cap === 1 ? 0.08 : 0.05) + fx(iso, "rec") + 0.01 * techLvl(iso, "governance"));
      if (!s.forces[iso] || inRevolt(iso) || s.wars[iso]) return;
      if (owns(iso)) regrow(c, (0.03 + fx(iso, "rec")) * (1 + TSTEP.logistics * techLvl(iso, "logistics")), deployedFrom(iso));
      else regrow(c, 0.05 + fx(iso, "rec"), enemyDeployed(iso));
    });
    // Occupied territories may rise up when weakly held; your armies stationed there calm them.
    empire().forEach(c => {
      const iso = c.iso3;
      if (iso === s.player || inRevolt(iso) || (s.purchased || []).includes(iso)) return;
      const calm = (1 - fx(iso, "stab")) * (1 - TSTEP.governance * techLvl(iso, "governance")) * (armiesAt(iso).length ? 0.3 : 1);
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
  // during a campaign it joins your empire peacefully (its weapons still need unlocking).
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
      log(`💰 Bought ${t.name} for ${fmtCoins(t.price)} coins. It joins your empire; unlock its weapons to use them.`, "good");
    }
    save();
    return null;
  }

  function unlockWeapon(iso, key) {
    const s = G.state;
    if (!owns(iso)) return "You can only unlock weapons for nations in your empire.";
    const w = BY[iso].weapons.find(x => x.key === key);
    if (!w || !w.count) return "This nation has none of that weapon.";
    if (arsenal(iso).includes(key)) return "Already unlocked.";
    if (s.coins < w.cost) return `You need ${w.cost - s.coins} more coins to unlock ${w.label.toLowerCase()}.`;
    s.coins -= w.cost;
    s.arsenal[iso] = arsenal(iso).concat([key]);
    log(`🔓 Unlocked ${BY[iso].name}'s ${w.label.toLowerCase()} (${w.count.toLocaleString("en-US")}) for ${w.cost} coins.`, "good");
    save();
    return null;
  }

  function upgradeTech(iso, key) {
    const s = G.state, c = BY[iso], t = window.TECH.find(x => x.key === key);
    if (!owns(iso)) return "You can only research technology for nations in your empire.";
    if (!t) return "Unknown technology.";
    const lvl = techLvl(iso, key);
    if (lvl >= window.TECH_MAX) return `${t.label} is already at the maximum level.`;
    const cost = window.techCost(c, lvl);
    if (s.coins < cost) return `You need ${fmtCoins(cost - s.coins)} more coins to research ${t.label.toLowerCase()}.`;
    s.coins -= cost;
    s.tech = s.tech || {};
    s.tech[iso] = Object.assign({}, s.tech[iso], { [key]: lvl + 1 });
    log(`🔬 ${c.name} researched ${t.label.toLowerCase()} level ${lvl + 1} for ${fmtCoins(cost)} coins.`, "good");
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

  const G = (window.GAME = {
    state: load(),
    isLocked: iso => !G.state.unlocked.includes(iso),
    owns, empire, empireStrength, empireSoft, empireGdp, empireNukes, income, arsenal, usable, bonus, techLvl, upgradeTech, industryCoins,
    forces, baseForces, rawPower, enemyPower, enemiesAt, homeDefence, isHostile, armyPower, defenceOf, armiesAt, arrived, sources, preview, dispatch, recall, disband, warProgress, loyalPower,
    inRevolt, liftMult, unitList, endTurn, diplomacyOdds, influence, choose, newGame, resetAll, bordersEmpire, unlockWeapon, redeem, buy, fmtCoins,
  });
})();
