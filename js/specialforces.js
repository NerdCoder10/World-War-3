// Special forces of every country, from open sources (official histories, IISS, unit histories,
// public after-action reporting). Each unit: [name, operators, training 0–10, proven 0–10, record].
//   Operators: approximate trained operators (not support staff); public estimates, rounded.
//   Training: selection and training standard (selection rate, length, realism, specialisation).
//   Proven: what the unit has actually done in combat: famous raids, rescues and campaigns count;
//   failures, massacres of hostages and units that broke under pressure count against it.
// Proven record carries most of the weight: quality = (0.35 × training + 0.65 × proven) / 10, and a
// unit's effective strength is operators × quality⁶, so a few hundred proven operators (Delta,
// the SAS, Sayeret Matkal) outweigh tens of thousands of untested or mediocre ones.
// Countries not listed get a modelled estimate from their army's size and readiness.
window.SPECIAL_FORCES = {
  USA: [
    // Operators are the trained assaulters, aircrews and specialists, not the support staff around them
    // (analysts' estimates: Naylor's "Relentless Strike", CRS, SOCOM posture statements).
    ["1st SFOD-D (Delta Force)", 400, 10, 10, "~400 operators of ~1,800 personnel. Al-Baghdadi raid 2019, Saddam's capture 2003, Task Force 714's thousands of raids in Iraq"],
    ["DEVGRU (SEAL Team Six)", 300, 10, 10, "~300 operators of ~1,800. Bin Laden raid 2011, Captain Phillips rescue 2009, hostage rescues in Somalia and Nigeria"],
    ["Intelligence Support Activity", 300, 9.5, 9.5, "JSOC's human and signals intelligence unit; found targets for the hunts of Saddam, Zarqawi and others"],
    ["24th Special Tactics Squadron", 150, 10, 9.5, "JSOC's air force operators: controllers and rescuemen with Delta and DEVGRU"],
    ["Navy SEALs", 2200, 9.5, 9.5, "Continuous combat since 2001; Red Sea boardings in 2024"],
    ["Army Special Forces (Green Berets)", 5500, 9, 9.5, "~5,500 qualified operators in 7 groups. Toppled the Taliban in 2001 with a few hundred men; trained armies worldwide"],
    ["75th Ranger Regiment", 3500, 9, 9.5, "Mogadishu 1993, Panama, thousands of raids since 2001"],
    ["160th SOAR (Night Stalkers)", 1000, 10, 10, "~1,000 aircrew of ~3,000. The world's best special-operations aviation; flew the bin Laden raid"],
    ["AFSOC Special Tactics", 600, 9.5, 9, "Combat controllers and pararescue on every major operation"],
    ["MARSOC Raiders", 850, 9, 8.5, "Afghanistan, Iraq, Syria"],
    ["82nd Airborne Division", 15000, 8.5, 8.5, "Grenada, Panama, Iraq, Afghanistan; held Kabul airport in the 2021 evacuation; the global response force, ready in 18 hours"],
    ["101st Airborne Division (Air Assault)", 17000, 8.5, 8.5, "Iraq 2003 and Mosul, Afghanistan; the army's helicopter-borne assault division"],
    ["173rd Airborne Brigade", 3500, 8.5, 8, "Jumped into northern Iraq in 2003; Afghanistan; Europe's ready brigade"],
  ],
  GBR: [
    ["22 SAS", 350, 10, 10, "Iranian Embassy siege 1980, Falklands, Iraq 2003–09 (Task Force Black), Afghanistan"],
    ["Special Boat Service", 250, 10, 9.5, "Falklands, Sierra Leone 2000, Afghanistan, ship boardings"],
    ["Special Reconnaissance Regiment", 300, 9, 8.5, "Northern Ireland and Iraq surveillance"],
    ["Special Forces Support Group", 800, 8.5, 8.5, "Iraq and Afghanistan"],
    ["Parachute Regiment", 2000, 8, 8.5, "Falklands (Goose Green), Afghanistan"],
  ],
  ISR: [
    ["Sayeret Matkal", 300, 10, 10, "Entebbe 1976, Sabena 1972, countless deep raids"],
    ["Shayetet 13", 400, 10, 9.5, "Naval commandos: ship seizures, raids in Lebanon and Syria"],
    ["Shaldag", 300, 9.5, 9.5, "Air force commandos, target designation deep in enemy territory"],
    ["YAMAM", 200, 9.5, 9.5, "Counter-terror unit; Nuseirat hostage rescue 2024"],
    ["Unit 669", 150, 9, 9, "Combat rescue under fire"],
    ["Duvdevan, Maglan, Egoz (Commando Brigade)", 900, 9, 9, "Years of combat in Gaza and Lebanon"],
  ],
  FRA: [
    ["1er RPIMa", 600, 9, 9, "Sahel (Serval, Barkhane), Afghanistan"],
    ["Commandos Marine", 650, 9, 9, "Hostage rescues off Somalia, Sahel raids"],
    ["GIGN", 400, 9.5, 9.5, "Air France 8969 rescue 1994, Charlie Hebdo and Hyper Cacher 2015"],
    ["13e RDP", 500, 9, 8.5, "Deep reconnaissance in Africa and Afghanistan"],
    ["CPA 10", 150, 9, 8.5, "Air force commandos"],
    ["2e REP (Foreign Legion paratroopers)", 1300, 8.5, 9, "Kolwezi 1978, Mali 2013"],
  ],
  DEU: [
    ["GSG 9", 400, 9.5, 9, "Mogadishu (Landshut) rescue 1977"],
    ["KSK", 300, 9, 7.5, "Afghanistan; Kabul evacuation 2021; disbanded a company over extremism in 2020"],
    ["KSM (naval)", 120, 9, 7, "Maritime counter-terror"],
    ["Fallschirmjäger", 4000, 7.5, 6, "Afghanistan, Mali"],
  ],
  POL: [
    ["GROM", 400, 9.5, 9, "Seized Umm Qasr's oil platforms in 2003; Iraq and Afghanistan"],
    ["JW Komandosów", 500, 8.5, 8, "Afghanistan"], ["JW Formoza", 150, 9, 7.5, "Naval commandos"], ["JW Agat", 250, 8, 6, "Direct action"],
  ],
  AUS: [["SASR", 700, 9.5, 9, "East Timor, Iraq, Afghanistan (marred by the Brereton war-crimes report)"], ["2nd Commando Regiment", 1200, 9, 8.5, "Afghanistan"], ["1st Commando Regiment", 300, 8, 7, "Reserve commandos"]],
  CAN: [["JTF 2", 400, 9.5, 9, "Afghanistan, Iraq"], ["CSOR", 500, 8.5, 8, "Afghanistan, training missions"]],
  NZL: [["NZSAS", 150, 9.5, 9, "Afghanistan, Kabul 2011 hotel attack"]],
  NLD: [["KCT (Korps Commandotroepen)", 300, 9, 8, "Afghanistan, Mali"], ["NLMARSOF", 150, 9, 7.5, "Maritime special operations"]],
  BEL: [["Special Operations Regiment", 600, 8.5, 7, "Congo, Afghanistan, Sahel"]],
  NOR: [["FSK", 150, 9.5, 9, "Afghanistan: Kabul crisis response unit"], ["MJK", 100, 9.5, 9, "Afghanistan, Iraq"]],
  DNK: [["Jægerkorpset", 150, 9.5, 8.5, "Afghanistan, Iraq"], ["Frømandskorpset", 100, 9.5, 8, "Maritime raids"]],
  SWE: [["SOG", 120, 9, 7, "Afghanistan, Congo"], ["Parachute Rangers", 300, 8.5, 5, "Reconnaissance"]],
  FIN: [["Utti Jaeger Regiment special jaegers", 400, 9, 4, "Elite selection, no combat"]],
  EST: [["ESTSOF", 150, 8.5, 7, "Afghanistan, Mali"]], LTU: [["Aitvaras (SOF)", 150, 8.5, 6.5, "Afghanistan"]], LVA: [["Special Tasks Unit", 100, 8, 6, "Afghanistan"]],
  ITA: [["9th Col Moschin", 400, 9, 8.5, "Afghanistan, Iraq, Somalia"], ["GOI (COMSUBIN)", 200, 9.5, 8.5, "Naval raids, piracy rescues"], ["GIS Carabinieri", 120, 9, 8, "Counter-terror"], ["4th Alpini Rangers", 600, 8, 7.5, "Afghanistan"]],
  ESP: [["MOE (Army special operations)", 600, 8.5, 7.5, "Afghanistan, Iraq, Bosnia"], ["FGNE (naval)", 100, 9, 8, "Piracy operations off Somalia"], ["GEO (police)", 150, 9, 8, "Counter-terror"]],
  PRT: [["Special Operations Troops Centre", 200, 8, 6, "Afghanistan, Central African Republic"]],
  GRC: [["13 MYK and Raider Force", 1600, 8, 4, "No recent combat"]],
  TUR: [
    ["Special Forces Command (Maroon Berets)", 6000, 8.5, 8.5, "Euphrates Shield, Olive Branch and Peace Spring in Syria; northern Iraq raids"],
    ["Gendarmerie JÖAK", 3000, 8, 8.5, "Decades of counter-PKK operations"], ["SAT / SAS naval commandos", 400, 9, 8, "Maritime raids"], ["Police PÖH", 5000, 7.5, 8, "Counter-terror, 2016 coup night"],
  ],
  RUS: [
    ["KSSO (Special Operations Forces)", 1500, 8.5, 8, "Seized Crimea in 2014 with few shots; Syria (Palmyra)"],
    ["GRU Spetsnaz brigades", 17000, 7, 6.5, "Chechnya, Georgia 2008; very heavy losses fighting as line infantry in Ukraine"],
    ["FSB Alpha and Vympel", 800, 8.5, 6.5, "Beslan 2004 and the Moscow theatre siege 2002 ended with hundreds of hostages dead"],
    ["VDV airborne", 45000, 7, 6, "The Hostomel airport assault of 2022 failed; heavy losses"],
    ["Naval infantry", 12000, 6.5, 5.5, "Ground down at Vuhledar in 2022–23"],
  ],
  UKR: [
    ["Special Operations Forces (SSO)", 4000, 8.5, 9, "Raids on Snake Island and Crimea, drone-guided strikes, operations in Sudan"],
    ["HUR special units (Kraken and others)", 3000, 8, 9, "Raids into Russia and Crimea, the 2023 Black Sea gas-rig raids"],
    ["SBU Alpha", 1000, 8, 8.5, "Sabotage and drone strikes deep in Russia (Operation Spiderweb 2025)"],
    ["Air Assault Forces", 30000, 7.5, 8.5, "Kherson counter-offensive 2022, Kursk incursion 2024"],
  ],
  BLR: [["5th Spetsnaz Brigade and SOF", 2500, 7, 4, "No real combat test"]],
  CHN: [
    ["PLA special operations brigades (Siberian Tiger, Falcon, Sword of the Southern Sky...)", 15000, 7.5, 3, "Very hard training and competition wins, but no combat since 1979"],
    ["Jiaolong naval commandos", 1000, 8, 4, "Anti-piracy in the Gulf of Aden, Yemen evacuation 2015"],
    ["Snow Leopard Commando Unit (PAP)", 1000, 8, 4, "Counter-terror"],
    ["PLA Airborne Corps", 35000, 7, 2, "Untested"],
  ],
  IND: [
    ["Para (Special Forces)", 6000, 8.5, 8.5, "Myanmar cross-border raid 2015, 2016 surgical strikes across the Line of Control"],
    ["Special Frontier Force", 10000, 8, 8.5, "Bangladesh 1971; seized heights at Pangong in Ladakh in 2020"],
    ["MARCOS", 1200, 9, 8.5, "Mumbai 2008, piracy rescues (MV Lila Norfolk 2024)"],
    ["National Security Guard", 7500, 8.5, 7.5, "Mumbai 2008, Pathankot 2016"], ["Garud Commando Force", 1500, 8, 7, "Kashmir"],
  ],
  PAK: [["Special Service Group", 3000, 8.5, 8, "Swat 2009, Waziristan, the 2009 GHQ siege"], ["SSG(N) naval commandos", 400, 8.5, 7.5, "Maritime counter-terror"]],
  BGD: [["1st Para-Commando Battalion", 800, 7.5, 6, "Holey Artisan Bakery 2016"]],
  LKA: [["Commando and Special Forces Regiments", 4000, 8, 9, "Long-range raids that broke the Tamil Tigers by 2009"]],
  IRN: [
    ["IRGC Quds Force", 5000, 7.5, 8, "Built and led proxy forces in Iraq, Syria, Lebanon and Yemen"],
    ["IRGC Saberin", 2000, 7.5, 7, "Syria"], ["Army 65th Airborne (NOHED)", 3000, 7, 6, "Syria advisers"], ["Navy Takavaran", 1000, 7, 5, "Gulf boarding operations"],
  ],
  IRQ: [["Counter-Terrorism Service (Golden Division)", 10000, 8, 9, "Spearheaded the liberation of Mosul from ISIS in 2016–17"]],
  SYR: [["Transitional government commando units", 1000, 6, 7, "Led the December 2024 offensive that took Damascus"]],
  JOR: [["Special Task Force and Royal Special Forces", 2000, 8.5, 8, "Well regarded; trains other armies"]],
  SAU: [["Special Forces Command", 3000, 6.5, 5, "Yemen war, mixed results"]],
  ARE: [["Presidential Guard (and special operations)", 5000, 8, 8, "Retook Aden in 2015, Yemen campaign"]],
  QAT: [["Special Forces", 300, 7, 5, "Libya 2011"]],
  EGY: [["Unit 777 and Thunderbolt Forces", 15000, 7, 5.5, "Sinai insurgency; the 1978 Larnaca raid was a disaster"]],
  AZE: [["Special Forces", 3000, 8, 8.5, "Took Shusha on foot through the mountains in 2020"]],
  ARM: [["Special forces", 1000, 7, 5.5, "Fought in 2020, lost"]],
  GEO: [["Special Operations Forces", 1500, 8, 7, "Iraq and Afghanistan rotations"]],
  KAZ: [["Arystan and special forces", 1500, 7, 4, "January 2022 unrest"]],
  KOR: [
    ["UDT/SEAL", 600, 9, 7.5, "Operation Dawn of Gulf of Aden 2011: every hostage freed"],
    ["707th Special Mission Group", 300, 9, 6.5, "Counter-terror"], ["Special Warfare Command brigades", 10000, 8.5, 5, "Infiltration training; no recent combat"],
  ],
  PRK: [["Special Operations Forces and Reconnaissance General Bureau", 100000, 6.5, 3, "Mass light infantry; the 1968 Blue House raid failed; very heavy losses in Kursk in 2024–25"]],
  JPN: [["Special Forces Group and Special Boarding Unit", 400, 8.5, 2, "Untested"]],
  TWN: [["Amphibious Reconnaissance and Airborne Special Service", 900, 8, 2, "Untested"]],
  SGP: [["Special Operations Force and Commandos", 1700, 8.5, 5, "SQ117 hijack 1991: every hostage freed, the four hijackers killed in 30 seconds"]],
  IDN: [["Kopassus", 5000, 8.5, 8, "Woyla hijack rescue 1981, Aceh, Papua (with a poor human-rights record)"], ["Kopaska and Denjaka", 500, 8.5, 7, "Naval special forces"]],
  MYS: [["PASKAL and Grup Gerak Khas", 2000, 8, 6.5, "MV Bunga Laurel rescue 2011, Lahad Datu 2013"]],
  THA: [["Royal Thai special forces and Navy SEALs", 1000, 7.5, 5.5, "Tham Luang cave rescue 2018"]],
  PHL: [["Scout Rangers and Special Operations Command", 3000, 8, 8.5, "Retook Marawi from ISIS in 2017"]],
  VNM: [["Đặc công (sappers)", 10000, 7.5, 5, "Legendary in the Vietnam wars; untested since 1979"]],
  MMR: [["Light infantry and commando units", 2000, 6, 5, "Losing a civil war"]],
  AFG: [["Badri 313 Battalion", 3000, 6, 7, "Taliban suicide and raid unit with captured US kit"]],
  YEM: [["Houthi special forces", 2000, 6, 7.5, "Hijacked the Galaxy Leader in 2023; Saudi border raids"]],
  COL: [
    ["Agrupación de Fuerzas Especiales Urbanas", 300, 9, 9, "Operation Jaque 2008: 15 hostages freed from FARC without a shot"],
    ["Lanceros and Army special forces", 5000, 8.5, 9, "Decades of jungle war against FARC and cartels"], ["Naval special forces", 600, 8.5, 8.5, "Riverine and coastal operations"],
  ],
  MEX: [["Navy special forces (FES)", 1500, 8.5, 8.5, "Captured El Chapo in 2014 and 2016"], ["Army special forces (GAFE)", 5000, 7.5, 7, "Cartel war; deserters founded Los Zetas"]],
  PER: [["Special Forces", 2000, 8, 8, "Chavín de Huántar 1997: 71 of 72 hostages freed from the Japanese ambassador's residence"]],
  BRA: [["1st Special Forces Battalion and GRUMEC", 1700, 8.5, 5.5, "Haiti, Rio favela operations"]],
  ARG: [["Special Forces Group and Buzos Tácticos", 600, 7.5, 4, "Falklands 1982"]], CHL: [["Special forces", 300, 8, 4, "No recent combat"]],
  VEN: [["Special forces", 1000, 5, 3, "Poorly trained"]], CUB: [["Avispas Negras", 1000, 7, 5, "Angola"]],
  NGA: [["Special forces", 1000, 6, 6, "Boko Haram"]], KEN: [["Special Operations Regiment", 1000, 7.5, 7, "Somalia, Westgate"]],
  ETH: [["Agazi Commandos", 3000, 6.5, 7, "Tigray war"]], ZAF: [["4 and 5 Special Forces Regiments", 400, 8.5, 7, "Heirs of the Reconnaissance Commandos"]],
  DZA: [["Special Intervention Group", 1000, 7.5, 6.5, "In Amenas 2013: ended the siege, with heavy hostage deaths"]], MAR: [["Special forces", 1000, 7, 5, "Western Sahara"]],
  SRB: [["63rd Parachute and 72nd Special Brigades", 1000, 8, 5, "Yugoslav wars"]], HRV: [["Special Forces Command (ZSS)", 300, 8.5, 7, "Afghanistan"]],
  ROU: [["Special Operations Forces", 1000, 8, 7, "Afghanistan, Iraq"]], HUN: [["34th Bercsényi Special Forces", 500, 8, 5, "Afghanistan"]],
  CZE: [["601st Special Forces Group", 300, 9, 8, "Afghanistan"]], SVK: [["5th Special Forces Regiment", 300, 8, 6, "Afghanistan"]],
  AUT: [["Jagdkommando", 400, 9, 6, "Chad, Afghanistan, Mali"]], CHE: [["AAD 10", 100, 9, 4, "Untested"]], IRL: [["Army Ranger Wing", 150, 9, 6, "Chad, Kabul evacuation 2021"]],
};
// A unit's quality, weighted on what it has proven: (0.35 × training + 0.65 × proven) / 10.
window.sfQuality = u => (0.35 * u[2] + 0.65 * u[3]) / 10;
const sfMemo = {};
// A country's units: listed ones, or a modelled estimate (a thousandth of its soldiers, trained by
// its readiness, unproven).
window.sfUnits = iso => {
  if (sfMemo[iso]) return sfMemo[iso];
  const listed = window.SPECIAL_FORCES[iso];
  if (listed) return (sfMemo[iso] = listed);
  const c = (window.COUNTRIES || []).find(x => x.iso3 === iso), troops = c ? (c.military && c.military.troops) || 0 : 0, ready = c && c.tech ? c.tech.ready : 0.5;
  const ops = Math.max(30, Math.round(troops * 1.0));
  return (sfMemo[iso] = [["Special forces (estimated)", ops, Math.round((3 + 5 * ready) * 10) / 10, 3, "No researched profile; estimated from the army's size and readiness"]]);
};
// Effective strength: Σ operators × quality⁶.
window.sfPower = iso => window.sfUnits(iso).reduce((a, u) => a + u[1] * Math.pow(window.sfQuality(u), 6), 0);
// The best unit: the one sent on raids.
window.sfBest = iso => window.sfUnits(iso).reduce((b, u) => (!b || window.sfQuality(u) > window.sfQuality(b) ? u : b), null);
