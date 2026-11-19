// Spy networks. Every country's services run networks inside other countries: human agents and
// moles (HUMINT), intercept stations and cable taps (SIGINT) and cyber implants. A network's
// strength (0–100) grows with the spymaster's skill and effort and is worn down every day by the
// target's counter-intelligence. Networks are what make intelligence precise: they sharpen your
// estimates of a country's forces, warn you of attacks before they launch, add targeting to your
// battles, and let you run operations (sabotage, technology theft, influence, inciting unrest).
// Foreign networks inside your empire do the same to you until your counter-intelligence rolls
// them up. Starting networks follow each service's real priorities and known penetrations.

// [target, priority 0–1, what is known, extra depth from known penetrations (optional)]
window.SPY_TARGETS = {
  USA: [["CHN", 1, "The CIA's top priority; it rebuilt its China network after losing ~20 sources in 2010–12"], ["RUS", 0.95, "Warned the world of Russia's 2022 invasion weeks ahead", 5],
    ["IRN", 0.85, "Deep SIGINT coverage and the Stuxnet legacy"], ["PRK", 0.7, "Satellite and SIGINT coverage; few human sources"], ["VEN", 0.5, ""], ["CUB", 0.5, ""], ["SYR", 0.5, ""], ["PAK", 0.6, ""],
    ["UKR", 0.6, "Close intelligence partner"], ["ISR", 0.4, ""], ["TUR", 0.4, ""], ["SAU", 0.4, ""], ["IND", 0.4, ""], ["MEX", 0.5, "Cartel networks"], ["AFG", 0.5, ""]],
  GBR: [["RUS", 0.95, "MI6 and GCHQ; exposed the Skripal poisoners"], ["CHN", 0.8, ""], ["IRN", 0.7, ""], ["UKR", 0.5, "Close intelligence partner"], ["ARG", 0.3, ""], ["SYR", 0.4, ""], ["IRQ", 0.4, ""]],
  FRA: [["RUS", 0.7, ""], ["MLI", 0.6, "Long Sahel presence"], ["BFA", 0.5, ""], ["NER", 0.5, ""], ["DZA", 0.6, ""], ["IRN", 0.5, ""], ["CHN", 0.5, ""], ["LBY", 0.5, ""]],
  DEU: [["RUS", 0.7, "BND; its signals intercepts are a NATO mainstay"], ["CHN", 0.5, ""], ["TUR", 0.4, ""], ["IRN", 0.4, ""]],
  ISR: [["IRN", 1, "Mossad has penetrated Iran deeply: it stole the nuclear archive (2018), killed its top nuclear scientist (2020) and struck from inside Iran in 2024–25", 25],
    ["LBN", 0.95, "Rigged Hezbollah's pagers and radios (2024) and tracked its leadership", 20], ["SYR", 0.85, "", 10], ["PSE", 0.9, "Shin Bet networks across the territories, though Hamas surprised it on 7 October 2023"],
    ["IRQ", 0.6, ""], ["YEM", 0.5, ""], ["EGY", 0.5, ""], ["JOR", 0.5, ""], ["TUR", 0.4, ""], ["SAU", 0.4, ""]],
  RUS: [["UKR", 1, "Penetrated Ukraine's SBU before 2022; still runs saboteurs and informants", 10], ["USA", 0.9, "SVR illegals and GRU hackers (2016 election, SolarWinds)"], ["GBR", 0.8, "GRU's Skripal operation"],
    ["DEU", 0.8, "Sabotage plots and spies in the Bundeswehr and BND"], ["POL", 0.7, "Sabotage and arson networks"], ["EST", 0.7, ""], ["LVA", 0.7, ""], ["LTU", 0.7, ""], ["FIN", 0.6, ""], ["GEO", 0.7, ""],
    ["MDA", 0.7, ""], ["BLR", 0.8, "The KGB of Belarus works hand in glove with Moscow", 15], ["KAZ", 0.6, ""], ["ARM", 0.6, ""], ["FRA", 0.6, ""], ["CZE", 0.6, "GRU blew up the Vrbětice arms depots (2014)"],
    ["BGR", 0.6, ""], ["HUN", 0.5, ""], ["SRB", 0.5, ""], ["TUR", 0.5, ""], ["NOR", 0.5, ""], ["SWE", 0.5, ""], ["JPN", 0.4, ""], ["CHN", 0.4, ""]],
  CHN: [["USA", 1, "The largest espionage effort against the US: OPM hack, Volt and Salt Typhoon in US networks, balloons, thousands of cases", 5], ["TWN", 1, "Dozens of Taiwanese officers convicted of spying for Beijing", 10],
    ["JPN", 0.8, ""], ["IND", 0.8, ""], ["KOR", 0.7, ""], ["AUS", 0.7, ""], ["PHL", 0.7, ""], ["VNM", 0.7, ""], ["GBR", 0.6, ""], ["DEU", 0.6, ""], ["CAN", 0.6, "Covert 'police stations' and interference"],
    ["RUS", 0.5, ""], ["SGP", 0.5, ""], ["MYS", 0.5, ""], ["IDN", 0.5, ""], ["FRA", 0.5, ""], ["NLD", 0.5, ""], ["PRK", 0.5, ""], ["PAK", 0.4, ""], ["MNG", 0.5, ""], ["KAZ", 0.5, ""]],
  IRN: [["ISR", 0.9, "Recruits Israelis online for sabotage and surveillance"], ["SAU", 0.8, ""], ["IRQ", 0.9, "Quds Force runs militias and politicians", 20], ["LBN", 0.9, "Through Hezbollah", 20], ["SYR", 0.6, ""],
    ["YEM", 0.8, "Through the Houthis", 15], ["BHR", 0.7, ""], ["ARE", 0.6, ""], ["USA", 0.5, "Murder-for-hire plots on US soil"], ["AZE", 0.6, ""], ["AFG", 0.6, ""], ["GBR", 0.4, ""], ["KWT", 0.5, ""]],
  PRK: [["KOR", 1, "Spies and the Lazarus Group's hackers"], ["JPN", 0.6, "Abducted Japanese citizens in the 1970s–80s"], ["USA", 0.5, "IT workers placed under false names in US firms"], ["CHN", 0.4, ""]],
  TUR: [["SYR", 0.8, "MIT runs the Syrian National Army", 10], ["IRQ", 0.6, ""], ["GRC", 0.6, ""], ["CYP", 0.6, ""], ["LBY", 0.6, ""], ["DEU", 0.5, "Watches the diaspora and Gülenists"], ["ARM", 0.5, ""], ["IRN", 0.5, ""], ["AZE", 0.5, ""]],
  IND: [["PAK", 1, "R&AW"], ["CHN", 0.8, ""], ["BGD", 0.6, ""], ["NPL", 0.6, ""], ["LKA", 0.5, ""], ["AFG", 0.5, ""], ["MMR", 0.4, ""], ["CAN", 0.4, "Accused over the 2023 killing of a Sikh activist"]],
  PAK: [["IND", 1, "ISI"], ["AFG", 0.9, "Long ties to the Taliban", 15], ["IRN", 0.5, ""], ["BGD", 0.4, ""]],
  SAU: [["IRN", 0.8, ""], ["YEM", 0.8, ""], ["QAT", 0.6, ""], ["TUR", 0.5, ""], ["LBN", 0.5, ""], ["IRQ", 0.5, ""]],
  ARE: [["QAT", 0.7, "Advanced spyware and hacking units"], ["IRN", 0.6, ""], ["YEM", 0.7, ""], ["SDN", 0.7, ""], ["LBY", 0.7, ""], ["SOM", 0.6, ""], ["TUR", 0.5, ""]],
  UKR: [["RUS", 1, "HUR and SBU strike deep inside Russia; Operation Spiderweb destroyed Russian bombers with smuggled drones (2025)", 10], ["BLR", 0.7, ""], ["MDA", 0.4, ""]],
  KOR: [["PRK", 1, "NIS"], ["CHN", 0.6, ""], ["JPN", 0.4, ""], ["RUS", 0.4, ""]], JPN: [["CHN", 0.7, ""], ["PRK", 0.8, ""], ["RUS", 0.5, ""]],
  TWN: [["CHN", 1, "Long-standing human networks across the strait"]], EGY: [["LBY", 0.6, ""], ["SDN", 0.6, ""], ["ETH", 0.6, ""], ["PSE", 0.6, ""], ["ISR", 0.4, ""]],
  AUS: [["CHN", 0.7, ""], ["IDN", 0.5, ""], ["PNG", 0.5, ""]], CAN: [["RUS", 0.4, ""], ["CHN", 0.5, ""]], POL: [["RUS", 0.8, ""], ["BLR", 0.9, ""]],
  QAT: [["ARE", 0.5, ""], ["SAU", 0.5, ""]], AZE: [["ARM", 0.9, ""], ["IRN", 0.6, ""]], ARM: [["AZE", 0.7, ""]], GRC: [["TUR", 0.8, ""]], CUB: [["USA", 0.7, "Cuba's DI ran Ana Montes, the US's top Cuba analyst, for 17 years"], ["VEN", 0.9, "Cuban officers inside Venezuela's army and services", 25]],
  VEN: [["COL", 0.6, ""], ["GUY", 0.5, ""]], MAR: [["DZA", 0.8, ""]], DZA: [["MAR", 0.8, ""]], ETH: [["ERI", 0.7, ""], ["SOM", 0.6, ""]], RWA: [["COD", 0.8, ""]], SRB: [["HRV", 0.5, ""], ["BIH", 0.6, ""]],
};
// Intelligence alliances share networks: a member gets part of its partners' strength in a target.
window.SPY_SHARING = { "Five Eyes": ["USA", "GBR", "CAN", "AUS", "NZL"] };

