// Cyber power by country: [offence 0–10, defence 0–10, the record]. From the IISS "Cyber Capabilities
// and National Power" assessments, the Belfer Center's National Cyber Power Index and attributed
// operations, not countries' own claims.
//   Offence: proven ability to break into and disrupt foreign networks: espionage, wipers, grid
//   attacks, theft. Defence: how hard its own military, government and infrastructure are to hit
//   (agencies, resilience, and how much of the country is online to attack at all).
// In battle the attacker's offence against the defender's defence (and the reverse) shifts the odds
// up to ~6% (command networks, sensors, logistics). Cyber operations (the dossier) hit a country's
// grid, command and air-defence networks or banks; hostile powers do the same to you.
window.CYBER = {
  USA: [10, 8.5, "Cyber Command and the NSA, the world's most capable: Stuxnet with Israel, operations against ISIS and Russian election meddling; a vast attack surface at home (Colonial Pipeline 2021, Chinese Volt and Salt Typhoon inside its grid and telecoms)"],
  CHN: [9, 8.5, "MSS and PLA groups (APT41, the OPM hack, Volt Typhoon pre-positioned in US infrastructure, Salt Typhoon in US telecoms); the Great Firewall and a state-controlled internet"],
  RUS: [9, 7.5, "GRU Sandworm (Ukraine's grid 2015–16, NotPetya 2017, the Viasat hack in 2022), the SVR's SolarWinds hack, FSB Turla; a 'sovereign internet', though Ukrainian hackers breach it regularly"],
  GBR: [9, 8, "GCHQ and the National Cyber Force, offensive operations against ISIS; a strong National Cyber Security Centre"],
  ISR: [9.5, 9, "Unit 8200 (Stuxnet), NSO's Pegasus; among the best defences in the world"],
  FRA: [8, 7.5, "COMCYBER and the DGSE"], DEU: [6.5, 6.5, "The Cyber and Information Domain Service; the Bundestag was hacked by Russia's APT28 in 2015"],
  NLD: [8, 8, "The AIVD hacked into Russia's Cozy Bear group and watched it through its own cameras"], AUS: [8, 8, "The ASD's REDSPICE expansion; Five Eyes"], CAN: [7, 7.5, "CSE, Five Eyes"], NZL: [6, 7.5, "GCSB, Five Eyes"],
  PRK: [8.5, 8, "Lazarus Group and Bureau 121: Sony 2014, WannaCry 2017, the Bangladesh Bank heist, the $1.5bn Bybit theft in 2025; barely connected at home, so there is little to attack"],
  IRN: [7, 5, "IRGC-linked groups: Shamoon wiped Saudi Aramco in 2012, attacks on US banks and Israeli water systems; itself hit by Stuxnet and by Predatory Sparrow, which crippled its fuel stations and banks (2021–25)"],
  UKR: [8, 8, "The IT Army and military-intelligence hackers breach Russian systems; survived Russia's cyber onslaught with Western help"],
  IND: [6.5, 5.5, "The Defence Cyber Agency; frequent breaches at home (the AIIMS ransomware attack in 2022)"], PAK: [5, 4.5, "Transparent Tribe espionage against India"],
  KOR: [7, 7.5, "Cyber Operations Command; under constant attack from the North"], JPN: [5.5, 6.5, "Defensive until its 2025 Active Cyber Defence law"], TWN: [6.5, 7.5, "Under constant Chinese attack, millions of attempts a day"],
  SGP: [7, 8.5, "The Digital and Intelligence Service"], ARE: [7.5, 7.5, "DarkMatter and Project Raven spyware operations"], SAU: [5.5, 6, "Rebuilt after Shamoon wiped Aramco"], QAT: [5, 6.5, "Hit by the 2017 news-agency hack that sparked the Gulf crisis"],
  TUR: [6, 5.5, "Growing military cyber units"], VNM: [6.5, 6, "APT32 (OceanLotus) espionage"], EST: [6.5, 9, "NATO's cyber defence centre; rebuilt after Russia's 2007 attack"],
  FIN: [6, 8, "Strong national resilience"], SWE: [6, 8, "FRA signals intelligence"], NOR: [6, 7.5, "Strong defence"], DNK: [6, 7.5, "Strong defence"], POL: [6, 7, "The Cyberspace Defence Force, on alert against Russia"],
  CHE: [5.5, 7, "Defensive"], ITA: [6, 6, "Capable"], ESP: [6, 6.5, "Capable"], BEL: [5, 6, "Hosts NATO and EU networks"], CZE: [5, 7, "Strong defence"], LTU: [5, 7.5, "Strong defence"], LVA: [4.5, 7, "Strong defence"],
  AUT: [4.5, 6, "Defensive"], IRL: [4, 5, "Its health service was crippled by ransomware in 2021"], PRT: [4, 5.5, "Defensive"], GRC: [4.5, 5.5, "The Predator spyware scandal"], ROU: [5, 6, "Capable"], BGR: [4, 5, "Often hit by Russian hackers"],
  HUN: [4.5, 5.5, "Pegasus used at home"], SRB: [4, 4.5, "Modest"], BLR: [5, 5, "Belarusian Cyber Partisans broke into its railway and passport systems in 2022"], KAZ: [4, 5, "Modest"], UZB: [4, 4.5, "Modest"], AZE: [5, 5.5, "Capable regionally"],
  ARM: [3.5, 4, "Modest"], GEO: [4, 5, "Hit by Russia in 2008 and 2019"], EGY: [5, 5.5, "Surveillance-focused"], MAR: [5.5, 5.5, "Used Pegasus widely"], JOR: [4, 5.5, "Modest"], KWT: [3.5, 5, "Modest"], OMN: [3.5, 5.5, "Modest"],
  IRQ: [2.5, 3, "Weak"], SYR: [3, 2, "Rebuilding"], LBN: [4, 3, "Hezbollah's units; the state's networks are weak"], MYS: [4.5, 5.5, "Modest"], IDN: [4.5, 4.5, "Its national data centre was locked by ransomware in 2024"],
  THA: [4, 5, "Modest"], PHL: [3, 3.5, "Weak, penetrated by Chinese groups"], BRA: [5, 5, "Capable"], MEX: [4, 4.5, "Uses spyware at home"], ARG: [3.5, 4, "Modest"], COL: [4.5, 5, "Capable"], CHL: [4, 5, "Modest"],
  PER: [3, 3.5, "Weak"], ECU: [2.5, 3, "Weak"], VEN: [3, 3, "Weak, Cuban-assisted"], CUB: [3, 5, "Little to attack"], ZAF: [3.5, 4, "Often hit by ransomware"], NGA: [3.5, 3, "Home of cyber-fraud gangs; weak state defences"],
  KEN: [3.5, 4, "Modest"], ETH: [3, 3, "Weak"], RWA: [3, 5, "Modest"], LUX: [4, 7, "Strong for its size"],
};
window.cyber = c => {
  const r = window.CYBER[c.iso3];
  if (r) return { off: r[0], def: r[1], note: r[2], est: false };
  const lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001)), m = c.milStats || {}, counter = (c.intelProfile && c.intelProfile.counter) || 3;
  const f = x => Math.round(Math.max(1, Math.min(7, x)) * 10) / 10;
  return { off: f((c.secret && c.secret.cyber) || 1), def: f(1 + 1.6 * lg + 0.2 * counter - 0.15 * (m.corruption || 5)), note: "", est: true };
};

