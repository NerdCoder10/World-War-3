// How a population would take being occupied by another country (0–100 happiness).
// It starts low (nobody likes occupation) and moves with shared language and culture, religion,
// history between the two (wars, massacres, colonial rule, or kinship), whether they were allies
// or rivals, freedom (a democracy ruled by an autocracy resents it most), living standards, how
// the land was taken (conquest, purchase or diplomatic union) and how long it has been ruled.
// Happiness sets how fast unrest builds and how much an occupied land pays (js/game.js).

// Culture and language groups.
window.CULTURE_GROUPS = {
  "English-speaking": ["USA", "GBR", "CAN", "AUS", "NZL", "IRL"],
  "Caribbean": ["JAM", "BHS", "BRB", "TTO", "GRD", "LCA", "VCT", "ATG", "KNA", "DMA", "GUY", "SUR", "BLZ", "HTI"],
  "Hispanic": ["ESP", "MEX", "GTM", "HND", "SLV", "NIC", "CRI", "PAN", "CUB", "DOM", "COL", "VEN", "ECU", "PER", "BOL", "CHL", "ARG", "URY", "PRY", "GNQ"],
  "Lusophone": ["PRT", "BRA", "AGO", "MOZ", "CPV", "GNB", "STP", "TLS"],
  "French & Benelux": ["FRA", "BEL", "LUX", "MCO"],
  "Germanic": ["DEU", "AUT", "CHE", "LIE", "NLD"],
  "Nordic": ["DNK", "NOR", "SWE", "ISL", "FIN"],
  "Italian": ["ITA", "SMR", "VAT", "MLT"],
  "East Slavic": ["RUS", "BLR", "UKR"],
  "Central European": ["POL", "CZE", "SVK", "SVN", "HRV", "HUN"],
  "Balkan Orthodox": ["SRB", "MNE", "MKD", "BGR", "BIH"],
  "Baltic": ["EST", "LVA", "LTU"],
  "Greek": ["GRC", "CYP"],
  "Romanian": ["ROU", "MDA"],
  "Albanian": ["ALB"],
  "Turkic": ["TUR", "AZE", "KAZ", "UZB", "TKM", "KGZ"],
  "Persian": ["IRN", "TJK", "AFG"],
  "Caucasian": ["GEO", "ARM"],
  "Gulf Arab": ["SAU", "ARE", "KWT", "QAT", "BHR", "OMN", "YEM"],
  "Levant & Iraq": ["IRQ", "SYR", "JOR", "LBN", "PSE"],
  "North African Arab": ["EGY", "LBY", "TUN", "DZA", "MAR", "MRT", "SDN"],
  "Horn of Africa": ["SOM", "DJI", "ETH", "ERI", "COM"],
  "Hebrew": ["ISR"],
  "South Asian": ["IND", "PAK", "BGD", "NPL", "LKA", "BTN", "MDV"],
  "Chinese": ["CHN", "TWN", "SGP"],
  "Mongolian": ["MNG"], "Japanese": ["JPN"], "Korean": ["KOR", "PRK"],
  "Mainland Southeast Asian": ["VNM", "THA", "LAO", "KHM", "MMR"],
  "Malay & Filipino": ["MYS", "IDN", "BRN", "PHL"],
  "Francophone Africa": ["SEN", "MLI", "BFA", "NER", "CIV", "GIN", "TGO", "BEN", "TCD", "CMR", "GAB", "COG", "CAF", "MDG", "COD", "BDI", "RWA", "SYC", "MUS"],
  "Anglophone West Africa": ["NGA", "GHA", "SLE", "LBR", "GMB"],
  "East African": ["KEN", "UGA", "TZA", "SSD"],
  "Southern African": ["ZAF", "ZMB", "ZWE", "MWI", "BWA", "NAM", "LSO", "SWZ"],
  "Pacific Islands": ["FJI", "PNG", "SLB", "VUT", "WSM", "TON", "KIR", "TUV", "NRU", "FSM", "MHL", "PLW"],
  "Andorran": ["AND"],
};
// Groups close enough that the occupied see some kinship.
window.CULTURE_KIN = [
  ["English-speaking", "Caribbean"], ["Hispanic", "Lusophone"], ["French & Benelux", "Francophone Africa"], ["Germanic", "Nordic"], ["Germanic", "Central European"],
  ["East Slavic", "Balkan Orthodox"], ["Gulf Arab", "Levant & Iraq"], ["Gulf Arab", "North African Arab"], ["Levant & Iraq", "North African Arab"],
  ["Turkic", "Persian"], ["Hispanic", "Italian"], ["French & Benelux", "Italian"], ["Anglophone West Africa", "East African"], ["East African", "Southern African"],
  ["Chinese", "Mainland Southeast Asian"], ["Mainland Southeast Asian", "Malay & Filipino"], ["Baltic", "Nordic"], ["English-speaking", "Pacific Islands"],
];

