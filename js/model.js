// Derived analytics: military power index, hidden-asset estimates, soft power tiers, ranks.
(function () {
  const C = window.COUNTRIES;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const max = k => Math.max(...C.map(c => c[k]));

  // Weighted, square-root scaled share of the global maximum for each capability.
  const WEIGHTS = {
    mil: 0.20, fighters: 0.10, active: 0.08, tanks: 0.07, aircraft: 0.07, carriers: 0.07, gdp: 0.07,
    arty: 0.06, subs: 0.06, afv: 0.05, ships: 0.05, pop: 0.05, helis: 0.04, reserve: 0.03, soft: 0.05,
  };
  const MAX = {};
  Object.keys(WEIGHTS).concat(["nukes"]).forEach(k => (MAX[k] = max(k)));

  // Equipment quality proxy: richer economies field newer, better-maintained kit.
  const quality = c => {
    const gdpPcK = c.gdp / Math.max(c.pop, 0.001);
    return clamp(0.6 + 0.4 * Math.log10(1 + gdpPcK) / Math.log10(81), 0.6, 1);
  };

  // `disabled` (optional Set) zeroes capabilities, e.g. weapons a player has not unlocked yet.
  function rawPower(c, budget, disabled) {
    let s = 0;
    const q = quality(c);
    for (const k in WEIGHTS) {
      if (disabled && disabled.has(k)) continue;
      const v = k === "mil" ? budget : c[k];
      const w = k === "mil" || k === "gdp" || k === "pop" || k === "soft" ? 1 : q;
      s += WEIGHTS[k] * w * Math.sqrt(Math.min(1, v / MAX[k]));
    }
    if (c.nukes > 0) s += 0.08 + 0.06 * Math.sqrt(c.nukes / MAX.nukes);
    return s;
  }

  // Fallback estimator for countries without a researched intel profile.
  function estimateIntel(c) {
    const gdpPcK = (c.gdp * 1000) / Math.max(c.pop, 0.001) / 1000;
    const intel = clamp(Math.round(1 + 1.6 * Math.log10(1 + c.mil * 10)), 1, 6);
    return {
      intel,
      cyber: clamp(Math.round(0.5 * intel + 1.2 * Math.log10(1 + gdpPcK)), 0, 6),
      latency: c.gdp > 100 ? 1 : 0,
      offbook: c.mil > 0 ? 10 : 0,
      gold: 0,
      swf: 0,
      proxies: c.active > 50 ? 1 : 0,
      note: "No major undeclared programmes identified in open sources; profile extrapolated from defence budget, economy and regional norms.",
      estimated: true,
    };
  }

  C.forEach(c => {
    c.gdpPerCap = (c.gdp * 1e9) / (c.pop * 1e6);
    c.secret = Object.assign({ estimated: false }, window.INTEL_OVERRIDES[c.iso3] || estimateIntel(c));
    const s = c.secret;
    s.trueBudget = c.mil * (1 + s.offbook / 100);
    c._raw = rawPower(c, c.mil);
    // Threshold / host states (latency 6-9) get a breakout premium; intel, cyber and proxies multiply force.
    const breakout = c.nukes === 0 && s.latency >= 6 ? 0.08 * (s.latency - 5) : 0;
    c._mult = 1 + 0.01 * s.intel + 0.01 * s.cyber + 0.01 * s.proxies + breakout;
    c._rawTrue = rawPower(c, s.trueBudget) * c._mult;
    // Secret Assets Index: intelligence, cyber, nuclear latency, deniable forces, hidden money.
    c._secretRaw =
      0.22 * s.intel / 10 + 0.20 * s.cyber / 10 + 0.20 * s.latency / 10 + 0.13 * s.proxies / 10 +
      0.10 * Math.min(1, Math.log10(1 + s.trueBudget - c.mil) / 2.5) +
      0.08 * Math.min(1, Math.log10(1 + s.gold) / 4) +
      0.07 * Math.min(1, Math.log10(1 + s.swf) / 3.3);
  });

  const top = k => Math.max(...C.map(c => c[k]));
  const tRaw = top("_raw"), tTrue = top("_rawTrue"), tSec = top("_secretRaw");
  C.forEach(c => {
    c.power = Math.round((c._raw / tRaw) * 1000) / 10;
    c.truePower = Math.round((c._rawTrue / tTrue) * 1000) / 10;
    c.hiddenUplift = c._raw > 0 ? Math.round((c._rawTrue / c._raw - 1) * 100) : 0;
    c.secretIndex = Math.round((c._secretRaw / tSec) * 1000) / 10;
  });

  function rank(key, out) {
    [...C].sort((a, b) => b[key] - a[key]).forEach((c, i) => (c[out] = i + 1));
  }
  rank("power", "powerRank");
  rank("truePower", "truePowerRank");
  rank("gdp", "gdpRank");
  rank("soft", "softRank");
  rank("secretIndex", "secretRank");

  // Estimated true strength with only some weapon categories usable (nukes always count).
  const WEAPON_KEYS = window.WEAPONS.map(w => w.key);
  window.truePowerWith = (c, unlocked) => {
    const disabled = new Set(WEAPON_KEYS.filter(k => !unlocked.includes(k)));
    return (rawPower(c, c.secret.trueBudget, disabled) * c._mult / tTrue) * 100;
  };

  // ── Valuation: value the world's assets, then give each country its share ──
  const WA = window.WORLD_ASSETS;
  const shareBy = weight => {
    const w = C.map(weight), tot = w.reduce((a, b) => a + b, 0);
    return C.map((c, i) => w[i] / tot);
  };
  const gdpPc10k = c => c.gdp / Math.max(c.pop, 0.001) / 10;
  const S = {
    human: shareBy(c => c.gdp),                                                       // labour income
    realEstate: shareBy(c => Math.pow(c.gdp, 0.85) * Math.pow(c.pop, 0.15)),          // land value scales with people too
    business: shareBy(c => c.gdp * clamp(Math.pow(gdpPc10k(c), 0.3), 0.4, 2.2)),     // deeper capital markets in rich economies
    infrastructure: shareBy(c => c.gdp),
    privateGold: shareBy(c => Math.sqrt(c.gdp * c.pop)),                              // household gold: India, China, Gulf
    cultural: shareBy(c => c.soft * Math.sqrt(c.gdp)),                                // brand capital follows soft power
  };
  C.forEach(c => (c.natural = window.NATURAL_RESOURCES[c.iso3] ?? Math.min(0.15, 0.0015 * c.pop + 0.0002 * c.gdp)));
  C.forEach((c, i) => {
    const q = quality(c);
    c.weapons = window.WEAPONS.map(w => {
      const count = w.key === "aircraft" ? Math.max(0, c.aircraft - c.fighters) : c[w.key];
      const valueBn = (count * w.unit * q) / 1000;
      return { ...w, count: c[w.key], valueBn, cost: c[w.key] > 0 ? Math.max(window.MIN_UNLOCK, Math.round(valueBn * window.COINS_PER_BN)) : 0 };
    });
    const v = (c.value = {
      human: WA.human * 1000 * S.human[i],
      realEstate: WA.realEstate * 1000 * S.realEstate[i],
      business: WA.business * 1000 * S.business[i],
      cultural: WA.cultural * 1000 * S.cultural[i],
      infrastructure: WA.infrastructure * 1000 * S.infrastructure[i],
      natural: c.natural * 1000,
      gold: c.secret.gold * window.GOLD_BN_PER_TONNE + WA.privateGold * 1000 * S.privateGold[i],
      hardware: c.weapons.reduce((a, w) => a + w.valueBn, 0),
      swf: c.secret.swf,
    });
    const VK = ["human", "realEstate", "business", "cultural", "infrastructure", "natural", "gold", "hardware"];
    const ov = window.VALUE_OVERRIDES && window.VALUE_OVERRIDES[c.iso3];
    if (ov) { for (const k of VK) if (k in ov) v[k] = ov[k]; c.valueNote = ov.note; }
    v.total = VK.reduce((a, k) => a + v[k], 0);
    if (ov && ov.total) { const f = ov.total / v.total; VK.forEach(k => (v[k] *= f)); v.total = ov.total; }
    c.nationalValue = v.total;
    c.valuePerCap = (v.total * 1e9) / (c.pop * 1e6);
  });
  rank("nationalValue", "valueRank");
  window.WORLD_VALUE = C.reduce((a, c) => a + c.nationalValue, 0);
  // Purchase price in coins (1 coin = $1): national value plus a premium for the top 50.
  C.forEach(c => {
    const tier = window.PRICE_PREMIUMS.find(t => c.valueRank <= t.upTo);
    c.pricePremium = tier ? tier.premium : 0;
    c.price = Math.round(c.nationalValue * 1e9 * (1 + c.pricePremium));
  });
  window.VALUE_PARTS = [
    ["human", "Human capital"], ["realEstate", "Real estate & land"], ["business", "Business equity"],
    ["cultural", "Cultural & brand"], ["infrastructure", "Infrastructure"], ["natural", "Natural resources"],
    ["gold", "Gold"], ["hardware", "Military hardware"],
  ];


  window.softTier = s =>
    s >= 70 ? "Cultural superpower" : s >= 55 ? "Major cultural power" : s >= 40 ? "Regional influencer" : s >= 25 ? "Emerging voice" : "Limited reach";

  window.BY_ISO = Object.fromEntries(C.map(c => [c.iso3, c]));
  window.BY_ID = Object.fromEntries(C.map(c => [c.id, c]));
  window.ALLIES_OF = {};
  for (const [bloc, members] of Object.entries(window.ALLIANCES)) {
    members.forEach(m => (window.ALLIES_OF[m] = (window.ALLIES_OF[m] || []).concat([{ bloc, members }])));
  }
  window.WORLD_GDP = C.reduce((s, c) => s + c.gdp, 0);
})();
