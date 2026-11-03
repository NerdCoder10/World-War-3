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

// Strategic resources each country produces at home in a year (2023–24, rounded; USGS, IEA,
// worldsteel, IAI and industry sources). With no trade, this is all it will have.
//   oil       crude and condensate produced, million barrels a day; oilUse = its consumption.
//   steel     crude steel, million tonnes (blast furnace and scrap-fed electric furnaces).
//   alu       aluminium, million tonnes: smelters plus recycled scrap (the US smelts little
//             but recycles ~3 Mt; Japan smelts none but recycles ~1 Mt).
//   ti        titanium sponge or re-melted scrap, thousand tonnes: only a handful of countries
//             make it (China, Japan, Russia, Kazakhstan, Saudi Arabia); the US has no sponge plant
//             left and runs on scrap.
//   ree       separated rare earths, thousand tonnes: China processes ~90% of the world's;
//             Malaysia (Lynas) and Estonia (Silmet) are the main others.
//   chips     military-grade chips and electronics, thousand weapon sets a year (Taiwan leads).
//   reserve   days of strategic oil stocks (IEA members hold 90+; Japan ~240).
window.WAR_RES = {
  //    oil, oilUse, steel, alu, ti, ree, chips, reserve
  USA: [13.0, 20.3, 82, 3.75, 30, 2, 40, 130], CHN: [4.2, 16.4, 1019, 41.6, 220, 240, 70, 100], RUS: [10.5, 3.6, 76, 3.8, 33, 2.6, 4, 60],
  IND: [0.7, 5.4, 140, 4.7, 0.5, 3, 3, 70], JPN: [0.005, 3.3, 87, 1.0, 60, 0.5, 35, 240], DEU: [0.03, 2.1, 35, 0.8, 5, 0.2, 8, 90],
  KOR: [0, 2.8, 67, 0.5, 0, 0.2, 60, 200], GBR: [0.7, 1.4, 5.6, 0.24, 3, 0, 3, 90], FRA: [0.01, 1.5, 10, 0.7, 5, 1, 5, 90],
  ITA: [0.1, 1.2, 21, 0.9, 0, 0, 3, 90], ESP: [0, 1.2, 11, 0.4, 0, 0, 1, 90], TUR: [0.08, 1.1, 34, 0.58, 0, 0, 0.5, 60],
  POL: [0.02, 0.7, 6.4, 0.1, 0, 0, 0.5, 90], UKR: [0.04, 0.2, 6.2, 0, 2, 0, 0.5, 30], SAU: [9.6, 3.7, 9, 1.0, 15, 0, 0.1, 90],
  IRN: [3.2, 1.9, 31, 0.6, 0, 0, 0.5, 60], IRQ: [4.3, 0.9, 0.5, 0, 0, 0, 0, 30], ISR: [0.01, 0.25, 0.5, 0.05, 0, 0, 5, 90],
  EGY: [0.55, 0.8, 10, 0.3, 0, 0, 0.1, 30], PAK: [0.07, 0.5, 5, 0.02, 0, 0, 0.2, 20], TWN: [0, 1.0, 20, 0.3, 0, 0, 100, 120],
  VNM: [0.2, 0.55, 19, 0.05, 0, 1, 2, 30], THA: [0.2, 1.3, 4.5, 0.1, 0, 1, 2, 60], IDN: [0.6, 1.6, 16, 0.25, 0, 0, 1, 30],
  MYS: [0.5, 0.75, 10, 0.8, 0, 10, 8, 30], SGP: [0, 1.4, 0.5, 0, 0, 0, 10, 90], PHL: [0, 0.45, 1.5, 0, 0, 0, 2, 30],
  AUS: [0.4, 1.1, 5.5, 1.5, 0, 2, 0.5, 60], NZL: [0.03, 0.15, 0.6, 0.35, 0, 0, 0, 60], CAN: [4.9, 2.4, 12, 3.0, 0, 0, 1, 60],
  MEX: [1.6, 1.8, 16, 0.3, 0, 0, 0.5, 30], BRA: [3.4, 3.1, 32, 1.4, 0, 0.1, 0.5, 30], ARG: [0.65, 0.65, 5, 0.4, 0, 0, 0, 30],
  CHL: [0.01, 0.35, 1.2, 0, 0, 0, 0, 30], COL: [0.8, 0.35, 1.3, 0, 0, 0, 0, 30], VEN: [0.8, 0.4, 0.3, 0.05, 0, 0, 0, 30],
  NOR: [1.8, 0.2, 0.6, 1.3, 0, 0, 0.5, 90], SWE: [0, 0.3, 4.5, 0.15, 0, 0, 1, 90], FIN: [0, 0.2, 4, 0.02, 0, 0, 1, 90],
  NLD: [0.01, 0.9, 6, 0.1, 0, 0, 5, 90], BEL: [0, 0.6, 6, 0.05, 0, 0, 1, 90], CHE: [0, 0.2, 1, 0.05, 0, 0, 1, 120],
  AUT: [0.01, 0.25, 7.5, 0.1, 0, 0, 2, 90], CZE: [0, 0.2, 4, 0.02, 0, 0, 0.5, 90], DNK: [0.07, 0.15, 0, 0, 0, 0, 0.3, 90],
  GRC: [0, 0.3, 1.4, 0.18, 0, 0, 0, 90], ROU: [0.07, 0.2, 2, 0.25, 0, 0, 0, 90], HUN: [0.02, 0.17, 1, 0, 0, 0, 0.5, 90],
  KAZ: [1.8, 0.35, 4.3, 0.25, 25, 0.1, 0, 30], UZB: [0.03, 0.1, 1.2, 0, 0, 0, 0, 30], AZE: [0.6, 0.1, 0.1, 0, 0, 0, 0, 30],
  ARE: [3.4, 1.0, 3.5, 2.7, 0, 0, 0.2, 60], QAT: [1.3, 0.35, 1.0, 0.65, 0, 0, 0, 60], KWT: [2.6, 0.45, 0, 0, 0, 0, 0, 60],
  OMN: [1.0, 0.2, 2, 0.4, 0, 0, 0, 60], BHR: [0.2, 0.08, 1, 1.6, 0, 0, 0, 60], NGA: [1.4, 0.45, 1, 0, 0, 0, 0, 20],
  DZA: [0.95, 0.45, 3.5, 0, 0, 0, 0, 30], LBY: [1.2, 0.2, 0.5, 0, 0, 0, 0, 20], AGO: [1.1, 0.12, 0, 0, 0, 0, 0, 20],
  ZAF: [0, 0.6, 5, 0.6, 0, 0, 0.3, 30], PRK: [0, 0.02, 1.2, 0, 0, 0, 0.1, 60], BLR: [0.04, 0.17, 2.5, 0, 0, 0, 0.5, 60],
  SRB: [0.02, 0.08, 1.8, 0, 0, 0, 0, 60], SVK: [0, 0.08, 4, 0.18, 0, 0, 0, 90], BGR: [0, 0.1, 0.5, 0, 0, 0, 0, 90],
  MMR: [0.01, 0.1, 0.1, 0, 0, 0, 0, 30], EST: [0, 0.03, 0, 0, 0, 3, 0, 90], ECU: [0.48, 0.25, 0.6, 0, 0, 0, 0, 30],
  PER: [0.04, 0.25, 1.2, 0, 0, 0, 0, 30], TKM: [0.25, 0.15, 0.2, 0, 0, 0, 0, 30], TJK: [0, 0.01, 0, 0.1, 0, 0, 0, 30],
  ISL: [0, 0.02, 0, 0.8, 0, 0, 0, 90], MOZ: [0, 0.03, 0, 0.55, 0, 0, 0, 20], COD: [0.02, 0.03, 0, 0, 0, 0, 0, 10],
  GAB: [0.2, 0.01, 0, 0, 0, 0, 0, 20], COG: [0.27, 0.01, 0, 0, 0, 0, 0, 20], SDN: [0.05, 0.1, 0, 0, 0, 0, 0, 10],
  SSD: [0.15, 0.01, 0, 0, 0, 0, 0, 10], YEM: [0.03, 0.08, 0, 0, 0, 0, 0, 10], SYR: [0.03, 0.15, 0.2, 0, 0, 0, 0, 10],
  TUN: [0.03, 0.1, 0.2, 0, 0, 0, 0, 30], BGD: [0, 0.15, 7, 0, 0, 0, 0, 30], LKA: [0, 0.1, 0.2, 0, 0, 0, 0, 30],
  JOR: [0, 0.1, 0.3, 0, 0, 0, 0, 30], LBN: [0, 0.1, 0, 0, 0, 0, 0, 10], CUB: [0.04, 0.15, 0.2, 0, 0, 0, 0, 30],
  PRT: [0, 0.23, 2, 0, 0, 0, 0, 90], IRL: [0, 0.15, 0, 0, 0, 0, 4, 90], MNG: [0.02, 0.03, 0, 0, 0, 0, 0, 30],
};
// Doctrine: what each country's war industry would push hardest (on top of what it can make).
window.WAR_DOCTRINE = {
  RUS: { arty: 1.8, tanks: 1.3, missiles: 1.3, ships: 0.6 }, USA: { fighters: 1.4, ships: 1.2, carriers: 1.5, subs: 1.3, missiles: 1.2 },
  CHN: { ships: 1.4, missiles: 1.4, fighters: 1.2 }, IRN: { missiles: 2.5, aircraft: 2.5, tanks: 0.6 }, PRK: { arty: 2, missiles: 1.8, fighters: 0 },
  KOR: { ships: 1.5, arty: 1.3, tanks: 1.2 }, JPN: { ships: 1.6, subs: 1.4, missiles: 1.2 }, ISR: { missiles: 1.5, tanks: 1.2, aircraft: 1.5 },
  UKR: { aircraft: 3, missiles: 1.5, arty: 1.3 }, TUR: { aircraft: 2.2, afv: 1.3, ships: 1.2 }, DEU: { tanks: 1.6, afv: 1.3 },
  POL: { tanks: 1.4, arty: 1.4 }, GBR: { subs: 1.4, fighters: 1.2 }, FRA: { fighters: 1.3, subs: 1.2, missiles: 1.2 },
  IND: { tanks: 1.2, missiles: 1.3 }, PAK: { missiles: 1.5, arty: 1.2 }, TWN: { missiles: 2, ships: 0.8 }, SWE: { fighters: 1.4, subs: 1.3 },
  ITA: { helis: 1.6, ships: 1.2 }, ESP: { ships: 1.3, aircraft: 1.4 }, BRA: { aircraft: 1.6 }, NOR: { missiles: 1.8 },
};
(function () {
  const C = window.COUNTRIES, BY = {};
  C.forEach(c => (BY[c.iso3] = c));
  const worldGdp = C.reduce((a, c) => a + c.gdp, 0);
  const WORLD_MFG = 16000; // $bn of world manufacturing value added a year
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // One country's war-economy profile (listed, or estimated from its economy).
  const cache = {};
  function profile(iso) {
    if (cache[iso]) return cache[iso];
    const c = BY[iso], v = window.WAR_ECON[iso], r = window.WAR_RES[iso];
    const make = {};
    let p;
    if (v) {
      window.WAR_MAKE_KEYS.forEach((k, i) => (make[k] = v[6][i]));
      p = { mfg: v[0], energy: v[1], food: v[5], make, estimated: false };
    } else {
      // Not listed: little or no arms industry; a sizeable economy can still build basic vehicles.
      window.WAR_MAKE_KEYS.forEach(k => (make[k] = 0));
      make.land = c.gdp > 150 ? 0.1 : c.gdp > 40 ? 0.03 : 0;
      const nr = (window.NATURAL_RESOURCES || {})[iso] || 0;
      p = { mfg: (100 * c.gdp / worldGdp) * 0.7, energy: 0.3 + 1.2 * clamp(nr / 3, 0, 1), food: 0.85, make, estimated: true };
    }
    const nr = (window.NATURAL_RESOURCES || {})[iso] || 0;
    p.res = r ? { oil: r[0], oilUse: r[1], steel: r[2], alu: r[3], ti: r[4], ree: r[5], chips: r[6] } :
      { oil: nr > 1 ? nr * 0.1 : 0, oilUse: Math.max(0.005, c.gdp * 0.0007), steel: c.gdp > 100 ? 0.3 : 0, alu: 0, ti: 0, ree: 0, chips: 0 };
    p.reserve = r ? r[7] : 20;
    p.resEstimated = !r;
    return (cache[iso] = p);
  }
  window.warProfile = profile;
  // Cost ($m) and what one of each weapon takes: steel, aluminium, titanium and rare earths in
  // thousand tonnes, chips in thousand weapon sets. A fighter needs titanium (2–4 t in an F-35 or
  // F-22), aluminium, rare-earth magnets (~0.4 t) and a full set of electronics; a destroyer ~4,000 t
  // of steel and ~2 t of rare earths; a missile little metal but a guidance set.
  const COST = { tanks: 8, afv: 2, arty: 3, aircraft: 25, fighters: 80, helis: 20, ships: 400, subs: 1500, carriers: 10000, missiles: 2 };
  // Only hard requirements count: tanks and warships can be built with steel instead of aluminium,
  // drones like the Shahed use no titanium, and simple ballistic missiles need no rare-earth magnets.
  // Fighters, helicopters, submarines and carriers can't do without theirs.
  const NEED = {
    tanks: { steel: 0.07, chips: 0.00005 }, afv: { steel: 0.025, chips: 0.00002 }, arty: { steel: 0.03, chips: 0.00001 },
    fighters: { steel: 0.005, alu: 0.01, ti: 0.003, ree: 0.0004, chips: 0.001 }, aircraft: { steel: 0.003, alu: 0.008, chips: 0.0002 },
    helis: { steel: 0.003, alu: 0.004, ti: 0.001, chips: 0.0003 }, ships: { steel: 4, chips: 0.005 },
    subs: { steel: 6, ti: 0.05, ree: 0.004, chips: 0.005 }, carriers: { steel: 60, ti: 0.1, ree: 0.01, chips: 0.05 },
    missiles: { steel: 0.0005, chips: 0.0001 },
  };
  // How much of each resource can go to arms in total war (the rest keeps the country running).
  const WAR_SHARE = { steel: 0.35, alu: 0.4, ti: 0.7, ree: 0.5, chips: 0.3 };
  const RES_KEYS = ["steel", "alu", "ti", "ree", "chips"];
  window.WAR_RES_LABEL = { oil: "Oil", steel: "Steel", alu: "Aluminium", ti: "Titanium", ree: "Rare earths", chips: "Military chips" };
  const SHARE = { tanks: 0.12, afv: 0.13, arty: 0.1, fighters: 0.18, aircraft: 0.06, helis: 0.06, ships: 0.12, subs: 0.09, carriers: 0.04, missiles: 0.1 };
  const MAKE_OF = { tanks: "land", afv: "land", arty: "land", fighters: "fighters", aircraft: "aircraft", helis: "helis", ships: "ships", subs: "subs", carriers: "carriers", missiles: "missiles" };
  // A group of nations fighting as one (a single country, or an empire with its conquests): the
  // resources of every nation in it are pooled at once (that's what conquest seizes); conquered
  // factories count at half. Nothing comes in from anyone else: no trade at all.
  window.warEconomy = (isos, core) => {
    const ps = isos.map(i => ({ iso: i, c: BY[i], p: profile(i), share: i === core || isos.length === 1 ? 1 : 0.5 }));
    const sum = k => ps.reduce((a, x) => a + x.p.res[k], 0);
    const res = { oil: sum("oil"), oilUse: sum("oilUse") }; RES_KEYS.forEach(k => (res[k] = sum(k)));
    const popW = ps.reduce((a, x) => a + x.c.pop, 0) || 1, gdpW = ps.reduce((a, x) => a + x.c.gdp, 0) || 1;
    // Fuel: oil produced against what a war economy has to burn (civilian use rationed to half).
    const fuelRatio = clamp(res.oil / Math.max(0.001, res.oilUse * 0.5), 0, 1);
    const reserveDays = ps.reduce((a, x) => a + x.p.reserve * x.p.res.oilUse, 0) / Math.max(0.001, res.oilUse);
    // Factories need power: energy self-sufficiency (oil, gas, coal, nuclear, hydro) sets how much
    // of industry can run.
    const energy = clamp(ps.reduce((a, x) => a + Math.min(1.5, x.p.energy) * x.c.gdp, 0) / gdpW, 0, 1);
    const food = clamp(ps.reduce((a, x) => a + x.p.food * x.c.pop, 0) / popW, 0, 1);
    const make = {}; window.WAR_MAKE_KEYS.forEach(k => (make[k] = Math.max(...ps.map(x => x.p.make[k]))));
    // Doctrine of the core nation shapes the mix.
    const doc = window.WAR_DOCTRINE[core] || {};
    const breadth = Object.keys(SHARE).reduce((a, k) => a + SHARE[k] * make[MAKE_OF[k]], 0);
    const industry = ps.reduce((a, x) => a + Math.min(x.c.gdp * 0.35, (x.p.mfg / 100) * WORLD_MFG * 0.6) * 0.6 * x.share, 0);
    const capacity = industry * (0.35 + 0.65 * energy) * breadth; // $bn of weapons a year, before resource limits
    const w = {}; let tw = 0;
    Object.keys(SHARE).forEach(k => { w[k] = SHARE[k] * make[MAKE_OF[k]] * (doc[k] ?? 1); tw += w[k]; });
    // The plan in money, then cut to the strategic materials actually on hand: every weapon that
    // needs a resource the group doesn't have can't be built at all.
    const plan = {}, avail = {}, demand = {}, fill = {};
    Object.keys(SHARE).forEach(k => (plan[k] = tw ? (capacity * 1000 * (w[k] / tw)) / COST[k] : 0)); // a year
    RES_KEYS.forEach(r => {
      avail[r] = res[r] * (r === "steel" || r === "alu" ? 1000 : 1) * WAR_SHARE[r]; // thousand tonnes (chips: thousand sets) for arms a year
      demand[r] = Object.keys(plan).reduce((a, k) => a + plan[k] * ((NEED[k] || {})[r] || 0), 0);
      fill[r] = demand[r] > 0 ? Math.min(1, avail[r] / demand[r]) : 1;
    });
    const perYear = {}, limit = {};
    Object.keys(plan).forEach(k => {
      let f = 1, by = null;
      RES_KEYS.forEach(r => { if ((NEED[k] || {})[r] && fill[r] < f) { f = fill[r]; by = r; } });
      perYear[k] = plan[k] * f;
      limit[k] = plan[k] > 0 ? { by, f } : { by: null, f: 0 };
    });
    const perDay = {};
    Object.keys(perYear).forEach(k => (perDay[k] = perYear[k] / 365));
    // Troops: recruits trained from the population (0.6% of it a year at full mobilisation, less
    // if the country can't feed itself) plus reservists called up (2% of the reserve a day).
    perDay.troops = (ps.reduce((a, x) => a + x.c.pop, 0) * 6 * (0.4 + 0.6 * food)) / 365; // thousands a day
    perDay.reserve = ps.reduce((a, x) => a + (x.c.reserve || 0), 0) * 0.02;
    // What it lacks, by how much of its plan it can't build.
    const short = RES_KEYS.filter(r => fill[r] < 0.5).concat(fuelRatio < 0.5 ? ["oil"] : []);
    return { capacity, industry, breadth, energy, food, res, avail, demand, fill, plan, perYear, perDay, limit, make, fuelRatio, reserveDays, short, nations: ps.length };
  };
  // Who has a resource to take: the countries with the most of it.
  window.warTopProducers = (r, n) => C.map(c => [c.iso3, profile(c.iso3).res[r] || 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, n || 5);
})();
