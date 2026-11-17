// Radar and early-warning sites. Every air force watches its airspace with long-range
// air-surveillance radars, usually at air and air-defence bases and along borders and coasts, about
// one per 200–300 km; a few powers also run strategic early-warning radars that see ballistic
// missiles thousands of kilometres out. A country's radar coverage (sites it has / sites it needs)
// sharpens its air defence and its warning of attacks (js/game.js).

// Sites a country needs for full coverage: √(area) / 80 × (0.5 + air-defence rating / 12).
// Russia ≈ 55, the US ≈ 45, China ≈ 42, India ≈ 22, Germany ≈ 7, Israel ≈ 3.
window.AREA_KM2 = { AFG: 642058, AGO: 1249380, ALB: 28337, AND: 441, ARE: 71265, ARG: 2782703, ARM: 29568, ATG: 433, AUS: 7706012, AUT: 83901, AZE: 86400, BDI: 27217, BEL: 30627, BEN: 116553, BFA: 273690, BGD: 135674, BGR: 112424, BHR: 544, BHS: 12657, BIH: 51690, BLR: 206698, BLZ: 22770, BOL: 1090271, BRA: 8499400, BRB: 388, BRN: 5669, BTN: 39870, BWA: 580622, CAF: 620987, CAN: 9872102, CHE: 41215, CHL: 737442, CHN: 9371225, CIV: 322298, CMR: 465902, COD: 2334703, COG: 346857, COL: 1139434, COM: 1582, CPV: 3587, CRI: 51511, CUB: 109285, CYP: 5710, CZE: 78487, DEU: 356163, DJI: 21693, DMA: 688, DNK: 42411, DOM: 48592, DZA: 2322788, ECU: 255658, EGY: 1003707, ERI: 123678, ESP: 506178, EST: 45442, ETH: 1131761, FIN: 330482, FJI: 18398, FRA: 635064, FSM: 524, GAB: 260715, GBR: 239616, GEO: 69297, GHA: 239589, GIN: 244938, GMB: 10324, GNB: 32044, GNQ: 26637, GRC: 130177, GRD: 288, GTM: 108520, GUY: 211930, HND: 113531, HRV: 54414, HTI: 26822, HUN: 92966, IDN: 1872242, IND: 3155807, IRL: 68700, IRN: 1622847, IRQ: 437462, ISL: 101161, ISR: 22284, ITA: 300267, JAM: 10935, JOR: 88856, JPN: 370074, KAZ: 2712747, KEN: 594848, KGZ: 198661, KHM: 181373, KIR: 941, KNA: 234, KOR: 97165, KWT: 17330, LAO: 228928, LBN: 10010, LBR: 95648, LBY: 1626369, LCA: 552, LIE: 138, LKA: 66046, LSO: 30020, LTU: 64519, LUX: 2614, LVA: 64254, MAR: 582378, MCO: 12, MDA: 33115, MDG: 594622, MDV: 67, MEX: 1962279, MHL: 236, MKD: 25366, MLI: 1258185, MLT: 276, MMR: 662746, MNE: 13663, MNG: 1560428, MOZ: 790643, MRT: 1038352, MUS: 1880, MWI: 119763, MYS: 327621, NAM: 824750, NER: 1185111, NGA: 911496, NIC: 129225, NLD: 37132, NOR: 384264, NPL: 147193, NRU: 28, NZL: 266828, OMN: 312041, PAK: 873772, PAN: 74235, PER: 1296279, PHL: 290318, PLW: 343, PNG: 464271, POL: 312566, PRK: 122496, PRT: 90766, PRY: 400900, PSE: 6336, QAT: 11076, ROU: 235752, RUS: 16879701, RWA: 25377, SAU: 1925871, SDN: 1863027, SEN: 197300, SGP: 484, SLB: 25732, SLE: 71877, SLV: 20401, SMR: 70, SOM: 473622, SRB: 77481, SSD: 623998, STP: 979, SUR: 145559, SVK: 48337, SVN: 20198, SWE: 442970, SWZ: 17007, SYC: 172, SYR: 185733, TCD: 1270927, TGO: 57156, THA: 515720, TJK: 142300, TKM: 470600, TLS: 15018, TON: 431, TTO: 5102, TUN: 156653, TUR: 779797, TWN: 36005, TZA: 945781, UGA: 242568, UKR: 570135, URY: 177569, USA: 9439424, UZB: 447381, VAT: 1, VCT: 312, VEN: 914310, VNM: 328959, VUT: 11266, WSM: 2705, YEM: 454139, ZAF: 1221609, ZMB: 755593, ZWE: 390202 };
window.RADARS_NEEDED = c => {
  const ad = (c.missiles && c.missiles.ad) || 0, a = window.AREA_KM2[c.iso3] || 0;
  return ad <= 0 || !a ? 0 : Math.max(1, Math.round((Math.sqrt(a) / 80) * (0.5 + ad / 12)));
};
window.RADAR_RX = /radar|РЛС|радіолокац|радиолокац|радиотехн|雷达|레이더|رادار|early.warning|Fylingdales|PAVE PAWS|AN\/FPS|AN\/TPY|Green Pine|Globus|Daryal|Don-2N|Voronezh-?(M|DM|VP)? radar/i;
window.isRadarSite = z => window.RADAR_RX.test(z.name) || /^(Radar station|Early-warning radar|Radar \/ signals site)/.test(z.note || "");
window.isEarlyWarning = z => /^Early-warning radar/.test(z.note || "") || /Fylingdales|PAVE PAWS|Don-2N|Daryal|Voronezh-?(M|DM|VP)? radar|Cobra Dane|Green Pine|Globus/i.test(z.name);