// Sustainment (0–1): what keeps a cyber force working: hackers and their training pipeline, budget,
// a domestic tech industry, and the patching and upkeep of its own networks. It sets how fast
// burned tools are rebuilt after operations (exploits and malware are spent once exposed) and how
// close its defence stays to its rating. Not listed: estimated from wealth and corruption.
window.CYBER_SUSTAIN = {
  USA: [0.95, "NSA and Cyber Command budgets in the billions and the world's largest tech industry, though it struggles to keep talent from the private sector"],
  CHN: [0.95, "A state-driven ecosystem of ministries, universities, contractors (the leaked i-Soon files) and hacking contests that feed it zero-days"],
  ISR: [0.95, "Unit 8200 feeds a booming cyber industry and back again"], GBR: [0.9, "GCHQ and a deep tech sector"], FRA: [0.85, "Steady investment"],
  RUS: [0.75, "Capable, but some 100,000 IT workers fled after 2022 and sanctions cut it off from Western hardware and software"],
  PRK: [0.85, "Self-funding: its hackers' crypto thefts pay for the programme"], IRN: [0.65, "Sanctions and a brain drain to the West hollow its talent pool"],
  UKR: [0.85, "Western-funded, with a big IT sector and volunteers"], KOR: [0.85, "Large tech industry"], JPN: [0.8, "Strong industry, short of cyber talent"],
  NLD: [0.85, "Strong"], AUS: [0.85, "REDSPICE funding"], CAN: [0.8, "Steady"], DEU: [0.75, "Chronic shortage of cyber specialists in government"],
  SGP: [0.9, "Well funded"], ARE: [0.8, "Buys talent and tools from abroad"], SAU: [0.65, "Depends on foreign contractors"], TUR: [0.65, "Growing"], IND: [0.65, "Huge talent pool, little government cyber funding"],
  VNM: [0.65, "State-backed"], EST: [0.85, "A digital state that trains its people"], TWN: [0.75, "Chip industry, government short of specialists"],
  BLR: [0.5, "Brain drain after 2020"], VEN: [0.3, "Collapsed"], CUB: [0.35, "Poor and cut off"], SYR: [0.2, "Rebuilding"],
};
window.cyberSustainBase = c => {
  const r = window.CYBER_SUSTAIN[c.iso3];
  if (r) return r[0];
  const lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001)), m = c.milStats || {};
  return Math.round(Math.max(0.3, Math.min(0.85, 0.3 + 0.22 * lg - 0.03 * (m.corruption || 5))) * 100) / 100;
};
