// Every type of missile, rated by what it has done in war, not its brochure (0–10):
//   aam  air-to-air (beyond-visual-range and dogfight)      sam  surface-to-air, incl. MANPADS
//   gbm  ground-launched ballistic and rocket artillery missiles
//   agm  air-to-ground (cruise, glide bombs, anti-radiation, precision bombs)
//   asm  anti-ship                                          atgm anti-tank guided missiles
// [aam, sam, gbm, agm, asm, atgm, systems, combat record]. Ratings are scaled in play by each
// country's maintenance (0.85 + 0.15 × maintenance capacity): seekers, motors and launchers that
// are not kept up lose their edge. Not listed: estimated from technology level.
// Effects (js/game.js): air-to-air sharpens the air superiority contest; surface-to-air raises
// or lowers the air-defence rating; ballistic and air-to-ground missiles hit harder or softer;
// anti-ship missiles strengthen naval forces; anti-tank missiles strengthen infantry and armoured vehicles.
window.MISSILE_TYPES = {
  USA: [9.5, 8, 8, 10, 8, 10, "AIM-120D, AIM-9X · Patriot PAC-3 MSE, THAAD, SM-2/3/6, Stinger · ATACMS, PrSM, Dark Eagle · JASSM-ER, JDAM, SDB, Hellfire/JAGM, HARM · LRASM, Maritime Strike Tomahawk, NSM · Javelin, TOW",
    "AIM-120 kills since 1992 and mass drone shoot-downs over the Red Sea; Patriot downed Russia's 'unstoppable' Kinzhal over Kyiv in 2023; THAAD and SM-3 intercepted Iranian ballistic missiles in 2024–25; Javelin's record in Ukraine"],
  ISR: [9.5, 9.5, 8, 10, 7, 10, "Python-5, Derby, AIM-120 · Iron Dome, David's Sling, Arrow 2/3, Iron Beam · LORA · Rampage, Air LORA, Rocks, Spice · Gabriel V · Spike family",
    "Decades of air-to-air dominance; with US help intercepted ~90% of Iranian missiles and drones in 2024–25, including the first combat intercepts in space (Arrow 3); its stand-off missiles destroyed Iran's air defences"],
  RUS: [6, 6.5, 7.5, 6, 7, 7, "R-77-1, R-37M, R-73 · S-400, S-300, Buk-M3, Tor, Pantsir · Iskander-M, Kinzhal, Oreshnik · Kh-101, Kh-59, UMPK glide bombs · Oniks, Kalibr, Zircon · Kornet, Metis",
    "R-37M scored long-range kills on Ukrainian jets, but its air defences failed to stop Ukrainian drones, ATACMS and Neptunes that destroyed several S-400 batteries in Crimea; Kinzhal was shot down by Patriot; glide bombs are effective; Zircon's hypersonic claims are unproven"],
  CHN: [8.5, 7.5, 8, 7, 8.5, 6.5, "PL-15, PL-10, PL-17 · HQ-9B, HQ-19, HQ-16, S-400 · DF-15/16/17/21D/26 · KD-20, YJ-91, LS-6 · YJ-12, YJ-18, YJ-21 · HJ-10, HJ-12",
    "Untested in its own wars: the PL-15 (fired by Pakistan) reportedly downed Indian jets in May 2025, while the HQ-9 (in Pakistani hands) failed to stop Indian strikes; a large anti-ship arsenal built to sink US carriers"],
  GBR: [9, 7, 3, 8, 6, 8, "Meteor, ASRAAM, AIM-120 · Sea Viper (Aster), Sky Sabre (CAMM), Starstreak · GMLRS · Storm Shadow, Brimstone, Paveway IV · NSM · Javelin, NLAW",
    "Meteor is among the best long-range air-to-air missiles; Sea Viper downed Houthi missiles in 2024; Storm Shadow, Brimstone and NLAW proven in Ukraine"],
  FRA: [9, 7.5, 3, 8, 7, 7, "Meteor, MICA NG · SAMP/T, Crotale, Mistral · LRU · SCALP, AASM Hammer · Exocet MM40 B3 · MMP, Milan", "SCALP and Hammer proven in Ukraine; Exocet's record since the Falklands"],
  DEU: [9, 8, 3, 7, 6, 7, "Meteor, IRIS-T · Patriot, IRIS-T SLM · MARS · Taurus · RBS-15, NSM · MELLS (Spike)", "IRIS-T SLM has an almost perfect record over Kyiv"],
  KOR: [8, 8, 8.5, 7, 7, 7, "AIM-120, Meteor · L-SAM, Cheongung, Patriot · Hyunmoo-2/4/5 · SLAM-ER, Taurus · Haeseong · Raybolt", "Hyunmoo-5 carries one of the heaviest conventional warheads"],
  JPN: [8.5, 7.5, 3, 6, 8, 6, "AAM-4B, AAM-5, AIM-120 · PAC-3, SM-3/6, Chu-SAM · glide projectiles from 2026 · JASSM-ER on order · upgraded Type 12, Type 17 · Type 01 LMAT", "Untested; strong anti-ship focus"],
  IND: [7, 7, 7, 7, 8, 6, "Meteor, MICA, Astra, R-77, R-73 · S-400, Akash, Barak 8 · Prithvi, Pralay · BrahMos-A, SCALP, Rudram · BrahMos · Nag, Spike, Konkurs",
    "Lost an air battle to Pakistani AMRAAMs in 2019; in May 2025 its S-400 and Akash downed Pakistani drones and missiles and its BrahMos and SCALP struck deep into Pakistan"],
  PAK: [8, 5, 6.5, 6, 6, 6, "PL-15E, AIM-120C-5, AIM-9 · HQ-9/P, HQ-16FE · Fatah, Abdali, Shaheen · Ra'ad, CM-400AKG · Harbah, C-802 · Baktar-Shikan",
    "Its PL-15Es reportedly downed Indian jets in May 2025 and its AMRAAMs scored in 2019, but its air defences failed to stop Indian strikes on its air bases"],
  IRN: [3, 3.5, 6.5, 4, 6, 6, "AIM-54 remnants, R-73, Fakour-90 · Bavar-373, Khordad-15, Tor (its S-300s destroyed) · Fateh-110/313, Kheibar Shekan, Emad, Fattah · Qased · Noor, Qader · Dehlavieh",
    "Israel destroyed its S-300s and radars in 2024–25; some of its ballistic missiles got through Israel's defences while many failed; it supplied the Houthis' anti-ship missiles"],
  PRK: [3, 4, 6, 3, 4, 4, "R-73, R-60 · KN-06, SA-2/3/5 · KN-23/24/25, Hwasong · KN-19 · Bulsae", "About half the KN-23s fired by Russia in Ukraine went astray"],
  TUR: [6.5, 6.5, 6.5, 7, 7, 7, "AIM-120, Gökdoğan · S-400 (unused), Hisar, Siper · Bora, Tayfun · SOM, MAM-L/C drone munitions · Atmaca · OMTAS, Kornet", "Its MAM drone munitions proved themselves in Syria, Libya and Karabakh"],
  UKR: [5, 7.5, 5, 6.5, 8, 9, "R-27, R-73, AIM-120 and AIM-9 on F-16s · Patriot, NASAMS, IRIS-T, SAMP/T, S-300, Buk, Gepard · ATACMS, Hrim-2 · Storm Shadow/SCALP, JDAM-ER, Hammer · Neptune, Harpoon, naval drones · Javelin, Stugna-P, NLAW",
    "Shoots down most Russian drones and many cruise missiles; the Neptune sank the Moskva; its anti-tank missiles destroyed thousands of Russian armoured vehicles"],
  TWN: [7, 7, 5, 6, 8, 7, "AIM-120, Sky Sword II · Patriot, Tien Kung III, NASAMS · ATACMS, Thunderbolt-2000 · JSOW, Wan Chien · Hsiung Feng II/III, Harpoon · Javelin, TOW", "Untested; dense anti-ship defences"],
  SAU: [8, 7, 5, 7, 5, 6, "AIM-120, Meteor · Patriot, THAAD · DF-21 · Storm Shadow, Paveway · Harpoon · TOW", "Intercepted many Houthi missiles but not the 2019 drone and cruise-missile attack on Abqaiq"],
  ARE: [8, 8, 4, 7, 5, 6, "AIM-120, MICA · THAAD, Patriot, Cheongung · Black Shaheen · Exocet", "Made THAAD's first combat intercept in 2022"],
  EGY: [6, 6, 4, 6, 5, 5, "MICA, R-77 · S-300VM, Buk, NASAMS · Scud · SCALP · Harpoon, Exocet · TOW, Kornet", "Untested in modern war"],
  POL: [7.5, 7.5, 6, 7, 6, 8, "AIM-120D, AIM-9X · Patriot, Narew (CAMM), Piorun · ATACMS, Chunmoo · JASSM-ER · NSM · Javelin, Spike", "Its Piorun is among the best shoulder-fired missiles (proven in Ukraine)"],
  AUS: [8, 7, 4, 8, 7, 8, "AIM-120, AIM-9X · NASAMS, SM-2/6 · PrSM coming · JASSM-ER · NSM, Tomahawk · Javelin", ""], ITA: [8, 7.5, 3, 7, 6, 7, "Meteor, IRIS-T · SAMP/T · Storm Shadow · Teseo · Spike", ""],
  ESP: [8, 6.5, 2, 6.5, 6, 6, "Meteor, IRIS-T · Patriot · Taurus · Harpoon · Spike", ""], NLD: [8, 7, 3, 7, 6, 7, "AIM-120 · Patriot · JASSM-ER · Harpoon · Spike", ""],
  NOR: [7.5, 7.5, 3, 7, 9, 7, "AIM-120 · NASAMS · JSM · NSM · Javelin", "Makes NASAMS and the Naval Strike Missile"], SWE: [8, 7, 2, 6.5, 7, 7, "Meteor, IRIS-T · Patriot, RBS 70 · Taurus · RBS 15 · NLAW", ""],
  FIN: [7.5, 7.5, 4, 7, 6, 7, "AIM-120 · NASAMS, David's Sling · JASSM-ER · Gabriel · Spike, NLAW", ""], GRC: [7, 6.5, 3, 6, 6, 6, "Meteor, MICA · Patriot, S-300 · SCALP · Exocet", ""],
  CAN: [7.5, 4, 2, 6, 5, 6, "AIM-120 · little ground-based air defence · Harpoon", ""], AZE: [6, 6, 6, 6, 4, 6, "R-27 · S-300, Barak 8 · LORA · Spike", "Its LORA and drones were decisive in 2020"],
  VNM: [5, 5.5, 4, 4, 6, 5, "R-27, R-73 · S-300, Spyder · Scud · Club-K, Kh-35", ""], DZA: [6, 7, 5, 5, 6, 5, "R-77 · S-400, S-300, Pantsir · Iskander-E · Club-S · Kornet", ""],
  BLR: [5, 6, 6, 4, 0, 5, "R-77 · S-400, S-300 · Iskander, Polonez · Kornet", ""], SGP: [8, 8, 2, 7, 6, 7, "AIM-120 · Aster 30, Spyder · Harpoon · Spike", ""],
};
window.missileTypes = c => {
  const r = window.MISSILE_TYPES[c.iso3];
  if (r) return { aam: r[0], sam: r[1], gbm: r[2], agm: r[3], asm: r[4], atgm: r[5], systems: r[6], record: r[7], est: false };
  const g = (c.tech && c.tech.gen) || 2, v = x => Math.round(Math.max(1, Math.min(7, x)) * 10) / 10;
  return { aam: v(1.5 * g - 1), sam: v(1.4 * g - 0.5), gbm: v(c.missiles && c.missiles.bm ? 1.2 * g : 1), agm: v(1.4 * g - 1.5), asm: v(1.3 * g - 1), atgm: v(1.4 * g - 0.5), systems: "", record: "", est: true };
};
