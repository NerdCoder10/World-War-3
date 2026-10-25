// Top-down unit sprites for base zoom: tanks, vehicles, guns, aircraft, ships and infantry
// drawn in plan view (as seen in satellite imagery), shaped by what the model actually is
// (Western vs Soviet-style tank, tracked vs wheeled vehicle, delta vs stealth fighter, carrier
// flight deck...), in camouflage colours, with a soft shadow. Sizes follow real lengths.
(function () {
  // Real length (m) of each shape; drawings are scaled to it.
  const LEN = {
    tank_west: 10, tank_sov: 9.5, tank_light: 9, ifv: 7, wheeled: 8, mrap: 6.5, spg: 11, mlrs: 8, towed: 9, mortar: 3,
    squad: 9, stealth: 17, delta: 15, twin: 21, single: 15, attack: 16, bomber: 48, wing: 21, transport: 45, aew: 46, drone: 11, trainer: 11,
    heli: 18, attack_heli: 17, tandem: 30, destroyer: 155, frigate: 130, corvette: 90, amphib: 250, support: 160, patrol: 50,
    sub: 110, carrier: 330, light_carrier: 230,
  };
  // Which drawing fits a model (from its kind and name; families come from js/models.js).
  window.unitShape = (key, model) => {
    const fam = key === "troops" ? "" : window.modelSpec(key, model).family;
    switch (key) {
      case "troops": return "squad";
      case "tanks": return /light|Type 15|Type 62|Type 63|Scorpion|M41/i.test(model) ? "tank_light" : /T-\d|Type 59|Type 69|Type 8|Type 9|Al-Khalid|Al-Zarrar|Karrar|Zulfiqar|PT-91|Bhishma|Ajeya|VT-4|MBT-2000|Chonma|Pokpung/i.test(model) ? "tank_sov" : "tank_west";
      case "afv": return /MRAP/.test(fam) ? "mrap" : /Stryker|Boxer|BTR|VBCI|Patria|Piranha|Rosomak|LAV|Freccia|Centauro|Type 16|ZBL|Guarani|Pandur|Kestrel|CM-32|Saad|Fuchs|VAB|Griffon|Jaguar|WZ-551|Fahd|Cascavel|EE-11|BRDM|Type 96 \/ Type 89/i.test(model) ? "wheeled" : "ifv";
      case "arty": return /rocket/i.test(fam) ? "mlrs" : /Mortar/i.test(fam) ? "mortar" : /towed|Towed|M777|D-30|M-46|M101|L118|FH70|M119|M114/i.test(model) ? "towed" : "spg";
      case "fighters": return /5th-gen/.test(fam) ? "stealth" : /Ground-attack/.test(fam) ? "attack" : /Rafale|Typhoon|Gripen|F-39|J-10|Mirage|MiG-21|J-7|F-7|Tejas|Kfir|Eurofighter/i.test(model) ? "delta" : /F-15|Su-2[47]|Su-3[0-5]|MiG-29|MiG-31|J-11|J-16|J-15|F-14|F\/A-18|Super Hornet|Hornet|Ra'am/i.test(model) ? "twin" : "single";
      case "aircraft": return /B-2\b/.test(model) ? "wing" : /bomber/i.test(fam) ? "bomber" : /AEW|E-3|E-7|E-2|A-50|KJ-|Erieye|E-767|E-737|E-99/i.test(model) ? "aew" : /drone/i.test(fam) ? "drone" : /Trainer/.test(fam) ? "trainer" : "transport";
      case "helis": return /Chinook|CH-47/i.test(model) ? "tandem" : /Attack|gunship/i.test(fam) ? "attack_heli" : "heli";
      case "ships": return /Destroyer/.test(fam) ? "destroyer" : /Frigate/.test(fam) ? "frigate" : /Amphibious/.test(fam) ? "amphib" : /Corvette/.test(fam) ? "corvette" : /Support/.test(fam) ? "support" : "patrol";
      case "subs": return "sub";
      case "carriers": return /Light/.test(fam) ? "light_carrier" : "carrier";
    }
    return "ifv";
  };
  window.shapeLength = shape => LEN[shape] || 10;

  // Paint schemes: woodland green, desert tan, winter, naval grey, air superiority grey.
  const DESERT = new Set(["SAU", "ARE", "QAT", "KWT", "BHR", "OMN", "YEM", "IRQ", "IRN", "SYR", "JOR", "EGY", "LBY", "DZA", "TUN", "MAR", "MRT", "MLI", "NER", "TCD", "SDN", "ISR", "PSE", "PAK", "AFG", "DJI", "ERI", "SOM", "ESH"]);
  window.unitPalette = (iso, key) => {
    if (key === "ships" || key === "subs" || key === "carriers") return key === "subs" ? "sub" : "navy";
    if (key === "fighters" || key === "aircraft") return "air";
    if (key === "helis") return DESERT.has(iso) ? "desert" : "olive";
    return DESERT.has(iso) ? "desert" : "olive";
  };
  const PAL = {
    olive: { body: "#5d6b37", dark: "#3a4322", light: "#8a9a58" },
    desert: { body: "#c2a874", dark: "#806842", light: "#e2cf9f" },
    navy: { body: "#8a939b", dark: "#5f676e", light: "#b4bcc3" },
    sub: { body: "#1d2124", dark: "#0d0f10", light: "#3a3f43" },
    air: { body: "#9aa3ab", dark: "#6d757c", light: "#c3cad0" },
  };

  // Draw a shape centred at 0,0, nose pointing up, `L` pixels long.
  function draw(c, shape, L, p) {
    const u = L / 10; // drawing unit
    const rect = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * u, y * u) : c.moveTo(x * u, y * u))); c.closePath(); c.fill(); };
    const disc = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x * u, y * u, r * u, 0, 2 * Math.PI); c.fill(); };
    switch (shape) {
      case "tank_west": case "tank_sov": case "tank_light": {
        const w = shape === "tank_light" ? 3.0 : 3.7;
        rect(-w / 2 * u, -4 * u, w * u, 8 * u, p.dark);                    // tracks
        rect((-w / 2 + 0.5) * u, -3.8 * u, (w - 1) * u, 7.6 * u, p.body);  // hull
        if (shape === "tank_sov") disc(0, 0.3, 1.35, p.light);              // round turret
        else poly([[-1.3, -1.2], [1.3, -1.2], [1.6, 1.4], [1.1, 2.6], [-1.1, 2.6], [-1.6, 1.4]], p.light); // angular turret, rear bustle
        rect(-0.18 * u, -9 * u + (shape === "tank_light" ? 1.5 * u : 0), 0.36 * u, 8 * u, p.dark); // gun
        break;
      }
      case "ifv": rect(-1.6 * u, -5 * u, 3.2 * u, 10 * u, p.dark); rect(-1.3 * u, -4.8 * u, 2.6 * u, 9.6 * u, p.body); rect(-0.9 * u, -1.5 * u, 1.8 * u, 2 * u, p.light); rect(-0.12 * u, -4.5 * u, 0.24 * u, 3.2 * u, p.dark); break;
      case "wheeled": poly([[-1.5, -4], [-1, -5], [1, -5], [1.5, -4], [1.5, 5], [-1.5, 5]], p.body); for (let i = 0; i < 4; i++) { rect(-1.9 * u, (-3.5 + i * 2.3) * u, 0.4 * u, 1.3 * u, "#1b1b1b"); rect(1.5 * u, (-3.5 + i * 2.3) * u, 0.4 * u, 1.3 * u, "#1b1b1b"); } rect(-0.8 * u, -1 * u, 1.6 * u, 1.6 * u, p.light); break;
      case "mrap": rect(-1.4 * u, -5 * u, 2.8 * u, 2.6 * u, p.light); rect(-1.4 * u, -2.2 * u, 2.8 * u, 7 * u, p.body); disc(0, 0.5, 0.5, p.dark); break;
      case "spg": rect(-1.7 * u, -4 * u, 3.4 * u, 8 * u, p.dark); rect(-1.4 * u, -3.8 * u, 2.8 * u, 7.6 * u, p.body); rect(-1.5 * u, -0.5 * u, 3 * u, 3.6 * u, p.light); rect(-0.2 * u, -10 * u, 0.4 * u, 9.5 * u, p.dark); break;
      case "mlrs": rect(-1.3 * u, -5 * u, 2.6 * u, 2.4 * u, p.light); rect(-1.3 * u, -2.4 * u, 2.6 * u, 7.4 * u, p.body); rect(-1.1 * u, -1.6 * u, 2.2 * u, 5.4 * u, p.dark); break;
      case "towed": c.strokeStyle = p.dark; c.lineWidth = Math.max(1, 0.5 * u); c.beginPath(); c.moveTo(-1.8 * u, 5 * u); c.lineTo(0, 0); c.lineTo(1.8 * u, 5 * u); c.stroke(); rect(-1.2 * u, -0.8 * u, 2.4 * u, 1.6 * u, p.body); rect(-0.15 * u, -6 * u, 0.3 * u, 5.5 * u, p.dark); break;
      case "mortar": disc(0, 0, 2.5, p.dark); disc(0, 0, 1.6, p.body); break;
      case "squad": for (let i = 0; i < 9; i++) disc(((i % 3) - 1) * 3, (Math.floor(i / 3) - 1) * 3 + (i % 2) * 0.8, 1.05, i % 4 ? p.body : p.dark); break;
      case "stealth": poly([[0, -5], [1, -2.6], [4.8, 1.8], [4.6, 3], [1.6, 2.8], [2.6, 4.8], [0, 4.2], [-2.6, 4.8], [-1.6, 2.8], [-4.6, 3], [-4.8, 1.8], [-1, -2.6]], p.body); poly([[0, -4.4], [0.5, -2.8], [-0.5, -2.8]], "#2b2f33"); break;
      case "delta": poly([[0, -5], [0.6, -2.5], [4.4, 3.4], [0.8, 3.6], [0.6, 5], [-0.6, 5], [-0.8, 3.6], [-4.4, 3.4], [-0.6, -2.5]], p.body); poly([[0.6, -2.2], [1.8, -1.2], [0.6, -1]], p.dark); poly([[-0.6, -2.2], [-1.8, -1.2], [-0.6, -1]], p.dark); poly([[0, -4.4], [0.4, -3], [-0.4, -3]], "#2b2f33"); break;
      case "twin": case "single": {
        poly([[0, -5], [0.7, -2.5], [0.7, -0.6], [4.6, 1.6], [4.6, 2.4], [0.8, 2.2], [0.8, 3.4], [2.4, 4.6], [2.4, 5], [-2.4, 5], [-2.4, 4.6], [-0.8, 3.4], [-0.8, 2.2], [-4.6, 2.4], [-4.6, 1.6], [-0.7, -0.6], [-0.7, -2.5]], p.body);
        if (shape === "twin") { rect(-1.2 * u, 2 * u, 0.35 * u, 2.6 * u, p.dark); rect(0.85 * u, 2 * u, 0.35 * u, 2.6 * u, p.dark); }
        poly([[0, -4.4], [0.4, -3], [-0.4, -3]], "#2b2f33");
        break;
      }
      case "attack": rect(-0.6 * u, -5 * u, 1.2 * u, 10 * u, p.body); rect(-5 * u, -1.2 * u, 10 * u, 1.6 * u, p.body); rect(-2.2 * u, 3.6 * u, 4.4 * u, 0.9 * u, p.dark); disc(-1, 2.2, 0.6, p.dark); disc(1, 2.2, 0.6, p.dark); break;
      case "bomber": poly([[0, -5], [0.4, -2], [5, 2.4], [5, 3], [0.4, 1.2], [0.4, 4], [1.6, 5], [-1.6, 5], [-0.4, 4], [-0.4, 1.2], [-5, 3], [-5, 2.4], [-0.4, -2]], p.dark); break;
      case "wing": poly([[0, -2.4], [5, 1.6], [4, 2.6], [2.5, 1.8], [1.2, 2.6], [0, 1.8], [-1.2, 2.6], [-2.5, 1.8], [-4, 2.6], [-5, 1.6]], "#3b4046"); break;
      case "transport": case "aew":
        rect(-0.55 * u, -5 * u, 1.1 * u, 10 * u, p.light); rect(-5 * u, -1.6 * u, 10 * u, 1.2 * u, p.body); rect(-2 * u, 3.8 * u, 4 * u, 0.8 * u, p.body);
        [-3.4, -1.8, 1.8, 3.4].forEach(x => rect((x - 0.25) * u, -2.4 * u, 0.5 * u, 1 * u, p.dark));
        if (shape === "aew") disc(0, 0.6, 1.4, "#e8ecef");
        break;
      case "drone": rect(-0.35 * u, -2.5 * u, 0.7 * u, 6.5 * u, p.light); rect(-5 * u, -0.8 * u, 10 * u, 0.6 * u, p.body); poly([[0, 3.6], [1.4, 4.6], [-1.4, 4.6]], p.body); break;
      case "trainer": rect(-0.5 * u, -5 * u, 1 * u, 10 * u, p.light); poly([[0.4, -1], [4.2, 0.6], [4.2, 1.4], [0.4, 1.2]], p.body); poly([[-0.4, -1], [-4.2, 0.6], [-4.2, 1.4], [-0.4, 1.2]], p.body); rect(-1.8 * u, 4 * u, 3.6 * u, 0.7 * u, p.body); break;
      case "heli": case "attack_heli": {
        c.globalAlpha *= 0.35; disc(0, -0.6, 4.6, "#11161a"); c.globalAlpha /= 0.35;
        rect(-(shape === "heli" ? 0.9 : 0.6) * u, -3 * u, (shape === "heli" ? 1.8 : 1.2) * u, 4.4 * u, p.body); rect(-0.25 * u, 1.2 * u, 0.5 * u, 3.8 * u, p.body); rect(-1 * u, 4.5 * u, 2 * u, 0.4 * u, p.dark);
        break;
      }
      case "tandem": c.globalAlpha *= 0.35; disc(0, -3, 3.6, "#11161a"); disc(0, 3, 3.6, "#11161a"); c.globalAlpha /= 0.35; rect(-0.9 * u, -4.6 * u, 1.8 * u, 9.2 * u, p.body); break;
      case "destroyer": case "frigate": case "corvette": case "patrol": case "support": {
        const w = shape === "support" ? 1.5 : shape === "patrol" ? 1.3 : 1.2;
        poly([[0, -5], [w * 0.7, -3], [w, 0], [w * 0.9, 5], [-w * 0.9, 5], [-w, 0], [-w * 0.7, -3]], p.body);
        if (shape !== "patrol") { rect(-0.7 * u, -1.2 * u, 1.4 * u, 2.4 * u, p.light); rect(-0.5 * u, 1.6 * u, 1 * u, 1 * u, p.light); }
        if (shape === "destroyer" || shape === "frigate") { rect(-0.6 * u, -3.2 * u, 1.2 * u, 1.2 * u, p.dark); disc(0, -4, 0.25, p.dark); }
        if (shape === "support") rect(-0.9 * u, -3.5 * u, 1.8 * u, 5.5 * u, p.dark);
        break;
      }
      case "amphib": case "light_carrier": poly([[0, -5], [1.6, -4], [1.7, 5], [-1.7, 5], [-1.6, -4]], p.body); rect(0.9 * u, -0.6 * u, 0.6 * u, 2.6 * u, p.light); c.strokeStyle = "#e8ecef"; c.lineWidth = Math.max(0.5, 0.08 * u); c.beginPath(); c.moveTo(-0.3 * u, -4.4 * u); c.lineTo(-0.3 * u, 4.6 * u); c.stroke(); break;
      case "sub": c.fillStyle = p.body; c.beginPath(); c.ellipse(0, 0, 0.75 * u, 5 * u, 0, 0, 2 * Math.PI); c.fill(); rect(-0.35 * u, -2.2 * u, 0.7 * u, 1.4 * u, p.light); break;
      case "carrier": {
        // Angled flight deck, island to starboard, deck markings and a few parked jets.
        poly([[-0.6, -5], [1.4, -4.6], [1.9, -1], [1.9, 4.6], [1, 5], [-1.2, 5], [-1.3, 0.8], [-2.4, -1.4], [-2.4, -2.6], [-1.3, -2.4]], "#6b737a");
        rect(1.2 * u, 0.6 * u, 0.6 * u, 1.4 * u, "#c9ced2");
        c.strokeStyle = "#f2f2f2"; c.lineWidth = Math.max(0.5, 0.06 * u);
        c.beginPath(); c.moveTo(-1.6 * u, -2.2 * u); c.lineTo(0.7 * u, 4.6 * u); c.stroke();
        c.setLineDash([0.3 * u, 0.3 * u]); c.beginPath(); c.moveTo(0.3 * u, -4.6 * u); c.lineTo(0.3 * u, 4.6 * u); c.stroke(); c.setLineDash([]);
        for (let i = 0; i < 6; i++) poly([[1.2, -3.6 + i * 0.7], [1.5, -3.2 + i * 0.7], [0.9, -3.2 + i * 0.7]], "#9aa3ab");
        break;
      }
    }
  }
  const cache = new Map();
  // A cached sprite: { canvas, w, h } in CSS pixels, nose up. `sel` adds a bright outline ring.
  window.unitSprite = (shape, palette, lengthPx, sel, dpr) => {
    const L = Math.max(4, Math.round(lengthPx)), key = `${shape}|${palette}|${L}|${sel ? 1 : 0}|${dpr}`;
    let s = cache.get(key);
    if (s) return s;
    const span = shape === "wing" ? L * 1.1 : L, pad = 3, dim = Math.ceil(span + pad * 2 + (sel ? 4 : 0));
    const cv = document.createElement("canvas");
    cv.width = cv.height = Math.ceil(dim * dpr);
    const c = cv.getContext("2d");
    c.scale(dpr, dpr);
    c.translate(dim / 2, dim / 2);
    // The unit, then a soft shadow cut from its own outline (lower right, like the sun in satellite photos).
    const art = document.createElement("canvas");
    art.width = art.height = cv.width;
    const a2 = art.getContext("2d");
    a2.scale(dpr, dpr); a2.translate(dim / 2, dim / 2);
    draw(a2, shape, L, PAL[palette] || PAL.olive);
    const sh = document.createElement("canvas");
    sh.width = sh.height = cv.width;
    const s2 = sh.getContext("2d");
    s2.drawImage(art, 0, 0); s2.globalCompositeOperation = "source-in"; s2.fillStyle = "rgba(0,0,0,0.38)"; s2.fillRect(0, 0, sh.width, sh.height);
    // A thin dark outline (the silhouette nudged a pixel each way) so units stand out on any ground.
    const ol = document.createElement("canvas");
    ol.width = ol.height = cv.width;
    const o2 = ol.getContext("2d");
    o2.drawImage(art, 0, 0); o2.globalCompositeOperation = "source-in"; o2.fillStyle = "rgba(10,12,8,0.75)"; o2.fillRect(0, 0, ol.width, ol.height);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const off = Math.max(1, L * 0.07) * dpr, d = Math.max(1, Math.round(dpr));
    c.drawImage(sh, off, off);
    [[-d, 0], [d, 0], [0, -d], [0, d]].forEach(([x, y]) => c.drawImage(ol, x, y));
    c.drawImage(art, 0, 0);
    c.restore();
    if (sel) { c.strokeStyle = "#ffd25e"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, span / 2 + 2, 0, 2 * Math.PI); c.stroke(); }
    s = { canvas: cv, dim };
    cache.set(key, s);
    if (cache.size > 800) cache.delete(cache.keys().next().value);
    return s;
  };
})();
