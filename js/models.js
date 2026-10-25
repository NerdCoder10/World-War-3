// Real-world performance of each weapon model, so a unit's power reflects what it is.
//
// Every model in js/equipment.js is matched (by name) to a family: its generation and role,
// with representative specifications from open sources (manufacturer data, IISS, Jane's).
// `mult` is combat value relative to a typical unit of its category: a 1980s-90s design such
// as the T-72B3 or F-16C is about 1. Specs are typical for the family, not exact for every
// variant. Combat power per unit = category power × mult × 0.8 × readiness factor
// (js/game.js), so a poorly maintained modern fleet still fights below its paper value.
(function () {
  // [regex, family label, mult, specs]
  const F = {
    tanks: [
      [/T-14|SEPv3|M1A2(?!S|T)|Leopard 2A7|Leopard 2A6|2A4–A7|Challenger 3|K2\b|K2PL|K2 Black|Merkava Mk4|Leclerc|Type 10|Type 99A|Altay/i, "4th-gen main battle tank", 1.8,
        { arm: "120/125 mm smoothbore, gun-launched or top-attack-proof fire control", speed: "65–72 km/h", range: "400–550 km", protect: "Composite/modular armour, active protection on newest", crew: "3–4" }],
      [/M1A2S|M1A2T|M1A1|Abrams|Leopard 2|Challenger 2|K1A|Merkava Mk3|T-90|T-80|Type 96|Ariete|Type 90|Al-Khalid|Arjun|PT-91|VT-4|MBT-2000|Karrar|Bhishma|Sabra|M60T|Type 85|Al-Zarrar|T-84|Challenger 1|VT-1A/i, "3rd-gen main battle tank", 1.3,
        { arm: "120/125 mm gun, thermal sights, ATGM-capable on Soviet types", speed: "60–70 km/h", range: "400–550 km", protect: "Composite or ERA", crew: "3–4" }],
      [/T-72|T-64|M60|Leopard 1|Chieftain|AMX-30|M48|Type 88|Type 74|CM-11|Zulfiqar|TAM|Pokpung|Chonma-20|Type 59D|Type 69-II|Ajeya|Vickers|TR-85|TR-580|OF-40|M-84/i, "2nd-gen main battle tank", 0.8,
        { arm: "105–125 mm gun, partly modernised fire control", speed: "50–60 km/h", range: "450–500 km", protect: "Steel, some ERA", crew: "3–4" }],
      [/Type 15|light|Harimau|Sabrah/i, "Light tank", 0.6, { arm: "105 mm gun", speed: "70 km/h", range: "450 km", protect: "Light", crew: "3" }],
      [/T-62|T-54|T-55|Type 59|Type 69|Type 62|Type 63|M41|Scorpion|Chonma|Type 62/i, "1st-gen tank (1950s–60s)", 0.45,
        { arm: "100–115 mm rifled/smoothbore gun, no modern sights", speed: "45–50 km/h", range: "400–500 km", protect: "Cast steel", crew: "4" }],
    ],
    afv: [
      [/Puma|CV90|Bradley|K21|ZBD-04|BMP-3|Namer|Boxer|Lynx|Borsuk|Freccia|VBCI|Warrior|Stryker|Patria|AMV|Rosomak|Ajax|Eitan|Dardo|Centauro|Type 16|ZBL-08|ZBD-05|AMPV|ACV|Kestrel|Clouded Leopard|CM-32|Griffon|Jaguar|Pandur|Piranha|Saad|VCTP|Guarani|Desert Warrior|BMD-4/i, "Modern IFV / wheeled combat vehicle", 1.4,
        { arm: "25–40 mm autocannon, ATGMs on most", speed: "70–100 km/h", range: "500–800 km", protect: "Add-on armour, mine protection", crew: "3 + 6–9 troops" }],
      [/MRAP|JLTV|Dingo|Tigr|Typhoon|Foxhound|Jackal|Bushmaster|Kirpi|Vuran|Cobra|light|Lince|Mengshi|Nimr|M-ATV|Hawkei|Casspir|Mamba|MaxxPro|Kozak|Arlan|Nomad|Sandcat|VBL|Wiesel|Serval|Cascavel|Light/i, "MRAP / light armoured vehicle", 0.5,
        { arm: "Machine gun or grenade launcher", speed: "100–110 km/h", range: "500–700 km", protect: "Blast-resistant hull", crew: "2 + 4–8" }],
      [/./, "Older APC / IFV", 0.8,
        { arm: "Machine guns or 30–73 mm gun", speed: "60–80 km/h", range: "500–600 km", protect: "Light steel / aluminium", crew: "2–3 + 7–10" }],
    ],
    arty: [
      [/HIMARS|M270|MARS|Chunmoo|Pinaka|PHL-16|PHL-03|Smerch|BM-30|Tornado|ASTROS|Homar|PULS|KN-25|Fajr|Thunderbolt|WS-22|LRU|Nora|Lynx/i, "Guided / long-range rocket artillery", 1.8,
        { arm: "Guided rockets and missiles (GMLRS, ATACMS-class)", speed: "85–100 km/h", range: "70–300 km reach", protect: "Armoured cab", crew: "3" }],
      [/PzH|K9|M109A7|Paladin|CAESAR|Archer|AS-90|Krab|PLZ-05|Type 19|Type 99|2S19|Msta-S|T-155|Dana|Bohdana|G6|Palmaria|ATAGS|Dhanush|PCL-181|AuF1|Vajra|Fırtına/i, "Modern 155/152 mm self-propelled gun", 1.3,
        { arm: "155/152 mm, 40–70 km with guided shells, burst fire", speed: "60–80 km/h", range: "300–600 km", protect: "Splinter armour", crew: "3–5" }],
      [/M777/i, "Light 155 mm towed howitzer", 1.0, { arm: "155 mm, Excalibur guided rounds to 40 km", speed: "Towed", range: "—", protect: "None", crew: "5–8" }],
      [/mortar/i, "Mortars", 0.35, { arm: "81–120 mm mortars", speed: "Towed / carried", range: "7–9 km reach", protect: "None", crew: "3–5" }],
      [/./, "Older towed or self-propelled artillery / rockets", 0.7,
        { arm: "105–152 mm guns or 122 mm Grad rockets, 15–30 km", speed: "Towed or 50–60 km/h", range: "—", protect: "None to light", crew: "5–8" }],
    ],
    fighters: [
      [/F-22|F-35|J-20|Su-57|J-35|Adir/i, "5th-gen stealth fighter", 2.2,
        { arm: "Internal AMRAAM/PL-15-class missiles, guided bombs", speed: "Mach 1.6–2.25", range: "1,100–1,800 km combat radius ~1,000", protect: "Stealth, sensor fusion", crew: "1" }],
      [/Rafale|Typhoon|Gripen E|F-39|F-15EX|F-15SA|F-15K|F-15I|Ra'am|Block 70|Block 60|F-16V|F-16E|Su-35|Su-30MKI|Su-30SM|J-16|J-10C|J-10CE|Super Hornet|F\/A-18E|F\/A-18F|F-2A|KF-21|Su-34|Sufa|F-15E|F-15C\/E/i, "4.5-gen multirole fighter", 1.5,
        { arm: "Long-range AAMs, precision strike, AESA radar", speed: "Mach 1.8–2.5", range: "Combat radius 800–1,300 km", protect: "EW suite", crew: "1–2" }],
      [/A-10|Su-25|attack|Pucará|Super Tucano|A-29|Yak-130|PC-7|T-6C|K-8/i, "Ground-attack / light combat aircraft", 0.8,
        { arm: "Cannon, rockets, guided bombs", speed: "500–1,000 km/h", range: "Combat radius 300–500 km", protect: "Armoured cockpit (A-10, Su-25)", crew: "1–2" }],
      [/F-4|F-5|MiG-21|MiG-23|Mirage III|Mirage 5|Mirage F1|J-7|F-7|Su-22|Jaguar|Kfir|A-4|AMX|MiG-15|MiG-17|MiG-19|J-5|J-6|Saeqeh|Kowsar|F-14|Su-24|Tornado|Alpha Jet|retir/i, "3rd-gen / legacy jet", 0.45,
        { arm: "Short-range missiles, unguided bombs", speed: "Mach 1.6–2.2", range: "Combat radius 400–700 km", protect: "Minimal", crew: "1–2" }],
      [/./, "4th-gen fighter", 1.0,
        { arm: "Medium-range AAMs, guided bombs", speed: "Mach 1.8–2.3", range: "Combat radius 550–900 km", protect: "EW pods", crew: "1–2" }],
    ],
    aircraft: [
      [/B-52|B-1B|B-2|Tu-95|Tu-160|Tu-22|H-6|bomber|Il-28|H-5/i, "Strategic / long-range bomber", 2.5,
        { arm: "Cruise missiles, 20–60 t of bombs", speed: "Mach 0.8–2", range: "10,000–14,000 km", protect: "Stealth (B-2) or stand-off", crew: "2–5" }],
      [/KC-|tanker|MRTT|E-3|E-7|E-2|A-50|KJ-|AEW|ISR|P-8|P-1|P-3|Erieye|E-767|E-737|Atlantique|Global Hawk|RC-135|E-99|Il-78|KC-390|Voyager|Gulfstream/i, "Tanker, AEW or maritime patrol", 1.6,
        { arm: "Radar, sensors, refuelling or anti-ship missiles", speed: "750–900 km/h", range: "7,000–12,000 km", protect: "Escorted", crew: "4–20" }],
      [/drone|Reaper|MQ-|Bayraktar|Wing Loong|Orion|Orlan|Akıncı|Anka|Shahed|Mohajer|Heron|Hermes|WZ-7|Protector|CH-4/i, "Armed or recon drone", 1.2,
        { arm: "Guided missiles, loitering munitions, sensors", speed: "200–450 km/h", range: "1,000–3,000 km, 24 h+ endurance", protect: "Expendable", crew: "Remote" }],
      [/trainer|Hawk|PC-21|M-346|T-38|T-6|L-39|K-8|KT-1|T-50|JL-|Yak-130|Kiran|Texan|Grob|Pampa|T-4|T-7|Alpha|Hürjet|PZL|Parastu|MFI|T-27|T-25|T-34|AT-5|Pilatus/i, "Trainer", 0.35,
        { arm: "Unarmed or light weapons", speed: "500–1,000 km/h", range: "1,500–2,500 km", protect: "None", crew: "2" }],
      [/./, "Transport aircraft", 1.0,
        { arm: "Cargo: 20–77 t or 90–100 paratroops", speed: "550–850 km/h", range: "4,000–9,000 km", protect: "Flares, defensive aids", crew: "3–5" }],
    ],
    helis: [
      [/AH-64E|Apache.*E|AH-64D\/E/i, "Attack helicopter (Apache Guardian)", 2.0,
        { arm: "Hellfire / JAGM missiles, 30 mm cannon, Longbow radar", speed: "290 km/h", range: "480 km", protect: "Armoured, IR suppression", crew: "2" }],
      [/AH-64|Apache|Ka-52|Mi-28|Z-10|Z-20|Tiger|T129|AH-1Z|LCH|Prachand|Mangusta|AW129|Attack/i, "Attack helicopter", 1.6,
        { arm: "Anti-tank missiles, rockets, cannon", speed: "270–310 km/h", range: "450–550 km", protect: "Armoured cockpit", crew: "2" }],
      [/Mi-24|Mi-35|AH-1|Cobra|500MD|MD-500/i, "Older attack helicopter / gunship", 1.1,
        { arm: "Rockets, ATGMs, gun", speed: "280–330 km/h", range: "450 km", protect: "Armoured", crew: "2–3" }],
      [/Chinook|CH-47|CH-53|Mi-26|Z-8|Z-18|Merlin|AW101|Yas'ur|H225|Caracal/i, "Heavy-lift helicopter", 1.0,
        { arm: "Lifts 10–20 t or 40–55 troops", speed: "260–310 km/h", range: "600–1,000 km", protect: "Defensive aids", crew: "3–5" }],
      [/Seahawk|MH-60R|SH-60|Ka-27|Ka-29|Wildcat|NH90|naval/i, "Naval / anti-submarine helicopter", 1.1,
        { arm: "Torpedoes, anti-ship missiles, dipping sonar", speed: "270 km/h", range: "800 km", protect: "—", crew: "3–4" }],
      [/UH-1|Huey|Mi-2|Cheetah|Chetak|Gazelle|AB-205|Bell 214|Other|Others/i, "Light / older utility helicopter", 0.4,
        { arm: "Door guns", speed: "200–250 km/h", range: "500 km", protect: "None", crew: "2" }],
      [/./, "Utility / transport helicopter", 0.7,
        { arm: "Door guns; 11–24 troops", speed: "250–295 km/h", range: "550–600 km", protect: "Partial", crew: "2–4" }],
    ],
    ships: [
      [/Arleigh|Ticonderoga|Type 055|Type 052D|Type 45|Kolkata|Visakhapatnam|Sejong|Maya|Atago|Kongo|Hobart|Horizon|Slava|Udaloy|Sovremenny|destroyer|Chungmugong|KDX|MEKO 360/i, "Destroyer / cruiser", 3.0,
        { arm: "90–128 VLS cells: SM-2/6 or HHQ-9, Tomahawk-class cruise missiles", speed: "30–32 knots", range: "8,000–11,000 km", protect: "Aegis-class air defence", crew: "250–350" }],
      [/FREMM|Type 054|Gorshkov|Grigorovich|Mogami|Type 23|Sachsen|Brandenburg|Baden|Anzac|Shivalik|Talwar|Istif|Barbaros|Gabya|frigate|Al Riyadh|Al Madinah|FDI|La Fayette|Pułaski|Tamandaré|Niterói|Osman|Bangabandhu|Kee Lung|Cheng Kung|Kang Ding|Daegu|Incheon|Tughril|Zulfiquar|Moudge|Jamaran|Najin|Reformador|SIGMA/i, "Frigate", 1.8,
        { arm: "Anti-ship and air-defence missiles, ASW helicopter", speed: "27–30 knots", range: "7,000–9,000 km", protect: "Point defence", crew: "120–200" }],
      [/Wasp|America|Type 075|Type 071|Mistral|Canberra|San Antonio|Osumi|Dokdo|Marado|Anadolu|assault|LHD|Amphibious|amphibious|Landing ships/i, "Amphibious assault / landing ship", 1.2,
        { arm: "Carries 600–1,800 marines, helicopters, landing craft", speed: "20–22 knots", range: "11,000 km", protect: "Self-defence missiles", crew: "400–1,200" }],
      [/corvette|Steregushchiy|Buyan|Karakurt|Type 056|Kamorta|Braunschweig|Sa'ar|Ada|Babur|MILGEM|Baynunah|Avante|Tuo Chiang|Gowind|Espora|Khareef|Littoral|Ślązak|Kazakhstan/i, "Corvette / littoral combat ship", 1.0,
        { arm: "Anti-ship missiles, 76 mm gun", speed: "25–40 knots", range: "4,000–6,000 km", protect: "Point defence", crew: "40–100" }],
      [/Support|auxiliary|Auxiliary|RFA|Other/i, "Support / auxiliary ship", 0.15,
        { arm: "Unarmed or light guns; fuel, stores, repair", speed: "18–20 knots", range: "10,000 km+", protect: "None", crew: "60–200" }],
      [/naval drone|Sea Baby|Magura/i, "Uncrewed surface drone", 0.4,
        { arm: "Explosive warhead, 300–800 kg", speed: "40–50 knots", range: "800–1,000 km", protect: "Small, hard to spot", crew: "Remote" }],
      [/./, "Patrol, missile boat or mine warfare", 0.3,
        { arm: "Guns, short-range missiles, mines / sweeps", speed: "25–45 knots", range: "1,500–4,000 km", protect: "None", crew: "10–50" }],
    ],
    subs: [
      [/Virginia|Seawolf|Astute|Suffren|Yasen/i, "Modern nuclear attack submarine (SSN)", 2.2,
        { arm: "Heavyweight torpedoes, cruise missiles (VLS)", speed: "25–35 knots submerged", range: "Unlimited (nuclear)", protect: "Very quiet", crew: "60–135" }],
      [/Ohio|Borei|Vanguard|Triomphant|Type 094|Delta|Arihant|SSBN/i, "Ballistic-missile submarine (counted without its nuclear missiles)", 1.4,
        { arm: "Torpedoes (strategic missiles counted separately as nukes)", speed: "20–25 knots submerged", range: "Unlimited (nuclear)", protect: "Quiet", crew: "110–155" }],
      [/Los Angeles|Akula|Oscar|Trafalgar|Rubis|Type 093|SSN|SSGN/i, "Nuclear attack / cruise-missile submarine", 1.6,
        { arm: "Torpedoes, Tomahawk/Kalibr/P-700-class missiles", speed: "30–33 knots submerged", range: "Unlimited (nuclear)", protect: "Quiet", crew: "100–130" }],
      [/212|214|Soryu|Taigei|KSS-III|Dosan|Type 039A|039B|Yuan|Scorpène|Kalvari|Riachuelo|Collins|Dolphin|Gotland|Lada|Improved Kilo|Hai Kun|Ula|Hangor|Todaro|Reis/i, "Modern diesel-electric / AIP submarine", 1.0,
        { arm: "Torpedoes, anti-ship missiles", speed: "20 knots submerged", range: "10,000–12,000 km; weeks submerged with AIP", protect: "Very quiet on batteries/AIP", crew: "30–50" }],
      [/./, "Older diesel-electric or coastal submarine", 0.5,
        { arm: "Torpedoes, mines", speed: "15–17 knots submerged", range: "6,000–10,000 km", protect: "Noisier", crew: "20–55" }],
    ],
    carriers: [
      [/Ford/i, "Supercarrier (Gerald R. Ford class)", 1.25, { arm: "75+ aircraft, EMALS catapults", speed: "30+ knots", range: "Unlimited (nuclear)", protect: "Escort group, ESSM/RAM", crew: "4,500 with air wing" }],
      [/Nimitz/i, "Supercarrier (Nimitz class)", 1.15, { arm: "60–70 aircraft, steam catapults", speed: "30+ knots", range: "Unlimited (nuclear)", protect: "Escort group", crew: "5,000–6,000 with air wing" }],
      [/Fujian/i, "Catapult carrier (Fujian)", 0.8, { arm: "~50 aircraft, EM catapults", speed: "30 knots", range: "Conventional", protect: "Escort group", crew: "~2,500" }],
      [/Queen Elizabeth|Charles de Gaulle/i, "Fleet carrier", 0.65, { arm: "24–40 aircraft (F-35B / Rafale M)", speed: "25–27 knots", range: "18,000 km / nuclear (CdG)", protect: "Escort group", crew: "1,600–2,000" }],
      [/Kuznetsov/i, "Ski-jump carrier (in refit, out of action)", 0.1, { arm: "Su-33/MiG-29K when operational", speed: "29 knots", range: "15,000 km", protect: "Own missiles", crew: "~2,000" }],
      [/Shandong|Liaoning|Vikrant|Vikramaditya/i, "Ski-jump carrier", 0.45, { arm: "24–40 aircraft (J-15 / MiG-29K)", speed: "28–30 knots", range: "15,000 km", protect: "Escort group", crew: "1,600–2,000" }],
      [/./, "Light carrier / helicopter carrier", 0.25, { arm: "Helicopters, F-35B or drones", speed: "20–28 knots", range: "10,000 km+", protect: "Self-defence", crew: "500–1,000" }],
    ],
  };
  const cache = {};
  // Family and specs for one model of one category.
  window.modelSpec = (key, name) => {
    const ck = key + "|" + name;
    if (cache[ck]) return cache[ck];
    const row = (F[key] || []).find(r => r[0].test(name)) || [null, "Standard", 1, {}];
    return (cache[ck] = { name, family: row[1], mult: row[2], specs: row[3] });
  };
  // Average combat value of a category: from given model counts, or the country's fleet mix.
  const avgCache = {};
  window.modelMult = (c, key, models) => {
    if (key === "troops") return 1;
    if (!models) {
      const ck = c.iso3 + "|" + key;
      if (ck in avgCache) return avgCache[ck];
      const list = (c.equipment && c.equipment[key]) || [];
      const tot = list.reduce((a, m) => a + m[1], 0);
      return (avgCache[ck] = tot ? list.reduce((a, m) => a + m[1] * window.modelSpec(key, m[0]).mult, 0) / tot : 1);
    }
    let n = 0, s = 0;
    for (const m in models) { n += models[m]; s += models[m] * window.modelSpec(key, m).mult; }
    return n ? s / n : window.modelMult(c, key);
  };
  // Quality of one kind of unit for a country: troops by the country's technology generation,
  // equipment by its actual models; both scaled by readiness (maintenance, spares, training).
  window.unitQuality = (c, key, models) =>
    (key === "troops" ? 0.35 + 0.13 * c.tech.gen : 0.8 * window.modelMult(c, key, models)) * (0.4 + 0.6 * c.tech.ready);
})();
