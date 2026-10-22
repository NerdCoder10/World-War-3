// National valuation, weapon unlock catalogue and promo codes.
//
// ── Value of the world ──────────────────────────────────────────────────
// The World Bank's "Changing Wealth of Nations" puts total global wealth at about $1,152trn
// (2018 dollars): ~64% human capital (present value of future earnings), ~30% produced capital
// (buildings, infrastructure, machinery, net financial assets) and ~6% natural capital (energy,
// minerals, farmland, forests). That was 13.4× world GDP. Scaling to 2025 GDP gives the world value
// used here; each country's value is its share of each component.
window.WEALTH_MODEL = { multipleOfGdp: 1152 / 86, human: 0.64, produced: 0.30, natural: 0.06 };

// Gross natural-resource endowment (US$ trn of reserves in the ground), from widely cited
// estimates of oil, gas, coal, metals, rare earths, timber and farmland. Countries not listed
// get a small default based on population and economy.
window.NATURAL_RESOURCES = {
  RUS: 75, USA: 45, SAU: 34.4, CAN: 33.2, IRN: 27.3, COD: 24, CHN: 23, BRA: 21.8, AUS: 19.9, IRQ: 15.9,
  VEN: 14.3, KAZ: 10, KWT: 8, ARE: 8, IND: 8, UKR: 7, IDN: 6, QAT: 6, ZAF: 6, TKM: 6, LBY: 5,
  NGA: 4, DZA: 4, CHL: 4, MEX: 4, NOR: 4, MNG: 3, PER: 3, ARG: 3, AZE: 2, GUY: 2, BOL: 2, AGO: 2,
  MAR: 2, UZB: 2, MOZ: 1.5, DNK: 1.5, MYS: 1.5, EGY: 1.5, OMN: 1.5, COL: 1.5, AFG: 1, TUR: 1, POL: 1,
  GBR: 1, ZMB: 1, GIN: 1, VNM: 1, ECU: 1, PNG: 0.8, TZA: 0.8, MMR: 0.8, BWA: 0.6, NAM: 0.6, GAB: 0.5,
  COG: 0.5, SDN: 0.5, SSD: 0.5, THA: 0.5, PAK: 0.5, PHL: 0.5, BRN: 0.4, TTO: 0.4, GNQ: 0.4, ZWE: 0.4,
  SUR: 0.3, MRT: 0.3, NER: 0.3, MLI: 0.3, BFA: 0.2, SLE: 0.2, LBR: 0.2, ERI: 0.1,
};

// Weapon categories that must be bought with coins before an owned nation can use them.
// unit = rough replacement cost per item (US$ m) at top-tier quality. Nukes are excluded.
window.WEAPONS = [
  { key: "tanks", label: "Tanks", unit: 6 },
  { key: "afv", label: "Armoured veh.", unit: 1.5 },
  { key: "arty", label: "Artillery", unit: 1.2 },
  { key: "aircraft", label: "Aircraft", unit: 20 },
  { key: "fighters", label: "Fighters/attack", unit: 60 },
  { key: "helis", label: "Helicopters", unit: 18 },
  { key: "ships", label: "Naval vessels", unit: 70 },
  { key: "subs", label: "Submarines", unit: 600 },
  { key: "carriers", label: "Carriers", unit: 4000 },
];
window.COINS_PER_BN = 10; // unlock price: 10 coins per $1bn of hardware value
window.MIN_UNLOCK = 25;
window.START_COINS = 300;

// One redemption per code per campaign.
window.PROMO_CODES = {
  WW3LAUNCH: 1000,
  BLITZKRIEG: 2500,
  SILICONSHIELD: 1500,
  WARCHEST: 5000,
  GOLDRESERVE: 10000,
};
