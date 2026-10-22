# World War 3 — Theatre Command

An interactive war-games map of all **195 recognised countries** (193 UN members + Vatican City + Palestine). Each country has a dossier card with its GDP, military inventory, estimated "secret assets" and soft power. You play a campaign as one of a handful of unlocked nations.

## Run it

No build step and no install needed. Open `index.html` in a browser. Everything except the web fonts is vendored, so it also works offline. You can also serve the folder, for example with `python3 -m http.server`.

## What's in it

**Map layers** (top bar): Campaign (playable, locked and conquered), Military power, Secret assets, GDP, Soft power. You can drag to pan, scroll to zoom, and click any country. Microstates and small islands get dot markers.

**Country card ("Dossier")**
- **Economy**: nominal GDP (2025 est.) and its world rank, share of world GDP, GDP per capita, population.
- **Military power**: a 0–100 power index and rank, plus the defence budget, active and reserve troops, tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, naval vessels, submarines, carriers and nuclear warheads.
- **Secret assets**: an estimated true-strength index, the estimated real defence spend including off-book money, gold reserves, sovereign wealth funds, 0–10 meters for intelligence, offensive cyber, nuclear capability/latency and proxies/irregulars, and an analyst note on what is believed to be hidden.
- **Soft power**: a 0–100 score, rank, tier and headline cultural assets.

**Rankings**: all 195 countries sorted by any metric, with a region filter.

## Locking rules

Every new campaign unlocks:
- 4 random African countries (South Africa is never picked)
- 3 random European countries
- 3 random South American countries
- Mexico, Mongolia, Kazakhstan and Bangladesh (always)

All other countries are locked: you can't play as them, but you can inspect, invade or court them. Before you choose a nation you can reroll the random picks. The campaign is saved in your browser's localStorage.

## Campaign rules

You get one action per turn:
- **Invade**: your empire's strength against the target's defence. The defender gets a home advantage, a morale bonus from soft power, and 12% of each free treaty ally's strength (NATO, CSTO, the US Pacific treaties, China–DPRK, Gulf Peninsula Shield). If the target borders your empire you attack at full strength. Overseas targets are scaled by your force projection, which comes from ships, carriers and aircraft. If you beat a nuclear power, it may retaliate.
- **Diplomatic union**: peaceful annexation. The odds depend on your soft power, GDP and strength compared with the target's. Nuclear powers can't be absorbed this way.

Garrisons recover each turn, and weakly held conquests can revolt. You win when you control 50% of world GDP.

## Data & methodology

- `js/data.js`: one row per country. Sources: IMF WEO 2025 (GDP), UN WPP (population), SIPRI, IISS Military Balance and national budgets (defence spending), IISS and Global Firepower-style active inventories (equipment), FAS Nuclear Notebook (warheads), and Brand Finance Global Soft Power-style rankings (soft power). All figures are rounded estimates.
- `js/intel.js`: researched "secret asset" profiles for about 80 countries, plus alliances and the mapping of overseas territories to their sovereign states.
- `js/model.js`: the scoring.
  - **Power index**: a square-root-scaled share of the world maximum across 14 weighted capabilities (budget 20%, fighters 10%, troops 8%, then tanks, aircraft, carriers, GDP, artillery, submarines, armoured vehicles, ships, population, helicopters and reserves). Equipment counts are discounted by a quality factor based on GDP per capita. Nuclear-armed states get a deterrent bonus.
  - **Estimated true strength**: the power index recomputed with off-book spending added, multiplied by intelligence, cyber and proxy capability, plus a breakout premium for nuclear-threshold and host states.
  - **Secret-assets index**: a weighted mix of intelligence, cyber, nuclear latency, proxies, hidden spending, gold and sovereign funds.
  - Countries without a researched profile get a modelled estimate based on their budget and economy. The card labels each profile as either "researched profile" or "modelled estimate".

"Secret assets" are, by definition, not public. These numbers are informed open-source estimates for a game. They are not intelligence.

Map: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas). Libraries: [d3](https://d3js.org) and [topojson-client](https://github.com/topojson/topojson-client), all ISC-licensed (see `vendor/`).
