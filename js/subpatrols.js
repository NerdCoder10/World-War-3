// Submarines at sea: where each navy's boats patrol, and what share is out at any time.
//
// Ballistic-missile submarines keep up continuous deterrent patrols (the US and UK keep about
// two-thirds of theirs at sea); attack submarines deploy forward to choke points and rival
// fleets. Patrol areas are the publicly known ones (Barents and Okhotsk "bastions", the GIUK gap,
// the South China Sea, the Strait of Hormuz...); exact positions are secret, so each area is a
// point in its middle. Navies not listed keep their boats in port.
//
// [name, lon, lat, weight, note]; atSea: share of the submarine force deployed.
window.SUB_PATROLS = {
  USA: { atSea: 0.35, areas: [
    ["SSBN deterrent patrol, North Pacific", -150, 38, 3, "Ohio-class SSBNs out of Bangor on continuous patrol"],
    ["SSBN deterrent patrol, Atlantic", -45, 38, 2, "Ohio-class SSBNs out of Kings Bay"],
    ["Attack submarines, Western Pacific", 140, 20, 3, "Virginia and Los Angeles-class SSNs from Guam, Pearl Harbor and San Diego"],
    ["Attack submarines, South China Sea", 115, 13, 1, "Forward SSN patrols watching the PLA Navy"],
    ["Attack submarines, North Atlantic & GIUK gap", -20, 62, 2, "Tracking Russian Northern Fleet submarines"],
    ["Attack submarines, Mediterranean", 18, 35, 1, "Sixth Fleet SSNs, Tomahawk-armed"],
    ["Attack submarines, Arabian Sea", 63, 17, 1, "Fifth Fleet SSNs and SSGNs"]] },
  RUS: { atSea: 0.2, areas: [
    ["Barents Sea bastion", 40, 72.5, 3, "Northern Fleet SSBNs guarded by attack submarines"],
    ["Sea of Okhotsk bastion", 150, 54, 2, "Pacific Fleet SSBNs"],
    ["Attack submarines, North Atlantic", -15, 57, 2, "Yasen and Akula SSNs probing the GIUK gap"],
    ["Mediterranean detachment", 30, 34.5, 1, "Kilo-class boats, formerly out of Tartus"],
    ["Black Sea Fleet submarines", 36.5, 43.5, 1, "Improved Kilos firing Kalibr at Ukraine"]] },
  CHN: { atSea: 0.25, areas: [
    ["South China Sea (Hainan SSBN bastion)", 112, 16, 3, "Jin-class SSBNs out of Yulin"],
    ["East China Sea & Taiwan Strait", 123, 27, 2, "Yuan, Song and Shang-class boats"],
    ["Western Pacific / Philippine Sea", 128, 21, 1, "Shang-class SSNs beyond the first island chain"],
    ["Yellow Sea", 123, 36.5, 1, "North Sea Fleet boats"],
    ["Indian Ocean deployments", 76, 4, 1, "Anti-piracy and port-call patrols"]] },
  GBR: { atSea: 0.3, areas: [
    ["CASD deterrent patrol, North Atlantic", -25, 52, 2, "Continuous at-sea deterrence: one Vanguard SSBN always at sea"],
    ["Attack submarines, North Atlantic & Arctic", -5, 67, 1, "Astute-class SSNs"]] },
  FRA: { atSea: 0.3, areas: [
    ["SSBN deterrent patrol, Atlantic", -16, 46, 2, "Triomphant-class SSBNs out of Île Longue"],
    ["Attack submarines, Mediterranean", 6, 40, 1, "Suffren and Rubis-class SSNs out of Toulon"]] },
  IND: { atSea: 0.25, areas: [["Bay of Bengal", 87, 15, 2, "Arihant-class SSBNs and Kilos"], ["Arabian Sea", 68, 17, 1, "Kalvari (Scorpène) boats"]] },
  PAK: { atSea: 0.2, areas: [["Arabian Sea", 64, 22, 1, "Agosta-90B boats; Hangor class arriving"]] },
  JPN: { atSea: 0.25, areas: [["Sea of Japan", 135, 39, 1, "Soryu and Taigei-class boats"], ["East China Sea", 127, 29, 1, "Watching the Miyako Strait"]] },
  KOR: { atSea: 0.25, areas: [["East Sea", 131, 37.5, 1, "KSS-III (Dosan Ahn Changho) SLBM boats"], ["Yellow Sea", 124.5, 36, 1, "Son Won-il and Chang Bogo boats"]] },
  PRK: { atSea: 0.15, areas: [["East Sea coast (Sinpo)", 129.5, 40, 2, "Romeo and Sang-O boats; the Hero Kim Kun Ok SLBM submarine"], ["Yellow Sea coast", 124.5, 38.5, 1, "Midget and coastal submarines"]] },
  TWN: { atSea: 0.25, areas: [["Taiwan Strait", 120, 23.5, 1, "Hai Lung boats; Hai Kun on trials"]] },
  AUS: { atSea: 0.25, areas: [["Indian Ocean & Pacific patrols", 110, -24, 1, "Collins-class boats"]] },
  ISR: { atSea: 0.3, areas: [["Eastern Mediterranean", 33, 33, 1, "Dolphin-class boats"], ["Red Sea", 38.5, 21, 1, "Dolphin-class deployments"]] },
  IRN: { atSea: 0.2, areas: [["Strait of Hormuz", 56.5, 26.3, 2, "Ghadir midget and Kilo-class boats"], ["Gulf of Oman", 58.5, 24.5, 1, "Fateh and Kilo-class boats"]] },
  TUR: { atSea: 0.2, areas: [["Aegean & Eastern Mediterranean", 26.5, 36.5, 1, "Preveze and Gür-class boats"], ["Black Sea", 32, 42.6, 1, "Reis-class boats arriving"]] },
  GRC: { atSea: 0.2, areas: [["Aegean Sea", 25, 38, 1, "Type 214 Papanikolis boats"]] },
  DEU: { atSea: 0.2, areas: [["Baltic & North Sea", 12, 55.5, 1, "Type 212A boats"]] },
  NOR: { atSea: 0.2, areas: [["Norwegian Sea", 5, 67, 1, "Ula-class boats"]] },
  SWE: { atSea: 0.2, areas: [["Baltic Sea", 18.5, 57, 1, "Gotland and Södermanland AIP boats"]] },
  ITA: { atSea: 0.2, areas: [["Central Mediterranean", 16, 37.5, 1, "Todaro (Type 212A) boats"]] },
  ESP: { atSea: 0.2, areas: [["Western Mediterranean & Strait of Gibraltar", -3, 36.2, 1, "S-80 Isaac Peral boats"]] },
  EGY: { atSea: 0.2, areas: [["Eastern Mediterranean", 30, 32.6, 1, "Type 209/1400 boats"]] },
  VNM: { atSea: 0.2, areas: [["South China Sea", 110, 12, 1, "Kilo-class boats out of Cam Ranh"]] },
  IDN: { atSea: 0.2, areas: [["Java Sea", 110, -5, 1, "Nagapasa (Type 209) boats"]] },
  MYS: { atSea: 0.2, areas: [["South China Sea off Sabah", 115, 7, 1, "Scorpène boats"]] },
  SGP: { atSea: 0.2, areas: [["Singapore Strait & South China Sea", 105, 2, 1, "Invincible-class (Type 218SG) boats"]] },
  BRA: { atSea: 0.2, areas: [["South Atlantic", -42, -25, 1, "Riachuelo (Scorpène) boats"]] },
  CHL: { atSea: 0.2, areas: [["South-East Pacific", -73.5, -33, 1, "Scorpène and Type 209 boats"]] },
  PER: { atSea: 0.2, areas: [["South-East Pacific", -78.5, -12, 1, "Type 209 boats"]] },
  COL: { atSea: 0.2, areas: [["Caribbean", -76, 11.8, 1, "Type 209 boats"]] },
  DZA: { atSea: 0.2, areas: [["Western Mediterranean", 2, 37.5, 1, "Kilo-class boats with Kalibr"]] },
  POL: { atSea: 0.2, areas: [["Baltic Sea", 18, 55.3, 1, "ORP Orzeł (Kilo)"]] },
  NLD: { atSea: 0.2, areas: [["North Sea", 3.5, 54, 1, "Walrus-class boats"]] },
  CAN: { atSea: 0.2, areas: [["North Atlantic", -55, 45, 1, "Victoria-class boats"]] },
  BGD: { atSea: 0.2, areas: [["Bay of Bengal", 90, 21, 1, "Ming-class boats"]] },
  MMR: { atSea: 0.2, areas: [["Andaman Sea", 96, 14, 1, "Kilo and Ming-class boats"]] },
  ZAF: { atSea: 0.2, areas: [["Cape waters", 18, -35, 1, "Heroine (Type 209) boats"]] },
  PRT: { atSea: 0.2, areas: [["Atlantic off Portugal", -11, 38.5, 1, "Tridente (Type 214) boats"]] },
};
