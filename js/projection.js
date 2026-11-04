// Power projection: how far from its nearest staging point (home, conquered land, allies, treaty
// partners that grant basing, or its own bases abroad) a country can land and supply an invasion
// force across the sea or by air. Beyond this, it can't: China can't simply sail an army to Canada.
// Set by real expeditionary assets: amphibious ships, sealift, heavy transports, tankers, carriers
// and overseas bases. Countries not listed: 400 km + 250 km per point of logistics (0–10).
window.REACH_KM = {
  USA: [16000, "11 carriers, 31 amphibious ships, about 270 C-17s and C-5s, 450 tankers and about 750 bases abroad"],
  GBR: [9000, "Two carriers, amphibious ships, A400Ms and C-17s, and bases from Cyprus to the Falklands and Diego Garcia"],
  FRA: [9000, "A carrier, three amphibious assault ships and bases in Africa, the Gulf, the Indian Ocean and the Pacific"],
  RUS: [3500, "A handful of large landing ships and An-124s; its one carrier is out of service"],
  CHN: [3500, "The world's largest navy and growing amphibious fleet, but only one base abroad (Djibouti) and few tankers"],
  IND: [2500, "Two carriers, one amphibious dock ship and C-17s"],
  JPN: [2000, "Helicopter carriers and an amphibious brigade, built for its own islands"],
  AUS: [4500, "Two amphibious assault ships, C-17s and long experience of expeditionary war"],
  ITA: [3000, "Two carriers and amphibious ships"], ESP: [3000, "A carrier and amphibious ships"],
  TUR: [2500, "An amphibious assault ship and bases in Qatar, Somalia, Libya and northern Cyprus"],
  CAN: [3000, "C-17s and tankers, but no amphibious ships"], NLD: [2500, "Amphibious dock ships with the Marine Corps"],
  DEU: [2000, "A400Ms but no amphibious ships"], KOR: [1500, "Two amphibious assault ships and a marine corps"],
  BRA: [2000, "A helicopter carrier and amphibious ships"], EGY: [1500, "Two Mistral amphibious ships"],
  SAU: [1500, "Large transport fleet and tankers"], ARE: [2500, "C-17s, tankers and bases in Eritrea, Somaliland and Libya"],
  ISR: [2000, "Tankers and long-range strike, but no amphibious ships"], IRN: [1500, "Proxies abroad but little sealift"],
  PAK: [1200, "Little sealift"], TWN: [500, "Built only to defend its island"], PRK: [800, "Hovercraft and small landing craft"],
};