// Tradecraft: how well a country's services have stayed hidden through their history (0–10).
// It sets how fast their spy networks and special-forces teams are found: a 9 is found ~30 times
// more slowly than a 3. Earned from the record: decades-long moles and operations never traced
// count for it; networks rolled up, agents caught on camera and plots foiled count against it.
window.TRADECRAFT = {
  CUB: [9.5, "Ran Ana Montes inside the US Defense Intelligence Agency for 17 years and Ambassador Manuel Rocha for 40; rolled up the CIA's Cuban networks in the 1980s"],
  GBR: [8.5, "The Double Cross system ran every German spy in Britain; Oleg Gordievsky inside the KGB for 11 years; few modern exposures"],
  ISR: [8.5, "Eli Cohen in Damascus, Iran's nuclear archive stolen in 2018, the 2024 pager operation built for years undetected; but the 2010 Dubai hit squad was filmed and the 1954 Lavon affair and 1973 Lillehammer blunder exposed"],
  RUS: [7, "The KGB's Cambridge Five, Aldrich Ames (9 years) and Robert Hanssen (22 years); but the 2010 illegals roll-up, and the GRU's Skripal poisoners and Unit 29155 exposed by open sources"],
  CHN: [7.5, "Penetrated the CIA's China network in 2010–12 and US networks (Volt and Salt Typhoon) for years; but its sheer volume means dozens of cases are caught every year"],
  UKR: [7.5, "Operation Spiderweb was prepared inside Russia for 18 months undetected; drone and sabotage cells deep in Russia"],
  USA: [7, "Long-running penetrations of the KGB and GRU (Tolkachev, Polyakov); but lost its China network in 2010–12 and Iranian sources through a flawed covert-communication system"],
  FRA: [6, "The DGSE was caught sinking the Rainbow Warrior in 1985; solid since"], DEU: [5.5, "The BND was itself penetrated by the Stasi and Russia (the 2022 Linke case)"],
  PAK: [7, "The ISI ran the Afghan mujahideen and the Taliban network for decades with deniability"], IND: [5.5, "RAW's plots against Sikh separatists in Canada and the US were exposed in 2023"],
  TUR: [6, "MIT renditions abroad, some exposed"], SAU: [3, "The Khashoggi murder team was filmed and identified within days"], ARE: [6, "Discreet; some hacking exposed"],
  IRN: [3.5, "Its plots abroad are foiled again and again (Washington 2011, Paris 2018, Europe and the US since), and its own officials keep being recruited by Israel"],
  PRK: [5, "The Lazarus Group's hacks are attributed quickly, but agents still infiltrate the South"], KOR: [5, "Agents regularly caught by the North"],
  JPN: [4, "Little foreign espionage capability"], TWN: [4, "Riddled with Chinese penetration"], EGY: [4.5, "Heavy-handed, often exposed"],
  SYR: [3, "Collapsed with the regime in 2024"], VEN: [5, "Relies on Cuban advisers"], BLR: [5, "Works with Russia's services"],
  AUS: [7.5, "Five Eyes partner; rarely exposed"], CAN: [7, "Five Eyes partner"], NZL: [7, "Five Eyes partner"], NLD: [7, "The AIVD penetrated Russia's Cozy Bear hackers' own cameras"],
  POL: [6.5, "Effective counter-intelligence against Russia"], CZE: [6, "Exposed Russia's Vrbětice depot bombing"], SWE: [6, "Discreet"], FIN: [6.5, "Discreet"],
  NOR: [6, "Discreet"], ITA: [5.5, "Mixed record"], ESP: [5.5, "Mixed record"], JOR: [6.5, "The GID is a strong regional service"], QAT: [6, "Discreet"],
};
window.tradecraft = c => (window.TRADECRAFT[c.iso3] || [Math.max(2, Math.min(6, 2 + 0.45 * ((c.intelProfile && c.intelProfile.score) || 4)))])[0];

