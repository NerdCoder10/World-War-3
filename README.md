# World War 3 — Theatre Command

An interactive war-games map of **196 countries**: the 195 recognised states (193 UN members + Vatican City + Palestine) plus Taiwan. Each country has a dossier card with its GDP, military inventory, estimated "secret assets" and soft power. You play a campaign as one of a handful of unlocked nations.

## Run it

**Play online:** https://nerdcoder10.github.io/World-War-3/

No build step and no install needed. Open `index.html` in a browser. Everything except the web fonts is vendored, so it also works offline. You can also serve the folder, for example with `python3 -m http.server`.

**Install it as an app.** The site is an installable web app (`manifest.webmanifest`, `sw.js`). Use *Install app* in Chrome or Edge, or *Add to Home Screen* on a phone. It always loads the newest version when online and still works offline.

**Always up to date, progress kept.** Every release bumps the version (`python3 tools/bump-version.py` updates every `?v=` in `index.html` and `version.json` together). Open copies of the game, in a browser tab or the installed app, check `version.json` every few minutes and whenever they come back into view. When a newer version is out they save the campaign and reload into it, waiting if you're in the middle of an order. Saves carry over to every new version (`js/game.js` `adopt`): countries added since are filled in, and the previous save is kept as a backup.

**Accounts and saved progress.** Progress always saves in the browser. The *Sign in* button adds an account (Google, or email and password), and every save is then also copied to the cloud, so a campaign follows the player to any device. Signing in on a device keeps whichever save is newer. Without an account, *Download save* and *Load save* move a campaign between devices as a file.

Cloud accounts need a free Firebase project. Until `js/firebase-config.js` is filled in, the button offers only the save file. To switch them on:
1. Create a project at https://console.firebase.google.com and add a **Web app**. Copy its config object (`apiKey`, `authDomain`, `projectId`, …) into `js/firebase-config.js` in place of `null`.
2. In **Authentication → Sign-in method**, enable **Google** and **Email/Password**. Under **Settings → Authorized domains**, add `nerdcoder10.github.io`.
3. Create a **Cloud Firestore** database and set its rules so each player can only read and write their own save:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /saves/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

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

**Moving units: select, pick a destination, confirm.** You lead **one country** and command only its forces, plus the countries it conquers, unites with or buys. Other countries' units can be inspected but not ordered. Your nations' units are capped by your access levels. For any base:
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

**Alliances and loyalty: who is really on your side.** The *Alliances* tab ranks every mutual-defence pact by **reliability**: the share of its military power that would actually fight (`js/loyalty.js`). There are 27 real pacts:
- **Europe and the Atlantic:** NATO, the EU's mutual-assistance clause (Article 42.7), the Anglo-Portuguese Alliance, France–Greece, Greece–Cyprus.
- **Russia's side:** the CSTO, the Russia–Belarus Union State, the 2024 Russia–North Korea treaty.
- **US treaties in Asia and the Pacific:** each bilateral treaty on its own (Japan, South Korea, the Philippines, Thailand), ANZUS, and the Compacts of Free Association (Micronesia, Marshall Islands, Palau).
- **Other Asia-Pacific:** the China–North Korea treaty, the Five Power Defence Arrangements.
- **Middle East:** the Gulf Peninsula Shield, the Arab League Joint Defence Treaty, the 2025 Saudi–Pakistan pact, Turkey–Azerbaijan (Shusha), France–UAE.
- **Africa:** France–Djibouti, the ECOWAS defence protocol, the Alliance of Sahel States, the SADC Mutual Defence Pact.
- **The Americas:** the Rio Treaty, the Eastern Caribbean Regional Security System.

Neutral countries (Austria, Ireland, Malta, Switzerland and others) never send forces. Members of loose pacts that don't care simply stay home rather than quit.
- **Loyalty, 0–100, for every member:** it starts from how binding the treaty is and the member's real record. For example, Poland and the Baltic states spend 3–5% of GDP on the front line; Hungary blocks aid to Ukraine; Turkey bought Russian S-400s; Armenia froze its CSTO membership; Qatar was blockaded by its Gulf partners. Then the war itself counts:
  - whether the attacker is the threat the bloc exists to deter, or the member's own rival;
  - how close the fighting is;
  - whether the attacker looks stronger than the whole bloc;
  - whether the member is busy defending itself, or the bloc's leader has fallen;
  - whether it is also bound by treaty to the attacker;
  - your diplomatic influence there, which peels members away from a bloc you attack.