// Strategic early-warning radars, from public sources (positions approximate to a few km).
window.EARLY_WARNING = {
  USA: [["Clear Space Force Station (UEWR, LRDR)", -149.19, 64.29], ["Beale AFB PAVE PAWS", -121.35, 39.14], ["Cape Cod Space Force Station PAVE PAWS", -70.54, 41.75],
    ["Cavalier Space Force Station (PARCS)", -97.9, 48.72], ["Eareckson Air Station (Cobra Dane)", 174.09, 52.72]],
  RUS: [["Lekhtusi Voronezh-M radar", 30.55, 60.28], ["Armavir Voronezh-DM radar", 40.98, 44.93], ["Pionersky Voronezh-DM radar", 20.18, 54.86],
    ["Mishelevka Voronezh-VP radar", 103.27, 52.88], ["Yeniseysk Voronezh-DM radar", 92.05, 58.51], ["Barnaul Voronezh-DM radar", 83.0, 52.85],
    ["Orsk Voronezh-M radar", 58.96, 51.27], ["Vorkuta Voronezh-M radar", 64.03, 67.57], ["Olenegorsk early-warning radar", 33.91, 68.11],
    ["Pechora Daryal radar", 57.29, 65.21], ["Sofrino Don-2N radar", 37.77, 56.17]],
  CHN: [["Korla large phased-array radar", 86.24, 41.64], ["Shuangyashan large phased-array radar", 131.15, 46.53], ["Lin'an large phased-array radar", 119.13, 30.28]],
  JPN: [["Shimokoshiki J/FPS-5", 129.7, 31.67], ["Sado J/FPS-5", 138.37, 38.02], ["Ominato J/FPS-5", 141.13, 41.25], ["Yozadake J/FPS-5", 127.7, 26.13],
    ["Shariki AN/TPY-2 (US)", 140.32, 40.89], ["Kyogamisaki AN/TPY-2 (US)", 135.22, 35.77]],
  ISR: [["Mount Keren AN/TPY-2 (US)", 34.72, 30.85], ["Green Pine radar (Palmachim)", 34.69, 31.9]],
  TUR: [["Kürecik AN/TPY-2 (NATO)", 37.52, 38.18]],
  NOR: [["Vardø Globus radar", 31.11, 70.37]],
  TWN: [["Leshan PAVE PAWS", 121.15, 24.47]],
};
window.DEPLOYMENTS_EW = {};
Object.entries(window.EARLY_WARNING).forEach(([iso, list]) => {
  window.DEPLOYMENTS_EW[iso] = list.map(([name, lon, lat]) => [name, lon, lat, 0.1, 0, 0, "Early-warning radar (public): a strategic radar that tracks ballistic missiles and aircraft thousands of kilometres out."]);
  window.DEPLOYMENTS[iso] = (window.DEPLOYMENTS[iso] || []).concat(window.DEPLOYMENTS_EW[iso]);
});
