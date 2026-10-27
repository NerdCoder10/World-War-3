// Space and intelligence.
//
// SPACE: satellites in orbit by country, about 2025 (UCS Satellite Database, operators' own
// figures, press reports; rounded). `gov` are government and military satellites by role;
// `priv` are commercial constellations headquartered in that country. In peacetime private
// satellites only lend a little capacity to their government; once the country is at war they
// are pressed into national service and count in full.
//   recon   imaging and radar reconnaissance     sigint  signals and electronic intelligence
//   comms   military communications              nav     navigation (GPS, GLONASS, BeiDou...)
//   warn    missile early warning                asat    anti-satellite capability 0–3
window.SPACE = {
  USA: { gov: { recon: 220, sigint: 30, comms: 60, nav: 31, warn: 12 }, asat: 2, priv: [
    ["SpaceX Starlink (incl. Starshield)", 8800, "comms"], ["Amazon Project Kuiper", 150, "comms"], ["Planet", 200, "recon"],
    ["Maxar WorldView", 9, "recon"], ["BlackSky", 16, "recon"], ["Capella / Umbra radar", 20, "recon"], ["Iridium", 75, "comms"],
    ["Spire / HawkEye 360 (RF)", 130, "sigint"], ["Viasat / SES / Intelsat (US)", 60, "comms"]] },
  RUS: { gov: { recon: 12, sigint: 8, comms: 45, nav: 24, warn: 6 }, asat: 3, priv: [["Gonets & others", 20, "comms"]] },
  CHN: { gov: { recon: 150, sigint: 30, comms: 30, nav: 45, warn: 4 }, asat: 3, priv: [
    ["Jilin-1 (Chang Guang)", 120, "recon"], ["Qianfan / G60 constellation", 90, "comms"], ["Guowang", 60, "comms"], ["Geely & others", 40, "comms"]] },
  GBR: { gov: { recon: 1, sigint: 0, comms: 5, nav: 0, warn: 0 }, asat: 0, priv: [["Eutelsat OneWeb (UK share)", 330, "comms"], ["Inmarsat (Viasat)", 14, "comms"], ["SSTL & others", 15, "recon"]] },
  FRA: { gov: { recon: 3, sigint: 3, comms: 5, nav: 0, warn: 0 }, asat: 1, priv: [["Eutelsat & OneWeb (French share)", 360, "comms"], ["Airbus Pléiades Neo", 4, "recon"], ["Unseenlabs (RF)", 14, "sigint"]] },
  DEU: { gov: { recon: 8, sigint: 0, comms: 2, nav: 0, warn: 0 }, asat: 0, priv: [["OHB & others", 5, "recon"]] },
  ITA: { gov: { recon: 6, sigint: 0, comms: 2, nav: 0, warn: 0 }, asat: 0, priv: [["e-GEOS / others", 3, "recon"]] },
  ESP: { gov: { recon: 2, sigint: 0, comms: 3, nav: 0, warn: 0 }, asat: 0, priv: [["Hispasat", 7, "comms"]] },
  JPN: { gov: { recon: 10, sigint: 0, comms: 2, nav: 5, warn: 0 }, asat: 0, priv: [["iQPS / Synspective radar", 14, "recon"], ["Axelspace", 10, "recon"], ["SKY Perfect JSAT", 17, "comms"]] },
  KOR: { gov: { recon: 6, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["KT SAT", 5, "comms"]] },
  IND: { gov: { recon: 15, sigint: 2, comms: 3, nav: 7, warn: 0 }, asat: 1, priv: [["Pixxel & others", 6, "recon"]] },
  ISR: { gov: { recon: 6, sigint: 1, comms: 0, nav: 0, warn: 0 }, asat: 1, priv: [["ImageSat EROS", 2, "recon"], ["Spacecom AMOS", 3, "comms"]] },
  TUR: { gov: { recon: 3, sigint: 0, comms: 6, nav: 0, warn: 0 }, asat: 0, priv: [] },
  IRN: { gov: { recon: 4, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [] },
  PRK: { gov: { recon: 1, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [] },
  PAK: { gov: { recon: 3, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [] },
  CAN: { gov: { recon: 3, sigint: 0, comms: 0, nav: 0, warn: 1 }, asat: 0, priv: [["Telesat", 15, "comms"], ["GHGSat & Kepler", 30, "recon"]] },
  AUS: { gov: { recon: 0, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["Optus", 5, "comms"], ["Fleet Space & others", 10, "comms"]] },
  ARE: { gov: { recon: 2, sigint: 0, comms: 2, nav: 0, warn: 0 }, asat: 0, priv: [["Yahsat & Space42", 6, "comms"]] },
  SAU: { gov: { recon: 2, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["Arabsat (Saudi share)", 3, "comms"]] },
  EGY: { gov: { recon: 1, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["Nilesat", 2, "comms"]] },
  BRA: { gov: { recon: 1, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["Embratel Star One", 5, "comms"]] },
  ARG: { gov: { recon: 2, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["ARSAT", 3, "comms"], ["Satellogic", 30, "recon"]] },
  MEX: { gov: { recon: 0, sigint: 0, comms: 2, nav: 0, warn: 0 }, asat: 0, priv: [] },
  KAZ: { gov: { recon: 2, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [] },
  NOR: { gov: { recon: 1, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["Space Norway", 4, "comms"]] },
  LUX: { gov: { recon: 0, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["SES", 70, "comms"]] },
  FIN: { gov: { recon: 0, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["ICEYE radar", 40, "recon"]] },
  POL: { gov: { recon: 3, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["ICEYE Poland & others", 4, "recon"]] },
  UKR: { gov: { recon: 0, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [] },
  TWN: { gov: { recon: 1, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [] },
  SGP: { gov: { recon: 1, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["Singtel (shared)", 2, "comms"]] },
  IDN: { gov: { recon: 1, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [["Telkomsat & PSN", 5, "comms"]] },
  VNM: { gov: { recon: 1, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["VINASAT", 2, "comms"]] },
  THA: { gov: { recon: 2, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [["Thaicom", 4, "comms"]] },
  NGA: { gov: { recon: 2, sigint: 0, comms: 1, nav: 0, warn: 0 }, asat: 0, priv: [] },
  ZAF: { gov: { recon: 1, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [] },
};

// INTEL_AGENCIES: the main intelligence services for the larger players.
window.INTEL_AGENCIES = {
  USA: "CIA, NSA, NRO, NGA, DIA and the military services; the hub of Five Eyes",
  RUS: "SVR (foreign), FSB (domestic and near abroad), GRU (military)",
  CHN: "MSS (civil), PLA Intelligence Bureau and the Information Support Force; vast cyber units",
  GBR: "MI6 (SIS), GCHQ, MI5, Defence Intelligence; Five Eyes",
  FRA: "DGSE, DGSI, DRM",
  DEU: "BND, BfV, MAD",
  ISR: "Mossad, Aman (incl. Unit 8200), Shin Bet",
  IND: "RAW, IB, DIA, NTRO",
  PAK: "ISI, IB, Military Intelligence",
  IRN: "MOIS, IRGC Intelligence Organisation, Quds Force",
  JPN: "Cabinet Intelligence and Research Office, Defense Intelligence Headquarters",
  KOR: "NIS, Defense Intelligence Agency, 777 Command (SIGINT)",
  PRK: "Reconnaissance General Bureau (incl. Lazarus cyber group)",
  TUR: "MİT",
  SAU: "General Intelligence Presidency",
  ARE: "Signals Intelligence Agency, State Security",
  EGY: "General Intelligence Directorate",
  CAN: "CSIS, Communications Security Establishment; Five Eyes",
  AUS: "ASIS, ASIO, Australian Signals Directorate; Five Eyes",
  NZL: "NZSIS, GCSB; Five Eyes",
  UKR: "SBU, HUR (military intelligence), SZRU",
  TWN: "National Security Bureau, Military Intelligence Bureau",
  ITA: "AISE, AISI",
  ESP: "CNI",
  NLD: "AIVD, MIVD",
  POL: "AW, ABW, SKW",
  CUB: "Dirección de Inteligencia (DI)",
  VNM: "General Department of Military Intelligence (TC2)",
  SGP: "Security and Intelligence Division",
  BLR: "KGB of Belarus",
};

// More services, so nearly every country's spies have a name.
Object.assign(window.INTEL_AGENCIES, {
  DZA: "DGDSE (external), DGSI (internal), military security (DCSA)", AGO: "SINSE (internal), SIE (external), SIM (military)",
  BWA: "Directorate of Intelligence and Security (DIS)", BFA: "Agence nationale de renseignement (ANR)", BDI: "Service national de renseignement (SNR)",
  CMR: "DGRE (external intelligence)", TCD: "Agence nationale de sécurité (ANS)", COD: "ANR (national intelligence), DEMIAP (military)",
  DJI: "Service de documentation et de sécurité (SDS)", ERI: "National Security Office", ETH: "National Intelligence and Security Service (NISS)",
  GHA: "National Intelligence Bureau, Research Department", KEN: "National Intelligence Service (NIS)", LBY: "Rival eastern and western intelligence services",
  MAR: "DGED (external), DGST (internal)", MOZ: "SISE (State Information and Security Service)", NGA: "NIA (foreign), DSS (domestic), Defence Intelligence Agency",
  RWA: "National Intelligence and Security Services (NISS)", SOM: "National Intelligence and Security Agency (NISA)", ZAF: "State Security Agency, Defence Intelligence",
  SSD: "National Security Service (NSS)", SDN: "General Intelligence Service (GIS)", TZA: "Tanzania Intelligence and Security Service (TISS)",
  UGA: "ISO (internal), ESO (external), CMI (military)", ZMB: "Zambia Security Intelligence Service", ZWE: "Central Intelligence Organisation (CIO)",
  ALB: "State Intelligence Service (SHISH)", AUT: "DSN (state protection), Heeresnachrichtenamt (military)", BEL: "VSSE (State Security), ADIV/SGRS (military)",
  BIH: "Intelligence-Security Agency (OSA-OBA)", BGR: "DANS, National Intelligence Service", HRV: "SOA, VSOA (military)", CYP: "Cyprus Intelligence Service (KYP)",
  CZE: "BIS, ÚZSI, Military Intelligence", DNK: "PET, Danish Defence Intelligence Service (FE)", EST: "Foreign Intelligence Service, KAPO",
  FIN: "Supo, Finnish Defence Intelligence Agency", GRC: "National Intelligence Service (EYP)", HUN: "Information Office (IH), AH, Military National Security Service",
  IRL: "Directorate of Military Intelligence (G2), Garda Crime and Security", LVA: "Constitution Protection Bureau, VDD, MIDD", LTU: "State Security Department (VSD), AOTD (military)",
  LUX: "Service de renseignement de l'État (SRE)", MLT: "Malta Security Service", MDA: "Information and Security Service (SIS)", MNE: "National Security Agency (ANB)",
  MKD: "National Security Agency, Intelligence Agency", NOR: "Norwegian Intelligence Service (E-tjenesten), PST", PRT: "SIED (external), SIS (internal)",
  ROU: "SRI (domestic), SIE (foreign), DGIA (military)", SRB: "BIA, VBA, VOA (military)", SVK: "Slovak Information Service (SIS), Military Intelligence",
  SVN: "SOVA", SWE: "MUST (military), FRA (signals), Säpo", CHE: "Federal Intelligence Service (FIS), Military Intelligence Service",
  AFG: "General Directorate of Intelligence (GDI)", ARM: "National Security Service, Foreign Intelligence Service", AZE: "State Security Service, Foreign Intelligence Service",
  BHR: "National Security Agency", BGD: "DGFI (military), National Security Intelligence (NSI)", GEO: "Georgian Intelligence Service, State Security Service",
  IDN: "BIN (State Intelligence Agency), BAIS TNI (military)", IRQ: "Iraqi National Intelligence Service, military intelligence", JOR: "General Intelligence Directorate (GID)",
  KAZ: "National Security Committee (KNB), Syrbar (foreign)", KWT: "Kuwait State Security", KGZ: "State Committee for National Security (GKNB)",
  LBN: "General Security, Army Intelligence Directorate; Hezbollah's own network", MYS: "Malaysian External Intelligence Organisation, Special Branch",
  MMR: "Office of the Chief of Military Security Affairs (OCMSA)", MNG: "General Intelligence Agency (GIA)", NPL: "National Investigation Department",
  OMN: "Internal Security Service, Palace Office", PSE: "Palestinian General Intelligence Service; Hamas security apparatus", PHL: "NICA, ISAFP (military)",
  QAT: "State Security Bureau", LKA: "State Intelligence Service, Directorate of Military Intelligence", SYR: "General Intelligence Directorate (rebuilt after 2024)",
  TJK: "State Committee for National Security (GKNB)", THA: "National Intelligence Agency, Armed Forces Security Center", TKM: "Ministry of National Security",
  UZB: "State Security Service (SGB)", YEM: "National Security Bureau; Houthi intelligence in the north", KHM: "General Department of Intelligence (military)",
  MEX: "Centro Nacional de Inteligencia (CNI), military intelligence", COL: "Dirección Nacional de Inteligencia (DNI)", BRA: "ABIN (Brazilian Intelligence Agency)",
  ARG: "SIDE (Secretaría de Inteligencia de Estado)", CHL: "Agencia Nacional de Inteligencia (ANI)", PER: "Dirección Nacional de Inteligencia (DINI)",
  VEN: "SEBIN, DGCIM (military counter-intelligence); Cuban advisers", ECU: "Centro de Inteligencia Estratégica (CIES)", GTM: "Secretaría de Inteligencia Estratégica",
  DOM: "Dirección Nacional de Inteligencia", PAN: "SENIS (National Intelligence and Security Service)", CRI: "Dirección de Inteligencia y Seguridad (DIS)",
  SLV: "Organismo de Inteligencia del Estado (OIE)", NIC: "Military intelligence and police intelligence (Russian-trained)", BOL: "Police and military intelligence",
  URY: "Secretaría de Inteligencia Estratégica de Estado", PRY: "Secretaría Nacional de Inteligencia", HND: "Dirección Nacional de Investigación e Inteligencia",
  BLZ: "Joint Intelligence Coordinating Centre", JAM: "Jamaica Defence Force intelligence, Constabulary Special Branch", TTO: "Strategic Services Agency",
  BRN: "Internal Security Department", LAO: "Ministry of Public Security", TLS: "National Intelligence Service (SNI)", MDV: "National Security Service intelligence",
  BTN: "Royal Bhutan Army intelligence", PNG: "National Intelligence Organisation", FJI: "Fiji Military Forces intelligence", ISL: "No intelligence service (relies on NATO allies)",
  VAT: "No foreign intelligence service: Gendarmerie and a worldwide diplomatic network", SEN: "Direction générale du renseignement", CIV: "Conseil national de sécurité intelligence",
  MLI: "Agence nationale de la sécurité d'État (ANSE)", NER: "Direction générale de la documentation et de la sécurité extérieure", TUN: "Intelligence services of the Interior and Defence ministries",
});

(function () {
  const C = window.COUNTRIES;
  const FIVE_EYES = ["USA", "GBR", "CAN", "AUS", "NZL"];
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  C.forEach(c => {
    const sp = window.SPACE[c.iso3] || { gov: { recon: 0, sigint: 0, comms: 0, nav: 0, warn: 0 }, asat: 0, priv: [] };
    const priv = { recon: 0, sigint: 0, comms: 0 };
    sp.priv.forEach(([, n, kind]) => (priv[kind] = (priv[kind] || 0) + n));
    c.space = { gov: sp.gov, priv: sp.priv, privBy: priv, asat: sp.asat, govTotal: sum(sp.gov), privTotal: sum(priv) };
    // Intelligence disciplines, 0–10, built from the secret-assets profile, wealth, satellites and alliances.
    const s = c.secret, lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001));
    const sat = k => Math.log10(1 + sp.gov[k] + 0.3 * (priv[k] || 0));
    const fiveEyes = FIVE_EYES.includes(c.iso3), nato = (window.ALLIANCES.NATO || []).includes(c.iso3);
    const cl = v => Math.max(0, Math.min(10, Math.round(v * 10) / 10));
    const intel = {
      humint: cl(s.intel * 0.8 + (c.milStats ? c.milStats.experience * 0.15 : 0) + 0.5),
      sigint: cl(s.intel * 0.5 + s.cyber * 0.3 + sat("sigint") * 1.4 + (fiveEyes ? 1.5 : 0)),
      imint: cl(sat("recon") * 3 + lg * 0.6),
      cyber: cl(s.cyber),
      counter: cl(s.intel * 0.6 + (c.milStats ? (10 - c.milStats.corruption) * 0.25 : 2) + (["RUS", "CHN", "PRK", "IRN", "ISR"].includes(c.iso3) ? 1.2 : 0)),
      shared: fiveEyes ? 2 : nato ? 1 : 0,
    };
    // Overall score: what this country can know about others (allies share some of their picture).
    intel.score = cl((intel.humint + intel.sigint + intel.imint + intel.cyber) / 4 + intel.shared * 0.6);
    intel.agencies = window.INTEL_AGENCIES[c.iso3] || (intel.score >= 4 ? "National intelligence and military intelligence services" : "A small security service; relies on partners for foreign intelligence");
    intel.alliance = fiveEyes ? "Five Eyes" : nato ? "NATO intelligence sharing" : "";
    c.intelProfile = intel;
  });
  // How much a country's spy agencies add to its fighting power: targeting and battle damage
  // assessment, early warning, sabotage behind the lines and cyber attacks on command networks.
  // Each point of intelligence score above 5 adds 3% (a 9.5/10 service like the CIA/NSA or
  // Mossad/Unit 8200 about +13%), each point below takes 3% off, within −12% and +15%.
  window.intelMult = c => Math.max(0.88, Math.min(1.15, 1 + 0.03 * (c.intelProfile.score - 5)));
  // Space multiplier for combat: reconnaissance, communications and navigation, plus private
  // constellations in full once the country is at war (otherwise 30%).
  window.spaceMult = (c, atWar) => {
    const g = c.space.gov, p = c.space.privBy, w = atWar ? 1 : 0.3;
    const recon = Math.log10(1 + g.recon + g.sigint + w * ((p.recon || 0) + (p.sigint || 0)));
    const comms = Math.log10(1 + g.comms + w * (p.comms || 0));
    const nav = g.nav >= 20 ? 1 : g.nav > 0 ? 0.5 : 0;
    return 1 + Math.min(0.12, recon * 0.035) + Math.min(0.1, comms * 0.025) + nav * 0.03;
  };
})();
