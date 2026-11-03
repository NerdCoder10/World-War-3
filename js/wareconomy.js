// War economy: what each country could build if war production were the priority and every
// country stopped trading with every other.
//
// Per country (rough 2023–25 figures and judgement, not survey data):
//   mfg       share of world manufacturing value added, % (UN/World Bank): China ~29, US ~16...
//   energy    self-sufficiency in energy: domestic production ÷ consumption (oil, gas, coal,
//             nuclear, hydro). Japan imports ~88% (0.12), Saudi Arabia exports most of its output.
//   steel     self-sufficiency in steel and heavy metals.
//   chips     ability to make military-grade electronics and chips at home, 0–1 (Taiwan 1).
//   minerals  self-supply of critical minerals (rare earths, cobalt, titanium, tungsten...), 0–1.
//   food      calorie self-sufficiency.
//   make      which weapons its defence industry can build, 0–1 for land (tanks, armoured
//             vehicles, artillery), fighters, aircraft (transports and drones), helis, ships,
//             subs, carriers and missiles. Missing categories can't be built at all, and with
//             trade cut off they can't be bought either.
// Countries not listed: manufacturing from their share of world GDP, resources from their
// natural-resource endowment (js/economy.js), little or no arms industry.
window.WAR_ECON = {
  //    mfg, energy, steel, chips, minerals, food, make: [land, fighters, aircraft, helis, ships, subs, carriers, missiles]
  USA: [16, 1.05, 0.8, 0.85, 0.45, 1.3, [0.9, 1, 1, 1, 0.8, 0.9, 1, 1]],
  CHN: [29, 0.8, 1.1, 0.7, 0.95, 0.95, [1, 0.9, 0.9, 0.8, 1, 0.9, 0.9, 1]],
  RUS: [1.8, 1.9, 1.5, 0.3, 0.75, 1.3, [1, 0.7, 0.6, 0.7, 0.5, 0.7, 0.1, 0.9]],
  JPN: [6.5, 0.12, 1.3, 0.85, 0.1, 0.38, [0.6, 0.5, 0.5, 0.5, 0.9, 0.8, 0.4, 0.6]],
  DEU: [5.3, 0.3, 0.9, 0.55, 0.15, 0.9, [0.9, 0.5, 0.4, 0.6, 0.5, 0.7, 0, 0.6]],
  IND: [3, 0.6, 1.05, 0.35, 0.45, 1.05, [0.6, 0.35, 0.3, 0.5, 0.5, 0.4, 0.3, 0.6]],
  KOR: [3, 0.18, 1.2, 0.95, 0.1, 0.45, [0.9, 0.5, 0.4, 0.5, 1, 0.7, 0.3, 0.8]],
  ITA: [2.1, 0.22, 0.9, 0.4, 0.15, 0.75, [0.5, 0.5, 0.5, 0.8, 0.6, 0.4, 0.3, 0.4]],
  FRA: [1.8, 0.5, 0.8, 0.5, 0.2, 1.25, [0.6, 0.7, 0.5, 0.7, 0.6, 0.7, 0.4, 0.7]],
  GBR: [1.8, 0.65, 0.5, 0.5, 0.15, 0.65, [0.4, 0.5, 0.3, 0.5, 0.6, 0.6, 0.5, 0.5]],
  MEX: [1.6, 0.85, 0.8, 0.25, 0.35, 0.8, [0.1, 0, 0, 0, 0.1, 0, 0, 0]],
  TWN: [1.8, 0.1, 1.0, 1, 0.05, 0.33, [0.4, 0.3, 0.3, 0, 0.5, 0.3, 0, 0.7]],
  IDN: [1.4, 1.8, 0.6, 0.15, 0.5, 0.9, [0.2, 0, 0.2, 0.1, 0.3, 0.1, 0, 0.1]],
  BRA: [1.2, 1.0, 1.3, 0.25, 0.6, 1.3, [0.4, 0.3, 0.6, 0.4, 0.4, 0.4, 0, 0.2]],
  TUR: [1.3, 0.3, 1.1, 0.3, 0.3, 1.0, [0.7, 0.2, 0.7, 0.5, 0.6, 0.4, 0.2, 0.6]],
  CAN: [1.2, 1.8, 0.9, 0.4, 0.6, 1.3, [0.5, 0, 0.3, 0.3, 0.3, 0, 0, 0.1]],
  ESP: [1.1, 0.3, 0.8, 0.35, 0.15, 0.9, [0.4, 0.4, 0.6, 0.3, 0.6, 0.5, 0.3, 0.2]],
  CHE: [0.9, 0.5, 0.5, 0.45, 0.1, 0.55, [0.5, 0, 0.3, 0, 0, 0, 0, 0.2]],
  IRL: [1.0, 0.25, 0.2, 0.4, 0.1, 1.1, [0, 0, 0, 0, 0, 0, 0, 0]],
  THA: [0.8, 0.5, 0.4, 0.3, 0.2, 1.3, [0.1, 0, 0, 0, 0.1, 0, 0, 0]],
  POL: [0.8, 0.55, 0.6, 0.3, 0.2, 1.1, [0.6, 0, 0.2, 0.4, 0.3, 0, 0, 0.3]],
  SAU: [0.8, 2.5, 0.7, 0.1, 0.2, 0.2, [0.2, 0, 0.1, 0, 0.1, 0, 0, 0.2]],
  NLD: [0.7, 0.5, 0.7, 0.6, 0.1, 1.0, [0.2, 0, 0, 0, 0.6, 0.2, 0, 0.1]],
  MYS: [0.6, 1.2, 0.4, 0.45, 0.3, 0.6, [0, 0, 0, 0, 0.1, 0, 0, 0]],
  VNM: [0.6, 0.75, 0.6, 0.3, 0.4, 1.1, [0.2, 0, 0, 0, 0.2, 0, 0, 0.2]],
  IRN: [0.6, 1.3, 1.2, 0.15, 0.35, 0.75, [0.5, 0.1, 0.6, 0.2, 0.3, 0.2, 0, 0.9]],
  AUS: [0.5, 2.5, 0.6, 0.3, 0.8, 1.3, [0.3, 0, 0.1, 0, 0.4, 0.3, 0, 0.3]],
  SGP: [0.5, 0.02, 0.2, 0.6, 0.05, 0.05, [0.4, 0, 0, 0, 0.4, 0, 0, 0]],
  ARG: [0.5, 1.0, 0.7, 0.15, 0.4, 1.3, [0.2, 0, 0.2, 0, 0.1, 0, 0, 0]],
  BGD: [0.5, 0.6, 0.3, 0.05, 0.1, 0.9, [0, 0, 0, 0, 0.1, 0, 0, 0]],
  SWE: [0.4, 0.7, 0.9, 0.45, 0.3, 0.8, [0.5, 0.6, 0.3, 0.1, 0.4, 0.6, 0, 0.5]],
  AUT: [0.4, 0.4, 0.9, 0.4, 0.1, 0.9, [0.4, 0, 0, 0, 0, 0, 0, 0]],
  BEL: [0.4, 0.25, 0.7, 0.35, 0.1, 0.8, [0.3, 0, 0, 0, 0, 0, 0, 0]],
  CZE: [0.4, 0.6, 0.8, 0.3, 0.1, 1.0, [0.5, 0, 0.4, 0, 0, 0, 0, 0]],
  PHL: [0.4, 0.5, 0.3, 0.25, 0.3, 0.8, [0, 0, 0, 0, 0, 0, 0, 0]],
  ISR: [0.3, 0.6, 0.3, 0.6, 0.1, 0.5, [0.7, 0.1, 0.7, 0.1, 0.3, 0, 0, 0.9]],
  EGY: [0.4, 0.95, 0.8, 0.1, 0.2, 0.5, [0.4, 0, 0.1, 0, 0.2, 0, 0, 0.2]],
  PAK: [0.3, 0.6, 0.5, 0.15, 0.2, 0.95, [0.4, 0.3, 0.2, 0.1, 0.3, 0.2, 0, 0.6]],
  ARE: [0.3, 2.0, 0.6, 0.15, 0.1, 0.1, [0.3, 0, 0.2, 0, 0.2, 0, 0, 0.3]],
  NGA: [0.4, 2.5, 0.2, 0.05, 0.3, 0.85, [0, 0, 0, 0, 0, 0, 0, 0]],
  ZAF: [0.3, 0.85, 1.0, 0.15, 0.7, 1.0, [0.5, 0, 0.2, 0.3, 0.1, 0, 0, 0.3]],
  UKR: [0.2, 0.65, 1.2, 0.25, 0.4, 1.3, [0.5, 0, 0.7, 0.1, 0.1, 0, 0, 0.6]],
  DZA: [0.15, 2.5, 0.5, 0.05, 0.3, 0.4, [0.1, 0, 0, 0, 0, 0, 0, 0]],
  ROU: [0.25, 0.75, 0.8, 0.15, 0.2, 1.1, [0.3, 0, 0, 0.1, 0.2, 0, 0, 0]],
  HUN: [0.2, 0.4, 0.6, 0.2, 0.1, 1.2, [0.2, 0, 0, 0, 0, 0, 0, 0]],
  FIN: [0.2, 0.5, 1.0, 0.4, 0.3, 0.9, [0.4, 0, 0, 0, 0.4, 0, 0, 0.2]],
  NOR: [0.15, 8, 0.6, 0.35, 0.3, 0.5, [0.3, 0, 0, 0, 0.4, 0, 0, 0.6]],
  DNK: [0.2, 0.7, 0.3, 0.3, 0.1, 1.3, [0.1, 0, 0, 0, 0.3, 0, 0, 0]],
  GRC: [0.1, 0.3, 0.6, 0.1, 0.2, 0.8, [0.2, 0, 0, 0, 0.2, 0, 0, 0]],
  PRT: [0.15, 0.3, 0.5, 0.1, 0.2, 0.7, [0, 0, 0, 0, 0.1, 0, 0, 0]],
  CHL: [0.2, 0.4, 0.3, 0.1, 0.5, 0.9, [0.1, 0, 0, 0, 0.2, 0, 0, 0]],
  COL: [0.2, 1.9, 0.4, 0.05, 0.3, 0.8, [0.1, 0, 0, 0, 0.1, 0, 0, 0]],
  PER: [0.15, 0.8, 0.3, 0.05, 0.4, 0.8, [0, 0, 0, 0, 0, 0, 0, 0]],
  VEN: [0.1, 2.5, 0.4, 0.05, 0.3, 0.6, [0, 0, 0, 0, 0, 0, 0, 0]],
  KAZ: [0.15, 2.5, 1.2, 0.05, 0.6, 1.2, [0.1, 0, 0, 0, 0, 0, 0, 0]],
  IRQ: [0.1, 3, 0.2, 0.05, 0.1, 0.4, [0, 0, 0, 0, 0, 0, 0, 0]],
  KWT: [0.05, 4, 0.2, 0.05, 0.05, 0.1, [0, 0, 0, 0, 0, 0, 0, 0]],
  QAT: [0.1, 4, 0.3, 0.05, 0.05, 0.1, [0, 0, 0, 0, 0, 0, 0, 0]],
  PRK: [0.25, 0.6, 0.6, 0.08, 0.4, 0.75, [0.5, 0, 0.1, 0, 0.3, 0.3, 0, 0.8]],
  BLR: [0.1, 0.15, 0.8, 0.15, 0.1, 1.1, [0.3, 0, 0, 0, 0, 0, 0, 0.1]],
  SRB: [0.07, 0.6, 0.6, 0.05, 0.2, 1.1, [0.4, 0, 0, 0, 0, 0, 0, 0.2]],
  BGR: [0.06, 0.6, 0.5, 0.05, 0.2, 1.1, [0.3, 0, 0, 0, 0, 0, 0, 0]],
  SVK: [0.1, 0.4, 1.0, 0.1, 0.1, 0.9, [0.3, 0, 0, 0, 0, 0, 0, 0]],
  AZE: [0.03, 4, 0.3, 0.05, 0.1, 0.8, [0.1, 0, 0, 0, 0, 0, 0, 0]],
  JOR: [0.04, 0.1, 0.2, 0.05, 0.1, 0.3, [0.2, 0, 0, 0, 0, 0, 0, 0]],
  LBY: [0.03, 3, 0.1, 0.02, 0.1, 0.3, [0, 0, 0, 0, 0, 0, 0, 0]],
  YEM: [0.01, 0.4, 0.05, 0.02, 0.05, 0.3, [0.1, 0, 0.3, 0, 0, 0, 0, 0.4]],
  OMN: [0.05, 2, 0.4, 0.05, 0.1, 0.3, [0, 0, 0, 0, 0, 0, 0, 0]],
  MNG: [0.01, 1.5, 0.1, 0.02, 0.5, 1.0, [0, 0, 0, 0, 0, 0, 0, 0]],
  COD: [0.02, 0.9, 0.05, 0.02, 0.6, 0.8, [0, 0, 0, 0, 0, 0, 0, 0]],
  TKM: [0.03, 4, 0.1, 0.02, 0.1, 0.8, [0, 0, 0, 0, 0, 0, 0, 0]],
};
window.WAR_MAKE_KEYS = ["land", "fighters", "aircraft", "helis", "ships", "subs", "carriers", "missiles"];
(function () {
  const C = window.COUNTRIES, BY = {};
  C.forEach(c => (BY[c.iso3] = c));
  const worldGdp = C.reduce((a, c) => a + c.gdp, 0);
  const WORLD_MFG = 16000; // $bn of world manufacturing value added a year
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // One country's war-economy profile (listed, or estimated).
  const cache = {};
  function profile(iso) {
    if (cache[iso]) return cache[iso];
    const c = BY[iso], v = window.WAR_ECON[iso];
    if (v) {
      const make = {}; window.WAR_MAKE_KEYS.forEach((k, i) => (make[k] = v[6][i]));
      return (cache[iso] = { mfg: v[0], energy: v[1], steel: v[2], chips: v[3], minerals: v[4], food: v[5], make, estimated: false });
    }
    const nr = (window.NATURAL_RESOURCES || {})[iso] || 0, rich = clamp(nr / 3, 0, 1);
    const make = {}; window.WAR_MAKE_KEYS.forEach(k => (make[k] = 0));
    return (cache[iso] = { mfg: (100 * c.gdp / worldGdp) * 0.7, energy: 0.3 + 1.2 * rich, steel: 0.15 + 0.4 * rich, chips: 0.03, minerals: 0.1 + 0.4 * rich, food: 0.85, make, estimated: true });
  }
  window.warProfile = profile;
  // Unit costs ($m) for production; troops are trained from the population instead.
  const COST = { tanks: 8, afv: 2, arty: 3, aircraft: 25, fighters: 80, helis: 20, ships: 400, subs: 1500, carriers: 10000, missiles: 2 };
  // Peacetime-to-war budget split; shares for categories a country can't build go to the ones it can.
  const SHARE = { tanks: 0.12, afv: 0.13, arty: 0.1, fighters: 0.18, aircraft: 0.06, helis: 0.06, ships: 0.12, subs: 0.09, carriers: 0.04, missiles: 0.1 };
  const MAKE_OF = { tanks: "land", afv: "land", arty: "land", fighters: "fighters", aircraft: "aircraft", helis: "helis", ships: "ships", subs: "subs", carriers: "carriers", missiles: "missiles" };
  // A group of nations fighting as one (a single country, or your empire with its conquests):
  // resources are pooled, the conquered nations' factories count at half (war damage, sabotage),
  // and every nation can build what any of them can build. Trade with everyone else is cut off.
  window.warEconomy = (isos, core) => {
    const ps = isos.map(i => ({ iso: i, c: BY[i], p: profile(i), share: i === core || isos.length === 1 ? 1 : 0.5 }));
    const gdpW = ps.reduce((a, x) => a + x.c.gdp, 0) || 1, popW = ps.reduce((a, x) => a + x.c.pop, 0) || 1;
    const pool = k => clamp(ps.reduce((a, x) => a + Math.min(4, x.p[k]) * x.c.gdp, 0) / gdpW, 0, 1);
    const inputs = { energy: pool("energy"), steel: pool("steel"), chips: Math.max(...ps.map(x => x.p.chips)), minerals: pool("minerals"),
      food: clamp(ps.reduce((a, x) => a + x.p.food * x.c.pop, 0) / popW, 0, 1) };
    // No imports: output is held back by the scarcest inputs (a weighted geometric mean).
    const f = x => Math.max(0.05, x);
    const embargo = f(inputs.energy) ** 0.3 * f(inputs.steel) ** 0.25 * f(inputs.chips) ** 0.2 * f(inputs.minerals) ** 0.15 * f(inputs.food) ** 0.1;
    // Total-war capacity: up to 35% of GDP, but no more than 60% of manufacturing can switch to arms,
    // and at most 60% of that converts (modern weapons are hard to build), scaled by how much of a
    // full arms industry the country has: a country with no tank or aircraft factories can't build
    // them, however big its economy. Russia comes out near its real ~1,500 tanks a year.
    const make = {}; window.WAR_MAKE_KEYS.forEach(k => (make[k] = Math.max(...ps.map(x => x.p.make[k]))));
    const breadth = Object.keys(SHARE).reduce((a, k) => a + SHARE[k] * make[MAKE_OF[k]], 0);
    const industry = ps.reduce((a, x) => a + Math.min(x.c.gdp * 0.35, (x.p.mfg / 100) * WORLD_MFG * 0.6) * 0.6 * x.share, 0);
    const capacity = industry * embargo * breadth; // $bn of weapons a year
    const w = {}; let tw = 0;
    Object.keys(SHARE).forEach(k => { w[k] = SHARE[k] * make[MAKE_OF[k]]; tw += w[k]; });
    const perDay = {};
    Object.keys(SHARE).forEach(k => (perDay[k] = tw ? (capacity * 1000 * (w[k] / tw)) / COST[k] / 365 : 0));
    // Troops: new recruits trained from the population (0.6% of it a year at full mobilisation)
    // plus reservists called up (2% of the reserve a day).
    perDay.troops = (ps.reduce((a, x) => a + x.c.pop, 0) * 6) / 365; // thousands a day
    perDay.reserve = ps.reduce((a, x) => a + (x.c.reserve || 0), 0) * 0.02;
    return { capacity, industry, breadth, embargo, inputs, make, perDay, nations: ps.length };
  };
})();
