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
  // ── Model-accurate planforms ──
  // Fast jets: the right half of the outline seen from above (x across, y nose −5 → tail +5,
  // so 10 units = the real length), mirrored. Half-spans follow the real span / length ratio
  // (an F-16 is 15.1 m long and 9.96 m across: 3.3 units). fin: centre fin, or ±x of twin fins.
  const JETS = {
    f16: { len: 15.1, fin: 0, pts: [[0, -5], [0.25, -4.2], [0.45, -3.2], [0.55, -2], [0.75, -1], [0.95, -0.2], [3.2, 1.9], [3.3, 1.9], [3.3, 2.5], [3.1, 2.5], [0.95, 2.4], [0.85, 3.2], [2.3, 4.1], [2.3, 4.6], [0.7, 4.5], [0.45, 5], [0, 5]] },
    f15: { len: 19.4, fin: 0.95, pts: [[0, -5], [0.3, -4.2], [0.5, -3], [0.95, -2.2], [1, -0.6], [3.3, 1.6], [3.36, 2.4], [1.1, 2.2], [1.1, 3.3], [2.4, 4.3], [2.4, 4.9], [1, 4.7], [0.6, 5], [0, 5]] },
    f35: { len: 15.7, fin: 0.9, cant: 1, pts: [[0, -5], [0.35, -4], [0.7, -2.8], [1.1, -1.6], [1.25, -0.4], [3.4, 1.7], [3.4, 2.3], [1.4, 2.5], [1.3, 3.1], [2.4, 4.2], [2.4, 4.8], [0.8, 4.7], [0.5, 5], [0, 5]] },
    f22: { len: 18.9, fin: 1.2, cant: 1, pts: [[0, -5], [0.35, -4], [0.75, -2.7], [1.25, -1.4], [1.35, -0.6], [3.6, 1.7], [3.6, 2.3], [2, 2.9], [1.4, 2.6], [1.4, 3.1], [2.8, 4.2], [2.7, 4.9], [1, 4.6], [0.55, 5], [0, 5]] },
    fa18: { len: 18.3, fin: 0.9, cant: 1, pts: [[0, -5], [0.3, -4], [0.5, -2.8], [0.7, -1.8], [1.05, -0.6], [1.1, 0], [3.6, 1.5], [3.7, 2.2], [1.15, 2.3], [1, 3], [2.5, 4], [2.5, 4.6], [0.9, 4.6], [0.55, 5], [0, 5]] },
    f14: { len: 19.1, fin: 1.3, pts: [[0, -5], [0.3, -3.6], [0.6, -2.4], [1.4, -1], [1.7, 0], [3.05, 2.9], [2.9, 3.2], [1.8, 2.6], [1.8, 3.6], [2.6, 4.6], [2.6, 5], [1.4, 4.8], [0.9, 4.9], [0, 4.9]] },
    f4: { len: 19.2, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.45, -2.8], [0.9, -1.8], [1, -0.6], [2.4, 1], [3.05, 1.3], [3.05, 1.8], [1.05, 2], [0.6, 3.4], [2.2, 4.6], [2.2, 5], [0.5, 4.8], [0.3, 5], [0, 5]] },
    su27: { len: 21.9, fin: 1.2, pts: [[0, -5], [0.25, -4.2], [0.45, -3.2], [0.6, -2.4], [1.1, -1.2], [1.3, -0.2], [3.3, 1.6], [3.36, 2.2], [1.4, 2.2], [1.4, 3.4], [2.6, 4.2], [2.6, 4.7], [1.2, 4.5], [0.9, 4.9], [0.25, 4.6], [0.2, 5], [0, 5]] },
    su30c: { len: 21.9, fin: 1.2, canard: [[0.55, -2.3], [1.5, -1.9], [1.5, -1.6], [0.7, -1.6]], pts: null },
    su34: { len: 23.3, fin: 1.2, canard: [[0.75, -2.5], [1.6, -2.1], [1.6, -1.8], [0.85, -1.8]], pts: [[0, -5], [0.4, -4.7], [0.6, -3.6], [0.75, -2.4], [1.15, -1.2], [1.3, -0.2], [3.1, 1.6], [3.15, 2.2], [1.4, 2.2], [1.4, 3.4], [2.6, 4.2], [2.6, 4.7], [1.2, 4.5], [0.9, 4.9], [0.3, 4.6], [0.25, 5], [0, 5]] },
    mig29: { len: 17.3, fin: 1.15, pts: [[0, -5], [0.25, -4.2], [0.45, -3.2], [0.6, -2.3], [1.1, -0.8], [1.25, 0], [3.2, 1.7], [3.3, 2.3], [1.35, 2.3], [1.3, 3.3], [2.5, 4.2], [2.5, 4.7], [1.1, 4.6], [0.4, 4.8], [0.2, 5], [0, 5]] },
    mig31: { len: 22.7, fin: 1.2, pts: [[0, -5], [0.3, -4], [0.55, -2.8], [1.2, -1.4], [1.3, -0.2], [3, 1.5], [3, 2], [1.35, 2.1], [1.35, 3.6], [2.4, 4.3], [2.4, 4.8], [1.1, 4.8], [0.6, 5], [0, 5]] },
    su57: { len: 20.1, fin: 1.1, cant: 1, pts: [[0, -5], [0.35, -3.9], [0.8, -2.6], [1.6, -1.2], [1.4, -0.6], [3.5, 1.5], [3.5, 2.1], [1.6, 2.4], [1.4, 3.4], [2.5, 4.2], [2.5, 4.8], [1.1, 4.7], [0.6, 5], [0, 5]] },
    j20: { len: 20.4, fin: 1, cant: 1, pts: [[0, -5], [0.35, -3.8], [0.75, -2.6], [1, -1.4], [2, -0.6], [2, -0.2], [1.05, -0.1], [1.1, 0.4], [3.2, 2.6], [3.2, 3.1], [1.2, 3.3], [1.3, 4], [1, 4.6], [0.5, 5], [0, 5]] },
    j10: { len: 16.9, fin: 0, pts: [[0, -5], [0.3, -3.6], [0.5, -2.6], [0.6, -1.8], [1.7, -1], [1.7, -0.6], [0.7, -0.6], [0.7, 0], [2.9, 2.9], [2.9, 3.3], [0.65, 3.5], [0.5, 4.8], [0.35, 5], [0, 5]] },
    rafale: { len: 15.3, fin: 0, pts: [[0, -5], [0.3, -3.8], [0.55, -2.6], [0.7, -1.6], [1.8, -0.6], [1.8, -0.3], [0.8, -0.2], [0.85, 0.2], [3.5, 2.8], [3.56, 3.3], [0.9, 3.6], [0.75, 4.8], [0.4, 5], [0, 5]] },
    typhoon: { len: 16, fin: 0, pts: [[0, -5], [0.3, -4], [0.5, -3.4], [1.5, -2.6], [1.5, -2.3], [0.55, -2.1], [0.65, -0.8], [3.4, 2.9], [3.43, 3.4], [0.75, 3.6], [0.6, 4.8], [0.35, 5], [0, 5]] },
    gripen: { len: 14.1, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.45, -2.6], [0.55, -1.6], [1.6, -0.7], [1.6, -0.35], [0.6, -0.3], [0.65, 0.4], [1.2, 1], [3, 3], [3, 3.4], [0.6, 3.6], [0.45, 4.9], [0.3, 5], [0, 5]] },
    m2000: { len: 14.4, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.45, -2.4], [0.6, -0.9], [3.2, 3.7], [3.2, 4], [0.6, 4], [0.45, 5], [0, 5]] },
    kfir: { len: 15.7, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.45, -2.4], [0.55, -1.6], [1.2, -0.9], [1.2, -0.6], [0.6, -0.5], [0.6, -0.2], [2.6, 3.5], [2.6, 3.8], [0.6, 3.9], [0.45, 5], [0, 5]] },
    tejas: { len: 13.2, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.45, -2.6], [0.7, -1.2], [1.2, 0], [3.1, 3.6], [3.1, 3.9], [0.6, 4], [0.45, 5], [0, 5]] },
    mig21: { len: 14.5, fin: 0, pts: [[0, -5], [0.2, -3.6], [0.4, -1.6], [0.45, -0.6], [2.47, 2.4], [2.47, 2.8], [0.5, 2.8], [0.5, 3.6], [1.6, 4.3], [1.6, 4.7], [0.45, 4.7], [0.4, 5], [0, 5]] },
    f5: { len: 14.5, fin: 0, pts: [[0, -5], [0.2, -3.8], [0.4, -2.4], [0.5, -1], [0.6, -0.6], [2.8, 1.6], [2.8, 2], [0.65, 2], [0.6, 3.4], [1.6, 4.2], [1.6, 4.6], [0.5, 4.6], [0.45, 5], [0, 5]] },
    jf17: { len: 14.9, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.45, -2.6], [0.8, -1.4], [0.9, -0.4], [3.17, 1.8], [3.17, 2.3], [0.9, 2.3], [0.8, 3.4], [2, 4.2], [2, 4.6], [0.6, 4.6], [0.4, 5], [0, 5]] },
    swing: { len: 16.7, fin: 0, pts: [[0, -5], [0.25, -3.6], [0.5, -2.4], [0.9, -1.2], [1.3, -0.4], [3.5, 1.8], [3.4, 2.2], [1.3, 1.4], [1.1, 3], [2.7, 4.4], [2.7, 4.9], [0.6, 4.8], [0.5, 5], [0, 5]] },
    harrier: { len: 14.1, fin: 0, pts: [[0, -5], [0.25, -3.8], [0.5, -2.6], [1.1, -1.6], [1.2, -0.6], [3.3, 1.3], [3.3, 1.8], [1.2, 2.2], [0.6, 3.4], [1.9, 4.3], [1.9, 4.7], [0.4, 4.6], [0.3, 5], [0, 5]] },
    su25: { len: 15.5, fin: 0, nacelle: [0.65, -1.2, 0.55, 3.4], pts: [[0, -5], [0.3, -3.6], [0.6, -2], [0.75, -1.2], [4.6, 0.4], [4.6, 1], [0.8, 1.4], [0.7, 2.8], [2, 4.1], [2, 4.6], [0.5, 4.6], [0.4, 5], [0, 5]] },
  };
  JETS.su30c.pts = JETS.su27.pts;
  // Big aircraft drawn from their real geometry: half-span hs, wing sweep, engines (x positions;
  // prop = propellers), fuselage width fw, a rotodome or "top-hat" radar, high or low wing.
  const HEAVY = {
    c17: { len: 53, hs: 4.9, sweep: 0.45, wy: -0.9, rc: 2.2, tc: 0.8, eng: [1.6, 2.9], fw: 1.25, stab: 2, ty: 4.2 },
    il76: { len: 46.6, hs: 5.4, sweep: 0.45, wy: -0.9, rc: 2, tc: 0.7, eng: [1.7, 3.1], fw: 1.2, stab: 2.1, ty: 4.2 },
    c390: { len: 35.2, hs: 5.1, sweep: 0.4, wy: -0.8, rc: 1.9, tc: 0.7, eng: [1.8], fw: 1.15, stab: 2, ty: 4.2 },
    a400m: { len: 45.1, hs: 4.7, sweep: 0.25, wy: -0.8, rc: 1.9, tc: 0.8, eng: [1.4, 2.8], prop: 1, fw: 1.2, stab: 2, ty: 4.2 },
    c130: { len: 29.8, hs: 6.8, sweep: 0.05, wy: -0.9, rc: 1.6, tc: 0.9, eng: [1.9, 3.6], prop: 1, fw: 1.2, stab: 2.2, ty: 4.3 },
    twinprop: { len: 24.5, hs: 5.2, sweep: 0.04, wy: -0.8, rc: 1.4, tc: 0.7, eng: [1.6], prop: 1, fw: 1.1, stab: 2, ty: 4.3 },
    p3: { len: 35.6, hs: 4.2, sweep: 0.04, wy: -0.9, rc: 1.5, tc: 0.8, eng: [1.3, 2.6], prop: 1, fw: 0.95, stab: 1.6, ty: 4.4 },
    kc135: { len: 41.5, hs: 4.8, sweep: 0.75, wy: -0.8, rc: 1.7, tc: 0.5, eng: [1.9, 3.3], fw: 0.85, stab: 1.8, ty: 4.1 },
    airliner: { len: 54, hs: 4.8, sweep: 0.7, wy: -0.6, rc: 1.8, tc: 0.5, eng: [1.6], fw: 0.95, stab: 1.8, ty: 4.1 },
    p8: { len: 39.5, hs: 4.75, sweep: 0.65, wy: -0.4, rc: 1.7, tc: 0.5, eng: [1.4], fw: 0.9, stab: 1.7, ty: 4.1 },
    e3: { len: 46.6, hs: 4.8, sweep: 0.75, wy: -0.8, rc: 1.7, tc: 0.5, eng: [1.9, 3.3], fw: 0.85, stab: 1.8, ty: 4.1, dome: 1.0 },
    a50: { len: 46.6, hs: 5.4, sweep: 0.45, wy: -0.9, rc: 2, tc: 0.7, eng: [1.7, 3.1], fw: 1.2, stab: 2.1, ty: 4.2, dome: 1.0 },
    e2: { len: 17.6, hs: 7, sweep: 0.03, wy: -1, rc: 1.6, tc: 1, eng: [2], prop: 1, fw: 1.2, stab: 2.6, ty: 4.2, dome: 1.4 },
    e7: { len: 33.6, hs: 5.4, sweep: 0.65, wy: -0.4, rc: 1.7, tc: 0.5, eng: [1.4], fw: 0.95, stab: 1.8, ty: 4.1, bar: 1 },
    erieye: { len: 25.4, hs: 5.6, sweep: 0.5, wy: -0.2, rc: 1.4, tc: 0.5, eng: [0.85], rear: 1, fw: 0.85, stab: 1.6, ty: 4.2, bar: 1 },
    bizjet: { len: 29.4, hs: 4.7, sweep: 0.55, wy: -0.1, rc: 1.4, tc: 0.5, eng: [0.85], rear: 1, fw: 0.85, stab: 1.7, ty: 4.2 },
    b52: { len: 48.5, hs: 5.8, sweep: 0.75, wy: -1.4, rc: 2.2, tc: 0.7, eng: [1.7, 3.2], pair: 1, fw: 0.85, stab: 2.2, ty: 4.2 },
    tu95: { len: 46.2, hs: 5.4, sweep: 0.75, wy: -0.8, rc: 2, tc: 0.7, eng: [1.6, 3.2], prop: 1, fw: 0.9, stab: 2.1, ty: 4.3 },
    h6: { len: 34.8, hs: 4.75, sweep: 0.7, wy: -0.6, rc: 2, tc: 0.7, eng: [0.9], fw: 0.9, stab: 1.9, ty: 4.2 },
    il28: { len: 17.7, hs: 6.1, sweep: 0.08, wy: -0.8, rc: 1.6, tc: 0.9, eng: [1.6], fw: 0.95, stab: 2.4, ty: 4.2 },
    an2: { len: 12.4, hs: 7.3, sweep: 0, wy: -2.6, rc: 1.9, tc: 1.9, eng: [], nose: 1, fw: 1.2, stab: 2.4, ty: 4.1, bi: 1 },
  };
  // Blended swing-wing bombers (B-1B, Tu-160, Tu-22M3) as outlines, like the jets.
  JETS.b1 = { len: 44.5, fin: 0, pts: [[0, -5], [0.3, -3.8], [0.5, -2.4], [0.7, -1.4], [1.5, -0.4], [2.7, 2.4], [2.7, 2.8], [1.2, 1.8], [0.9, 3.4], [2.1, 4.4], [2.1, 4.8], [0.6, 4.7], [0.4, 5], [0, 5]] };
  // Drones: straight high-aspect wing, slender fuselage, V or inverted-V tail, pusher prop.
  const DRONES = {
    mq9: { len: 11, hs: 9.1, fw: 0.9, wy: 0, chord: 0.9, tail: "Y" },
    tb2: { len: 6.5, hs: 9.2, fw: 0.8, wy: -0.4, chord: 1.1, tail: "V" },
    hale: { len: 14.5, hs: 13.5, fw: 1.1, wy: 0.4, chord: 0.8, tail: "V" },
    shahed: { len: 3.5, hs: 3.5, delta: 1 },
  };
  // Helicopters: real length and rotor diameter (m), fuselage width, blade count; tandem or
  // coaxial rotors; stub wings with weapons on gunships.
  const HELIS = {
    uh60: { len: 19.8, rotor: 16.4, fw: 2.4, blades: 4, cab: 6 }, ah64: { len: 17.7, rotor: 14.6, fw: 1.0, blades: 4, stub: 1.6, cab: 4.5 },
    mi8: { len: 25.3, rotor: 21.3, fw: 2.5, blades: 5, cab: 8 }, mi24: { len: 21.4, rotor: 17.3, fw: 1.7, blades: 5, stub: 2.2, cab: 6 },
    mi28: { len: 21.6, rotor: 17.2, fw: 1.3, blades: 5, stub: 1.9, cab: 5 }, ka52: { len: 16, rotor: 14.5, fw: 1.4, blades: 3, coax: 1, stub: 2, cab: 5, twin: 1 },
    ka27: { len: 15.9, rotor: 15.9, fw: 2.2, blades: 3, coax: 1, cab: 5.5, twin: 1 }, ch47: { len: 30.1, rotor: 18.3, fw: 2.6, blades: 3, tandem: 1 },
    ch53: { len: 30.2, rotor: 24.1, fw: 2.8, blades: 7, cab: 9 }, z8: { len: 23, rotor: 18.9, fw: 2.4, blades: 6, cab: 8 },
    tiger: { len: 14.1, rotor: 13, fw: 1.0, blades: 4, stub: 1.5, cab: 4 }, ah1: { len: 17.8, rotor: 14.6, fw: 0.9, blades: 4, stub: 1.5, cab: 4.5 },
    cobra: { len: 16.2, rotor: 14.6, fw: 0.9, blades: 2, stub: 1.4, cab: 4.5 }, huey: { len: 17.4, rotor: 14.6, fw: 2.4, blades: 2, cab: 5 },
    b412: { len: 17.1, rotor: 14, fw: 2.4, blades: 4, cab: 5 }, puma: { len: 18.7, rotor: 15.6, fw: 2.3, blades: 4, cab: 6 },
    nh90: { len: 19.6, rotor: 16.3, fw: 2.4, blades: 4, cab: 6 }, aw101: { len: 22.8, rotor: 18.6, fw: 2.5, blades: 5, cab: 7.5 },
    lynx: { len: 15.2, rotor: 12.8, fw: 2, blades: 4, cab: 4.5 }, utility: { len: 16.6, rotor: 13.8, fw: 2.1, blades: 5, cab: 5 },
    light: { len: 12, rotor: 10.5, fw: 1.7, blades: 3, cab: 3.5 }, md500: { len: 9.4, rotor: 8, fw: 1.6, blades: 5, cab: 3 },
  };
  // Tanks: length with gun forward, hull length and width (m), turret style and its place.
  const TANKS = {
    abrams: { len: 9.8, hull: 7.9, w: 3.66, tur: "abrams" }, leo2: { len: 11, hull: 7.7, w: 3.75, tur: "wedge" },
    chally: { len: 11.5, hull: 8.3, w: 3.5, tur: "abrams" }, leclerc: { len: 9.9, hull: 6.9, w: 3.6, tur: "box" },
    merkava: { len: 9, hull: 7.6, w: 3.72, tur: "merkava", rear: 1 }, t72: { len: 9.5, hull: 6.9, w: 3.59, tur: "round", era: 1 },
    t80: { len: 9.7, hull: 7, w: 3.6, tur: "round", era: 1 }, t55: { len: 9.2, hull: 6.2, w: 3.27, tur: "dome" },
    m60: { len: 9.4, hull: 6.9, w: 3.63, tur: "dome" }, leo1: { len: 9.5, hull: 7.1, w: 3.37, tur: "box" },
    type99: { len: 11, hull: 7.6, w: 3.5, tur: "wedge", era: 1 }, t14: { len: 10.8, hull: 8.7, w: 3.5, tur: "box" },
    light: { len: 9, hull: 6.9, w: 3, tur: "box" },
  };
  Object.entries(JETS).forEach(([k2, v]) => (LEN[k2] = v.len));
  Object.entries(HEAVY).forEach(([k2, v]) => (LEN[k2] = v.len));
  Object.entries(DRONES).forEach(([k2, v]) => (LEN["d_" + k2] = v.len));
  Object.entries(HELIS).forEach(([k2, v]) => (LEN["h_" + k2] = Math.max(v.len, v.rotor)));
  Object.entries(TANKS).forEach(([k2, v]) => (LEN["t_" + k2] = v.len));
  LEN.wing = 21; LEN.prop = 11; LEN.a10 = 16.3;
  // A helicopter's drawing in units of (longest dimension / 10): rotor radius, fuselage length,
  // and where the nose sits relative to the main rotor hub (y = 0).
  function heliGeom(h) {
    const sc = 10 / Math.max(h.len, h.rotor), R = (h.rotor / 2) * sc, fl = h.len * sc, cabin = (h.cab || h.len * 0.5) * sc;
    return { sc, R, fl, cabin, top: h.tandem ? -fl / 2 : -cabin * 0.55 };
  }
  // How far a shape reaches sideways (units of length / 10, 5 = as wide as long) for sizing sprites.
  const reach = shape => {
    if (JETS[shape]) return Math.max(...JETS[shape].pts.map(p => p[0]));
    if (HEAVY[shape]) return HEAVY[shape].hs;
    if (shape.startsWith("d_")) { const d = DRONES[shape.slice(2)]; return d.hs; }
    if (shape.startsWith("h_")) { const g = heliGeom(HELIS[shape.slice(2)]); return Math.max(g.R, g.top + g.fl, -g.top); }
    return { wing: 12.5, a10: 5.4, prop: 5.6, attack: 5, bomber: 5, transport: 5, trainer: 4.2 }[shape] || 5;
  };
  window.shapeReach = reach;

  // Which drawing fits a model (by its name first, so an F-16 is drawn as an F-16 and a Su-27 as a
  // Su-27; then by its family from js/models.js).
  // Names like "C-17 / C-130J / Il-76" list several models: the first one named sets the picture.
  const pick = (model, rules, dflt) => {
    let best = dflt, at = Infinity;
    for (const [re, shape] of rules) { const m = re.exec(model); if (m && m.index < at) { at = m.index; best = shape; } }
    return best;
  };
  const FIGHTER = [
    [/A-10/, "a10"], [/Su-25/, "su25"], [/F-22/, "f22"], [/F-35|J-35|FC-31/, "f35"], [/Su-57/, "su57"], [/J-20/, "j20"],
    [/Su-34/, "su34"], [/Su-30(MKI|SM|MKA|MKM|SME)|Su-30SM|J-15|Su-33/, "su30c"], [/Su-2[7]|Su-3[05]|J-1[16]|Shenyang/, "su27"],
    [/MiG-31/, "mig31"], [/MiG-29|MiG-35/, "mig29"], [/F-15/, "f15"], [/F\/A-18|Hornet|EF-18|CF-18|EA-18/, "fa18"], [/F-14/, "f14"],
    [/F-4|JH-7/, "f4"], [/F-16|KF-16|F-2A|FA-50|T-50|F-CK|Ching-kuo/, "f16"], [/Rafale/, "rafale"], [/Typhoon|Eurofighter/, "typhoon"],
    [/Gripen|F-39|JAS 39/, "gripen"], [/J-10/, "j10"], [/Kfir/, "kfir"], [/Mirage (2000|III|5)|Mirage III/, "m2000"], [/Tejas/, "tejas"],
    [/MiG-21|J-7|F-7/, "mig21"], [/MiG-2[37]|Su-2[24]|Su-17|Tornado/, "swing"], [/JF-17/, "jf17"], [/Harrier|AV-8/, "harrier"],
    [/Super Tucano|A-29|Pucará|PC-7|T-6|Texan|T-35/, "prop"], [/Hawk|L-159|Yak-130|K-8|M-346|Alpha Jet|L-39/, "trainer"],
    [/F-5|Saeqeh|Kowsar|Jaguar|AMX|A-4|Q-5|A-5|Mirage F1|MiG-1[579]|J-[56]/, "f5"],
  ];
  const BIG = [
    [/B-2\b/, "wing"], [/B-52/, "b52"], [/B-1|Tu-160|Tu-22/, "b1"], [/Tu-95|Tu-142/, "tu95"], [/H-6/, "h6"], [/Il-28|H-5/, "il28"],
    [/E-2\b|E-2[CDK]/, "e2"], [/E-3|E-767|KJ-2000|KJ-500|Atlantique 2 & E-3/, "e3"], [/A-50/, "a50"],
    [/E-7|E-737|Peace Eagle|P-8A \/ E-7A/, "e7"], [/Erieye|GlobalEye|Saab 340 AEW|EMB-145|G550 AEW|E-99|ZDK/, "erieye"],
    [/KC-135|KC-707|Boeing 707|RC-135/, "kc135"], [/P-8|737/, "p8"], [/KC-46|KC-767|767|KDC-10|KC-10|A330|MRTT|Voyager|KC-30|CC-330|A31\d|A32\d/, "airliner"],
    [/C-17|Il-7[68]|Y-20|C-2 \//, "c17"], [/A400M/, "a400m"], [/KC-390|C-390/, "c390"], [/C-130|Hercules|Y-[89]|An-12|Shaanxi/, "c130"],
    [/P-3|P-1|Atlantique|CP-140/, "p3"], [/An-2 /, "an2"],
    [/C-295|CN-235|An-2[46]|An-32|C-27J|Spartan|An-72|Y-12|Do-228|DHC-5|C-212|CASA|MA60|Saab 340|Shorts 3|S 102B/, "twinprop"],
    [/Shahed|Orlan|Harop/, "d_shahed"], [/Global Hawk|MQ-4C|WZ-7/, "d_hale"], [/MQ-9|Reaper|Protector|Wing Loong|CH-[345]|Akıncı|Anka|Heron|Hermes|Orion|Mohajer|Orbis/, "d_mq9"], [/Bayraktar|TB2|drone|Drone/, "d_tb2"],
    [/Gulfstream|G550|Learjet|CL-604|King Air|PC-12|PC-6|ISR|Global/, "bizjet"],
    [/T-38/, "f5"], [/PC-|T-6|Texan|Tucano|Grob|T-2[57]|T-3[45]|Z-[12]42|SF-260|Zlín|MFI-17|Parastu|PT-6|T-67|TB-30|T-17|EMB-312|KT-1|AT-5|T-7\b|Pampa|Prefect|G-115|PZL-130/, "prop"],
  ];
  const HELI = [
    [/CH-47|Chinook/, "h_ch47"], [/CH-53|Yas'ur/, "h_ch53"], [/Z-8|Z-18/, "h_z8"], [/Ka-52/, "h_ka52"], [/Ka-2\d|Ka-31/, "h_ka27"],
    [/Mi-2[45]|Mi-35/, "h_mi24"], [/Mi-28/, "h_mi28"], [/Mi-8|Mi-17|Mi-171/, "h_mi8"], [/AH-64|Apache/, "h_ah64"], [/AH-1Z|Viper/, "h_ah1"],
    [/AH-1|Cobra/, "h_cobra"], [/Tiger|Z-10|T129|AW129|Mangusta|Rooivalk|LCH|Prachand/, "h_tiger"],
    [/UH-60|Black Hawk|Seahawk|S-70|MH-60|SH-60|Z-20|T-70|Hkp 16/, "h_uh60"], [/NH90|Hkp 14/, "h_nh90"], [/AW101|Merlin|Cormorant|CH-148|Cyclone/, "h_aw101"],
    [/Puma|Cougar|Caracal|H225|EC225|AS532|AS332|SA330|NAS-332|EC725|Oryx|IAR 330/, "h_puma"], [/Lynx|Wildcat|AW159/, "h_lynx"],
    [/UH-1Y|Bell 412|Bell 407|CH-146|Griffon/, "h_b412"], [/UH-1|Huey|Bell 2\d\d|AB-?2\d\d|OH-58/, "h_huey"],
    [/MD-?500|MD ?530|500MD|Hughes/, "h_md500"], [/Gazelle|SA342|Fennec|AS550|AS350|Esquilo|Cheetah|Chetak|Mi-2\b|Bell 206/, "h_light"],
  ];
  const TANK = [
    [/T-14|Armata/, "t_t14"], [/Abrams|M1A|K1A|K1\b/, "t_abrams"], [/Challenger|Al-Hussein|Arjun/, "t_chally"], [/Merkava/, "t_merkava"],
    [/Leclerc|Type 10|Type 90|Ariete|K2/, "t_leclerc"], [/Leopard 2|Strv 122|2A[4-8]|Pz 87|Altay|PT-91|Twardy|Pendekar/, "t_leo2"],
    [/Type 99|Type 96|VT-4|MBT-2000|Al-Khalid|Al-Zarrar|Type 85/, "t_type99"], [/T-80|T-84|Oplot/, "t_t80"],
    [/T-72|T-90|Bhishma|Ajeya|Karrar|Zulfiqar|T-64|Bulat|M-84|Pokpung|Chonma-20|Aslan|TR-85|Bizonul/, "t_t72"],
    [/Leopard 1|OF-40|AMX-30|TAM|CM-11|Vickers|Olifant|Type 74/, "t_leo1"], [/M60|M48|Sabra|Chieftain|Khalid|Phoenix|Type 88/, "t_m60"],
    [/T-5[45]|T-62|Type 59|Type 69|Chonma|TR-580/, "t_t55"],
  ];
  window.unitShape = (key, model) => {
    const fam = key === "troops" ? "" : window.modelSpec(key, model).family;
    switch (key) {
      case "troops": return "squad";
      case "tanks": return /light|Type 15|Type 62|Type 63|Scorpion|M41|PT-76|AMX-13|SK-105|Harimau|Sabrah/i.test(model) ? "t_light" : pick(model, TANK, "t_abrams");
      case "afv": return /MRAP/.test(fam) ? "mrap" : /Stryker|Boxer|BTR|VBCI|Patria|Piranha|Rosomak|LAV|Freccia|Centauro|Type 16|ZBL|Guarani|Pandur|Kestrel|CM-32|Saad|Fuchs|VAB|Griffon|Jaguar|WZ-551|Fahd|Cascavel|EE-11|BRDM|Type 96 \/ Type 89/i.test(model) ? "wheeled" : "ifv";
      case "arty": return /rocket/i.test(fam) ? "mlrs" : /Mortar/i.test(fam) ? "mortar" : /towed|Towed|M777|D-30|M-46|M101|L118|FH70|M119|M114/i.test(model) ? "towed" : "spg";
      case "fighters": return pick(model, FIGHTER, /5th-gen/.test(fam) ? "f35" : /Ground-attack/.test(fam) ? "su25" : "f16");
      case "aircraft": return pick(model, BIG, /bomber/i.test(fam) ? "b52" : /drone/i.test(fam) ? "d_tb2" : /Trainer/.test(fam) ? "trainer" : /AEW|ISR|patrol/i.test(fam) ? "p8" : "c130");
      case "helis": return pick(model, HELI, /Attack|gunship/i.test(fam) ? "h_ah64" : "h_utility");
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
    maint: { body: "#7c7a74", dark: "#56544f", light: "#a19e96" }, // down for maintenance
  };

  // Draw a shape centred at 0,0, nose pointing up, `L` pixels long.
  function draw(c, shape, L, p, frame) {
    const u = L / 10; // drawing unit
    const rect = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * u, y * u) : c.moveTo(x * u, y * u))); c.closePath(); c.fill(); };
    const disc = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x * u, y * u, r * u, 0, 2 * Math.PI); c.fill(); };
    const mirror = (pts, col) => poly(pts.concat(pts.slice().reverse().map(([x, y]) => [-x, y])), col);
    const ell = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x * u, y * u, rx * u, ry * u, 0, 0, 2 * Math.PI); c.fill(); };
    const canopy = (y, len, w) => { ell(0, y, w, len, "#23292e"); ell(-w * 0.3, y - len * 0.3, w * 0.35, len * 0.35, "#6f8796"); };
    if (JETS[shape]) {
      const j = JETS[shape];
      mirror(j.pts, p.body);
      if (j.canard) { mirror(j.canard, p.body); }
      if (j.nacelle) { const [x, y, w, h] = j.nacelle; rect((x - w / 2) * u, y * u, w * u, h * u, p.dark); rect((-x - w / 2) * u, y * u, w * u, h * u, p.dark); }
      // Spine highlight, then fins (twin fins canted outward on stealth types), canopy, nozzles.
      c.globalAlpha *= 0.35; rect(-0.18 * u, -4.2 * u, 0.36 * u, 8.6 * u, p.light); c.globalAlpha /= 0.35;
      if (j.fin) [-1, 1].forEach(sd => (j.cant ? poly([[sd * j.fin, 2.2], [sd * (j.fin + 0.35), 4.3], [sd * (j.fin + 0.15), 4.4], [sd * (j.fin - 0.15), 2.4]], p.dark) : rect((sd * j.fin - 0.1) * u, 2.6 * u, 0.2 * u, 2.1 * u, p.dark)));
      else rect(-0.1 * u, 2.6 * u, 0.2 * u, 2.4 * u, p.dark);
      if (shape !== "b1") canopy(-3.1, 0.75, 0.24);
      else ell(0, -3.9, 0.22, 0.35, "#23292e");
      return;
    }
    if (HEAVY[shape]) {
      const h = HEAVY[shape], fw = h.fw / 2, sw = (x) => h.wy + (x - fw) * h.sweep;
      // Wings (top or lower plane), tailplane, fuselage with a rounded nose, fin, engines.
      const wing = (y0) => mirror([[fw, y0], [h.hs, y0 + (h.hs - fw) * h.sweep], [h.hs, y0 + (h.hs - fw) * h.sweep + h.tc], [fw, y0 + h.rc]], p.body);
      wing(h.wy);
      if (h.bi) { c.globalAlpha *= 0.6; wing(h.wy + 1.4); c.globalAlpha /= 0.6; }
      mirror([[fw * 0.8, h.ty], [h.stab, h.ty + 0.5 + h.stab * h.sweep * 0.25], [h.stab, h.ty + 0.85 + h.stab * h.sweep * 0.25], [fw * 0.6, h.ty + 0.9]], p.body);
      mirror([[0, -5], [fw * 0.7, -4.7], [fw, -4.1], [fw, 3.2], [fw * 0.45, 5], [0, 5]], p.light);
      rect(-0.1 * u, 3.4 * u, 0.2 * u, 1.6 * u, p.dark);
      for (const x of h.eng) [-1, 1].forEach(sd => {
        const ex = sd * x, ey = sw(x) - (h.prop ? 0.5 : 0.75);
        if (h.pair) { rect((ex - 0.32) * u, ey * u, 0.26 * u, 1.1 * u, p.dark); rect((ex + 0.06) * u, ey * u, 0.26 * u, 1.1 * u, p.dark); }
        else rect((ex - 0.2) * u, ey * u, 0.4 * u, 1.15 * u, p.dark);
        if (h.prop) { c.globalAlpha *= 0.45; ell(ex, ey - 0.05, h.len > 40 ? 0.95 : 0.75, 0.12, "#202326"); c.globalAlpha /= 0.45; }
      });
      if (h.rear) [-1, 1].forEach(sd => rect((sd * (fw + 0.25) - 0.22) * u, 2.6 * u, 0.44 * u, 1.1 * u, p.dark));
      if (h.nose) { c.globalAlpha *= 0.45; ell(0, -5, 1.1, 0.12, "#202326"); c.globalAlpha /= 0.45; }
      if (h.dome) { ell(0, 1.6, h.dome, h.dome, "#2f3438"); ell(0, 1.6, h.dome * 0.82, h.dome * 0.82, "#e4e7ea"); rect(-h.dome * 0.82 * u, 1.5 * u, h.dome * 1.64 * u, 0.2 * u, "#2f3438"); }
      if (h.bar) rect(-0.18 * u, -0.3 * u, 0.36 * u, 2.6 * u, "#e4e7ea");
      ell(0, -4.55, fw * 0.55, 0.22, "#23292e");
      return;
    }
    if (shape.startsWith("d_")) {
      const d = DRONES[shape.slice(2)];
      if (d.delta) { mirror([[0, -5], [0.4, -3.6], [3.5, 3.4], [3.5, 4.4], [0.4, 4.4], [0.3, 5], [0, 5]], p.body); rect(-0.08 * u, 3 * u, 0.16 * u, 2 * u, p.dark); return; }
      mirror([[d.hs, d.wy], [d.hs, d.wy + d.chord * 0.6], [d.fw / 2, d.wy + d.chord]], p.body);
      mirror([[0, -5], [d.fw / 2, -4.2], [d.fw / 2, 3.4], [d.fw / 3, 4.6], [0, 4.6]], p.light);
      if (d.tail === "V" || d.tail === "Y") mirror([[0.2, 3.2], [2, 4.6], [2, 4.9], [0.2, 4.2]], p.body);
      if (d.tail === "Y") rect(-0.08 * u, 3.6 * u, 0.16 * u, 1.3 * u, p.dark);
      c.globalAlpha *= 0.45; ell(0, 4.8, 1.2, 0.14, "#202326"); c.globalAlpha /= 0.45;
      ell(0, -4.2, d.fw * 0.3, 0.6, "#3a4247");
      return;
    }
    if (shape.startsWith("h_")) {
      // Centred on the main rotor hub (the unit's position); the tail boom reaches back behind it.
      const h = HELIS[shape.slice(2)], g = heliGeom(h), { sc, R, fl, top, cabin } = g, fwh = (h.fw / 2) * sc;
      if (h.stub) rect(-h.stub * sc * u, (top + cabin * 0.5) * u, h.stub * sc * 2 * u, 1.1 * sc * u, p.dark);
      if (h.tandem) poly([[-fwh, top + 0.4], [-fwh * 0.6, top], [fwh * 0.6, top], [fwh, top + 0.4], [fwh, top + fl - 0.2], [-fwh, top + fl - 0.2]], p.body);
      else {
        ell(0, top + cabin / 2, fwh, cabin / 2, p.body);
        rect(-(0.12 * fwh + 0.12) * u, (top + cabin * 0.8) * u, (0.24 * fwh + 0.24) * u, (fl - cabin * 0.8) * u, p.body);
        const tail = top + fl;
        if (h.twin) rect(-1.1 * u, (tail - 0.6) * u, 2.2 * u, 0.35 * u, p.dark);
        else { rect(-1 * u, (tail - 0.9) * u, 2 * u, 0.3 * u, p.dark); c.globalAlpha *= 0.3; ell(0.35, tail - 0.5, 0.1, 0.9, "#111"); c.globalAlpha /= 0.3; }
        ell(0, top + cabin * 0.18, fwh * 0.6, cabin * 0.16, "#23292e");
      }
      // Rotors: a faint blur disc and the blades.
      const rotor = (cy, n, off) => {
        c.globalAlpha *= 0.13; disc(0, cy, R, "#0d1114"); c.globalAlpha /= 0.13;
        c.strokeStyle = "rgba(24,28,31,0.85)"; c.lineWidth = Math.max(0.6, 0.45 * u * sc);
        c.beginPath();
        for (let i = 0; i < n; i++) { const a = off + (i * 2 * Math.PI) / n; c.moveTo(0, cy * u); c.lineTo(Math.cos(a) * R * u, (cy + Math.sin(a) * R) * u); }
        c.stroke();
        disc(0, cy, 0.22, "#2a2e31");
      };
      if (h.tandem) { rotor(top + R * 0.95, h.blades, 0.3); rotor(top + fl - R * 0.95, h.blades, 0.8); }
      else { rotor(0, h.blades, 0.4); if (h.coax) rotor(0, h.blades, 0.4 + Math.PI / h.blades); }
      return;
    }
    if (shape.startsWith("t_")) {
      const t = TANKS[shape.slice(2)], sc = 10 / t.len, hl = t.hull * sc, w = t.w * sc, y0 = 5 - hl; // hull from y0 to 5, gun forward
      rect(-w / 2 * u, y0 * u, w * u, hl * u, p.dark);                                   // tracks
      rect((-w / 2 + 0.55) * u, (y0 + 0.1) * u, (w - 1.1) * u, (hl - 0.2) * u, p.body);  // hull
      c.globalAlpha *= 0.4; rect(-w / 2 * u, y0 * u, 0.25 * u, hl * u, "#000"); rect((w / 2 - 0.25) * u, y0 * u, 0.25 * u, hl * u, "#000"); c.globalAlpha /= 0.4;
      rect(-1.1 * u, (5 - 1.4) * u, 2.2 * u, 0.9 * u, p.dark);                         // engine deck grille
      const ty = t.rear ? y0 + hl * 0.62 : y0 + hl * 0.42, tw = w * 0.62;                // turret centre
      rect(-0.17 * u, -5 * u, 0.34 * u, (ty + 5) * u, p.dark);                           // gun
      switch (t.tur) {
        case "round": disc(0, ty, tw * 0.5, p.light); if (t.era) for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.32; rect((Math.cos(a) * tw * 0.42 - 0.22) * u, (ty + Math.sin(a) * tw * 0.42 - 0.18) * u, 0.44 * u, 0.36 * u, p.dark); } break;
        case "dome": ell(0, ty, tw * 0.48, tw * 0.55, p.light); disc(0.6, ty + 0.4, 0.35, p.dark); break;
        case "wedge": poly([[-tw / 2, ty - 0.4], [0, ty - 2.2], [tw / 2, ty - 0.4], [tw / 2, ty + 2.2], [-tw / 2, ty + 2.2]], p.light); if (t.era) { rect(-tw / 2 * u, (ty - 0.2) * u, 0.3 * u, 2 * u, p.dark); rect((tw / 2 - 0.3) * u, (ty - 0.2) * u, 0.3 * u, 2 * u, p.dark); } break;
        case "box": rect(-tw / 2 * u, (ty - 1.4) * u, tw * u, 3.4 * u, p.light); rect(-tw / 2 * u, (ty - 1.4) * u, tw * u, 0.3 * u, p.dark); break;
        case "merkava": poly([[-tw / 2, ty - 0.6], [-0.5, ty - 2.6], [0.5, ty - 2.6], [tw / 2, ty - 0.6], [tw / 2, ty + 1.6], [-tw / 2, ty + 1.6]], p.light); break;
        default: poly([[-tw / 2, ty - 1.2], [tw / 2, ty - 1.2], [tw / 2 + 0.3, ty + 1.2], [tw / 2 - 0.2, ty + 2.4], [-tw / 2 + 0.2, ty + 2.4], [-tw / 2 - 0.3, ty + 1.2]], p.light); // Abrams-style, rear bustle
      }
      disc(0.55, ty + 0.6, 0.32, p.dark); // commander's hatch
      return;
    }
    switch (shape) {
      case "a10": {
        rect(-5.4 * u, -0.6 * u, 10.8 * u, 1.5 * u, p.body); poly([[-5.4, -0.6], [-5.4, 0.9], [-5.2, 0.7], [-5.2, -0.5]], p.dark);
        mirror([[0, -5], [0.35, -4.4], [0.5, -3], [0.5, 3.9], [0.3, 4.6], [0, 4.6]], p.body);
        rect(-2.1 * u, 3.9 * u, 4.2 * u, 0.8 * u, p.body); rect(-2.25 * u, 3.4 * u, 0.3 * u, 1.6 * u, p.dark); rect(1.95 * u, 3.4 * u, 0.3 * u, 1.6 * u, p.dark);
        ell(-0.95, 2.2, 0.45, 0.95, p.dark); ell(0.95, 2.2, 0.45, 0.95, p.dark);
        rect(-0.06 * u, -5.4 * u, 0.12 * u, 0.6 * u, "#2b2f33");
        canopy(-3.4, 0.6, 0.26);
        break;
      }
      case "prop": {
        mirror([[0.45, -1.4], [5.4, -0.8], [5.4, -0.1], [0.45, 0.4]], p.body);
        mirror([[0, -5], [0.4, -4.6], [0.5, -2.5], [0.4, 3.6], [0.15, 4.8], [0, 4.8]], p.light);
        mirror([[0.2, 3.9], [1.9, 4.2], [1.9, 4.7], [0.2, 4.8]], p.body);
        rect(-0.08 * u, 3.6 * u, 0.16 * u, 1.3 * u, p.dark);
        c.globalAlpha *= 0.45; ell(0, -5, 1.2, 0.12, "#202326"); c.globalAlpha /= 0.45;
        canopy(-2.6, 0.9, 0.28);
        break;
      }
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
      case "squad": {
        // Ten soldiers marching in two files, seen from above: boots stepping, arms swinging,
        // helmet, shoulders, pack and rifle. `frame` (0–3) is the step.
        const st = [0.5, 0, -0.5, 0][frame || 0];
        for (let i = 0; i < 10; i++) {
          const x = (i % 2 ? 1 : -1) * 1.7, y = -3.6 + Math.floor(i / 2) * 1.9;
          ell(x - 0.32, y + 0.15 - st, 0.2, 0.36, "#262a22"); ell(x + 0.32, y + 0.15 + st, 0.2, 0.36, "#262a22"); // boots
          ell(x - 0.78, y + st * 0.6, 0.2, 0.3, p.body); ell(x + 0.78, y - st * 0.6, 0.2, 0.3, p.body);         // arms
          ell(x, y, 0.72, 0.42, p.body);                                                                        // shoulders
          rect((x - 0.42) * u, (y + 0.12) * u, 0.84 * u, 0.42 * u, p.dark);                                     // pack
          disc(x, y - 0.06, 0.4, p.light); disc(x, y - 0.06, 0.4 * 0.55, p.body);                               // helmet
          rect((x + 0.5) * u, (y - 1.25) * u, 0.13 * u, 1.3 * u, "#1d1f1b");                                   // rifle
        }
        break;
      }
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
      case "wing": poly([[0, -5], [12.5, 4], [11.4, 5], [8.7, 3.3], [6.1, 5], [3, 2.9], [0, 4.4], [-3, 2.9], [-6.1, 5], [-8.7, 3.3], [-11.4, 5], [-12.5, 4]], "#3b4046"); ell(0, -2.6, 0.5, 1.0, "#23292e"); break;
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
  window.unitSprite = (shape, palette, lengthPx, sel, dpr, frame) => {
    const L = Math.max(4, Math.round(lengthPx)), key = `${shape}|${palette}|${L}|${sel ? 1 : 0}|${dpr}|${frame || 0}`;
    let s = cache.get(key);
    if (s) return s;
    const span = L * Math.max(1, reach(shape) / 5), pad = 3, dim = Math.ceil(span + pad * 2 + (sel ? 4 : 0));
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
    draw(a2, shape, L, PAL[palette] || PAL.olive, frame);
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
    if (palette === "maint") { c.fillStyle = "#ff9f1c"; c.beginPath(); c.strokeStyle = "#2a1a05"; c.lineWidth = 1; c.arc(0, 0, Math.max(1.8, L * 0.07), 0, 2 * Math.PI); c.fill(); c.stroke(); } // 🔧 marker on the unit
    if (sel) { c.strokeStyle = "#ffd25e"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, span / 2 + 2, 0, 2 * Math.PI); c.stroke(); }
    s = { canvas: cv, dim };
    cache.set(key, s);
    if (cache.size > 800) cache.delete(cache.keys().next().value);
    return s;
  };
})();
