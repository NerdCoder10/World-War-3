# World War 3 — Theatre Command

An interactive war-games map of **196 countries**: the 195 recognised states (193 UN members + Vatican City + Palestine) plus Taiwan. Each country has a dossier card with its GDP, military inventory, estimated "secret assets" and soft power. You play a campaign as one of a handful of unlocked nations.

## Run it

**Play online:** https://nerdcoder10.github.io/World-War-3/

No build step and no install needed. Open `index.html` in a browser. Everything except the web fonts is vendored, so it also works offline. You can also serve the folder, for example with `python3 -m http.server`.

## What's in it

**Satellite terrain.** The map is drawn over NASA's Blue Marble imagery (topography and sea-floor relief, public domain), warped onto the game's Natural Earth projection. The world view uses a 4,096-pixel image. When you zoom in, the visible area is redrawn at screen resolution from detail tiles: a 10,800-pixel world for country views and a 21,600-pixel world (about 1 km per pixel) for state, province and base views. Country colours turn translucent so the land shows through. Zoomed views stream aerial and satellite photos from Esri World Imagery (sub-metre in most populated areas; credit: Esri, Maxar, Earthstar Geographics and the GIS User Community), warped onto the map's projection. At base zoom you can see piers, runways, hangars and ships. The map zooms to 30,000× (about 1 m per screen pixel), and clicking a base flies in to about 6,000×. If Esri can't be reached, Sentinel-2 cloudless 2016 (EOX, CC BY 4.0) is used instead, and offline the bundled NASA terrain stays. The ⛰ button next to the zoom controls switches the terrain off. The images are in `vendor/terrain/`.

**Map styles (navigation-app view).** Zoomed-in views come in three styles, chosen with the 🗺 button by the zoom controls or under *Map imagery* in the Campaign tab:
- **Hybrid** (the default) lays roads, motorways, railways and place names over the aerial photos, like a navigation app's satellite view. It uses Esri's World Transportation and Boundaries and Places layers (Esri, HERE, Garmin and OpenStreetMap data) and appears from 6× zoom.
- **Satellite** shows the photos only.
- **Map** shows the OpenStreetMap street map (© OpenStreetMap contributors), the open map data that many navigation apps are built on.

At street level (past 25×) the country colour wash fades to 30% so the imagery reads true to life.

**Instant street level.** Double-click anywhere on the map to jump straight there at street level (16,000×, map-tile level 16), where the satellite photos and road layer show streets, buildings and parked vehicles. Double-click again to go closer, or shift-double-click to step back out. The 🔍 button jumps the middle of the view to street level. The mouse wheel and trackpad zoom twice as fast as before. Clicking around once you're zoomed in no longer flies you back out to the whole country. Searching for a country (exact and starts-with matches come first, so "Oman" finds Oman, not Romania) or picking it from a list still frames it.

**Individual units at base zoom.** Zoom in past 1,500× on a base and its forces split into separate units at real counts. Every tank, armoured vehicle, gun, helicopter, jet, transport, ship and submarine is its own unit, and infantry shows as 10-soldier squads. Fort Cavazos alone shows about 3,300 squads and 3,400 vehicles and aircraft. Only bases with more than 12,000 units group a few per icon (×N).

Units are drawn top-down, as they look in satellite photos (`js/sprites.js`), with a soft sun shadow and a thin outline. **Each model gets its own picture**, drawn from its real planform and proportions (length, span, rotor size), so an F-16 looks like an F-16 and a Su-27 like a Su-27:
- **Fighters:** the F-16, F-15, F-35, F-22, F/A-18, F-14, F-4, F-5/T-38, A-10, Harrier, Su-27/30/35 (with canards on the Su-30MKI/SM), Su-34, Su-57, Su-25, MiG-21, MiG-29, MiG-31, J-10, J-20, JF-17, Rafale, Typhoon, Gripen, Mirage 2000, Kfir, Tejas, and swing-wings such as the Tornado, Su-24 and MiG-23.
- **Large aircraft:**
  - bombers: the B-52, B-1B / Tu-160 / Tu-22M3, the B-2 at its true 52 m span, the Tu-95 and the H-6;
  - transports: the C-17 / Il-76 / Y-20, A400M, C-130 / Y-9, KC-390, and twin-prop C-295 / An-26 types;
  - tankers and patrol: the KC-135, KC-46 / A330 MRTT and P-8;
  - early warning: the E-3 / A-50 radar domes, the E-7 and Erieye "top hat", and the E-2;
  - others: business-jet ISR, MQ-9 / TB2 / Global Hawk drones and the Shahed.
- **Helicopters:** real rotor size and blade count (Black Hawk 4, Mi-8 5, CH-53 7), coaxial Kamovs, the tandem Chinook, and gunships with stub wings (Apache, Mi-24, Mi-28, Tiger, Cobra).
- **Tanks:** the Abrams, Leopard 2 (wedge turret), Challenger, Leclerc, Merkava (turret at the back), T-72/T-90 and T-80 (round turret with reactive armour), T-55, M60, Leopard 1, Type 99, T-14 and light tanks.
- **Other ground vehicles:** tracked IFVs, 8×8 wheeled vehicles, MRAP trucks, self-propelled guns, rocket launchers, towed guns and mortars.
- **Ships:** destroyers, frigates, corvettes, amphibious ships, submarines, and carriers with angled flight decks.

The same pictures appear in unit tooltips and next to every model in base cards and the dossier's Equipment list. **Infantry squads march:** their 10 soldiers step in time at base zoom, and the soldier icon on bases and in tooltips is an animated marching soldier (paused while the map moves, so zooming stays smooth).

Vehicles are painted woodland olive, or desert tan for Middle Eastern and North African armies. Ships are haze grey and aircraft air-superiority grey. Each shape is drawn to the model's real length, and ground vehicles are exaggerated a little so they read clearly.

**Bases are spread out like real installations.** Units aren't packed into one block. Each battalion has its own area across the site, with roads and open ground between them (gaps of roughly 70–250 m):
- **Infantry:** barracks blocks of about 1,500 soldiers with their squads on a parade ground in front.
- **Vehicles:** motor pools of about two companies (28 tanks, 30 armoured vehicles or 18 guns), with maintenance sheds along the top and vehicles side by side in rows.
- **Helicopters:** pads in clusters of eight.
- **Aircraft:** fighters in flights of four at dispersal spots, or two to a hardened shelter where the base is fortified (5+), with transports, tankers and AEW planes on their own aprons. No runway is drawn, since the satellite imagery shows the real one.

