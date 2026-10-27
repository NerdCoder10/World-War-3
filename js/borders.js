// Border fortification: how hard each land border is to cross, 1 (open) to 10 (the Korean DMZ).
//
// Rated from the real barriers on the ground in 2025: walls and fences, minefields, anti-tank
// ditches and dragon's teeth, bunker lines and the troops that man them. Borders not listed get
// the defending country's general level from BORDER_BASE (2 if it isn't listed: ordinary border
// posts). The rating is the same from both sides.
//
// Effect (js/game.js borderMult): an army invading overland across a border of level L fights at
// 1 / (1 + 0.03 × (L − 2)) of its strength, so the DMZ (10) costs an attacker about 19%. Armies
// arriving by sea or air don't cross it.
window.BORDER_FORTS = {
  "KOR|PRK": [10, "Korean DMZ: a 4 km strip of minefields, fences and tank traps under massed artillery on both sides"],
  "ISR|PSE": [9, "Gaza perimeter barrier and the West Bank separation wall, with a cleared buffer zone"],
  "ISR|LBN": [9, "Blue Line wall, fortified outposts and a buffer zone held since 2024"],
  "ISR|SYR": [8, "Golan Heights fortified line, anti-tank ditch and the buffer zone"],
  "EGY|ISR": [7, "Sinai border fence (245 km) with sensors and patrol roads"],
  "ISR|JOR": [6, "Jordan Valley fence and the new eastern barrier"],
  "RUS|UKR": [9, "The front: belts of trenches, minefields, dragon's teeth and drone kill zones on both sides"],
  "BLR|UKR": [7, "Ukraine's mined and fortified northern border"],
  "IND|PAK": [8, "Line of Control fence and the floodlit Punjab and Rajasthan border fence"],
  "BGD|IND": [6, "India–Bangladesh border fence (over 3,000 km)"],
  "CHN|IND": [6, "Line of Actual Control: forward posts, roads and buffer zones in the Himalaya"],
  "AFG|PAK": [7, "Durand Line fence (2,600 km) with forts"],
  "DZA|MAR": [7, "Closed since 1994: trenches and sand berms"],
  "IRQ|SAU": [7, "Saudi northern border barrier (900 km): berms, fences, sensors"],
  "SAU|YEM": [7, "Saudi border barrier and fortified posts"],
  "SYR|TUR": [8, "Turkey's Syria border wall (830 km) with towers"],
  "IRN|TUR": [6, "Turkey's Iran border wall (partial)"],
  "MEX|USA": [5, "Border barrier on about 1,100 of 3,145 km, plus sensors and patrols"],
  "BLR|POL": [8, "Steel wall (186 km) and the East Shield's ditches, bunkers and obstacles"],
  "POL|RUS": [7, "East Shield along Kaliningrad"],
  "BLR|LTU": [7, "Baltic Defence Line: fence, dragon's teeth and bunkers"],
  "LTU|RUS": [7, "Baltic Defence Line along Kaliningrad"],
  "LVA|RUS": [7, "Baltic Defence Line: fence and anti-tank obstacles"],
  "BLR|LVA": [6, "Border fence and Baltic Defence Line"],
  "EST|RUS": [7, "Baltic Defence Line: 600 bunkers planned, fence"],
  "FIN|RUS": [7, "Border fence (200 km) and Finland's prepared defences"],
  "NOR|RUS": [4, "Short Arctic border, watched closely"],
  "GRC|TUR": [6, "Evros fence and fortified river line"],
  "HUN|SRB": [6, "Border fence (175 km)"],
  "BGR|TUR": [5, "Border fence (260 km)"],
  "IRQ|KWT": [7, "Iraq–Kuwait barrier: trench, berm and electrified fence"],
  "LBY|TUN": [6, "Tunisia's Libya barrier and trench"],
  "AFG|UZB": [7, "Fortified Amu Darya border at Termez"],
  "AFG|TJK": [5, "Fortified Panj river border"],
  "AFG|TKM": [4, "Patrolled desert border"],
  "AFG|IRN": [5, "Iran's border wall (partial)"],
  "IRN|PAK": [5, "Pakistan's fence and Iran's wall"],
  "ARM|AZE": [6, "Fortified line of contact"],
  "ERI|ETH": [6, "Militarised border, mined in places"],
  "KEN|SOM": [5, "Border wall (partial)"],
  "EGY|PSE": [7, "Rafah wall and buffer zone"],
  "GEO|RUS": [5, "Russian 'borderisation' fences around South Ossetia and Abkhazia"],
  "IRQ|SYR": [5, "Border trench and wall sections"],
  "JOR|SYR": [6, "Jordan's berms, towers and sensors"],
  "IRQ|JOR": [5, "Patrolled desert border"],
  "DZA|LBY": [5, "Sand berms and trenches"],
  "KHM|THA": [5, "Disputed, mined border"],
  "MYS|THA": [5, "Border wall (partial)"],
  "CHN|VNM": [4, "Fortified mountain border"],
  "CHN|PRK": [5, "Fenced Yalu and Tumen rivers"],
  "BGD|MMR": [4, "Mined border with Myanmar"],
  "SDN|SSD": [4, "Contested, militarised border"],
  "HRV|SVN": [4, "Razor-wire fence"],
  "GRC|MKD": [4, "Border fence"],
  "BRA|VEN": [3, "Reinforced Amazon border posts"],
  "COL|VEN": [3, "Militarised crossings"],
  "ESP|MAR": [7, "Ceuta and Melilla fences (6 m triple fences)"],
};
// General border control of each country (for borders not listed above).
window.BORDER_BASE = {
  PRK: 6, ISR: 6, UKR: 5, KOR: 5, IND: 4, PAK: 4, TUR: 4, SAU: 4, MAR: 4, RUS: 3, CHN: 3, IRN: 3, POL: 4, FIN: 4,
  EST: 4, LVA: 4, LTU: 4, BLR: 3, AZE: 4, ARM: 4, EGY: 3, JOR: 3, KWT: 4, UZB: 4, TKM: 3, TJK: 3, DZA: 3, GRC: 3,
  HUN: 3, USA: 3, IRQ: 3, SYR: 3, ERI: 4, ETH: 3, VNM: 3, MMR: 3, TWN: 3, CYP: 4,
};
(function () {
  const key = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
  // The fortification of the border between two countries, as seen by the defender `to`.
  window.borderFort = (to, from) => {
    const f = window.BORDER_FORTS[key(to, from)];
    if (f) return { level: f[0], note: f[1] };
    const lv = Math.max(window.BORDER_BASE[to] || 2, window.BORDER_BASE[from] || 2);
    return { level: lv, note: lv >= 4 ? "Patrolled and partly fenced" : "Ordinary border posts and patrols" };
  };
  // Every land border of a country with its level, strongest first.
  window.borderProfile = iso => ((window.NEIGHBORS || {})[iso] || []).map(n => ({ n, ...window.borderFort(iso, n) })).sort((a, b) => b.level - a.level);
  window.borderKey = key;
})();
