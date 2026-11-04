// Alliance loyalty: how firmly each member of each mutual-defence bloc would actually fight for it.
// A member's loyalty (0–100) starts from how binding its treaty is, then its real track record
// (below), then the war in front of it: who attacks whom, how close the fighting is, whether the
// attacker looks stronger than the whole bloc, whether it shares a treaty with the attacker, and
// your diplomatic influence there (game.js `loyalty`). No dice: the same war always gets the same
// answer.
//   70+    Fights: sends its full share.
//   50–69  Limited help: arms, aircraft and half its share.
//   30–49  Sits out.
//   under 30  Betrays: walks out of the bloc when the war starts.

// binding: how hard the treaty obliges members to fight (0–1). leader: the bloc's anchor; it
// loses heart if the leader falls. threat: who the bloc exists to deter (members rally against
// it). test: the default war shown in the Alliances tab [attacker, target].
window.ALLIANCE_INFO = {
  NATO: { treaty: "North Atlantic Treaty (1949), Article 5", binding: 0.85, leader: "USA", threat: ["RUS"], test: ["RUS", "EST"],
    note: "An attack on one is an attack on all. Invoked once, for the United States after 9/11. Integrated command, joint bases and battlegroups on the eastern flank." },
  CSTO: { treaty: "Collective Security Treaty (1992), Article 4", binding: 0.5, leader: "RUS", threat: ["USA", "UKR"], test: ["AZE", "ARM"],
    note: "Russia's bloc. It sent troops to Kazakhstan in 2022 but refused to help Armenia against Azerbaijan in 2021–23, and no member joined Russia's war in Ukraine." },
  "EU Mutual Assistance (Art. 42.7)": { treaty: "Treaty on European Union, Article 42.7 (2009)", binding: 0.55, leader: "FRA", threat: ["RUS"], test: ["RUS", "FIN"],
    note: "Members owe an attacked member aid 'by all means in their power', but neutral members (Austria, Ireland, Malta) keep their neutrality. Invoked once, by France after the 2015 Paris attacks." },
  "Union State": { treaty: "Union State Treaty (1999) and 2023 security guarantees", binding: 0.95, leader: "RUS", threat: ["UKR", "POL", "USA"], test: ["UKR", "BLR"],
    note: "Russia and Belarus share a military doctrine, a regional army group and, since 2023, Russian nuclear weapons on Belarusian soil." },
  "US–Japan Treaty": { treaty: "Treaty of Mutual Cooperation and Security (1960), Article V", binding: 0.85, leader: "USA", threat: ["CHN", "PRK", "RUS"], test: ["CHN", "JPN"],
    note: "The US defends Japan's territory, including the Senkakus; Japan hosts the US 7th Fleet and about 55,000 US troops." },
  "US–South Korea Treaty": { treaty: "Mutual Defense Treaty (1953)", binding: 0.85, leader: "USA", threat: ["PRK", "CHN"], test: ["PRK", "KOR"],
    note: "About 28,500 US troops in Korea under a combined command; the 1953 armistice never became peace." },
  "US–Philippines Treaty": { treaty: "Mutual Defense Treaty (1951)", binding: 0.75, leader: "USA", threat: ["CHN"], test: ["CHN", "PHL"],
    note: "Washington has said it covers Philippine ships and aircraft in the South China Sea; nine sites are open to US forces." },
  ANZUS: { treaty: "ANZUS Treaty (1951)", binding: 0.6, leader: "USA", threat: ["CHN"], test: ["CHN", "AUS"],
    note: "Invoked once, by Australia after 9/11. The US suspended its obligations to New Zealand in 1986." },
  "US–Thailand (Manila Pact)": { treaty: "Manila Pact (1954) and Thanat–Rusk communiqué (1962)", binding: 0.4, leader: "USA", threat: [], test: ["KHM", "THA"],
    note: "A treaty ally since 1954 that hosts Cobra Gold, Asia's largest exercise, but leans toward Beijing too." },
  "US Compacts of Free Association": { treaty: "Compacts of Free Association (1986, 1994; renewed 2023)", binding: 0.95, leader: "USA", threat: ["CHN"], test: ["CHN", "PLW"],
    note: "The US has full authority and responsibility for the defence of Micronesia, the Marshall Islands and Palau." },
  "Rio Treaty": { treaty: "Inter-American Treaty of Reciprocal Assistance (1947)", binding: 0.4, leader: "USA", threat: ["VEN"], test: ["VEN", "COL"],
    note: "The Americas' defence pact. The US backed Britain, not Argentina, in 1982; Mexico, Bolivia, Ecuador, Nicaragua and Venezuela have left." },
  "Five Power Defence Arrangements": { treaty: "Five Power Defence Arrangements (1971)", binding: 0.35, leader: "GBR", threat: [], test: ["CHN", "MYS"],
    note: "Members only consult if Malaysia or Singapore is attacked, but run a joint air-defence system and yearly exercises." },
  "Anglo-Portuguese Alliance": { treaty: "Treaty of Windsor (1386)", binding: 0.4, leader: "GBR", threat: [], test: ["ESP", "PRT"],
    note: "The oldest alliance still in force. Portugal let Britain use the Azores in 1943 and 1982." },
  "France–UAE Defence Agreement": { treaty: "Defence agreement (2009)", binding: 0.7, leader: "FRA", threat: ["IRN"], test: ["IRN", "ARE"],
    note: "France keeps a naval, air and army base in Abu Dhabi and pledged to help defend the UAE." },
  "France–Djibouti Treaty": { treaty: "Defence cooperation treaty (2011)", binding: 0.8, leader: "FRA", threat: [], test: ["ERI", "DJI"],
    note: "About 1,500 French troops are based in Djibouti and responsible for its air defence." },
  "France–Greece Pact": { treaty: "Strategic partnership with mutual assistance clause (2021)", binding: 0.7, leader: "FRA", threat: ["TUR"], test: ["TUR", "GRC"],
    note: "Signed with Greece's purchase of Rafales and frigates; aimed at Turkey, though both are in NATO." },
  "Greece–Cyprus Joint Defence": { treaty: "Joint Defence Doctrine (1993)", binding: 0.6, leader: "GRC", threat: ["TUR"], test: ["TUR", "CYP"],
    note: "Greece treats an attack on Cyprus as an attack on itself; Greek officers serve in Cyprus's National Guard." },
  "Turkey–Azerbaijan (Shusha)": { treaty: "Shusha Declaration (2021)", binding: 0.75, leader: "TUR", threat: ["ARM"], test: ["ARM", "AZE"],
    note: "'One nation, two states'. Turkey armed and advised Azerbaijan in the 2020 war; the declaration adds mutual military assistance." },
  "Arab League Joint Defence": { treaty: "Joint Defence and Economic Cooperation Treaty (1950)", binding: 0.25, leader: "EGY", threat: ["ISR"], test: ["ISR", "LBN"],
    note: "Last fought together in 1973. Egypt and Jordan have made peace with Israel, and the UAE, Bahrain, Morocco and Sudan normalised ties in 2020." },
  "ECOWAS Defence Protocol": { treaty: "Protocol on Mutual Assistance in Defence (1981)", binding: 0.45, leader: "NGA", threat: [], test: ["NER", "BEN"],
    note: "Its forces intervened in Liberia, Sierra Leone and The Gambia (2017). Mali, Burkina Faso and Niger left in 2025; the threat to invade Niger in 2023 came to nothing." },
  "Alliance of Sahel States": { treaty: "Liptako-Gourma Charter (2023)", binding: 0.8, leader: "MLI", threat: [], test: ["CIV", "BFA"],
    note: "Mutual defence between the military governments of Mali, Burkina Faso and Niger, backed by Russia's Africa Corps." },
  "SADC Mutual Defence Pact": { treaty: "SADC Mutual Defence Pact (2003)", binding: 0.4, leader: "ZAF", threat: [], test: ["RWA", "COD"],
    note: "Sent forces to Mozambique (2021–24) and DR Congo (2023–25), withdrawing from Congo after heavy losses to the M23." },
  "Eastern Caribbean RSS": { treaty: "Regional Security System Treaty (1996)", binding: 0.6, leader: "BRB", threat: [], test: ["VEN", "LCA"],
    note: "A collective security pact of small island states with a shared standby force." },
  "China–DPRK Treaty": { treaty: "Treaty of Friendship (1961), Article II", binding: 0.7, leader: "CHN", threat: ["USA", "KOR"], test: ["USA", "PRK"],
    note: "China's only formal alliance. It obliges China to intervene, as it did in 1950, but Beijing has said it would not back a North Korean first strike." },
  "Gulf Peninsula Shield": { treaty: "GCC Joint Defence Agreement (2000), Peninsula Shield Force", binding: 0.5, leader: "SAU", threat: ["IRN"], test: ["IRN", "SAU"],
    note: "Saudi-led. Deployed into Bahrain in 2011, but the 2017–21 blockade of Qatar split the Gulf states." },
  "Russia–DPRK Treaty": { treaty: "Comprehensive Strategic Partnership (2024), Article 4", binding: 0.75, leader: "RUS", threat: ["UKR", "USA", "KOR"], test: ["UKR", "RUS"],
    note: "Mutual defence signed in June 2024. North Korea then sent troops and shells to fight for Russia in Kursk." },
  "Saudi–Pakistan Pact": { treaty: "Strategic Mutual Defence Agreement (2025)", binding: 0.6, leader: "SAU", threat: ["IND", "IRN"], test: ["IND", "PAK"],
    note: "Signed in September 2025: aggression against either is aggression against both." },
};

