// Weather and seasons. Every country has a climate; each day's weather there follows its season
// (Russia's winter and spring and autumn mud, the South Asian monsoon, Pacific typhoons, Gulf
// summer heat and shamal sandstorms, Atlantic storms). The weather is set by the date and the
// place, not rolled in battle: the same day always has the same weather, so it can be forecast a
// week ahead and planned around. Southern-hemisphere seasons are six months apart.
// Weather cuts what each kind of unit can do (helicopters and jets in a storm, tanks in mud,
// infantry in deep cold), and each country suffers it differently: forces used to a climate from
// home or trained for it (Finland's ski troops, Israel's desert armour, Vietnam's jungle infantry)
// lose far less than strangers to it, and modern all-weather aircraft and blue-water navies keep
// fighting when old ones can't.

window.CLIMATE_ZONES = {
  boreal: { label: "Boreal (long, snowy winters)", temp: [-12, -11, -5, 3, 11, 16, 18, 16, 10, 3, -4, -10] },
  continental: { label: "Continental (cold winters, mud seasons)", temp: [-5, -4, 1, 9, 15, 19, 21, 20, 15, 9, 2, -3] },
  oceanic: { label: "Oceanic (mild, wet, stormy winters)", temp: [5, 5, 7, 9, 12, 15, 17, 17, 15, 12, 8, 6] },
  mediterranean: { label: "Mediterranean (hot dry summers, wet winters)", temp: [10, 11, 13, 16, 20, 25, 28, 28, 24, 19, 14, 11] },
  desert: { label: "Desert (extreme heat, sandstorms)", temp: [16, 18, 22, 27, 32, 35, 36, 36, 33, 28, 22, 17] },
  monsoon: { label: "Monsoon (hot spring, torrential summer rains)", temp: [19, 22, 26, 30, 32, 31, 29, 29, 29, 27, 23, 20] },
  tropical: { label: "Tropical rainforest (rain all year)", temp: [27, 27, 28, 28, 28, 27, 27, 27, 27, 27, 27, 27] },
  savanna: { label: "Savanna and Sahel (wet season, dusty dry season)", temp: [26, 28, 31, 33, 32, 29, 27, 27, 28, 29, 28, 26] },
  tropicalHighland: { label: "Tropical highlands (mild, rainy season)", temp: [16, 17, 18, 18, 17, 16, 15, 15, 16, 16, 16, 16] },
  highland: { label: "Mountains (snowbound winters)", temp: [-3, -1, 4, 10, 14, 18, 21, 20, 16, 10, 4, -1] },
  eastasia: { label: "East Asian (cold dry winters, rainy summers)", temp: [-1, 2, 8, 15, 21, 25, 28, 28, 23, 16, 8, 1] },
  subtropical: { label: "Humid subtropical (hot wet summers)", temp: [9, 11, 15, 19, 23, 27, 28, 28, 25, 20, 15, 10] },
};
window.CLIMATE_OF = {};
Object.entries({
  boreal: ["RUS", "CAN", "FIN", "SWE", "NOR", "EST", "LVA", "MNG", "ISL"],
  continental: ["UKR", "BLR", "POL", "LTU", "MDA", "ROU", "HUN", "SVK", "CZE", "DEU", "SRB", "BGR", "KAZ", "USA", "BIH", "SVN"],
  oceanic: ["GBR", "IRL", "FRA", "BEL", "NLD", "LUX", "DNK", "NZL", "MCO"],
  mediterranean: ["ESP", "PRT", "ITA", "GRC", "CYP", "MLT", "HRV", "ALB", "MNE", "MKD", "TUR", "LBN", "ISR", "PSE", "SYR", "TUN", "MAR", "CHL", "SMR", "VAT"],
  desert: ["SAU", "ARE", "KWT", "QAT", "BHR", "OMN", "YEM", "IRQ", "JOR", "EGY", "LBY", "DZA", "MRT", "TKM", "UZB", "PAK", "IRN", "AUS", "NAM", "DJI", "ERI", "SOM", "NER", "TCD", "SDN", "MLI"],
  monsoon: ["IND", "BGD", "MMR", "THA", "LAO", "KHM", "VNM", "LKA", "MDV"],
  tropical: ["IDN", "MYS", "SGP", "BRN", "PHL", "PNG", "SLB", "COD", "COG", "GAB", "CMR", "GNQ", "STP", "GHA", "CIV", "LBR", "SLE", "GIN", "BRA", "COL", "VEN", "ECU", "PAN", "CRI", "NIC",
    "HND", "GTM", "SLV", "BLZ", "CUB", "DOM", "HTI", "JAM", "BHS", "TTO", "BRB", "GRD", "LCA", "VCT", "ATG", "KNA", "DMA", "GUY", "SUR", "MDG", "UGA", "SYC", "COM", "MUS",
    "FJI", "VUT", "WSM", "TON", "KIR", "TUV", "NRU", "FSM", "MHL", "PLW", "TLS"],
  savanna: ["SEN", "GMB", "GNB", "BFA", "NGA", "BEN", "TGO", "CAF", "SSD", "ZMB", "ZWE", "MWI", "MOZ", "AGO", "KEN", "TZA", "BWA", "CPV"],
  highland: ["AFG", "NPL", "BTN", "TJK", "KGZ", "ARM", "GEO", "AZE", "CHE", "AUT", "AND", "LIE"],
  tropicalHighland: ["BOL", "PER", "ETH", "RWA", "BDI"],
  eastasia: ["CHN", "KOR", "PRK", "JPN"],
  subtropical: ["TWN", "URY", "ARG", "PRY", "ZAF", "LSO", "SWZ", "MEX"],
}).forEach(([z, l]) => l.forEach(i => (window.CLIMATE_OF[i] = z)));
window.SOUTHERN = new Set(["AUS", "NZL", "ARG", "CHL", "URY", "PRY", "ZAF", "NAM", "BWA", "ZWE", "ZMB", "MOZ", "MWI", "AGO", "MDG", "LSO", "SWZ", "BOL", "PER", "BRA", "TZA", "COM", "MUS", "FJI", "VUT", "WSM", "TON", "SLB", "PNG", "IDN", "TLS"]);