- **What loyalty does:** 70+ **fights** (sends 12% of its strength); 50–69 gives **limited help** (6%); 30–49 **sits out**; under 30 **betrays**: it walks out of the bloc when the war starts. Members torn between both sides sit out rather than quit. No dice: the same war always gets the same answer.
- **Test any war:** each bloc is shown against the war it exists for (Russia attacking Estonia: 26 of NATO's 31 other members fight, Spain, Iceland, Slovakia and Turkey give limited help, and Hungary sits out; Azerbaijan attacking Armenia: no CSTO member fights). Pick any attacker, you included, and any member. Open a member to see every reason.
- **In your wars:** when a war starts, the log says how the bloc lines up and who betrayed it, and attack forecasts list which treaty partners fight, sit out or would betray. If your own nation is in a bloc, its partners now defend it by their loyalty.
- **Your own allies:** each ally's loyalty to you is tracked. It starts from what drew it in and falls with war weariness, invading its neighbours, losing nations, facing a stronger enemy, or allying with its rival. 70+ joins your invasions; 50–69 defends you but joins attacks with half; under 50 it wavers (you get a warning); under 30 it betrays you, tears up the alliance and turns hostile.

**Spy networks.** Every country's services run networks inside other countries: agents and moles, intercept stations and cable taps, and cyber implants (`js/spies.js`).
- **Strength:** each network (0–100) drifts each day toward what the spymaster can keep there. That depends on its real priorities and skill against the target's counter-intelligence, plus what you invest.
- **Starting networks follow real-world penetrations:** Mossad in Iran (95), Russia in Ukraine (80), China in Taiwan (79), the US in Russia and China (≈70), Cuba inside Venezuela. Five Eyes partners and your allies share theirs at half strength.
- **What a network gives you:**
  - estimates of that country's forces up to 70% more precise;
  - early warning of its attacks at 30+;
  - up to +8% in battles against it.
- **Operations (Intel tab):**
  - **Recruit agents:** grow a network, up to six times.
  - **Sabotage:** its missiles and drones −15% and its defence ×0.9 for 3 days.
  - **Steal technology:** +1 level in your weakest technology track.
  - **Influence:** +15% diplomatic influence.
  - **Incite revolt:** arm the resistance in a land another country occupies.
  - Each operation burns part of the network, which then lies low for 5 days. One that falls under 15 is blown and the country turns hostile.
- **Foreign spies in your empire:**
  - Hostile services with networks of 55+ in your nations sabotage them every ten days.
  - Services more skilled than your counter-intelligence stay unidentified.
  - A counter-intelligence sweep rolls them up.
- **Where to see it:** the Intel tab also lists the world's deepest networks with what's publicly known about them, and every dossier shows who spies on that country.

**Day and night.** Each day's battle runs through the real hours of daylight and darkness at the battlefield, from the sun's position for the campaign date and latitude (`js/daynight.js`):
- **Darkness varies:** long winter nights in the north, polar night above the Arctic Circle, white nights in summer, twelve-hour nights in the tropics.
- **The moon matters:** a bright moon helps forces fighting by eye. The moon follows its real cycle.
- **Each military fights differently in the dark:**
  - US, British and Israeli forces "own the night" with thermal sights, night-vision goggles and night-trained helicopter crews. US infantry keep ×0.99 of their strength over a Ukrainian winter day.
  - Russia's thermal sights relied on French parts and few of its soldiers have goggles (×0.85).
  - North Korea and Nigeria fight largely blind after dark (×0.77–0.84).
  - Helicopters suffer most, warships least, and submarines not at all.
- **On the map:** the night side is shaded, with the terminator line moving with the game clock.
- **Where to see it:** dossiers show today's darkness, the moon, local time and how several militaries would fight there; battle reports and attack forecasts include it.

**Drones.** Every country has a drone technology level, war production, counter-drone defences and stocks (`js/drones.js`):
- **The leaders:** Ukraine's millions of FPV drones and its naval drones, Russia's Geran-2 and Lancet, China's industry, Israel's Heron and Harop, Turkey's Bayraktars, Iran's Shahed, the US Reaper and Switchblade.
- **In battle:** a side's drones add up to about +30% to its strength, cut by the enemy's jamming, interceptors and lasers. Storms, blizzards, sandstorms and typhoons ground them, and darkness grounds those without thermal cameras.
- **Stocks run down:** each day of war burns one day of stock, refilled at what the country's factories make. With no trade, chip shortages cut that.
- **Where to see it:** each dossier has a *Drones* section, and Rankings add *Drone technology*.

**Weather and seasons.** Every country has a climate, and each day's weather there follows its season (`js/weather.js`):
- **Seasonal hazards:** Russia and Ukraine's snowy winters and spring and autumn mud seasons (*rasputitsa*), the South Asian monsoon, Pacific typhoons, Atlantic hurricanes and Indian Ocean cyclones, Gulf summer heat and spring sandstorms, Sahel dust, mountain snow, Atlantic storms and fog. Southern-hemisphere seasons are six months apart.
- **No dice:** the weather is set by the date and the place, never rolled. The campaign calendar starts on the real date you begin, and every dossier shows a 7-day forecast, so you can plan around it.
- **What weather does:** each kind of unit suffers differently:
  - mud stops tanks;
  - storms and blizzards ground helicopters and older jets;
  - heat and sandstorms exhaust infantry;
  - typhoons scatter fleets;
  - freezing cold bites harder the colder it gets.
- **Every country copes differently:**
  - Forces used to a climate from home lose far less than strangers to it.
  - Some are also trained for others: Finland's ski troops, Russia's "General Winter", Israel's desert armour, Vietnam's jungle infantry, India's Siachen glacier troops, and US forces trained for every climate.
  - In the same blizzard, Finnish infantry fight at ×0.97, US at ×0.86 and Saudi at ×0.69.
  - In a sandstorm, Israeli tanks fight at ×0.95 and Russian at ×0.69.
  - Jets with modern all-weather radar keep flying in rain, fog and snow, and big blue-water navies keep sailing in heavy seas.
- **Where to see it:**
  - The *Weather* map mode colours every country by today's weather.
  - Dossiers show the forecast, each force's adaptation and how several countries' forces would fight there today.
  - Attack forecasts and battle reports state the weather's effect on both sides.

**Spare parts: maintenance with no trade.** Every weapon needs parts from the country that makes it (`js/maintenance.js`).
- **Which kit depends on whom:** each model in each country's arsenal is traced to its maker. Joint programmes (Eurofighter, NH90, A400M) count every partner, and licence-built kit counts as home-made (India's Su-30MKI, Japan's F-15J, Korea's KF-16).
- **Running down:** at war with all trade cut, kit made abroad keeps going only while spare-part stocks and cannibalised airframes last (about 4 months). After that only the share the country's own depots can keep running stays in service:
  - Saudi Arabia (20%) sees its US-made tanks and fighters fade to a fifth of their strength;
  - Iran (70%), with 45 years of practice keeping US F-14s flying, barely suffers;
  - China and the US (80–90%) make almost everything themselves.
- **Who still supplies parts:** your own nations, your allies and treaty partners. Conquer or ally with the maker to restore them.
- **Where to see it:** the dossier's equipment section shows each kind's foreign-parts share, who makes the parts and what's left after 4 months.

**Power projection: nobody walks to Canada.** An army crossing the sea or flying in must start from a staging point within its country's reach of the target (`js/projection.js`).
- **Staging points:** home, conquered or allied land, treaty partners (basing rights), or its own bases abroad.
- **Reach:** set by real expeditionary assets. The US 16,000 km (carriers, amphibious ships, airlift, tankers and about 750 bases abroad); the UK and France 9,000; Australia 4,500; China and Russia 3,500; others 400 km plus 250 km per point of logistics.
- **So:** China can invade Taiwan or Japan but not Canada, unless it first conquers or allies its way across the Pacific.
- **Aircraft:** fighters need a base within 2,500 km and helicopters within 1,000 km unless a carrier sails with them.
- **Overland:** armies cross your own, allied and treaty partners' land, never neutral countries'.
- **The AI is bound by the same rules.** Orders that break them explain why.

**Occupation: how its people would take it.** Every country's people have a happiness score (0–100) for every possible ruler (`js/occupation.js`).
- **What sets it:** shared culture and language, religion, the history between the two, whether they were allies or rivals, freedom, living standards, national pride, how the land was taken and how long it has been ruled.
  - History counts both ways: Russia–Ukraine, Japan–China and Korea, Israel–Palestine, India–Pakistan and Turkey–Armenia are bitter; Greece–Cyprus, Romania–Moldova and Turkey–Azerbaijan are kin.
  - A democracy ruled by an autocracy resents it most.
  - A diplomatic union is taken far better than conquest (+15 against −15), and resentment fades with time.
- **Examples:** Greece ruling Cyprus 91, Russia ruling Belarus 75, the US ruling Canada 68, China ruling Taiwan 6, China ruling Canada 0.
- **What it does:**
  - Unhappy lands build unrest up to 1.6× as fast, pay as little as half their taxes and raise bigger revolts.
  - Happy ones pay up to 110% and rarely rise.
  - Lands conquered by AI countries also resist, and unhappy ones throw the occupier out in time.