The areas are mixed rather than sorted by kind, and each base's layout is fixed (seeded by its name), so it looks the same every visit. Fort Cavazos now spreads its motor pools and barracks over several kilometres.

Warships moor in rows at true scale by the piers. Each navy's named carriers (`js/fleet.js`) are their home base's carriers and sit at their real piers, to scale and labelled: Norfolk shows USS George H.W. Bush and Harry S. Truman at their berths. Hover any unit for its model, specs and combat value. Further out, a base's units stay grouped into one marker. Each base's parked units are pre-drawn into one image, so panning over thousands of them stays smooth.

**Carriers: every one, with its air wing.** Each navy's carrier count (`js/data.js`) is matched to its named ships (`js/fleet.js`):
- **What counts:** every carrier in commission, whether in service or in the yard. Ships still fitting out, like the USS John F. Kennedy, don't count yet. Where a navy counts big-deck amphibious ships as carriers, they're used too: Italy's Trieste, Spain's Juan Carlos I and South Korea's Dokdo and Marado.
- **US carriers:** all 11 appear at their real piers or sea areas. The Eisenhower, Stennis and Reagan are in the yard: they are drawn grey and can't sail until they're back in service. The Ford (Caribbean) and the Nimitz (South China Sea) show up wherever they are deployed.
- **Air wings:** each carrier in service carries its real air wing, sized from its aircraft capacity. A US carrier air wing is 34 Super Hornets, 10 F-35Cs, 5 E-2D Hawkeyes and 15 MH-60 Seahawks. The Liaoning carries J-15s and Z-9/Z-18 helicopters, and the Queen Elizabeth class F-35Bs. Helicopter carriers carry helicopters only.
- **Where the aircraft come from:** they're taken from the nation's own inventory and moved to the carrier's home base, so national totals don't change.
- **On the map:** up close, the wing is parked on deck in rows (about 37 aircraft on a Nimitz), and the rest are in the hangar. Hover a carrier to see its wing.

**Ordering a carrier into a fight.** Click a carrier at base zoom, or press *Select ship + aircraft to move or fight* on its ship card at any zoom. Its whole air wing is selected with it (shift-click aircraft to leave them behind). Then click a destination and confirm, as with any unit. The carrier and its aircraft travel and fight together, so the army's strength includes every embarked jet and helicopter as well as the carrier. The ship keeps its name at its new base. Sent to war, it leaves its pier on the map.

**Moving units: select, pick a destination, confirm.** Once you lead a campaign you can command **every country's** units, not just your own. Moving another country's units between its own bases redeploys them. Sending them to another country orders that country to attack, using the same engine as AI wars: against one of your nations it's an attack on you, against anyone else it's a war between them. Russia's 1st Guards Tank Army can be ordered into Ukraine, for example, and its base empties. Your own nations' units are capped by your access levels; other countries' units go as they are. For any base:
1. **Select** the units:
   - click one unit; shift-click to add or remove one;
   - shift-drag to draw a selection box;
   - double-click to select every unit of that model;
   - or press *Select units to move* on the base card for the whole base.
2. **Click the destination.** Another of your bases (click its marker) redeploys them inside the country. Any other country sends them as an army. Clicking a base marker anywhere, even one just offshore, means its country.
3. A bar shows the move: how many units, the route, distance and arrival time, with the reason if it can't happen. A dashed arrow on the map shows where they'll go. Nothing moves until you press **Confirm**, so a stray click is undone with **Cancel** or Esc.
4. **To split a selection over several places,** press **+ Another destination** and click the next one. Each destination has a box for each kind of unit selected (soldiers, tanks, AFVs, artillery, aircraft and so on). Type how many go there. Whatever you don't assign stays at the base, and the bar can't hand out more than you selected. Each order shows its own route and arrival time. **Confirm** sends them all at once, and each takes its share of the selected models. × removes a destination. For example, send 1,000 soldiers to another base and the rest to invade a neighbour.

Dragging units, or a whole base marker, also works, with a mouse or by touch, and stops at the same confirm step. Before you start a campaign, clicking units explains that commanding needs one, with a *Play as* button when that nation is playable.

**No nuclear weapons: conventional missiles instead.** For a harder game, nukes are gone. No country can end a war with a nuclear strike, there is no deterrence, and nuclear powers can be absorbed by diplomacy like anyone else.

**Missiles.** Every country fires its real conventional missile arsenal instead (`js/missiles.js`, rough 2025 open-source estimates of usable stock).
- **Arsenals:**
  - the US has about 1,500 ballistic and 8,000 cruise missiles (Tomahawk and JASSM);
  - China 2,500 Rocket Force ballistic missiles and 1,500 cruise;
  - South Korea 2,000 Hyunmoo;
  - Iran about 2,000 after its 2024–25 exchanges with Israel;
  - Russia 900 Iskander and Kinzhal plus 2,500 Kalibr and Kh-101;
  - North Korea about 1,000;
  - the Houthis in Yemen 400 ballistic and 300 cruise.
- **Air defence:** each country also has an air-defence rating (0–10). Israel's layered Iron Dome, David's Sling and Arrow is a 10, Patriot, THAAD and S-400-class networks 6–8.
- **In battle:** every day each side fires 4% of its stock (at least 5 missiles). The enemy's air defence shoots down 8% per point, so 80% against Israel and none against a country with no air defence. A ballistic hit adds 2.5 combat power to that day's fight and a cruise hit 1.5. This happens in your invasions, in attacks on your nations and in wars between AI countries.
- **Running out:** stocks run down in a long war and rebuild only 0.5% of the full arsenal a day, so a long war drains them.
- **Where to see it:** the dossier shows what's left, the send preview warns how many missiles a target will fire at you each day, and battle reports count what each side fired and what got through.

