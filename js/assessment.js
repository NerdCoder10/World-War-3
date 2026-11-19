// How strong militaries really are: analysis from unofficial documents and other sources, not
// official claims.
//
// MANNING: the share of a country's paper troop strength that is really present for duty: ghost
// soldiers on payrolls, desertion, unfilled posts, soldiers diverted to construction or business.
// [share, evidence]. Not listed: estimated from corruption.
window.MANNING = {
  USA: [0.98, "Missed recruiting targets in 2022–23; recovered by 2025"],
  RUS: [0.85, "Captured and leaked 2022 documents showed units at 60–80% strength; contract recruiting has since refilled them, at the cost of quality"],
  UKR: [0.85, "Over 100,000 desertion and absence cases opened by 2025 (prosecutor general); many brigades far below strength"],
  CHN: [0.95, "Recruiting shortfalls in technical branches reported in the PLA's own press"],
  TWN: [0.8, "Volunteer units at ~80% of authorised strength, front-line units lower (Legislative Yuan reports, 2024)"],
  DEU: [0.9, "~20,000 posts unfilled (Parliamentary Commissioner for the Armed Forces, 2024)"], GBR: [0.93, "The army is below its 73,000 target"],
  CAN: [0.85, "~16,000 short of authorised strength"], JPN: [0.9, "The Self-Defense Forces have missed recruiting targets for years"],
  KOR: [0.95, "A shrinking conscript pool leaves units below strength"], ISR: [0.95, "Reservists exhausted after two years of war; ultra-Orthodox exemptions"],
  IND: [0.95, "Over 100,000 vacancies among officers and soldiers"], SAU: [0.85, "Absenteeism and payroll padding"], EGY: [0.9, "Conscripts diverted to the army's business empire"],
  PRK: [0.85, "Many units spend months on construction and farm labour"], IRQ: [0.8, "The 2014 'ghost soldier' scandal: some 50,000 paid soldiers who did not exist"],
  NGA: [0.8, "Ghost soldiers and desertion reported repeatedly"], COD: [0.6, "Payroll fraud and ghost soldiers; units melted away before M23 in 2025"],
  SSD: [0.6, "Payroll padding, unpaid units"], SOM: [0.6, "Ghost soldiers in the national army (UN reports)"], LBY: [0.6, "Militias on paper"],
  VEN: [0.6, "Thousands of deserters since 2017; paper strength inflated"], MMR: [0.85, "Losing ground and conscripting by force since 2024"],
  MLI: [0.8, "Desertion and losses"], BFA: [0.8, "Desertion and losses"], NER: [0.85, "Desertion"], AFG: [0.9, "Taliban rolls include part-time fighters"],
  IRN: [0.9, "Conscripts of uneven quality"], TUR: [0.95, "Recovered from the 2016 purges"], VNM: [0.95, "Large reserve"], PAK: [1, "Well staffed"],
};
window.manning = c => {
  const m = window.MANNING[c.iso3];
  if (m) return m[0];
  const corr = (c.milStats && c.milStats.corruption) || 5;
  return Math.round(Math.max(0.6, 1 - 0.03 * Math.max(0, corr - 5)) * 100) / 100;
};

// The unofficial and independent sources behind each major assessment.
window.ANALYSIS_SOURCES = {
  USA: "The 2023 Discord leak of Pentagon briefing slides; GAO mission-capable audits; the Heritage Index of US Military Strength",
  RUS: "Oryx's photo-confirmed losses; Mediazona and BBC Russian counts of named war dead (over 150,000 by late 2025); leaked Defence Ministry and FSB documents; Ukrainian military-intelligence estimates",
  CHN: "The US DoD China Military Power Report; the PLA's own 'five incapables' self-criticism; reporting on the 2023–25 Rocket Force and Central Military Commission purges",
  UKR: "US assessments of its air-defence stocks in the 2023 Discord leak; the prosecutor general's desertion figures",
  IRN: "The nuclear archive seized by Mossad in 2018; damage assessments after the 2024–25 Israeli and US strikes",
  PRK: "Debris analysis of KN-23s fired in Ukraine; defector testimony; UN Panel of Experts reports",
  ISR: "The IDF's own 7 October investigations (2025)", TWN: "Legislative Yuan audits, Han Kuang exercise reporting and espionage convictions",
  EGY: "The 2023 Discord leak of a plan to make rockets for Russia in secret", IND: "Comptroller and Auditor General reports on ammunition and readiness shortfalls",
  DEU: "The Parliamentary Commissioner for the Armed Forces' annual reports", GBR: "Commons Defence Committee reports and leaked readiness assessments",
  CAN: "A leaked 2024 Defence Department readiness report", IRQ: "The 2014 ghost-soldier revelations", SAU: "UN Panel of Experts reports on Yemen",
  MMR: "Independent conflict trackers (ISP-Myanmar, ACLED) on the junta's losses", VEN: "Desertion figures from Venezuelan NGOs",
};

