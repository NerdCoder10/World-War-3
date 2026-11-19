// Paramilitary forces: armed forces outside the regular military: gendarmeries, national guards,
// border and internal-security troops, coast guards, militias. Counted separately from the country's
// military (they are not in its active strength), but they fight for it when it is invaded, as far
// as they are loyal. Like regular troops they are counted by real training and kit, the share present
// for duty, wear in a long war and the country's ability to pay.
// [name, personnel (thousands, really fielded rather than claimed), training 0–10, kit 0–10,
//  loyalty 0–1 (the share that would fight for the state if called upon), record]
window.PARAMILITARY = {
  CHN: [["People's Armed Police", 500, 6, 6, 0.95, "Internal security and the PLA's reserve in war; it commands the coast guard"], ["China Coast Guard", 16, 6, 7, 0.95, "The world's largest coast guard, the spearhead of pressure on Taiwan and the Philippines"]],
  RUS: [["Rosgvardia (National Guard)", 340, 5, 5, 0.9, "Built to crush unrest; sent into Ukraine in 2022 with heavy losses; absorbed Wagner volunteers"], ["Africa Corps (ex-Wagner)", 5, 7, 6, 0.85, "Wagner's African units, under the Defence Ministry since the 2023 mutiny"]],
  IRN: [["Basij", 90, 3, 2, 0.9, "Claims millions of members; about 90,000 are active, used against protesters"]],
  IND: [["Central Armed Police Forces (BSF, CRPF, ITBP, SSB, CISF, Assam Rifles)", 1000, 5, 4, 0.95, "About a million; the BSF and ITBP guard the borders and would fight beside the army"]],
  PAK: [["Rangers and Frontier Corps", 180, 5, 4, 0.95, "Border and counter-insurgency forces led by army officers"]],
  USA: [["Coast Guard", 42, 8, 7, 1, "A military service under Homeland Security in peace and the Navy in war"]],
  TUR: [["Gendarmerie (Jandarma)", 180, 6, 5, 0.95, "Hardened by decades against the PKK"]], FRA: [["Gendarmerie nationale", 100, 7, 6, 1, "A military police force, home of the GIGN"]],
  ITA: [["Carabinieri", 110, 7, 6, 1, "A military police force; served in Iraq (Nasiriyah)"]], ESP: [["Guardia Civil", 80, 7, 5, 1, "A military police force"]],
  EGY: [["Central Security Forces", 325, 3, 3, 0.9, "Conscript riot and internal-security troops"]], SAU: [["Saudi Arabian National Guard", 130, 6, 6, 0.95, "The royal family's own army, as big as the regular army"]],
  IRQ: [["Popular Mobilization Forces", 238, 5, 4, 0.6, "Mostly Iran-aligned militias, formally under the prime minister but loyal first to their own leaders"]],
  UKR: [["National Guard", 90, 6, 6, 1, "Fought at Mariupol (Azov) and across the front"]],
  VEN: [["Bolivarian Militia", 200, 2, 2, 0.6, "Claims 4.5 million members; analysts count far fewer, poorly armed"], ["National Guard (GNB)", 30, 4, 4, 0.8, "Crushed the 2014 and 2017 protests"]],
  PRK: [["Worker-Peasant Red Guard", 1000, 2, 1, 0.95, "Claims 5.7 million; old rifles and guns, about a million could really be fielded"]],
  VNM: [["Militia and Self-Defence Force", 1000, 3, 2, 0.95, "Millions on paper"]], CUB: [["Territorial Troops Militia", 500, 3, 2, 0.9, "A mass militia"]],
  ISR: [["Border Police (Magav)", 8, 8, 7, 1, "Fights alongside the army in the West Bank"]], COL: [["National Police", 180, 6, 5, 1, "Under the defence ministry; fought the FARC"]],
  MEX: [["National Guard", 130, 4, 4, 0.9, "Created in 2019 and moved under the army in 2024"]], BRA: [["State Military Police", 400, 4, 4, 0.9, "The army's reserve by law"]],
  IDN: [["Mobile Brigade (Brimob)", 40, 5, 5, 1, "Police combat units"]], KOR: [["Coast Guard", 13, 7, 7, 1, "Watches for Northern infiltrators"]], JPN: [["Japan Coast Guard", 14, 7, 7, 1, "Faces China around the Senkakus"]],
  TWN: [["Coast Guard Administration", 13, 6, 6, 1, "Would join the navy in war"]], LBN: [["Hezbollah", 40, 7, 6, 0.6, "A non-state army badly weakened by Israel in 2024; would fight an invader of Lebanon on its own terms"]],
  PSE: [["Hamas and other factions", 15, 6, 3, 0.9, "Badly degraded since 2023"]], SDN: [["Rapid Support Forces", 100, 5, 4, 0, "At war with the army since 2023: would not fight for the state"]],
  NGA: [["Civilian Joint Task Force", 25, 2, 1, 0.8, "Vigilantes against Boko Haram"]], BLR: [["Internal Troops", 11, 5, 5, 0.95, "Crushed the 2020 protests"]],
  KAZ: [["National Guard", 35, 5, 5, 0.95, "Internal security"]], UZB: [["National Guard", 20, 5, 5, 0.95, "Internal security"]], GEO: [["Border Police", 6, 5, 5, 1, ""]],
};
window.paramilitaries = c => window.PARAMILITARY[c.iso3] || [];
// Combat value of a thousand paramilitaries (×10 like regular troops): 0.1 + 0.035 × training + 0.02 × kit,
// so police-style forces (4/4) count ~0.32 and well-trained gendarmeries (7/6) ~0.47.
window.paraQuality = p => 0.1 + 0.035 * p[2] + 0.02 * p[3];
