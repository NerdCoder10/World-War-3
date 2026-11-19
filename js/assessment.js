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
