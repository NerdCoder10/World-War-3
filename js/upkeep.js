// Upkeep of what wars consume besides equipment: artillery ammunition and satellites.
//
// Artillery ammunition: [stock in days of high-intensity fire, production per day in days of fire,
// why], from analysis of real stockpiles and output (2025), not official claims. A day at war burns
// one day of fire; with under 3 days left the guns fall silent in proportion (×0.3 at none left).
//   Russia fires ~10,000 shells a day from production (~3–4 million a year) plus millions shipped by
//   North Korea; the US makes ~40,000 a month (rising toward 100,000); European armies were found to
//   hold days to weeks of shells; China and North Korea hold huge stocks.
window.AMMO = {
  USA: [60, 0.15, "~40,000 155 mm shells a month in 2025, rising toward 100,000; large stocks partly sent to Ukraine and Israel"],
  RUS: [90, 0.85, "Makes ~3–4 million shells a year and has received millions from North Korea; still rations fire"],
  CHN: [150, 1, "The world's largest munitions industry"], PRK: [200, 0.6, "Huge stockpiles, millions of shells shipped to Russia since 2023"],
  UKR: [15, 0.6, "Lives on deliveries: European and US shells and its own growing production"], IND: [40, 0.2, "Long-standing shortfalls in war reserves"],
  PAK: [30, 0.2, "Its ordnance factories supply it and export"], IRN: [60, 0.3, "Large domestic industry"], ISR: [30, 0.25, "Resupplied by the US"],
  KOR: [60, 0.35, "A major shell exporter (indirectly to Ukraine)"], JPN: [20, 0.05, "Small stocks, small production"], TWN: [30, 0.1, "Building stocks"],
  TUR: [40, 0.25, "Large domestic industry (MKE)"], POL: [20, 0.15, "Building new shell factories"], DEU: [10, 0.1, "Officials warned stocks would last days; Rheinmetall is expanding"],
  GBR: [7, 0.05, "Parliament heard it would run out of shells in days of high-intensity war"], FRA: [15, 0.1, "Thin stocks; Nexter ramping up"], ITA: [10, 0.05, "Thin stocks"],
  ESP: [10, 0.05, "Thin stocks"], CAN: [7, 0.03, "Thin stocks"], AUS: [10, 0.03, "Thin stocks"], EGY: [40, 0.15, "Large stocks"], SAU: [30, 0.05, "Imports almost all its ammunition"],
  VNM: [80, 0.2, "Large wartime-style stocks"], SRB: [30, 0.15, "A notable shell exporter"], CZE: [15, 0.1, "Organised the shell initiative for Ukraine"],
};
window.ammoProfile = c => {
  const a = window.AMMO[c.iso3];
  if (a) return { stock: a[0], prod: a[1], note: a[2] };
  const sk = window.maintSkill ? window.maintSkill(c.iso3) : 0.3;
  return { stock: 20, prod: Math.round((0.02 + 0.12 * sk) * 100) / 100, note: "" };
};

// Satellites: share of a lost constellation replaced each day by the country's own launches (the
// US ~170 launches a year mostly by SpaceX, China ~90, Russia ~20...). Others depend on foreign
// launchers and can't replace losses in a war with trade cut.
window.SAT_LAUNCH = {
  USA: [0.006, "~170 launches a year, mostly SpaceX"], CHN: [0.005, "~90 launches a year"], RUS: [0.002, "~20 launches a year, down from its peak"],
  IND: [0.001, "A handful of launches a year"], JPN: [0.001, "H3 rockets"], FRA: [0.0008, "Ariane 6 from Kourou"], IRN: [0.0005, "Occasional launches"], PRK: [0.0003, "Rare launches"], ISR: [0.0004, "Shavit launches"],
};

// Economic upkeep of war: fiscal capacity (0–10): reserves, sovereign wealth, debt, the cost of
// borrowing, sanctions and outside aid. A country can pay for full-scale war for about
// 60 + 45 × capacity days (~465 at 9, ~105 at 1); beyond that the strain grows (up to 35%): war
// production falls and readiness sags (unpaid soldiers, deferred maintenance).
window.ECON_FISCAL = {
  USA: [9, "Issues the world's reserve currency and borrows cheaply, though debt tops 120% of GDP and interest now costs more than defence"],
  CHN: [9, "Huge savings and state banks; a slowing economy and heavy local-government debt"], JPN: [7, "Debt over 230% of GDP, but owed at home"],
  DEU: [8, "Low debt; loosened its debt brake for defence in 2025"], GBR: [5, "Debt ~100% of GDP, and markets punish fiscal slips (the 2022 gilt crisis)"],
  FRA: [5, "Deficits of 5–6% of GDP, debt ~115%, and governments falling over budgets"], ITA: [4, "Debt ~135% of GDP"],
  RUS: [6, "Low debt, but the liquid part of its National Wealth Fund fell by more than half, interest rates hit 21% and growth stalled in 2025; shut out of Western markets"],
  UKR: [3, "Survives on Western budget support (~$40bn+ a year) and loans backed by frozen Russian assets"], IRN: [2, "Sanctions, ~40% inflation and a collapsing currency"],
  PRK: [1, "Isolated; lives on arms sales to Russia and crypto theft"], ISR: [7, "A strong tech economy and US aid ($3.8bn a year plus wartime packages), though the war doubled its deficit"],
  IND: [6, "Fast growth, debt ~80% of GDP"], PAK: [2, "Kept afloat by IMF bailouts"], SAU: [8, "Large reserves and the PIF, though low oil prices push it into deficit"],
  ARE: [9, "Vast sovereign wealth"], QAT: [9, "Vast sovereign wealth"], KWT: [9, "Vast sovereign wealth"], NOR: [10, "The world's largest sovereign wealth fund"], CHE: [9, "Low debt, strong franc"],
  SGP: [9, "Large reserves"], KOR: [7, "Moderate debt"], TWN: [8, "Large reserves"], AUS: [8, "Low debt"], CAN: [7, "Moderate debt"],
  POL: [7, "Spending ~4–5% of GDP on defence and growing fast"], TUR: [4, "High inflation and a weak lira"], EGY: [2, "Gulf and IMF bailouts"], ARG: [2, "Repeated defaults"],
  VEN: [1, "Collapsed economy"], BRA: [5, "High interest rates"], MEX: [6, "Moderate debt"], IDN: [7, "Low debt"], VNM: [6, "Growing"], NLD: [8, "Low debt"], SWE: [8, "Low debt"],
  ESP: [5, "Debt ~105% of GDP"], GRC: [3, "Debt ~150% of GDP"], BLR: [3, "Lives on Russian credit"], SYR: [1, "Ruined"], LBN: [1, "Defaulted in 2020"], ETH: [2, "Defaulted in 2023"], NGA: [3, "Weak revenues"], ZAF: [4, "High debt, weak growth"],
};
window.fiscal = c => {
  const f = window.ECON_FISCAL[c.iso3];
  if (f) return { cap: f[0], note: f[1] };
  const lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001)), corr = (c.milStats && c.milStats.corruption) || 5;
  return { cap: Math.round(Math.max(1, Math.min(8, 3 + 1.5 * lg - 0.2 * corr)) * 10) / 10, note: "" };
};
