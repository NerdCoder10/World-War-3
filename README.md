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

**Buying countries.** You can buy any country for its national value in coins, at 1 coin = $1. Before a campaign starts, buying a locked country makes it playable. During a campaign, buying a country adds it to your empire peacefully, and it never revolts. Its weapons still have to be unlocked. The 50 most valuable countries cost extra: ranks 1–5 +132.5% (a 50% markup, then raised another 55%), 6–10 +40%, 11–20 +30%, 21–35 +15% and 36–50 +5%. For example, the United States costs about 1.54 quadrillion coins and Tuvalu about 1.5 billion.

All other countries, including Taiwan, are locked: you can't play as them, but you can inspect, invade or court them. Before you choose a nation you can reroll the random picks. The campaign is saved in your browser's localStorage.

## Campaign rules

The game runs in turns. Give as many orders as you like, then press **End turn** in the top bar: armies move, every battle fights one round, revolts are fought, forces regrow and you collect coins.

- **Armies**: open any country's dossier and use *Send an invasion force* (or *Move forces here* for your own nations). Choose where the units come from, either one of your nations' home forces or an army already in the field, and type exactly how many troops, tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, ships, submarines and carriers to send. Only troops and unlocked weapon types can be sent. Armies take time to arrive. Ground units march overland if the target borders the source nation, or borders your territory connected to it by land. Otherwise they go by sea, which needs enough sealift from ships (2 each), carriers (40) and transport aircraft (0.5) in the same army: each 1,000 troops needs 1, and each tank 0.05. Air and naval-only forces arrive in 1 turn. You can reinforce, redirect (send an army on from where it stands) or recall armies at any time, and armies that arrive home go back into reserve.
- **Battles** are fought one round per turn. Your army's strength (unit counts × combat value × equipment quality × weapons tech × trait bonuses) is set against the defender's remaining forces, which get a 25% home advantage, a morale bonus from soft power, their defensive trait and help from free treaty allies (NATO, CSTO, the US Pacific treaties, China–DPRK, Gulf Peninsula Shield), up to triple strength. Both sides take losses in proportion to the odds. You conquer a country once 80% of its pre-war forces are destroyed, and half the survivors join you with their weapons locked. If your army is wiped out, the invasion fails. A nuclear power may strike your armies once per war before it falls. Defenders not at war regrow 5% of their forces a turn, and your nations regrow 3%.
- **Diplomatic union**: peaceful annexation, tried once per country per turn. The odds depend on your soft power, GDP and strength compared with the target's. Nuclear powers and countries you are at war with can't be absorbed this way.

**Coins and weapon unlocks.** Every nation you control starts with its weapons locked. Only troops, budget and nuclear warheads fight. Open a nation's dossier and spend coins to unlock each weapon category: tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, naval vessels, submarines and carriers. Nukes are not part of the unlock system. A category costs 10 coins per $1bn of its estimated replacement value, with a minimum of 25. Conquered nations arrive with their weapons locked too. You start with 300 coins. Each turn you earn 20 coins plus 2% of your empire's GDP in $bn, and each conquest or union pays 25 coins plus 5% of the target's GDP.

**National traits (draft).** Every one of the 196 countries has its own trait, based on its geography, history or economy, for example Finland's *Sisu* (+30% defence), Mongolia's *Mongol Horde* (+16% invasion strength) and Norway's *Oil Fund* (+30 coins a turn). Each trait is shown on the dossier. Empire-wide effects (invasion strength up to +100%, union odds up to +80%, conquest coins up to +200%, sealift capacity up to +200%, and coins per turn) add up across every nation you control. Nation-only effects (defence, resistance to diplomatic union, garrison recovery and regrowth, revolt risk, weapon unlock discount) apply to that country, so a target's defensive trait makes it harder to take. The traits are a first draft and are listed in `js/traits.js`.

**Technology.** Each nation in your empire can research four tracks, up to level 5 each, with coins from its dossier: weapons systems (+10% combat power for that nation's units per level), logistics & sealift (+20% sealift capacity and +20% faster regrowth for that nation per level), industry (+0.4% of its GDP in $bn as coins per turn per level, at least 2) and governance (+1 point garrison recovery and −15% revolt risk per level). The next level costs (40 + 5% of the nation's GDP in $bn) × 2^current level coins.

