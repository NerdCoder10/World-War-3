// Maintenance and spare parts in a war with no trade.
// Every weapon needs a stream of spare parts (engines, avionics, barrels, seals, tyres) from the
// country that makes it. In peacetime a country's mission-capable rate follows its readiness
// (js/models.js). At war with all trade cut, kit made abroad keeps flying only while stocks last
// and by cannibalising other airframes: after about 4 months only what the country's own depots
// can make or reverse-engineer stays in service. Parts still come from yourself, your conquests,
// your allies and treaty partners. Licence-built kit (India's Su-30MKI, Japan's F-15J) and kit a
// country builds itself is never cut off.

// Model name → country (or countries, for joint programmes) that makes its parts. First match wins.
// Generic entries ("Patrol craft", "Trainers", "Towed") count as locally supported.
window.MODEL_ORIGIN = [
  [/Typhoon|Eurofighter/, ["GBR", "DEU", "ITA", "ESP"]], [/Tornado/, ["GBR", "DEU", "ITA"]], [/NH90/, ["FRA", "DEU", "ITA", "NLD"]],
  [/A400M/, ["FRA", "DEU", "ESP", "GBR", "TUR"]], [/FH70/, ["GBR", "DEU", "ITA"]], [/FREMM|Horizon/, ["FRA", "ITA"]], [/Alpha Jet|Tigre|Tiger\b/, ["FRA", "DEU"]],
  [/AS332|H225|H145|H135|EC635|EC725|AS565|AS350|Caracal|Panther|Ecureuil/, ["FRA", "DEU"]], [/JF-17|FC-1/, ["PAK", "CHN"]], [/AW101|Merlin/, ["ITA", "GBR"]],
  [/Boxer/, ["DEU", "NLD"]], [/ASCOD|Ulan/, ["AUT", "ESP"]],
  // Built under licence or at home, so the operator makes its own parts (checked per country below).
  [/F-15J|F-2\b|Type (10|16|74|89|90)\b|Soryu|Taigei|Oyashio|Izumo|Hyuga|Mogami|Kongo|Atago|Maya|US-2|Kawasaki|Mitsubishi|Komatsu|P-1\b|C-2\b/, ["JPN"]],
  [/Arjun|Tejas|Dhruv|Rudra|Prachand|Pinaka|Dhanush|Kalvari|Arihant|Vikrant|Kolkata|Visakhapatnam|Shivalik|Ajeya|Bhishma|Sarath|Su-30MKI|Kiran|HAL\b/, ["IND"]],
  [/Shahed|Mohajer|Ghadir|Kowsar|Saeqeh|Zulfiqar|Karrar|Toophan|Jamaran|Moudge|IRGC|Ababil|Fateh/, ["IRN"]],
  [/Al-Khalid|Al-Zarrar|Talha|MFI-17|Mushshak|Burraq/, ["PAK"]],
  [/Merkava|Namer|Kfir|Heron|Hermes|Harop|Harpy|Dvora|Shaldag|Sa'?ar|Searcher|ATMOS|Elbit/, ["ISR"]],
  [/Bayraktar|TB2|Akinci|Anka|Otokar|Kirpi|Altay|F[ıi]rt[ıi]na|ACV-15|Pars\b|Ejder|T129|Atak|Anadolu|MILGEM|Ada-class|H[üu]rjet|Turkish/, ["TUR"]],
  [/\bK(1|1A1|1A2|2|9|21|200|239)\b|KF-21|FA-50|T-50|KT-1|Surion|Chang Bogo|Dosan|Sohn Won|Dokdo|Sejong|KDX|Chunmoo|K-SS/, ["KOR"]],
  [/T-84|Oplot|BTR-[34]\b|Bohdana|Neptune|Sea Baby|Magura|Stugna|\bAn-\d+/, ["UKR"]],
  [/PT-91|Rosomak|Krab|Borsuk|Piorun|W-3|Sok[oó][lł]|Anakonda/, ["POL"]],
  [/L-39|L-159|Zl[ií]n|\bDana\b|Zuzana|RM-70|Tatra|T-72M4CZ/, ["CZE"]],
  [/IAR|TAB-|Zimbru|MLI-84/, ["ROU"]],
  [/Gripen|CV90|Archer|Visby|Gotland|S[öo]dermanland|Strv|Bofors|BvS10|SK 60|Strf|Pbv/, ["SWE"]],
  [/Patria|XA-1\d\d|AMV|Sisu|Hamina/, ["FIN"]], [/Pandur/, ["AUT"]],
  [/Piranha|Mowag|Pilatus|PC-\d+|Eagle 4x4/, ["CHE"]],
  [/LAV|Halifax/, ["CAN"]],
  [/Collins|Canberra-class|Hobart|Anzac|Bushmaster|Hawkei/, ["AUS"]],
  [/Bionix|Terrex|Formidable|Endurance|Type 218SG/, ["SGP"]],
  [/Super Tucano|A-29|EMB-?\d+|Embraer|KC-390|C-390|Guarani|Cascavel|Urutu|EE-\d+|Astros|Riachuelo|Tamandar[ée]|T-27\b/, ["BRA"]],
  [/Rooikat|Ratel|Olifant|\bG[56]\b|Casspir|Mamba|Rooivalk|Badger|Denel|Valkiri|Bateleur/, ["ZAF"]],
  [/Juan Carlos|[ÁA]lvaro|S-80|Isaac Peral|Galerna|Pizarro|C-101|C-295|CN-235|Santa Mar[ií]a/, ["ESP"]],
  [/Walrus|De Zeven|Holland-class|Karel Doorman/, ["NLD"]], [/\bUla\b|Skjold|Fridtjof|NASAMS/, ["NOR"]],
  [/Ariete|Centauro|Dardo|Freccia|AW1\d\d|A129|Mangusta|AB-?2\d\d|A109|M-34[56]|MB-339|C-27J|Cavour|Garibaldi|Trieste|Todaro|Sauro|Bergamini|Lince|SF-260/, ["ITA"]],
  [/Rafale|Mirage|Leclerc|AMX|CAESAR|VAB|VBCI|Super [EÉ]tendard|Gazelle|Puma\b(?!.*IFV)|SA ?330|Scorp[èe]ne|Agosta|Mistral|Charles de Gaulle|La Fayette|Gowind|Panhard|Atlantique|Alouette|Dauphin|Fennec|Exocet/, ["FRA"]],
  [/Leopard|Type 2\d\d|PzH|Marder|Puma IFV|Dingo|Fuchs|Wiesel|Dolphin|MEKO|Heroine|Nagapasa|Preveze|G[üu]r\b|Poseidon|Tridente|Invincible/, ["DEU"]],
  [/Challenger|Scimitar|Scorpion|Warrior|Vickers|Chieftain|(?<!Black )Hawk\b|Harrier|Lynx|Wildcat|Astute|Vanguard|Type 4[5]|Type 2[36]|Queen Elizabeth|Daring|Saxon|Mastiff|Jackal|L11[89]|Tucano|Shorts|Firefly|T-67|Grob|Prefect|Victoria-class/, ["GBR"]],
  [/\bJ-\d+|\bJL-\d+|\bK-8|\bQ-5|\bH-6[KN]?\b|\bY-\d+|\bZ-\d+|Type 0\d\d|Type (59|62|63|69|81|85|86|96|99|15)\b|ZTZ|ZBD|WZ-|VN-\d|VT-4|MBT-2000|PLZ|PHL|Wing Loong|\bCH-[3-7]\b|Rainbow|Harbin|Ming|Song|Yuan|Shang|Jin-class|Luyang|Jiangkai|Jiangdao|Fujian|Liaoning|Shandong|MA60|F-7|SR5|SH-15|A-100|NORINCO|Chinese/, ["CHN"]],
  [/MiG|Su-\d+|Yak-\d+|Tu-\d+|Il-\d+|Mi-\d+|Ka-\d+|T-(54|55|62|64|72|80|90|14)\b|PT-76|BMP|BMD|BTR|BRDM|MT-LB|2S\d+|BM-\d+|D-30|D-20|M-46|Grad|Smerch|Kilo|Foxtrot|Romeo|Osa\b|Tarantul|Kuznetsov|Buyan|Karakurt|Gorshkov|Grigorovich|Krivak|Sovremenny|Udaloy|Slava|Kirov|Akula|Yasen|Borei|Oscar|Lada|Ropucha|Orlan|Lancet|Geran|Armata|Gvozdika|Tunguska|Pantsir|S-[34]00/, ["RUS"]],
  [/F-1[4568]|F\/A-18|CF-18|F-35|F-22|F-5|A-10|AH-64|AH-1|UH-60|Black Hawk|SH-60|MH-60|UH-1|Huey|Bell|CH-47|CH-53|C-130|C-17|C-5|KC-\d+|M1A|Abrams|M60|M48|M41|M113|M109|M110|M777|M198|M10[12]|M114|M270|HIMARS|Bradley|Stryker|JLTV|MRAP|Arleigh|Ticonderoga|Nimitz|Ford-class|Virginia|Los Angeles|Ohio|Seawolf|T-6|Texan|Reaper|Predator|MQ-\d|E-2|E-3|P-8|AAV|Perry|Knox|Patriot|Cyclone|Wasp|America-class|San Antonio|T-34|B-[125]\b/, ["USA"]],
];
window.modelOrigin = model => { const r = window.MODEL_ORIGIN.find(([re]) => re.test(model)); return r ? r[1] : null; };
// Kit a country builds under licence, so it makes its own parts.
window.LICENCE = {
  KOR: /F-16|F-15K|UH-60|CH-47|M48/, TUR: /F-16|Type 2\d\d|Preveze|G[üu]r|M113|ACV/, EGY: /M1A/, IND: /MiG-2[179]|Jaguar|T-72|T-90|BMP-2|Su-30|Mi-17|Dornier|K9|Vajra|Hawk/,
  CHN: /Su-27|Su-30|J-11|Mi-17|Mi-171/, POL: /T-72|PT-91|BMP-1/, JPN: /F-15|F-35|UH-60|SH-60|CH-47|AH-64|Patriot|MLRS|M270/, ISR: /F-16I|F-15I/,
  AUS: /F\/A-18|M1A/, CAN: /CF-18/, ITA: /F-35|AB-?2\d\d|Bell/, NLD: /F-35/, IRN: /F-14|F-4|F-5|Su-24|MiG-29|T-72|Kilo|Bell|AH-1|CH-47|UH-1|AB-?2\d\d|M60|M48|Chieftain|T-5[45]|Type 59|M113|BMP|M109|C-130/, PRK: /MiG|T-62|T-55|BTR|BMP|Romeo/,
  UKR: /T-64|T-72|T-80|BTR|BMP|MiG-29|Su-2[457]|Mi-\d+/, RUS: /An-\d+|BTR-[34]/, PAK: /Type 85|Type 59|Type 69|Al-|K-8|F-7/,
};
// The share of a model's parts that comes from outside (null origins and licence-built parts are local).
window.modelParts = (iso, model) => model.split(/\s*\/\s*|\s*&\s*|\s*\+\s*/).map(part => {
  if (window.LICENCE[iso] && window.LICENCE[iso].test(part)) return iso;
  const o = window.modelOrigin(part);
  return o ? (o.includes(iso) ? iso : o) : null;
}).filter(Boolean);

// How much of a cut-off fleet a country's own depots keep going for good, by making or
// reverse-engineering parts (0–1). Not listed: from the size of its manufacturing base.
window.MAINT_SKILL = {
  USA: [0.9, "The world's largest depot network and defence industry"],
  CHN: [0.8, "Copies and builds parts for almost everything it flies"],
  ISR: [0.8, "Rebuilds and upgrades its own US-made jets and tanks"],
  IRN: [0.7, "45 years of sanctions taught it to reverse-engineer parts; it still flies US F-14s and F-4s"],
  RUS: [0.6, "Large Soviet-era repair plants, but short of Western microelectronics"],
  FRA: [0.7, "Builds and maintains almost all of its own kit"], GBR: [0.6, "Strong depots, though much of its kit uses US parts"],
  DEU: [0.6, "Strong industry, but chronic spare-parts shortages"], JPN: [0.7, "Licence-builds and maintains its US designs"],
  KOR: [0.7, "Builds most of its own kit and licence-builds the rest"], IND: [0.5, "Licence-builds Russian kit at HAL and the ordnance factories, but still needs Russian parts"],
  TUR: [0.6, "Its own industry now builds most of what it fields"], PAK: [0.4, "Co-produces with China, but its US F-16s depend on US support"],
  PRK: [0.45, "Keeps Soviet-era kit running by cannibalising and copying"], CUB: [0.4, "Has kept Soviet kit running for decades without supplies"],
  SYR: [0.25, "Kept Soviet kit running only with Russian help"], VEN: [0.25, "Its US F-16s have been grounded for lack of parts since the 2006 embargo"],
  UKR: [0.55, "Its repair plants keep Soviet and Western kit fighting"], ITA: [0.6, "Builds aircraft, helicopters, ships and armour"],
  SWE: [0.65, "Builds its own fighters, armour and submarines"], ESP: [0.5, "Builds ships, transports and armour parts"],
  EGY: [0.35, "Assembles M1A1 Abrams, but most kit depends on US, Russian and French parts"], SAU: [0.2, "Its huge Western arsenal depends on contractors and US parts"],
  ARE: [0.3, "Growing industry, but depends on Western contractors"], AUS: [0.45, "Sustains its fleet locally, but parts come from the US"],
};
window.maintSkill = iso => {
  const m = window.MAINT_SKILL[iso];
  if (m) return m[0];
  const mfg = (window.WAR_ECON && window.WAR_ECON[iso] && window.WAR_ECON[iso][0]) || 0.1;
  return Math.min(0.5, 0.1 + 0.1 * Math.log2(1 + mfg));
};
// Days of war for stocks and cannibalised parts to run out.
window.PARTS_DAYS = 120;
