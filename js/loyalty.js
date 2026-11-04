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
  "US Pacific Treaties": { treaty: "Bilateral US treaties with Japan, South Korea, the Philippines and ANZUS", binding: 0.8, leader: "USA", threat: ["CHN", "PRK"], test: ["CHN", "JPN"],
    note: "A hub of separate treaties rather than one bloc: each ally is bound to the United States, not to each other." },
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
  "US Pacific Treaties": {
    USA: [10, "The anchor of every treaty, with about 80,000 troops in Japan and South Korea"],
    JPN: [8, "Hosts the US 7th Fleet; its 2015 laws allow it to defend allies"],
    KOR: [5, "Combined command with US forces, but its army is tied down facing North Korea"],
    AUS: [12, "Has fought beside the US in every major war since 1917; AUKUS partner"],
    PHL: [2, "Opened nine bases to US forces, though its policy has swung between Washington and Beijing"],
    NZL: [-15, "The US suspended its ANZUS obligations to New Zealand in 1986 over its nuclear-free policy"],
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

window.LOYALTY_STANCE = [
  [70, "Fights", "fights", 1],
  [50, "Limited help", "limited", 0.5],
  [30, "Sits out", "sits", 0],
  [0, "Betrays", "betrays", 0],
];
window.stanceOf = score => window.LOYALTY_STANCE.find(([min]) => score >= min);
