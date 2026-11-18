// Fighter, attack and bomber specs, from public figures (manufacturers, IISS, Jane's, rounded).
// [model pattern, role, generation, combat radius km (typical mission, no refuelling), payload t,
//  top speed Mach, air-to-air 0–10, air-to-ground 0–10]
// Roles: AS air superiority, MR multirole, ST strike, CAS close air support, LA light attack/COIN,
// IN interceptor, BM bomber.
window.AIR_SPECS = [
  [/F-22/, "AS", 5, 850, 1.0, 2.25, 10, 5],
  [/F-35|Adir/, "MR", 5, 1090, 8.1, 1.6, 8, 9],
  [/F-15(E|K|SG|SA|QA|I|EX)|Ra'am|Strike Eagle/, "ST", 4.5, 1270, 10.4, 2.5, 8, 9],
  [/F-15/, "AS", 4, 1960, 7.3, 2.5, 9, 5],
  [/F-16(I|E|F|V| Block (5|6|7))|Sufa|Viper|Desert Falcon|Block 70|Block 5\d|Block 60|KF-16|F-16C|F-16IQ/, "MR", 4.5, 580, 7.7, 2.0, 8, 8],
  [/F-16/, "MR", 4, 550, 7.7, 2.0, 7, 7],
  [/F\/A-18E|F\/A-18F|Super Hornet|EA-18G/, "MR", 4.5, 720, 8.0, 1.6, 8, 8],
  [/F\/A-18|CF-18|EF-18|Hornet/, "MR", 4, 740, 6.2, 1.8, 7, 7],
  [/F-14/, "AS", 4, 925, 6.5, 2.34, 7, 4],
  [/F-4|Phantom/, "MR", 3, 680, 8.5, 2.2, 4, 5],
  [/F-5|Saeqeh|Kowsar|Tiger/, "LA", 3, 300, 3.2, 1.6, 3, 3],
  [/Mirage 2000-?5|Mirage 2000-?9|Mirage 2000P|Mirage 2000 \/ 5/, "MR", 4, 550, 6.3, 2.2, 7, 6],
  [/Mirage 2000D/, "ST", 4, 600, 6.3, 2.2, 5, 7],
  [/Mirage 2000/, "MR", 4, 550, 6.3, 2.2, 7, 6],
  [/Mirage (III|5|F1)|Mirage F1/, "MR", 3, 425, 4.0, 2.0, 4, 4],
  [/Rafale/, "MR", 4.5, 1100, 9.5, 1.8, 9, 9],
  [/Typhoon|Eurofighter/, "MR", 4.5, 1000, 9.0, 2.0, 9, 7],
  [/Gripen E|Gripen C\/D\/E|F-39/, "MR", 4.5, 1300, 6.0, 2.0, 8, 8],
  [/Gripen|JAS 39/, "MR", 4.5, 800, 5.3, 2.0, 7, 7],
  [/Tornado/, "ST", 4, 1390, 9.0, 2.2, 3, 8],
  [/Jaguar/, "ST", 3, 850, 4.5, 1.6, 2, 6],
  [/AMX/, "LA", 3, 520, 3.8, 0.86, 1, 5],
  [/AV-8|Harrier/, "CAS", 4, 550, 6.0, 0.89, 3, 6],
  [/A-10/, "CAS", 4, 460, 7.3, 0.56, 1, 9],
  [/Su-25/, "CAS", 3, 375, 4.4, 0.8, 1, 8],
  [/Su-34/, "ST", 4.5, 1100, 12.0, 1.8, 5, 9],
  [/Su-24/, "ST", 3, 615, 8.0, 1.6, 1, 7],
  [/Su-57|Felon/, "MR", 5, 1500, 10.0, 2.0, 9, 8],
  [/Su-35/, "AS", 4.5, 1580, 8.0, 2.25, 9, 7],
  [/Su-30|Su-30MKI|Su-30SM/, "MR", 4.5, 1500, 8.0, 2.0, 8, 8],
  [/Su-27|J-11/, "AS", 4, 1340, 6.0, 2.35, 8, 4],
  [/Su-22|Su-17/, "ST", 3, 630, 4.0, 1.7, 1, 5],
  [/MiG-31/, "IN", 4, 720, 3.0, 2.83, 8, 4],
  [/MiG-29(SMT|UPG|K|M|M2|SMP|BM)|MiG-29M/, "MR", 4.5, 800, 5.5, 2.25, 8, 6],
  [/MiG-29/, "AS", 4, 700, 3.5, 2.25, 7, 4],
  [/MiG-23/, "MR", 3, 600, 3.0, 2.35, 3, 3],
  [/MiG-21 (Bison|LanceR)|MiG-21 Bison/, "IN", 3, 450, 1.5, 2.05, 4, 3],
  [/MiG-1[579]|J-[56]\b/, "IN", 1, 300, 0.5, 1.0, 1, 1],
  [/J-7|F-7|MiG-21/, "IN", 3, 450, 1.3, 2.05, 3, 2],
  [/J-20/, "AS", 5, 1100, 3.0, 2.0, 9, 6],
  [/J-16/, "MR", 4.5, 1500, 12.0, 2.0, 9, 9],
  [/J-15/, "MR", 4.5, 1000, 6.5, 2.0, 8, 7],
  [/J-10C|J-10CE/, "MR", 4.5, 850, 7.0, 1.8, 8, 7],
  [/J-10/, "MR", 4, 550, 6.0, 1.8, 7, 6],
  [/JF-17|FC-1/, "MR", 4, 700, 3.6, 1.6, 6, 6],
  [/JH-7/, "ST", 3.5, 900, 9.0, 1.75, 1, 7],
  [/Q-5|A-5/, "LA", 2, 400, 2.0, 1.12, 1, 4],
  [/Tejas/, "MR", 4.5, 500, 5.3, 1.6, 7, 6],
  [/FA-50|T-50/, "LA", 4, 440, 4.5, 1.5, 5, 6],
  [/F-CK-1|Ching-kuo/, "MR", 4, 600, 3.9, 1.8, 6, 5],
  [/Kfir/, "MR", 3, 770, 6.0, 2.3, 4, 5],
  [/A-4|Skyhawk|Fightinghawk/, "LA", 3, 1100, 4.5, 0.85, 2, 5],
  [/Hawk/, "LA", 3, 400, 3.0, 0.8, 2, 4],
  [/L-159/, "LA", 3, 500, 2.3, 0.8, 3, 4],
  [/Yak-130/, "LA", 4, 550, 3.0, 0.85, 2, 4],
  [/L-39|K-8|MB-339|Alpha Jet/, "LA", 2, 400, 1.0, 0.7, 1, 2],
  [/Super Tucano|A-29|T-35|PC-7|T-6|Pucará/, "LA", 2, 550, 1.55, 0.5, 1, 4],
  [/B-52/, "BM", 3, 7000, 32.0, 0.86, 0, 9],
  [/B-1/, "BM", 4, 5500, 34.0, 1.25, 0, 9],
  [/B-2/, "BM", 5, 6000, 23.0, 0.95, 0, 10],
  [/Tu-160/, "BM", 4, 7300, 40.0, 2.05, 0, 9],
  [/Tu-95/, "BM", 3, 6000, 15.0, 0.75, 0, 8],
  [/Tu-22M/, "BM", 4, 2400, 24.0, 1.88, 0, 8],
  [/H-6/, "BM", 3, 3500, 12.0, 0.75, 0, 8],
  [/Il-28|H-5/, "BM", 2, 1100, 3.0, 0.75, 0, 3],
];
window.AIR_ROLE = { AS: "air superiority", MR: "multirole", ST: "strike", CAS: "close air support", LA: "light attack", IN: "interceptor", BM: "bomber" };
// Air forces with aerial refuelling (tankers) extend their jets' reach.
window.TANKERS = new Set(["USA", "GBR", "FRA", "CHN", "RUS", "ISR", "SAU", "ARE", "JPN", "AUS", "CAN", "IND", "ITA", "ESP", "TUR", "SGP", "KOR", "NLD", "DEU", "BRA", "PAK", "IRN", "COL", "CHL", "QAT"]);
window.airSpec = model => {
  const parts = String(model).split(/\s*\/\s*|\s*&\s*/);
  for (const part of [model].concat(parts)) { const r = window.AIR_SPECS.find(([re]) => re.test(part)); if (r) return { role: r[1], gen: r[2], radius: r[3], payload: r[4], mach: r[5], a2a: r[6], a2g: r[7] }; }
  return null;
};

// Artillery and rocket systems: [model pattern, range km (standard rounds; guided where common), precision 0–1].
window.ARTY_SPECS = [
  [/HIMARS|M270|M142|MLRS|GMLRS/, 80, 0.9], [/Tornado-S/, 120, 0.6], [/Smerch|Polonez/, 70, 0.4], [/Uragan/, 35, 0.2], [/PHL|PCH-191/, 130, 0.7],
  [/Pinaka/, 75, 0.6], [/Astros/, 90, 0.5], [/Chunmoo|K239/, 80, 0.8], [/Fajr|Fateh rockets|Fatah/, 75, 0.4], [/Grad|BM-21|Type 63|Type 81|RM-70|rockets?\b/i, 20, 0.1],
  [/PzH ?2000/, 40, 0.7], [/CAESAR/, 40, 0.7], [/Archer/, 40, 0.8], [/K9|Thunder|Vajra|Vidar|AHS Krab|Krab/, 40, 0.6], [/M109A[67]|Paladin/, 30, 0.7], [/M109/, 22, 0.35],
  [/M777/, 30, 0.8], [/2S35|Koalitsiya/, 40, 0.5], [/2S19|Msta/, 29, 0.4], [/2S[13]|Gvozdika|Akatsiya/, 18, 0.2], [/2S7|Pion/, 37, 0.3],
  [/PLZ-05|PLZ05/, 40, 0.5], [/PCL-181|PCL181/, 40, 0.5], [/Dana|Zuzana/, 30, 0.4], [/G[56]\b|Rhino/, 40, 0.5], [/FH-?77|Bofors/, 30, 0.4], [/FH70/, 24, 0.4],
  [/ATMOS|Soltam/, 40, 0.5], [/L118|L119|light gun/i, 17, 0.4], [/D-30/, 15, 0.1], [/M-46|Type 59-1/, 27, 0.15], [/D-20|Type 66/, 17, 0.1],
  [/M101|M114|M-56|105/, 12, 0.1], [/M198/, 22, 0.3], [/mortar/i, 7, 0.1], [/towed/i, 15, 0.15],
];
window.artySpec = model => {
  for (const part of [model].concat(String(model).split(/\s*\/\s*|\s*&\s*/))) { const r = window.ARTY_SPECS.find(([re]) => re.test(part)); if (r) return { range: r[1], precision: r[2] }; }
  return { range: 18, precision: 0.15 };
};
