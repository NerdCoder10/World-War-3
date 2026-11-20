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

// Peacetime upkeep: can each country's real budget (including off-book spending, js/intel.js) keep
// its forces running? Upkeep = pay and keep of every soldier plus the yearly operating and
// maintenance cost of each tank, jet, ship... at local price levels. Upkeep is normally about
// 60-70% of a defence budget (the rest buys new kit and research), so a budget below 1.4 x upkeep
// means maintenance and training are cut: a hollow force (North Korea's vast ageing army on a tiny
// budget, Greece after its debt crisis). Equipment readiness x(0.55 + 0.45 x budget / (1.4 x upkeep)),
// troops x(0.85 + 0.15 x the same), never above 1.
window.UNIT_UPKEEP = { tanks: 0.0006, afv: 0.00015, arty: 0.0002, fighters: 0.006, aircraft: 0.003, helis: 0.0015, ships: 0.03, subs: 0.06, carriers: 0.9 };
window.BUDGET_OVERRIDE = { FIN: [1, "Keeps a large wartime reserve of equipment in cheap, well-kept storage for its conscript army"], CHE: [1, "A militia army that stores its kit"] };
window.budgetUpkeep = c => {
  const pc = c.gdp * 1e9 / Math.max(1, c.pop * 1e6), price = 0.25 + 0.75 * Math.min(1, pc / 50000);
  const f = { tanks: c.tanks, afv: c.afv, arty: c.arty, fighters: c.fighters, aircraft: Math.max(0, c.aircraft - c.fighters - c.helis), helis: c.helis, ships: c.ships, subs: c.subs, carriers: c.carriers };
  const people = c.active * 1000 * Math.max(3000, 1.2 * pc) / 1e9;
  const kit = Object.keys(window.UNIT_UPKEEP).reduce((a, k) => a + (f[k] || 0) * window.UNIT_UPKEEP[k], 0) * price;
  return people + kit;
};
window.budgetSustain = c => {
  const o = window.BUDGET_OVERRIDE[c.iso3];
  if (o) return o[0];
  const need = window.budgetUpkeep(c), have = (c.secret && c.secret.trueBudget) || c.mil;
  return need > 0 ? Math.min(1, have / (1.4 * need)) : 1;
};

// Naval upkeep: shipyard and dry-dock capacity to keep a fleet at sea (0-10), from the record.
// A fleet is only as ready as its yards: naval readiness x(0.8 + 0.02 x capacity). Ships deployed
// abroad wear down every day at sea (faster for countries with weak yards) and recover only with
// yard time once home (faster with strong yards), up to -30%.
window.NAVAL_YARDS = {
  USA: [6, "Four overloaded public naval shipyards: about a third of its attack submarines sit idle waiting for maintenance (GAO), and carrier overhauls run years late"],
  CHN: [10, "The world's largest shipbuilding industry, with spare dry docks everywhere"], KOR: [9, "World-class yards (Hyundai, Hanwha, Samsung)"], JPN: [9, "World-class yards"],
  RUS: [4, "Few dry docks big enough for its large ships: the Kuznetsov's floating dock sank in 2018 and a fire followed in 2019"],
  GBR: [5, "Devonport and Rosyth are stretched: often only one Astute submarine is at sea"], FRA: [6, "Naval Group's yards"], ITA: [6, "Fincantieri"],
  IND: [5, "Growing yards with long delays"], TUR: [7, "Busy, efficient yards"], DEU: [6, "TKMS submarines and frigates"], ESP: [6, "Navantia"], NLD: [6, "Damen"],
  NOR: [6, ""], SWE: [6, "Saab Kockums"], SGP: [7, "ST Engineering"], TWN: [6, "CSBC builds its own submarines"], AUS: [4, "Its Collins submarines spent long spells in maintenance"],
  CAN: [3, "Rebuilding its shipbuilding"], ISR: [4, "Relies on German and US yards"], IRN: [3, "Sanctioned yards"], PRK: [2, "Primitive yards"], POL: [4, ""], GRC: [3, "Its yards nearly collapsed"],
  EGY: [3, ""], SAU: [2, "Depends on foreign yards"], ARE: [4, ""], PAK: [4, "Chinese-built ships"], VNM: [4, ""], IDN: [4, ""], BRA: [4, ""], UKR: [3, "Its yards were bombed"],
};
window.navalYards = c => { const y = window.NAVAL_YARDS[c.iso3]; if (y) return { cap: y[0], note: y[1] };
  const g = (c.tech && c.tech.gen) || 2; return { cap: Math.round(Math.max(1, Math.min(6, 1.6 * g - 1.5)) * 10) / 10, note: "" }; };