**Submarines around the world.** 61 patrol areas for 38 navies (`js/subpatrols.js`) hold the share of each navy's submarines deployed at any time: two-thirds of US and UK ballistic-missile submarines are always at sea, and attack submarines patrol forward. Each patrol is drawn as a dashed sea marker.
- **The US (35% at sea):** SSBN deterrent patrols in the North Pacific and Atlantic, and attack submarines in the Western Pacific, South China Sea, North Atlantic and GIUK gap, Mediterranean and Arabian Sea.
- **Russia (20%):** the Barents Sea and Sea of Okhotsk bastions, the North Atlantic, the Mediterranean and the Black Sea.
- **China (25%):** the South China Sea around the Hainan SSBN base, the East China Sea and Taiwan Strait, the Western Pacific, the Yellow Sea and the Indian Ocean.
- **Others:** the UK's continuous at-sea deterrent; France; India's Bay of Bengal and Arabian Sea; Japan; both Koreas; Iran in the Strait of Hormuz; Israel; Australia; and 25 other navies.

Up close, the boats in an area are spread out at sea. Like any base, you can select them and order them elsewhere.

In battle, a defender's submarines hunt any force crossing the sea to attack it, whether an invasion convoy or a fleet. The invader keeps 1 − 0.3 × S / (S + ASW) of its strength, where S is the defender's submarine power and ASW what its own warships, submarines, carriers and helicopters bring to hunt them. A thinly escorted troop convoy suffers most, and a strong escort keeps the loss to a few percent. The send preview shows the effect.

**Logistics.** A country's logistics rating (0–10) decides how well its armies are supplied and how fast they move. The US is the only 10: strategic airlift and sealift, tankers, prepositioned stocks and bases on every continent. The UK and France are 8, China 7, Russia 6, and most others lower.
- **Supply:** an invading army loses strength with distance from home, in proportion to how far its logistics fall short of 10. The loss reaches up to 35% at 2,500 km overland and 50% at 9,000 km by sea. Harsh terrain at the destination makes it worse (×1 to ×1.6).
  - The US fights at full strength anywhere.
  - Russia keeps about 94% invading Ukraine next door but only about 75% in the Caribbean.
  - Iran keeps about 85% attacking Saudi Arabia.
- **Travel time:** times are ×(1.3 − 0.03 × logistics). The US moves at ×1.0, Russia ×1.12 and North Korea ×1.21.
- **Airlift:** the share of a country's transport fleet free for an airlift scales with logistics, from 40% of the US share at logistics 0 to 100% at 10.

The dossier's military profile shows each country's supply reach, travel speed and airlift. The send preview shows the supply multiplier for that exact route.

**Terrain.** Every country is rated 0–10 on mountains, forest or jungle, desert, cold and dense cities (`js/terrain.js`: about 175 countries, with a regional mix for the rest).
- **Defence:** defenders fight ×(1 + 0.25 mountains + 0.15 forest + 0.1 cold + 0.1 cities), up to ×1.5. Switzerland is ×1.36, Taiwan ×1.35, Afghanistan ×1.28 and Vietnam ×1.26, while Saudi Arabia is only ×1.07.
- **Unit types:** an invader's units fight according to the ground.
  - Tanks lose up to a quarter of their strength in mountains and a fifth in jungle, but do slightly better in open desert. Tanks invading Taiwan fight ×0.62, Afghanistan ×0.79 and Saudi Arabia ×1.02.
  - Armoured vehicles and artillery suffer less.
  - Jungle canopy and mountains hide targets from aircraft.
  - Helicopters lose lift in thin mountain air.

  So an armour-heavy army is the right tool for the Gulf and the wrong one for the Himalaya.
- **Supply:** harsh terrain also stretches supply lines.

The dossier shows each country's terrain bars and these multipliers, and the send preview shows how your actual army will fight there.

**Fortified borders.** Every land border is rated from 1 (open) to 10 (the Korean DMZ) from what's really built there in 2025 (`js/borders.js`):
- **9–10:** the DMZ (4 km of minefields, fences and tank traps) and the Ukrainian front's belts of trenches, minefields and dragon's teeth.
- **7–9:** Israel's walls and barriers, the India–Pakistan Line of Control fence, Poland's steel wall and East Shield, the Baltic Defence Line, Finland's eastern fence, Turkey's 830 km Syria wall, Saudi Arabia's Iraq and Yemen barriers, the closed Morocco–Algeria border, Pakistan's Durand Line fence, and Kuwait's barrier with Iraq.
- **5–6:** the US–Mexico barrier (about 1,100 of 3,145 km) and others.
- **Everything else:** borders not listed get each side's general border control, usually 2 (ordinary border posts).

An army invading overland across a border of level L fights at 1 / (1 + 0.03 × (L − 2)) of its strength, so the DMZ costs an attacker about 19%. Attackers cross at the weakest border they can reach, and forces arriving by sea or air don't cross a border at all. This applies to your invasions, to enemy attacks on you and to wars between AI countries. It stacks with base fortification and home advantage.
- **On the map:** borders of 5 and up are drawn everywhere, and every border of the selected country is drawn too, coloured amber (4–5), orange (6–7) or red (8–10). Hover one for what's there.
- **In the dossier:** each country's borders are listed strongest first.
- **In the send preview:** the preview says which border your army crosses and what it costs.

**Fixed base fortification.** Every base has a fortification rating from 1 to 10 that can't be upgraded. It follows what the site really is:
- **National baseline:** North Korea's tunnelled hills 8, Switzerland's mountain forts 8, Israel and Taiwan 7, South Korea, Ukraine, Finland and Iran 6, most others 3–5.
- **Adjustments for the kind of site:** underground command posts and bunkers +3, missile fields +2, front lines and borders +2, HQs, air bases (hardened shelters) and naval bases +1, training areas, depots, reserves and peacekeeping camps −1, bases abroad −1.

It shows on base cards and tooltips, from "open garrison" up to "underground fortress". A country's troop-weighted average adds 4% to its defence for every point above 3, up to +30%. For example, North Korea (8.8/10) defends 23% harder, the US (4.5) 6% and Germany (3.5) 2%.

