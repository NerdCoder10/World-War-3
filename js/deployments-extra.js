// Additional named installations for militaries whose basing was thin (open sources: national
// ministries, IISS, Janes, OSM). Same row format as js/deployments.js:
// [name, lon, lat, ground share, air share, naval share, note].
(function () {
  const add = (iso, rows) => (window.DEPLOYMENTS[iso] = (window.DEPLOYMENTS[iso] || []).concat(rows));
  add("UKR", [
    ["Starokostiantyniv air base", 27.21, 49.75, 0, 8, 0, "Su-24M and Storm Shadow strike wing."],
    ["Myrhorod air base", 33.64, 49.93, 0, 6, 0, "Su-27 fighter brigade."],
    ["Vasylkiv air base", 30.3, 50.23, 0, 5, 0, "MiG-29 brigade defending Kyiv."],
    ["Mykolaiv (southern command)", 31.99, 46.97, 6, 0, 2, "Marines and the southern operational command."],
    ["Yavoriv training area", 23.55, 49.95, 3, 0, 0, "International training and mobilisation centre."],
  ]);
  add("PRK", [
    ["Sunan air base (Pyongyang)", 125.67, 39.22, 0, 6, 0, "Air defence of the capital; MiG-29s."],
    ["Pukchang air base", 125.95, 39.5, 0, 5, 0, "MiG-23 regiment."],
    ["Panmunjom (DMZ)", 126.68, 37.96, 3, 0, 0, "Joint Security Area, fortified frontline positions."],
    ["Kangdong", 126.1, 39.15, 5, 0, 0, "Artillery and the capital's outer defence ring, tunnels in the hills."],
    ["Mayang-do naval base", 128.2, 40.0, 1, 0, 8, "East Sea Fleet submarine base, cut into the island's cliffs."],
  ]);
  add("EGY", [
    ["Fayed air base", 32.32, 30.32, 0, 7, 0, "F-16 and Rafale wing near the Suez Canal."],
    ["El Mansoura air base", 31.43, 31.05, 0, 5, 0, "Fighter base in the Nile Delta."],
    ["Marsa Matruh (Western Military Zone)", 27.24, 31.35, 5, 0, 1, "Libya-facing command."],
    ["Qena", 32.72, 26.16, 3, 2, 0, "Upper Egypt garrison and air base."],
  ]);
  add("IRN", [
    ["Dezful (Vahdati air base)", 48.4, 32.43, 0, 6, 0, "F-5 and F-4 wing near Iraq."],
    ["Khorramabad (Imam Ali missile base)", 48.35, 33.43, 2, 0, 0, "IRGC ballistic missile base in hardened tunnels."],
    ["Kharg Island", 50.32, 29.25, 1, 0, 2, "Defences of Iran's main oil terminal."],
  ]);
  add("BRA", [
    ["Itaguaí submarine base", -43.84, -22.93, 0, 0, 6, "Scorpène (Riachuelo) submarine yard and base."],
    ["Canoas air base", -51.14, -29.94, 0, 4, 0, "F-5EM squadron in the south."],
    ["Santa Cruz air base", -43.72, -22.93, 0, 5, 0, "Fighter and transport base for Rio."],
  ]);
  add("THA", [
    ["Takhli air base", 100.29, 15.28, 0, 5, 0, "F-16 and Alpha Jet wing."],
    ["Ubon Ratchathani air base", 104.87, 15.25, 0, 4, 0, "Northeastern air base near Laos and Cambodia."],
    ["Hat Yai", 100.39, 6.93, 3, 2, 0, "Southern garrison and air base."],
  ]);
})();