// Air-force upkeep: [pilot flying hours a year, maintenance crews 0-10, the record]. Pilots who fly
// too little lose their edge (NATO's standard is 180 hours a year): proficiency x(0.75 + 0.25 x
// min(1, hours / 180)). Short or poorly trained maintenance crews keep fewer jets flyable:
// availability x(0.85 + 0.015 x crews). In war, sortie surges tire pilots and crews (+0.5% a day,
// up to 40%; -2% a day at rest), cutting air power by up to 30%. Not listed: estimated from
// readiness and maintenance capacity.
window.AIR_UPKEEP = {
  USA: [130, 7, "Fighter pilots fly ~120-150 hours a year, below NATO's 180, and the Air Force is ~2,000 pilots short; F-35 upkeep is a heavy burden"],
  ISR: [200, 9, "Among the most flying hours and best-kept fleets in the world"], GBR: [150, 7, ""], FRA: [160, 7, ""], DEU: [120, 5, "Eurofighter availability problems leave pilots short of hours"],
  ITA: [140, 6, ""], ESP: [130, 6, ""], NLD: [150, 7, ""], NOR: [160, 7, ""], SWE: [150, 8, "The Gripen is built to be serviced at dispersed road bases by conscripts"], FIN: [150, 8, ""],
  POL: [130, 6, ""], TUR: [150, 6, "Lost many pilots in the 2016 purge; since rebuilt"],
  RUS: [80, 5, "Claims 100+ hours a year, but real figures are lower and its ground crews are stretched by the war"],
  CHN: [130, 7, "Flying hours rising fast with more realistic training"], IND: [180, 5, "High flying hours but weak maintenance: frequent crashes (the MiG-21 'flying coffin')"],
  PAK: [170, 6, "Well drilled; punches above its weight"], IRN: [40, 3, "Sanctions grounded much of its fleet; few hours"], PRK: [20, 2, "Pilots fly as little as 15-20 hours a year for lack of fuel"],
  KOR: [150, 8, ""], JPN: [150, 8, ""], TWN: [150, 6, "Training squeezed by constant Chinese incursions"], SAU: [130, 4, "Depends on foreign contractors to keep its jets flying"],
  ARE: [150, 6, ""], EGY: [80, 4, ""], UKR: [100, 6, "Jets flown hard and kept going by improvisation and Western help"], AUS: [170, 8, ""], CAN: [130, 5, "Ageing CF-18s, short of technicians"],
  SGP: [180, 9, ""], GRC: [120, 5, ""], VEN: [30, 2, "Most of its jets are grounded"], SYR: [10, 1, ""], CUB: [20, 2, ""], DZA: [100, 5, ""], MAR: [120, 5, ""],
  VNM: [60, 4, ""], IDN: [80, 4, ""], THA: [100, 5, ""], BRA: [100, 5, ""], MEX: [80, 4, ""],
};
window.airUpkeep = c => { const a = window.AIR_UPKEEP[c.iso3]; if (a) return { hours: a[0], crews: a[1], note: a[2] };
  const r = (c.tech && c.tech.ready) || 0.5; return { hours: Math.round(30 + 130 * r), crews: Math.round(Math.max(1, Math.min(7, 1 + 7 * r)) * 10) / 10, note: "" }; };

// Ground-force upkeep: repair and recovery capacity (0-10, the record). Armies get many knocked-out
// vehicles back: recovery crews drag them off the field and depots rebuild them. Of each day's tank,
// armoured-vehicle and artillery losses, 20% + 4% x capacity are recoverable (20-60%); they return
// at 0.3% x capacity of the backlog a day. Capacity also keeps the fleet ready in peace: ground
// readiness x(0.85 + 0.015 x capacity). Troops held at the front tire without rotation (+0.3% a
// day at war, less for armies with deep reserves to rotate in, up to 40%; -2% a day at rest),
// fighting up to 25% below their best. Not listed: estimated from maintenance capacity.
window.GROUND_REPAIR = {
  USA: [9, "Anniston, Red River and Letterkenny depots rebuild armour, and every unit has recovery vehicles"],
  RUS: [6, "Recovers and rebuilds damaged and stored vehicles at scale (Uralvagonzavod and repair plants), but satellite counts show its storage yards emptying by 2025"],
  UKR: [8, "Repair hubs near the front and in Poland and Slovakia return damaged Western and Soviet vehicles quickly"],
  ISR: [9, "Repairs tanks under fire and rebuilds them at home, a lesson of 1973"], CHN: [8, "A vast industrial base"], KOR: [8, ""], JPN: [7, ""], TUR: [7, ""],
  DEU: [6, "Strong industry, slow peacetime depots"], GBR: [5, "Thin depot capacity"], FRA: [6, ""], IND: [6, ""], PAK: [5, ""], POL: [6, ""], IRN: [5, "Keeps old kit running by cannibalising"],
  PRK: [3, ""], SAU: [3, "Depends on foreign contractors"], EGY: [4, ""], TWN: [6, ""], FIN: [7, ""], SWE: [7, ""], AUS: [6, ""], CAN: [5, ""], ITA: [6, ""], ESP: [6, ""],
  GRC: [4, ""], ARE: [4, ""], AZE: [5, ""], ARM: [4, ""], VEN: [2, ""], SYR: [2, ""], IRQ: [3, ""], DZA: [4, ""], MAR: [5, ""], VNM: [5, ""], BRA: [5, ""], IDN: [4, ""], THA: [4, ""],
};
window.groundRepair = c => { const g = window.GROUND_REPAIR[c.iso3]; if (g) return { cap: g[0], note: g[1] };
  const m = window.maintSkill ? window.maintSkill(c.iso3) : 0.3, r = (c.tech && c.tech.ready) || 0.5;
  return { cap: Math.round(Math.max(1, Math.min(7, 2 + 3 * m + 3 * r)) * 10) / 10, note: "" }; };