**Base layout.** At base zoom each base is drawn the way installations look from above:
- **Cantonment:** an HQ building and barracks blocks, about one per 250 soldiers. Fort Cavazos has 134.
- **Ground forces:** vehicles park on paved motor pools with maintenance sheds along their edge.
- **Aircraft:** they sit on concrete aprons beside hangars, or beside rows of hardened aircraft shelters at bases rated 5 or more.
- **Ships:** they moor along piers.
- **Perimeter:** a fence with a gated guardhouse. Bases rated 5+ add an earth berm, 7+ guard towers, and 9+ bunker and tunnel entrances.

Roofs are grey, or sand-coloured in desert countries.

**Real-time clock and travel.** The game clock runs in real time: 1 game hour passes every 30 real seconds, so a game day, which is one turn, lasts 12 minutes. The top bar shows the day and time. ⏸ pauses the clock, which also stops while the tab is in the background, and **Next day** skips to midnight. Each midnight every battle fights a round, income arrives and the AI acts.

Every force travels at its real effective speed, averaged over a day's movement with halts, refuelling and rest. An army moves as fast as its slowest part. Roads run 1.25× the straight-line distance and sea lanes 1.3×.

| Unit | Speed | 1,000 km takes |
|---|---|---|
| Infantry (trucks) | 30 km/h | ~42 h |
| Armoured vehicles | 20 km/h | ~63 h |
| Artillery | 15 km/h | ~83 h |
| Tanks (~300 km/day road march) | 12 km/h | ~4 days |
| Submarines | ~12 knots | ~2.5 days |
| Warships | ~16 knots | ~1.8 days |
| Carriers | ~20 knots | ~1.5 days |
| Helicopters | 180 km/h | ~6 h |
| Transports and bombers | 550 km/h | ~2 h |
| Fighters | 650 km/h | ~1.6 h |

Ground units overseas go by **sealift**: the army's own ships, with about 2 days to load and unload. Or they go by **airlift**:
- Airlift uses the nation's real transport fleet. About 15% of its heavy lifters and 25% of its tactical transports are available, times readiness.
- Only heavy lifters (C-17, C-5, An-124, Il-76, A400M, Y-20, KC-390, Kawasaki C-2) can carry vehicles: 1 tank or 2 lighter vehicles per sortie. Tactical transports such as the C-130 or An-26 carry about 80 troops.
- The time is round trips × flight time, plus loading.
- The US, with hundreds of C-17s and C-130s, can fly a brigade across the world in days. Most countries can airlift a few troops at best, and their armour can't fly.

The game picks the fastest way that works. Moving units between two of your bases also takes travel time: they leave at once, show on the map as a dashed line with a moving icon and the time left, and join the other base when they arrive. Enemy and AI armies follow the same rules.

The command bar shows what's selected and its combat value. Press **Send to…**, then click any country on the map, and exactly those units, models included, leave as an army. Access levels still cap what can go. The base they came from is left emptier, and bases fill back up evenly once that nation's units are all home or lost.

**Real-world unit performance.** `js/models.js` matches every model name to a family with its generation, role and typical specifications. Each family has a combat value against a typical unit of its kind:

| Kind | Examples (combat value) |
|---|---|
| Tanks | 4th-gen Abrams SEPv3, Leopard 2A7, K2 ×1.8 · 3rd-gen T-90, Leopard 2A4 ×1.3 · T-72 / M60 ×0.8 · T-55 / Type 59 ×0.45 |
| Fighters | F-35 / F-22 / J-20 / Su-57 ×2.2 · Rafale / Typhoon / Su-35 / J-16 ×1.5 · F-16C / MiG-29 ×1.0 · MiG-21 / F-5 ×0.45 |
| Artillery | HIMARS / M270 / Chunmoo ×1.8 · PzH 2000 / K9 / CAESAR ×1.3 · older towed guns ×0.7 |
| Ships | Burke / Type 055 / Type 45 destroyers ×3.0 · frigates ×1.8 · corvettes ×1.0 · patrol boats ×0.3 |
| Submarines | Virginia / Astute / Yasen ×2.2 · modern AIP boats ×1.0 · old diesel boats ×0.5 |
| Carriers | Ford ×1.25 · Nimitz ×1.15 · ski-jump carriers ×0.45 · Kuznetsov in refit ×0.1 |

A unit's combat power is its kind's base power × its model's value × 0.8 × the share that is **mission-capable** × (0.75 + 0.25 × readiness for crews and supplies). Badly maintained modern kit therefore fights below its paper value.

**Maintenance.** On any day part of every fleet is in depot overhaul, waiting for spares or grounded. Each kind's mission-capable rate follows the country's readiness (`js/models.js` `mcRate`):
- ground vehicles: 0.30 + 0.65 × readiness;
- fixed-wing aircraft: 0.10 + 0.75 × readiness;
- helicopters: 0.10 + 0.70 × readiness;
- surface ships: 0.25 + 0.65 × readiness;
- submarines: 0.10 + 0.60 × readiness;
- carriers: 0.20 + 0.60 × readiness.

Maintenance-heavy models are lower: the F-35 ×0.72, F-22 ×0.68 and B-1 ×0.55, matching USAF rates of about 55%, 50% and 40%. Worn-out types (MiG-21, T-55, F-4…) are ×0.85, and anything in reserve, storage or "retiring" ×0.55. That makes the US fighter fleet about 71% mission-capable, its armour 89% and its submarines 64% (the shipyard backlog). China's are about 65%, 71% and 55%, Russia's 50%, 60% and 40%, and North Korea's 35%, 49% and 32%. The dossier lists each kind's rate. At base zoom, the units in maintenance are grey with an orange marker, an even spread of each model's down share. Units in maintenance can't take orders: selecting a whole base leaves them behind. Infantry quality follows the country's technology generation. Armies remember the exact models they were sent with. The dossier's Equipment list shows each model's value.

**Capital ships for every navy.** All 42 named carriers, assault ships and flagships (13 navies) are always on the map, drawn above the bases so they're no longer hidden at shared ports. Their names show from 6× zoom; ships not in service are drawn dashed in orange. Click one for its capabilities.

**Fast zooming.**
- If the sharpest tile level would need too many tiles, a coarser level is drawn instead of nothing. Before, a fast zoom to full depth could leave the view as stretched brown terrain.
- A very coarse pass five levels up appears almost at once, and imagery refreshes every 400 ms during long zooms.
- Esri's grey "Map data not yet available" tiles are detected and replaced by the nearest coarser imagery.

