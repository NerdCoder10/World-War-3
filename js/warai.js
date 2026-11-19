// War AIs: how each country would really behave in a war, from its doctrine, its record and its
// leadership. Every country's AI follows its own personality (js/game.js):
//   aggr     readiness to attack, strike back and let rivalries boil over (0–1)
//   commit   how much of its army it throws into an attack (×, 1 = typical)
//   patience days it waits between strikes
//   missiles how heavily it fires missiles and drones (×)
//   retreat  pulls an invasion back when its daily odds fall below this (0 = never)
//   hybrid   reliance on cyber attacks, sabotage, covert teams and proxies (0–1): more frequent
//   grit     tolerance of losses: raises its will to fight on before surrendering (0–1)
// [name, aggr, commit, patience, missiles, retreat, hybrid, grit, how it fights]
window.WAR_AI = {
  USA: ["Shock and awe", 0.5, 1.2, 3, 1.5, 0.25, 0.6, 0.4, "Slow to start wars with peers but retaliates hard: opens with overwhelming air and missile strikes, then a fast joint offensive; sensitive to casualties at home"],
  RUS: ["Grind and terrorise", 0.8, 1.3, 2, 1.6, 0.08, 0.9, 0.95, "Grinds forward whatever the losses, pounds cities and power grids with missiles and drones, and wages hybrid war (sabotage, cyber, disinformation) on its enemies' allies; rarely retreats unless forced"],
  CHN: ["Systems destruction", 0.35, 1.1, 6, 1.8, 0.2, 0.8, 0.6, "Patient grey-zone pressure; if it fights, it opens with massive missile strikes on bases and carriers and seeks a short, sharp war near home"],
  ISR: ["Pre-emption and decapitation", 0.6, 1.2, 2, 1.2, 0.2, 0.9, 0.5, "Strikes first, kills enemy commanders and blinds air defences, then fights short, decisive campaigns; deeply sensitive to hostages and casualties"],
  IRN: ["Axis of resistance", 0.5, 0.6, 4, 1.6, 0.3, 1, 0.8, "Fights through proxies (Hezbollah, the Houthis, Iraqi militias) and missile barrages, avoids direct ground war and keeps up sabotage and cyber attacks"],
  PRK: ["All or nothing", 0.4, 1.3, 5, 1.5, 0.05, 0.7, 1, "Threatens and provokes, holds Seoul hostage with massed artillery; in a real war it throws everything in at once and never surrenders"],
  UKR: ["Asymmetric defence", 0.4, 1, 2, 1.3, 0.12, 0.9, 0.85, "Defends doggedly, strikes deep inside Russia with drones and sabotage, and counter-attacks where Russia is weak (Kursk, 2024)"],
  TUR: ["Forward defence", 0.55, 0.9, 3, 1, 0.2, 0.6, 0.6, "Cross-border operations backed by drones and allied militias; keeps wars limited"],
  IND: ["Calibrated punishment", 0.35, 1, 4, 1, 0.2, 0.4, 0.6, "Measured retaliation (Operation Sindoor, 2025): precise punitive strikes, then it stops"],
  PAK: ["Answer every blow", 0.45, 1.1, 3, 1.2, 0.15, 0.8, 0.8, "Answers every Indian strike and leans on militant proxies"],
  SAU: ["Air war by proxy", 0.4, 0.8, 4, 1, 0.3, 0.5, 0.2, "Prefers air campaigns and paid allies; avoids ground losses"],
  ARE: ["Militias and drones", 0.5, 0.8, 3, 1, 0.3, 0.8, 0.3, "Fights through allied militias and drones (Yemen, Libya, Sudan)"],
  EGY: ["Guard the canal", 0.2, 0.9, 6, 0.8, 0.3, 0.3, 0.5, "Cautious: defends its borders and the Suez Canal"], GBR: ["Expeditionary partner", 0.35, 1, 3, 1, 0.25, 0.6, 0.4, "Fights alongside the US; capable but small"],
  FRA: ["Quick intervention", 0.4, 0.9, 3, 1, 0.25, 0.5, 0.4, "Intervenes fast and alone where it has interests"], DEU: ["Reluctant power", 0.1, 0.7, 6, 0.7, 0.35, 0.2, 0.2, "Fights only with allies and in defence"],
  JPN: ["Exclusively defensive", 0.05, 0.6, 8, 0.8, 0.3, 0.2, 0.3, "Constitutionally defensive"], KOR: ["Kill chain", 0.15, 1, 4, 1.2, 0.2, 0.4, 0.6, "Defensive, but promises massive pre-emptive retaliation"],
  TWN: ["Porcupine", 0.05, 1, 5, 1.2, 0.15, 0.4, 0.7, "Purely defensive"], POL: ["Eastern bulwark", 0.2, 1.1, 3, 1, 0.2, 0.3, 0.7, "Defensive, but would fight hard on NATO's eastern flank"],
  AZE: ["Opportunist", 0.6, 1.2, 3, 1, 0.2, 0.5, 0.7, "Strikes when it has the edge (2020, 2023)"], VEN: ["Bluster", 0.4, 0.6, 6, 0.6, 0.4, 0.4, 0.4, "Threatens Guyana over Essequibo but avoids real fights"],
  FIN: ["Total defence", 0.05, 1, 5, 1, 0.1, 0.3, 0.9, "Purely defensive and never gives up"], SWE: ["Total defence", 0.1, 0.9, 5, 1, 0.2, 0.3, 0.6, "Defensive"],
  GRC: ["Aegean watch", 0.15, 0.9, 5, 0.9, 0.25, 0.3, 0.6, "Defensive against Turkey"], CUB: ["Island fortress", 0.05, 1, 8, 0.6, 0.1, 0.6, 0.8, "Defensive"],
  ETH: ["Regional hegemon", 0.6, 1.2, 3, 0.8, 0.15, 0.3, 0.8, "Wants a coast and fights brutal wars"], ERI: ["Garrison state", 0.5, 1.2, 4, 0.6, 0.1, 0.4, 0.9, "Militarised and ruthless"],
  RWA: ["Proxy power", 0.6, 1, 3, 0.8, 0.2, 0.9, 0.7, "Fights through proxies (M23) in Congo"], SDN: ["Civil war", 0.6, 1.2, 2, 0.8, 0.05, 0.4, 0.8, "Locked in civil war"],
  YEM: ["Houthi defiance", 0.8, 1, 2, 1.8, 0.05, 0.8, 0.95, "Fires missiles and drones at shipping and Israel regardless of the cost"],
};
window.warAI = c => {
  const w = window.WAR_AI[c.iso3];
  if (w) return { name: w[0], aggr: w[1], commit: w[2], patience: w[3], missiles: w[4], retreat: w[5], hybrid: w[6], grit: w[7], note: w[8], est: false };
  const m = c.milStats || {}, fer = m.ferocity || 5, pat = m.patriotism || 6, intel = (c.secret && c.secret.intel) || 3;
  const r = x => Math.round(x * 100) / 100;
  return { name: "Defend the homeland", aggr: r(Math.max(0.05, Math.min(0.5, 0.15 + 0.05 * (fer - 5)))), commit: 1, patience: 5, missiles: 1, retreat: 0.25, hybrid: r(Math.min(0.6, 0.1 + 0.05 * intel)), grit: r(Math.min(0.9, 0.2 + 0.06 * pat)), note: "", est: true };
};
