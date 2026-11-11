// Day and night. Each day's battle is fought through the hours of daylight and darkness at the
// battlefield: long winter nights in the north (and polar night above the Arctic Circle), short
// summer ones, twelve-hour nights in the tropics, and moonlight that helps forces without night
// vision. Each military fights differently in the dark, from the US, British and Israeli forces
// that train to "own the night" with thermal sights, night-vision goggles and night-trained
// helicopter crews, to armies that can barely move after dark. No dice: the sun and moon follow
// real astronomy for the campaign date.

// Losses in full darkness for a force with no night equipment, by class (see WEATHER_CLASS).
window.NIGHT_PEN = { veh: 0.45, inf: 0.5, air: 0.5, heli: 0.6, sea: 0.15, sub: 0 };

// Night-fighting capability (0–1 of the dark's losses avoided) by class: veh (thermal sights),
// inf (night-vision goggles, thermal weapon sights), air (targeting pods, radar), heli (NVG
// crews). Countries not listed: from their technology generation.
window.NIGHT_CAP = {
  USA: [{ veh: 0.95, inf: 0.95, air: 0.95, heli: 0.95 }, "'We own the night': every soldier has night-vision goggles, every vehicle thermal sights, and the 160th SOAR flies at night"],
  GBR: [{ veh: 0.9, inf: 0.85, air: 0.9, heli: 0.9 }, "Thermal sights and NVGs throughout; night raids are standard"],
  ISR: [{ veh: 0.9, inf: 0.9, air: 0.9, heli: 0.9 }, "Fights most of its raids at night with full thermal and NVG kit"],
  FRA: [{ veh: 0.85, inf: 0.8, air: 0.85, heli: 0.85 }, "Makes its own thermal sights (Thales) and fought night operations across the Sahel"],
  DEU: [{ veh: 0.85, inf: 0.75, air: 0.8, heli: 0.75 }, "Leopard 2s and Pumas with thermal sights"], AUS: [{ veh: 0.85, inf: 0.85, air: 0.85, heli: 0.85 }, "US-style night kit and training"],
  CAN: [{ veh: 0.85, inf: 0.8, air: 0.85, heli: 0.8 }, "US-style night kit"], NLD: [{ veh: 0.85, inf: 0.8, air: 0.85, heli: 0.85 }, "US-style night kit"],
  NOR: [{ veh: 0.85, inf: 0.85, air: 0.85, heli: 0.8 }, "Trains through the Arctic polar night"], FIN: [{ veh: 0.8, inf: 0.85, air: 0.8, heli: 0.75 }, "Trains through long Nordic winter nights"],
  SWE: [{ veh: 0.85, inf: 0.8, air: 0.85, heli: 0.8 }, "Trains through long Nordic winter nights"], POL: [{ veh: 0.75, inf: 0.7, air: 0.8, heli: 0.7 }, "Re-equipping with Western thermal kit"],
  JPN: [{ veh: 0.8, inf: 0.75, air: 0.85, heli: 0.8 }, "Modern thermal and NVG kit"], KOR: [{ veh: 0.85, inf: 0.8, air: 0.85, heli: 0.8 }, "Trains for night infiltration from the North"],
  TWN: [{ veh: 0.7, inf: 0.65, air: 0.8, heli: 0.75 }, "Modernising night kit"], SGP: [{ veh: 0.85, inf: 0.8, air: 0.85, heli: 0.85 }, "Fully modern night kit"],
  UKR: [{ veh: 0.7, inf: 0.75, air: 0.55, heli: 0.6 }, "Western thermal sights and thermal drones; much of the war is fought at night"],
  CHN: [{ veh: 0.75, inf: 0.65, air: 0.8, heli: 0.7 }, "Fielding thermal sights and NVGs across the PLA, with growing night training"],
  RUS: [{ veh: 0.55, inf: 0.45, air: 0.6, heli: 0.6 }, "Thermal sights relied on French Thales parts, now cut off; few soldiers have night-vision goggles"],
  IND: [{ veh: 0.6, inf: 0.55, air: 0.75, heli: 0.6 }, "Night sights on part of the armour; NVGs mostly with special forces"],
  PAK: [{ veh: 0.5, inf: 0.45, air: 0.7, heli: 0.55 }, "Night sights on part of the armour"], TUR: [{ veh: 0.75, inf: 0.65, air: 0.8, heli: 0.75 }, "Makes its own thermal sights (Aselsan)"],
  IRN: [{ veh: 0.35, inf: 0.35, air: 0.35, heli: 0.35 }, "Old armour with few thermal sights"], PRK: [{ veh: 0.25, inf: 0.4, air: 0.2, heli: 0.25 }, "Trains for night infiltration, but has little night-vision kit"],
  SAU: [{ veh: 0.7, inf: 0.55, air: 0.85, heli: 0.75 }, "Modern Western kit, limited night training"], ARE: [{ veh: 0.75, inf: 0.65, air: 0.85, heli: 0.8 }, "Modern Western kit and combat experience"],
  EGY: [{ veh: 0.55, inf: 0.4, air: 0.6, heli: 0.55 }, "Mixed fleet; thermal sights on its M1A1s"], VNM: [{ veh: 0.3, inf: 0.55, air: 0.4, heli: 0.35 }, "Infantry steeped in night fighting, but old kit"],
};

// Sun and moon (accurate enough for gameplay; equation of time ignored).
const RAD = Math.PI / 180;
window.sunDeclination = doy => -23.44 * Math.cos((2 * Math.PI / 365) * (doy + 10));
// Hours of darkness at a latitude on a day of the year (sun below the horizon, with twilight's
// first half-hour counted as light).
window.darkHours = (lat, doy) => {
  const d = window.sunDeclination(doy) * RAD, cosH = -Math.tan(lat * RAD) * Math.tan(d);
  const day = cosH <= -1 ? 24 : cosH >= 1 ? 0 : (2 * Math.acos(cosH) / RAD) / 15;
  return Math.max(0, Math.min(24, 24 - day - 1));
};
// Share of the moon lit (0 new, 1 full), from a known new moon (6 Jan 2000, 18:14 UTC).
window.moonLight = ms => { const p = (((ms - 947182440000) / 86400000) % 29.530588 + 29.530588) % 29.530588 / 29.530588; return (1 - Math.cos(2 * Math.PI * p)) / 2; };
window.moonIcon = f => (f < 0.06 ? "🌑" : f < 0.35 ? "🌒" : f < 0.65 ? "🌓" : f < 0.94 ? "🌔" : "🌕");
// Is the sun up at a point (lon, lat) at a moment (ms, UTC)?
window.sunUp = (lon, lat, ms, doy) => {
  const hourUTC = (ms / 3600000) % 24, ha = ((hourUTC + lon / 15 - 12) * 15) * RAD, d = window.sunDeclination(doy) * RAD;
  return Math.sin(lat * RAD) * Math.sin(d) + Math.cos(lat * RAD) * Math.cos(d) * Math.cos(ha) > -0.0145;
};
