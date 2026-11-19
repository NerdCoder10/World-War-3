// How technologically advanced each country really is, by domain (0–10), from analysis of what
// it designs, builds and fields (not what it claims or merely buys):
//   aero  combat aircraft, engines, stealth        naval  ships, submarines, shipbuilding
//   land  tanks, armour, artillery                  elec   electronics, chips, sensors, electronic warfare
//   ai    AI and autonomy (drones, targeting, data) space  satellites and launchers
//   hyp   hypersonic missiles
// [aero, naval, land, elec, ai, space, hyp, assessment]. Not listed: estimated from its technology
// generation and its chip-making ability.
// Effects (js/game.js): aircraft, warships and land forces ×(0.94 + 0.012 × their domain);
// electronics sharpens air defence ×(0.9 + 0.02 × elec); AI and autonomy multiply drone warfare
// ×(0.8 + 0.04 × ai); hypersonic missiles slip past air defence (each point cuts the defender's
// rating by 0.15 against its ballistic missiles).
window.TECH_DOMAINS = {
  USA: [10, 10, 9, 9.5, 10, 10, 7, "Leads in stealth aircraft, nuclear submarines, carriers, space and AI; behind China and Russia in fielding hypersonic missiles (the Dark Eagle is only now entering service); much of its advanced chipmaking is offshore"],
  CHN: [8, 9, 8, 8.5, 9, 9, 9.5, "Second only to the US in most fields and ahead in fielded hypersonic missiles (DF-17, YJ-21), shipbuilding capacity (over 200 times America's) and drones; behind in jet engines and the most advanced chips"],
  RUS: [7, 6, 7, 5, 5, 7, 8, "Strong in air defence and missiles, with hypersonics in service (Kinzhal, Zircon, Avangard); sanctions cut it off from Western chips, its electronics and engines lag, and the Su-57 and T-14 are barely fielded"],
  GBR: [8, 8, 6, 8, 8, 5, 3, "Tempest fighter, Astute submarines, a top-tier F-35 partner; strong in AI and electronics; a shrinking industrial base"],
  FRA: [8.5, 8, 7, 7.5, 7, 7, 5, "Builds its own fighters (Rafale), nuclear carrier and submarines, rockets (Ariane) and missiles; a hypersonic missile (ASN4G) in development"],
  DEU: [6, 7, 9, 7.5, 7, 5, 2, "World-class tanks and artillery (Leopard 2, PzH 2000) and engineering; a small aerospace role"],
  JPN: [7, 8.5, 7, 8.5, 7, 7, 5, "Superb shipbuilding and electronics; hypersonic glide weapons from 2026"], KOR: [7, 8.5, 8.5, 9, 8, 6, 4, "K2 tanks, K9 guns, the KF-21 fighter, world-leading chips and shipyards"],
  ISR: [8, 6, 8.5, 9.5, 9, 6, 4, "A world leader in missile defence, drones, electronic warfare and AI targeting"],
  IND: [6, 6, 6, 6, 6, 7, 5, "BrahMos and a strong space programme, but still imports most advanced kit; the Tejas and Arjun took decades"],
  TUR: [6, 7, 7, 6, 6, 4, 3, "World-leading strike drones (Bayraktar), the KAAN fighter prototype and warships; jet engines still imported"],
  TWN: [5, 5, 5, 10, 7, 4, 2, "Makes about 90% of the world's most advanced chips (TSMC); a limited arms industry"],
  IRN: [4, 4, 5, 4, 4, 4, 6, "Missiles and drones built under sanctions; claims a hypersonic missile (Fattah)"], PRK: [2, 3, 4, 2, 2, 3, 5, "Nuclear and missile programmes; everything else obsolete"],
  UKR: [5, 6, 6, 6, 8, 3, 3, "A world leader in battlefield drones and AI targeting, born of the war"], AUS: [6, 6, 6, 7, 7, 5, 4, "AUKUS: nuclear submarines and hypersonics with the US and Britain"],
  ITA: [7, 7, 6, 7, 6, 5, 2, "Leonardo: helicopters, electronics, F-35 assembly"], ESP: [6, 6, 6, 6, 6, 4, 1, "Ships and transports"], NLD: [5, 7, 5, 9, 7, 4, 1, "ASML makes the world's only EUV chip machines"],
  SWE: [8, 7, 7, 7, 7, 4, 1, "Builds its own fighters (Gripen), submarines and armour"], NOR: [5, 6, 5, 7, 6, 5, 1, "Kongsberg missiles"], FIN: [4, 5, 6, 8, 7, 4, 1, "Strong electronics"],
  POL: [4, 4, 6, 5, 5, 3, 1, "Licence-builds Korean armour"], SGP: [5, 6, 6, 8, 8, 4, 1, "Advanced for its size"], SAU: [3, 3, 3, 4, 5, 3, 1, "Buys nearly everything"],
  ARE: [4, 4, 4, 6, 7, 4, 1, "Investing heavily in AI"], PAK: [4, 4, 5, 4, 4, 3, 2, "Co-produces with China"], EGY: [3, 3, 4, 3, 3, 2, 1, "Assembles imported designs"],
  BRA: [6, 5, 5, 5, 5, 4, 1, "Embraer jets"], CAN: [5, 5, 5, 7, 7, 5, 1, "Strong in AI research"], CHE: [5, 1, 6, 8, 7, 4, 1, "Precision industry"], CZE: [5, 1, 6, 6, 5, 3, 1, "Aero Vodochody jets"],
  VNM: [2, 4, 4, 5, 4, 3, 1, "Growing electronics assembly"], BLR: [3, 1, 5, 5, 3, 2, 1, "Russian-linked"], ZAF: [4, 4, 6, 4, 4, 3, 1, "Denel, in decline"],
};
window.techDomains = c => {
  const t = window.TECH_DOMAINS[c.iso3];
  if (t) return { aero: t[0], naval: t[1], land: t[2], elec: t[3], ai: t[4], space: t[5], hyp: t[6], note: t[7], est: false };
  const g = (c.tech && c.tech.gen) || 2, chips = (window.WAR_ECON && window.WAR_ECON[c.iso3] && window.WAR_ECON[c.iso3][3]) || 0.1;
  const v = x => Math.round(Math.max(1, Math.min(7, x)) * 10) / 10;
  return { aero: v(1.4 * g - 2), naval: v(1.4 * g - 2), land: v(1.4 * g - 1.5), elec: v(1 + 4 * chips + 0.6 * g), ai: v(1.3 * g - 1.5), space: v(1.2 * g - 2), hyp: 1, note: "", est: true };
};
window.techIndex = c => { const t = window.techDomains(c); return Math.round(((t.aero + t.naval + t.land + t.elec + t.ai + t.space + t.hyp) / 7) * 10) / 10; };