// Tropical cyclone basins and their months (0 = January), with the season's daily chance.
window.CYCLONE_BASINS = [
  { name: "typhoon", months: [6, 7, 8, 9], p: 0.07, isos: ["JPN", "TWN", "PHL", "CHN", "VNM", "KOR", "FSM", "MHL", "PLW"] },
  { name: "hurricane", months: [7, 8, 9], p: 0.06, isos: ["USA", "CUB", "MEX", "DOM", "HTI", "JAM", "BHS", "BLZ", "HND", "NIC", "ATG", "BRB", "DMA", "GRD", "KNA", "LCA", "VCT", "TTO"] },
  { name: "cyclone", months: [4, 9, 10], p: 0.05, isos: ["IND", "BGD", "MMR", "LKA", "OMN", "YEM"] },
  { name: "cyclone", months: [0, 1, 2], p: 0.06, isos: ["MDG", "MOZ", "MUS", "AUS", "FJI", "VUT", "TON", "WSM", "SLB", "COM"] },
];

// Each zone's weather by month (northern months; 0 = January): [[type, daily share], ...]. The rest is clear.
const M = (months, list) => ({ months, list });
window.CLIMATE_WEATHER = {
  boreal: [M([11, 0, 1, 2], [["snow", 0.35], ["blizzard", 0.12], ["fog", 0.05]]), M([3, 4], [["mud", 0.45], ["rain", 0.15], ["snow", 0.1]]), M([5, 6, 7, 8], [["rain", 0.3], ["storm", 0.05]]), M([9, 10], [["mud", 0.3], ["rain", 0.2], ["snow", 0.15]])],
  continental: [M([11, 0, 1], [["snow", 0.3], ["blizzard", 0.06], ["fog", 0.1]]), M([2, 3], [["mud", 0.45], ["rain", 0.2]]), M([4, 5, 8], [["rain", 0.25], ["storm", 0.07]]), M([6, 7], [["rain", 0.2], ["storm", 0.08], ["heat", 0.1]]), M([9, 10], [["mud", 0.35], ["rain", 0.2], ["fog", 0.1]])],
  oceanic: [M([9, 10, 11, 0, 1, 2], [["rain", 0.4], ["storm", 0.12], ["fog", 0.12], ["snow", 0.04]]), M([3, 4, 5, 6, 7, 8], [["rain", 0.35], ["fog", 0.08]])],
  mediterranean: [M([5, 6, 7, 8], [["heat", 0.3]]), M([9, 10, 11, 0, 1, 2], [["rain", 0.35], ["storm", 0.08]]), M([3, 4], [["rain", 0.15]])],
  desert: [M([3, 4, 5, 6], [["heat", 0.5], ["sandstorm", 0.2]]), M([7, 8, 9], [["heat", 0.6], ["sandstorm", 0.08]]), M([10, 11, 0, 1, 2], [["sandstorm", 0.08], ["rain", 0.06]])],
  monsoon: [M([5, 6, 7, 8], [["monsoon", 0.6], ["storm", 0.1]]), M([9, 10], [["rain", 0.2]]), M([11, 0, 1], [["fog", 0.15]]), M([2, 3, 4], [["heat", 0.5], ["storm", 0.05]])],
  tropical: [M([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [["rain", 0.45], ["storm", 0.15], ["heat", 0.1]])],
  savanna: [M([5, 6, 7, 8], [["rain", 0.4], ["mud", 0.2], ["storm", 0.1]]), M([11, 0, 1], [["sandstorm", 0.2], ["heat", 0.2]]), M([2, 3, 4], [["heat", 0.45]]), M([9, 10], [["heat", 0.25], ["rain", 0.1]])],
  tropicalHighland: [M([5, 6, 7, 8], [["rain", 0.45], ["storm", 0.1], ["mud", 0.1]]), M([9, 10, 11, 0, 1, 2, 3, 4], [["fog", 0.1], ["rain", 0.1]])],
  highland: [M([10, 11, 0, 1, 2], [["snow", 0.35], ["blizzard", 0.1], ["fog", 0.1]]), M([3, 4], [["mud", 0.2], ["rain", 0.2], ["snow", 0.1]]), M([5, 6, 7, 8, 9], [["storm", 0.12], ["rain", 0.2]])],
  eastasia: [M([11, 0, 1], [["snow", 0.15], ["fog", 0.1]]), M([2, 3, 4], [["rain", 0.2], ["sandstorm", 0.08]]), M([5, 6], [["rain", 0.45], ["storm", 0.05]]), M([7, 8], [["heat", 0.15], ["rain", 0.25]]), M([9, 10], [["rain", 0.1], ["fog", 0.05]])],
  subtropical: [M([5, 6, 7, 8], [["rain", 0.3], ["storm", 0.12], ["heat", 0.2]]), M([9, 10, 11, 0, 1, 2, 3, 4], [["rain", 0.25], ["fog", 0.08]])],
};

// Weather types: label, icon, and how much each kind of unit loses in it (before adaptation).
// Classes: veh = tanks, armoured vehicles, artillery; inf = troops; air = jets and other aircraft;
// heli = helicopters; sea = surface ships and carriers; sub = submarines.
window.WEATHER_TYPES = {
  clear: { label: "Clear", icon: "☀️", cat: null, pen: {} },
  frost: { label: "Freezing cold", icon: "🥶", cat: "cold", pen: { veh: 0.12, inf: 0.25, air: 0.05, heli: 0.12, sea: 0.05 } },
  rain: { label: "Rain", icon: "🌧️", cat: "wet", pen: { veh: 0.1, inf: 0.05, air: 0.15, heli: 0.2, sea: 0.05 } },
  storm: { label: "Storms", icon: "⛈️", cat: "wet", pen: { veh: 0.15, inf: 0.1, air: 0.4, heli: 0.6, sea: 0.35, sub: 0.05 } },
  fog: { label: "Fog", icon: "🌫️", cat: "fog", pen: { veh: 0.05, inf: 0.03, air: 0.35, heli: 0.4, sea: 0.1 } },
  snow: { label: "Snow", icon: "🌨️", cat: "cold", pen: { veh: 0.2, inf: 0.15, air: 0.3, heli: 0.4, sea: 0.1 } },
  blizzard: { label: "Blizzard", icon: "❄️", cat: "cold", pen: { veh: 0.45, inf: 0.35, air: 0.7, heli: 0.85, sea: 0.3, sub: 0.05 } },
  mud: { label: "Mud season", icon: "🟫", cat: "mud", pen: { veh: 0.45, inf: 0.15, air: 0.1, heli: 0.05 } },
  heat: { label: "Extreme heat", icon: "🔥", cat: "heat", pen: { veh: 0.1, inf: 0.25, air: 0.1, heli: 0.15 } },
  sandstorm: { label: "Sandstorm", icon: "🌪️", cat: "heat", pen: { veh: 0.35, inf: 0.3, air: 0.6, heli: 0.8, sea: 0.05 } },
  monsoon: { label: "Monsoon rains", icon: "🌊", cat: "wet", pen: { veh: 0.4, inf: 0.2, air: 0.45, heli: 0.6, sea: 0.2 } },
  cyclone: { label: "Typhoon / hurricane", icon: "🌀", cat: "wet", pen: { veh: 0.3, inf: 0.3, air: 0.8, heli: 0.9, sea: 0.7, sub: 0.15 } },
};
window.WEATHER_CLASS = { troops: "inf", tanks: "veh", afv: "veh", arty: "veh", fighters: "air", aircraft: "air", helis: "heli", ships: "sea", carriers: "sea", subs: "sub" };

// How well forces from each climate cope with each kind of weather (0–1 of the loss avoided).
window.ZONE_ADAPT = {
  boreal: { cold: 0.75, mud: 0.6, heat: 0.1, wet: 0.4, fog: 0.4 }, continental: { cold: 0.55, mud: 0.6, heat: 0.3, wet: 0.4, fog: 0.4 },
  oceanic: { cold: 0.25, mud: 0.35, heat: 0.15, wet: 0.55, fog: 0.5 }, mediterranean: { cold: 0.15, mud: 0.25, heat: 0.45, wet: 0.3, fog: 0.2 },
  desert: { cold: 0.1, mud: 0.1, heat: 0.75, wet: 0.1, fog: 0.1 }, monsoon: { cold: 0.05, mud: 0.55, heat: 0.6, wet: 0.7, fog: 0.4 },
  tropical: { cold: 0, mud: 0.5, heat: 0.55, wet: 0.7, fog: 0.3 }, savanna: { cold: 0.05, mud: 0.4, heat: 0.65, wet: 0.45, fog: 0.2 },
  highland: { cold: 0.6, mud: 0.45, heat: 0.2, wet: 0.35, fog: 0.4 }, tropicalHighland: { cold: 0.35, mud: 0.45, heat: 0.4, wet: 0.5, fog: 0.4 }, eastasia: { cold: 0.45, mud: 0.4, heat: 0.35, wet: 0.45, fog: 0.35 },
  subtropical: { cold: 0.2, mud: 0.35, heat: 0.45, wet: 0.5, fog: 0.3 },
};
// Forces trained and equipped beyond their home climate: [adaptation floors, why].
window.WEATHER_TRAINING = {
  USA: [{ cold: 0.6, mud: 0.55, heat: 0.65, wet: 0.6, fog: 0.55 }, "Trains and equips for every climate, from Alaska to the desert and the jungle"],
  FIN: [{ cold: 0.92, mud: 0.7 }, "Ski troops and a winter-war doctrine"], NOR: [{ cold: 0.9 }, "Arctic warfare specialists"], SWE: [{ cold: 0.85 }, "Arctic warfare specialists"],
  CAN: [{ cold: 0.85 }, "Arctic training and kit"], EST: [{ cold: 0.8 }, "Winter warfare training with the Defence League"],
  RUS: [{ cold: 0.8, mud: 0.75 }, "'General Winter' and the mud seasons are Russia's oldest allies"], UKR: [{ cold: 0.65, mud: 0.75 }, "Years of fighting through winters and mud seasons"],
  GBR: [{ cold: 0.55, heat: 0.55, wet: 0.6 }, "Royal Marines train in Norway; long desert and jungle experience"], FRA: [{ heat: 0.65, wet: 0.5 }, "A decade of Sahel desert operations"],
  ISR: [{ heat: 0.85 }, "Armour and infantry built for desert war"], SAU: [{ heat: 0.75 }, "Desert forces"], ARE: [{ heat: 0.75 }, "Desert forces"], EGY: [{ heat: 0.75 }, "Desert forces"],
  IND: [{ cold: 0.65, heat: 0.7, wet: 0.7 }, "Holds the Siachen glacier and fights in the monsoon and desert"], PAK: [{ cold: 0.6, heat: 0.7 }, "Mountain and desert warfare in Kashmir and Balochistan"],
  CHN: [{ cold: 0.55, heat: 0.45, wet: 0.5 }, "Mountain brigades on the Tibetan plateau and border"], KOR: [{ cold: 0.6 }, "Trains for bitter Korean winters"], PRK: [{ cold: 0.6 }, "Trains for bitter Korean winters"],
  VNM: [{ wet: 0.85, mud: 0.7 }, "Jungle and monsoon warfare"], AUS: [{ heat: 0.75, wet: 0.6 }, "Outback and tropical training"], IRN: [{ heat: 0.75, cold: 0.45 }, "Desert and mountain forces"],
  TUR: [{ cold: 0.5, heat: 0.55 }, "Mountain warfare against the PKK"], AFG: [{ cold: 0.7 }, "Mountain fighters"], NPL: [{ cold: 0.75 }, "Gurkha mountain troops"], CHE: [{ cold: 0.75 }, "Alpine troops"], AUT: [{ cold: 0.7 }, "Alpine troops"],
};

// Deterministic noise in [0, 1): temperature drifts smoothly; weather fronts hold for three days.
const hash = (a, b) => { let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0) / 4294967296; };
const isoNum = iso => iso.charCodeAt(0) * 9973 + iso.charCodeAt(1) * 131 + iso.charCodeAt(2);
const smooth = (seed, d, per) => { const k = Math.floor(d / per), f = d / per - k, t = f * f * (3 - 2 * f); return hash(seed, k) * (1 - t) + hash(seed, k + 1) * t; };
// A weather front holds for `per` days (offset per country so fronts don't all change together).
const front = (seed, d, per) => hash(seed, Math.floor((d + (seed % per)) / per));

