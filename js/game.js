// Campaign engine: unlock rules, conquest, diplomacy, world reaction. State persists in localStorage.
(function () {
  const STORE = "ww3-campaign-v3";
  const C = window.COUNTRIES, BY = window.BY_ISO;

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

  function fresh(seed) {
    seed = seed ?? Math.floor(Math.random() * 2 ** 31);
    const owner = {}, garrison = {};
    C.forEach(c => { owner[c.iso3] = c.iso3; garrison[c.iso3] = 1; });
    return {
      seed, unlocked: rollUnlocked(seed), player: null, owner, garrison, turn: 1, log: [], over: false,
      coins: window.START_COINS, arsenal: {}, redeemed: [], purchased: [],
    };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.owner && Object.keys(s.owner).length === C.length) return s;
    } catch (e) { /* storage unavailable */ }
    return fresh();
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(G.state)); } catch (e) { /* ignore */ } }

  // ── Strength helpers ─────────────────────────────────────────
  const empire = () => C.filter(c => G.state.owner[c.iso3] === G.state.player);
  const owns = iso => G.state.player && G.state.owner[iso] === G.state.player;

  // Weapon categories the player has bought for one of their nations.
  const arsenal = iso => G.state.arsenal[iso] || [];
  const usableStrength = c => window.truePowerWith(c, arsenal(c.iso3));

  function empireStrength() {
    // Home nation at full weight; occupied lands contribute 60% of their (remaining) strength.
    // Only unlocked weapon categories count.
    return empire().reduce((s, c) => s + usableStrength(c) * G.state.garrison[c.iso3] * (c.iso3 === G.state.player ? 1 : 0.6), 0);
  }
  const income = () => Math.round(20 + empireGdp() * 0.02);
  const loot = t => Math.round(25 + t.gdp * 0.05);
  function empireSoft() {
    const e = empire();
    return Math.max(...e.map(c => c.soft)) + 3 * Math.log2(e.length);
  }
  const empireGdp = () => empire().reduce((s, c) => s + c.gdp, 0);
  const empireNukes = () => empire().reduce((s, c) => s + c.nukes, 0);

  // Ability to strike non-bordering targets by sea/air (0.15 – 1).
  function projection() {
    const e = empire();
    const sum = k => e.reduce((s, c) => s + (arsenal(c.iso3).includes(k) ? c[k] : 0) * G.state.garrison[c.iso3], 0);
    const p = 0.35 * Math.sqrt(Math.min(1, sum("ships") / 440)) + 0.35 * Math.min(1, sum("carriers") / 11) +
      0.3 * Math.sqrt(Math.min(1, sum("aircraft") / 13000));
    return Math.max(0.15, Math.min(1, 0.15 + 1.6 * p));
  }

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

  function defenceOf(iso) {
    const c = BY[iso];
    const base = c.truePower * G.state.garrison[iso] * 1.25 * (1 + c.soft / 400) + 0.3; // home advantage & morale
    const allies = alliedSupport(iso);
    return { base, allies, total: base + allies.strength };
  }

  function attackOdds(iso) {
    const adjacent = bordersEmpire(iso);
    const proj = adjacent ? 1 : projection();
    const A = empireStrength() * proj;
    const D = defenceOf(iso);
    const p = Math.pow(A, 1.5) / (Math.pow(A, 1.5) + Math.pow(D.total, 1.5));
    return { A, D, p, adjacent, proj };
  }

  function diplomacyOdds(iso) {
    const t = BY[iso];
    if (t.nukes > 0) return { p: 0, why: "Nuclear powers cannot be absorbed diplomatically." };
    const S = empireSoft(), Gp = empireGdp(), A = empireStrength();
    const D = defenceOf(iso).total;
    let p = 0.75 * (S / (S + t.soft)) * (Gp / (Gp + t.gdp)) * (A / (A + D));
    if (!bordersEmpire(iso)) p *= 0.6;
    if ((window.ALLIES_OF[iso] || []).length) p *= 0.5;
    return { p: Math.min(0.9, p) };
  }

  // ── Actions ─────────────────────────────────────────────────
  function log(msg, kind) { G.state.log.unshift({ t: G.state.turn, msg, kind: kind || "info" }); G.state.log.length = Math.min(G.state.log.length, 80); }

  function canAct(iso) {
    const s = G.state;
    if (!s.player || s.over) return "Choose a nation to play first.";
    if (owns(iso)) return "Already part of your empire.";
    return null;
  }

  function attack(iso) {
    const err = canAct(iso); if (err) return err;
    const s = G.state, t = BY[iso];
    const o = attackOdds(iso);
    const won = Math.random() < o.p;
    const ratio = o.D.total / (o.A + o.D.total);
    if (won) {
      // Nuclear-armed defenders may escalate rather than lose.
      const myNukes = empireNukes();
      if (t.nukes > 0 && Math.random() < (myNukes > 0 ? 0.3 : 0.6)) {
        empire().forEach(c => (s.garrison[c.iso3] *= 0.5));
        s.garrison[iso] *= 0.7;
        log(`☢️ ${t.name} launched a nuclear strike to stop your invasion! Your forces were halved.`, "bad");
        return endTurn();
      }
      s.owner[iso] = s.player;
      s.garrison[iso] = 0.5;
      empire().forEach(c => { if (c.iso3 !== iso) s.garrison[c.iso3] *= 1 - 0.15 * ratio; });
      s.coins += loot(t);
      log(`⚔️ Conquered ${t.name} (${Math.round(o.p * 100)}% odds). +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins${t.nukes ? `, +${t.nukes} warheads` : ""}. Its weapons must be unlocked before use.`, "good");
    } else {
      empire().forEach(c => (s.garrison[c.iso3] *= 1 - 0.3 * ratio));
      s.garrison[iso] *= 1 - 0.2 * (1 - ratio);
      log(`🛡️ Invasion of ${t.name} failed (${Math.round(o.p * 100)}% odds)${o.D.allies.blocs.length ? ` — ${o.D.allies.blocs.join(", ")} allies intervened` : ""}.`, "bad");
    }
    return endTurn();
  }

  function influence(iso) {
    const err = canAct(iso); if (err) return err;
    const s = G.state, t = BY[iso];
    const d = diplomacyOdds(iso);
    if (d.p <= 0) return d.why;
    if (Math.random() < d.p) {
      s.owner[iso] = s.player;
      s.garrison[iso] = 0.9;
      s.coins += loot(t);
      log(`🤝 ${t.name} joined your union peacefully (${Math.round(d.p * 100)}% odds). +$${fmt(t.gdp)}bn GDP, +${loot(t)} coins.`, "good");
    } else {
      log(`📜 ${t.name} rejected your diplomatic overtures (${Math.round(d.p * 100)}% odds).`, "info");
    }
    return endTurn();
  }

  function endTurn() {
    const s = G.state;
    // Recovery: home 8%/turn up to 100%, occupied 5%/turn up to 85%.
    C.forEach(c => {
      const cap = owns(c.iso3) && c.iso3 !== s.player ? 0.85 : 1;
      s.garrison[c.iso3] = Math.min(cap, s.garrison[c.iso3] + (cap === 1 ? 0.08 : 0.05));
    });
    // Occupied territories may revolt when weakly held.
    empire().forEach(c => {
      if (c.iso3 === s.player || (s.purchased || []).includes(c.iso3)) return; // bought nations don't revolt
      if (Math.random() < 0.06 * (1 - s.garrison[c.iso3]) + 0.01) {
        s.owner[c.iso3] = c.iso3; s.garrison[c.iso3] = 0.6;
        log(`🔥 ${c.name} revolted and regained independence.`, "bad");
      }
    });
    s.turn++;
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
      s.owner[iso] = s.player;
      s.garrison[iso] = 1;
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

  function newGame(keepRoster) {
    G.state = fresh(keepRoster ? G.state.seed : undefined);
    save();
  }

  const fmtCoins = n => n >= 1e15 ? (n / 1e15).toFixed(2) + " quadrillion" : n >= 1e12 ? (n / 1e12).toFixed(2) + "trn" : n >= 1e9 ? (n / 1e9).toFixed(2) + "bn" : n >= 1e6 ? (n / 1e6).toFixed(2) + "m" : Math.round(n).toLocaleString("en-US");
  const fmt = n => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n >= 10 ? Math.round(n) : n.toFixed(1));

  const G = (window.GAME = {
    state: load(),
    isLocked: iso => !G.state.unlocked.includes(iso),
    owns, empire, empireStrength, empireSoft, empireGdp, empireNukes, projection, income, arsenal,
    attackOdds, diplomacyOdds, attack, influence, choose, newGame, bordersEmpire, unlockWeapon, redeem, buy, fmtCoins,
  });
})();