**Reset.** The Reset button in the top bar erases everything the game has saved: your campaign, coins, purchases, armies, research and redeemed promo codes. It starts a fresh campaign with new random nations. Click it twice to confirm.

**Enemy counter-attacks.** Countries strike back. Invading a country makes it hostile for 12 turns, and it may send its own army at one of your nations it borders, or by sea if it has a navy. Its army is sized at roughly 0.9–2× what defends the target. Treaty allies stay out of it for now. After turn 10, a neighbour more than twice as strong as one of your border nations may also attack unprovoked now and then. Enemy armies travel over turns (red dashed routes) and fight your defenders one round per turn: that nation's unlocked forces, its order and any of your armies stationed there. If they win, you lose the nation, and losing your home nation moves your capital to your largest remaining nation. If you have none left, the campaign is lost. Beating off an attack pays some coins in captured equipment.

**Technology and readiness.** Every country has a technology generation (1–5, how advanced its designs are) and a readiness (maintenance, spare parts, training). `js/techlevels.js` sets both for about 80 militaries and estimates the rest from GDP per capita. Combat quality is (0.35 + 0.13 × generation) × (0.4 + 0.6 × readiness), so modern designs that are poorly maintained or never fully fielded fight below their paper value. Russia, for example, is Gen 4.2 but only 55% ready, so it fights at about 65% quality against 94% for the US. Readiness also discounts the estimated true strength. On the map, bases and armies are drawn as soldier, tank, jet or ship icons in three tiers: dated (amber-brown: propeller planes, tall old tanks, gunboats), standard (gold) and advanced (glowing cyan: stealth jets, low angular tanks, stealth destroyers). Poorly maintained forces are drawn faded and grey. Researching weapons systems raises a nation's effective generation.

**Promo codes.** The Promo code button in the top bar redeems codes for coins. Each code works once per campaign. The codes are listed in `js/economy.js`.

**Revolts.** Weakly held conquests can rise up, but they don't break away at once. The rebels (15–50% of the country's ground forces, more when order is low) fight its loyal forces and any of your armies stationed there, one round per turn. Their progress bar fills when they win rounds. They gain independence at 100%, which takes about 4–6 turns if you do nothing, and the revolt is crushed once 85% of the rebels are destroyed. Send forces to put it down. Stationed armies cut the chance of a revolt by 70%, and a territory in revolt pays no income. Bought nations never revolt. You win when you control 50% of world GDP.

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
  - **Force disposition**: every one of the 196 countries has hand-placed basing: `js/deployments.js` covers 32 major militaries, `js/deployments-more.js` covers Africa and the rest of Europe, and `js/deployments-rest.js` covers everyone else (countries with no army list their police or coast-guard bases). It covers command HQs, corps, division and brigade garrisons, air and naval bases, and forces abroad, at installation or town level from open sources, with sensitive sites such as nuclear storage left out. The US has 279 locations: 160 named installations across the 50 states, 6 in US territories, and about 222,000 troops at 113 sites in 41 foreign countries. Russia, China, France, the UK, Turkey, India, Germany, Italy and others list their foreign bases too. Forces abroad are absolute personnel numbers. Home locations fill the rest of the active force. Each base lists its weapons by type: troops, tanks, armoured vehicles, artillery, fighter/attack jets, other aircraft, helicopters, naval vessels, submarines and carriers. Each type is shared out by the base's ground, air or naval share, weighted by what the base is (a fighter wing gets the jets, a submarine base the submarines, an armoured division the tanks), and rounded so the bases add up to the national inventory. Hover a circle on the map to see that base's details. Click it to pin a base card and highlight its entry in the dossier list. Clicking a base in the list flies the map to it, and selecting a country zooms the map to it. Only publicly documented sites are mapped: well-known secretive facilities such as Area 51, Tonopah, Pine Gap and Menwith Hill are included, but undisclosed sites are not guessed at. The secret assets score covers hidden strength instead.
  - Countries without a researched profile get a modelled estimate based on their budget and economy. The card labels each profile as either "researched profile" or "modelled estimate".

"Secret assets" are, by definition, not public. These numbers are informed open-source estimates for a game. They are not intelligence.

Map: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas). Libraries: [d3](https://d3js.org) and [topojson-client](https://github.com/topojson/topojson-client), all ISC-licensed (see `vendor/`).
