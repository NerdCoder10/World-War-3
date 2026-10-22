// Named capital ships: aircraft carriers, big-deck amphibious ships and fleet flagships, placed
// where they were in 2025 (home port, shipyard or deployment area) from public reporting.
// Deployments change week to week, so treat positions at sea as approximate.
//
// Each ship: hull number, name, country, kind ("carrier" | "amphib" | "command"), class,
// position [lon, lat], where it is, status, and approximate capabilities:
//   disp   full-load displacement (tonnes)     len   length (m)          kn   top speed (knots)
//   air    aircraft carried (typical air wing) crew  ship's company + air wing
//   power  propulsion                          year  commissioned (or expected)
// `active: false` marks ships not in service (fitting out, long overhaul, laid up); they appear
// on the map and in the dossier but are not counted as ready.
window.FLEET = [
  // ── United States: 11 carriers in commission + John F. Kennedy fitting out ──
  { hull: "CVN-78", name: "USS Gerald R. Ford", nat: "USA", kind: "carrier", cls: "Gerald R. Ford", at: [-66.4, 17.6], where: "Caribbean Sea (deployed, late 2025)", status: "Deployed", active: true,
    disp: 100000, len: 337, kn: 30, air: 75, crew: 4550, power: "2 × A1B nuclear reactors", year: 2017, note: "EMALS electromagnetic catapults, advanced arresting gear, about a third more sorties a day than a Nimitz." },
  { hull: "CVN-79", name: "USS John F. Kennedy", nat: "USA", kind: "carrier", cls: "Gerald R. Ford", at: [-76.437, 36.982], where: "Newport News Shipbuilding, Virginia (fitting out)", status: "Fitting out — delivery expected 2027", active: false,
    disp: 100000, len: 337, kn: 30, air: 75, crew: 4500, power: "2 × A1B nuclear reactors", year: 2027, note: "Second Ford-class carrier. Built from the start to operate F-35C and with the Enterprise Air Surveillance Radar; EMALS and advanced arresting gear. Ready figures here are approximate." },
  { hull: "CVN-68", name: "USS Nimitz", nat: "USA", kind: "carrier", cls: "Nimitz", at: [114.5, 14.5], where: "South China Sea (final deployment, 2025)", status: "Deployed — last deployment before retirement", active: true,
    disp: 101600, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1975, note: "Lead ship of the class, due to retire in 2026." },
  { hull: "CVN-69", name: "USS Dwight D. Eisenhower", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-76.297, 36.818], where: "Norfolk Naval Shipyard, Portsmouth, Virginia", status: "In maintenance", active: false,
    disp: 101600, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1977, note: "Back from the 2023–24 Red Sea deployment against Houthi attacks." },
  { hull: "CVN-70", name: "USS Carl Vinson", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-117.195, 32.707], where: "NAS North Island, San Diego", status: "In port", active: true,
    disp: 101600, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1982, note: "First carrier air wing with F-35C and CMV-22B. Middle East deployment in 2025." },
  { hull: "CVN-71", name: "USS Theodore Roosevelt", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-117.197, 32.709], where: "NAS North Island, San Diego", status: "In port", active: true,
    disp: 104600, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1986, note: "" },
  { hull: "CVN-72", name: "USS Abraham Lincoln", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-117.193, 32.705], where: "NAS North Island, San Diego", status: "In port", active: true,
    disp: 104100, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1989, note: "" },
  { hull: "CVN-73", name: "USS George Washington", nat: "USA", kind: "carrier", cls: "Nimitz", at: [139.664, 35.29], where: "Yokosuka, Japan (forward-deployed)", status: "Forward-deployed", active: true,
    disp: 104200, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1992, note: "Returned to Japan in November 2024 as the Seventh Fleet's carrier." },
  { hull: "CVN-74", name: "USS John C. Stennis", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-76.445, 36.993], where: "Newport News Shipbuilding, Virginia", status: "Mid-life refuelling overhaul (RCOH)", active: false,
    disp: 103300, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1995, note: "Overhaul running late, into 2026–27." },
  { hull: "CVN-75", name: "USS Harry S. Truman", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-76.33, 36.957], where: "Naval Station Norfolk, Virginia", status: "In port", active: true,
    disp: 103900, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 1998, note: "Red Sea deployment 2024–25; lost three F/A-18s." },
  { hull: "CVN-76", name: "USS Ronald Reagan", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-122.637, 47.56], where: "Puget Sound Naval Shipyard, Bremerton", status: "In maintenance", active: false,
    disp: 101400, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 2003, note: "Left Japan in 2024 after nine years forward-deployed." },
  { hull: "CVN-77", name: "USS George H.W. Bush", nat: "USA", kind: "carrier", cls: "Nimitz", at: [-76.329, 36.959], where: "Naval Station Norfolk, Virginia", status: "Working up", active: true,
    disp: 102000, len: 333, kn: 31, air: 64, crew: 5000, power: "2 × A4W nuclear reactors", year: 2009, note: "Last Nimitz-class carrier." },
  // US big-deck amphibious ships and flagships
  { hull: "LHA-7", name: "USS Tripoli", nat: "USA", kind: "amphib", cls: "America", at: [129.713, 33.159], where: "Sasebo, Japan (forward-deployed)", status: "Forward-deployed", active: true,
    disp: 45700, len: 257, kn: 22, air: 20, crew: 2700, power: "Gas turbines", year: 2020, note: "Can operate as a 'lightning carrier' with up to 20 F-35Bs." },
  { hull: "LHA-6", name: "USS America", nat: "USA", kind: "amphib", cls: "America", at: [-117.12, 32.68], where: "San Diego", status: "In port", active: true,
    disp: 45700, len: 257, kn: 22, air: 20, crew: 2700, power: "Gas turbines", year: 2014, note: "" },
  { hull: "LHD-7", name: "USS Iwo Jima", nat: "USA", kind: "amphib", cls: "Wasp", at: [-66.0, 18.6], where: "Caribbean Sea (deployed, late 2025)", status: "Deployed", active: true,
    disp: 41000, len: 257, kn: 22, air: 30, crew: 3000, power: "Steam turbines", year: 2001, note: "Carries the 22nd Marine Expeditionary Unit." },
  { hull: "LHD-8", name: "USS Makin Island", nat: "USA", kind: "amphib", cls: "Wasp", at: [-117.118, 32.684], where: "San Diego", status: "In port", active: true,
    disp: 41700, len: 257, kn: 22, air: 30, crew: 3000, power: "Gas turbines + electric drive", year: 2009, note: "" },
  { hull: "LCC-19", name: "USS Blue Ridge", nat: "USA", kind: "command", cls: "Blue Ridge", at: [139.666, 35.292], where: "Yokosuka, Japan", status: "Seventh Fleet flagship", active: true,
    disp: 19600, len: 194, kn: 23, air: 1, crew: 1100, power: "Steam turbines", year: 1970, note: "Oldest deployable US warship." },

  // ── United Kingdom ──
  { hull: "R08", name: "HMS Queen Elizabeth", nat: "GBR", kind: "carrier", cls: "Queen Elizabeth", at: [-1.109, 50.799], where: "HMNB Portsmouth", status: "In maintenance", active: false,
    disp: 65000, len: 284, kn: 25, air: 40, crew: 1600, power: "Gas turbines + diesel, integrated electric", year: 2017, note: "Ski-jump carrier for F-35B and helicopters." },
  { hull: "R09", name: "HMS Prince of Wales", nat: "GBR", kind: "carrier", cls: "Queen Elizabeth", at: [-1.107, 50.801], where: "HMNB Portsmouth (back from Operation Highmast)", status: "In port", active: true,
    disp: 65000, len: 284, kn: 25, air: 40, crew: 1600, power: "Gas turbines + diesel, integrated electric", year: 2019, note: "Led the 2025 Carrier Strike Group to the Indo-Pacific with 24 F-35Bs." },
  // ── France ──
  { hull: "R91", name: "Charles de Gaulle", nat: "FRA", kind: "carrier", cls: "Charles de Gaulle", at: [5.917, 43.109], where: "Toulon", status: "In port", active: true,
    disp: 42500, len: 261, kn: 27, air: 40, crew: 1950, power: "2 × K15 nuclear reactors", year: 2001, note: "Only nuclear carrier outside the US; Rafale M jets with catapults. Mission Clemenceau 25 to the Indo-Pacific." },
  // ── Italy & Spain ──
  { hull: "C550", name: "Cavour", nat: "ITA", kind: "carrier", cls: "Cavour", at: [17.218, 40.47], where: "Taranto", status: "In port", active: true,
    disp: 30000, len: 244, kn: 29, air: 20, crew: 1200, power: "Gas turbines", year: 2008, note: "F-35B and helicopters." },
  { hull: "L9890", name: "Trieste", nat: "ITA", kind: "amphib", cls: "Trieste", at: [17.222, 40.468], where: "Taranto", status: "In service", active: true,
    disp: 38000, len: 245, kn: 25, air: 15, crew: 1000, power: "Gas turbines + diesel", year: 2024, note: "" },
  { hull: "L61", name: "Juan Carlos I", nat: "ESP", kind: "amphib", cls: "Juan Carlos I", at: [-6.33, 36.624], where: "Rota", status: "In port", active: true,
    disp: 26000, len: 231, kn: 21, air: 25, crew: 900, power: "Diesel-electric with pod drives", year: 2010, note: "Ski-jump for AV-8B Harriers." },
  // ── India ──
  { hull: "R33", name: "INS Vikramaditya", nat: "IND", kind: "carrier", cls: "Kiev (modified)", at: [74.125, 14.813], where: "INS Kadamba, Karwar", status: "In refit", active: true,
    disp: 45400, len: 284, kn: 30, air: 36, crew: 1600, power: "Steam turbines", year: 2013, note: "Former Soviet Admiral Gorshkov; MiG-29K." },
  { hull: "R11", name: "INS Vikrant", nat: "IND", kind: "carrier", cls: "Vikrant", at: [76.262, 9.957], where: "Kochi", status: "In service", active: true,
    disp: 45000, len: 262, kn: 28, air: 30, crew: 1700, power: "Gas turbines", year: 2022, note: "India's first home-built carrier; Rafale M jets ordered." },
  // ── China ──
  { hull: "16", name: "Liaoning", nat: "CHN", kind: "carrier", cls: "Type 001", at: [120.34, 36.03], where: "Qingdao", status: "In service", active: true,
    disp: 60900, len: 305, kn: 30, air: 40, crew: 2600, power: "Steam turbines", year: 2012, note: "Ski-jump; J-15 fighters." },
  { hull: "17", name: "Shandong", nat: "CHN", kind: "carrier", cls: "Type 002", at: [109.548, 18.226], where: "Yulin naval base, Sanya, Hainan", status: "In service", active: true,
    disp: 66000, len: 315, kn: 31, air: 44, crew: 2600, power: "Steam turbines", year: 2019, note: "" },
  { hull: "18", name: "Fujian", nat: "CHN", kind: "carrier", cls: "Type 003", at: [109.553, 18.222], where: "Sanya, Hainan", status: "Commissioned November 2025", active: true,
    disp: 80000, len: 316, kn: 31, air: 50, crew: 2800, power: "Integrated electric (conventional)", year: 2025, note: "China's first carrier with electromagnetic catapults; J-35 stealth fighters and KJ-600 radar planes." },
  { hull: "31", name: "Sichuan", nat: "CHN", kind: "amphib", cls: "Type 076", at: [121.73, 31.24], where: "Hudong-Zhonghua shipyard, Shanghai (sea trials)", status: "Sea trials", active: false,
    disp: 40000, len: 263, kn: 25, air: 30, crew: 1200, power: "Diesel", year: 2026, note: "Assault ship with an electromagnetic catapult for drones." },
  // ── Russia ──
  { hull: "063", name: "Admiral Kuznetsov", nat: "RUS", kind: "carrier", cls: "Kuznetsov", at: [33.064, 68.993], where: "35th Shipyard, Murmansk", status: "Laid up — refit stalled, may be retired", active: false,
    disp: 58500, len: 305, kn: 29, air: 30, crew: 2600, power: "Steam turbines (troubled)", year: 1990, note: "Out of service since 2017; fire in 2019 and a dry-dock accident in 2018." },
  { hull: "099", name: "Pyotr Velikiy", nat: "RUS", kind: "command", cls: "Kirov", at: [33.43, 69.08], where: "Severomorsk (Northern Fleet)", status: "In service, ageing", active: true,
    disp: 28000, len: 252, kn: 32, air: 3, crew: 700, power: "2 × KN-3 nuclear reactors", year: 1998, note: "Nuclear-powered battlecruiser, Northern Fleet flagship." },
  // ── Japan & South Korea ──
  { hull: "DDH-183", name: "JS Izumo", nat: "JPN", kind: "carrier", cls: "Izumo", at: [139.656, 35.293], where: "Yokosuka", status: "Converting for F-35B", active: true,
    disp: 27000, len: 248, kn: 30, air: 20, crew: 470, power: "Gas turbines", year: 2015, note: "" },
  { hull: "DDH-184", name: "JS Kaga", nat: "JPN", kind: "carrier", cls: "Izumo", at: [132.553, 34.234], where: "Kure", status: "Converted for F-35B (2024)", active: true,
    disp: 27000, len: 248, kn: 30, air: 20, crew: 470, power: "Gas turbines", year: 2017, note: "US F-35Bs test-landed in 2024." },
  { hull: "LPH-6111", name: "ROKS Dokdo", nat: "KOR", kind: "amphib", cls: "Dokdo", at: [129.09, 35.1], where: "Busan", status: "In service", active: true,
    disp: 19000, len: 199, kn: 23, air: 10, crew: 700, power: "Diesel", year: 2007, note: "" },
  { hull: "LPH-6112", name: "ROKS Marado", nat: "KOR", kind: "amphib", cls: "Dokdo", at: [129.094, 35.098], where: "Busan", status: "In service", active: true,
    disp: 19000, len: 199, kn: 23, air: 10, crew: 700, power: "Diesel", year: 2021, note: "" },
  // ── Others ──
  { hull: "L-400", name: "TCG Anadolu", nat: "TUR", kind: "carrier", cls: "Anadolu", at: [29.823, 40.724], where: "Gölcük", status: "In service as a drone carrier", active: true,
    disp: 27000, len: 232, kn: 21, air: 30, crew: 900, power: "Diesel-electric", year: 2023, note: "Carries Bayraktar TB3 drones after the F-35B was blocked." },
  { hull: "A140", name: "NAM Atlântico", nat: "BRA", kind: "carrier", cls: "Ocean (ex-HMS Ocean)", at: [-43.17, -22.895], where: "Rio de Janeiro", status: "In service", active: true,
    disp: 21500, len: 203, kn: 18, air: 18, crew: 800, power: "Diesel", year: 1998, note: "Helicopter carrier bought from the UK." },
  { hull: "L1010", name: "ENS Gamal Abdel Nasser", nat: "EGY", kind: "carrier", cls: "Mistral", at: [33.95, 26.74], where: "Safaga (Red Sea)", status: "In service", active: true,
    disp: 21300, len: 199, kn: 18, air: 16, crew: 450, power: "Diesel-electric", year: 2016, note: "" },
  { hull: "L1020", name: "ENS Anwar El Sadat", nat: "EGY", kind: "carrier", cls: "Mistral", at: [29.865, 31.185], where: "Alexandria", status: "In service", active: true,
    disp: 21300, len: 199, kn: 18, air: 16, crew: 450, power: "Diesel-electric", year: 2016, note: "" },
  { hull: "CVH-911", name: "HTMS Chakri Naruebet", nat: "THA", kind: "carrier", cls: "Chakri Naruebet", at: [100.896, 12.662], where: "Sattahip", status: "Rarely at sea", active: true,
    disp: 11500, len: 183, kn: 26, air: 6, crew: 600, power: "Gas turbines + diesel", year: 1997, note: "Smallest carrier in service; Harriers retired." },
  { hull: "L02", name: "HMAS Canberra", nat: "AUS", kind: "carrier", cls: "Canberra", at: [151.227, -33.862], where: "Garden Island, Sydney", status: "In service", active: true,
    disp: 27500, len: 231, kn: 20, air: 18, crew: 1400, power: "Diesel-electric", year: 2014, note: "" },
  { hull: "L01", name: "HMAS Adelaide", nat: "AUS", kind: "carrier", cls: "Canberra", at: [151.228, -33.86], where: "Garden Island, Sydney", status: "In service", active: true,
    disp: 27500, len: 231, kn: 20, air: 18, crew: 1400, power: "Diesel-electric", year: 2015, note: "" },
];
