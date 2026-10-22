// "Secret assets" — estimated hidden / undeclared strength.
//
// Nobody outside a government knows these numbers. What follows is an open-source
// estimate built from published analysis (SIPRI off-budget spending estimates, FAS on
// undeclared arsenals, World Gold Council reserves, SWF Institute fund sizes, think-tank
// cyber/intelligence capability rankings such as IISS Cyber Capabilities and Belfer NCPI).
//
// Fields:
//  intel    0-10  foreign intelligence / HUMINT+SIGINT reach
//  cyber    0-10  offensive cyber capability
//  latency  0-10  nuclear capability (10 = armed; 6-9 = hosts weapons or could build quickly)
//  offbook  %     estimated military spending NOT in the official budget (relative to it)
//  gold     t     official gold reserves (tonnes)
//  swf      $bn   sovereign wealth / strategic investment funds
//  proxies  0-10  deniable force: proxies, militias, PMCs, irregulars
//  note           what analysts believe is hidden
window.INTEL_OVERRIDES = {
  USA: { intel: 10, cyber: 10, latency: 10, offbook: 10, gold: 8133, swf: 0, proxies: 6, note: "~$100bn/yr classified intelligence budget (NSA, NRO, CIA); black programmes incl. B-21, hypersonics & space weapons; 750+ overseas bases; global SIGINT via Five Eyes." },
  CHN: { intel: 9, cyber: 9, latency: 10, offbook: 30, gold: 2300, swf: 2000, proxies: 7, note: "True defence spend est. ~30% above official (R&D, PAP, space); warheads growing toward 1,000 by 2030; maritime militia & coast guard; analysts suspect undeclared gold far above 2,300t; Volt/Salt Typhoon cyber pre-positioning." },
  RUS: { intel: 9, cyber: 9, latency: 10, offbook: 40, gold: 2330, swf: 130, proxies: 9, note: "~1/3 of the defence budget is classified; GRU/SVR/FSB networks; Poseidon & Burevestnik exotic weapons; Africa Corps (ex-Wagner); 'shadow fleet' sanctions evasion; large Soviet-era storage reserves." },
  GBR: { intel: 9, cyber: 9, latency: 10, offbook: 5, gold: 310, swf: 0, proxies: 3, note: "GCHQ & Five Eyes hub, MI6 HUMINT, SAS/SBS, Trident SSBNs, National Cyber Force; London finance as strategic leverage." },
  FRA: { intel: 8, cyber: 8, latency: 10, offbook: 5, gold: 2437, swf: 0, proxies: 4, note: "DGSE, independent nuclear deterrent (air + sea), overseas territories across every ocean, Foreign Legion, residual Françafrique networks." },
  DEU: { intel: 7, cyber: 7, latency: 6, offbook: 3, gold: 3350, swf: 0, proxies: 1, note: "NATO nuclear-sharing (US B61 bombs at Büchel); world's 2nd-largest gold reserve; deep industrial base that could scale war production." },
  ITA: { intel: 7, cyber: 6, latency: 6, offbook: 4, gold: 2452, swf: 0, proxies: 1, note: "Hosts US B61s at Aviano & Ghedi; 3rd-largest gold holder; Leonardo defence-electronics base." },
  NLD: { intel: 7, cyber: 8, latency: 6, offbook: 2, gold: 612, swf: 0, proxies: 0, note: "Hosts US B61s at Volkel; AIVD/MIVD cyber operations (Cozy Bear penetration); ASML chip chokepoint." },
  BEL: { intel: 5, cyber: 5, latency: 6, offbook: 2, gold: 227, swf: 0, proxies: 0, note: "Hosts US B61s at Kleine Brogel; NATO HQ; Euroclear holds frozen Russian assets." },
  TUR: { intel: 7, cyber: 6, latency: 5, offbook: 15, gold: 615, swf: 300, proxies: 7, note: "MIT intelligence; hosts US B61s at Incirlik; Bayraktar/drone export dominance; Syrian National Army proxies; leverage over Bosphorus." },
  ISR: { intel: 10, cyber: 10, latency: 10, offbook: 15, gold: 0, swf: 0, proxies: 4, note: "Undeclared arsenal of ~90 warheads (Jericho III, sub-launched cruise missiles); Mossad & Unit 8200; Iron Dome/Arrow/Iron Beam; pager-style supply-chain operations." },
  IND: { intel: 8, cyber: 7, latency: 10, offbook: 8, gold: 880, swf: 0, proxies: 3, note: "R&AW; Agni-V MIRV and Arihant-class SSBNs; growing space ISR; huge strategic reserves of manpower." },
  PAK: { intel: 8, cyber: 6, latency: 10, offbook: 25, gold: 65, swf: 0, proxies: 7, note: "ISI; one of the fastest-growing arsenals (tactical Nasr nukes); vast military-run business empire; Chinese J-10C/J-35 pipeline." },
  PRK: { intel: 7, cyber: 9, latency: 10, offbook: 150, gold: 0, swf: 0, proxies: 4, note: "Real military spend est. ~25% of GDP vs tiny official figure; Lazarus Group stole >$3bn in crypto; ~50 warheads with material for more; vast underground facilities; troops sent to Russia." },
  IRN: { intel: 8, cyber: 8, latency: 7, offbook: 60, gold: 300, swf: 0, proxies: 10, note: "IRGC & Quds Force largely off-budget; 'Axis of Resistance' (Hezbollah, Houthis, Iraqi militias); 60% enriched uranium stockpile pre-strikes; mass-produced Shahed drones & ballistic missiles." },
  SAU: { intel: 6, cyber: 6, latency: 4, offbook: 10, gold: 323, swf: 925, proxies: 5, note: "PIF ~$925bn; reported Chinese-assisted missile production; vowed to match any Iranian bomb; oil spare capacity as a weapon." },
  ARE: { intel: 7, cyber: 8, latency: 3, offbook: 10, gold: 75, swf: 1700, proxies: 8, note: "ADIA/Mubadala/ADQ ~$1.7trn; advanced spyware & cyber units; deniable proxy network (Sudan RSF, Libya, Yemen, Somaliland base)." },
  QAT: { intel: 5, cyber: 5, latency: 1, offbook: 5, gold: 110, swf: 520, proxies: 3, note: "QIA ~$520bn; LNG leverage over Europe & Asia; hosts US CENTCOM at Al Udeid; Al Jazeera narrative power." },
  KWT: { intel: 4, cyber: 4, latency: 1, offbook: 5, gold: 79, swf: 1000, proxies: 0, note: "Kuwait Investment Authority ~$1trn — the world's oldest SWF." },
  NOR: { intel: 6, cyber: 6, latency: 3, offbook: 2, gold: 0, swf: 1900, proxies: 0, note: "Government Pension Fund Global ~$1.9trn — owns ~1.5% of all listed shares on Earth; Arctic ISR for NATO." },
  SGP: { intel: 7, cyber: 8, latency: 2, offbook: 5, gold: 230, swf: 1100, proxies: 0, note: "GIC + Temasek >$1trn; 'Total Defence' mobilises ~1m reservists; densest ISR in Southeast Asia." },
  JPN: { intel: 6, cyber: 7, latency: 9, offbook: 3, gold: 846, swf: 0, proxies: 0, note: "Threshold state: ~45t of separated plutonium and H3/Epsilon rockets — could build a deterrent in months; $1.2trn FX reserves." },
  KOR: { intel: 7, cyber: 8, latency: 8, offbook: 5, gold: 104, swf: 200, proxies: 0, note: "High nuclear latency, huge Hyunmoo missile force, 3.1m reservists, booming K-defence export industry." },
  TWN: { intel: 7, cyber: 7, latency: 6, offbook: 10, gold: 424, swf: 0, proxies: 0, note: "TSMC 'silicon shield' (~90% of the world's most advanced chips); ran a secret nuclear-weapons programme until 1988; Hsiung Feng cruise missiles that can reach the mainland; mountain-tunnel airbases (Chiashan); 1.66m reservists and a new submarine (Hai Kun)." },
  UKR: { intel: 8, cyber: 9, latency: 6, offbook: 30, gold: 25, swf: 0, proxies: 4, note: "Battle-tested drone industry producing millions per year; long-range strike drones; HUR special operations; Western ISR feed; Soviet nuclear know-how." },
  BLR: { intel: 5, cyber: 5, latency: 9, offbook: 20, gold: 50, swf: 0, proxies: 3, note: "Hosts Russian tactical nuclear weapons and Oreshnik missiles; KGB (still named so) internal security." },
  POL: { intel: 6, cyber: 6, latency: 3, offbook: 5, gold: 515, swf: 0, proxies: 0, note: "Fastest military build-up in Europe; buying gold aggressively (~515t); NATO eastern-flank logistics hub." },
  CHE: { intel: 6, cyber: 6, latency: 3, offbook: 2, gold: 1040, swf: 0, proxies: 0, note: "1,040t of gold; alpine fortress & bunker network for the whole population; banking secrecy legacy." },
  AUS: { intel: 7, cyber: 8, latency: 4, offbook: 3, gold: 80, swf: 230, proxies: 0, note: "Pine Gap & Five Eyes; AUKUS nuclear-powered submarine programme; uranium #3 producer; Future Fund ~$230bn." },
  CAN: { intel: 6, cyber: 7, latency: 4, offbook: 3, gold: 0, swf: 0, proxies: 0, note: "CSE & Five Eyes; #2 uranium producer; Arctic territory; deep integration with US defence (NORAD)." },
  NZL: { intel: 5, cyber: 6, latency: 1, offbook: 2, gold: 0, swf: 50, proxies: 0, note: "GCSB Five Eyes SIGINT station (Waihopai); Pacific influence." },
  SWE: { intel: 6, cyber: 7, latency: 4, offbook: 3, gold: 126, swf: 0, proxies: 0, note: "Saab (Gripen, submarines); historic nuclear weapons programme; Baltic ISR." },
  FIN: { intel: 6, cyber: 7, latency: 3, offbook: 2, gold: 49, swf: 0, proxies: 0, note: "Largest artillery force in Western Europe; 870k trained reservists; civil-defence shelters for 4.8m people." },
  EGY: { intel: 6, cyber: 4, latency: 2, offbook: 50, gold: 127, swf: 12, proxies: 3, note: "Military-owned business empire est. 25-40% of economy; US aid; Suez Canal chokepoint." },
  DZA: { intel: 5, cyber: 4, latency: 2, offbook: 15, gold: 174, swf: 0, proxies: 3, note: "Africa's largest defence budget; Polisario support; gas leverage over southern Europe." },
  MAR: { intel: 6, cyber: 6, latency: 1, offbook: 10, gold: 22, swf: 0, proxies: 1, note: "DGED intelligence; Pegasus spyware use; Israeli defence ties; ~70% of world phosphate reserves." },
  LBY: { intel: 3, cyber: 2, latency: 1, offbook: 50, gold: 146, swf: 70, proxies: 8, note: "Two rival governments; Russian Africa Corps & Turkish forces present; Libyan Investment Authority ~$70bn." },
  NGA: { intel: 4, cyber: 4, latency: 2, offbook: 20, gold: 22, swf: 3, proxies: 3, note: "Security votes (unaudited) and oil-funded off-budget spending; largest African population; Nollywood/Afrobeats soft reach." },
  ZAF: { intel: 5, cyber: 5, latency: 7, offbook: 3, gold: 125, swf: 0, proxies: 0, note: "Only country to build and then dismantle nuclear weapons (6 devices); still holds weapons-grade uranium; Denel arms industry; PGM & gold minerals." },
  ETH: { intel: 5, cyber: 4, latency: 0, offbook: 20, gold: 1, swf: 0, proxies: 4, note: "Fano & regional militias; Turkish/Iranian/UAE drones; GERD dam leverage over Nile." },
  KAZ: { intel: 5, cyber: 4, latency: 4, offbook: 10, gold: 300, swf: 60, proxies: 0, note: "World's #1 uranium producer (~40%); Baikonur Cosmodrome; held the 4th-largest nuclear arsenal in 1991 (gave it up); ~300t gold; National Fund ~$60bn." },
  MNG: { intel: 3, cyber: 3, latency: 2, offbook: 10, gold: 20, swf: 1, proxies: 0, note: "Huge rare-earth, copper (Oyu Tolgoi) & coal deposits; 137k reservists; uranium deposits; 'third neighbour' ties with US/Japan." },
  BGD: { intel: 4, cyber: 3, latency: 1, offbook: 10, gold: 14, swf: 0, proxies: 1, note: "World's largest UN peacekeeping contributor (combat experience); Rooppur nuclear plant; Bay of Bengal & Chinese-built submarines." },
  MEX: { intel: 5, cyber: 4, latency: 3, offbook: 15, gold: 120, swf: 0, proxies: 0, note: "Cartels field paramilitary-grade arsenals (shadow armed power est. 175k members); Pegasus spyware buyer; Laguna Verde nuclear plant; leverage over US supply chains." },
  BRA: { intel: 5, cyber: 6, latency: 6, offbook: 5, gold: 130, swf: 0, proxies: 0, note: "Enriches its own uranium; building nuclear-powered submarine (Álvaro Alberto); Embraer aerospace; Amazon & agribusiness leverage." },
  ARG: { intel: 4, cyber: 4, latency: 5, offbook: 5, gold: 62, swf: 0, proxies: 0, note: "Advanced civilian nuclear sector (INVAP exports reactors); past ballistic-missile programme (Cóndor)." },
  VEN: { intel: 4, cyber: 3, latency: 1, offbook: 40, gold: 160, swf: 0, proxies: 7, note: "Bolivarian militia claims ~4m members; colectivos; Cuban intelligence advisers; largest proven oil reserves." },
  CUB: { intel: 8, cyber: 4, latency: 1, offbook: 100, gold: 0, swf: 0, proxies: 2, note: "DI is rated among the world's best HUMINT services; reported Chinese SIGINT stations; military-run GAESA conglomerate controls much of the economy." },
  COL: { intel: 5, cyber: 4, latency: 1, offbook: 5, gold: 15, swf: 0, proxies: 2, note: "Decades of counter-insurgency experience; elite special forces; NATO global partner." },
  VNM: { intel: 6, cyber: 6, latency: 2, offbook: 25, gold: 0, swf: 0, proxies: 3, note: "5m reservists; maritime militia; People's Army runs Viettel (cyber & telecom)." },
  IDN: { intel: 5, cyber: 5, latency: 2, offbook: 15, gold: 79, swf: 20, proxies: 1, note: "Military business holdings; controls Malacca-adjacent straits; nickel dominance (EV supply chain)." },
  MYS: { intel: 4, cyber: 5, latency: 1, offbook: 5, gold: 39, swf: 30, proxies: 0, note: "Straits of Malacca; semiconductor back-end hub." },
  THA: { intel: 5, cyber: 5, latency: 1, offbook: 15, gold: 235, swf: 0, proxies: 0, note: "Military conglomerates & coup history; 235t gold; Chakri Naruebet carrier." },
  PHL: { intel: 4, cyber: 4, latency: 0, offbook: 5, gold: 160, swf: 9, proxies: 1, note: "US EDCA bases; Luzon Strait chokepoint." },
  MMR: { intel: 4, cyber: 3, latency: 1, offbook: 60, gold: 7, swf: 0, proxies: 5, note: "Junta's military conglomerates (MEHL, MEC) off-budget; Russian/Chinese arms; past suspected nuclear ambitions." },
  IRQ: { intel: 4, cyber: 3, latency: 1, offbook: 30, gold: 160, swf: 0, proxies: 9, note: "Popular Mobilisation Forces (~230k, Iran-aligned) operate partly outside state control." },
  SYR: { intel: 3, cyber: 2, latency: 0, offbook: 30, gold: 26, swf: 0, proxies: 6, note: "Post-Assad transition; most heavy equipment destroyed by Israeli strikes in Dec 2024; factional militias." },
  LBN: { intel: 4, cyber: 3, latency: 0, offbook: 300, gold: 287, swf: 0, proxies: 10, note: "Hezbollah's arsenal once exceeded the state army (100k+ rockets pre-2024), now degraded; 287t gold — huge per capita." },
  YEM: { intel: 3, cyber: 2, latency: 0, offbook: 300, gold: 0, swf: 0, proxies: 9, note: "Houthi anti-ship ballistic missiles & drones disrupted Red Sea trade; Iranian supply chain." },
  PSE: { intel: 3, cyber: 3, latency: 0, offbook: 300, gold: 0, swf: 1, proxies: 9, note: "Armed factions (Hamas, PIJ) with tunnel networks, heavily degraded since 2023; global diplomatic solidarity." },
  AFG: { intel: 3, cyber: 1, latency: 0, offbook: 100, gold: 22, swf: 0, proxies: 6, note: "Taliban seized ~$7bn of US equipment in 2021 (much unserviceable); $1trn+ untapped lithium & rare earths." },
  AZE: { intel: 5, cyber: 4, latency: 1, offbook: 15, gold: 90, swf: 60, proxies: 1, note: "SOFAZ oil fund ~$60bn; Israeli & Turkish drones; Caspian energy leverage." },
  UZB: { intel: 4, cyber: 3, latency: 1, offbook: 15, gold: 380, swf: 0, proxies: 0, note: "~380t gold (gold is its top export); uranium; largest Central Asian army." },
  TKM: { intel: 3, cyber: 2, latency: 0, offbook: 40, gold: 0, swf: 0, proxies: 0, note: "4th-largest gas reserves; total state secrecy — figures are guesses." },
  OMN: { intel: 5, cyber: 4, latency: 0, offbook: 5, gold: 0, swf: 50, proxies: 0, note: "Strait of Hormuz southern shore; neutral mediator with back-channels to Iran & US." },
  JOR: { intel: 7, cyber: 4, latency: 0, offbook: 10, gold: 70, swf: 0, proxies: 0, note: "GID is one of the region's most capable intelligence services; US & UK special forces partner." },
  DJI: { intel: 2, cyber: 2, latency: 0, offbook: 5, gold: 0, swf: 0, proxies: 0, note: "Hosts US, Chinese, French, Japanese & Italian bases at the Bab-el-Mandeb — rent & leverage far beyond its size." },
  ERI: { intel: 4, cyber: 1, latency: 0, offbook: 100, gold: 0, swf: 0, proxies: 3, note: "Indefinite national service makes it one of the most militarised societies on Earth." },
  SDN: { intel: 3, cyber: 2, latency: 0, offbook: 200, gold: 0, swf: 0, proxies: 9, note: "Civil war: RSF paramilitary funded by gold smuggling & foreign backers rivals the army." },
  RWA: { intel: 6, cyber: 4, latency: 0, offbook: 30, gold: 0, swf: 0, proxies: 7, note: "Highly effective army & intelligence; regional deployments (Mozambique, CAR); M23 links in eastern DRC." },
  COD: { intel: 2, cyber: 1, latency: 0, offbook: 40, gold: 0, swf: 0, proxies: 6, note: "~70% of world cobalt & major coltan — the strategic mineral of the EV age; Wazalendo militias." },
  VAT: { intel: 6, cyber: 2, latency: 0, offbook: 0, gold: 0, swf: 6, proxies: 0, note: "Global network of ~400,000 priests and diplomats in 180+ countries — arguably the oldest intelligence network on Earth." },
  SRB: { intel: 4, cyber: 4, latency: 1, offbook: 10, gold: 48, swf: 0, proxies: 1, note: "Balancing between Russia, China & the West; Chinese HQ-22 air defence." },
  HUN: { intel: 4, cyber: 4, latency: 1, offbook: 5, gold: 110, swf: 0, proxies: 0, note: "Quintupled gold reserves since 2018 (~110t)." },
  GRC: { intel: 5, cyber: 5, latency: 1, offbook: 5, gold: 114, swf: 0, proxies: 0, note: "World's largest merchant fleet by tonnage (shipping as strategic leverage)." },
  ESP: { intel: 5, cyber: 6, latency: 3, offbook: 4, gold: 282, swf: 0, proxies: 0, note: "Rota & Morón US bases; Strait of Gibraltar control." },
  PRT: { intel: 4, cyber: 4, latency: 1, offbook: 3, gold: 383, swf: 0, proxies: 0, note: "383t gold — among the highest per capita; Azores (Lajes) Atlantic air base." },
  AUT: { intel: 5, cyber: 4, latency: 1, offbook: 2, gold: 280, swf: 0, proxies: 0, note: "Vienna is a global espionage hub (UN, OPEC, OSCE, IAEA); 280t gold." },
  DNK: { intel: 6, cyber: 6, latency: 2, offbook: 3, gold: 67, swf: 0, proxies: 0, note: "Greenland & the GIUK gap; Danish straits control Baltic access." },
  EST: { intel: 6, cyber: 8, latency: 0, offbook: 2, gold: 0, swf: 0, proxies: 0, note: "NATO Cyber Defence Centre of Excellence; Defence League volunteers." },
};