// Homeland security: [alert 0–10, domestic stability 0–10, why]. Alert is how closely the state
// watches its own territory: domestic security services, police reach, surveillance cameras,
// border and financial monitoring, and a public primed to report suspicious activity. Stability is
// whether the state holds together: a stable country notices strangers; one torn by war, coups,
// mass protest or collapse loses track of who is moving through it. Both multiply how fast foreign
// spies and special-forces teams are found. Countries not listed: estimated from wealth,
// counter-intelligence, corruption and war.
window.HOMELAND = {
  USA: [9.5, 7, "The FBI's 56 field offices and Joint Terrorism Task Forces, DHS, 18,000 police agencies, FISA surveillance and suspicious-activity reporting since 9/11; stable institutions despite deep polarisation"],
  CHN: [10, 8, "The world's densest surveillance state: 600+ million cameras, facial recognition, the Ministry of State Security, mandatory reporting and grid-management wardens"],
  PRK: [10, 6, "A totalitarian police state where every citizen watches every other; a brittle, isolated regime"],
  RUS: [8, 6, "The FSB and pervasive surveillance, but the 2023 Wagner mutiny and the 2024 Crocus City Hall attack (despite a US warning) showed gaps"],
  GBR: [8.5, 8, "MI5, counter-terror policing and one of the world's densest CCTV networks"],
  ISR: [8.5, 6, "Shin Bet and a vigilant public, though the 7 October 2023 failure and deep political rifts showed limits"],
  FRA: [8, 7, "DGSI and long counter-terror experience; recurrent unrest"], DEU: [7, 8, "BfV, strong policing, privacy limits on surveillance"],
  JPN: [7, 9, "Orderly society with low crime, but weak counter-espionage laws"], KOR: [8, 7, "NIS and police watching for Northern agents; political crises (the 2024 martial-law episode)"],
  TWN: [5.5, 7, "Open society heavily penetrated by China"], SGP: [9.5, 9, "Tight policing, cameras everywhere, strong internal security act"],
  ARE: [9, 8, "Pervasive surveillance (it filmed the 2010 Mossad team in Dubai)"], SAU: [8.5, 7, "State security presidency and pervasive monitoring"],
  QAT: [8, 8, "Small, closely watched"], TUR: [8, 6, "MIT and a vast police apparatus since 2016; political tension"],
  IRN: [7, 4, "Pervasive monitoring, yet riddled with Israeli agents; the regime is shaken by protests and the 2025 war"],
  EGY: [8, 6, "A police state watching its own people"], IND: [6, 7, "Vast and stretched: large, porous borders and cities"],
  PAK: [6.5, 5, "ISI's internal reach, but insurgencies and political turmoil"], CAN: [7, 8, "CSIS and RCMP, a long open border"],
  AUS: [7.5, 9, "ASIO and strong policing"], NZL: [6, 9, "Small, stable, lightly watched"], ITA: [7, 7, "Experienced police and anti-Mafia services"],
  ESP: [7, 7, "Counter-terror experience"], NLD: [7.5, 8, "AIVD, dense digital monitoring"], POL: [7, 8, "ABW counter-espionage, on alert against Russian sabotage"],
  UKR: [6.5, 5, "SBU hunts saboteurs, but war and displacement make tracking people hard"], BLR: [8.5, 6, "KGB police state, shaken by the 2020 protests"],
  CUB: [9, 6, "Neighbourhood watch committees and the DI"], VEN: [6, 3, "Cuban-advised repression amid collapse"], SYR: [3, 3, "Rebuilding after the regime's fall"],
  IRQ: [4.5, 4, "Militias and fractured security"], AFG: [5, 4, "Taliban checkpoints, little else"], YEM: [3, 2, "Divided by war"], LBY: [2, 2, "Rival governments and militias"],
  SDN: [2, 1, "Collapsed into civil war"], SOM: [2, 2, "Weak state"], MMR: [4, 2, "Civil war"], HTI: [1, 1, "Gangs rule the capital"],
  MEX: [5, 5, "Cartel violence stretches the state"], BRA: [5.5, 6, "Large and unequal"], COL: [6, 6, "Experienced against insurgents"], NGA: [4, 4, "Insurgencies and banditry"],
  ZAF: [4.5, 5, "High crime, stretched police"], ETH: [5, 4, "Ethnic conflict"], KAZ: [7, 7, "Watchful post-Soviet state"], AZE: [8, 7, "Tight state security"],
  ARM: [6, 6, "Political turbulence after 2020"], GEO: [6, 6, "Polarised"], FIN: [7, 9, "Supo and a cohesive society"], SWE: [7, 8, "Säpo, gang violence rising"],
  NOR: [7, 9, "PST, stable"], DNK: [7, 9, "PET, stable"], CHE: [7.5, 10, "Orderly, watchful"], EST: [7.5, 8, "KAPO catches Russian agents regularly"],
  LTU: [7.5, 8, "On alert against Russia"], LVA: [7, 7, "On alert against Russia"], HUN: [7, 7, "Watchful"], CZE: [7, 8, "BIS exposed Russian sabotage"],
  ROU: [6.5, 7, "SRI"], GRC: [6, 7, "Stretched by migration"], PHL: [5, 6, "Insurgencies"], IDN: [6, 7, "Densus 88 counter-terror"], THA: [6, 6, "Coups and protests"],
  VNM: [8.5, 8, "One-party surveillance state"], MYS: [6.5, 7, "Special Branch"], JOR: [8, 7, "GID watches closely"], MAR: [7.5, 7, "DGST, effective against jihadists"], DZA: [7.5, 6, "Security state"],
};
window.homeland = c => {
  const h = window.HOMELAND[c.iso3];
  if (h) return { alert: h[0], stab: h[1], note: h[2], est: false };
  const lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001)), m = c.milStats || {}, counter = (c.intelProfile && c.intelProfile.counter) || 3;
  const war = (m.experience || 0) >= 7;
  return { alert: Math.round(Math.max(1, Math.min(9, 1 + 0.45 * counter + 1.2 * lg - 0.15 * (m.corruption || 5))) * 10) / 10,
    stab: Math.round(Math.max(1, Math.min(9, 4 + 1.8 * lg - 0.25 * (m.corruption || 5) - (war ? 2.5 : 0))) * 10) / 10, note: "", est: true };
};
// How fast foreign spies and teams are found here, relative to an ordinary state: ×1.03 in the US,
// ×1.15 in China, ×0.65 in Iran, ×0.3 in a collapsed state.
window.homelandFactor = c => { const h = window.homeland(c); return (0.4 + 0.08 * h.alert) * (0.4 + 0.07 * h.stab); };

