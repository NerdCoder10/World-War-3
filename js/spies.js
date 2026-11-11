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