// Main religion (or tradition) of each country.
window.RELIGION_GROUPS = {
  catholic: ["ITA", "ESP", "PRT", "FRA", "BEL", "LUX", "IRL", "POL", "AUT", "CZE", "SVK", "SVN", "HRV", "HUN", "LTU", "MLT", "MCO", "AND", "SMR", "VAT", "LIE",
    "MEX", "GTM", "HND", "SLV", "NIC", "CRI", "PAN", "CUB", "DOM", "COL", "VEN", "ECU", "PER", "BOL", "CHL", "ARG", "URY", "PRY", "BRA", "PHL", "TLS", "HTI",
    "AGO", "CPV", "GNQ", "GAB", "COG", "COD", "BDI", "RWA", "SYC", "STP", "TZA", "UGA"],
  protestant: ["USA", "GBR", "CAN", "AUS", "NZL", "DEU", "NLD", "CHE", "DNK", "NOR", "SWE", "ISL", "FIN", "EST", "LVA", "JAM", "BHS", "BRB", "TTO", "GRD", "LCA",
    "VCT", "ATG", "KNA", "DMA", "GUY", "SUR", "BLZ", "NGA", "GHA", "LBR", "KEN", "ZMB", "ZWE", "MWI", "BWA", "NAM", "LSO", "SWZ", "ZAF", "SSD", "MDG", "CMR", "CAF",
    "FJI", "PNG", "SLB", "VUT", "WSM", "TON", "KIR", "TUV", "NRU", "FSM", "MHL", "PLW"],
  orthodox: ["RUS", "BLR", "UKR", "SRB", "MNE", "MKD", "BGR", "ROU", "MDA", "GRC", "CYP", "GEO", "ARM", "ETH", "ERI"],
  sunni: ["TUR", "KAZ", "UZB", "TKM", "KGZ", "TJK", "AFG", "SAU", "ARE", "KWT", "QAT", "JOR", "SYR", "PSE", "EGY", "LBY", "TUN", "DZA", "MAR", "MRT", "SDN", "SOM",
    "DJI", "COM", "PAK", "BGD", "MDV", "IDN", "MYS", "BRN", "SEN", "MLI", "BFA", "NER", "GIN", "GMB", "SLE", "TCD", "ALB", "BIH", "OMN"],
  shia: ["IRN", "IRQ", "AZE", "BHR", "LBN", "YEM"],
  jewish: ["ISR"],
  hindu: ["IND", "NPL", "MUS"],
  buddhist: ["THA", "MMR", "KHM", "LAO", "LKA", "BTN", "MNG"],
  eastasian: ["CHN", "TWN", "JPN", "KOR", "PRK", "VNM", "SGP"],
  mixed: ["CIV", "TGO", "BEN", "MOZ", "GNB"],
};
window.RELIGION_FAMILY = { catholic: "christian", protestant: "christian", orthodox: "christian", sunni: "muslim", shia: "muslim" };

// Democracies (free elections and civil liberties, roughly the EIU's full and flawed democracies).
window.DEMOCRACIES = new Set(["USA", "CAN", "GBR", "IRL", "FRA", "DEU", "ITA", "ESP", "PRT", "NLD", "BEL", "LUX", "CHE", "AUT", "DNK", "NOR", "SWE", "FIN", "ISL",
  "EST", "LVA", "LTU", "POL", "CZE", "SVK", "SVN", "HRV", "HUN", "ROU", "BGR", "GRC", "CYP", "MLT", "ALB", "MKD", "MNE", "SRB", "MDA", "ISR", "IND", "JPN", "KOR",
  "TWN", "AUS", "NZL", "IDN", "MYS", "PHL", "TLS", "MNG", "LKA", "BRA", "ARG", "CHL", "URY", "COL", "CRI", "PAN", "DOM", "JAM", "TTO", "SUR", "GUY", "ZAF",
  "BWA", "NAM", "GHA", "CPV", "MUS", "PRY", "THA"]);

