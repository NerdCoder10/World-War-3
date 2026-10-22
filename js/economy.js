// National valuation, weapon unlock catalogue and promo codes.
//
// ── Value of the world ──────────────────────────────────────────────────
// Gross value of everything a country owns, built from global asset estimates (US$ trn, 2025):
//  human        PV of 40 years of world labour income ($59trn/yr ≈ 52% of GDP) at a 2% real
//               discount-minus-growth rate: 59 × 27.4 ≈ $1,620trn
//  realEstate   all residential, commercial and agricultural property incl. land (Savills ≈ $410trn)
//  business     listed equity (~$125trn) plus private / unlisted companies (~$40trn)
//  infrastructure roads, rail, grids, ports, pipelines, telecoms (≈ 75% of world GDP)
//  privateGold  ~180,000t of jewellery, bars and coins held outside central banks
// Natural resources (gross value of reserves in the ground), central-bank gold and military
// hardware are added country by country from the tables below and the military inventory.
// Business equity partly overlaps the real estate companies own, so treat the total as gross.
window.WORLD_ASSETS = { human: 1620, realEstate: 410, business: 165, infrastructure: 85, privateGold: 22, cultural: 70 };
// cultural: soft-power / brand capital — media, heritage, institutions, global goodwill (~$70trn).

// Hand-set valuation overrides (US$ bn) for states the share model cannot capture.
// The Vatican / Holy See owns little by GDP but holds priceless art and heritage, worldwide
// Church property, the IOR ("Vatican Bank") and APSA investments, and the brand of a 1.4bn-member faith.
window.VALUE_OVERRIDES = {
  VAT: {
    realEstate: 2000, business: 25, gold: 60, cultural: 1200, human: 5,
    total: 100000, // set by design: the components are scaled up so the Vatican is worth $100trn
    note: "Valued at $100trn by design. It reflects the Holy See and worldwide Church property, priceless art and heritage (St Peter's, the Vatican Museums, the Sistine Chapel), IOR/APSA assets and the brand of a 1.4-billion-member faith.",
  },
};

// Buying a country costs its national value in coins (1 coin = US$1), plus a premium
// for the most valuable nations by value rank.
window.PRICE_PREMIUMS = [
  { upTo: 5, premium: 1.325 },  // 50% markup, then raised a further 55%: 1.5 × 1.55 = 2.325× value
  { upTo: 10, premium: 0.4 },
  { upTo: 20, premium: 0.3 },
  { upTo: 35, premium: 0.15 },
  { upTo: 50, premium: 0.05 },
];
window.GOLD_BN_PER_TONNE = 0.122; // ~$3,800/oz

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
  WORLDWAR3: 10e9,          // 10 billion
  CLAUDEMADETHIS: 1e12,     // 1 trillion
  GOD: 100e12,              // 100 trillion
  USAISTHETOP: 2e15,        // 2 quadrillion
};