// Border security: [land frontier, coasts, points of entry (airports, ports, visas, biometrics), why],
// each 0–10. Spies mostly arrive through points of entry; special-forces teams slip in by the
// weakest route, land or sea; invading armies are spotted by frontier guards and coastal watch.
// Landlocked countries' coast rating is their land rating. Not listed: estimated from wealth,
// counter-intelligence and corruption.
window.BORDERS = {
  USA: [7, 8, 9.5, "Customs and Border Protection's 60,000 officers, with sensors, towers and drones on the Mexican border, yet ~2 million crossings a year at the 2022–23 peak; the long Canadian border is lightly watched; biometric entry and visa vetting at airports; the Coast Guard watches the coasts"],
  CAN: [5, 6, 8.5, "The world's longest undefended border with the US; good airport screening"], MEX: [3, 4, 5, "Cartel-run smuggling routes in the north, a porous Guatemalan border in the south"],
  CHN: [8.5, 8, 9.5, "Fenced, camera-lined frontiers in Xinjiang and Tibet; strict entry screening and exit controls"],
  RUS: [6, 5, 7, "A 20,000 km frontier too long to watch fully; the FSB Border Service"], PRK: [10, 8, 10, "The most sealed border on earth: minefields, the DMZ, shoot-to-kill orders"],
  KOR: [9.5, 8, 9, "The DMZ and constant coastal watch for Northern infiltrators"], JPN: [9, 9, 9, "An island nation with tight immigration"], TWN: [9, 7, 8, "An island, but its coast guard is stretched by Chinese grey-zone pressure"],
  ISR: [8, 9, 9.5, "Fences and sensors on every front and the world's strictest airport screening, though Hamas breached the Gaza fence on 7 October 2023"],
  GBR: [4, 7, 9, "An island with Border Force and eGates, but an open land border with Ireland and ~30,000 small-boat crossings a year"],
  IRL: [4, 6, 7, "Open border with Northern Ireland"], FRA: [5, 6, 8, "Schengen: open land borders, checks only at airports"], DEU: [4, 6, 8, "Schengen: open land borders"],
  ITA: [4, 4, 7, "Mediterranean arrivals overwhelm coastal control"], ESP: [6, 5, 7.5, "Fenced Ceuta and Melilla, Atlantic arrivals in the Canaries"], GRC: [6, 4, 7, "The Evros fence, but thousands of islands"],
  NLD: [4, 6, 8.5, "Schengen"], BEL: [4, 6, 8, "Schengen"], CHE: [5, 5, 8.5, "Schengen, landlocked"], AUT: [5, 5, 8, "Schengen, landlocked"], SWE: [4, 6, 8, "Schengen"], NOR: [6, 7, 8, "Arctic border with Russia watched closely"],
  FIN: [8, 7, 8, "Closed its 1,340 km Russian border in 2023 and is fencing it"], POL: [8, 6, 8, "A steel fence and sensors on the Belarus border against engineered migrant crossings"],
  EST: [7, 6, 8, "Watched Russian border"], LVA: [7, 6, 8, "Fencing its Russian and Belarusian borders"], LTU: [7, 6, 8, "Fenced Belarus border"], UKR: [7, 5, 6, "A mined, fortified front with Russia"],
  BLR: [7, 7, 7, "KGB-run border guard, landlocked"], TUR: [7, 6, 7.5, "A 900 km wall on the Syrian border; long coasts"], IRN: [5, 5, 6, "Porous Afghan and Iraqi borders; smuggling across the Gulf"],
  IRQ: [3, 3, 4, "Porous, militia-controlled crossings"], SYR: [2, 2, 2, "Borders barely controlled"], AFG: [2, 2, 3, "Porous"], PAK: [4, 4, 5, "Fencing the Afghan border, porous in practice"],
  IND: [6, 5, 7, "Fenced Line of Control and Pakistani border; porous Bangladeshi and open Nepalese borders"], BGD: [3, 3, 4, "Porous"], MMR: [1, 2, 3, "Borders held by rebels"],
  THA: [4, 4, 6, "Porous Myanmar border"], VNM: [6, 5, 7, "Watched Chinese border"], PHL: [3, 3, 6, "7,600 islands"], IDN: [3, 3, 6, "17,000 islands"], MYS: [4, 4, 7, "Porous Sabah coast"], SGP: [9.5, 9, 9.5, "A city-state with tight checkpoints"],
  AUS: [9, 8, 9, "An island continent; Operation Sovereign Borders turns back boats"], NZL: [9, 8, 9, "Remote islands, strict biosecurity and entry"],
  CUB: [9, 7, 8, "An island police state"], BRA: [3, 4, 6, "Vast Amazon frontiers"], COL: [3, 4, 6, "Porous Venezuelan border"], VEN: [2, 3, 4, "Smuggling and armed groups"], ARG: [4, 4, 6, "Porous northern border"],
  CHL: [5, 5, 7, "Desert frontier"], PER: [4, 4, 6, "Porous"], SAU: [8, 7, 8, "A fenced Yemeni frontier and Iraqi border wall"], ARE: [8, 8, 9.5, "Biometric entry, closely watched coasts"], QAT: [8, 8, 9, "Small, closely watched"],
  KWT: [8, 7, 8, "Iraq border barrier"], OMN: [6, 6, 8, "Mountainous Yemeni border"], JOR: [7, 5, 8, "Watched Syrian border against smugglers"], EGY: [6, 5, 7, "Sealed Gaza border, porous Libyan and Sudanese desert"],
  LBY: [1, 1, 2, "No real control"], DZA: [6, 5, 7, "Desert patrols"], MAR: [7, 6, 7, "The Western Sahara berm"], TUN: [5, 5, 7, "Libyan border barrier"], NGA: [2, 3, 4, "Porous"], ETH: [3, 3, 5, "Porous, landlocked"],
  KEN: [3, 4, 5, "Porous Somali border"], SOM: [1, 1, 1, "No control"], SDN: [1, 1, 2, "Civil war"], ZAF: [3, 5, 6, "Porous Zimbabwean border"], GEO: [5, 5, 7, "Russian-occupied enclaves"], ARM: [6, 6, 7, "Russian border guards on some frontiers"],
  AZE: [7, 6, 7, "Watched"], KAZ: [5, 5, 7, "Long steppe frontiers"], MNG: [4, 4, 6, "Vast"], HTI: [1, 1, 2, "No control"],
};
window.border = c => {
  const b = window.BORDERS[c.iso3];
  if (b) return { land: b[0], sea: b[1], entry: b[2], note: b[3], est: false };
  const lg = Math.log10(1 + c.gdp / Math.max(c.pop, 0.001)), m = c.milStats || {}, counter = (c.intelProfile && c.intelProfile.counter) || 3;
  const f = x => Math.round(Math.max(1, Math.min(9, x)) * 10) / 10, land = f(1 + 1.3 * lg + 0.2 * counter - 0.15 * (m.corruption || 5));
  return { land, sea: land, entry: f(2 + 2 * lg + 0.1 * counter - 0.2 * (m.corruption || 5)), note: "", est: true };
};