// History between occupier and occupied: [occupier(s), occupied, change, why]. "*" in the
// occupied slot is filled from a list. Both directions are listed where both hold.
const ARAB = ["SAU", "ARE", "KWT", "QAT", "BHR", "OMN", "YEM", "IRQ", "SYR", "JOR", "LBN", "PSE", "EGY", "LBY", "TUN", "DZA", "MAR", "MRT", "SDN"];
window.OCCUPATION_HISTORY = [
  ["RUS", "UKR", -45, "Russia's invasion and occupation since 2014"], ["UKR", "RUS", -30, "Years of war with Ukraine"],
  ["RUS", ["POL", "EST", "LVA", "LTU"], -30, "Soviet occupation and deportations"], ["RUS", "GEO", -30, "The 2008 war and occupied Abkhazia and South Ossetia"],
  ["RUS", "FIN", -20, "The Winter War"], ["RUS", "CZE", -15, "The 1968 invasion"], ["RUS", "HUN", -10, "The 1956 invasion"], ["RUS", "MDA", -15, "Russian troops in Transnistria"],
  ["RUS", "BLR", 10, "Close Russian-speaking ties"], ["RUS", ["KAZ", "KGZ", "TJK", "ARM"], 0, "Old Soviet ties"],
  ["JPN", ["CHN", "TWN"], -35, "Japanese invasion and wartime atrocities"], ["JPN", ["KOR", "PRK"], -35, "Japan's 1910–45 colonial rule"], ["JPN", ["PHL", "IDN", "MYS", "SGP"], -10, "Japanese wartime occupation"],
  ["CHN", "TWN", -25, "Most Taiwanese reject unification with the People's Republic"], ["CHN", "VNM", -25, "The 1979 war and the South China Sea"], ["CHN", "IND", -30, "Border wars from 1962 to Galwan in 2020"],
  ["CHN", "JPN", -30, "Deep historic enmity"], ["CHN", "PHL", -20, "Clashes in the South China Sea"], ["CHN", ["KOR", "MNG"], -10, "Fear of Chinese dominance"],
  ["IND", "PAK", -45, "Partition, three wars and Kashmir"], ["PAK", "IND", -45, "Partition, three wars and Kashmir"], ["IND", "CHN", -25, "Border wars"], ["PAK", "BGD", -35, "The 1971 war and genocide"],
  ["ISR", "PSE", -60, "Decades of occupation and the Gaza war"], ["ISR", ARAB.filter(x => x !== "PSE"), -35, "Arab–Israeli wars and Palestine"], ["ISR", "IRN", -40, "Open war between Israel and Iran"],
  [ARAB, "ISR", -45, "Arab–Israeli wars"], ["IRN", "ISR", -50, "Iran's leaders call for Israel's destruction"],
  ["TUR", "ARM", -50, "The 1915 Armenian genocide"], ["TUR", ["GRC", "CYP"], -35, "The 1974 invasion of Cyprus and Aegean disputes"], ["TUR", ["SYR", "IRQ"], -15, "Turkish operations against the Kurds"],
  ["ARM", "TUR", -35, "The genocide and a closed border"], ["AZE", "ARM", -50, "Wars over Nagorno-Karabakh"], ["ARM", "AZE", -50, "Wars over Nagorno-Karabakh"], ["TUR", "AZE", 20, "'One nation, two states'"],
  ["SAU", "IRN", -35, "Sunni–Shia rivalry for the Gulf"], ["IRN", ["SAU", "ARE", "BHR"], -30, "Sunni–Shia rivalry for the Gulf"], ["SAU", "YEM", -40, "The Saudi-led bombing of Yemen"], ["ARE", "YEM", -25, "The war in Yemen"],
  ["IRQ", "IRN", -30, "The 1980–88 war"], ["IRN", "IRQ", -10, "The 1980–88 war, though Iran backs Iraq's Shia parties"], ["IRQ", "KWT", -45, "Saddam's 1990 invasion"], ["SAU", "QAT", -15, "The 2017–21 blockade"],
  ["USA", ["IRQ", "AFG"], -25, "US wars and occupation"], ["USA", "IRN", -40, "The 1953 coup, decades of sanctions and US strikes"], ["USA", ["CUB", "VEN", "NIC"], -25, "Decades of US hostility"],
  ["USA", "MEX", -15, "The 1846–48 war and border politics"], ["USA", "VNM", -10, "The Vietnam War"], ["USA", ["PAN", "GRD"], -5, "US invasions in the 1980s"], ["USA", ["PRK"], -40, "The Korean War"],
  ["GBR", "IRL", -30, "Centuries of British rule"], ["GBR", "ARG", -35, "The Falklands"], ["GBR", ["IND", "PAK", "KEN", "ZWE", "IRQ", "EGY"], -10, "British colonial rule"],
  ["FRA", "DZA", -30, "The 1954–62 war of independence"], ["FRA", ["MLI", "BFA", "NER"], -25, "Expelled French forces in 2022–23"], ["FRA", ["VNM", "MDG", "CMR"], -10, "French colonial wars"],
  ["DEU", ["POL", "CZE", "GRC"], -10, "Nazi occupation"], ["DEU", "ISR", -20, "The Holocaust"], ["DEU", "AUT", 10, "Shared language"], ["AUT", "DEU", 10, "Shared language"],
  ["SRB", ["HRV", "BIH"], -30, "The wars of the 1990s"], ["HRV", "SRB", -25, "The wars of the 1990s"], ["SRB", "MNE", 10, "Close Serbian ties"], ["SRB", "ALB", -25, "Kosovo"], ["ALB", "SRB", -25, "Kosovo"],
  ["GRC", "CYP", 30, "Greek Cypriots long sought union with Greece"], ["ROU", "MDA", 20, "Shared language; many Moldovans hold Romanian passports"],
  ["ETH", "ERI", -40, "Thirty years of war for independence"], ["ERI", "ETH", -35, "The 1998–2000 war"], ["ETH", "SOM", -20, "Ethiopian interventions"], ["EGY", "ETH", -15, "The Nile dam dispute"], ["ETH", "EGY", -15, "The Nile dam dispute"],
  ["RWA", "COD", -35, "Rwanda-backed rebels in eastern Congo"], ["COD", "RWA", -30, "Hostility since the 1990s"], ["MAR", "DZA", -25, "The Western Sahara dispute"], ["DZA", "MAR", -25, "The Western Sahara dispute"],
  ["VEN", "GUY", -30, "Venezuela's claim to two-thirds of Guyana"], ["CHL", ["BOL", "PER"], -20, "The War of the Pacific"], ["BOL", "CHL", -15, "Lost access to the sea"],
  ["PRK", "KOR", -50, "The Korean War and the North's dictatorship"], ["KOR", "PRK", -15, "Indoctrinated to fear the South, though one people"],
  ["THA", "KHM", -20, "Border clashes, last in 2025"], ["KHM", "THA", -20, "Border clashes, last in 2025"], ["VNM", "KHM", -15, "The 1978–89 occupation"], ["IDN", "TLS", -40, "The 1975–99 occupation"],
  ["AFG", "PAK", -20, "Border clashes and the Durand Line"], ["PAK", "AFG", -20, "Border clashes and refugee expulsions"], ["SDN", "SSD", -30, "Decades of civil war"], ["SSD", "SDN", -20, "Decades of civil war"],
  ["CHN", "PRK", 5, "Its only treaty ally"], ["USA", ["CAN", "AUS", "NZL", "GBR"], 5, "Close friends and kin"], ["GBR", ["CAN", "AUS", "NZL"], 5, "The Commonwealth crown"],
];
// Lookup: HIST[occupier][occupied] = [change, why].
window.OCCUPATION_HIST = {};
window.OCCUPATION_HISTORY.forEach(([a, b, v, why]) => [].concat(a).forEach(x => [].concat(b).forEach(y => {
  if (x !== y) (window.OCCUPATION_HIST[x] = window.OCCUPATION_HIST[x] || {})[y] = [v, why];
})));
window.CULTURE_OF = {}; Object.entries(window.CULTURE_GROUPS).forEach(([g, l]) => l.forEach(i => (window.CULTURE_OF[i] = g)));
window.RELIGION_OF = {}; Object.entries(window.RELIGION_GROUPS).forEach(([g, l]) => l.forEach(i => (window.RELIGION_OF[i] = g)));