// ── Logistics by what each military has actually moved, and what that means today ──
// [score 0–10, the record]. Replaces the logistics rating (js/techlevels.js), which sets how well
// armies are supplied far from home (js/game.js supply).
window.LOGISTICS_RECORD = {
  USA: [10, "The Berlin Airlift (2.3 million tons, 1948–49); Desert Shield moved 500,000 troops and their kit 11,000 km in six months (1990); sustained two wars across the world for 20 years. Today: ~270 strategic airlifters, the Military Sealift Command and pre-positioned stocks, though its sealift ships are old and short of mariners"],
  RUS: [5, "The 2022 drive on Kyiv stalled in a 60 km convoy short of trucks and fuel; its armies depend on railways and fight within ~100 km of railheads"],
  CHN: [6, "Has never sustained a war far from home; evacuated Yemen in 2015 and built the Djibouti base and a growing fleet of supply ships and Y-20 airlifters, untested beyond its region"],
  GBR: [7, "Supplied a task force 12,800 km away to retake the Falklands (1982); today far fewer ships, and its auxiliary fleet is short of crews"],
  FRA: [6, "Operation Serval in Mali (2013) needed US and allied airlifters and tankers; it has since lost most of its African bases"],
  ISR: [7, "Short interior lines; resupplied by US airlifts in 1973 and 2023–25"], IND: [6, "Has kept ~50,000 troops at 4,500 m in Ladakh through the winters since 2020"],
  TUR: [6, "Sustains forces in Syria, Iraq, Libya and Somalia"], JPN: [4, "Little expeditionary logistics"], KOR: [5, "Built to fight at home"], PAK: [5, "Built to fight at home"],
  IRN: [4, "Supplied proxies across Iraq and Syria, but has no real expeditionary capacity"], PRK: [2, "Could barely feed its own troops; built to fight on its own soil"],
  UKR: [6, "Built a wartime supply system fed through Poland and Romania"], AUS: [6, "Led the 1999 East Timor intervention"], CAN: [5, "Sustained Kandahar with allied help"],
  DEU: [5, "Afghanistan with allied help; short of spare parts"], ITA: [5, "Lebanon and the Balkans"], ESP: [5, "Afghanistan and Mali with allies"],
  SAU: [4, "Struggled to supply its own Yemen campaign next door"], ARE: [6, "Projected forces to Yemen, Libya and Somalia"], EGY: [4, "Built to fight at home"],
  POL: [5, "Building up"], VNM: [4, "Built to fight at home"], BRA: [4, "Haiti peacekeeping"], NLD: [5, "Mali and Afghanistan with allies"], SGP: [5, "Small"], TWN: [3, "Island defence only"],
};

