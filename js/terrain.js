// Terrain: what an invader has to fight through, country by country.
//
// Each country is rated 0–10 on five features: mountains, forest or jungle, desert, cold
// (arctic winters and permafrost) and dense cities. Values are judgement from physical geography
// (relief, forest cover, arid share, climate and urbanisation), not survey data. Countries not
// listed get their region's typical mix.
//
// Effects (used by js/game.js):
//   defence      the defender fights at 1 + 0.25 m + 0.15 f + 0.1 c + 0.1 u (up to ×1.5):
//                Switzerland ×1.36, Taiwan ×1.35, Afghanistan ×1.28, Vietnam ×1.26, Saudi Arabia ×1.07.
//   unit kinds   an invader's units fight differently there. Tanks lose up to a quarter in
//                mountains and a fifth in jungle and do a little better in open desert; jungle canopy
//                and mountains hide targets from aircraft; helicopters lose lift in thin air. Tanks
//                invading Taiwan fight ×0.62, Afghanistan ×0.79, Saudi Arabia ×1.02. See terrainKind.
//   supply       harsh terrain (the worst of mountains, jungle, desert or cold) makes supply lines
//                longer and weaker (js/game.js supply).
window.TERRAIN = {
  // mountains, forest/jungle, desert, cold, cities
  USA: [4, 4, 3, 2, 3], CAN: [4, 6, 0, 8, 1], MEX: [6, 3, 4, 0, 3], RUS: [3, 6, 1, 8, 2], CHN: [6, 3, 4, 2, 4], IND: [3, 3, 2, 0, 5],
  PAK: [6, 1, 5, 1, 4], AFG: [9, 1, 4, 3, 1], IRN: [7, 1, 5, 1, 3], IRQ: [3, 0, 6, 0, 3], SYR: [3, 0, 5, 0, 3], TUR: [6, 3, 1, 2, 4],
  SAU: [2, 0, 9, 0, 2], YEM: [6, 0, 6, 0, 2], ARE: [1, 0, 8, 0, 6], OMN: [4, 0, 8, 0, 2], QAT: [0, 0, 8, 0, 7], KWT: [0, 0, 8, 0, 7],
  BHR: [0, 0, 6, 0, 9], JOR: [3, 0, 7, 0, 4], ISR: [3, 1, 4, 0, 7], PSE: [2, 0, 2, 0, 9], LBN: [7, 2, 0, 0, 6], EGY: [1, 0, 9, 0, 4],
  LBY: [1, 0, 9, 0, 2], TUN: [3, 1, 6, 0, 3], DZA: [3, 1, 8, 0, 2], MAR: [6, 2, 5, 0, 3],
  GBR: [2, 2, 0, 1, 6], FRA: [3, 3, 0, 1, 4], DEU: [2, 3, 0, 1, 6], ITA: [6, 3, 0, 1, 5], ESP: [5, 2, 2, 0, 4], PRT: [3, 3, 1, 0, 4],
  NLD: [0, 1, 0, 1, 9], BEL: [1, 2, 0, 1, 8], LUX: [2, 4, 0, 1, 4], CHE: [9, 3, 0, 4, 5], AUT: [8, 4, 0, 3, 4], POL: [1, 3, 0, 3, 4],
  CZE: [3, 3, 0, 2, 4], SVK: [5, 4, 0, 2, 3], HUN: [1, 2, 0, 2, 3], ROU: [4, 4, 0, 3, 3], BGR: [5, 3, 0, 2, 3], GRC: [7, 2, 0, 1, 4],
  SRB: [4, 3, 0, 2, 3], HRV: [5, 4, 0, 1, 3], BIH: [8, 6, 0, 2, 2], SVN: [7, 6, 0, 2, 3], MNE: [9, 4, 0, 2, 2], ALB: [8, 3, 0, 1, 3],
  MKD: [7, 3, 0, 2, 3], NOR: [8, 4, 0, 7, 2], SWE: [3, 7, 0, 6, 2], FIN: [1, 8, 0, 8, 2], DNK: [0, 1, 0, 2, 5], ISL: [6, 0, 0, 8, 2],
  IRL: [2, 1, 0, 1, 3], EST: [0, 6, 0, 5, 2], LVA: [0, 6, 0, 5, 2], LTU: [0, 4, 0, 4, 3], BLR: [0, 5, 0, 5, 2], UKR: [1, 3, 0, 4, 3],
  MDA: [1, 2, 0, 3, 3], CYP: [5, 1, 1, 0, 4], MLT: [0, 0, 0, 0, 9], AND: [10, 3, 0, 5, 3], MCO: [3, 0, 0, 0, 10], SMR: [6, 2, 0, 1, 6],
  LIE: [9, 4, 0, 4, 3], VAT: [0, 0, 0, 0, 10],
  GEO: [8, 4, 0, 3, 2], ARM: [9, 1, 1, 4, 3], AZE: [6, 2, 2, 1, 3], KAZ: [2, 1, 6, 7, 1], UZB: [3, 0, 7, 3, 3], TKM: [2, 0, 9, 2, 2],
  KGZ: [9, 1, 1, 6, 1], TJK: [9, 1, 1, 6, 1], MNG: [5, 2, 6, 9, 1],
  PRK: [8, 5, 0, 5, 2], KOR: [7, 4, 0, 3, 7], JPN: [7, 6, 0, 3, 8], TWN: [8, 5, 0, 0, 8], VNM: [5, 7, 0, 0, 3], LAO: [8, 8, 0, 0, 1],
  KHM: [2, 6, 0, 0, 2], THA: [4, 5, 0, 0, 3], MMR: [7, 7, 0, 0, 2], MYS: [3, 8, 0, 0, 4], SGP: [0, 1, 0, 0, 10], IDN: [5, 8, 0, 0, 3],
  PHL: [6, 6, 0, 0, 4], BRN: [1, 8, 0, 0, 3], TLS: [7, 6, 0, 0, 1], BGD: [1, 3, 0, 0, 8], NPL: [10, 5, 0, 6, 2], BTN: [10, 7, 0, 6, 1],
  LKA: [4, 6, 0, 0, 4], MDV: [0, 0, 0, 0, 6],
  AUS: [2, 2, 7, 0, 2], NZL: [7, 4, 0, 3, 2], PNG: [8, 9, 0, 0, 1], FJI: [5, 6, 0, 0, 2], SLB: [6, 8, 0, 0, 1], VUT: [5, 7, 0, 0, 1],
  NGA: [2, 5, 3, 0, 4], ETH: [8, 2, 3, 1, 2], ERI: [6, 0, 5, 0, 1], SOM: [1, 1, 7, 0, 2], KEN: [4, 3, 4, 0, 2], TZA: [4, 5, 2, 0, 2],
  UGA: [3, 5, 0, 0, 2], RWA: [8, 4, 0, 0, 3], BDI: [7, 4, 0, 0, 2], COD: [3, 9, 0, 0, 1], COG: [2, 9, 0, 0, 2], CAF: [2, 7, 1, 0, 1],
  CMR: [4, 7, 1, 0, 2], GAB: [2, 9, 0, 0, 2], GNQ: [3, 8, 0, 0, 2], SSD: [1, 4, 1, 0, 1], SDN: [2, 1, 8, 0, 2], TCD: [2, 1, 8, 0, 1],
  NER: [2, 0, 9, 0, 1], MLI: [2, 1, 8, 0, 1], MRT: [1, 0, 9, 0, 1], BFA: [1, 3, 4, 0, 2], SEN: [0, 3, 4, 0, 3], GMB: [0, 3, 2, 0, 3],
  GIN: [4, 7, 0, 0, 2], GNB: [0, 6, 0, 0, 2], SLE: [3, 8, 0, 0, 2], LBR: [2, 8, 0, 0, 2], CIV: [2, 7, 0, 0, 3], GHA: [2, 6, 0, 0, 3],
  TGO: [3, 6, 0, 0, 2], BEN: [1, 5, 1, 0, 2], AGO: [4, 5, 3, 0, 2], ZMB: [2, 6, 1, 0, 1], ZWE: [3, 4, 2, 0, 2], MOZ: [3, 6, 1, 0, 1],
  MWI: [5, 5, 0, 0, 2], NAM: [3, 1, 8, 0, 1], BWA: [1, 3, 7, 0, 1], ZAF: [5, 2, 4, 1, 3], LSO: [10, 1, 0, 3, 1], SWZ: [7, 4, 0, 0, 2],
  MDG: [6, 6, 1, 0, 1], DJI: [3, 0, 8, 0, 4],
  GTM: [7, 7, 0, 0, 2], BLZ: [3, 8, 0, 0, 1], HND: [7, 7, 0, 0, 2], SLV: [6, 4, 0, 0, 4], NIC: [5, 7, 0, 0, 2], CRI: [7, 7, 0, 0, 3],
  PAN: [5, 8, 0, 0, 3], CUB: [3, 4, 0, 0, 4], HTI: [8, 2, 0, 0, 4], DOM: [6, 4, 0, 0, 4], JAM: [6, 6, 0, 0, 3], COL: [8, 8, 0, 0, 3],
  VEN: [6, 7, 1, 0, 3], ECU: [9, 7, 0, 1, 3], PER: [9, 6, 4, 2, 2], BOL: [9, 6, 2, 3, 2], CHL: [9, 3, 4, 3, 3], ARG: [5, 3, 4, 3, 3],
  BRA: [2, 8, 1, 0, 3], PRY: [1, 5, 2, 0, 2], URY: [1, 2, 0, 1, 3], GUY: [3, 9, 0, 0, 1], SUR: [2, 9, 0, 0, 1],
};
// Typical mixes for countries not listed (mostly small states and islands).
window.TERRAIN_REGION = { Africa: [2, 5, 3, 0, 2], Europe: [3, 3, 0, 2, 4], Asia: [5, 4, 2, 1, 3], "North America": [4, 5, 0, 0, 3], "South America": [5, 6, 1, 1, 3], Oceania: [3, 5, 0, 0, 2] };
(function () {
  const cache = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // A country's terrain as shares 0–1: { m, f, d, c, u }.
  window.terrainOf = iso => {
    if (cache[iso]) return cache[iso];
    const c = window.BY_ISO ? window.BY_ISO[iso] : window.COUNTRIES.find(x => x.iso3 === iso);
    const v = window.TERRAIN[iso] || window.TERRAIN_REGION[c && c.region] || [3, 3, 1, 1, 3];
    const t = { m: v[0] / 10, f: v[1] / 10, d: v[2] / 10, c: v[3] / 10, u: v[4] / 10, estimated: !window.TERRAIN[iso] };
    t.defence = clamp(1 + 0.25 * t.m + 0.15 * t.f + 0.1 * t.c + 0.1 * t.u, 1, 1.5);
    t.harsh = Math.max(t.m, t.f, t.d, t.c);
    return (cache[iso] = t);
  };
  // How well an invader's units of one kind fight in a country's terrain (×0.5 – ×1.15).
  const KIND = {
    tanks: t => 1 - 0.25 * t.m - 0.2 * t.f - 0.1 * t.u + 0.1 * t.d,
    afv: t => 1 - 0.2 * t.m - 0.15 * t.f - 0.08 * t.u + 0.05 * t.d,
    arty: t => 1 - 0.1 * t.m - 0.1 * t.f + 0.03 * t.d,
    fighters: t => 1 - 0.08 * t.m - 0.15 * t.f - 0.05 * t.u + 0.05 * t.d,
    aircraft: t => 1 - 0.08 * t.m - 0.15 * t.f - 0.05 * t.u + 0.05 * t.d,
    helis: t => 1 - 0.12 * t.m - 0.05 * t.f + 0.03 * t.d,
  };
  window.terrainKind = (iso, key) => (KIND[key] ? clamp(KIND[key](window.terrainOf(iso)), 0.5, 1.15) : 1);
  // A short description: the features that dominate.
  window.terrainLabel = iso => {
    const t = window.terrainOf(iso), parts = [];
    if (t.m >= 0.6) parts.push("mountainous"); else if (t.m >= 0.4) parts.push("hilly");
    if (t.f >= 0.7) parts.push("dense forest or jungle"); else if (t.f >= 0.5) parts.push("forested");
    if (t.d >= 0.6) parts.push("desert"); else if (t.d >= 0.4) parts.push("arid");
    if (t.c >= 0.6) parts.push("harsh winters");
    if (t.u >= 0.7) parts.push("densely built-up");
    return parts.length ? parts.join(", ") : "open, mixed country";
  };
})();