**Smoother zoomed-in loading.**
- Map tiles load centre-first.
- A blurrier pass two zoom levels up (usually already cached) fills the view at once, and sharp tiles replace it as they arrive.
- When the camera flies to a base or country, the destination's tiles start downloading at take-off.
- The redraw after you stop zooming starts sooner (90 ms instead of 160 ms).

**Graphics: Fast or Detailed.** *Map & graphics* in the Campaign tab has a graphics setting. **Fast**, the default, keeps the map at 60 fps:
- canvases are drawn at 1× pixel density and map tiles one zoom level coarser;
- online photos replace the bundled terrain without re-warping it first;
- far-off bases are plain dots;
- satellites move at 15 fps;
- SVG markers are resized a few times a second while you zoom instead of every frame.

**Detailed** renders at full pixel density with sharper tiles, but can stutter on slower machines.

In both modes:
- every base, the selected country's included, is drawn on one canvas, because SVG markers get laid out again on every zoom frame. Only the bases in view past 30× zoom become SVG, for their unit rings;
- tooltips are placed without measuring the page and hidden while dragging;
- images are decoded off the main thread.

In a headless profile of zooming and panning over the US, the average frame time fell from 79 ms to 18 ms.

**Google Maps (optional).** Google's tiles aren't used without a key: downloading them directly breaks Google's terms. If you paste your own Google Maps Platform API key with the Map Tiles API enabled under *Map imagery*, zoomed views use Google's satellite, hybrid or road tiles instead, up to zoom 22. The key is stored only in your browser and sent only to Google. If the key is rejected, the map falls back to Esri and OpenStreetMap and says so.

**Map layers** (top bar): Campaign (playable, locked and conquered), Military power, Secret assets, GDP, Soft power, National value. You can drag to pan, scroll to zoom, and click any country. Microstates and small islands get dot markers.

**Country card ("Dossier")**
- **National value**: the country's estimated total worth and its share of the world's value, split into human capital, real estate and land, business equity, cultural and brand capital, infrastructure, natural resources, gold and military hardware, plus value per citizen.
- **Force disposition**: a best guess at where the military is stationed in peacetime: the capital reserve, each border sized by how tense it is, and the main naval bases. It shows troops, tanks, aircraft and vessels at each location, and the locations appear as rings on the map when you select the country.
- **Economy**: nominal GDP (2025 est.) and its world rank, share of world GDP, GDP per capita, population.
- **Military power**: a 0–100 power index and rank, plus the defence budget, active and reserve troops, tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, naval vessels, submarines and carriers, plus its conventional missiles and air defence.
- **Secret assets**: an estimated true-strength index, the estimated real defence spend including off-book money, gold reserves, sovereign wealth funds, 0–10 meters for intelligence, offensive cyber, nuclear capability/latency and proxies/irregulars, and an analyst note on what is believed to be hidden.
- **Soft power**: a 0–100 score, rank, tier and headline cultural assets.

**Rankings**: all 196 countries sorted by any metric, with a region filter.

## Locking rules

Every new campaign unlocks:
- 4 random African countries (South Africa is never picked)
- 3 random European countries
- 3 South American countries: Argentina always, plus 2 random (Brazil is never picked)
- Mexico, Mongolia, Kazakhstan and Bangladesh (always)

**Buying countries.** You can buy any country for its national value in coins, at 1 coin = $1. Before a campaign starts, buying a locked country makes it playable. During a campaign, buying a country adds it to your empire peacefully, and it never revolts. It arrives with troops at access level 1 and its weapons at level 0. The 50 most valuable countries cost extra: ranks 1–5 +132.5% (a 50% markup, then raised another 55%), 6–10 +40%, 11–20 +30%, 21–35 +15% and 36–50 +5%. The three superpowers have fixed prices instead: the United States costs 120 quadrillion coins, China 50 quadrillion and Russia 10 quadrillion. For comparison, Tuvalu costs about 3 billion.

All other countries, including Taiwan, are locked: you can't play as them, but you can inspect, invade or court them. Before you choose a nation you can reroll the random picks. The campaign is saved in your browser's localStorage.

## Campaign rules

The game runs in turns. Give as many orders as you like, then press **End turn** in the top bar: armies move, every battle fights one round, revolts are fought, forces regrow and you collect coins.

- **Armies**: open any country's dossier and use *Send an invasion force* (or *Move forces here* for your own nations). Choose where the units come from, either one of your nations' home forces or an army already in the field, and type exactly how many troops, tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, ships, submarines and carriers to send. Only the share of each unit type that the nation's access levels allow can be sent (see below). Armies take time to arrive. Ground units march overland if the target borders the source nation, or borders your territory connected to it by land. Otherwise they go by sea, which needs enough sealift from ships (2 each), carriers (40) and transport aircraft (0.5) in the same army: each 1,000 troops needs 1, and each tank 0.05. Air and naval-only forces arrive in 1 turn. You can reinforce, redirect (send an army on from where it stands) or recall armies at any time, and armies that arrive home go back into reserve.
- **Battles** are fought one round per turn. Your army's strength (unit counts × combat value × equipment quality × weapons tech × trait bonuses) is set against the defender's remaining forces, which get a 25% home advantage, a morale bonus from soft power, their defensive trait and help from free treaty allies (NATO, CSTO, the US Pacific treaties, China–DPRK, Gulf Peninsula Shield), up to triple strength. Both sides take losses in proportion to their relative strength, with no dice: the same forces always produce the same result. You conquer a country once 80% of its pre-war forces are destroyed, and half the survivors join you with their weapons locked. If your army is wiped out, the invasion fails. Both sides fire conventional missiles every day of the battle (see Missiles below). Defenders not at war regrow 5% of their forces a turn, and your nations regrow 3%.
- **No dice anywhere.** Real wars aren't decided by coin flips, so nothing in the campaign is random, and the same orders give the same outcome every time. Battles, missile salvos, attack detection, AI aggression, wars between AI countries, revolts and diplomacy all follow fixed rules. The rules are laid out in the sections below. (Only the choice of which nations start out playable is shuffled.)
- **Diplomatic union**: peaceful annexation, built up over time rather than rolled. Each day you court a country (once a day) adds its pull to your influence there. The pull is up to 90% a day, based on your soft power, GDP and strength compared with the target's. It joins at 100%. The dossier shows your influence and how many more days it takes. Countries you are at war with can't be absorbed this way.
- **Alliances with AI countries**: *Form alliance* in a country's dossier. A country signs when its support reaches 50, from fixed terms:
  - your soft power appeal (up to +30);
  - the protection you offer, your strength against theirs (up to +30);
  - already being treaty partners (+35);
  - a shared border (+10);
  - a common enemy (+15);
  - your diplomatic influence there (up to +30);
  - minus 30 if its treaty partners are fighting you.

  Countries at war with you, hostile to you, or sworn rivals of one of your nations won't sign. An ally stays independent but fights on your side. It sends 15% of its forces to defend any of your nations it can reach (overland, by sea with a real navy, or within 2,500 km), and joins your invasions with 10%, losing men alongside yours (never against its own treaty partners). It never attacks you, and you can't invade it without ending the alliance first. Allies are shaded blue on the Campaign map.

