// Military technology: how advanced a country's kit is on paper, and how well it is kept up.
//
//   gen    design generation, 1 (1960s-era kit) to 5 (stealth jets, latest tanks and networks)
//   ready  readiness 0–1: maintenance, spare parts, training and corruption. A country can field
//          modern designs that are badly maintained or never fully developed (Russia's Su-57s
//          and T-14s exist in tiny numbers; much of its fleet is old stock in storage).
//
// Combat quality = (0.35 + 0.13 × gen) × (0.4 + 0.6 × ready). Countries not listed get a
// generation and readiness estimated from GDP per capita.
window.TECH_PROFILE = {
  USA: [5.0, 0.9], CHN: [4.3, 0.78], RUS: [4.2, 0.55], IND: [3.7, 0.62], GBR: [4.7, 0.8], FRA: [4.6, 0.82],
  DEU: [4.4, 0.62], JPN: [4.6, 0.88], KOR: [4.6, 0.9], ISR: [4.8, 0.92], TUR: [4.0, 0.8], PAK: [3.3, 0.7],
  IRN: [2.8, 0.55], PRK: [2.0, 0.4], EGY: [3.5, 0.62], SAU: [4.3, 0.6], ARE: [4.4, 0.8], QAT: [4.4, 0.7],
  ITA: [4.3, 0.75], ESP: [4.2, 0.75], POL: [4.3, 0.8], UKR: [3.9, 0.85], TWN: [4.2, 0.72], SGP: [4.6, 0.92],
  AUS: [4.6, 0.85], CAN: [4.2, 0.7], NLD: [4.4, 0.8], NOR: [4.5, 0.85], SWE: [4.5, 0.85], FIN: [4.3, 0.9],
  DNK: [4.3, 0.8], BEL: [4.0, 0.6], GRC: [3.9, 0.72], BRA: [3.4, 0.65], IDN: [3.3, 0.6], VNM: [3.2, 0.65],
  THA: [3.5, 0.65], MYS: [3.5, 0.6], PHL: [3.0, 0.6], MEX: [3.0, 0.65], ARG: [2.8, 0.5], VEN: [3.0, 0.4],
  CUB: [2.0, 0.35], SYR: [2.2, 0.35], IRQ: [3.2, 0.5], DZA: [3.6, 0.65], MAR: [3.7, 0.7], NGA: [2.7, 0.5],
  ZAF: [3.5, 0.5], ETH: [2.8, 0.55], KAZ: [3.2, 0.6], BLR: [3.4, 0.6], AZE: [3.7, 0.75], ARM: [3.0, 0.65],
  CHL: [3.8, 0.75], COL: [3.4, 0.75], PER: [3.0, 0.6], MNG: [2.4, 0.6], BGD: [2.9, 0.65], ROU: [3.8, 0.7],
  HUN: [4.1, 0.75], CZE: [4.0, 0.75], CHE: [4.4, 0.85], AUT: [4.0, 0.7], PRT: [3.9, 0.7], NZL: [3.8, 0.75],
  LBY: [2.6, 0.35], SDN: [2.5, 0.4], ERI: [1.9, 0.4], AFG: [1.8, 0.35], MMR: [2.6, 0.5], YEM: [2.0, 0.35],
  JOR: [3.8, 0.75], KWT: [4.2, 0.7], OMN: [4.0, 0.75], BHR: [4.0, 0.7],
};

(function () {
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  window.COUNTRIES.forEach(c => {
    const pcK = c.gdp / Math.max(c.pop, 0.001), lg = Math.log10(1 + pcK), p = window.TECH_PROFILE[c.iso3];
    const gen = p ? p[0] : clamp(1.6 + 1.15 * lg, 1.6, 4.2);
    const ready = p ? p[1] : clamp(0.4 + 0.25 * lg, 0.4, 0.85);
    c.tech = { gen: Math.round(gen * 10) / 10, ready, estimated: !p, quality: (0.35 + 0.13 * gen) * (0.4 + 0.6 * ready) };
  });
  window.combatQuality = c => c.tech.quality;
  // Tier for icons and labels. Research in a nation's weapons systems lifts its effective generation.
  window.techTier = gen => (gen >= 4.4 ? "advanced" : gen >= 3.2 ? "standard" : "dated");
  window.readyLabel = r => (r >= 0.85 ? "excellent" : r >= 0.7 ? "good" : r >= 0.55 ? "patchy" : "poorly maintained");
})();