- **Where to see it:** each dossier shows happiness under its current ruler, or under any country you pick, with the most and least welcome rulers. The Campaign tab lists your occupied lands.

**War economy: total war, no trade.** Losses are replaced only by what a country's own factories build and the recruits it trains. **All trade between countries is cut off**: no country can buy fuel, steel, metals, chips or weapons from any other (`js/wareconomy.js`).
- **Real resources:** every country produces its own amount of each strategic resource a year (2023–24, rounded). About 90 countries have real figures; the rest have little or none.

  | Resource | Unit | Notable facts |
  |---|---|---|
  | Oil | million barrels a day, against its consumption | Japan, South Korea and Taiwan produce none |
  | Steel | million tonnes | China 1,019, India 140 |
  | Aluminium | million tonnes, smelted plus recycled | |
  | Titanium | thousand tonnes | Only China, Japan, Russia, Kazakhstan and Saudi Arabia make sponge; the US runs on scrap |
  | Rare earths | thousand tonnes separated | China ~90%, then Malaysia's Lynas and Estonia's Silmet |
  | Military chips | thousand weapon sets | Taiwan, China, South Korea, the US and Japan lead |

- **Hard requirements:** each weapon needs real materials:
  - a fighter: titanium, aluminium, rare-earth magnets and a set of chips;
  - a helicopter: titanium and aluminium;
  - a submarine or carrier: titanium and rare earths;
  - a tank, warship or missile: steel and electronics;
  - drones: aluminium and chips, no titanium.

  **A country that lacks a resource can't build anything that needs it, at all.** It goes without, or takes it by force. For example:
  - South Korea, with no titanium, can build no fighters, helicopters or submarines;
  - the UK, with no rare earths, can build no fighters or submarines;
  - the US is held to about 80% of its fighter and submarine output by rare earths;
  - Iran builds missiles and drones but no aircraft.
