// Military philosophy: each nation fights, and supplies its forces, the way its doctrine teaches.
//
// fight:
//   atk / def   multipliers by unit kind when attacking / defending (troops, tanks, afv, arty,
//               fighters, aircraft, helis, ships, subs, carriers)
//   home        defending its own territory (fortress, total defence, people's war)
//   abroad      fighting outside its own lands
//   early       shock of the opening: multiplier for the first `earlyDays` of a war, after which it
//               fades to `late` (short-war doctrines tire in long wars)
//   combined    bonus when a force mixes arms (at least two of ground, air and naval, each ≥15%)
//   missile     share of its missile stocks fired a day (×4% base)
//   drone       its drone edge (×)
//   resist      how hard its people resist an occupier (unrest ×)
//   commit      how much of its army the AI commits to an attack (×)
//   defensive   the AI never starts wars of choice (resource wars)
// supply: how it feeds a war away from home (js/game.js supply):
//   expeditionary  sealift, airlift and pre-positioned stocks: little penalty at sea or far away,
//                  none for its first 10 days at war
//   rail           excellent near its railheads (≤800 km overland), poor beyond them and by sea
//   joint          a joint logistic support force: strong within 1,500 km, weaker beyond
//   interior       short interior lines: very strong within 500 km, weak beyond
//   alliance       host-nation support: strong when fighting next to its allies
//   depots         dispersed territorial depots: built for home, poor abroad
//   light          light, irregular forces that live off the land: modest needs, poor reach
//   contractor     bought logistics run by contractors: adequate near, fragile far
window.DOCTRINES = {
  joint: { name: "Joint all-domain combined arms", note: "Air superiority first, then precision strike and manoeuvre by combined arms; the world's deepest expeditionary logistics (sealift, airlift, tankers, pre-positioned stocks).",
    supply: "expeditionary", fight: { atk: { fighters: 1.2, aircraft: 1.15, helis: 1.1, carriers: 1.1 }, def: {}, combined: 0.08, missile: 1.0, commit: 1.0 } },
  expeditionary: { name: "Expeditionary quality force", note: "Small, highly trained forces built to deploy abroad with allies; quality and mission command over mass.",
    supply: "expeditionary", fight: { atk: { fighters: 1.1, troops: 1.05 }, def: {}, combined: 0.06, commit: 0.9 } },
  nato: { name: "NATO mission command", note: "Mission command and interoperable combined arms, fought alongside allies and fed by host-nation support.",
    supply: "alliance", fight: { atk: { fighters: 1.05 }, def: { arty: 1.05 }, combined: 0.05, commit: 0.85, defensive: true } },
  fires: { name: "Russian deep battle and mass fires", note: "Artillery is the god of war: massed fires, echeloned armour and the will to absorb losses; supplied by rail, which serves it well near home and badly beyond its railheads.",
    supply: "rail", fight: { atk: { arty: 1.25, tanks: 1.05, troops: 0.95 }, def: { arty: 1.2 }, home: 1.1, missile: 1.2, commit: 1.3 } },
  systems: { name: "PLA systems-destruction warfare", note: "Paralyse the enemy's command, sensors and bases with missile salvos and cyber at the outset, then fight a short, sharp, informatised war near China; anti-access at sea.",
    supply: "joint", fight: { atk: { ships: 1.05, subs: 1.05 }, def: { ships: 1.2, subs: 1.2, fighters: 1.1 }, early: 1.12, earlyDays: 7, missile: 1.4, drone: 1.1, commit: 1.1 } },
  preemptive: { name: "Pre-emption and decisive short war", note: "Strike first, carry the war into enemy territory and end it fast, led by air power and a mobilised reserve; supplied over short interior lines.",
    supply: "interior", fight: { atk: { fighters: 1.25, aircraft: 1.15, tanks: 1.05 }, def: { fighters: 1.1 }, early: 1.25, earlyDays: 10, late: 0.92, combined: 0.06, drone: 1.2, commit: 1.1 } },
  mosaic: { name: "Asymmetric mosaic defence", note: "Missiles, drones, proxies and a decentralised mosaic defence that trades space for time; light forces that need little supply but reach poorly.",
    supply: "light", fight: { atk: { tanks: 0.85, afv: 0.9, ships: 0.9 }, def: { troops: 1.15 }, home: 1.15, missile: 1.5, drone: 1.3, resist: 1.3, commit: 0.8 } },
  fortress: { name: "Fortress state and mass artillery", note: "Thousands of hardened artillery pieces, tunnels and special-forces infiltration behind a fortified border; poor reach and supply beyond it.",
    supply: "interior", fight: { atk: { arty: 1.15, troops: 1.05 }, def: { arty: 1.3, troops: 1.1 }, home: 1.25, abroad: 0.9, missile: 1.3, resist: 1.3, commit: 1.0 } },
  peoplewar: { name: "People's war", note: "Every citizen a soldier: dispersed militia, guerrilla war and local depots that make the country nearly impossible to hold; little ability to fight abroad.",
    supply: "depots", fight: { atk: { tanks: 0.9 }, def: { troops: 1.2, arty: 1.05 }, home: 1.3, abroad: 0.85, resist: 1.5, commit: 0.8, defensive: true } },
  total: { name: "Total defence", note: "A whole-of-society territorial defence: a large trained reserve, dispersed depots and forces built to fight on home ground, not abroad.",
    supply: "depots", fight: { def: { arty: 1.1, troops: 1.1 }, home: 1.2, abroad: 0.85, resist: 1.3, commit: 0.7, defensive: true } },
  porcupine: { name: "Porcupine defence", note: "Make the island too costly to take: mobile anti-ship missiles, drones and dispersed defenders over a short coastline.",
    supply: "interior", fight: { def: { ships: 1.2, troops: 1.1, arty: 1.1 }, home: 1.2, abroad: 0.8, drone: 1.2, missile: 1.1, resist: 1.3, commit: 0.6, defensive: true } },
  dronecommand: { name: "Drone-enabled mission command", note: "Small, decentralised units with drones over every metre of the front, hard-won combat experience and Western-supplied precision fires.",
    supply: "alliance", fight: { atk: { arty: 1.1 }, def: { arty: 1.15, troops: 1.1 }, home: 1.1, drone: 1.4, resist: 1.3, commit: 0.9 } },
  dronecombined: { name: "Drone-led combined arms", note: "Armed drones find and strike ahead of armour and artillery; a doctrine proven in Syria, Libya and Nagorno-Karabakh.",
    supply: "contractor", fight: { atk: { tanks: 1.05, arty: 1.05 }, def: {}, combined: 0.05, drone: 1.3, commit: 1.05 } },
  coldstart: { name: "Cold Start / proactive operations", note: "Integrated battle groups that strike within days to seize limited ground before the enemy mobilises; strong defence in the mountains; railways feed the front.",
    supply: "rail", fight: { atk: { tanks: 1.05, afv: 1.05 }, def: { troops: 1.1 }, early: 1.1, earlyDays: 7, home: 1.05, commit: 1.0 } },
  offdef: { name: "Offensive defence", note: "Hold the border, counter-attack fast and lean on missiles and nuclear-backed deterrence; built to fight one rival.",
    supply: "interior", fight: { atk: { arty: 1.05 }, def: { arty: 1.1, troops: 1.05 }, home: 1.15, missile: 1.2, commit: 0.9 } },
  killchain: { name: "Kill chain and massive retaliation", note: "Detect and destroy the enemy's missiles before launch, then punish with massive precision fires; a highly mobilised, conscript-heavy force.",
    supply: "interior", fight: { atk: { arty: 1.1 }, def: { arty: 1.1 }, early: 1.1, earlyDays: 5, combined: 0.05, missile: 1.3, commit: 0.9 } },
  exclusive: { name: "Exclusively defence-oriented", note: "Constitutionally defensive: superb sea and air defence of the islands, no capacity or will for wars abroad.",
    supply: "interior", fight: { def: { ships: 1.15, fighters: 1.15, subs: 1.15 }, home: 1.15, abroad: 0.8, commit: 0.5, defensive: true } },
  airpower: { name: "Bought air power", note: "Lavishly equipped air forces and air defences; ground forces less trained; contractor-run logistics that falter far from home.",
    supply: "contractor", fight: { atk: { fighters: 1.15, aircraft: 1.1, troops: 0.85, tanks: 0.9 }, def: { fighters: 1.1 }, commit: 0.9 } },
  mass: { name: "Positional mass defence", note: "Large conscript armies in prepared positions under centralised command; strong in defence, rigid in attack.",
    supply: "rail", fight: { atk: { troops: 0.95 }, def: { troops: 1.1, arty: 1.1 }, home: 1.1, abroad: 0.9, combined: -0.03, commit: 0.9 } },
  light: { name: "Light infantry and irregular war", note: "Light infantry, technicals and militias: mobile and hard to pin down, but short of armour, air power and the trucks to fight far away.",
    supply: "light", fight: { atk: { troops: 1.1, tanks: 0.8, afv: 0.85 }, def: { troops: 1.1 }, home: 1.05, resist: 1.2, commit: 0.9 } },
  internal: { name: "Internal security first", note: "Forces shaped for counter-insurgency, drug wars and disaster relief rather than wars with neighbours.",
    supply: "contractor", fight: { atk: { troops: 0.95 }, def: {}, abroad: 0.85, commit: 0.7, defensive: true } },
  heavy: { name: "Heavy armoured shield", note: "A rapidly expanding heavy army (tanks, howitzers, rocket artillery) built to stop an invasion at the border, with allies behind it.",
    supply: "alliance", fight: { atk: { tanks: 1.1, arty: 1.1 }, def: { tanks: 1.1, arty: 1.15 }, home: 1.1, commit: 0.9 } },
  constabulary: { name: "Constabulary force", note: "A small police-style force or none: defence rests on allies.",
    supply: "light", fight: { atk: {}, def: {}, abroad: 0.8, commit: 0.5, defensive: true } },
  conventional: { name: "Conventional combined arms", note: "A conventional force of infantry, armour, artillery and air power without a distinctive doctrine.",
    supply: "contractor", fight: { atk: {}, def: {}, commit: 0.9 } },
};

