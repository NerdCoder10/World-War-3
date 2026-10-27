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
  const empireMissiles = () => empire().reduce((s, c) => { const st = missileStock(c.iso3); return s + st.bm + st.cm; }, 0);

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

  // ── Your alliances with AI countries ────────────────────────
  // An ally stays independent but fights on your side: it sends 15% of its forces to defend any
  // of your nations it can reach, joins your invasions with 10% (it loses men alongside yours),
  // never attacks you, and can't be invaded while the alliance stands. Whether a country agrees
  // is decided by fixed terms, not dice (allianceTerms).
  const isAlly = iso => (G.state.allies || []).includes(iso) && G.state.owner[iso] === iso && !owns(iso);
  const allies = () => (G.state.allies || []).filter(isAlly);
  // Can an ally's forces get to a country: over land, by sea with a real navy, or nearby.
  const allyReaches = (a, T) => (window.NEIGHBORS[a] || []).includes(T) || ((forces(a).ships || 0) + (forces(a).carriers || 0) * 10 >= 15) || distKm(a, T) < 2500;
  const allyForce = (a, share) => share * rawPower(forces(a), a) * ms(a).skill * isr(a);
  // Help your allies send: to defend one of your nations, or to join your attack on a country
  // (not against their own treaty partners).
  function allyHelp(T, attack) {
    return allies().filter(a => a !== T && allyReaches(a, T) && !(attack && (window.ALLIES_OF[a] || []).some(({ members }) => members.includes(T))))
      .map(a => ({ iso: a, power: allyForce(a, attack ? 0.1 : 0.15) }));
  }
  const allyTotal = list => list.reduce((x, h) => x + h.power, 0);
  function allianceTerms(iso) {
    const s = G.state, t = BY[iso];
    if (!s.player) return { why: "Start a campaign first." };
    if (owns(iso)) return { why: `${t.name} is already part of your empire.` };
    if (s.owner[iso] !== iso) return { why: `${t.name} is occupied by ${BY[s.owner[iso]].name}.` };
    if (isAlly(iso)) return { why: `${t.name} is already your ally.` };
    if (s.wars[iso] || s.armies.some(a => a.to === iso)) return { why: `You are at war with ${t.name}.` };
    if (isHostile(iso)) return { why: `${t.name} is hostile after recent fighting with you (${HOSTILE_TURNS - (s.turn - s.hostile[iso])} more days).` };
    const mine = empire().map(c => c.iso3), rival = mine.find(m => (RIVAL.get(iso) || []).includes(m));
    if (rival) return { why: `${t.name} is a sworn rival of ${BY[rival].name}.` };
    const S = empireSoft(), A = empireStrength(), D = Math.max(1, t.truePower * 1.25);
    const blocs = window.ALLIES_OF[iso] || [];
    const bloc = blocs.find(({ members }) => members.some(m => mine.includes(m)));
    const foes = blocs.find(({ members }) => members.some(m => m !== iso && (s.wars[m] || isHostile(m))));
    const common = (RIVAL.get(iso) || []).find(r => s.wars[r] || isHostile(r));
    const parts = [
      ["Your soft power and appeal", Math.round((30 * S) / (S + t.soft))],
      ["Protection you offer (your strength vs theirs)", Math.round((30 * A) / (A + D))],
    ];
    if (bloc) parts.push([`Treaty partners already (${bloc.bloc})`, 35]);
    if (bordersEmpire(iso)) parts.push(["Shares a border with your empire", 10]);
    if (common) parts.push([`Common enemy: ${BY[common].name}`, 15]);
    const inf = (s.influenceAt || {})[iso] || 0;
    if (inf > 0) parts.push([`Your diplomatic influence there (${Math.round(inf * 100)}%)`, Math.round(30 * inf)]);
    if (foes) parts.push([`Its ${foes.bloc} partners are fighting you`, -30]);
    const score = parts.reduce((x, p2) => x + p2[1], 0);
    return { score, need: 50, parts, ok: score >= 50 };
  }
  function proposeAlliance(iso) {
    const err = ready(); if (err) return err;
    const t = allianceTerms(iso), c = BY[iso];
    if (t.why) return t.why;
    if (!t.ok) return `${c.name} declines: support ${t.score} of the 50 needed. Court it to build influence (Diplomatic union, once a day), raise your soft power, grow stronger, or share a common enemy.`;
    (G.state.allies = G.state.allies || []).push(iso);
    log(`🤝 ${c.name} signed an alliance with you (support ${t.score}/50). It will defend your nations and join your wars.`, "good");
    save();
    return null;
  }
  function leaveAlliance(iso) {
    const s = G.state;
    if (!(s.allies || []).includes(iso)) return "You have no alliance with that country.";
    s.allies = s.allies.filter(x => x !== iso);
    log(`📜 You ended your alliance with ${BY[iso].name}.`, "info");
    save();
    return null;
  }

  // ── Missiles (js/missiles.js) ───────────────────────────────
  // No nuclear weapons: each country fires its conventional ballistic and cruise missiles instead.
  // Stocks start at the real arsenal and rebuild 0.5% of it a day.
  const missileStock = iso => ((G.state.missiles = G.state.missiles || {})[iso] = G.state.missiles[iso] || { bm: BY[iso].missiles.bm, cm: BY[iso].missiles.cm });
  // One day's salvo from countries fighting together, against `targetIso`'s air defence: each fires
  // 4% of each stock (at least 5 if it has any). Hits = fired × (1 − 0.08 × air defence); a ballistic
  // hit is worth 2.5 combat power, a cruise missile 1.5.
  function missileSalvo(shooters, targetIso) {
    const leak = 1 - 0.08 * BY[targetIso].missiles.ad;
    let power = 0, fired = 0, hits = 0;
    [...new Set(shooters)].forEach(iso => {
      const st = missileStock(iso);
      ["bm", "cm"].forEach(k2 => {
        const n = Math.min(st[k2], Math.max(st[k2] > 0 ? 5 : 0, Math.round(st[k2] * 0.04)));
        st[k2] -= n; fired += n; hits += n * leak; power += n * leak * (k2 === "bm" ? 2.5 : 1.5);
      });
    });
    return { power, fired, hits: Math.round(hits) };
  }
  const salvoText = (mine, theirs) => (mine.fired || theirs.fired ? ` Missiles: you fired ${mine.fired} (${mine.hits} got through), they fired ${theirs.fired} (${theirs.hits} got through).` : "");
  // ── Submarines against invasions by sea ─────────────────────
  // A defender's submarines hunt an invasion fleet's transports and escorts. The invader keeps
  // 1 − 0.3 × S / (S + ASW) of its strength: S is the defender's submarine power, ASW what the
  // invader's warships, submarines, carriers and helicopters bring to hunt them.
  function subScreen(def, defSubs, units, nat) {
    const q = key => window.unitQuality(BY[nat], key);
    const S = (defSubs || 0) * 25 * window.unitQuality(BY[def], "subs") * ms(def).skill;
    const asw = ((units.ships || 0) * 12 * q("ships") + (units.subs || 0) * 25 * q("subs") + (units.carriers || 0) * 75 * q("carriers") + (units.helis || 0) * 1.5 * q("helis")) * ms(nat).skill;
    return 1 - (0.3 * S) / (S + asw + 1);
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
  // ── Logistics and terrain ──
  // Supply: an army fighting away from home loses strength with distance, in proportion to how far
  // its country's logistics (0–10) fall short of perfect: up to 35% at 2,500 km overland and 50%
  // at 9,000 km by sea, made worse (×1 to ×1.6) by harsh terrain at the far end. The US, with
  // logistics 10 (strategic airlift and sealift, tankers, prepositioned stocks and bases worldwide),
  // fights at full strength anywhere; Russia (6) loses a few percent next door and about 25% in
  // the Caribbean.
  function supply(nat, to, km, sea) {
    const lack = (10 - ms(nat).logistics) / 10, dist = Math.min(1, km / (sea ? 9000 : 2500));
    const harsh = window.terrainOf ? window.terrainOf(to).harsh : 0;
    return Math.max(0.45, 1 - lack * dist * (sea ? 0.5 : 0.35) * (1 + 0.6 * harsh));
  }
  // Good logistics also moves armies faster: travel times ×1.3 − 0.03 × logistics (US ×1.0).
  const travelMult = nat => 1.3 - 0.03 * ms(nat).logistics;
  // An attacking force's strength in the target's terrain: each kind of unit counts by how well it
  // fights there (tanks bog down in mountains and jungle, aircraft lose targets under canopy).
  const powerIn = (units, nat, models, to) => UNITS.reduce((s, u) => s + (units[u.key] || 0) * u.power * window.unitQuality(BY[nat], u.key, models && models[u.key]) * window.terrainKind(to, u.key), 0);
  const terrainDef = iso => (window.terrainOf ? window.terrainOf(iso).defence : 1);
  // Is a country fighting right now? (Private satellites join the national effort only then.)
  function atWar(iso) {
    const s = G.state;
    if (owns(iso)) return Object.keys(s.wars).length > 0 || s.enemies.some(e => e.vsPlayer) || Object.keys(s.revolts).length > 0;
    return !!(s.wars[iso] || (s.aiWars || {})[iso] || s.enemies.some(e => e.nat === iso || e.to === iso));
  }
  const space = iso => window.spaceMult(BY[iso], atWar(iso));
  // Intelligence, surveillance and reconnaissance: satellites (space) times the country's spy
  // agencies (js/space.js intelMult: targeting, early warning, sabotage and cyber).
  const isr = iso => space(iso) * window.intelMult(BY[iso]);
  // An army's strength where it is: in its own or your territory it fights as a defender (no
  // supply or terrain penalty); invading, it counts by the terrain and its supply line.
  const armyPower = a => {
    const home = owns(a.to) || a.to === a.nat;
    return (home ? rawPower(a.units, a.nat, a.models) : powerIn(a.units, a.nat, a.models, a.to) * supply(a.nat, a.to, distKm(a.from, a.to), a.sea) * (a.sea || a.mode === "sea" ? subScreen(a.to, forces(a.to).subs, a.units, a.nat) : 1)) * (1 + bonus("atk")) * ms(a.nat).skill * isr(a.nat);
  };
  // Fortified borders (js/borders.js): an army invading overland across a border of level L fights
  // at 1 / (1 + 0.03 × (L − 2)) of its strength. Forces arriving by sea or air don't cross it.
  const borderMult = (to, from) => (from && window.borderFort ? 1 + 0.03 * Math.max(0, window.borderFort(to, from).level - 2) : 1);
  // The border an overland attack on `to` crosses: straight from its origin if they touch, otherwise
  // the weakest border with the attacker's side (attackers pick the easiest way in).
  function crossing(to, from, side) {
    const nb = window.NEIGHBORS[to] || [];
    if (nb.includes(from)) return from;
    const cands = nb.filter(side);
    return cands.length ? cands.reduce((a, b) => (window.borderFort(to, a).level <= window.borderFort(to, b).level ? a : b)) : null;
  }
  const yourCrossing = (to, from) => crossing(to, from, n => owns(n));
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
    const base = rawPower(forces(iso), iso) * 1.25 * ms(iso).skill * ms(iso).defend * fortMult(iso) * terrainDef(iso) * isr(iso) * (1 + fx(iso, "def")) + 20;
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
    // Share of the fleet free for an airlift grows with logistics (US 10: 15% heavy, 25% tactical).
    const lg = 0.4 + 0.06 * c.milStats.logistics, H = Math.floor(heavy * 0.15 * lg * c.tech.ready), T = Math.floor(tactical * 0.25 * lg * c.tech.ready);
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
    const hours = (legs.length ? Math.max(...legs) : 1) * travelMult(nat);
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
  // Any country's base can be ordered once you lead a nation; your own nations' units are capped by
  // your access levels, other countries' units go as they are.
  function baseSource(key) {
    const [iso, name] = key.slice(2).split("|");
    if (!canCommand(iso) || !window.baseKit) return null;
    const kit = window.baseKit(iso, name);
    if (!kit) return null;
    const acc = owns(iso) ? accessible(iso) : null, avail = {};
    UNITS.forEach(u => { const v = Math.min(kit[u.key] || 0, acc ? acc[u.key] || 0 : Infinity); if (v > 0) avail[u.key] = v; });
    return { key, label: `${name} (${BY[iso].name})`, at: iso, nat: iso, base: name, avail, pt: window.basePoint && window.basePoint(iso, name) };
  }
  // You can command any country's units while you lead a campaign.
  const canCommand = () => !!G.state.player && !G.state.over;
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
    const cross = r.sea || owns(to) || G.state.owner[to] === src.nat ? null : crossing(to, src.at, n => n === src.at || owns(n) || G.state.owner[n] === src.nat), bm = borderMult(to, cross);
    const home = owns(to) || G.state.owner[to] === src.nat, sup = home ? 1 : supply(src.nat, to, r.km, r.sea), subs = home || r.mode !== "sea" ? 1 : subScreen(to, forces(to).subs, u, src.nat);
    const power = (home ? rawPower(u, src.nat, models) : powerIn(u, src.nat, models, to)) * sup * subs * (1 + bonus("atk")) * ms(src.nat).skill * isr(src.nat) / bm;
    return { src, units: u, route: r, power, empty: total(u) === 0, allies: owns(to) ? [] : allyHelp(to, true), border: cross ? { from: cross, ...window.borderFort(to, cross), mult: bm } : null, supply: sup, subs, terrain: home ? 1 : powerIn(u, src.nat, models, to) / Math.max(1e-9, rawPower(u, src.nat, models)) };
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
  function dispatch(srcKey, to, units, models, ships) {
    const err = ready(); if (err) return err;
    const s = G.state, p = preview(srcKey, to, units, models);
    if (p.err) return p.err;
    if (p.empty) return "Pick at least one unit to send.";
    if (isAlly(to)) return `${BY[to].name} is your ally. End the alliance first (in its dossier) to attack it.`;
    if (!p.route.ok) {
      const a2 = p.route.air || {};
      return `These ground units can't get there: overland is blocked, your ships give ${Math.floor(p.route.cap)} of the ${Math.ceil(p.route.need)} sealift needed, and ${a2.H || a2.T ? `${BY[p.src.nat].name}'s ${a2.H} heavy and ${a2.T} tactical transports available ${a2.H < 1 && (p.units.tanks || p.units.afv || p.units.arty) ? "can't lift vehicles (that needs heavy lifters like the C-17 or Il-76)" : "would need too many sorties"}` : `${BY[p.src.nat].name} has no transport aircraft for an airlift`}. Add ships or carriers, or send fewer ground units.`;
    }
    const src = p.src, { etaH, eta } = etaOf(p.route.hours);
    // Another country's units: you've ordered that country to attack, so it becomes its own
    // (AI) force: against your nations it's an attack on you, otherwise a war between them.
    if (src.base && !owns(src.nat)) {
      if (s.owner[to] === s.owner[src.nat]) return `${BY[to].name} is already ${BY[src.nat].name}'s. Pick one of its bases to redeploy there instead.`;
      const f = forces(src.nat);
      UNITS.forEach(u => (f[u.key] = Math.max(0, (f[u.key] || 0) - (p.units[u.key] || 0))));
      const out = (((s.baseOut = s.baseOut || {})[src.at] = s.baseOut[src.at] || {})[src.base] = s.baseOut[src.at][src.base] || {});
      UNITS.forEach(u => { if (p.units[u.key]) out[u.key] = (out[u.key] || 0) + p.units[u.key]; });
      const vsPlayer = owns(to);
      const e = { id: s.nextEnemy++, nat: src.nat, from: src.at, to, units: p.units, eta, etaH, sent: s.turn, sentH: s.clock || 0, sea: p.route.sea, vsPlayer, detected: true, ordered: true, fromPt: src.pt };
      if (models) e.models = JSON.parse(JSON.stringify(models));
      if (ships && ships.length) { e.ships = ships.slice(); ships.forEach(h => ((s.shipBase = s.shipBase || {})[h] = { gone: true })); }
      s.enemies.push(e);
      if (vsPlayer) s.hostile[src.nat] = s.turn;
      log(`🎖️ On your orders, ${BY[src.nat].name} sent ${unitList(p.units)} from ${src.base} ${vsPlayer ? "against your nation" : "to invade"} ${BY[to].name} by ${MODE_LABEL[p.route.mode]}: arrives in ${fmtDur(p.route.hours)} (${clockLabel(etaH)}).`, vsPlayer ? "bad" : "world");
      save();
      return null;
    }
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
    if (ships && ships.length) { a.ships = ships.slice(); ships.forEach(h => ((s.shipBase = s.shipBase || {})[h] = { gone: true })); }
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
    if (!canCommand(iso)) return { err: "Start a campaign to command units." };
    if (from === to) return { err: "Those units are already at that base." };
    const kit = window.baseKit && window.baseKit(iso, from);
    if (!kit || !window.baseKit(iso, to)) return { err: "Unknown base." };
    const u = clean(units, kit);
    if (!total(u)) return { err: "Pick at least one unit to move." };
    const pa = window.basePoint(iso, from), pb = window.basePoint(iso, to), km = d3.geoDistance(pa, pb) * 6371;
    const hours = Math.max(0.5, ...UNITS.filter(x => u[x.key]).map(x => (km * (x.kind === "air" ? 1.05 : x.kind === "naval" ? 1.3 : 1.25)) / SPEED[x.key])) * travelMult(iso);
    return { u, km, hours, pa, pb };
  }
  // `ships`: hull numbers of named carriers in the move, so they keep their names at the new base.
  function moveUnits(iso, from, to, units, ships) {
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
    if (ships && ships.length) { m.ships = ships.slice(); ships.forEach(h => ((s.shipBase = s.shipBase || {})[h] = { base: to, move: m.id })); }
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

  // Diplomatic union: each turn you court a country adds its pull (0–90%) to your influence
  // there; it joins once your influence reaches 100%. No dice.
  function diplomacyOdds(iso) {
    const t = BY[iso];
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
    const inf = (s.influenceAt = s.influenceAt || {});
    inf[iso] = Math.min(1, (inf[iso] || 0) + d.p);
    if (inf[iso] >= 1 - 1e-9) {
      delete inf[iso];
      annex(iso, 0.9);
      s.coins += loot(t);
      log(`🤝 ${t.name} joined your union peacefully. +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins.`, "good");
    } else {
      log(`📜 Your influence in ${t.name} is now ${Math.round(inf[iso] * 100)}% (+${Math.round(d.p * 100)}% this turn). It joins at 100%.`, "info");
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

  // One round of fighting in a country you are invading.
  function warRound(iso) {
    const s = G.state, t = BY[iso], armies = armiesAt(iso);
    const war = (s.wars[iso] = s.wars[iso] || { start: s.turn, p0: rawPower(forces(iso), iso) });
    const help = allyHelp(iso, true), mine = missileSalvo(empire().map(c => c.iso3), iso), theirs = missileSalvo([iso], armies[0] ? armies[0].nat : s.player);
    const D = defenceOf(iso).total + theirs.power;
    const A = armies.reduce((x, a) => x + armyPower(a) / (a.sea ? 1 : borderMult(iso, yourCrossing(iso, a.from))), 0) + allyTotal(help) + mine.power;
    const r = A / (A + D);
    scaleUnits(forces(iso), 1 - Math.min(0.6, 0.3 * r));
    const al = Math.min(0.6, 0.3 * (1 - r));
    armies.forEach(a => scaleUnits(a.units, 1 - al));
    help.forEach(h => scaleUnits(forces(h.iso), 1 - al * 0.1)); // allies' contingents (10% of their forces) take losses too
    s.armies = s.armies.filter(a => total(a.units) >= 0.05);
    const left = armiesAt(iso);
    const prog = warProgress(iso);
    if (!left.length) {
      delete s.wars[iso];
      log(`🛡️ Your invasion of ${t.name} was destroyed. ${t.name} holds.`, "bad");
      return;
    }
    if (prog >= 1) {
      // Nuclear-armed defenders escalate rather than lose (once per war).
      annex(iso, 0.5);
      scaleUnits(forces(iso), 0.5); // survivors surrender and join you, weapons locked
      s.coins += loot(t);
      log(`⚔️ Conquered ${t.name} after ${s.turn - war.start + 1} turn(s) of fighting. +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins. Your armies are now stationed there.`, "good");
      return;
    }
    log(`⚔️ Fighting in ${t.name}: your strength ${A.toFixed(0)} vs ${D.toFixed(0)}. Defences ${Math.round(prog * 100)}% broken.${salvoText(mine, theirs)}`, r >= 0.5 ? "good" : "info");
  }
  // 0 → 1: share of the defender's pre-war forces destroyed, where 80% destroyed = conquest.
  const warProgress = iso => {
    const w = G.state.wars[iso];
    return w && w.p0 > 0 ? Math.max(0, Math.min(1, (1 - rawPower(forces(iso), iso) / w.p0) / 0.8)) : 0;
  };

  // Loyal side in a revolt: the territory's own accessible forces plus your armies stationed there.
  function loyalPower(iso) {
    const u = homeShare(iso);
    return rawPower(u, iso) * ms(iso).skill * ms(iso).defend * isr(iso) * (0.5 + 0.5 * G.state.garrison[iso]) + armiesAt(iso).reduce((x, a) => x + armyPower(a), 0);
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
    scaleUnits(rv.units, 1 - Math.min(0.6, 0.35 * r));
    const ll = Math.min(0.6, 0.3 * (1 - r));
    scaleUnits(forces(iso), 1 - ll * 0.5);
    armiesAt(iso).forEach(a => scaleUnits(a.units, 1 - ll));
    s.armies = s.armies.filter(a => total(a.units) >= 0.05);
    rv.progress = Math.max(0, rv.progress + 50 * (0.5 - r));
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
  const enemyPower = e => powerIn(e.units, e.nat, e.models, e.to) * supply(e.nat, e.to, distKm(e.from || e.nat, e.to), e.sea) * ms(e.nat).skill * isr(e.nat) *
    (e.sea ? subScreen(e.to, owns(e.to) ? homeShare(e.to).subs : forces(e.to).subs, e.units, e.nat) : 1) /
    (e.sea ? 1 : borderMult(e.to, crossing(e.to, e.from || e.nat, n => n === e.nat || G.state.owner[n] === e.nat)));
  const enemiesAt = iso => G.state.enemies.filter(e => e.to === iso && arrived(e));
  const enemyDeployed = iso => {
    const d = {};
    G.state.enemies.filter(e => e.nat === iso).forEach(e => UNITS.forEach(u => (d[u.key] = (d[u.key] || 0) + (e.units[u.key] || 0))));
    return d;
  };
  // Your side when one of your nations is attacked: its own accessible forces, order, trait, stationed armies and allies.
  function homeDefence(iso) {
    const u = homeShare(iso);
    return rawPower(u, iso) * 1.25 * ms(iso).skill * ms(iso).defend * fortMult(iso) * terrainDef(iso) * isr(iso) * (1 + fx(iso, "def")) * (0.5 + 0.5 * G.state.garrison[iso]) +
      armiesAt(iso).reduce((x, a) => x + armyPower(a), 0) + allyTotal(allyHelp(iso, false)) + 10;
  }

  // Defence of any target: yours (homeDefence) or an AI country's (defenceOf).
  const targetDefence = T => (owns(T) ? homeDefence(T) : defenceOf(T).total);
  function launchEnemy(A, T) {
    const s = G.state, f = forces(A), land = (window.NEIGHBORS[A] || []).includes(T), vsPlayer = owns(T);
    // Send about 1.45× what defends the target, within a share of the army that grows with hostility.
    const cap = !vsPlayer ? 0.45 : isHostile(A) ? 0.45 : 0.3;
    const want = targetDefence(T) * 1.45 / Math.max(1, rawPower(f, A) * ms(A).skill);
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
    // Seen if your intelligence beats its counter-intelligence: intel ≥ 3.3 + 0.53 × its counter-intel.
    const detected = !vsPlayer || 0.25 + 0.075 * myIntel() - 0.04 * BY[A].intelProfile.counter >= 0.5;
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
      if (s.owner[A] !== A || owns(A) || isAlly(A) || s.enemies.some(e => e.nat === A)) return;
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
      // No dice: a hostile country strikes back whenever it can muster a real force, then regroups
      // for 4 days. An unprovoked neighbour builds tension each day your border looks weak (it
      // outguns it more than 2×) and attacks once that boils over.
      const ten = (s.tension = s.tension || {}), last = (s.lastStrike = s.lastStrike || {});
      if (hostile) { if (ratio >= 0.4 && s.turn - (last[A] ?? -99) >= 4) { last[A] = s.turn; launchEnemy(A, T); } return; }
      ten[A] = ratio > 2 ? (ten[A] || 0) + Math.min(0.03, 0.005 * ratio) : Math.max(0, (ten[A] || 0) - 0.05);
      if (ten[A] >= 1) { ten[A] = 0; last[A] = s.turn; launchEnemy(A, T); }
    });
    aiWorldTurn();
  }

  // ── Wars between AI countries ───────────────────────────────
  // Long-running rivalries flare up when their tension boils over. Tension builds every day at a
  // rate set by how hot the rivalry really is (Russia–Ukraine is an ongoing war; Greece–Turkey
  // rarely more than a stand-off), and the stronger side attacks. No dice, and no random
  // opportunistic invasions. At most six such wars run at once.
  const RIVALS = [["RUS", "UKR", 0.5], ["ISR", "IRN", 0.08], ["RWA", "COD", 0.04], ["PAK", "AFG", 0.04], ["SAU", "YEM", 0.03], ["THA", "KHM", 0.03],
    ["IND", "PAK", 0.02], ["AZE", "ARM", 0.02], ["ETH", "ERI", 0.02], ["SDN", "SSD", 0.02], ["CHN", "TWN", 0.012], ["PRK", "KOR", 0.01], ["VEN", "GUY", 0.01],
    ["MAR", "DZA", 0.008], ["CHN", "IND", 0.008], ["EGY", "ETH", 0.008], ["TUR", "GRC", 0.005]];
  const RIVAL = new Map();
  RIVALS.forEach(([a, b]) => { RIVAL.set(a, (RIVAL.get(a) || []).concat(b)); RIVAL.set(b, (RIVAL.get(b) || []).concat(a)); });
  const aiFree = iso => !owns(iso) && G.state.owner[iso] === iso;
  function aiWorldTurn() {
    const s = G.state;
    if (s.turn < 3) return;
    let active = s.enemies.filter(e => !e.vsPlayer).length;
    const ten = (s.rivalTension = s.rivalTension || {});
    RIVALS.forEach(([x, y, heat]) => {
      if (!aiFree(x) || !aiFree(y)) return;
      const px = rawPower(forces(x), x) * ms(x).skill, py = rawPower(forces(y), y) * ms(y).skill;
      const [A, T, pa] = px >= py ? [x, y, px] : [y, x, py], key = x + "-" + y;
      if (s.enemies.some(e => e.nat === A || e.nat === T)) return; // already fighting
      ten[key] = Math.min(1, (ten[key] || 0) + heat);
      if (ten[key] < 1 || active >= 6 || pa < 80) return;
      const before = s.enemies.length;
      launchEnemy(A, T);
      if (s.enemies.length > before) { active++; ten[key] = 0; }
    });
  }

  // One round of a war between AI countries.
  function aiWarRound(T) {
    const s = G.state, c = BY[T], foes = enemiesAt(T);
    const w = ((s.aiWars = s.aiWars || {})[T] = s.aiWars[T] || { by: foes[0].nat, start: s.turn, p0: rawPower(forces(T), T) });
    const E = foes.reduce((x, e) => x + enemyPower(e), 0) + missileSalvo(foes.map(e => e.nat), T).power, D = defenceOf(T).total + missileSalvo([T], foes[0].nat).power, r = E / (E + D);
    foes.forEach(e => scaleUnits(e.units, 1 - Math.min(0.6, 0.3 * (1 - r))));
    scaleUnits(forces(T), 1 - Math.min(0.6, 0.3 * r));
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
    const theirs = missileSalvo(foes.map(e => e.nat), iso), mine = missileSalvo(empire().map(c => c.iso3), foes[0].nat);
    const E = foes.reduce((x, e) => x + enemyPower(e), 0) + theirs.power, D = homeDefence(iso) + mine.power;
    const r = E / (E + D);
    const el = Math.min(0.6, 0.3 * (1 - r));
    foes.forEach(e => scaleUnits(e.units, 1 - el));
    const dl = Math.min(0.6, 0.3 * r);
    scaleUnits(forces(iso), 1 - dl);
    armiesAt(iso).forEach(a => scaleUnits(a.units, 1 - dl));
    s.armies = s.armies.filter(a => total(a.units) >= 0.05);
    s.enemies = s.enemies.filter(e => rawPower(e.units, e.nat) >= 3);
    inv.progress = Math.max(0, inv.progress + 50 * (r - 0.5));
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
      log(`🚨 ${by} attacking ${c.name}: enemy ${E.toFixed(0)} vs your ${D.toFixed(0)}. Enemy ${Math.round(inv.progress)}% of the way to taking it.${salvoText(mine, theirs)}`, r < 0.5 ? "info" : "bad");
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
      if (s.owner[m.iso] === m.iso || owns(m.iso)) {
        const mv = ((s.baseMoves = s.baseMoves || {})[m.iso] = s.baseMoves[m.iso] || {}), b = (mv[m.to] = mv[m.to] || {});
        UNITS.forEach(x => { if (m.units[x.key]) b[x.key] = (b[x.key] || 0) + m.units[x.key]; });
        if (owns(m.iso)) { log(`📍 ${unitList(m.units)} reached ${m.to}.`, "info"); n++; }
      }
      s.moves = s.moves.filter(x => x !== m);
    });
    return n;
  }
  // Advance the clock by `ms` real milliseconds (30 real seconds = 1 game hour). At midnight the
  // day's fighting resolves (endTurn). Returns { arrived, newDay }.
  const REAL_MS_PER_HOUR = 30000; // a game day lasts 12 real minutes
  let tickN = 0;
  function tick(ms) {
    const s = G.state;
    if (!s.player || s.over || s.paused) return { arrived: 0, newDay: false };
    s.clock = (s.clock || 0) + ms / REAL_MS_PER_HOUR;
    let arrivedN = arrivals(), newDay = false;
    while (!s.over && s.clock >= s.turn * 24) { endTurn(); newDay = true; }
    if (arrivedN || newDay) save();
    else if (++tickN % 10 === 0) save(); // keep the clock saved without writing every second
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
    Object.keys(s.baseOut || {}).forEach(iso => { if (!s.armies.some(x => x.nat === iso) && !s.enemies.some(x => x.nat === iso)) delete s.baseOut[iso]; });
    // Recovery: home 8%/turn up to 100%, occupied 5%/turn up to 85%.
    C.forEach(c => {
      const iso = c.iso3, cap = owns(iso) && iso !== s.player ? 0.85 : 1;
      if (!inRevolt(iso)) s.garrison[iso] = Math.min(cap, s.garrison[iso] + (cap === 1 ? 0.08 : 0.05) + fx(iso, "rec") + 0.05 * techShare(iso, "governance"));
      if (!s.forces[iso] || inRevolt(iso) || s.wars[iso] || (s.aiWars || {})[iso]) return;
      if (owns(iso)) regrow(c, (0.03 + fx(iso, "rec")) * (1 + TFULL.production * techShare(iso, "production")), deployedFrom(iso));
      else regrow(c, 0.05 + fx(iso, "rec"), enemyDeployed(iso));
    });
    // Missile production rebuilds 0.5% of each arsenal a day.
    Object.entries(s.missiles || {}).forEach(([iso, st]) => { const m = BY[iso].missiles; st.bm = Math.min(m.bm, st.bm + Math.ceil(m.bm * 0.005)); st.cm = Math.min(m.cm, st.cm + Math.ceil(m.cm * 0.005)); });
    // Occupied territories rise up when weakly held for long enough; your armies stationed there calm them.
    empire().forEach(c => {
      const iso = c.iso3;
      if (iso === s.player || inRevolt(iso) || (s.purchased || []).includes(iso)) return;
      const calm = (1 - fx(iso, "stab")) * (1 - TFULL.governance * Math.min(1, techShare(iso, "governance"))) * (armiesAt(iso).length ? 0.3 : 1);
      // Unrest builds each day a territory is weakly held; it rises up when unrest reaches 100%.
      const un = (s.unrest = s.unrest || {});
      un[iso] = (un[iso] || 0) + (0.06 * (1 - s.garrison[iso]) + 0.01) * calm;
      if (un[iso] >= 1) { un[iso] = 0; startRevolt(c); }
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
    baseSource, moveUnits, moveQuote, fortMult, canCommand, tick, setPaused, fmtDur, clockLabel, etaLeft, SPEED, owns, empire, empireStrength, empireSoft, empireGdp, empireMissiles, missileStock, income, accessLvl, accessShare, accessible, accessQuote, techQuote, techShare, usable, bonus, techLvl, upgradeTech, industryCoins,
    forces, baseForces, rawPower, enemyPower, atWar, estimate, fuzzUnits, intelError, myIntel, fronts, heldShare, enemiesAt, homeDefence, isHostile, armyPower, defenceOf, armiesAt, arrived, sources, preview, dispatch, recall, disband, warProgress, loyalPower,
    inRevolt, liftMult, unitList, borderMult, supply, travelMult, isAlly, allies, allianceTerms, proposeAlliance, leaveAlliance, allyHelp, isr, endTurn, diplomacyOdds, influence, choose, newGame, resetAll, bordersEmpire, raiseAccess, redeem, buy, fmtCoins,
  });
})();
