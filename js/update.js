// Keeping every player on the newest version.
//
// The site is an installable app (manifest.webmanifest) with a service worker (sw.js) that always
// fetches the newest files first and only falls back to its copies when offline. This script checks
// version.json every few minutes and whenever the page comes back into view; when a newer version is
// out it saves the campaign and reloads into it (waiting while you're in the middle of an order).
// Saves carry over to every new version (js/game.js adopt).
(function () {
  const me = document.currentScript && new URL(document.currentScript.src).searchParams.get("v");
  window.WW3_VERSION = me || "";
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  let pending = false;
  async function check() {
    if (pending || !location.protocol.startsWith("http")) return;
    try {
      const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
      const v = (await r.json()).version;
      if (v && me && String(v) !== String(me)) update(v);
    } catch (e) { /* offline: try again later */ }
  }
  function update(v) {
    pending = true;
    const bar = document.createElement("div");
    bar.className = "update-bar";
    bar.textContent = "A new version of World War 3 is out. Saving your progress and updating…";
    document.body.appendChild(bar);
    const go = () => {
      // Don't pull the rug out mid-order: wait until no units are selected.
      if (document.querySelector(".cmdbar:not([hidden])") && !document.hidden) return setTimeout(go, 5000);
      try { window.GAME && window.GAME.save(); } catch (e) { /* storage unavailable */ }
      setTimeout(() => location.reload(), 1500); // gives the account sync a moment to upload
    };
    setTimeout(go, 2500);
  }
  setInterval(check, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
  setTimeout(check, 20000);
})();
