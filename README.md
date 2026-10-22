# World War 3 — Theatre Command

An interactive war-games map of **196 countries**: the 195 recognised states (193 UN members + Vatican City + Palestine) plus Taiwan. Each country has a dossier card with its GDP, military inventory, estimated "secret assets" and soft power. You play a campaign as one of a handful of unlocked nations.

## Run it

**Play online:** https://nerdcoder10.github.io/World-War-3/

No build step and no install needed. Open `index.html` in a browser. Everything except the web fonts is vendored, so it also works offline. You can also serve the folder, for example with `python3 -m http.server`.

## What's in it

**Map layers** (top bar): Campaign (playable, locked and conquered), Military power, Secret assets, GDP, Soft power, National value. You can drag to pan, scroll to zoom, and click any country. Microstates and small islands get dot markers.

**Country card ("Dossier")**
- **National value**: the country's estimated total worth and its share of the world's value, split into human capital, real estate and land, business equity, cultural and brand capital, infrastructure, natural resources, gold and military hardware, plus value per citizen.
- **Force disposition**: a best guess at where the military is stationed in peacetime: the capital reserve, each border sized by how tense it is, and the main naval bases. It shows troops, tanks, aircraft and vessels at each location, and the locations appear as rings on the map when you select the country.
- **Economy**: nominal GDP (2025 est.) and its world rank, share of world GDP, GDP per capita, population.
- **Military power**: a 0–100 power index and rank, plus the defence budget, active and reserve troops, tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, naval vessels, submarines, carriers and nuclear warheads.
- **Secret assets**: an estimated true-strength index, the estimated real defence spend including off-book money, gold reserves, sovereign wealth funds, 0–10 meters for intelligence, offensive cyber, nuclear capability/latency and proxies/irregulars, and an analyst note on what is believed to be hidden.
- **Soft power**: a 0–100 score, rank, tier and headline cultural assets.

**Rankings**: all 196 countries sorted by any metric, with a region filter.

## Locking rules

Every new campaign unlocks:
- 4 random African countries (South Africa is never picked)
- 3 random European countries
- 3 South American countries: Argentina always, plus 2 random (Brazil is never picked)
- Mexico, Mongolia, Kazakhstan and Bangladesh (always)

**Buying countries.** You can buy any country for its national value in coins, at 1 coin = $1. Before a campaign starts, buying a locked country makes it playable. During a campaign, buying a country adds it to your empire peacefully, and it never revolts. Its weapons still have to be unlocked. The 50 most valuable countries cost extra: ranks 1–5 +50%, 6–10 +40%, 11–20 +30%, 21–35 +15% and 36–50 +5%. For example, the United States costs about 994 trillion coins and Tuvalu about 1.5 billion.

All other countries, including Taiwan, are locked: you can't play as them, but you can inspect, invade or court them. Before you choose a nation you can reroll the random picks. The campaign is saved in your browser's localStorage.

## Campaign rules

You get one action per turn:
- **Invade**: your empire's strength against the target's defence. The defender gets a home advantage, a morale bonus from soft power, and 12% of each free treaty ally's strength (NATO, CSTO, the US Pacific treaties, China–DPRK, Gulf Peninsula Shield). If the target borders your empire you attack at full strength. Overseas targets are scaled by your force projection, which comes from ships, carriers and aircraft. If you beat a nuclear power, it may retaliate.
- **Diplomatic union**: peaceful annexation. The odds depend on your soft power, GDP and strength compared with the target's. Nuclear powers can't be absorbed this way.

**Coins and weapon unlocks.** Every nation you control starts with its weapons locked. Only troops, budget and nuclear warheads fight. Open a nation's dossier and spend coins to unlock each weapon category: tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, naval vessels, submarines and carriers. Nukes are not part of the unlock system. A category costs 10 coins per $1bn of its estimated replacement value, with a minimum of 25. Conquered nations arrive with their weapons locked too. You start with 300 coins. Each turn you earn 20 coins plus 2% of your empire's GDP in $bn, and each conquest or union pays 25 coins plus 5% of the target's GDP.

