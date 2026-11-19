// What each tank, armoured vehicle and army's infantry can actually do, from open sources (IISS,
// manufacturers, Jane's, combat records in Ukraine, Iraq, Syria and Nagorno-Karabakh).
//
// Tanks: [model pattern, firepower, protection, mobility, sights & fire control], each 0–10.
//   Firepower: gun, ammunition (modern APFSDS, gun-launched missiles). Protection: armour,
//   reactive armour, active protection (Trophy, Arena, Afganit). Mobility: power-to-weight,
//   speed, range. Sights: thermal imagers, hunter-killer fire control, battle-management links.
//   Score = 0.3 firepower + 0.35 protection + 0.15 mobility + 0.2 sights. Combat value
//   ×0.45 × e^(0.2175 × (score − 2.6)): a T-55 is 0.45, a T-72B3 about 1.0, an M1A2 SEPv3 1.8.
// Armoured vehicles: [pattern, firepower, protection, mobility, anti-tank missiles 0/1].
//   Score = 0.45 firepower + 0.35 protection + 0.2 mobility + 1 with ATGMs. Combat value
//   ×0.45 × e^(0.2 × (score − 2.8)): an M113 or MRAP about 0.5, a BMP-2 0.8, a Puma 1.5.
// First match wins, so specific variants come before their families.
window.TANK_SPECS = [
  [/SEPv3|M1A2T|M1A2 Abrams \(arriving\)/, 9, 9.5, 7, 9.5], [/M1A2|SEPv2/, 9, 9, 7, 9], [/M1A1/, 8.5, 8, 7, 7.5],
  [/Leopard 2A8|2A7|2A8/, 9, 9, 8, 9], [/Leopard 2A6|2A5|Strv 122|Leopard 2E|2SG|2A6M/, 9, 8.5, 8, 8.5], [/Leopard 2/, 8, 7, 8, 7], [/Leopard 1A5|Leopard 1/, 6, 3, 7.5, 6],
  [/Challenger 3/, 9, 9.5, 6.5, 9], [/Challenger 2/, 8, 9, 6, 8], [/Challenger 1|Al-Hussein/, 7, 7.5, 5.5, 6],
  [/K2|Black Panther/, 9, 8.5, 8, 9.5], [/K1A[12]/, 8, 7.5, 7, 8], [/K1\b/, 7, 7, 7, 7],
  [/Merkava Mk ?4|Barak/, 9, 9.5, 6.5, 9.5], [/Merkava Mk ?3/, 8, 8, 6, 8], [/Merkava Mk ?2/, 6.5, 7, 5.5, 6],
  [/Leclerc/, 8.5, 8, 8.5, 9], [/Ariete/, 7.5, 7, 7, 7], [/Type 10/, 8.5, 7.5, 8, 9], [/Type 90/, 8, 7.5, 7.5, 8], [/Type 74/, 5, 3, 6, 5],
  [/T-14|Armata/, 9, 9, 7, 8.5], [/T-90M|T-90SM|T-90A/, 8, 8, 6.5, 7.5], [/T-90|Bhishma/, 7.5, 7.5, 6, 6.5],
  [/T-80BVM|T-80U|T-80UD/, 7, 7, 8, 6.5], [/T-80/, 6.5, 6, 8, 5], [/T-84|Oplot/, 7.5, 7.5, 7.5, 7], [/T-64BM|Bulat|T-64/, 6.5, 6, 6.5, 5.5],
  [/T-72B3|B3M|T-72BME|T-72AG|T-72M4CZ|PT-91|Twardy|Pendekar|M-84|Aslan/, 7, 6.5, 6, 6], [/T-72B|T-72AV|T-72S|Zulfiqar|Ajeya|T-72M1|T-72M|T-72A\b|T-72/, 6, 5.5, 6, 4],
  [/Type 99A/, 8.5, 8, 7.5, 8.5], [/Type 99/, 8, 7.5, 7.5, 8], [/Type 96A|Type 96B|Type 96/, 7, 6, 6.5, 6.5], [/VT-4|MBT-3000/, 8, 7.5, 7, 8], [/Al-Khalid|MBT-2000|VT-1A/, 7, 6, 6.5, 6.5],
  [/Type 85|Al-Zarrar|Type 88|Type 59D|Type 69-IIG|Karrar/, 5.5, 4.5, 5.5, 5], [/Altay/, 8.5, 8, 7, 8.5], [/Arjun/, 7.5, 7, 5.5, 7.5],
  [/M60T|Sabra|M60A3 TTS|Phoenix/, 6.5, 6, 5, 6.5], [/M60A3|M60/, 6, 4, 5, 5.5], [/M48A5|M48/, 5, 3, 5, 4], [/CM-11|Brave Tiger/, 6, 4, 5, 6],
  [/AMX-30/, 5, 2.5, 6.5, 4.5], [/Chieftain/, 6, 5, 4, 5], [/Vickers/, 5, 3.5, 5, 4.5], [/OF-40/, 5.5, 3.5, 6, 5], [/TAM/, 5.5, 2.5, 7.5, 5],
  [/Olifant/, 6, 5, 5.5, 6], [/TR-85M1|Bizonul/, 5.5, 4, 5.5, 5], [/TR-85|TR-580/, 4.5, 3, 5, 3], [/Pokpung|Chonma-20|Songun/, 5.5, 4.5, 5, 4],
  [/Harimau|Sabrah|Type 15/, 6, 3, 8, 7.5], [/T-62|Chonma/, 4.5, 3, 4.5, 3], [/T-55AM/, 4.5, 4, 4.5, 4], [/T-54|T-55|Type 59|Type 69|Type 62/, 3, 2, 4, 2],
  [/PT-76|Type 63|M41|Scorpion|AMX-13|SK-105/, 3, 1, 6, 2],
];
window.AFV_SPECS = [
  [/Puma IFV|^Puma$/, 8, 8, 7, 1], [/Hunter/, 7, 6, 7, 1], [/Lynx KF41|Lynx/, 7.5, 7.5, 7, 1], [/Namer/, 5, 9.5, 6, 0], [/Eitan/, 6, 7.5, 8, 1], [/Achzarit/, 3, 8, 5.5, 0],
  [/Bradley|M2A2/, 7, 6.5, 6, 1], [/CV90|CV9030|CV9035|Strf 9040/, 7.5, 7, 7, 0], [/K21/, 7, 6, 7, 1], [/Boxer/, 6, 8, 8, 0], [/Ajax/, 7, 7, 6.5, 0],
  [/Warrior|Desert Warrior/, 6.5, 6, 5.5, 0], [/Marder/, 5.5, 5, 5.5, 1], [/Borsuk/, 7, 6, 7, 1], [/Dardo|Freccia|VBCI|Pizarro|ASCOD|Ulan/, 6.5, 6, 7, 1],
  [/Stryker/, 4, 5, 7, 0], [/Rosomak|Pars|Patria AMV|AMV|XA-360|Patria|Piranha V|Piranha|Pandur|LAV 6|LAV III|NZLAV|ASLAV|LAV/, 5, 5, 7.5, 0],
  [/ZBD-04|ZBD-05/, 7, 5.5, 6.5, 1], [/ZBL-08|Type 16|CM-32|Clouded Leopard|Terrex|Bionix|AV-8|Gempita|K806|K808|Rabdan|Enigma|Saad|Dragón|Gidrán|Guarani|Kestrel/, 5.5, 5, 7.5, 0],
  [/Centauro|Rooikat|Jaguar|AMX-10RC|Type 16 MCV|EE-9|Cascavel|Panhard|AML|ERC-90/, 6, 3.5, 8, 0],
  [/BMP-3|BMP-3F/, 8, 4, 6, 1], [/BMD-4/, 7.5, 2.5, 7, 1], [/BMD/, 6, 2.5, 7, 1], [/VCTP|TAM IFV/, 5, 4, 6.5, 0], [/BMP-2|BVP-2|Sarath/, 5, 3, 6, 1], [/BMP-1|BWP-1|Boragh|BMP\b/, 4, 3, 5.5, 1],
  [/BTR-82A|BTR-4|BTR-3|BTR-80A/, 5, 3.5, 7, 0], [/BTR-80|BTR-70|BTR-60|BTR-152|BTR-50|BTR|K200|ACV-15|ACV-300|Adnan|Type 85|Type 89|ZSL-92|WZ-551|Type 92|Type 63 APC|Type 63|VTT-323|M-2010|MLI-84|TAB-|Zimbru|Anoa|VN-1|VN-4/, 3, 2.5, 6.5, 0],
  [/AAV-7|ACV\b|ACV(?!-)/, 3.5, 3.5, 6, 0], [/AMPV|M113|YPR-765|FV430|Bulldog|Talha|Zelda|Bv206|Pbv 302|V-150|M1117/, 2, 2, 6, 0], [/MT-LB|BRDM/, 2, 1.5, 6.5, 0],
  [/Fuchs|Ratel|VAB|Condor|Sibmas|BMR|VEC|Urutu|EE-11|Simba|Fahd|Al-Fahd/, 3, 2.5, 7, 0], [/Griffon|Serval|VBM/, 4, 5, 7.5, 0],
  [/JLTV|MRAP|M-ATV|MaxxPro|Bushmaster|Hawkei|Kirpi|Vuran|Nimr|Typhoon|Foxhound|Kozak|Casspir|Mamba|RG-31|Cobra|Matador|Arlan|Nomad|Spartan|Unicorn|Ejder|TAPV|Mengshi|Otokar/, 2, 4, 7, 0],
  [/Dingo|Wiesel|Fennek|VBL|Lince|Eagle|Tigr|Sandcat|Light|light|Humvee|Hummer|Komodo|Cayman|DN-XI|Jackal|MAV-1|Older|older/, 1.5, 2, 7.5, 0],
];
window.groundSpec = (key, model) => {
  const T = key === "tanks" ? window.TANK_SPECS : key === "afv" ? window.AFV_SPECS : null;
  if (!T) return null;
  const parts = [model].concat(String(model).split(/\s*\/\s*|\s*&\s*/));
  for (const p of parts) {
    const r = T.find(([re]) => re.test(p));
    if (!r) continue;
    if (key === "tanks") {
      const score = 0.3 * r[1] + 0.35 * r[2] + 0.15 * r[3] + 0.2 * r[4];
      return { ratings: { firepower: r[1], protection: r[2], mobility: r[3], sights: r[4] }, score, mult: 0.45 * Math.exp(0.2175 * (score - 2.6)) };
    }
    const score = 0.45 * r[1] + 0.35 * r[2] + 0.2 * r[3] + r[4];
    return { ratings: { firepower: r[1], protection: r[2], mobility: r[3], atgm: r[4] }, score, mult: 0.45 * Math.exp(0.2 * (score - 2.8)) };
  }
  return null;
};

