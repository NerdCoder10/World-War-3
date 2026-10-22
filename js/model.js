// Derived analytics: military power index, hidden-asset estimates, soft power tiers, ranks.
(function () {
  const C = window.COUNTRIES;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const max = k => Math.max(...C.map(c => c[k]));

  // Weighted, square-root scaled share of the global maximum for each capability.
  const WEIGHTS = {
    mil: 0.20, fighters: 0.10, active: 0.08, tanks: 0.07, aircraft: 0.07, carriers: 0.07, gdp: 0.07,
    arty: 0.06, subs: 0.06, afv: 0.05, ships: 0.05, pop: 0.05, helis: 0.04, reserve: 0.03,
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
      const w = k === "mil" || k === "gdp" || k === "pop" ? 1 : q;
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

  // ── Valuation: value of the world, then each country's share ──
  const WM = window.WEALTH_MODEL;
  const worldGdp = C.reduce((a, c) => a + c.gdp, 0);
  const worldValue = worldGdp * WM.multipleOfGdp; // US$ bn
  C.forEach(c => (c.natural = window.NATURAL_RESOURCES[c.iso3] ?? Math.min(0.15, 0.0015 * c.pop + 0.0002 * c.gdp)));
  const worldNatural = C.reduce((a, c) => a + c.natural, 0);
  const goldPerTonne = 0.122; // US$ bn per tonne (~$3,800/oz)
  C.forEach(c => {
    const gdpShare = c.gdp / worldGdp;
    c.value = {
      human: worldValue * WM.human * gdpShare,
      produced: worldValue * WM.produced * gdpShare,
      natural: worldValue * WM.natural * (c.natural / worldNatural),
      gold: c.secret.gold * goldPerTonne,
      swf: c.secret.swf,
    };
    c.value.total = c.value.human + c.value.produced + c.value.natural;
    c.nationalValue = c.value.total;
    c.valuePerCap = (c.value.total * 1e9) / (c.pop * 1e6);
    // Military hardware replacement value and coin price of each weapon category.
    const q = quality(c);
    c.weapons = window.WEAPONS.map(w => {
      const count = w.key === "aircraft" ? Math.max(0, c.aircraft - c.fighters) : c[w.key];
      const valueBn = (count * w.unit * q) / 1000;
      return { ...w, count: c[w.key], valueBn, cost: c[w.key] > 0 ? Math.max(window.MIN_UNLOCK, Math.round(valueBn * window.COINS_PER_BN)) : 0 };
    });
    c.value.hardware = c.weapons.reduce((a, w) => a + w.valueBn, 0);
  });
  rank("nationalValue", "valueRank");
  window.WORLD_VALUE = worldValue;

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
