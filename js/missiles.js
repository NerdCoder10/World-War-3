// Conventional missiles and air defence, in place of nuclear weapons.
//
// Nuclear weapons are left out of the game: no country can end a war with them. Instead every
// country fires its real conventional missile arsenal: ballistic missiles (short- to
// intermediate-range, e.g. Iskander, DF-15/16/17/21D/26, Fateh/Shahab, Hyunmoo, Prithvi/Pralay,
// ATACMS/PrSM) and cruise missiles (Tomahawk, JASSM, Kalibr/Kh-101, CJ-10/100, BrahMos, Storm
// Shadow/SCALP, Taurus, Hyunmoo-3). Counts are rough 2025 open-source estimates of usable stock
// (CSIS Missile Threat, IISS, national sources); short-range rockets fired by artillery are counted
// with the artillery instead.
//
// Air defence (0–10) is how much of an incoming salvo is shot down: Israel's layered Iron Dome,
// David's Sling and Arrow 10; Patriot/THAAD/S-400-class networks 6–8; little or none 0–2.
//
// In battle (js/game.js missileSalvo) each side fires 4% of its stock a day (at least 5 missiles
// if it has them). Hits = fired × (1 − 0.08 × the enemy's air defence). A ballistic hit is worth
// 2.5 units of combat power that day, a cruise missile 1.5. Stocks rebuild 0.5% of the full
// arsenal a day.
window.MISSILES = {
  //   ballistic, cruise, air defence, note
  USA: [1500, 8000, 8, "Tomahawk (~4,000), JASSM/JASSM-ER (~5,000 air-launched), ATACMS and PrSM; Patriot, THAAD and Aegis"],
  CHN: [2500, 1500, 7, "PLA Rocket Force DF-11/15/16/17/21D/26 conventional brigades, CJ-10/100 cruise missiles; HQ-9 and S-400"],
  RUS: [900, 2500, 7, "Iskander-M, Kinzhal, Kalibr, Kh-101 and Kh-22/32, rebuilt at ~100+ a month during the war; S-300/400 network"],
  IRN: [2000, 500, 4, "Fateh-110/313, Zolfaghar, Shahab-3, Emad, Kheibar Shekan, Paveh and Hoveyzeh cruise missiles, after the 2024–25 exchanges with Israel"],
  PRK: [1000, 100, 3, "KN-23/24/25, Scud and Nodong families; Hwasal cruise missiles"],
  ISR: [150, 800, 10, "LORA and air-launched Rampage, Delilah and Air LORA; Iron Dome, David's Sling and Arrow 2/3"],
  IND: [1000, 1500, 6, "Prithvi, Pralay and Agni-family conventional variants, BrahMos and Nirbhay; S-400 and Akash"],
  PAK: [600, 300, 4, "Fatah rockets, Abdali, Ghaznavi and Shaheen conventional, Babur and Ra'ad cruise missiles; HQ-9"],
  KOR: [2000, 500, 7, "Hyunmoo-2/4/5 ballistic and Hyunmoo-3 cruise missiles; KAMD (L-SAM, Cheongung, Patriot)"],
  JPN: [0, 600, 7, "Tomahawk (400 on order), upgraded Type 12 and JASSM-ER; Aegis and Patriot PAC-3"],
  TWN: [200, 800, 7, "Hsiung Feng IIE/III and Tien Kung-based land attack missiles, ATACMS; Patriot and Sky Bow"],
  SAU: [150, 300, 6, "DF-21 conventional and Storm Shadow; Patriot and THAAD"],
  ARE: [50, 300, 7, "Black Shaheen; THAAD, Patriot, Cheongung"],
  TUR: [300, 500, 5, "Bora, Tayfun, SOM and Gezgin; Hisar and S-400"],
  GBR: [0, 800, 5, "Storm Shadow and Tomahawk; Sea Viper and Sky Sabre"],
  FRA: [0, 700, 6, "SCALP and MdCN naval cruise missiles; SAMP/T"],
  DEU: [0, 600, 6, "Taurus KEPD 350; Patriot, IRIS-T SLM, Arrow 3"],
  ITA: [0, 200, 5, "Storm Shadow; SAMP/T"],
  ESP: [0, 100, 4, "Taurus; Patriot"],
  NLD: [0, 100, 5, "JASSM-ER and Tomahawk on order; Patriot"],
  POL: [300, 200, 6, "HIMARS/ATACMS and Chunmoo, JASSM-ER; Patriot and Narew"],
  UKR: [100, 400, 7, "Neptune, Storm Shadow/SCALP, ATACMS and home-built long-range drones; Patriot, NASAMS, IRIS-T"],
  FIN: [0, 100, 5, "JASSM-ER; NASAMS and David's Sling"],
  NOR: [0, 200, 5, "Naval Strike Missile, JSM; NASAMS"],
  SWE: [0, 100, 5, "Taurus and RBS 15; Patriot"],
  GRC: [0, 100, 5, "SCALP; Patriot and S-300"],
  AUS: [0, 300, 5, "Tomahawk and JASSM-ER, PrSM coming; NASAMS"],
  CAN: [0, 50, 3, "Air-launched missiles; limited ground-based air defence"],
  EGY: [100, 50, 5, "Scud-B and Project-T; S-300VM and Buk"],
  SYR: [50, 0, 1, "Remnants after the 2024 fall of the Assad government and Israeli strikes"],
  YEM: [400, 300, 1, "Houthi Burkan, Toufan, Palestine-2 and Quds cruise missiles"],
  IRQ: [50, 0, 2, "Small stocks; militias hold Iranian missiles"],
  VNM: [100, 200, 4, "Scud and Club-K/Kalibr coastal missiles; S-300"],
  IDN: [0, 50, 2, "Air- and ship-launched missiles"],
  BLR: [100, 0, 5, "Iskander and Polonez; S-400"],
  ARM: [50, 0, 3, "Iskander and Scud"],
  AZE: [100, 50, 4, "LORA and Polonez; S-300 and Barak 8"],
  KAZ: [50, 0, 4, "Tochka-U; S-300"],
  DZA: [100, 100, 5, "Iskander-E and Club-S; S-400"],
  MAR: [50, 50, 3, "Small stocks; Barak and Sky Dragon air defence"],
  VEN: [0, 50, 3, "Chinese and Russian anti-ship and cruise missiles; S-300VM"],
  BRA: [0, 100, 2, "AV-TM300 cruise missile"],
  CHL: [0, 50, 2, "Air-launched missiles"],
  SGP: [0, 50, 6, "Layered air defence (Aster 30, SPYDER)"],
  QAT: [50, 50, 6, "BP-12A; Patriot and NASAMS"],
  KWT: [0, 20, 6, "Patriot"],
  BHR: [0, 0, 5, "Patriot"],
  JOR: [0, 0, 4, "Patriot"],
  OMN: [0, 20, 4, "NASAMS"],
  CZE: [0, 0, 4, "SPYDER"], ROU: [0, 0, 5, "Patriot and HIMARS"], HUN: [0, 0, 4, "NASAMS"], DNK: [0, 50, 3, "SAMP/T on order"],
  LTU: [0, 0, 4, "NASAMS, HIMARS"], LVA: [0, 0, 3, "IRIS-T"], EST: [0, 0, 3, "IRIS-T"], CHE: [0, 0, 5, "Patriot on order"],
  MYS: [0, 30, 2, ""], THA: [0, 30, 3, ""], PHL: [0, 30, 2, "BrahMos coastal batteries"], LBY: [20, 0, 1, ""], ETH: [20, 0, 2, ""],
  NGA: [0, 0, 1, ""], ZAF: [0, 20, 2, ""], ARG: [0, 10, 1, ""], MEX: [0, 0, 1, ""], CUB: [0, 0, 2, ""], AFG: [0, 0, 0, ""],
};
(function () {
  window.COUNTRIES.forEach(c => {
    const m = window.MISSILES[c.iso3];
    const ad = m ? m[2] : Math.max(0, Math.min(3, Math.round(c.tech ? c.tech.gen - 1 : 1)));
    c.missiles = { bm: m ? m[0] : 0, cm: m ? m[1] : 0, ad, note: (m && m[3]) || (ad ? "Basic short-range air defence only" : "No significant missiles or air defence"), estimated: !m };
    c.missileTotal = c.missiles.bm + c.missiles.cm;
  });
})();