// ── Ferocity: willingness to close with the enemy and keep attacking despite losses ──
// [0–10, the record]. Attack ×(0.9 + 0.02 × ferocity), defence ×(0.95 + 0.01 × ferocity).
window.FEROCITY = {
  USA: [9.5, "The Marines (Belleau Wood, Iwo Jima, Hue, Fallujah 2004) are known worldwide as the most aggressive force on earth; 'violence of action' runs through its whole doctrine"],
  ISR: [9.5, "A relentless offensive culture: 1967, the 1973 Suez crossing, Gaza and Lebanon in 2023–25"], UKR: [8.5, "Constant counter-attacks; the 2024 Kursk incursion"],
  RUS: [7, "Will pay any price in men (Bakhmut and Avdiivka 'meat assaults'), but with little initiative"], GBR: [8, "Paras and Royal Marines: Goose Green, Helmand"],
  FRA: [8, "The Foreign Legion and its marines"], TUR: [8, "Aggressive operations in Syria and Iraq"], PRK: [8, "Fanatical indoctrination; mass assaults in Kursk in 2024–25"],
  IRN: [7, "Human-wave assaults in the Iran–Iraq war; the IRGC"], CHN: [6, "Untested since 1979; the 2020 Galwan brawl"], IND: [7, "Took Kargil's heights back by frontal assault in 1999"],
  PAK: [7, "Aggressive on the Line of Control"], AFG: [9, "The Taliban outlasted NATO"], YEM: [9, "The Houthis fought Saudi Arabia to a standstill"], AZE: [8, "Took Shusha by assault in 2020"],
  ETH: [8, "Brutal Tigray war"], ERI: [8, "Hardened by decades of war"], COL: [7, "Decades of jungle fighting"], KOR: [7, "Vietnam-era reputation"], JPN: [5, "Constitutional restraint"],
  DEU: [5, "A restrained post-war culture"], SAU: [3, "Reluctant to fight on the ground in Yemen"], KWT: [2, "Collapsed in 1990"], QAT: [3, "Untested"], ARE: [7, "Its Presidential Guard fought hard in Yemen"],
  EGY: [5, "The 1973 canal crossing; Sinai since"], IRQ: [6, "Collapsed in 2014, then retook Mosul"], VNM: [7, "Beat France, the US and China"], POL: [7, "Strong fighting tradition"],
  FIN: [8, "The Winter War"], GRC: [6, ""], ITA: [5, ""], ESP: [6, ""], CAN: [7, "Vimy Ridge, Kandahar"], AUS: [8, "Gallipoli, Vietnam, Afghanistan"], NZL: [7, ""], NLD: [6, ""],
  SGP: [6, ""], TWN: [5, "Untested"], BRA: [5, ""], MEX: [5, ""], CUB: [7, "Angola"], SYR: [6, ""], LBN: [6, ""], ARM: [7, ""], GEO: [7, ""], RWA: [8, "Disciplined and aggressive in Mozambique and Congo"],
};

// ── Historical performance against expectations ──
// [multiplier on combat skill, the record]. Some militaries have repeatedly beaten the forecasts
// and others repeatedly fallen short of them.
window.HIST_PERF = {
  USA: [1.1, "Beat the forecasts again and again: analysts warned of 10,000+ US dead in Desert Storm (148 were killed in action) and it reached Baghdad in three weeks in 2003"],
  ISR: [1.12, "Won in 1948, 1967 and 1973 against larger coalitions; in 2024–25 it dismantled Hezbollah's leadership and took control of Iran's skies, beyond almost every forecast"],
  RUS: [0.85, "Expected to take Kyiv in days in 2022, it failed and lost far more than predicted, as it did in Chechnya in 1994–95"],
  FRA: [0.92, "Collapsed in 1940 despite a larger army; left the Sahel in 2022–25 after a decade without defeating the jihadists"],
  GBR: [0.92, "In Basra (2007) and Helmand it had to be reinforced or relieved by US forces; its army is now far smaller than its reputation"],
  UKR: [1.08, "Most forecasts gave it days in 2022; it held Kyiv and retook Kharkiv and Kherson"], IRQ: [0.85, "Its army collapsed before a few thousand ISIS fighters in Mosul in 2014"],
  SAU: [0.9, "Failed to defeat the Houthis in eight years"],
};

// Apply them to every country's military profile (js/techlevels.js has already run).
(function () {
  (window.COUNTRIES || []).forEach(c => {
    const m = c.milStats; if (!m) return;
    const L = window.LOGISTICS_RECORD[c.iso3]; if (L) m.logistics = L[0];
    const F = window.FEROCITY[c.iso3];
    m.ferocity = F ? F[0] : Math.round(Math.max(3, Math.min(8, 5 + 0.3 * (m.experience - 5) + 0.2 * (m.patriotism - 6))) * 10) / 10;
    m.attackFer = 0.9 + 0.02 * m.ferocity;
    m.defend *= 0.95 + 0.01 * m.ferocity;
    const H = window.HIST_PERF[c.iso3]; if (H) m.skill *= H[0];
  });
})();