**Promo codes.** The Promo code button in the top bar redeems codes for coins. Each code works once per campaign. The codes are listed in `js/economy.js`.

Garrisons recover each turn, and weakly held conquests can revolt. You win when you control 50% of world GDP.

## Data & methodology

- `js/data.js`: one row per country. Sources: IMF WEO 2025 (GDP), UN WPP (population), SIPRI, IISS Military Balance and national budgets (defence spending), IISS and Global Firepower-style active inventories (equipment), FAS Nuclear Notebook (warheads), and Brand Finance Global Soft Power-style rankings (soft power). All figures are rounded estimates.
- `js/intel.js`: researched "secret asset" profiles for about 80 countries, plus alliances and the mapping of overseas territories to their sovereign states.
- `js/economy.js`: the world asset totals behind the valuation, natural-resource endowments, the weapon catalogue with unit costs, coin prices and promo codes.
- `js/model.js`: the scoring.
  - **Power index**: a square-root-scaled share of the world maximum across 14 weighted capabilities (budget 20%, fighters 10%, troops 8%, then tanks, aircraft, carriers, GDP, artillery, submarines, armoured vehicles, ships, population, helicopters and reserves). Equipment counts are discounted by a quality factor based on GDP per capita. Nuclear-armed states get a deterrent bonus.
  - **Estimated true strength**: the power index recomputed with off-book spending added, multiplied by intelligence, cyber and proxy capability, plus a breakout premium for nuclear-threshold and host states.
  - **Secret-assets index**: a weighted mix of intelligence, cyber, nuclear latency, proxies, hidden spending, gold and sovereign funds.
  - **National value**: the gross value of everything a country owns. First the world's assets are totalled: human capital of $1,620trn (40 years of world labour income at about $59trn a year), real estate and land of $410trn, business equity of $165trn (listed and private companies), infrastructure of $85trn, natural resources in the ground of about $477trn (gross reserve value), gold of about $26trn (central-bank and private holdings) and military hardware of about $3trn. A $70trn cultural and brand pool is shared out by soft power. That puts the **world value at about $2.86 quadrillion**. Each country gets a share of each pool: human capital and infrastructure by GDP, real estate by GDP and population, business equity by GDP weighted toward richer economies, and private gold by GDP and population. Natural resources, central-bank gold and military hardware are counted country by country. For example, the US comes to about $655trn, China $417trn and Russia $118trn. Business equity partly overlaps the property that companies own, so the figure is a gross total, not net wealth. The Vatican is set to $100trn by design. That makes it #5 in the world, and the world value comes to about $2.96 quadrillion.
  - **Soft power in power**: soft power carries a 5% weight in the military power index, standing in for alliances, morale and cultural pull.
  - **Force disposition**: `js/deployments.js` holds hand-placed basing for 32 major militaries, including every always-unlocked nation. It covers command HQs, corps, division and brigade garrisons, air and naval bases, and forces abroad, at installation or town level from open sources, with sensitive sites such as nuclear storage left out. The US has 277 locations: 158 named installations across the 50 states, 6 in US territories, and about 222,000 troops at 113 sites in 41 foreign countries. Russia, China, France, the UK, Turkey, India, Germany, Italy and others list their foreign bases too. Forces abroad are absolute personnel numbers. Home locations fill the rest of the active force. Every other country is modelled: about 45% of the home force sits at the capital and the rest at 0–12 regional garrisons (more for larger armies), plus borders weighted by each neighbour's strength (treaty allies count for one fifth) and the fleet on the coast facing open sea. Tanks are only assigned to army garrisons, not to naval or air bases. Hover a circle on the map to see that base's name, host country, troops, aircraft and vessels.
  - Countries without a researched profile get a modelled estimate based on their budget and economy. The card labels each profile as either "researched profile" or "modelled estimate".

"Secret assets" are, by definition, not public. These numbers are informed open-source estimates for a game. They are not intelligence.

Map: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas). Libraries: [d3](https://d3js.org) and [topojson-client](https://github.com/topojson/topojson-client), all ISC-licensed (see `vendor/`).