- **A different output for every country:** each country spends what its factories can turn to arms on what its defence industry actually makes and its doctrine favours, then cut to the materials on hand. Russia pushes artillery and tanks, Iran and Ukraine missiles and drones, Turkey drones, Korea and Japan ships, the US fighters, carriers and submarines. Factory capacity also depends on energy: Japan's runs at 18% of normal without imported energy.
- **Fuel:** a country at war first burns its strategic oil reserves (Japan ~240 days, South Korea 200, the US 130, IEA members 90, most others 20–60). Once they run out, a country that can't produce the oil a rationed war economy needs fights at 50–100% strength and its factories slow down.
- **Taking resources:** conquering, uniting with or buying a country seizes its resources at once and half of its factories. The log says what was seized and which weapons you can now build.
- **AI resource wars:** AI countries do the same. With no trade, a country short of oil or of a material its factories need builds up tension against a weaker neighbour that has it. With a navy, any coastal country within 3,000 km counts. It invades once the tension boils over, and your nations can be the target. AI conquerors pool the resources of everything they take. In testing, oil-poor Spain, Italy, Poland and Turkey went for Libya, and Pakistan for Turkmenistan.
- **Mobilisation:** countries produce 5% of their total-war output in peacetime. At war they mobilise 3 points a day up to 100% (about a month). At war, forces may grow to 130% of their pre-war size, and missile stocks to 150%.
- **Where to see it:** each dossier's *War economy* section shows:
  - each resource: available for arms, what the arms plan needs, and how much of it is covered;
  - every weapon's yearly output and what limits it;
  - oil and reserve days;
  - what the country lacks, with the largest producers to take it from.

  Rankings add *War production*.

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
  - **Named installations for every country** (`js/deployments-detail.js`): about 5,100 more bases, so every country is mapped installation by installation. The map now has about 6,950 bases, up from 1,861. The US has about 790 (its hand-researched 413 plus about 380 mapped airfields, naval stations, Guard and Reserve bases and barracks), China about 515, Russia about 330, the UK 240 and Germany 214. The bases come from two sources:
    - **Hand-researched (about 360):** individual air bases, naval and submarine bases, corps, divisions and brigades, missile bases (e.g. the PLA Rocket Force's Bases 61–66), training areas and forces abroad. About 210 were snapped to their mapped site in OpenStreetMap via Nominatim.
    - **From OpenStreetMap (about 4,700):** every named military base, airfield, naval base and barracks, pulled through the QLever OpenStreetMap endpoint with their centre points and countries. English names are used where OpenStreetMap has them, with the local name in the note. Skipped:
      - sites tagged disused or abandoned, and closed, former, historic or destroyed ones;
      - police sites, research vessels, individual ships and university buildings;
      - sites run by another country's forces (US bases abroad are in the US data);
      - sites in territory the country doesn't hold (occupied Crimea and Donbas, Abkhazia and South Ossetia, Transnistria, Northern Cyprus).

    A new base near an existing one, with a shared name or at the same site, is dropped as a duplicate. The new bases' weights are capped so they refine each country's researched distribution: at most 35% of ground forces and 60% of aircraft and ships, or 20% and 35% for the US, whose rows carry real personnel counts. Older catch-all rows such as "Fujian & Zhejiang air bases" keep only a quarter of their aircraft where the real air bases are now listed. Installation data © OpenStreetMap contributors, available under the Open Database License (ODbL).
  - **Even more installations, toward US-level detail** (`js/deployments-osm.js`): about 4,250 more bases for 157 countries, taking the map from about 6,950 to about 11,200.
    - **Source:** every named military area in OpenStreetMap (`landuse=military`) that wasn't already covered. Each site was placed in its country against the game's own borders and classified by its name in many languages: missile bases, air bases, naval bases, garrisons and barracks, headquarters, training areas, academies, depots, and radar and signals sites.
    - **Examples:** Saudi Arabia goes from 29 to 78 bases (Al-Watah and Al Sulayyil missile bases, Dirab and Khasm Alan air bases, named infantry and air-defence battalions), Iran from 140 to 366, South Korea from 100 to 300, and China and Russia to 700 each, like the US.
    - **How many per country:** each country is filled up to a density set by its active troops (0.6 bases per thousand troops, between 40 and 700).
    - **Left out:** police, border guards, interior-ministry troops, coast guards, companies, hospitals and other civilian sites, historic and former sites, foreign-run bases and occupied ground.
    - **Duplicates:** sites within 2 km of an existing base, or with the same name within 25 km, are skipped.
    - **Weights:** the new rows take at most 35% of a country's ground weight and 50% of its air and naval weight, so its researched distribution stays in charge.
    - Countries whose militaries are barely mapped, such as Ukraine (scrubbed from maps in wartime), Ethiopia and Eritrea, gain only a little. Map data © OpenStreetMap contributors (ODbL).
  - **Assessed bases where the real ones aren't public** (`js/deployments-assessed.js`): about 1,800 more sites for the 26 countries whose militaries are still thinly mapped. Every one is labelled *assessed (not public)* with its reason. They are the **most likely** places, not the best ones, chosen from evidence in this order:
    1. **Known past garrisons.** Ukraine's publicly documented 2021 order of battle, outside occupied ground: brigade towns such as Kolomyia, Kryvyi Rih, Yavoriv, Bila Tserkva and Mukachevo, air bases such as Myrhorod, Vasylkiv and Ivano-Frankivsk, air-defence regiments, training centres and command headquarters.
    2. **Its existing known bases.** Forces most likely stay in and around established garrison towns.
    3. **Its basing patterns:**
       - one garrison in most provinces, in a real town (15,000+ people, or 5,000+ next to an established garrison);
       - air-force detachments at large dual-use airports, about one per 30 aircraft;
       - extra forces near the border with a rival (Ukraine facing Russia and Belarus, North Korea facing the South, Pakistan and India).

    Sites are picked in order of likelihood and kept at least 20 km apart (10 km in North Korea and Eritrea, the most militarised states). Their weights are capped at 30% of a country's ground forces and 35% of its aircraft, so the known bases stay in charge. Examples: Ukraine 59 → 372, North Korea 126 → 292, Pakistan 138 → 396, India 455 → 700, Egypt 81 → 172, Ethiopia 15 → 96. Towns and airports © OpenStreetMap contributors (ODbL).
  - **Assessed air and naval bases, worldwide** (`js/deployments-assessed-air-naval.js`): calibrated against the US, the best-mapped military. The US runs about 62 aircraft per mapped air site and 13 vessels per naval site.
    - **Air:** nearly every country's air force is already mapped at that density or better. The 24 assessed air bases go only where a fleet still lacks sites (Israel, the UAE, Taiwan and a few others): airfields OpenStreetMap tags as military or joint use first, then major airports near the air force's existing bases.
    - **Naval:** the real gap. Each navy gets about one site per 13 warships and submarines, as the US Navy runs, which adds 160 assessed naval stations across about 40 countries. Candidates, most likely first:
      - harbours named as naval or military;
      - seaports on the coast where the fleet is already based;
      - then the biggest seaports.
    - **Rules for naval stations:**
      - every one passes a coast test: open water within 20 km;
      - river ports, dry ports, container depots, company terminals, shipyards, fishing harbours and marinas are left out;
      - each is named after its town, with the port in the note.
      - Where a country's ports are barely mapped (North Korea), the navy falls back to the larger coastal towns on its fleet's coast.
    - **Weights:** assessed sites take at most 35% of a country's aircraft or ships, so the known bases stay in charge.
    - North Korea's and Eritrea's assessed garrisons also accept towns of 5,000+ people, since OpenStreetMap rarely lists town sizes there.
  - **Missile and air-defence sites** (`js/deployments-assessed-strategic.js`): every country's bases now show its ballistic-missile launchers and air-defence batteries, at named sites (counts in `js/missiles.js`).
    - **Missile launchers:** about one per 6 ballistic missiles in stock. Russia's ~900 Iskander missiles ≈ 150 launchers in 12 brigades.
    - **Air-defence batteries:** the air-defence rating × (1 + 2.5 × log of the army's size). That gives the US ≈45 Patriot and THAAD batteries, Russia ≈40 S-300/400 battalions, Israel 34, and small states 2–3.
    - **Where they go:** launchers sit at sites named as missile units and batteries at sites named as air-defence units, never at air or naval bases whose notes merely mention missiles. Known sites get double shares. The US uses its public posts: Patriot and THAAD battalions at Fort Bliss, Fort Sill, Fort Cavazos, Fort Liberty, Fort Stewart and JBLM, and HIMARS and ATACMS brigades at Fort Sill, Fort Liberty, JBLM, Fort Carson and Fort Campbell.
    - **Assessed sites:** where a country's known sites fall short of its arsenal (one missile-brigade site per 12 launchers, one air-defence site per battery), about 1,200 assessed sites go where they most likely are, not where they'd be best:
      - **missile brigades** at existing army garrisons, preferring known ones, clustered with known missile bases, within range of a rival (150–700 km) but back from the border. India's go to its corps towns: Mathura, Dimapur, Guwahati, Dehradun.
      - **air-defence batteries** ring what gets defended first: the capital (several when a country has many batteries), then its biggest cities, main air bases, naval bases and missile sites, 8–15 km out. Russia's guard Moscow, St Petersburg, Engels bomber base and the Northern Fleet; Israel's ring Jerusalem.
  - **Radar and early-warning sites** (`js/radars.js`, `js/deployments-assessed-radar.js`): every country now has an air-surveillance radar network.
    - **How many each needs:** √(area) ÷ 80 × (0.5 + air-defence rating ÷ 12). That's about 56 for Russia, 45 for the US, 41 for China, 22 for India, 7 for Germany and 2 for Israel.
    - **Known sites first:** the radar stations already mapped, such as the UK's remote radar heads and Russia's and China's radar companies and brigades, plus the public strategic early-warning radars at their real sites:
      - US: Clear, Beale, Cape Cod, Cavalier and Shemya (Cobra Dane);
      - UK: RAF Fylingdales;
      - Russia: eleven Voronezh, Daryal and Don-2N radars, from Lekhtusi and Armavir to Mishelevka and Sofrino;
      - China: the large phased-array radars at Korla, Shuangyashan and Lin'an;
      - Japan: four J/FPS-5 radars and two US AN/TPY-2 radars;
      - Israel: Mount Keren and Green Pine;
      - Turkey: Kürecik;
      - Norway: Vardø;
      - Taiwan: the Leshan PAVE PAWS radar.
    - **Assessed sites:** about 880 assessed radar stations fill each network where radars most likely are: beside air-defence sites and air bases (control and reporting centres), facing a rival's border, and spread to cover the country, at least 150 km apart and about 5 km from the base they serve. Germany's sit from Berlin to Helgoland; the US network runs from Key West to Colorado Springs.
    - **On the map:** bases list their air-surveillance or strategic early-warning radar.
    - **In the game:** air defence works at 60% of its rating with no radar network and in full with complete coverage. Strategic early-warning radars add half a point against incoming missiles. Coverage also helps spot attacks as they launch. Each dossier shows the country's coverage.
  - **Sites fall in war: captured and destroyed.** Every home site (base, air and naval base, missile, air-defence and radar site) can be lost during a war.
    - **Captured:** ground advances take sites front-first, nearest where the invaders came from, in step with the war's progress (up to 85% of a country's sites). Captured sites show red rings.
    - **Destroyed:** missile hits destroy sites. Radars and air defences go first, then missile sites, air bases, naval bases and the rest, as real campaigns open by blinding the enemy. It takes one site per 40 hits, at most two a day per country, because sites are hardened and dispersed and many missiles go at cities. Destroyed sites show grey crosses.
    - **Strike orders:** in a war, any enemy site's card has a *Strike this site* button. It fires your missiles against the site's air defence: radars take 2 hits, air-defence and missile sites 4, air and naval bases 6.
    - **What a lost site costs its owner:**
      - aircraft and ships lose the bases they fly and sail from (down to 40% of their strength);
      - air defence loses its batteries (down to 40%);
      - the missile force loses its launchers (fire rate down to 30%);
      - radar coverage drops with each lost radar.
      - The units at a lost site move to the bases still standing.
    - **Recovery:** destroyed sites are rebuilt 20 days after the owner's wars end, or 45 days if it's still fighting. Captured sites return when the invaders leave, or pass to the conqueror with the country. The dossier tags every lost site, and its card says who took it and when.
- **Forces on the move are animated.**
  - **What they look like:** jets fly in a three-ship V trailing contrails, airlifts show heavy transports, tank columns roll along with track bounce and dust, and ships sail in pairs with wakes. All are drawn as simple top-down silhouettes in their side's colour (yours brass, attackers red, other wars purple).
  - **How they move:** each faces its heading and moves every frame between clock ticks, so movement is smooth rather than jumping once a second. Hover for the force's details, or click to open its target.
- **Ships sail only by sea; vehicles drive only over land** (`js/nav.js`, `js/navgrid.js`).
  - **The grid:** a 0.5° land/sea grid rasterised from the map's own coastlines. The canals and narrow straits ships really use are open: Suez, Panama, the Bosphorus and Dardanelles, Gibraltar, the Danish straits, Kerch, Bab-el-Mandeb, Hormuz, Singapore, Messina and the Taiwan Strait.
  - **Routes:** found by A* search and straightened wherever a direct line stays on the same surface.
  - **Warships:** they sail from the nearest water, or their country's coast facing the target, to the target's coast facing them. Russian ships reach Syria through the Black Sea and the Bosphorus; US ships to Venezuela leave from Puerto Rico; Chinese fleets cross the Pacific. Landlocked countries can't be reached by sea at all. Inland seas don't connect to the ocean, so the Caspian states' fleets stay in the Caspian.
  - **Tanks and other vehicles:** they drive overland along a land path. Across water they drive to their own coast, ride the army's ships (sealift: about 2 days to load and unload), and drive inland from the landing beach. Airlifts fly direct in heavy transports.
  - **Travel times:** they use the real path lengths. Moves between your own bases follow the same rules: ships by sea, ground units by road, or by ship where water lies between.
  - **The AI:** it only launches invasions along a real route.
  - **On the map:** route lines follow the paths. The animated force changes as it goes: a tank column to the coast, ships at sea, tanks again ashore.
- **Detection time: how long until a country realises it's being invaded.** Several ways of noticing race each other, and the fastest wins:
  - **Agents inside the attacker:** its spy network there sees the orders, often before the troops move.
  - **Satellite and reconnaissance imagery:** spots columns and fleets forming up.
  - **Radar:** sees aircraft in minutes on a modern network (far slower with weak air defences), and ships as they near the coast.
  - **Civilians:** report troops at the border on their phones. Wealthier countries are more connected, and denser populations have more eyes.
  - **General intelligence analysis:** the slow backstop.

  Allies in a bloc with the US or UK share warnings. The attacker's counter-intelligence and deception slow everything but radar and civilians. Examples for a three-day ground invasion: Israel spots an Iranian move in about 2 hours (its agents), Ukraine a Russian one in 12, Estonia in 33 (satellites), and Mali only near the end.

  An attack stays hidden on the map until it's noticed, and the warning says what noticed it and how long after it set off. If nothing notices before it lands, it's a surprise attack: the defenders fight at ×0.85 in the first round, and that works for your attacks too. Attack forecasts tell you whether you'd arrive unnoticed, and every dossier shows how fast that country would spot an invasion and an air strike.
- **Military philosophy: every nation fights, and supplies its forces, its own way** (`js/doctrine.js`). 24 doctrines, each from that military's real thinking:
  - **US** joint all-domain combined arms: air power first, a combined-arms bonus, expeditionary sealift and airlift.
  - **UK, France, Australia** expeditionary quality forces; **NATO Europe** mission command with host-nation support; **Poland and Greece** a heavy armoured shield.
  - **Russia** deep battle and mass fires: artillery +25%, commits 30% more to an attack, rail-bound supply.
  - **China** systems-destruction warfare: missile salvos +40%, anti-access at sea, opening shock.
  - **Israel** pre-emption and the decisive short war: +25% in the first 10 days, tiring after a month.
  - **Iran** asymmetric mosaic defence: missiles +50%, drones +30%, hard to occupy.
  - **North Korea and Eritrea** fortress state; **Vietnam, Cuba, Afghanistan, Venezuela and others** people's war (home +30%, resistance +50%).
  - **The Nordics, Baltics, Switzerland, Austria, Singapore and Indonesia** total defence; **Taiwan** porcupine; **Ukraine** drone-enabled mission command (drones +40%); **Turkey and Azerbaijan** drone-led combined arms.
  - **India** Cold Start; **Pakistan** offensive defence; **South Korea** kill chain; **Japan** exclusively defence-oriented.
  - **Gulf monarchies** bought air power; **Egypt, Iraq and others** positional mass; **much of Africa** light infantry; **Latin America** internal security first; **small states** constabulary forces.

  **What a doctrine does:**
  - multipliers for each kind of unit in attack and defence;
  - strength on home ground or abroad;
  - an opening shock or long-war fatigue;
  - a combined-arms bonus when a force mixes ground, air and naval power;
  - missile fire rate and drone edge;
  - how hard its people resist an occupier;
  - how much of its army the AI commits;
  - defensive doctrines never start wars of choice.

  **Supply methods**, which change the strain of fighting far from home:
  - **Expeditionary:** barely notices the sea, and lives on pre-positioned stocks for its first 10 days at war.
  - **Rail-bound:** strong within 800 km of its railheads and poor beyond them; Russia's armies keep 98% of their strength at 500 km but 79% at 2,000 km.
  - **Joint logistic support force:** strong within 1,500 km.
  - **Short interior lines.**
  - **Host-nation support:** strong next to its allies.
  - **Territorial depots.**
  - **Light and irregular:** modest needs but poor reach (65% overseas).
  - **Contractor-run.**

  **Where to see it:** each dossier explains the doctrine and supply method, and attack forecasts show both sides' doctrine multipliers.
- **Ports: ships dock only where a port can take them.** Every base has a harbour class, or none:

  | Class | Berths | Carriers |
  |---|---|---|
  | Major deep-water naval base | 60+ | yes |
  | Naval base | 25+ | no |
  | Naval station | 10+ | no |
  | Small harbour | 4 | no |

  - **Capacity:** each port also has room for the fleet it really hosts (×1.3). For example, Naval Station Norfolk is a major base with 91 berths.
  - **Moving ships:** they can only go to a base with a port and enough free berths, counting ships already on their way. Carriers dock only at major bases. Bases with no naval role (Fort Carson, say) have no port, and destroyed or captured bases can't take ships.
  - **Building ports:** you can build or upgrade a port at any of your coastal bases (open water within about 55 km) from its base card:

    | Port | Coins | Days |
    |---|---|---|
    | Harbour | 150 | 7 |
    | Naval station | 500 | 20 |
    | Naval base | 2,000 | 45 |
    | Major base | 8,000 | 90 |

    Better logistics build faster, and the log reports when the port opens. Every base card shows its port, berths in use and whether carriers can dock.
- **Air forces, artillery and air defence, by model** (`js/airspecs.js`).
  - **Aircraft specs:** every fighter, attack jet and bomber has researched specs (role, generation, combat radius, payload, top speed, air-to-air and air-to-ground ratings, rounded public figures) for about 70 types, from the F-22, F-35, Su-57 and J-20 down to MiG-21s, F-5s and Super Tucanos, plus the B-52, B-1, B-2, Tu-95, Tu-160, Tu-22M3 and H-6.
  - **Air profiles:** each air force gets a count-weighted profile. Examples of air-to-air ratings: US 7.7, Israel 8.0, China 6.9, Russia 5.8, North Korea 2.5. The profile also covers the strike and close-air-support share and jet reach: combat radius, ×2.2 for air forces with aerial refuelling, ×1.2 without. That reach now limits how far fighters can strike from a base.
  - **Artillery:** each army's guns and rockets have range and precision, from HIMARS (80 km, guided) and PzH 2000 (40 km) to D-30s (15 km).
  - **Air defence:** the air-defence rating, battery count and systems are shown in every dossier.
  - **In every battle**, four contests shift the day's odds:
    - the air superiority contest (air-to-air ratings, with the defender's radar ×1.2 at home);
    - the defender's air defence against the attacker's aircraft (−4% of the air share per point);
    - close air support against a ground-heavy defender;
    - the artillery duel (longer range and precision win counter-battery fire).
  - **Plane audit:** the fighter and aircraft mixes were checked against public inventories. US bombers were fixed from 520 to 140 (76 B-52H, 45 B-1B, 19 B-2A), along with Russia's (about 130), China's H-6 (about 230) and North Korea's Il-28/H-5 (about 80). Every model mix splits exactly into each country's totals, and every country's planes, ships and vehicles at its bases add up exactly to its national totals.
  - **Base audit:** all 15,409 bases were checked for missing, negative or impossible values. Ships are no longer placed at inland bases unless they are named river or lake flotillas. Carriers deployed at sea now belong to their fleet's main base: the USS Ford's air wing had landed on an Army Reserve centre in Puerto Rico.
- **What each weapon and soldier can really do** (`js/groundspecs.js`, `js/airspecs.js`, `js/models.js`). Every model's combat value now comes from its own abilities, not just its family:
  - **Tanks** (160 models): firepower, protection (armour, reactive armour, active protection), mobility, and sights and fire control, each 0–10. Examples: T-55 ×0.45, T-62M ×0.57, T-72B3 ×1.05, Leopard 2A4 ×1.29, M1A1 ×1.43, Type 99A ×1.51, K2 ×1.72, Merkava Mk4 ×1.77, M1A2 SEPv3 ×1.8.
  - **Armoured vehicles** (217 models): firepower, protection, mobility and anti-tank missiles. Examples: M113 ×0.45, MRAP ×0.54, Stryker ×0.69, BMP-2 ×0.77, ZBD-04A ×1.12, Bradley ×1.18, Puma ×1.49.
  - **Artillery:** range and precision. Examples: D-30 ×0.7, Grad ×0.76, M777 ×1.28, PzH 2000 ×1.3, HIMARS ×1.68.
  - **Jets:** air-to-air and air-to-ground ratings and generation, with stealth ×1.4. Examples: F-5 ×0.48, MiG-21 ×0.51, A-10 ×0.77, F-16C and Su-35 ×1.26, Rafale ×1.44, J-20 ×1.83, F-35 ×2.09.
  - Hover any unit at a base to see its ratings.
  - **Infantry** quality depends on each army's training, recent combat experience and kit (night vision, body armour, anti-tank and anti-air missiles, drones), from ×0.92 to ×1.16. About 70 armies are profiled: the US, Britain and Israel at ×1.15, Ukraine ×1.10, Russia ×1.05, China ×0.99, North Korea and Taiwan ×0.95. It is shown in the dossier.
- **Every major military by the analysis, not its claims.** Sources: IISS Military Balance 2025, the US DoD China report, Oryx-confirmed losses, FAS, RUSI, CSIS, and national audit and parliamentary reports.
  - **China:** ~2,100 combat jets (not 1,580) and ~1,000 helicopters. Armour is counted the IISS way (17,000), not Global Firepower's trucks (35,000). About 210 H-6 bombers.
  - **Russia:** netted against Oryx-confirmed losses: 3,300 tanks, 6,000 guns, 1,000 jets, 1,300 helicopters, 51 submarines, ~1.3 million active and 5,459 warheads.
  - **Others:** armoured-vehicle counts corrected for Britain, France, Germany, India, Poland, South Korea and Egypt; fighters for Britain, France, Israel and Egypt.
  - **Readiness reflects real training and maintenance, with the reason in each dossier**, for about 45 countries. China 0.70 (no war since 1979, "peace disease", 2025 purges). Britain 0.70 (hollowed force). Canada 0.55 (2024 readiness crisis). Saudi Arabia 0.50 (performed poorly in Yemen). Taiwan 0.60. Germany 0.60. Iran 0.45. South Africa 0.40. Venezuela 0.30.
  - **Training lowered where claims outrun reality:** Russia 4, China 6, Taiwan 4, Saudi Arabia 4, Egypt 4, Iran 4, North Korea 3 and others.
  - **Missiles:** Iran after the June 2025 war (~1,500 ballistic missiles left, air defence 2.5). Russia's air defence is 6, since it still misses many Ukrainian drones.
  - **Smaller militaries:** about 100 countries whose readiness was only estimated from wealth are now corrected by their known training and corruption, so a rich kleptocracy's paper army no longer counts as ready.
- **Countries don't know who is inside them.** Foreign spy networks and special-forces teams stay hidden until the target's counter-intelligence uncovers them.
  - **Tradecraft decides how fast they are found.** Each service has a historical record of staying hidden (0–10, `js/spies.js` TRADECRAFT):
    - **Cuba 9.5:** Ana Montes inside US intelligence for 17 years, Manuel Rocha for 40.
    - **Britain and Israel 8.5.**
    - **China and Ukraine 7.5:** Ukraine prepared Operation Spiderweb inside Russia for 18 months.
    - **US and Russia 7:** Ames and Hanssen, but also the 2010 illegals roll-up, the GRU's Skripal team, and the CIA's lost China network.
    - **Iran 3.5:** plots foiled again and again. **Saudi Arabia 3:** the Khashoggi team was identified within days.
  - **No dice: exposure builds every day.** It builds faster against strong counter-intelligence, for bigger networks, and above all for services with a poor record (a 9 is found about 30× more slowly than a 3). Every operation and sabotage adds to it, and so does every sweep. At 100 the network is found and loses half its agents, or the team is killed or captured. A Cuban network in the US lasts about 13 years; an Iranian one about 9 months.
  - **Homeland security and stability count too** (`js/spies.js` HOMELAND, about 75 countries researched, the rest estimated from wealth, counter-intelligence, corruption and war). Alert (0–10) is how closely a state watches its own territory: domestic security services, police reach, cameras, border and financial monitoring, and a public primed to report strangers. Stability (0–10) is whether the state holds together: chaos, war and collapse let outsiders move unnoticed. Detection speed is ×(0.4 + 0.08·alert) × (0.4 + 0.07·stability):
    - **US ×1.03:** alert 9.5 from the FBI's terrorism task forces, DHS, 18,000 police agencies and post-9/11 suspicious-activity reporting; stability 7.
    - **China ×1.15:** 600+ million cameras.
    - **Britain ×1.04, Russia ×0.85, Israel ×0.89, Iran ×0.65.**
    - **Collapsed states ×0.23–0.26:** Sudan, Haiti, Mali.
  - Each dossier shows the country's alert, stability and detection speed.
  - **Border security** (`js/spies.js` BORDERS, about 95 countries researched, the rest estimated). Land frontier, coasts and points of entry are each rated 0–10.
    - **Spies** come and go through airports and ports, so their exposure is ×(0.8 + 0.04·entry).
    - **Special-forces teams** slip in by the weakest route, land or sea. Crossing in starts them 60 × (weakest/10)² × (1 − cover/11) of the way to being found: up to ~30% into North Korea or Israel, almost nothing into a porous state. Their resupply exposure is ×(0.8 + 0.04·weakest).
    - **Invasions:** border guards and coastal watch are now one of the ways an invasion is spotted.
    - **The US:** land 7 (the most watched southern border in the world yet ~2 million crossings a year at the 2022–23 peak, and a lightly watched Canadian border), coasts 8, entry 9.5 (biometrics and visa vetting).
    - **Others:** North Korea 10/8/10, Israel 8/9/9.5, Britain's open Irish border and small boats 4/7/9, Schengen's open land borders 4–5, Libya and Somalia 1.
  - **What you see:** your Intel tab, the dossiers and the world spy-war list only show networks that have been exposed. That means publicly known penetrations plus those found during play. Sabotage by an unfound network is "unidentified saboteurs".
  - **Sweeps:** a sweep first hunts for hidden networks and teams, then rolls up only the ones it has found. Services with a strong record may survive several.
  - **Your own networks:** each shows whether the target knows about it and roughly how many days it has left.
  - **Covert special-forces teams.** Slip a team into any country from the Intel tab or the dossier.
    - **Benefits:** while undetected it gives +2 to raids there and ×1.5 to your special forces in battles there.
    - **Cover:** its cover is your services' tradecraft plus the unit's quality, against the country's counter-intelligence. Delta stays hidden in Russia for about 680 days; an IRGC Quds Force team in the US lasts weeks to months.
    - **If found:** its operators are killed or captured, the unit is out for 14 days, and a country you aren't at war with turns hostile.
    - **Hostile powers do the same to you:** their teams sit in your nations unseen. Once at war they destroy a site every 12 days ("unidentified commandos") until your counter-intelligence finds them.
- **United States, by the analysis and not just the official figures.** Sources: IISS Military Balance 2025, the Air & Space Forces almanac, Navy and Marine Corps aviation plans, CRS, GAO mission-capable reports, FAS and the Heritage Index.
  - **Personnel and ground forces:** 1.316 million active.
    - **Tanks:** 4,640 Abrams. About 2,640 are active (≈750 SEPv3, ≈1,600 SEPv2, Guard M1A1 SA) and about 1,550 sit in storage at Sierra Army Depot, so fewer of them are ready.
    - **Armoured vehicles:** 45,600, including ~22,000 JLTVs, ~9,000 MRAPs, Bradleys, Strykers and AMPVs; old M113s are in storage. The Marine amphibious vehicle count was cut from 5,000 to its real ~1,100.
    - **Artillery:** 2,520 pieces: 671 self-propelled, 1,212 towed and 641 rocket launchers (~440 HIMARS).
  - **Air forces:**
    - **Fighters:** 2,930 by model: ~690 F-35s, ~830 F-16s, ~540 Super Hornets, ~310 F-15s, 183 F-22s, ~210 A-10s and the retiring Hornets and Harriers.
    - **Other aircraft:** ~4,980, including 141 bombers (76 B-52, 45 B-1, 19 B-2), ~520 tankers, 454 Ospreys, 161 Growlers, 129 P-8s and ~470 large drones.
    - **Helicopters:** 5,840.
  - **Navy and Coast Guard:**
    - **Ships:** 440: the Navy battle force (74 Burkes, 7 Ticonderogas, 3 Zumwalts, 9 big-deck amphibs, 25 LCS...) plus ~230 Coast Guard cutters.
    - **Submarines:** 69: 24 Virginia, 24 Los Angeles, 3 Seawolf and 18 Ohio.
    - **Carriers and warheads:** 11 carriers; 5,177 warheads (FAS: 3,700 in the stockpile plus those awaiting dismantlement).
  - **Readiness 0.8 rather than 0.9,** following GAO and the Heritage 2025 Index, which rates the Air Force "very weak" and the Navy "weak". Mission-capable rates now match the reports:
    - F-35 ~50% and F-22 ~48%
    - B-1 ~39%
    - attack submarines ~58%, since about a third are in or waiting for maintenance
    - armour ~82%
  - **Missiles and air defence:**
    - **Cruise missiles:** ~8,300, after the 2024–25 strikes on the Houthis and Iran.
    - **Ballistic missiles:** ~1,200: ATACMS depleted by transfers to Ukraine, plus PrSM and the first Dark Eagle battery.
    - **Air defence 7:** about a quarter of all THAAD interceptors were fired defending Israel in June 2025, and the homeland has thin cruise-missile defence.
  - **Special forces:** counted as operators, not total personnel: Delta ~400, DEVGRU ~300, the ISA and the 24th STS added. The 82nd and 101st Airborne and the 173rd are added too, since Ukraine's air-assault forces and Russia's VDV were already counted.
- **Helicopters were counted twice, for every country.** Aircraft totals (Global Firepower-style) already include helicopters, but "other aircraft" was the total minus fighters only, so every helicopter was also counted as a transport, trainer or drone. Other aircraft is now the total minus fighters minus helicopters. Bomber shares were rescaled to keep the real counts: Russia ~98, China's H-6 210, North Korea's Il-28 80.
- **Special forces** (`js/specialforces.js`). 145 real units in 79 countries, each with operators, a training rating, a proven-record rating and its record. Examples: Delta Force (al-Baghdadi raid), DEVGRU (the bin Laden raid), 22 SAS (Iranian Embassy siege), Sayeret Matkal (Entebbe), GIGN (Air France 8969), GSG 9 (Mogadishu), GROM (Umm Qasr), Colombia's AFEUR (Operation Jaque), Peru's Chavín de Huántar rescuers, Iraq's Golden Division (Mosul), Ukraine's SSO and HUR, Russia's KSSO (Crimea) and the VDV (Hostomel), China's untested brigades and North Korea's mass light infantry.
  - **Proven record carries most of the weight.** Quality = 35% training + 65% proven record, and effective strength = operators × quality⁶. A few hundred proven operators outweigh tens of thousands of untested ones. Failures count against a unit: FSB Alpha's hostage deaths at Beslan, the failed Hostomel assault, Egypt's 1978 Larnaca raid. Countries without a researched profile get an estimate from their army's size and readiness.
  - **In every battle** the two sides' special forces contest reconnaissance, raids and target designation behind the lines, up to ±7% each way. Half the contest is effective strength and half the quality of each side's best unit; the defender gets ×1.25 on home ground.
  - **Raids:** at war, open any enemy base to send your best ready unit on a raid, with no missiles needed and no dice. It succeeds when its quality ×10 (+1 with a spy network of 30+ inside) beats the site's defence: 2 + half its hardness + 4 × the quality of the defender's best unit. Units rest 2 days after a raid and 7 after a failure.
  - **Counter-insurgency:** a ruler's special forces slow unrest in the lands it rules by up to 25%.
  - **Dossier:** each country's dossier lists every unit with its record, its strength rank and its best-unit quality rank.
  - **Battle scenes:** special-forces teams operate behind enemy lines, laser-marking guns, air defence and armour for guided bombs. Better units mark targets more often.
- **Maintenance in a long war.** On top of the peacetime mission-capable rate and spare-part shortages:
  - Engines, tracks, gun barrels and airframes wear out faster than depots can turn them round. Over the first month of a war, availability sinks to a level set by the country's maintenance capacity (readiness and depot skill).
  - Helicopters wear fastest, then jets, guns and armour; ships wear least. After a month, the US keeps 95% of its helicopters in action, Russia 80% and Saudi Arabia 71%.
  - The dossier shows each country's war wear.
- **Battle scenes show it.** Units down for maintenance sit the battle out, parked grey at the back or on the airfield. Better kit fires faster. Tanks, armoured vehicles (with anti-tank missiles where they carry them) and infantry now fire directly. The legend gives each kind's quality and how many are in maintenance.
- **Surrender.** A country losing badly to a far stronger enemy may capitulate rather than fight to the end.
  - **Diehards never surrender:** countries with patriotism 9–10 (Ukraine, Israel, Finland, North Korea, Vietnam, the Baltic states, Armenia, Azerbaijan, Georgia, Eritrea...) or a people's-war or fortress doctrine fight until conquered.
  - **Everyone else weighs will against pressure.**
    - Will: 40 + 4 × patriotism, +15 with treaty allies coming, more against a hated invader.
    - Pressure: 25 × log2 of the power ratio + 70 × the war's progress + 0.3 a day.
    - It surrenders when the pressure beats its will, the enemy is at least 3× stronger and its defences are 30% broken.
  - **Afterwards:** a surrendered country passes to the victor with 60% of its forces and is less resentful than a conquered one. Dossiers say whether a country is diehard.
- **Real supply methods.** Each military's logistics now follows how it really works, with the reason shown:
  - US TRANSCOM, sealift and pre-positioned stocks;
  - Russia's railway troops, with supply collapsing beyond the railheads;
  - China's Joint Logistic Support Force;
  - Turkey's own logistics command;
  - Ukraine's railways fed through Poland and Romania;
  - the Bundeswehr's spare-parts shortfalls;
  - Saudi Arabia's contractor dependence, and more.
  - More countries now have an explicit doctrine.
- **Battle scenes.** *Watch the battle*, on any country being fought over, opens a side-on view of the day's fighting.
  - **Icons:** each one is one unit of its kind: a tank, armoured vehicle, gun, infantry squad, jet, helicopter or anti-aircraft launcher. The legend says how many real units it stands for.
  - **The action:** artillery fires arcing shells, anti-aircraft guns and missiles fire at aircraft, jets make strafing passes, and icons are knocked out in proportion to the day's real losses.
  - **The setting:** the ground follows the country's terrain and weather, and the sky its day or night.
  - **The summary:** it gives the odds and the air, air-defence and artillery contests.
  - **Sea and air battles too.** Tabs switch between the land, sea and air sides of a battle. The scene opens on the attack's own kind: a fleet's sea battle, an air-only strike's air battle, otherwise the land battle.
    - **Sea:** warships, carriers launching jets and submarines below the surface. Ships fire anti-ship missiles that skim the waves, submarines fire torpedoes, and close-in guns and missiles fire at aircraft. Ships that are hit burn and sink.
    - **Air:** modern air combat is fought mostly beyond visual range. Fighters hold patrol lines on their own side and trade lofted long-range radar missiles. Only late in the fight, and less often between modern air forces, do survivors close in for a within-visual-range merge with short-range missiles and guns. Each side's beyond-visual-range share comes from its air force's generation. Bombers and drones strike ground targets, and surface-to-air missiles climb from below.
  - Countries without a researched profile get a modelled estimate based on their budget and economy. The card labels each profile as either "researched profile" or "modelled estimate".

"Secret assets" are, by definition, not public. These numbers are informed open-source estimates for a game. They are not intelligence.

Terrain: NASA Earth Observatory Blue Marble Next Generation (topography and bathymetry, December 2004, by Reto Stöckli, public domain). Base coordinates partly from OpenStreetMap (© OpenStreetMap contributors, ODbL). Map: Natural Earth 1:50m via [world-atlas](https://github.com/topojson/world-atlas); states and provinces from Natural Earth 1:10m admin-1 (public domain), simplified with mapshaper. Libraries: [d3](https://d3js.org) and [topojson-client](https://github.com/topojson/topojson-client), all ISC-licensed (see `vendor/`).
