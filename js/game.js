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

  // The campaign calendar: day 1 is the real date the campaign began (UTC midnight).
  const todayMs = () => { const d = new Date(); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
  function fresh(seed) {
    seed = seed ?? Math.floor(Math.random() * 2 ** 31);
    const owner = {}, garrison = {};
    C.forEach(c => { owner[c.iso3] = c.iso3; garrison[c.iso3] = 1; });
    return {
      seed, unlocked: rollUnlocked(seed), player: null, owner, garrison, turn: 1, log: [], over: false, timeV: 1,
      coins: window.START_COINS, access: {}, tech: {}, tiers: 3, redeemed: [], purchased: [], date0: todayMs(), ...EXTRA(),
    };
  }

  // Load the saved campaign. Saves always carry over to new versions of the game: countries added
  // since the save start out independent, ones no longer in the game are dropped, and the previous
  // save is kept as a backup before any migration runs.
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      const s = raw && JSON.parse(raw);
      if (s && s.owner) {
        try { localStorage.setItem(STORE + "-backup", raw); } catch (e) { /* full */ }
        return adopt(s);
      }
    } catch (e) { /* storage unavailable or unreadable */ }
    return fresh();
  }
  // Fit a saved state (from this browser, a file or the cloud) to the current game.
  function adopt(s) {
    const known = new Set(C.map(c => c.iso3));
    C.forEach(c => { if (!(c.iso3 in s.owner)) s.owner[c.iso3] = c.iso3; if (!((s.garrison || {})[c.iso3] >= 0)) (s.garrison = s.garrison || {})[c.iso3] = 1; });
    Object.keys(s.owner).forEach(k => { if (!known.has(k)) { delete s.owner[k]; if (s.garrison) delete s.garrison[k]; } });
    Object.entries(s.owner).forEach(([k, o]) => { if (!known.has(o)) s.owner[k] = k; });
    if (s.player && !known.has(s.player)) s.player = null;
    s.unlocked = (s.unlocked || []).filter(k => known.has(k));
    return migrate(Object.assign(EXTRA(), s));
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
    // Saves from before the calendar: today is their current day.
    if (!s.date0) s.date0 = todayMs() - ((s.turn || 1) - 1) * 86400000;
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
  // Save to this browser, stamped with the time, and tell the account sync (js/account.js) about it.
  function save() {
    G.state.savedAt = Date.now();
    try { localStorage.setItem(STORE, JSON.stringify(G.state)); } catch (e) { /* ignore */ }
    try { window.dispatchEvent(new Event("ww3-saved")); } catch (e) { /* no window events */ }
  }
  // Replace the campaign with another save (a downloaded file or the cloud copy of your account).
  function replaceState(obj) {
    if (!obj || !obj.owner) return "That isn't a World War 3 save.";
    try { localStorage.setItem(STORE + "-backup", JSON.stringify(G.state)); } catch (e) { /* full */ }
    const keepTime = obj.savedAt;
    G.state = adopt(JSON.parse(JSON.stringify(obj)));
    save();
    if (keepTime) { G.state.savedAt = keepTime; try { localStorage.setItem(STORE, JSON.stringify(G.state)); } catch (e) { /* ignore */ } }
    return null;
  }

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
  const income = () => Math.round(20 + empire().filter(c => !inRevolt(c.iso3)).reduce((s, c) => s + (c.gdp * 0.02 + industryCoins(c)) * heldShare(c.iso3) * (c.iso3 === G.state.player ? 1 : payShare(occupation(c.iso3).score)), 0) + bonus("inc"));
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

  // ── Mutual-defence blocs and how loyal each member is (js/loyalty.js) ──
  // Members can walk out of a bloc (betrayal); s.leftBloc remembers who left which.
  const leftOf = b => ((G.state.leftBloc || {})[b] || []);
  const blocMembers = b => (window.ALLIANCES[b] || []).filter(m => !leftOf(b).includes(m));
  const blocsOf = iso => (window.ALLIES_OF[iso] || []).filter(({ bloc }) => !leftOf(bloc).includes(iso)).map(({ bloc }) => ({ bloc, members: blocMembers(bloc) }));
  // Fighting strength of everything one side holds (cached for the day: it is only used to weigh odds).
  let sideCache = { st: null, turn: -1, v: {} };
  function sideStrength(owner) {
    const s = G.state;
    if (sideCache.st !== s || sideCache.turn !== s.turn) sideCache = { st: s, turn: s.turn, v: {} };
    if (sideCache.v[owner] == null) sideCache.v[owner] = C.reduce((x, c) => x + (s.owner[c.iso3] === owner ? rawPower(forces(c.iso3), c.iso3) * ms(c.iso3).skill : 0), 0);
    return sideCache.v[owner];
  }
  const sideName = o => (o === G.state.player ? "your empire" : BY[o].name);
  // How firmly member `iso` would fight for `bloc`, 0–100, with the reasons. With ctx {attacker,
  // target}, for that war: who attacks whom, how near the fighting is, the odds, shared treaties.
  function loyalty(iso, bloc, ctx) {
    const s = G.state, info = window.ALLIANCE_INFO[bloc] || { binding: 0.5 }, rec = (window.ALLY_RECORD[bloc] || {})[iso];
    const parts = [[`Treaty: ${info.treaty || bloc}`, Math.round(70 * info.binding)]];
    if (rec && rec[0]) parts.push([rec[1], rec[0]]);
    if (info.leader && info.leader !== iso && s.owner[info.leader] !== info.leader) parts.push([`The bloc's leader, ${BY[info.leader].name}, has fallen`, -20]);
    const lost = (window.ALLIANCES[bloc] || []).filter(m => s.owner[m] !== m).length;
    if (lost && lost / (window.ALLIANCES[bloc] || [1]).length >= 0.25) parts.push([`${lost} members already conquered`, -10]);
    if (s.enemies.some(e => e.to === iso) || s.wars[iso] || (s.aiWars || {})[iso]) parts.push(["Busy defending itself", -15]);
    const A = ctx && ctx.attacker, T = ctx && ctx.target, torn = [], soft = [];
    if (A && T && T !== iso) {
      const atk = s.owner[A] || A;
      // Torn loyalties (bound to both sides, a rival of the victim, or a victim that has itself
      // turned its back on the bloc) keep a member out of the war but never make it quit the bloc.
      if (!(RIVAL.get(iso) || []).includes(atk) && blocsOf(iso).some(({ members }) => members.some(m => m !== iso && m !== T && s.owner[m] === atk))) torn.push([`Also treaty-bound to ${sideName(atk)}: won't fight a treaty partner`, -40]);
      if ((RIVAL.get(iso) || []).includes(T)) torn.push([`Sworn rival of ${BY[T].name}`, -40]);
      const trec = (window.ALLY_RECORD[bloc] || {})[T];
      if (trec && trec[0] <= -20) soft.push([`${BY[T].name} has itself turned its back on the bloc`, -Math.round(-trec[0] * 0.75)]);
      if ((RIVAL.get(iso) || []).includes(A)) parts.push([`Sworn rival of ${BY[A].name}`, 15]);
      else if ((info.threat || []).includes(A)) parts.push([`${BY[A].name} is the threat the bloc exists to deter`, 10]);
      const near = (window.NEIGHBORS[iso] || []).includes(T) || distKm(iso, T) < 1000;
      if (near) parts.push([`On the front line next to ${BY[T].name}`, 10]);
      else if (info.leader !== iso && distKm(iso, T) > 6000) parts.push(["Far from the fighting", -10]);
      const ap = sideStrength(atk), bp = blocMembers(bloc).reduce((x, m) => x + (s.owner[m] === m ? sideStrength(m) : 0), 0);
      if (ap > bp) parts.push([`${sideName(atk)[0].toUpperCase() + sideName(atk).slice(1)} looks stronger than the whole bloc`, -15]);
      else if (bp > 3 * ap) parts.push(["The bloc clearly outguns the attacker", 5]);
      const inf = atk === s.player ? (s.influenceAt || {})[iso] || 0 : 0;
      if (inf > 0) parts.push(["Your diplomatic influence there", -Math.round(40 * inf)]);
    }
    const core = Math.max(0, Math.min(100, parts.reduce((x, p) => x + p[1], 0)));
    let score = Math.max(0, Math.min(100, core + [...torn, ...soft].reduce((x, p) => x + p[1], 0)));
    // Under a loose pact (binding under 0.5) members that don't care simply stay home; only your
    // influence can turn one into a defector.
    if (core >= 30 || (info.binding < 0.5 && !parts.some(p => p[0] === "Your diplomatic influence there"))) score = Math.max(30, score);
    if (torn.length) score = Math.min(49, score);
    if (window.NEUTRAL.has(iso)) { score = Math.min(49, Math.max(30, score)); parts.push(["Neutral by law or policy: never sends forces to fight", 0]); }
    parts.push(...torn, ...soft);
    return { score, parts, stance: window.stanceOf(score) };
  }
  // Every member of a bloc, for a war (attacker → target) or in peacetime, most loyal first.
  function blocReport(bloc, attacker, target) {
    return blocMembers(bloc).filter(m => m !== target).map(m => {
      const free = G.state.owner[m] === m && !owns(m);
      const L = free ? loyalty(m, bloc, attacker && target ? { attacker, target } : null) : null;
      return { iso: m, free, yours: owns(m), by: G.state.owner[m], score: L ? L.score : 0, parts: L ? L.parts : [], stance: L ? L.stance : null };
    }).sort((a, b) => b.free - a.free || b.score - a.score);
  }
  // Reliability: the share of the bloc's power that would actually fight (limited help counts half).
  function blocReliability(rep) {
    let all = 0, fight = 0;
    rep.filter(r => r.free).forEach(r => { const p = BY[r.iso].truePower || 1; all += p; fight += p * r.stance[3]; });
    return all ? fight / all : 0;
  }

  function alliedSupport(iso, attacker) {
    // Each free partner sends 12% of its strength if it fights, 6% if it gives limited help, none otherwise.
    const seen = new Set(), blocs = [], detail = [];
    let s = 0;
    blocsOf(iso).forEach(({ bloc, members }) => {
      let any = false;
      members.forEach(m => {
        if (m === iso || seen.has(m) || owns(m) || G.state.owner[m] !== m || isAlly(m)) return;
        seen.add(m);
        const L = loyalty(m, bloc, attacker ? { attacker, target: iso } : null);
        detail.push({ iso: m, bloc, score: L.score, stance: L.stance });
        if (L.stance[3] > 0) any = true;
        s += 0.12 * L.stance[3] * BY[m].truePower * G.state.garrison[m];
      });
      if (any) blocs.push(bloc);
    });
    return { strength: s, blocs, detail };
  }
  // Partners who would betray walk out of the bloc as the war starts; you hear how the bloc lines up.
  function blocWar(T, A) {
    const s = G.state, mine = owns(T), byYou = (s.owner[A] || A) === s.player, seen = (s.blocWars = s.blocWars || {}), key = A + ">" + T;
    if (seen[key] != null && s.turn - seen[key] <= HOSTILE_TURNS) return; // same war, already lined up
    seen[key] = s.turn;
    blocsOf(T).forEach(({ bloc }) => {
      const rep = blocReport(bloc, A, T).filter(r => r.free && !isAlly(r.iso));
      if (!rep.length) return;
      const out = rep.filter(r => r.stance[2] === "betrays");
      out.forEach(r => {
        ((s.leftBloc = s.leftBloc || {})[bloc] = s.leftBloc[bloc] || []).push(r.iso);
        const why = r.parts.filter(p => p[1] < 0).sort((a, b) => a[1] - b[1]).slice(0, 2).map(p => p[0].toLowerCase()).join("; ");
        log(`🗡️ ${BY[r.iso].name} walked out of ${bloc} rather than fight for ${BY[T].name} (loyalty ${r.score}: ${why}).`, mine ? "bad" : byYou ? "good" : "world");
      });
      if (mine || byYou) {
        const n = k => rep.filter(r => r.stance[2] === k).map(r => BY[r.iso].name);
        const f = n("fights"), l = n("limited");
        log(`🤝 ${bloc} lines up behind ${BY[T].name} against ${sideName(s.owner[A] || A)}: ${f.length ? `${f.length} fight (${f.slice(0, 4).join(", ")}${f.length > 4 ? "…" : ""})` : "none fight"}, ${l.length} send limited help, ${n("sits").length} sit out${out.length ? `, ${out.length} betrayed it` : ""}.`, mine ? (f.length ? "good" : "bad") : "info");
      }
    });
  }

  // ── Your alliances with AI countries ────────────────────────
  // An ally stays independent but fights on your side: it sends 15% of its forces to defend any
  // of your nations it can reach, joins your invasions with 10% (it loses men alongside yours),
  // never attacks you, and can't be invaded while the alliance stands. Whether a country agrees
  // is decided by fixed terms, not dice (allianceTerms). How hard it fights depends on its
  // loyalty (allyLoyalty), and it betrays you if that falls below 30.
  const isAlly = iso => (G.state.allies || []).includes(iso) && G.state.owner[iso] === iso && !owns(iso);
  const allies = () => (G.state.allies || []).filter(isAlly);
  // Can an ally's forces get to a country: over land, by sea with a real navy, or nearby.
  const allyReaches = (a, T) => (window.NEIGHBORS[a] || []).includes(T) || ((forces(a).ships || 0) + (forces(a).carriers || 0) * 10 >= 15) || distKm(a, T) < 2500;
  const allyForce = (a, share) => share * rawPower(forces(a), a) * ms(a).skill * isr(a);
  // Help your allies send: to defend one of your nations, or to join your attack on a country
  // (not against their own treaty partners). Loyal allies (70+) send it all; 50–69 defend fully
  // but join attacks with half; 30–49 defend with half and won't attack.
  function allyHelp(T, attack) {
    return allies().filter(a => a !== T && allyReaches(a, T) && !(attack && blocsOf(a).some(({ members }) => members.includes(T))))
      .map(a => { const L = allyLoyalty(a).score, f = attack ? (L >= 70 ? 1 : L >= 50 ? 0.5 : 0) : (L >= 50 ? 1 : L >= 30 ? 0.5 : 0); return { iso: a, power: allyForce(a, attack ? 0.1 : 0.15) * f, loyalty: L }; })
      .filter(h => h.power > 0);
  }
  const allyTotal = list => list.reduce((x, h) => x + h.power, 0);
  // What draws a country to you (used to sign an alliance and, later, to keep it).
  function allianceParts(iso) {
    const s = G.state, t = BY[iso];
    const S = empireSoft(), A = empireStrength(), D = Math.max(1, t.truePower * 1.25);
    const mine = empire().map(c => c.iso3), blocs = blocsOf(iso);
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
    return parts;
  }
  function allianceTerms(iso) {
    const s = G.state, t = BY[iso];
    if (!s.player) return { why: "Start a campaign first." };
    if (owns(iso)) return { why: `${t.name} is already part of your empire.` };
    if (s.owner[iso] !== iso) return { why: `${t.name} is occupied by ${BY[s.owner[iso]].name}.` };
    if (isAlly(iso)) return { why: `${t.name} is already your ally.` };
    if (s.wars[iso] || s.armies.some(a => a.to === iso)) return { why: `You are at war with ${t.name}.` };
    if (isHostile(iso)) return { why: `${t.name} is hostile after recent fighting with you (${HOSTILE_TURNS - (s.turn - s.hostile[iso])} more days).` };
    const rival = empire().map(c => c.iso3).find(m => (RIVAL.get(iso) || []).includes(m));
    if (rival) return { why: `${t.name} is a sworn rival of ${BY[rival].name}.` };
    const parts = allianceParts(iso), score = parts.reduce((x, p2) => x + p2[1], 0);
    return { score, need: 50, parts, ok: score >= 50 };
  }
  // An ally's loyalty to you: what drew it in, minus what the war is costing it.
  function allyLoyalty(iso) {
    const s = G.state, parts = allianceParts(iso);
    const hit = Object.keys(s.invasions || {}).length;
    if (hit) parts.push([`${hit} of your nations under attack: you look like a losing side`, -5 * hit]);
    const days = (s.allyDays || {})[iso] || 0;
    if (days >= 3) parts.push([`War weariness: its troops have fought ${days} days in your wars`, -Math.min(20, Math.floor(days / 3))]);
    const nb = Object.keys(s.wars).find(w => (window.NEIGHBORS[iso] || []).includes(w) && !(RIVAL.get(iso) || []).includes(w));
    if (nb) parts.push([`You invaded its neighbour ${BY[nb].name}`, -10]);
    const foes = [...new Set(s.enemies.filter(e => e.vsPlayer).map(e => e.nat))];
    const big = foes.find(f => sideStrength(f) > sideStrength(s.player));
    if (big) parts.push([`${BY[big].name}, attacking you, looks stronger than you`, -15]);
    const rv = (RIVAL.get(iso) || []).find(r => isAlly(r));
    if (rv) parts.push([`You are also allied with its rival ${BY[rv].name}`, -25]);
    const score = Math.max(0, Math.min(100, parts.reduce((x, p) => x + p[1], 0)));
    return { score, parts, stance: window.stanceOf(score) };
  }
  // Each day: allies whose loyalty falls under 50 waver, and under 30 they betray you.
  function checkAllies() {
    const s = G.state, warn = (s.allyWarn = s.allyWarn || {});
    allies().forEach(a => {
      const L = allyLoyalty(a), why = L.parts.filter(p => p[1] < 0).sort((x, y) => x[1] - y[1]).slice(0, 2).map(p => p[0].toLowerCase()).join("; ");
      if (L.score < 30) {
        s.allies = s.allies.filter(x => x !== a);
        delete warn[a];
        provoke(a);
        log(`🗡️ ${BY[a].name} betrayed you: it tore up your alliance and turned hostile (loyalty ${L.score}: ${why || "what drew it to you has faded"}).`, "bad");
      } else if (L.score < 50 && !warn[a]) {
        warn[a] = 1;
        log(`⚠️ ${BY[a].name} is wavering (loyalty ${L.score}: ${why || "what drew it to you has faded"}). It won't join your attacks, and below 30 it will betray you.`, "bad");
      } else if (L.score >= 55) delete warn[a];
    });
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
  const rawPower = (units, iso, models) => UNITS.reduce((s, u) => s + (units[u.key] || 0) * u.power * window.unitQuality(BY[iso], u.key, models && models[u.key]) * partsFactor(iso, u.key), 0);
  // ── Spare parts with no trade (js/maintenance.js) ──
  // Parts still come from the country itself, its owner's other lands, your allies (if it is
  // yours) and its treaty partners. The rest is cut off: once a country is at war, that share of
  // its fleet runs down as stocks and cannibalised parts run out over ~4 months, to what its own
  // depots can keep going (maintSkill).
  const partsOk = (iso, o) => o === iso || G.state.owner[o] === G.state.owner[iso] ||
    (G.state.owner[iso] === G.state.player && (G.state.allies || []).includes(o) && G.state.owner[o] === o) ||
    (G.state.owner[o] === o && blocsOf(iso).some(({ members }) => members.includes(o)));
  function partsCut(iso, key) {
    const list = (BY[iso].equipment && BY[iso].equipment[key]) || [], by = {};
    let tot = 0, cut = 0;
    if (!Array.isArray(list)) return { share: 0, by };
    list.forEach(([model, n]) => {
      const parts = window.modelParts(iso, model);
      tot += n;
      if (!parts.length) return;
      parts.forEach(o => {
        const origins = Array.isArray(o) ? o : [o];
        if (origins.some(x => partsOk(iso, x))) return;
        const w = n / parts.length;
        cut += w;
        by[origins[0]] = (by[origins[0]] || 0) + w;
      });
    });
    Object.keys(by).forEach(k => (by[k] /= tot || 1));
    return { share: tot ? cut / tot : 0, by };
  }
  let partsCache = { st: null, turn: -1, v: {} };
  function partsFactor(iso, key) {
    if (key === "troops") return 1;
    const d = warDaysOf(iso);
    if (!d) return 1;
    const s = G.state;
    if (partsCache.st !== s || partsCache.turn !== s.turn) partsCache = { st: s, turn: s.turn, v: {} };
    const ck = iso + key;
    if (partsCache.v[ck] == null) {
      const sk = window.maintSkill(iso), f = sk + (1 - sk) * Math.max(0, 1 - d / window.PARTS_DAYS);
      partsCache.v[ck] = 1 - partsCut(iso, key).share * (1 - f);
    }
    return partsCache.v[ck];
  }
  // For the dossier: each kind's dependence on cut-off parts, today and after stocks run out.
  function partsInfo(iso) {
    const sk = window.maintSkill(iso);
    return UNITS.filter(u => u.key !== "troops" && (forces(iso)[u.key] || 0) >= 1).map(u => {
      const c = partsCut(iso, u.key);
      return { key: u.key, label: u.label, share: c.share, by: c.by, now: partsFactor(iso, u.key), floor: 1 - c.share * (1 - sk) };
    });
  }
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
  const powerIn = (units, nat, models, to) => UNITS.reduce((s, u) => s + (units[u.key] || 0) * u.power * window.unitQuality(BY[nat], u.key, models && models[u.key]) * partsFactor(nat, u.key) * window.terrainKind(to, u.key) * weatherKind(to, nat, u.key) * nightKind(to, nat, u.key), 0);
  // ── Weather and seasons (js/weather.js) ──
  // Each day's weather in the country being fought over cuts what each kind of unit can do, less
  // for forces used to that climate or trained for it. Jets with modern all-weather radar keep
  // flying in rain, fog and snow (by technology generation); big blue-water navies (logistics)
  // keep sailing in heavy seas. Weather is fixed by date and place, never rolled.
  const DAY_MS = 86400000;
  const absDay = turn => Math.floor((G.state.date0 || 0) / DAY_MS) + (turn == null ? G.state.turn : turn) - 1;
  const dateOf = turn => new Date(absDay(turn) * DAY_MS);
  const wxMemo = {};
  function weather(iso, turn) {
    const a = absDay(turn), ck = iso + a;
    if (wxMemo[ck]) return wxMemo[ck];
    const d = new Date(a * DAY_MS), doy = Math.min(364, Math.floor((a * DAY_MS - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY_MS));
    return (wxMemo[ck] = window.weatherAt(iso, a, doy));
  }
  const airAW = nat => Math.max(0, Math.min(0.85, (BY[nat].tech.gen - 2) / 3.5));
  const navAW = nat => Math.max(0, Math.min(0.8, ms(nat).logistics / 12));
  function weatherKind(at, nat, key, w) {
    w = w || weather(at);
    const cls = window.WEATHER_CLASS[key], base = (w.pen || {})[cls] || 0;
    if (!base) return 1;
    let ad;
    if (cls === "air" || cls === "heli") ad = w.cat === "wet" || w.cat === "fog" || w.cat === "cold"
      ? Math.max(window.weatherAdapt(nat, w.cat) * 0.5, airAW(nat) * (w.type === "cyclone" || w.type === "blizzard" ? 0.3 : 0.7)) : window.weatherAdapt(nat, w.cat) * 0.6;
    else if (cls === "sea" || cls === "sub") ad = navAW(nat);
    else ad = window.weatherAdapt(nat, w.cat);
    return 1 - base * (1 - ad);
  }
  // A whole force's weather factor, weighted by each kind's share of its strength.
  // (Includes day and night: darkness costs each kind its own share, see nightKind.)
  function weatherMix(units, nat, at, models) {
    const w = weather(at), n = nightInfo(at);
    let a = 0, b = 0;
    UNITS.forEach(u => { const v = (units[u.key] || 0) * u.power * window.unitQuality(BY[nat], u.key, models && models[u.key]); a += v; b += v * weatherKind(at, nat, u.key, w) * nightKind(at, nat, u.key, n); });
    return a ? b / a : 1;
  }
  // ── Day and night (js/daynight.js) ──
  // A day's fighting spans its hours of daylight and darkness at the battlefield. In the dark each
  // kind loses its NIGHT_PEN share, less what its night kit and training avoid (NIGHT_CAP), and
  // less again under a bright moon for forces fighting by eye.
  const latOf = iso => ((window.CENTROIDS || {})[iso] || [0, 0])[1];
  const doyOfAbs = a => { const d = new Date(a * DAY_MS); return Math.min(364, Math.floor((a * DAY_MS - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY_MS)); };
  const nightMemo = {};
  function nightInfo(iso, turn) {
    const a = absDay(turn), ck = iso + a;
    if (nightMemo[ck]) return nightMemo[ck];
    const dark = window.darkHours(latOf(iso), doyOfAbs(a)), moon = window.moonLight(a * DAY_MS + 43200000);
    return (nightMemo[ck] = { dark, moon, frac: dark / 24 });
  }
  function nightCap(nat, cls) {
    const o = window.NIGHT_CAP[nat];
    if (o && o[0][cls] != null) return o[0][cls];
    const g = BY[nat].tech.gen;
    return Math.max(0.05, Math.min(0.8, cls === "air" || cls === "heli" ? (g - 2.5) / 2.3 : (g - 2.2) / 2.6));
  }
  function nightKind(at, nat, key, n) {
    n = n || nightInfo(at);
    const pen = window.NIGHT_PEN[window.WEATHER_CLASS[key]] || 0;
    if (!pen || !n.frac) return 1;
    return 1 - n.frac * pen * (1 - nightCap(nat, window.WEATHER_CLASS[key])) * (1 - 0.35 * n.moon);
  }

  // ── Drones (js/drones.js) ──
  // A side's drones add to its strength by their technology level, cut by the enemy's
  // counter-drone defences, by weather that grounds them, by darkness for those without thermal
  // cameras (level under 6), and by how many it has left. Stocks (in days of hard use) start at 30,
  // burn a day for each day at war and refill at what its factories make (needing chips, which
  // with no trade only some countries have).
  const droneStock = iso => { const d = (G.state.drones = G.state.drones || {}); return d[iso] == null ? (d[iso] = window.droneTech(iso).level ? 30 : 0) : d[iso]; };
  function droneSustain(iso) {
    const t = window.droneTech(iso), e = econOf(iso), chips = e.fill && e.fill.chips != null && isFinite(e.fill.chips) ? Math.min(1, e.fill.chips) : 1;
    return Math.min(1.5, t.prod / Math.max(5, BY[iso].active * 0.5)) * (0.4 + 0.6 * chips);
  }
  function droneEdge(nat, at, vs) {
    const t = window.droneTech(nat);
    if (!t.level) return 0;
    const enemy = vs && BY[vs] ? window.droneTech(vs).counter : 0, n = nightInfo(at);
    return 0.03 * t.level * (1 - 0.06 * enemy) * (window.DRONE_WEATHER[weather(at).type] ?? 1) * (t.level >= 6 ? 1 : 1 - 0.3 * n.frac) * Math.min(1, droneStock(nat) / 10);
  }
  function droneDay() {
    const s = G.state;
    C.forEach(c => {
      const iso = c.iso3;
      if (!window.droneTech(iso).level) return;
      const st = droneStock(iso), sus = droneSustain(iso);
      s.drones[iso] = atWar(iso) ? Math.max(0, Math.min(60, st - 1 + sus)) : Math.min(Math.max(st, 30), st + sus);
    });
  }
  const wxTag = (iso, mine, theirs) => { const w = weather(iso), n = nightInfo(iso); return ` ${w.type === "clear" ? "" : `${w.icon} ${w.label}, ${w.temp}°C · `}${window.moonIcon(n.moon)} ${Math.round(n.dark)}h of darkness: your side ×${mine.toFixed(2)}, theirs ×${theirs.toFixed(2)}.`; };
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
  const isr = iso => space(iso) * window.intelMult(BY[iso]) * fuel(iso);
  // An army's strength where it is: in its own or your territory it fights as a defender (no
  // supply or terrain penalty); invading, it counts by the terrain and its supply line.
  const armyPower = a => {
    const home = owns(a.to) || a.to === a.nat;
    return (home ? rawPower(a.units, a.nat, a.models) * weatherMix(a.units, a.nat, a.to, a.models) : powerIn(a.units, a.nat, a.models, a.to) * supply(a.nat, a.to, distKm(a.from, a.to), a.sea) * (a.sea || a.mode === "sea" ? subScreen(a.to, forces(a.to).subs, a.units, a.nat) : 1)) * (1 + bonus("atk")) * ms(a.nat).skill * isr(a.nat) * (owns(a.to) || a.to === a.nat ? 1 : 1 + droneEdge(a.nat, a.to, G.state.owner[a.to]));
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
  function defenceOf(iso, attacker) {
    const c = BY[iso];
    const allies = alliedSupport(iso, attacker === undefined ? G.state.player : attacker);
    const allyMult = Math.min(2, allies.strength / Math.max(5, c.truePower));
    const base = rawPower(forces(iso), iso) * weatherMix(forces(iso), iso, iso) * (1 + droneEdge(iso, iso, attacker === undefined ? G.state.player : attacker)) * 1.25 * ms(iso).skill * ms(iso).defend * fortMult(iso) * terrainDef(iso) * isr(iso) * (1 + fx(iso, "def")) + 20;
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
      // Armies cross your own lands, your allies' and treaty partners' (they grant transit), never neutral ones.
      (NB[x] || []).forEach(n => { if (!seen.has(n) && (owns(n) || isAlly(n) || transitOk(n))) { seen.add(n); q.push(n); } });
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
  // ── Power projection (js/projection.js) ──
  // An army crossing the sea or flying in must start from a staging point within its country's
  // reach of the target: home, conquered or allied land, a treaty partner's (basing rights), or one
  // of its bases abroad. Fighters need a base within 2,500 km (tankers stretch it) and helicopters
  // within 1,000 km unless a carrier sails with them.
  const transitOk = n => G.state.player && G.state.owner[n] === n && blocsOf(n).some(({ members }) => members.some(m => owns(m)));
  const reachOf = nat => { const r = window.REACH_KM[nat]; return (r ? r[0] : 400 + 250 * ms(nat).logistics) * (owns(nat) ? 1 + 0.5 * techShare(nat, "logistics") : 1); };
  let stageCache = { st: null, turn: -1, v: {} };
  function stagingPoints(nat) {
    const s = G.state;
    if (stageCache.st !== s || stageCache.turn !== s.turn) stageCache = { st: s, turn: s.turn, v: {} };
    if (stageCache.v[nat]) return stageCache.v[nat];
    const P = window.CENTROIDS || {}, side = s.owner[nat] || nat, pts = [];
    const friendly = i => s.owner[i] === side || (side === s.player && isAlly(i)) || (s.owner[i] === i && blocsOf(nat).some(({ members }) => members.includes(i)));
    C.forEach(c => { if (P[c.iso3] && friendly(c.iso3)) pts.push({ at: P[c.iso3], name: BY[c.iso3].name }); });
    (window.DEPLOYMENTS[nat] || []).forEach(r => { if (r[7] && (r[7] === "TERR" || friendly(r[7]) || s.owner[r[7]] === r[7])) pts.push({ at: [r[1], r[2]], name: r[0] }); });
    return (stageCache.v[nat] = pts);
  }
  function projection(nat, to, fromPt) {
    const P = window.CENTROIDS || {}, T = P[to];
    if (!T) return { km: 0, from: BY[nat].name, reach: reachOf(nat), ok: true };
    let best = { km: Infinity, from: "" };
    stagingPoints(nat).concat(fromPt ? [{ at: fromPt, name: "the starting base" }] : []).forEach(p => { const km = d3.geoDistance(p.at, T) * 6371; if (km < best.km) best = { km, from: p.name }; });
    const reach = reachOf(nat);
    return { km: best.km, from: best.from, reach, ok: best.km <= reach };
  }
  // fromPt (optional): the exact starting point, e.g. a base, instead of the source country's centre.
  function route(from, to, units, nat, fromPt) {
    const P = window.CENTROIDS || {};
    const km = fromPt && P[to] ? d3.geoDistance(fromPt, P[to]) * 6371 : distKm(from, to);
    const has = u => (units[u.key] || 0) > 0;
    const ground = UNITS.some(u => u.kind === "ground" && has(u));
    const naval = UNITS.some(u => u.kind === "naval" && has(u));
    const land = landLinked(from, to);
    const proj = land ? null : projection(nat, to, fromPt);
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
      const bySea = !land && need <= cap && proj.ok ? (km * 1.3) / seaSpeed + 48 : Infinity;
      air = airlift(nat, units, km);
      const byAir = air.ok && (land || proj.ok) ? air.hours : Infinity;
      const best = Math.min(byLand, bySea, byAir);
      if (best === Infinity) ok = false;
      else { legs.push(best); mode = best === byAir ? "airlift" : best === bySea ? "sea" : "land"; }
    }
    // Aircraft need a base in range: fighters 2,500 km, helicopters 1,000 km, unless a carrier comes along.
    let airRange = null;
    if (!land && !(units.carriers > 0)) {
      if ((units.helis || 0) > 0 && proj.km > 1000) airRange = { kind: "helicopters", max: 1000 };
      else if ((units.fighters || 0) > 0 && proj.km > 2500) airRange = { kind: "fighters", max: 2500 };
      else if ((units.aircraft || 0) > 0 && !proj.ok) airRange = { kind: "aircraft", max: proj.reach };
      if (airRange) ok = false;
    }
    const hours = (legs.length ? Math.max(...legs) : 1) * travelMult(nat);
    return { km, land, sea: mode === "sea" && ground, mode, need, cap, air, proj, airRange, hours: Math.max(0.5, hours), turns: Math.max(1, Math.ceil(hours / 24)), ok };
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
  // You command only the country you chose to lead, plus the countries it conquers, unites with
  // or buys: never another country's forces.
  const canCommand = iso => !!G.state.player && !G.state.over && owns(iso);
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

  // Why an army can't project that far, in plain words.
  function reachWhy(nat, to, r) {
    const pj = r.proj, km = n => Math.round(n).toLocaleString("en-US");
    if (r.airRange) return `Out of range: the nearest base for your ${r.airRange.kind} (${pj.from}) is ${km(pj.km)} km from ${BY[to].name}, beyond their ${km(r.airRange.max)} km reach. Send a carrier with them, or take or ally with a country closer.`;
    return `Beyond ${BY[nat].name}'s reach: its nearest staging point (${pj.from}) is ${km(pj.km)} km from ${BY[to].name}, and it can land and supply an army at most ${km(pj.reach)} km away (${(window.REACH_KM[nat] || [0, `logistics ${ms(nat).logistics}/10`])[1]}). Conquer or ally with a country closer to stage from, or raise logistics.`;
  }
  // Send units from a home pool or an army to any country. Nothing fights until the next End turn.
  // `models` ({kind: {model: count}}) records exactly which models were picked, e.g. at a base.
  function dispatch(srcKey, to, units, models, ships) {
    const err = ready(); if (err) return err;
    const s = G.state, p = preview(srcKey, to, units, models);
    if (p.err) return p.err;
    if (p.empty) return "Pick at least one unit to send.";
    if (isAlly(to)) return `${BY[to].name} is your ally. End the alliance first (in its dossier) to attack it.`;
    if (!p.route.ok && (p.route.airRange || (p.route.proj && !p.route.proj.ok))) return reachWhy(p.src.nat, to, p.route);
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
    if (!canCommand(iso)) return { err: G.state.player ? `${BY[iso].name}'s forces aren't yours to command.` : "Start a campaign to command units." };
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
    if (blocsOf(iso).length) p *= 0.5;
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
      annex(iso, 0.9, "union");
      s.coins += loot(t);
      log(`🤝 ${t.name} joined your union peacefully. +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins.`, "good");
    } else {
      log(`📜 Your influence in ${t.name} is now ${Math.round(inf[iso] * 100)}% (+${Math.round(d.p * 100)}% this turn). It joins at 100%.`, "info");
    }
    save();
    return null;
  }

  // ── Occupation happiness (js/occupation.js) ──
  // How the people of `iso` take rule by `by` (0–100), with the reasons. how: "conquest" (default),
  // "union" or "bought"; since: the day it changed hands (time softens resentment).
  function happiness(iso, by, how, since) {
    const s = G.state, t = BY[iso], o = BY[by], parts = [["Baseline: nobody welcomes foreign rule", 40]];
    const cg = window.CULTURE_OF, rg = window.RELIGION_OF, F = window.RELIGION_FAMILY;
    if (cg[iso] && cg[iso] === cg[by]) parts.push([`Same culture and language (${cg[iso]})`, 20]);
    else if (window.CULTURE_KIN.some(([a, b]) => (a === cg[iso] && b === cg[by]) || (b === cg[iso] && a === cg[by]))) parts.push(["Related cultures", 8]);
    else parts.push(["A foreign culture and language", -5]);
    const ra = rg[iso], rb = rg[by];
    if (ra && ra === rb && ra !== "mixed") parts.push(["Same religion", 10]);
    else if (F[ra] && F[ra] === F[rb]) parts.push(F[ra] === "muslim" ? ["Muslim, but the other branch (Sunni/Shia)", -5] : ["Christian, but a different church", 3]);
    else if ((F[ra] === "muslim" && ["jewish", "hindu"].includes(rb)) || (["jewish", "hindu"].includes(ra) && F[rb] === "muslim")) parts.push(["Religious conflict", -15]);
    else if (ra !== "mixed" && rb !== "mixed") parts.push(["A different religion", -5]);
    const h = (window.OCCUPATION_HIST[by] || {})[iso];
    if (h && h[0]) parts.push([h[1], h[0]]);
    if ((RIVAL.get(iso) || []).includes(by) && !(h && h[0] < 0)) parts.push(["Sworn rivals", -20]);
    if (blocsOf(iso).some(({ members }) => members.includes(by))) parts.push(["Allies before the takeover", 10]);
    const D = window.DEMOCRACIES;
    if (D.has(iso) && !D.has(by)) parts.push(["A free society ruled by an autocracy", -15]);
    else if (!D.has(iso) && D.has(by)) parts.push(["Many hope for more freedom", 5]);
    const w = Math.max(-10, Math.min(10, Math.round(4 * Math.log2((o.gdpPerCap || 1) / Math.max(1, t.gdpPerCap || 1)))));
    if (w) parts.push([w > 0 ? "A richer ruler: better living standards" : "A poorer ruler: falling living standards", w]);
    const pride = Math.round(Math.min(12, 3 * Math.log10(1 + t.pop)));
    if (pride) parts.push(["National pride", -pride]);
    const hw = how || "conquest";
    parts.push(hw === "union" ? ["Joined by diplomatic union", 15] : hw === "bought" ? ["Bought, not conquered", 5] : ["Conquered by force", -15]);
    if (since != null) { const t2 = Math.min(15, Math.floor((s.turn - since) / 10)); if (t2) parts.push([`${s.turn - since} days under this rule`, t2]); }
    if (s.revolts && s.revolts[iso]) parts.push(["In revolt", -10]);
    return { score: Math.max(0, Math.min(100, parts.reduce((x, p) => x + p[1], 0))), parts };
  }
  // Happiness of a land held by someone else right now (null if independent).
  function occupation(iso) {
    const s = G.state, o = s.owner[iso];
    if (!o || o === iso) return null;
    const a = (s.acquired || {})[iso];
    return happiness(iso, o, a && a.how, a ? a.turn : null);
  }
  // Unhappy lands build unrest faster: ×1.6 at 0, ×1 at 50, ×0.4 at 100. They also pay less.
  const unrestMult = H => 1.6 - 1.2 * H / 100;
  const payShare = H => 0.5 + 0.6 * H / 100;

  function annex(iso, garrison, how) {
    const s = G.state, before = s.player ? empireEcon() : null;
    (s.acquired = s.acquired || {})[iso] = { how: how || "conquest", turn: s.turn };
    s.owner[iso] = s.player;
    s.garrison[iso] = garrison;
    invalidateGroups();
    delete s.wars[iso];
    if (before) seizeLog(iso, before);
  }
  // A country joining your empire hands over its resources at once (pooled into your war economy)
  // and half of its factories.
  function seizeLog(iso, before) {
    const after = empireEcon(), L = window.WAR_RES_LABEL, gained = [];
    const p = window.warProfile(iso).res;
    if (p.oil >= 0.05) gained.push(`${p.oil.toFixed(2)} million barrels a day of oil`);
    ["steel", "alu", "ti", "ree", "chips"].forEach(r => { if (p[r] > 0 && after.fill[r] > before.fill[r] + 0.01) gained.push(L[r].toLowerCase()); });
    const unlocked = Object.keys(after.perYear).filter(k => before.perYear[k] < 0.01 && after.perYear[k] >= 0.5);
    log(`📦 Seized ${BY[iso].name}'s resources and factories${gained.length ? ` (${gained.join(", ")})` : ""}: war output $${Math.round(before.capacity)}bn → $${Math.round(after.capacity)}bn a year, oil ${Math.round(before.fuelRatio * 100)}% → ${Math.round(after.fuelRatio * 100)}% of needs${unlocked.length ? `; you can now build ${unlocked.join(", ")}` : ""}.`, "good");
  }


  // ── Turn resolution ─────────────────────────────────────────

  // One round of fighting in a country you are invading.
  function warRound(iso) {
    const s = G.state, t = BY[iso], armies = armiesAt(iso);
    if (!s.wars[iso]) blocWar(iso, s.player);
    const war = (s.wars[iso] = s.wars[iso] || { start: s.turn, p0: rawPower(forces(iso), iso) });
    const help = allyHelp(iso, true), mine = missileSalvo(empire().map(c => c.iso3), iso), theirs = missileSalvo([iso], armies[0] ? armies[0].nat : s.player);
    const D = defenceOf(iso).total + theirs.power;
    const A = armies.reduce((x, a) => x + armyPower(a) / (a.sea ? 1 : borderMult(iso, yourCrossing(iso, a.from))), 0) + allyTotal(help) + mine.power;
    const r = A / (A + D);
    scaleUnits(forces(iso), 1 - Math.min(0.6, 0.3 * r));
    const al = Math.min(0.6, 0.3 * (1 - r));
    armies.forEach(a => scaleUnits(a.units, 1 - al));
    help.forEach(h => scaleUnits(forces(h.iso), 1 - al * 0.1)); // allies' contingents (10% of their forces) take losses too
    const ad = (s.allyDays = s.allyDays || {});
    help.forEach(h => (ad[h.iso] = (ad[h.iso] || 0) + 1));
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
      annex(iso, 0.5, "conquest");
      scaleUnits(forces(iso), 0.5); // survivors surrender and join you, weapons locked
      s.coins += loot(t);
      log(`⚔️ Conquered ${t.name} after ${s.turn - war.start + 1} turn(s) of fighting. +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins. Your armies are now stationed there.`, "good");
      return;
    }
    log(`⚔️ Fighting in ${t.name}: your strength ${A.toFixed(0)} vs ${D.toFixed(0)}. Defences ${Math.round(prog * 100)}% broken.${salvoText(mine, theirs)}${wxTag(iso, left[0] ? weatherMix(left[0].units, left[0].nat, iso, left[0].models) : 1, weatherMix(forces(iso), iso, iso))}`, r >= 0.5 ? "good" : "info");
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
    const s = G.state, b = baseForces(c), size = (0.15 + 0.35 * (1 - s.garrison[c.iso3])) * (1.5 - occupation(c.iso3).score / 100);
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
      s.owner[iso] = iso; s.garrison[iso] = 0.6; invalidateGroups();
      const f = forces(iso);
      UNITS.forEach(u => (f[u.key] = (f[u.key] || 0) * 0.5 + (rv.units[u.key] || 0)));
      s.armies.filter(a => a.to === iso).forEach(a => recall(a.id));
      log(`🏳️ ${c.name} won its independence. Your armies there are withdrawing.`, "bad");
    } else {
      log(`🔥 Revolt in ${c.name}: loyal ${L.toFixed(0)} vs rebels ${R.toFixed(0)}. Rebel progress ${Math.round(rv.progress)}%.`, r >= 0.5 ? "info" : "bad");
    }
  }

  // ── War production (js/wareconomy.js) ───────────────────────
  // Losses are replaced only by what factories build and recruits trained, with no trade between
  // countries. Each country mobilises while it fights: from 5% of its total-war output in peacetime
  // up to 100% after about a month at war, falling back slowly in peace. Your empire produces as
  // one economy with pooled resources, including everything seized from conquered countries.
  const mobOf = iso => ((G.state.mob = G.state.mob || {})[iso] ?? 0.05);
  const econCache = new Map();
  function econFor(isos, core) {
    const key = core + ":" + isos.join(",");
    if (!econCache.has(key)) { if (econCache.size > 400) econCache.clear(); econCache.set(key, window.warEconomy(isos, core)); }
    return econCache.get(key);
  }
  const empireEcon = () => econFor(empire().map(c => c.iso3).sort(), G.state.player);
  const countryEcon = iso => econFor([iso], iso);
  // Each owner's nations (an AI country with its conquests, or your empire), cached for a moment.
  let groups = null, groupsAt = 0;
  function groupOf(iso) {
    if (!groups || Date.now() - groupsAt > 1000) {
      groups = {}; groupsAt = Date.now();
      C.forEach(c => (groups[G.state.owner[c.iso3]] = groups[G.state.owner[c.iso3]] || []).push(c.iso3));
    }
    return groups[G.state.owner[iso]] || [iso];
  }
  const invalidateGroups = () => (groups = null);
  // The war economy a country fights with: its owner's whole group, resources pooled.
  const econOf = iso => { const o = G.state.owner[iso]; return econFor(groupOf(iso).slice().sort(), o); };
  // Fuel: a country at war burns its strategic oil reserves first; once they run out, a group that
  // can't produce the oil it needs (with no trade, nobody sells it any) fights at 50–100% and its
  // factories slow down. Japan's ~240 days of stocks last longest.
  const warDaysOf = iso => ((G.state.warDays || {})[G.state.owner[iso]] || 0);
  function fuel(iso) {
    if (!G.state.owner || !window.warEconomy) return 1;
    const e = econOf(iso);
    return warDaysOf(iso) <= e.reserveDays ? 1 : 0.5 + 0.5 * e.fuelRatio;
  }
  // Add one day's output to a set of nations' forces, filling the biggest gaps first; at war forces
  // may grow to 130% of their pre-war size.
  function addOutput(isos, perDay, mob, boost, deployedOf) {
    UNITS.forEach(u => {
      let add = (u.key === "troops" ? perDay.troops + perDay.reserve : perDay[u.key] || 0) * mob * (typeof boost === "function" ? boost(u.key) : boost);
      if (add <= 0) return;
      const room = isos.map(iso => {
        const b = baseForces(BY[iso])[u.key] * (atWar(iso) ? 1.3 : 1), dep = (deployedOf(iso)[u.key] || 0);
        return Math.max(0, b - dep - (forces(iso)[u.key] || 0));
      });
      const tot = room.reduce((a, x) => a + x, 0);
      if (!tot) return;
      isos.forEach((iso, i) => { if (room[i] > 0) forces(iso)[u.key] = (forces(iso)[u.key] || 0) + Math.min(room[i], (add * room[i]) / tot); });
    });
  }
  function produce() {
    const s = G.state, mob = (s.mob = s.mob || {}), wd = (s.warDays = s.warDays || {});
    invalidateGroups();
    C.forEach(c => { const iso = c.iso3; mob[iso] = atWar(iso) ? Math.min(1, mobOf(iso) + 0.03) : Math.max(0.05, mobOf(iso) - 0.01); });
    // Oil reserves: a day of war burns a day of stocks; in peace they refill at a third of that.
    const owners = [...new Set(C.map(c => s.owner[c.iso3]))];
    owners.forEach(o => { wd[o] = groupOf(o).some(i => atWar(i)) ? (wd[o] || 0) + 1 : Math.max(0, (wd[o] || 0) - 1 / 3); });
    const fuelProd = iso => (warDaysOf(iso) <= econOf(iso).reserveDays ? 1 : 0.3 + 0.7 * econOf(iso).fuelRatio);
    // AI countries, each with the nations it has conquered as one economy.
    owners.forEach(o => {
      if (o === s.player || !BY[o]) return;
      const isos = groupOf(o).filter(i => !inRevolt(i)), e = econOf(o), m = mob[o] * fuelProd(o);
      if (!isos.length) return;
      addOutput(isos, e.perDay, m, 1 + fx(o, "rec"), enemyDeployed);
      stockMissiles(isos, e.perDay.missiles * m);
    });
    // Your empire, as one war economy; the Arms production track speeds it up.
    if (s.player && !s.over) {
      const isos = empire().map(c => c.iso3).filter(i => !inRevolt(i)), e = empireEcon();
      const m = Math.max(...isos.map(i => mob[i])) * fuelProd(s.player), boost = (1 + TFULL.production * techShare(s.player, "production")) * (1 + fx(s.player, "rec"));
      addOutput(isos, e.perDay, m, k => boost * (1 + surge(s.player, k)), deployedFrom); // surge levels (91–100) speed up each kind
      stockMissiles(isos, e.perDay.missiles * m * boost);
    }
  }
  // New missiles go to the nations' arsenals (ballistic and cruise in their usual mix), up to 150%
  // of the pre-war stock.
  function stockMissiles(isos, n) {
    const cap = isos.map(iso => { const m = BY[iso].missiles, st = missileStock(iso); return Math.max(0, (m.bm + m.cm) * 1.5 - st.bm - st.cm); });
    const tot = cap.reduce((a, x) => a + x, 0);
    if (!tot || n <= 0) return;
    isos.forEach((iso, i) => {
      if (!cap[i]) return;
      const m = BY[iso].missiles, st = missileStock(iso), add = Math.min(cap[i], (n * cap[i]) / tot), bmShare = m.bm + m.cm ? m.bm / (m.bm + m.cm) : 0.5;
      st.bm += add * bmShare; st.cm += add * (1 - bmShare);
    });
  }

  // ── Enemy AI: counter-attacks on your nations ───────────────
  // Invading a country makes it hostile for 12 turns and it strikes back. Other neighbours of
  // your empire strike now and then when your border looks weak. Treaty allies stay out of it.
  // Their armies travel and fight round by round like yours.
  const HOSTILE_TURNS = 12;
  function provoke(iso) { G.state.hostile[iso] = G.state.turn; }
  const isHostile = iso => G.state.hostile[iso] != null && G.state.turn - G.state.hostile[iso] <= HOSTILE_TURNS;
  const enemyPower = e => (1 + droneEdge(e.nat, e.to, G.state.owner[e.to])) * powerIn(e.units, e.nat, e.models, e.to) * supply(e.nat, e.to, distKm(e.from || e.nat, e.to), e.sea) * ms(e.nat).skill * isr(e.nat) *
    (e.sea ? subScreen(e.to, owns(e.to) ? homeShare(e.to).subs : forces(e.to).subs, e.units, e.nat) : 1) /
    (e.sea ? 1 : borderMult(e.to, crossing(e.to, e.from || e.nat, n => n === e.nat || G.state.owner[n] === e.nat)));
  const enemiesAt = iso => G.state.enemies.filter(e => e.to === iso && arrived(e));
  const enemyDeployed = iso => {
    const d = {};
    G.state.enemies.filter(e => e.nat === iso).forEach(e => UNITS.forEach(u => (d[u.key] = (d[u.key] || 0) + (e.units[u.key] || 0))));
    return d;
  };
  // Your side when one of your nations is attacked: its own accessible forces, order, trait, stationed armies and allies.
  // Your treaty partners (if this nation was in a bloc) join in by their loyalty, as for any member.
  function homeDefence(iso, attacker) {
    const u = homeShare(iso), bloc = alliedSupport(iso, attacker || null);
    return rawPower(u, iso) * weatherMix(u, iso, iso) * (1 + droneEdge(iso, iso, attacker)) * 1.25 * ms(iso).skill * ms(iso).defend * fortMult(iso) * terrainDef(iso) * isr(iso) * (1 + fx(iso, "def")) * (0.5 + 0.5 * G.state.garrison[iso]) *
      (1 + Math.min(2, bloc.strength / Math.max(5, BY[iso].truePower))) +
      armiesAt(iso).reduce((x, a) => x + armyPower(a), 0) + allyTotal(allyHelp(iso, false)) + 10;
  }

  // Defence of any target: yours (homeDefence) or an AI country's (defenceOf).
  const targetDefence = (T, A) => (owns(T) ? homeDefence(T, A) : defenceOf(T, A || null).total);
  function launchEnemy(A, T) {
    const s = G.state, f = forces(A), land = (window.NEIGHBORS[A] || []).includes(T), vsPlayer = owns(T);
    // Send about 1.45× what defends the target, within a share of the army that grows with hostility.
    const cap = !vsPlayer ? 0.45 : isHostile(A) ? 0.45 : 0.3;
    const want = targetDefence(T, A) * 1.45 / Math.max(1, rawPower(f, A) * ms(A).skill);
    const share = Math.max(0.03, Math.min(cap, want));
    const units = {};
    if (!land && !projection(A, T).ok) return; // can't project that far
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
    const fresh = !s.enemies.some(x => x.nat === A && x.to === T);
    s.enemies.push(e);
    if (fresh) blocWar(T, A);
    if (vsPlayer) {
      s.hostile[A] = s.turn;
      if (detected) log(`🚨 Intelligence warning: ${BY[A].name} launched an attack on ${BY[T].name}: about ${unitList(fuzzUnits(units, A))}. Arrives in ${fmtDur(hours)} (${clockLabel(etaH)}). Send forces to defend it.`, "bad");
    } else log(`🌍 ${BY[A].name} invaded ${BY[T].name} with ${unitList(units)}. Arrives in ${fmtDur(hours)}.`, "world");
  }

  // ── Intelligence: what you can see of others ───────────────
  // Your best intelligence score across your nations. Estimates of enemy strength carry an error
  // band that shrinks with your intelligence and widens with their counter-intelligence.
  const myIntel = () => (G.state.player && empire().length ? Math.max(...empire().map(c => c.intelProfile.score)) : 5);
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
  // Countries with no sea coast (or only the Caspian): reachable overland only.
  const LANDLOCKED = new Set(["AFG", "AND", "ARM", "AUT", "AZE", "BLR", "BTN", "BOL", "BWA", "BFA", "BDI", "CAF", "TCD", "CZE", "ETH", "HUN", "KAZ", "KGZ",
    "LAO", "LSO", "LIE", "LUX", "MWI", "MLI", "MDA", "MNG", "NPL", "NER", "MKD", "PRY", "RWA", "SMR", "SRB", "SVK", "SSD", "CHE", "TJK", "TKM", "UGA", "UZB", "VAT", "ZMB", "ZWE"]);
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
    // Resource wars. With no trade, a country whose factories or fuel tanks run short of a resource
    // (oil, steel, aluminium, titanium, rare earths, chips) can only go without or take it. Tension
    // builds each day it lacks something a weaker neighbour (or, with a navy, a country within
    // 3,000 km) has; when it boils over, it invades for it. Your nations can be targets too.
    const rt = (s.resTension = s.resTension || {});
    C.forEach(c => {
      const A = c.iso3;
      if (!aiFree(A) || isAlly(A) || s.enemies.some(e => e.nat === A) || active >= 8) return;
      const e = econOf(A);
      if (!e.short.length || e.capacity < 3) return;
      const pa = rawPower(forces(A), A) * ms(A).skill;
      if (pa < 80) return;
      const nb = window.NEIGHBORS[A] || [], navy = (forces(A).ships || 0) + (forces(A).carriers || 0) * 10 >= 15;
      const treaty = T => blocsOf(A).some(({ members }) => members.includes(T));
      const has = (T, r) => { const p = window.warProfile(T).res; return r === "oil" ? p.oil > p.oilUse * 1.1 : p[r] > 0; };
      const cands = C.map(x => x.iso3).filter(T => T !== A && s.owner[T] !== A && (nb.includes(T) || (navy && !LANDLOCKED.has(T) && distKm(A, T) < 3000 && projection(A, T).ok)) && !treaty(T) &&
        e.short.some(r => has(T, r)) && pa * 0.4 > targetDefence(T, A) * 1.2);
      if (!cands.length) { rt[A] = Math.max(0, (rt[A] || 0) - 0.02); return; }
      rt[A] = (rt[A] || 0) + 0.02 * e.short.length;
      if (rt[A] < 1) return;
      const T = cands.reduce((a, b) => (targetDefence(a, A) <= targetDefence(b, A) ? a : b)), wants = e.short.filter(r => has(T, r)).map(r => window.WAR_RES_LABEL[r].toLowerCase());
      const before = s.enemies.length;
      launchEnemy(A, T);
      if (s.enemies.length > before) {
        active++; rt[A] = 0;
        log(`⛽ With all trade cut off, ${BY[A].name} has run short of ${wants.join(", ")}: it is invading ${BY[T].name} to take ${wants.length > 1 ? "them" : "it"}.`, owns(T) ? "bad" : "world");
      }
    });
  }

  // One round of a war between AI countries.
  function aiWarRound(T) {
    const s = G.state, c = BY[T], foes = enemiesAt(T);
    const w = ((s.aiWars = s.aiWars || {})[T] = s.aiWars[T] || { by: foes[0].nat, start: s.turn, p0: rawPower(forces(T), T) });
    const E = foes.reduce((x, e) => x + enemyPower(e), 0) + missileSalvo(foes.map(e => e.nat), T).power, D = defenceOf(T, foes[0].nat).total + missileSalvo([T], foes[0].nat).power, r = E / (E + D);
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
      s.owner[T] = s.owner[w.by] || w.by; s.garrison[T] = 0.6; invalidateGroups();
      (s.acquired = s.acquired || {})[T] = { how: "conquest", turn: s.turn };
      delete s.aiWars[T];
      log(`🌍 ${by} conquered ${c.name} after ${s.turn - w.start + 1} turn(s) of war.`, "world");
    }
  }

  // One round of an enemy assault on one of your nations.
  function defendRound(iso) {
    const s = G.state, c = BY[iso], foes = enemiesAt(iso);
    const inv = (s.invasions = s.invasions || {})[iso] || (s.invasions[iso] = { start: s.turn, progress: 0, e0: foes.reduce((x, e) => x + enemyPower(e), 0) });
    const theirs = missileSalvo(foes.map(e => e.nat), iso), mine = missileSalvo(empire().map(c => c.iso3), foes[0].nat);
    const E = foes.reduce((x, e) => x + enemyPower(e), 0) + theirs.power, D = homeDefence(iso, foes[0].nat) + mine.power;
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
      log(`🚨 ${by} attacking ${c.name}: enemy ${E.toFixed(0)} vs your ${D.toFixed(0)}. Enemy ${Math.round(inv.progress)}% of the way to taking it.${salvoText(mine, theirs)}${wxTag(iso, weatherMix(homeShare(iso), iso, iso), weatherMix(left[0].units, left[0].nat, iso, left[0].models))}`, r < 0.5 ? "info" : "bad");
    }
  }

  // An enemy took one of your nations. Losing your home nation moves your capital, or ends the game.
  function loseNation(iso, by, foes) {
    const s = G.state, c = BY[iso], f = forces(iso);
    s.armies.filter(a => a.to === iso).forEach(a => recall(a.id));
    delete s.revolts[iso];
    UNITS.forEach(u => (f[u.key] = (f[u.key] || 0) * 0.3 + foes.reduce((x, e) => x + (e.units[u.key] || 0), 0)));
    s.enemies = s.enemies.filter(e => !foes.includes(e));
    s.owner[iso] = by; s.garrison[iso] = 0.6; invalidateGroups();
    (s.acquired = s.acquired || {})[iso] = { how: "conquest", turn: s.turn };
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
    });
    produce();
    droneDay();
    // Occupied territories rise up when weakly held for long enough; your armies stationed there calm them.
    empire().forEach(c => {
      const iso = c.iso3;
      if (iso === s.player || inRevolt(iso) || (s.purchased || []).includes(iso)) return;
      const calm = (1 - fx(iso, "stab")) * (1 - TFULL.governance * Math.min(1, techShare(iso, "governance"))) * (armiesAt(iso).length ? 0.3 : 1);
      // Unrest builds each day a territory is weakly held; it rises up when unrest reaches 100%.
      const un = (s.unrest = s.unrest || {});
      un[iso] = (un[iso] || 0) + (0.06 * (1 - s.garrison[iso]) + 0.01) * calm * unrestMult(occupation(iso).score);
      if (un[iso] >= 1) { un[iso] = 0; startRevolt(c); }
    });
    if (!s.over) aiTurn();
    if (!s.over) checkAllies();
    // Lands held by AI countries: unhappy ones build resistance and in time throw the occupier out.
    const au = (s.aiUnrest = s.aiUnrest || {});
    C.forEach(c => {
      const iso = c.iso3, o = s.owner[iso];
      if (o === iso || o === s.player || s.enemies.some(e => e.to === iso)) { delete au[iso]; return; }
      const H = occupation(iso).score;
      au[iso] = H >= 60 ? 0 : (au[iso] || 0) + 0.008 * unrestMult(H);
      if (au[iso] >= 1) {
        delete au[iso]; s.owner[iso] = iso; s.garrison[iso] = 0.5; invalidateGroups();
        log(`🌍 ${c.name} threw off ${BY[o].name}'s occupation (its people's happiness under it: ${H}/100).`, "world");
      }
    });
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
      annex(iso, 1, "bought");
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
    save, replaceState, baseSource, moveUnits, moveQuote, fortMult, canCommand, tick, setPaused, fmtDur, clockLabel, etaLeft, SPEED, owns, empire, empireStrength, empireSoft, empireGdp, empireMissiles, missileStock, income, accessLvl, accessShare, accessible, accessQuote, techQuote, techShare, usable, bonus, techLvl, upgradeTech, industryCoins,
    forces, baseForces, rawPower, enemyPower, atWar, estimate, fuzzUnits, intelError, myIntel, fronts, heldShare, enemiesAt, homeDefence, isHostile, armyPower, defenceOf, armiesAt, arrived, sources, preview, dispatch, recall, disband, warProgress, loyalPower,
    inRevolt, liftMult, unitList, borderMult, empireEcon, countryEcon, econOf, fuel, warDaysOf, mobOf, supply, travelMult, isAlly, allies, allianceTerms, nightInfo, nightKind, nightCap, droneEdge, droneStock, droneSustain, weather, weatherKind, weatherMix, dateOf, airAW, navAW, happiness, occupation, partsInfo, partsFactor, projection, reachOf, reachWhy, loyalty, blocsOf, blocMembers, blocReport, blocReliability, alliedSupport, allyLoyalty, sideStrength, proposeAlliance, leaveAlliance, allyHelp, isr, endTurn, diplomacyOdds, influence, choose, newGame, resetAll, bordersEmpire, raiseAccess, redeem, buy, fmtCoins,
  });
})();