**Tiered access levels.** Every upgrade runs from level 1 to 100. Each weapon category has an access level for every nation you control: troops, tanks, armoured vehicles, artillery, aircraft, fighters, helicopters, naval vessels, submarines and carriers. Level 1 gives access to 10% of that category, rising linearly to 100% at level 90 (each level adds about 1%). Levels 91–100 are surge levels: access stays at 100% and each replaces lost units of that kind 1% faster, up to 10%. Nothing you buy makes a unit fight better. Each model's ability, the country's training, patriotism and other military-profile stats, and its technology generation are all fixed by the real military. Access is a ceiling on what you can call on, not what every attack must use: you still choose how many units to send. A nation's accessible share applies to its whole force (home plus deployed), so units already sent count against it. Defence, revolts and diplomacy use the accessible share too. Nations start with troops at level 1 and every weapon category at level 0 (locked). Missiles sit outside the levels and always count. A category's full price is 10 coins per $1bn of its estimated replacement value (minimum 25), and troops are priced at $50m per thousand. Level 1 costs 5% of that price, levels 2–90 about 2.1× it in total (each a little dearer than the last), and each surge level 5%. Each row in the dossier has +1, +10 and Max buttons, where Max buys as many levels as you can afford up to 90, then up to 100. You start with 300 coins. Each turn you earn 20 coins plus 2% of your empire's GDP in $bn, and each conquest or union pays 25 coins plus 5% of the target's GDP. Saves from before tiered access carry over: unlocked categories and troops become level 90, and each old technology level becomes 18 new levels.

**National traits (draft).** Every one of the 196 countries has its own trait, based on its geography, history or economy, for example Finland's *Sisu* (+30% defence), Mongolia's *Mongol Horde* (+16% invasion strength) and Norway's *Oil Fund* (+30 coins a turn). Each trait is shown on the dossier. Empire-wide effects (invasion strength up to +100%, union odds up to +80%, conquest coins up to +200%, sealift capacity up to +200%, and coins per turn) add up across every nation you control. Nation-only effects (defence, resistance to diplomatic union, garrison recovery and regrowth, revolt risk, weapon access discount) apply to that country, so a target's defensive trait makes it harder to take. The traits are a first draft and are listed in `js/traits.js`.

**Technology.** Each nation in your empire can research four tracks with coins from its dossier, on the same 1–100 scale: level 1 gives 10% of the track's full effect, rising linearly to 100% at level 90, and levels 91–100 add +1% each (up to 110%). Full effects are: arms production +100% faster replacement of lost troops and equipment, logistics & sealift +100% sealift capacity, industry 2% of its GDP in $bn as coins per turn (at least 10), and governance +5 points of garrison recovery per turn and −75% revolt risk. A track's full price is 12 × (40 + 5% of the nation's GDP in $bn) coins, priced per level as for access levels.

**Reset.** The Reset button in the top bar erases everything the game has saved: your campaign, coins, purchases, armies, research and redeemed promo codes. It starts a fresh campaign with new random nations. Click it twice to confirm.

**Enemy counter-attacks.** Countries strike back. Invading a country makes it hostile for 12 turns. It strikes back at one of your nations it borders, or by sea if it has a navy, whenever it can muster a real force, then regroups for 4 days. Its army is sized at about 1.45× what defends the target. Your allies never attack you. After turn 10, a neighbour that outguns one of your border nations more than twice over builds tension every day that stays true, and attacks once that tension boils over. Enemy armies travel over turns (red dashed routes) and fight your defenders one round per turn: the accessible share of that nation's forces, its order and any of your armies stationed there. If they win, you lose the nation, and losing your home nation moves your capital to your largest remaining nation. If you have none left, the campaign is lost. Beating off an attack pays some coins in captured equipment.

**Wars between AI countries.** The rest of the world fights too. From turn 3, long-running rivals (Russia–Ukraine, Israel–Iran, Rwanda–DR Congo, Pakistan–Afghanistan, India–Pakistan, Armenia–Azerbaijan, Ethiopia–Eritrea, Sudan–South Sudan, the two Koreas, China–Taiwan and others) build tension every day. The rate depends on how hot the rivalry really is: Russia–Ukraine, an ongoing war, flares within days, while Greece–Turkey takes about 200. When it boils over, the stronger side attacks. There are no random opportunistic invasions. At most six AI wars run at once. They use the same armies and turn-by-turn battles as yours (purple routes and markers on the map), and a country falls when 80% of its forces are destroyed. Conquered countries are shaded purple on the Campaign map, and you can invade them to take them yourself. The Campaign tab lists every world conflict.

**Military profile.** Every country rates 0–10 on patriotism, training, combat experience, logistics, leadership and corruption. About 90 are researched in `js/techlevels.js`, and the rest are estimated from wealth and recent conflicts. Training, experience and leadership raise every unit's skill and corruption lowers it. Patriotism strengthens defence. Logistics is covered below. Russia, for example, has combat experience but high corruption and middling training, for a unit skill of ×0.86. The US is ×1.09.

**Fronts.** An invasion doesn't flip a country in one go. The ground the attacker holds is drawn as a ragged wave spreading from where it crossed in (the border or coast point nearest the attacker) across the country, with a marching front line at its edge. It advances as the defenders are worn down: gold for your invasions, red for attacks on you and purple for wars between other countries. A nation of yours that is being invaded loses income in proportion to the ground the enemy holds.

**Satellites.** `js/space.js` lists each country's satellites in orbit in about 2025. Government and military satellites are split into reconnaissance, signals intelligence, communications, navigation and early warning, with anti-satellite capability rated 0–3. Private constellations are listed under their home country: Starlink and Starshield, Kuiper, Planet, Maxar, BlackSky, Iridium and others for the US; OneWeb for the UK and France; Jilin-1, Qianfan and Guowang for China; ICEYE for Finland; and so on. They give a combat bonus of up to about +25% (×1.21 for the US in peacetime, ×1.12 for Russia at war). Private satellites count for 30% in peacetime and in full once their country is at war, when they are pressed into national service. With a country selected, a sample of its satellites orbits on the map: government in cyan, private in white, mobilised in gold. The 🛰 button toggles them.

**Intelligence.** Every country is rated 0–10 for human, signals, imagery and cyber intelligence and for counter-intelligence. The ratings come from its secret-assets profile, satellites and intelligence alliances (Five Eyes, NATO), and the dossier lists its main agencies. Your best score sets the fog of war. Enemy strength and units are shown as estimates with an error band (±5% to ±60%) that shrinks with your intelligence and widens with their counter-intelligence. You spot an attack when it launches if your score is at least 3.3 + 0.53 × the attacker's counter-intelligence; otherwise you only see it when it lands as a surprise attack.

**Spy agencies make countries stronger.** Each country's intelligence score (#1–#196 in its dossier) multiplies everything it fights with, attacking or defending: ×1 at 5/10, +3% per point above and −3% per point below, within −12% and +15%. That covers targeting and battle damage assessment, early warning, sabotage behind the lines and cyber attacks on command networks. The CIA/NSA, Mossad/Unit 8200, GCHQ/MI6 and the Russian and Chinese services make their countries about 10–13% stronger, while countries with only a small security service fight a few percent below their paper strength. About 120 countries list their real agencies (from the CIA, SVR and MSS to Kenya's NIS, Brazil's ABIN and Chile's ANI). The rest show a generic national or small security service.

