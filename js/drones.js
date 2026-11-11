// Drone technology by country. Drones have changed war since 2020 (Nagorno-Karabakh, Ukraine,
// the Red Sea): cheap FPV and loitering munitions hunt armour and artillery, strike drones hit
// deep, naval drones sink warships, and the side with better jamming and interceptors blunts them.
// [tech level 0–10, war production in thousand drones a year (mostly small FPV / loitering
//  munitions), counter-drone defence 0–10 (jamming, interceptors, lasers, guns), key systems].
// Figures are rounded public estimates (2024–25). Countries not listed: from technology level.
window.DRONE_TECH = {
  UKR: [10, 4000, 8, "Millions of FPV drones a year, Liutyi and other long-range strike drones, Magura and Sea Baby naval drones that drove Russia's fleet from the western Black Sea, interceptor drones"],
  RUS: [8, 2000, 8, "Geran-2 (licence-built Shahed) at thousands a month, Lancet loitering munitions, Orlan-10 scouts, fibre-optic FPV drones immune to jamming, dense electronic warfare"],
  USA: [9, 300, 8, "MQ-9 Reaper, MQ-1C Gray Eagle, RQ-4 Global Hawk, Switchblade loitering munitions, the 2025 'drone dominance' drive for mass small drones, Coyote interceptors"],
  CHN: [9, 3000, 8, "The world's largest drone industry (DJI), Wing Loong and CH-series strike drones, WZ-7 and WZ-8 high-altitude scouts, swarm and drone-carrier programmes"],
  ISR: [9, 150, 9, "Pioneer of military drones: Heron, Hermes, Harop and Harpy loitering munitions; Iron Dome and the Iron Beam laser against drones"],
  TUR: [8, 200, 7, "Bayraktar TB2, TB3 and Akıncı, Anka, Kızılelma jet drone and Kargu loitering munitions; the world's leading strike-drone exporter"],
  IRN: [7, 600, 5, "Designed the Shahed-136 one-way attack drone, Mohajer-6 and Shahed-129; mass production that supplies Russia, the Houthis and Hezbollah"],
  GBR: [7, 60, 7, "Protector (MQ-9B), Stormshroud, the DragonFire laser; supplies drones to Ukraine"], FRA: [6, 40, 7, "MQ-9 Reapers, Patroller, new loitering munitions; drone interceptor programmes"],
  DEU: [6, 60, 6, "Heron TP, Helsing HX-2 and Stark Virtus strike drones in production"], POL: [7, 80, 7, "WB Group Warmate loitering munitions and FlyEye scouts; drone-wall plans on its eastern border"],
  AZE: [7, 30, 6, "Won the 2020 war with Bayraktar TB2 and Harop drones"], ARE: [6, 30, 7, "Large Chinese and Turkish drone fleets; EDGE group drones"],
  AUS: [7, 30, 6, "MQ-28 Ghost Bat loyal wingman and Ghost Shark undersea drones"], KOR: [7, 80, 7, "Strike and scout drones; a drone command formed in 2023 after North Korean incursions"],
  TWN: [6, 100, 6, "Mass drone programme for a 'porcupine' defence"], JPN: [6, 30, 7, "MQ-9B SeaGuardian and growing drone budgets"], IND: [6, 100, 6, "Nagastra loitering munitions, Heron and MQ-9B, drone swarms used against Pakistan in 2025"],
  PAK: [6, 40, 6, "Shahpar, Bayraktar TB2 and Akıncı, Chinese CH-4 and Wing Loong"], SAU: [5, 20, 7, "Chinese Wing Loong and a local Saqr line; heavy Patriot and gun defences against Houthi drones"],
  EGY: [4, 10, 5, "Chinese Wing Loong strike drones"], MAR: [5, 10, 5, "Bayraktar TB2, Heron and Chinese drones"], ETH: [5, 10, 4, "Bayraktar TB2, Wing Loong and Iranian Mohajer drones used in the Tigray war"],
  NLD: [6, 20, 6, "MQ-9 Reapers and drone units"], ITA: [6, 20, 6, "MQ-9 Reapers and Leonardo drones"], ESP: [5, 15, 6, "SIRTAP and MQ-9 Reapers"], SWE: [6, 20, 6, "Drone units in every brigade"],
  FIN: [6, 20, 6, "Rapidly building drone forces"], NOR: [5, 10, 6, "Black Hornet nano drones (made in Norway)"], EST: [6, 20, 6, "Drone-wall and FPV training with Ukrainian lessons"], LTU: [6, 20, 6, "Mass FPV drone production and training"],
  LVA: [6, 20, 6, "National drone coalition with Ukraine"], CAN: [5, 15, 5, "MQ-9B on order"], SGP: [6, 10, 7, "Heron and Hermes drones; dense air defence"], BLR: [4, 20, 6, "Russian drones and EW"],
  PRK: [4, 30, 4, "Copies of US Global Hawk and Reaper shown in 2023; Russian help with Shahed-type drones"], KAZ: [3, 5, 4, "Chinese and Turkish drones"], DZA: [4, 5, 5, "Chinese CH-4 and CH-5 drones"],
  NGA: [4, 5, 3, "Chinese Wing Loong and CH-3 drones against insurgents"], IRQ: [3, 5, 4, "Chinese CH-4 drones"], SYR: [2, 2, 2, "Few drones left"], LBY: [3, 5, 3, "Turkish and Emirati drones from the civil war"],
  SDN: [3, 5, 3, "Iranian and Turkish drones in the civil war"], MMR: [3, 5, 3, "Rebels and the junta both fight with cheap drones"], VNM: [4, 10, 4, "Local scout drones"], IDN: [4, 5, 4, "Chinese CH-4 and Turkish Anka drones"],
  BRA: [3, 5, 4, "Israeli Hermes scouts"], MEX: [2, 2, 3, "Cartels fly armed drones too"], GRC: [5, 10, 6, "Local Archytas drones, Heron"], ARM: [3, 5, 3, "Lost the 2020 war to Azerbaijan's drones"],
  QAT: [5, 10, 6, "Bayraktar TB2"], KWT: [4, 5, 6, "Bayraktar TB2"], JOR: [4, 5, 5, "Chinese CH-4 drones"], YEM: [5, 20, 2, "Houthi-made Samad and Iranian-designed drones that hit ships in the Red Sea"],
};
window.droneTech = iso => {
  const t = window.DRONE_TECH[iso];
  if (t) return { level: t[0], prod: t[1], counter: t[2], note: t[3], known: true };
  const g = (window.COUNTRIES || []).find(c => c.iso3 === iso), gen = g && g.tech ? g.tech.gen : 2;
  const level = Math.max(0, Math.min(4, Math.round((gen - 2) * 1.5)));
  return { level, prod: level, counter: Math.max(0, level - 1), note: level ? "A few imported scout and strike drones" : "No military drone force to speak of", known: false };
};
// Which weather keeps drones on the ground (share still flying).
window.DRONE_WEATHER = { clear: 1, frost: 0.9, rain: 0.7, fog: 0.7, snow: 0.6, mud: 1, heat: 0.9, storm: 0.25, blizzard: 0.15, sandstorm: 0.2, monsoon: 0.3, cyclone: 0.05 };