// Day of year (0–364) → month and its fraction.
const monthOf = doy => { const m = Math.min(11, Math.floor(doy / 30.42)); return { m, f: doy / 30.42 - m }; };

// The weather in a country on an absolute day (days since 1 January of year 0 of the calendar).
const wxCache = {};
window.weatherAt = (iso, absDay, doyArg) => {
  const ck = iso + absDay;
  if (wxCache[ck]) return wxCache[ck];
  const zone = window.CLIMATE_OF[iso] || "subtropical", Z = window.CLIMATE_ZONES[zone], south = window.SOUTHERN.has(iso);
  const doy = doyArg != null ? doyArg : ((absDay % 365) + 365) % 365, { m: am, f } = monthOf(doy), m = south ? (am + 6) % 12 : am;
  const T = Z.temp, base = T[m] * (1 - f) + T[(m + 1) % 12] * f, seed = isoNum(iso);
  const temp = Math.round(base + (smooth(seed + 7, absDay, 4) - 0.5) * 12);
  const n = front(seed, absDay, 3);
  let type = "clear", acc = 0;
  const basin = window.CYCLONE_BASINS.find(b => b.isos.includes(iso) && b.months.includes(am));
  const list = (basin ? [[basin.name === "typhoon" || basin.name === "hurricane" || basin.name === "cyclone" ? "cyclone" : "storm", basin.p]] : [])
    .concat(((window.CLIMATE_WEATHER[zone] || []).find(x => x.months.includes(m)) || { list: [] }).list);
  for (const [t, p] of list) { acc += p; if (n < acc) { type = t; break; } }
  if ((type === "snow" || type === "blizzard") && temp > 2) type = type === "snow" ? "rain" : "storm";
  if (type === "rain" && temp <= -1) type = "snow";
  if (type === "clear" && temp <= -5) type = "frost";
  if (type === "clear" && temp >= 40) type = "heat";
  const season = south ? ["Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter", "Winter", "Winter", "Spring", "Spring", "Spring", "Summer"][am] : ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"][am];
  const W = { type, temp, zone, season, cyclone: basin ? basin.name : null, ...window.WEATHER_TYPES[type] };
  // Cold bites harder the colder it gets: deep cold's losses are full at −20°C, a third at −5°C.
  if (type === "frost") { const k = Math.min(1.3, (-temp) / 15); W.pen = Object.fromEntries(Object.entries(W.pen).map(([c, v]) => [c, v * k])); W.label = temp <= -20 ? "Bitter cold" : "Freezing cold"; }
  return (wxCache[ck] = W);
};
// How well a country's forces cope with a kind of weather (0–1).
window.weatherAdapt = (iso, cat) => {
  const z = window.ZONE_ADAPT[window.CLIMATE_OF[iso] || "subtropical"] || {}, t = window.WEATHER_TRAINING[iso];
  return Math.max(z[cat] || 0, (t && t[0][cat]) || 0);
};