**Capital ships.** `js/fleet.js` places every aircraft carrier and big-deck amphibious ship in service in 2025, plus fleet flagships, at its home port, shipyard or deployment area. Ships not in service are shown dashed in orange. That includes USS John F. Kennedy (CVN-79), the second Ford-class carrier, fitting out at Newport News for delivery in 2027, as well as carriers in overhaul and Russia's laid-up Admiral Kuznetsov. Selecting a country shows its ships on the map and lists them in the dossier. Each ship card gives class, status, location and approximate capabilities: displacement, length, speed, aircraft carried, crew, propulsion and year. Clicking a ship flies to its pier, where the satellite view often shows the ship itself. Positions at sea are approximate, since deployments change week to week.

**Equipment models.** Each country's inventory is broken down into real weapon models, from Abrams, Leopard 2, T-90M and Type 99 tanks to F-35, Su-34, J-20 and MiG-21 jets, plus each army's standard small arms (M4 and XM7, AK-74M and AK-12, QBZ-191, INSAS and AK-203, and so on). About 76 militaries are listed individually in `js/equipment.js`, from the major powers to Vietnam, Indonesia, Thailand, Colombia, Morocco, Greece, Spain, Algeria, Canada, the Gulf states, the Nordics and others. The rest use a template that matches where they buy their weapons: Soviet-legacy, NATO, Chinese exports, Western-light, Gulf or non-aligned. The dossier's Equipment section lists the whole inventory by model. Base cards list the models at that base, and hovering a unit icon at base zoom shows its models.

**Technology and readiness.** Every country has a technology generation (1–5, how advanced its designs are) and a readiness (maintenance, spare parts, training). `js/techlevels.js` sets both for about 80 militaries and estimates the rest from GDP per capita. Combat quality is (0.35 + 0.13 × generation) × (0.4 + 0.6 × readiness), so modern designs that are poorly maintained or never fully fielded fight below their paper value. Russia, for example, is Gen 4.2 but only 55% ready, so it fights at about 65% quality against 94% for the US. Readiness also discounts the estimated true strength. On the map, bases and armies are drawn as soldier, tank, jet or ship icons in three tiers: dated (amber-brown: propeller planes, tall old tanks, gunboats), standard (gold) and advanced (glowing cyan: stealth jets, low angular tanks, stealth destroyers). Poorly maintained forces are drawn faded and grey. Generation and readiness can't be bought: they reflect the real military. (The old Weapons systems track, which added combat power, is now Arms production, and saved levels carry over.)

**Promo codes.** The Promo code button in the top bar redeems codes for coins. Each code works once per campaign. The codes are listed in `js/economy.js`.

**Revolts.** Weakly held conquests can rise up, but they don't break away at once. The rebels (15–50% of the country's ground forces, more when order is low) fight its loyal forces and any of your armies stationed there, one round per turn. Their progress bar fills when they win rounds. They gain independence at 100%, which takes about 4–6 turns if you do nothing, and the revolt is crushed once 85% of the rebels are destroyed. Send forces to put it down. There's no dice roll for a revolt. Unrest builds every day a conquest is weakly held (faster when order is low), and it rises up when unrest reaches 100%. Stationed armies slow unrest by 70%, and a territory in revolt pays no income. Bought nations never revolt. You win when you control 50% of world GDP.

## Data & methodology