// Each nation's doctrine (others by region: NATO members "nato", Africa "light", Latin America
// "internal", the small island states "constabulary", everyone else "conventional").
window.DOCTRINE_OF = {
  USA: "joint", GBR: "expeditionary", FRA: "expeditionary", AUS: "expeditionary",
  RUS: "fires", BLR: "fires", CHN: "systems", ISR: "preemptive", IRN: "mosaic", PRK: "fortress",
  VNM: "peoplewar", CUB: "peoplewar", AFG: "peoplewar", LAO: "peoplewar", DZA: "peoplewar",
  FIN: "total", SWE: "total", CHE: "total", NOR: "total", EST: "total", LVA: "total", LTU: "total", AUT: "total", SGP: "total", IRL: "total",
  TWN: "porcupine", UKR: "dronecommand", TUR: "dronecombined", AZE: "dronecombined",
  IND: "coldstart", PAK: "offdef", KOR: "killchain", JPN: "exclusive", POL: "heavy", GRC: "heavy",
  SAU: "airpower", ARE: "airpower", QAT: "airpower", KWT: "airpower", BHR: "airpower", OMN: "airpower",
  EGY: "mass", SYR: "mass", IRQ: "mass", JOR: "mass", ARM: "mass", KAZ: "fires", UZB: "mass", TKM: "mass", MNG: "mass", MAR: "mass",
  YEM: "light", LBY: "light", SDN: "light", SOM: "light", ETH: "mass", ERI: "fortress", RWA: "light",
  BRA: "conventional", ARG: "conventional", CHL: "conventional", MEX: "internal", COL: "internal", VEN: "peoplewar",
  IDN: "total", MYS: "conventional", THA: "conventional", PHL: "internal", MMR: "mass", BGD: "conventional", LKA: "internal", NPL: "internal",
  ZAF: "conventional", NGA: "light", CAN: "nato", NZL: "expeditionary", SRB: "total", NLD: "nato", DEU: "nato", ITA: "nato", ESP: "nato",
};
window.doctrineOf = iso => {
  let key = window.DOCTRINE_OF[iso];
  if (!key) {
    const c = (window.COUNTRIES || []).find(x => x.iso3 === iso) || {};
    key = (window.ALLIANCES && window.ALLIANCES.NATO || []).includes(iso) ? "nato" : c.region === "Africa" ? "light" : c.region === "South America" || c.region === "North America" ? "internal" : (c.active || 0) < 3 ? "constabulary" : "conventional";
  }
  return { key, ...window.DOCTRINES[key] };
};
// How each supply method changes the strain of a distant war: [near km, near ×, far ×, sea ×, first-10-days ×].
window.SUPPLY_METHODS = {
  expeditionary: { label: "Expeditionary sealift and airlift, pre-positioned stocks", near: 2500, n: 0.8, f: 0.8, sea: 0.5, prepos: 0.3 },
  rail: { label: "Rail-bound: railheads and trucks", near: 800, n: 0.6, f: 1.6, sea: 1.4 },
  joint: { label: "Joint logistic support force", near: 1500, n: 0.6, f: 1.3, sea: 1.1 },
  interior: { label: "Short interior lines", near: 500, n: 0.5, f: 1.4, sea: 1.3, prepos: 0.6 },
  alliance: { label: "Host-nation support from allies", near: 1500, n: 0.9, f: 1.1, sea: 1.0, allied: 0.6 },
  depots: { label: "Dispersed territorial depots", near: 300, n: 0.7, f: 1.5, sea: 1.5 },
  light: { label: "Light and irregular: living off the land", near: 600, n: 0.8, f: 1.5, sea: 1.5 },
  contractor: { label: "Contractor-run logistics", near: 1000, n: 1.0, f: 1.3, sea: 1.2 },
};

// Port classes: berths and whether carriers can dock (js/app.js portOf, js/game.js buildPort).
window.PORT_CLASSES = {
  harbour: { label: "Small harbour", cap: 4 },
  station: { label: "Naval station", cap: 10 },
  base: { label: "Naval base", cap: 25 },
  major: { label: "Major naval base", cap: 60, carriers: true },
};