// Infantry: [training, combat experience, kit], each 0–10, and why.
//   Training: length and realism of training, professional vs short-service conscripts, NCOs.
//   Experience: recent large-scale combat. Kit: night vision, body armour, radios, anti-tank
//   and anti-air missiles and drones at squad level.
//   Infantry fight ×(0.8 + 0.04 × the average), on top of the country's tech and readiness:
//   ×0.92 for a poorly trained, poorly equipped army, ×1.16 for the best.
window.INFANTRY = {
  USA: [9, 7, 10, "All-volunteer, long training; two decades of combat in Iraq and Afghanistan; night vision, Javelin and Stinger at squad level"],
  GBR: [9, 6, 9, "Professional, Iraq and Afghanistan veterans, NLAW and Javelin"], FRA: [8.5, 7, 8.5, "Professional, constant operations in the Sahel and Middle East"],
  ISR: [8.5, 9, 9, "Conscripts with a large trained reserve; years of combat in Gaza and Lebanon"], AUS: [8.5, 5, 8.5, "Small, professional, Afghanistan veterans"],
  CAN: [8, 4, 8, "Professional, Afghanistan veterans"], DEU: [7, 3, 7.5, "Professional but under-exercised and short of kit"], NLD: [7.5, 3, 8, "Professional"],
  FIN: [8, 2, 7.5, "Conscripts with one of Europe's best-trained reserves, built for forest and winter war"], SWE: [7.5, 1, 8, "Professional core with returning conscription"],
  NOR: [8, 2, 8, "Selective conscription, arctic training"], POL: [7, 3, 7.5, "Professional, fast-growing, Western kit"], EST: [7.5, 2, 7.5, "Conscripts and a strong volunteer Defence League"],
  LTU: [7, 2, 7.5, "Conscripts and volunteers, Western kit"], LVA: [7, 2, 7, "Small professional force and national guard"], ITA: [7, 3, 7.5, "Professional"], ESP: [7, 3, 7.5, "Professional"],
  GRC: [6, 1, 6, "Conscripts"], TUR: [6.5, 7, 7, "Conscripts and professionals, combat in Syria, Iraq and against the PKK"],
  KOR: [7, 2, 7.5, "18-month conscripts, well equipped"], JPN: [7.5, 1, 7.5, "Professional, no combat experience"], TWN: [4.5, 1, 6, "Short-service conscripts, training lengthened to a year in 2024"],
  SGP: [7.5, 1, 8, "Conscripts, well trained and equipped"], CHN: [6, 1, 7, "Large, increasingly professional, no war since 1979"],
  RUS: [5, 8, 6, "Mass of contract soldiers and mobilised men with short training, hardened by the war in Ukraine; drones everywhere"],
  UKR: [6.5, 9, 7, "Battle-hardened by years of full-scale war, Western weapons and drones; many new recruits barely trained"],
  BLR: [5, 1, 5, "Conscripts, Soviet-style"], IND: [6.5, 5, 5, "Professional volunteers with counter-insurgency and Line of Control experience, kit uneven"],
  PAK: [6.5, 6, 4.5, "Professional, long counter-insurgency experience"], IRN: [5, 5, 4.5, "Conscripts and IRGC volunteers, Syrian and Iraqi experience"],
  PRK: [5, 3, 3, "Huge, long-service conscripts, old kit; some combat in Kursk in 2024–25"], SAU: [4, 5, 6.5, "Well equipped, weakly trained; Yemen war"],
  ARE: [6, 6, 7.5, "Small, well-equipped professional force, Yemen experience"], QAT: [5, 2, 7, "Small, well-equipped"], EGY: [4.5, 5, 4.5, "Large conscript army, Sinai counter-insurgency"],
  IRQ: [4, 7, 4, "War against ISIS; uneven training"], SYR: [3, 7, 2.5, "Battered by civil war"], JOR: [7, 3, 6, "Professional, special forces well regarded"],
  AZE: [6, 7, 6, "Won the 2020 and 2023 wars with Turkish and Israeli training, drones"], ARM: [5, 6, 4, "Conscripts, defeated in 2020"], GEO: [6, 5, 5, "NATO-trained, Iraq and Afghanistan rotations"],
  VNM: [6, 2, 4, "Large conscript army"], BRA: [5.5, 2, 5, "Conscripts and professionals, peacekeeping"], COL: [6.5, 7, 5.5, "Decades of counter-insurgency"],
  MEX: [5, 5, 5, "Fighting the cartels"], NGA: [4, 6, 3, "Fighting Boko Haram and bandits"], ETH: [5, 7, 3, "Hardened by the Tigray war"], ERI: [5, 6, 2, "Indefinite national service"],
  CUB: [5.5, 2, 3, "Conscripts, old kit"], VEN: [3.5, 1, 3, "Poorly trained, poorly paid"], MMR: [3, 7, 2.5, "Fighting a civil war, losing ground"], SDN: [3, 7, 2, "Civil war"],
  LBY: [3, 6, 3, "Militia-based"], AFG: [4, 8, 3, "Taliban: veteran insurgents with captured US kit"], YEM: [4, 8, 3, "Houthis: hardened by years of war"],
  PHL: [5, 6, 4, "Counter-insurgency in Mindanao"], IDN: [5.5, 4, 4.5, "Large professional army"], THA: [5, 3, 5, "Conscripts"], MYS: [5.5, 2, 5, "Professional"],
  BGD: [5, 2, 4, "Professional, many peacekeepers"], MAR: [5.5, 4, 5, "Western Sahara experience"], DZA: [5.5, 4, 5, "Conscripts, counter-terrorism experience"],
  ZAF: [5, 3, 5, "Professional, underfunded"], KEN: [5.5, 5, 4, "Somalia operations"],
};
window.infantryFactor = iso => {
  const r = window.INFANTRY[iso];
  return r ? 0.8 + 0.04 * ((r[0] + r[1] + r[2]) / 3) : 1;
};