- `js/data.js`: one row per country. Sources: IMF WEO 2025 (GDP), UN WPP (population), SIPRI, IISS Military Balance and national budgets (defence spending), IISS and Global Firepower-style active inventories (equipment), FAS Nuclear Notebook (warheads), and Brand Finance Global Soft Power-style rankings (soft power). All figures are rounded estimates. The major militaries were re-checked against IISS Military Balance 2025 and Global Firepower 2025. China was corrected to 1,580 fighter and attack aircraft (1,212 fighters plus 371 attack) and 61 submarines.
- `js/intel.js`: researched "secret asset" profiles for about 80 countries, plus alliances and the mapping of overseas territories to their sovereign states.
- `js/economy.js`: the world asset totals behind the valuation, natural-resource endowments, the weapon catalogue with unit costs, coin prices and promo codes.
- `js/model.js`: the scoring.
  - **Power index**: a square-root-scaled share of the world maximum across 14 weighted capabilities (budget 20%, fighters 10%, troops 8%, then tanks, aircraft, carriers, GDP, artillery, submarines, armoured vehicles, ships, population, helicopters and reserves). Equipment counts are discounted by a quality factor based on GDP per capita. Conventional missile arsenals and air defence add to it (nuclear weapons aren't part of the game).
  - **Estimated true strength**: the power index recomputed with off-book spending added, multiplied by intelligence, cyber and proxy capability.
  - **Secret-assets index**: a weighted mix of intelligence, cyber, nuclear latency, proxies, hidden spending, gold and sovereign funds.
  - **National value**: the gross value of everything a country owns. First the world's assets are totalled: human capital of $1,620trn (40 years of world labour income at about $59trn a year), real estate and land of $410trn, business equity of $165trn (listed and private companies), infrastructure of $85trn, natural resources in the ground of about $477trn (gross reserve value), gold of about $26trn (central-bank and private holdings) and military hardware of about $3trn. A $70trn cultural and brand pool is shared out by soft power. That puts the **world value at about $2.86 quadrillion**. Each country gets a share of each pool: human capital and infrastructure by GDP, real estate by GDP and population, business equity by GDP weighted toward richer economies, and private gold by GDP and population. Natural resources, central-bank gold and military hardware are counted country by country. For example, the US comes to about $655trn, China $417trn and Russia $118trn. Business equity partly overlaps the property that companies own, so the figure is a gross total, not net wealth. The Vatican is set to $100trn by design. That makes it #5 in the world, and the world value comes to about $2.96 quadrillion.
  - **Soft power in power**: soft power carries a 5% weight in the military power index, standing in for alliances, morale and cultural pull.
  - **Force disposition**: every one of the 196 countries has hand-placed basing: `js/deployments.js` covers 32 major militaries, `js/deployments-more.js` covers Africa and the rest of Europe, `js/deployments-rest.js` covers everyone else, and `js/deployments-extra.js` adds well-known air, naval and missile bases where coverage was thin (Ukraine, North Korea, Egypt, Iran, Brazil, Thailand) (countries with no army list their police or coast-guard bases). It covers command HQs, corps, division and brigade garrisons, air and naval bases, and forces abroad, at installation or town level from open sources, with sensitive sites such as nuclear storage left out. The US has 412 locations: about 290 installations across the 50 states (every state has at least five, counting National Guard and reserve bases, depots, arsenals and ranges in `js/deployments-us-states.js`), 6 in US territories, and about 222,000 troops at 113 sites in 41 foreign countries. Canada has 14 bases at home. Russia, China, France, the UK, Turkey, India, Germany, Italy and others list their foreign bases too. Forces abroad are absolute personnel numbers. Home locations fill the rest of the active force. Each base lists its weapons by type: troops, tanks, armoured vehicles, artillery, fighter/attack jets, other aircraft, helicopters, naval vessels, submarines and carriers. Each type is shared out by the base's ground, air or naval share, weighted by what the base is (a fighter wing gets the jets, a submarine base the submarines, an armoured division the tanks), and rounded so the bases add up to the national inventory. Every unit a country is known to have, nukes excepted, is assigned to one of its bases at home or abroad. If no base suits a type (helicopters in a force with no army bases, say), it is spread by overall base size. During a campaign the totals are the nation's current home pool, so losses and units sent away show up at the bases. Every country's bases, at home and abroad (1,838 in all), are drawn on the world map at once. Other countries' bases are fainter dots sized by their absolute strength and show their unit icon from 4× zoom. The selected country's bases are drawn on top at full size. Hover any base for its units, or click it to open that country and its base card. The ⌖ button beside the zoom controls hides or shows the other countries' bases, and to keep the map smooth the other countries' bases are drawn on a single canvas rather than as ~1,800 SVG elements. Zoomed in past 30×, the other bases in view switch to SVG so they show their unit rings. Selecting a country zooms the map to it and loads its states and provinces (Natural Earth admin-1, about 4,600 regions, one small file per country in `vendor/admin1/`). Click a state or province, or choose one from the dossier, to zoom in further and list its bases with their total troops and weapons. Clicking a base, on the map or in a list, zooms the map in to it automatically. At base zoom each base shows a ring of icons, one per kind of unit stationed there, with counts: infantry, tanks, armoured vehicles, artillery, fighter/attack jets, transports and other aircraft, helicopters, ships, submarines and carriers. Hover a circle on the map to see that base's details. Click it to pin a base card and highlight its entry in the dossier list. Clicking a base in the list flies the map to it, and selecting a country zooms the map to it. About 270 named installations were moved to their exact locations using OpenStreetMap (Nominatim) lookups. A match was accepted only when it was a military, airfield or naval feature whose name matched the base and that lay within 40 km of the hand-placed spot. Generic entries such as regional garrisons, frontiers and UN missions keep their hand-placed positions. Only publicly documented sites are mapped: well-known secretive facilities such as Area 51, Tonopah, Pine Gap and Menwith Hill are included, but undisclosed sites are not guessed at. The secret assets score covers hidden strength instead.
  - Countries without a researched profile get a modelled estimate based on their budget and economy. The card labels each profile as either "researched profile" or "modelled estimate".

"Secret assets" are, by definition, not public. These numbers are informed open-source estimates for a game. They are not intelligence.

Terrain: NASA Earth Observatory Blue Marble Next Generation (topography and bathymetry, December 2004, by Reto Stöckli, public domain). Base coordinates partly from OpenStreetMap (© OpenStreetMap contributors, ODbL). Map: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas); states and provinces from Natural Earth 1:10m admin-1 (public domain), simplified with mapshaper. Libraries: [d3](https://d3js.org) and [topojson-client](https://github.com/topojson/topojson-client), all ISC-licensed (see `vendor/`).