// Each member's record: [adjustment, why]. Members not listed get 0.
window.ALLY_RECORD = {
  NATO: {
    USA: [8, "Leads NATO and provides most of its power; recent US leaders have questioned defending members that spend little"],
    CAN: [3, "Has fought in every NATO mission; leads the battlegroup in Latvia"],
    GBR: [12, "Nuclear power; leads the battlegroup in Estonia; first to send Ukraine tanks and long-range missiles"],
    FRA: [8, "Nuclear power; leads the battlegroup in Romania, though it guards its strategic autonomy"],
    DEU: [5, "Basing a permanent brigade in Lithuania, after decades of caution"],
    ITA: [0, "A steady contributor, but under 2% of GDP on defence until 2025"],
    ESP: [-8, "Lowest defence spending in NATO; refused the 2025 target of 5% of GDP"],
    PRT: [0, "A founding member with a small but reliable force"],
    NLD: [5, "Gave Ukraine F-16s and is a firm backer of the eastern flank"],
    BEL: [-5, "A long-time low spender on defence"],
    LUX: [-5, "No real armed forces to send"],
    DNK: [10, "Gave Ukraine all of its artillery; controls the Baltic straits"],
    NOR: [8, "Borders Russia in the Arctic and watches its Northern Fleet"],
    ISL: [-10, "Has no armed forces"],
    TUR: [-20, "Bought Russian S-400s, held up Sweden's and Finland's entry for months, refuses sanctions on Russia and fights its own wars in Syria and Iraq"],
    GRC: [-5, "Spends 3% of GDP, but mostly against fellow member Turkey"],
    POL: [18, "Spends about 4.5% of GDP and has the largest army in EU NATO; a frontline state"],
    CZE: [5, "Organised the ammunition drive for Ukraine"],
    SVK: [-15, "Its government halted military aid to Ukraine and courts Moscow"],
    HUN: [-28, "Its government blocks EU aid to Ukraine, buys Russian energy and keeps close ties to Moscow and Beijing"],
    ROU: [5, "Hosts the Aegis Ashore missile-defence site and a growing US presence"],
    BGR: [-5, "Divided politics, with strong pro-Russian parties"],
    EST: [18, "Frontline Baltic state spending over 3% of GDP; it has the most to lose"],
    LVA: [18, "Frontline Baltic state spending over 3% of GDP; it has the most to lose"],
    LTU: [18, "Frontline Baltic state spending over 3% of GDP; it has the most to lose"],
    SVN: [0, "A small, reliable member"],
    HRV: [2, "A small, reliable member"],
    ALB: [0, "A small, reliable member"],
    MNE: [-5, "Pro-Serbian and pro-Russian parties hold sway"],
    MKD: [0, "A small, reliable member"],
    FIN: [15, "Joined in 2023 with a 1,340 km border with Russia and one of Europe's largest reserves"],
    SWE: [10, "Joined in 2024 after two centuries of neutrality; strong navy and air force"],
  },
  CSTO: {
    RUS: [25, "Leads the bloc; the 2022 CSTO mission to Kazakhstan was Russian troops"],
    BLR: [30, "In a Union State with Russia; hosts Russian nuclear weapons and let Russia invade Ukraine from its soil"],
    KAZ: [-5, "Refused to recognise Russia's annexations or help in Ukraine; balances Russia, China and the West"],
    KGZ: [5, "Hosts Russia's Kant air base, but fought border wars with fellow member Tajikistan in 2021–22"],
    TJK: [10, "Hosts Russia's largest foreign base, the 201st, but fought border wars with Kyrgyzstan"],
    ARM: [-40, "Froze its CSTO membership in 2024 after the bloc refused to help it against Azerbaijan"],
  },
  "EU Mutual Assistance (Art. 42.7)": {
    FRA: [10, "The only member to invoke the clause (2015); Europe's leading military power"],
    POL: [15, "Frontline state spending about 4.5% of GDP"], EST: [15, "Frontline Baltic state"], LVA: [15, "Frontline Baltic state"], LTU: [15, "Frontline Baltic state"],
    FIN: [12, "1,340 km border with Russia and a huge reserve"], SWE: [8, "Strong navy and air force"], DEU: [3, "Europe's largest economy, slowly rearming"],
    AUT: [-15, "Constitutionally neutral"], IRL: [-20, "Neutral, with a tiny defence force"], MLT: [-20, "Neutral by its constitution"], CYP: [-5, "Its forces face Turkish troops in the north"],
    HUN: [-28, "Its government blocks EU aid to Ukraine and keeps close ties to Moscow"], SVK: [-15, "Its government halted military aid to Ukraine"], ESP: [-5, "The EU's lowest defence spender"],
  },
  "Union State": {
    RUS: [5, "Treats Belarus as its western bulwark"], BLR: [5, "Its regime depends on Moscow's backing since 2020"],
  },
  "US–Japan Treaty": { USA: [10, "Its largest forward base: the 7th Fleet and III Marine Expeditionary Force"], JPN: [8, "Its 2015 security laws allow it to fight alongside the US"] },
  "US–South Korea Treaty": { USA: [12, "28,500 troops in Korea under combined command"], KOR: [5, "Fought beside the US in Vietnam"] },
  "US–Philippines Treaty": { USA: [0, "Committed on paper, but has never fought for the Philippines' disputed reefs"], PHL: [2, "Policy has swung between Washington and Beijing"] },
  ANZUS: { USA: [5, "AUKUS partner of Australia"], AUS: [12, "Has fought beside the US in every major war since 1917"], NZL: [-15, "The US suspended its ANZUS obligations to New Zealand in 1986"] },
  "US–Thailand (Manila Pact)": { USA: [-5, "Has cooled on Thailand since its coups"], THA: [-5, "Hedges between Washington and Beijing"] },
  "US Compacts of Free Association": { USA: [10, "Has full responsibility for their defence; key to its Pacific bases"] },
  "Rio Treaty": {
    USA: [5, "The treaty's anchor"], COL: [10, "The closest US security partner in South America"],
    ARG: [-10, "The US backed Britain against it in 1982, despite the treaty"], BRA: [-5, "Prefers strategic autonomy and non-alignment"],
    HTI: [-15, "No army to speak of; gangs control much of the capital"], BHS: [-10, "Tiny defence force"], CRI: [-15, "Abolished its army in 1948"], PAN: [-10, "No army since 1990"],
  },
  "Five Power Defence Arrangements": { AUS: [10, "Runs the joint air-defence system from Butterworth"], SGP: [10, "Its security depends on it"], GBR: [-5, "Far away"], NZL: [-5, "A small force far away"] },
  "Anglo-Portuguese Alliance": { GBR: [5, "Invoked it in both world wars and the Falklands"] },
  "France–UAE Defence Agreement": { FRA: [5, "Its base in Abu Dhabi has jets and warships"], ARE: [5, "Buys Rafales and hosts French forces"] },
  "France–Djibouti Treaty": { FRA: [5, "Its largest base in Africa"] },
  "France–Greece Pact": { FRA: [5, "Sold Greece Rafales and frigates"] },
  "Greece–Cyprus Joint Defence": { GRC: [15, "Sees Cyprus's defence as its own since the 1974 invasion"] },
  "Turkey–Azerbaijan (Shusha)": { TUR: [15, "Armed and advised Azerbaijan in the 2020 war"], AZE: [10, "'One nation, two states'"] },
  "Arab League Joint Defence": {
    DZA: [10, "Hardline; never normalised with Israel"], EGY: [0, "At peace with Israel since 1979 and won't go to war for others"], JOR: [-5, "At peace with Israel since 1994"],
    ARE: [-10, "Normalised with Israel in 2020"], BHR: [-10, "Normalised with Israel in 2020"], MAR: [-10, "Normalised with Israel in 2020"], SDN: [-15, "Normalised in 2020 and torn by civil war"],
    SYR: [-15, "Shattered by civil war"], YEM: [-10, "Split by civil war"], LBY: [-10, "Divided between rival governments"], LBN: [-10, "A weak state; Hezbollah is stronger than its army"],
    SOM: [-10, "Fighting al-Shabaab"], COM: [-10, "No real armed forces"], OMN: [-10, "Strictly neutral"], PSE: [-10, "No armed forces of its own"],
  },
  "ECOWAS Defence Protocol": {
    NGA: [15, "Led ECOMOG in Liberia and Sierra Leone"], SEN: [15, "Led the 2017 intervention in The Gambia"], GHA: [5, "A steady peacekeeper"], CIV: [5, "Hosts ECOWAS standby forces"],
    GIN: [-10, "Ruled by a junta friendly with the Sahel states"], CPV: [-10, "Tiny armed forces"],
  },
  "Alliance of Sahel States": {
    MLI: [10, "Juntas bound together after leaving ECOWAS"], BFA: [10, "Juntas bound together after leaving ECOWAS"], NER: [10, "Juntas bound together after leaving ECOWAS"],
  },
  "SADC Mutual Defence Pact": {
    ZAF: [5, "Led the missions to Mozambique and DR Congo, then pulled out after losses"], TZA: [5, "Fought in DR Congo"], ZWE: [5, "Fought in DR Congo in 1998"], AGO: [5, "Fought in DR Congo in 1998"],
    MWI: [-5, "Pulled out of the DR Congo mission early"], SYC: [-15, "Almost no armed forces"], MUS: [-15, "No army"], COM: [-10, "Tiny forces"], MDG: [-5, "Unstable politics"], LSO: [-5, "Tiny forces"],
  },
  "China–DPRK Treaty": {
    CHN: [0, "Intervened in 1950 and wants no US forces on its border, but says it would not back a North Korean first strike"],
    PRK: [10, "Depends on China for about 90% of its trade"],
  },
  "Gulf Peninsula Shield": {
    SAU: [25, "Leads and pays for the force; sent it into Bahrain in 2011"],
    ARE: [5, "Fought beside Saudi Arabia in Yemen, then backed rival factions there and in Sudan"],
    KWT: [5, "Remembers 1990, when it needed others to free it"],
    BHR: [20, "Its monarchy was propped up by the 2011 intervention"],
    QAT: [-15, "Blockaded by Saudi Arabia, the UAE and Bahrain in 2017–21; hosts Turkish troops and talks to Iran"],
    OMN: [-20, "Strictly neutral; mediates with Iran and shares the Strait of Hormuz with it"],
  },
  "Russia–DPRK Treaty": {
    RUS: [5, "Pays North Korea in oil, food and military technology"],
    PRK: [20, "Sent about 11,000 troops and millions of shells to fight for Russia in 2024–25"],
  },
  "Saudi–Pakistan Pact": {
    SAU: [0, "Wants Pakistan's protection, but India is one of its largest trade partners"],
    PAK: [15, "Has trained and guarded Saudi forces since the 1960s; Saudi money props up its economy"],
  },
};

// Neutral by law or long policy: they may help in other ways but never send forces to fight,
// and never walk out of a pact over it.
window.NEUTRAL = new Set(["AUT", "IRL", "MLT", "CHE", "LIE", "VAT", "CRI", "TKM", "MDA"]);

window.LOYALTY_STANCE = [
  [70, "Fights", "fights", 1],
  [50, "Limited help", "limited", 0.5],
  [30, "Sits out", "sits", 0],
  [0, "Betrays", "betrays", 0],
];
window.stanceOf = score => window.LOYALTY_STANCE.find(([min]) => score >= min);
