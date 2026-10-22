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