// ── Military profile: the human side of each armed force, each 0–10 ─────────
//   patriotism  will to fight for the homeland (counts most when defending)
//   training    quality and realism of training
//   experience  recent combat experience
//   logistics   ability to supply forces far from home
//   leadership  officer corps, doctrine and initiative
//   corruption  graft and theft that hollow out units (higher is worse)
// Countries not listed are estimated from wealth and recent conflicts.
window.MIL_PROFILE = {
  //     patriotism, training, experience, logistics, leadership, corruption
  USA: [7, 9, 8, 10, 8, 2], RUS: [6, 5, 8, 6, 4, 8], CHN: [8, 7, 2, 7, 6, 6], UKR: [10, 7, 10, 5, 7, 6],
  ISR: [10, 9, 9, 7, 8, 3], IND: [8, 6, 5, 6, 6, 6], PAK: [8, 6, 6, 5, 6, 7], GBR: [6, 9, 7, 8, 8, 2],
  FRA: [6, 8, 8, 8, 8, 2], DEU: [4, 7, 3, 6, 6, 2], TUR: [8, 7, 7, 6, 6, 5], IRN: [7, 5, 6, 4, 5, 7],
  PRK: [9, 4, 1, 3, 3, 8], KOR: [7, 8, 2, 7, 7, 3], JPN: [5, 8, 1, 7, 7, 2], TWN: [7, 6, 1, 5, 5, 3],
  POL: [8, 7, 3, 6, 6, 3], FIN: [9, 8, 2, 6, 7, 1], SWE: [6, 8, 2, 6, 7, 1], NOR: [7, 8, 3, 6, 7, 1],
  SAU: [6, 5, 5, 6, 4, 6], ARE: [6, 7, 6, 7, 6, 4], EGY: [7, 5, 4, 5, 4, 7], VNM: [9, 6, 3, 5, 6, 6],
  ITA: [5, 7, 4, 6, 6, 4], ESP: [5, 7, 4, 6, 6, 3], GRC: [8, 6, 2, 5, 5, 5], CAN: [6, 8, 5, 7, 7, 2],
  AUS: [7, 8, 6, 7, 7, 2], NLD: [5, 8, 4, 6, 7, 2], BRA: [6, 6, 3, 5, 5, 6], MEX: [6, 5, 6, 5, 5, 7],
  IDN: [8, 6, 3, 5, 5, 6], THA: [7, 6, 3, 5, 5, 6], PHL: [8, 5, 6, 4, 5, 6], SGP: [7, 9, 1, 7, 8, 1],
  AFG: [8, 4, 9, 2, 5, 8], SYR: [4, 3, 8, 2, 3, 9], IRQ: [5, 5, 8, 4, 4, 8], YEM: [7, 3, 9, 2, 4, 8],
  ETH: [8, 5, 8, 4, 5, 7], ERI: [9, 5, 6, 3, 5, 6], NGA: [6, 5, 7, 4, 4, 8], DZA: [8, 6, 4, 5, 5, 6],
  MAR: [8, 7, 5, 5, 6, 5], ZAF: [5, 5, 3, 5, 4, 7], KAZ: [6, 5, 2, 5, 5, 7], MNG: [8, 5, 2, 4, 5, 6],
  BGD: [8, 6, 3, 4, 5, 7], ARG: [8, 5, 2, 4, 5, 6], CHL: [7, 7, 2, 5, 6, 3], COL: [7, 7, 8, 5, 6, 5],
  VEN: [5, 3, 2, 3, 3, 9], CUB: [8, 5, 2, 3, 5, 6], AZE: [9, 7, 8, 5, 6, 6], ARM: [9, 6, 7, 4, 5, 6],
  GEO: [9, 6, 5, 4, 5, 4], BLR: [5, 5, 2, 5, 4, 7], LBY: [5, 3, 8, 2, 3, 9], SDN: [5, 4, 9, 2, 3, 9],
  MMR: [4, 4, 8, 3, 3, 9], SOM: [6, 3, 9, 2, 3, 9], NPL: [8, 7, 4, 3, 6, 5], LKA: [7, 6, 5, 4, 5, 6],
  CHE: [8, 7, 1, 5, 7, 1], PRT: [6, 7, 3, 5, 6, 3], ROU: [6, 6, 3, 5, 5, 5], HUN: [6, 6, 2, 5, 5, 5],
  NZL: [6, 8, 4, 5, 7, 1], JOR: [8, 8, 5, 5, 7, 4], OMN: [7, 7, 3, 5, 6, 4], QAT: [6, 6, 2, 5, 5, 3],
  KWT: [6, 5, 2, 5, 5, 5], DNK: [6, 8, 6, 6, 7, 1], EST: [9, 7, 3, 4, 6, 1], LVA: [8, 6, 3, 4, 5, 2],
  LTU: [9, 7, 3, 4, 6, 2], RWA: [8, 8, 7, 4, 7, 3], UGA: [6, 6, 7, 4, 5, 7], KEN: [6, 6, 6, 4, 5, 7],
  MLI: [6, 4, 8, 2, 3, 8], BFA: [7, 4, 8, 2, 3, 7], NER: [6, 4, 7, 2, 3, 7], TCD: [6, 5, 8, 3, 4, 8],
  COD: [4, 3, 8, 2, 2, 9], SSD: [5, 3, 8, 2, 2, 9], CAF: [4, 2, 7, 1, 2, 9],
};
window.MIL_STATS = [
  ["patriotism", "Patriotism"], ["training", "Training"], ["experience", "Combat experience"],
  ["logistics", "Logistics"], ["leadership", "Leadership"], ["corruption", "Corruption"],
];
(function () {
  const clamp = (x, a, b) => Math.round(Math.max(a, Math.min(b, x)));
  const WARS = new Set(["SDN", "SSD", "MLI", "BFA", "NER", "NGA", "SOM", "ETH", "COD", "MMR", "YEM", "COL", "IRQ", "AFG", "SYR", "LBY", "CAF", "MOZ", "CMR", "TCD", "AZE", "ARM", "UKR", "ISR"]);
  window.COUNTRIES.forEach(c => {
    const lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001)), p = window.MIL_PROFILE[c.iso3];
    const v = p || [
      clamp(6 + (c.soft < 25 ? 0 : 1), 3, 9), clamp(2 + 2.4 * lg, 2, 8), WARS.has(c.iso3) ? 7 : clamp(1 + lg, 1, 3),
      clamp(1.5 + 2.5 * lg, 1, 8), clamp(2.5 + 2 * lg, 2, 7), clamp(8.5 - 3 * lg, 1, 9),
    ];
    const m = (c.milStats = { estimated: !p });
    window.MIL_STATS.forEach(([k], i) => (m[k] = v[i]));
    // Combat multipliers. Training, experience and leadership sharpen every unit; corruption
    // hollows them out; patriotism stiffens defence; logistics decides how well armies fight
    // far from home.
    m.skill = (0.8 + 0.0133 * (m.training + m.experience + m.leadership)) * (1 - 0.02 * m.corruption);
    m.defend = 0.8 + 0.04 * m.patriotism;
    m.near = 0.9 + 0.01 * m.logistics;
    m.far = 0.7 + 0.03 * m.logistics;
  });
})();