// Mutual-defence blocs (used in war games: defenders get help from allies).
window.ALLIANCES = {
  NATO: ["USA","CAN","GBR","FRA","DEU","ITA","ESP","PRT","NLD","BEL","LUX","DNK","NOR","ISL","TUR","GRC","POL","CZE","SVK","HUN","ROU","BGR","EST","LVA","LTU","SVN","HRV","ALB","MNE","MKD","FIN","SWE"],
  CSTO: ["RUS","BLR","KAZ","KGZ","TJK","ARM"],
  "US Pacific Treaties": ["USA","JPN","KOR","AUS","PHL","NZL"],
  "China–DPRK Treaty": ["CHN","PRK"],
  "Gulf Peninsula Shield": ["SAU","ARE","KWT","BHR","QAT","OMN"],
};

// Overseas territories / regions in the map file that belong to one of the 196 states.
window.TERRITORY_OWNER = {
  "630":"USA","316":"USA","850":"USA","016":"USA","580":"USA",
  "239":"GBR","086":"GBR","654":"GBR","612":"GBR","660":"GBR","238":"GBR","136":"GBR","060":"GBR","092":"GBR","796":"GBR","500":"GBR","832":"GBR","831":"GBR","833":"GBR",
  "666":"FRA","876":"FRA","663":"FRA","652":"FRA","258":"FRA","540":"FRA","260":"FRA",
  "304":"DNK","234":"DNK","533":"NLD","531":"NLD","534":"NLD",
  "344":"CHN","446":"CHN","248":"FIN","184":"NZL","570":"NZL",
  "574":"AUS","334":"AUS",
};
// Named shapes with no ISO id
window.TERRITORY_OWNER_BY_NAME = { "Somaliland": "SOM", "Indian Ocean Ter.": "AUS", "Ashmore and Cartier Is.": "AUS" };
// Shown on the map but not one of the 196 (disputed / partially recognised)
window.DISPUTED = { "732": "Western Sahara", "Kosovo": "Kosovo", "N. Cyprus": "Northern Cyprus", "Siachen Glacier": "Siachen Glacier" };
