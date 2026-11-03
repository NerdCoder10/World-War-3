// Accounts and saved progress.
//
// Progress is always saved in this browser (js/game.js save). With an account, every save is also
// copied to the cloud (Firebase: Authentication + Cloud Firestore, one document per player under
// saves/{uid}), so the campaign follows you to any device. Signing in on a device picks the newer
// of the two saves; the other is kept as a backup. Cloud accounts switch on once the site's
// Firebase settings are filled in (js/firebase-config.js); until then players can download their
// save and load it on another device.
(function () {
  const G = window.GAME, cfg = window.FIREBASE_CONFIG || null;
  const enabled = !!(cfg && cfg.apiKey && cfg.projectId);
  const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  const btn = document.getElementById("acct-btn"), panel = document.getElementById("acct");
  let auth = null, db = null, user = null, lastUp = 0, upTimer = null, note = "", busy = false;
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const ago = t => { if (!t) return "never"; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
  const loadScript = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });

  async function init() {
    render();
    if (!enabled) return;
    try {
      await loadScript(SDK + "firebase-app-compat.js");
      await Promise.all([loadScript(SDK + "firebase-auth-compat.js"), loadScript(SDK + "firebase-firestore-compat.js")]);
      window.firebase.initializeApp(cfg);
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      auth.onAuthStateChanged(async u => { user = u; render(); if (u) await syncDown(); });
    } catch (e) { note = "Couldn't reach the account service. Progress is still saved in this browser."; render(); }
  }
  const doc = () => db.collection("saves").doc(user.uid);
  // On sign-in: keep whichever save is newer, the cloud copy or this browser's.
  async function syncDown() {
    try {
      const snap = await doc().get(), local = G.state.savedAt || 0;
      if (snap.exists) {
        const d = snap.data();
        if ((d.savedAt || 0) > local && d.state) {
          const err = G.replaceState(JSON.parse(d.state));
          if (!err) { sessionStorage.setItem("ww3-note", "Loaded your saved campaign from your account."); location.reload(); return; }
        }
      }
      await upload();
    } catch (e) { note = "Couldn't sync with your account just now. Progress is saved in this browser and will upload later."; render(); }
  }
  async function upload() {
    if (!user || !db) return;
    try {
      let state = G.state;
      let json = JSON.stringify(state);
      if (json.length > 900000) { state = { ...state, log: state.log.slice(0, 20) }; json = JSON.stringify(state); } // Firestore's 1 MB limit
      await doc().set({ state: json, savedAt: G.state.savedAt || Date.now(), version: window.WW3_VERSION || "", name: user.displayName || user.email || "" });
      lastUp = Date.now(); note = ""; render();
    } catch (e) { note = "Couldn't upload to your account just now; it will try again on the next save."; render(); }
  }
  // Every save goes to the cloud too, at most every 15 seconds, and right away when you leave.
  window.addEventListener("ww3-saved", () => { if (!user) return; clearTimeout(upTimer); upTimer = setTimeout(upload, Math.max(2000, 15000 - (Date.now() - lastUp))); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && user) { clearTimeout(upTimer); upload(); } });

  // Download / load a save file (works with or without an account).
  function download() {
    const blob = new Blob([JSON.stringify(G.state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ww3-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function loadFile(file) {
    const r = new FileReader();
    r.onload = () => {
      let obj = null;
      try { obj = JSON.parse(r.result); } catch (e) { /* not JSON */ }
      const err = G.replaceState(obj);
      if (err) { note = err; render(); return; }
      sessionStorage.setItem("ww3-note", "Save loaded.");
      if (user) upload().finally(() => location.reload()); else location.reload();
    };
    r.readAsText(file);
  }

  function render() {
    if (!btn) return;
    btn.textContent = user ? "☁ " + (user.displayName || user.email || "Account").split(/[ @]/)[0] : "Sign in";
    btn.title = user ? "Your account and saved progress" : "Sign in to save your progress to your account";
    const files = `<div class="acct-row"><button data-a="dl">Download save</button><label class="acct-file">Load save<input type="file" accept="application/json,.json" data-a="ul"></label></div>`;
    let body;
    if (!enabled) {
      body = `<h4>Saved progress</h4><p>Your campaign saves automatically in this browser, including after every game update. Cloud accounts aren't switched on for this site yet: to carry a campaign to another device, download your save and load it there.</p>${files}`;
    } else if (!user) {
      body = `<h4>Sign in to save your progress</h4><p>Your campaign then follows you to any device. It also saves in this browser either way.</p>
        <button class="acct-google" data-a="google">Sign in with Google</button>
        <form data-a="email"><input type="email" name="em" placeholder="Email" autocomplete="email" required><input type="password" name="pw" placeholder="Password (6+ characters)" autocomplete="current-password" minlength="6" required>
        <div class="acct-row"><button type="submit" name="mode" value="in">Sign in</button><button type="submit" name="mode" value="up">Create account</button></div></form>${files}`;
    } else {
      body = `<h4>${esc(user.displayName || user.email || "Signed in")}</h4><p>Progress saves to your account automatically. Last upload: <b>${ago(lastUp)}</b>.</p>
        <div class="acct-row"><button data-a="sync">Save now</button><button data-a="out">Sign out</button></div>${files}`;
    }
    panel.innerHTML = `<button class="acct-close" aria-label="Close">×</button>${body}${note ? `<p class="acct-note">${esc(note)}</p>` : ""}`;
    panel.querySelector(".acct-close").onclick = () => (panel.hidden = true);
    const on = (a, f) => { const el = panel.querySelector(`[data-a="${a}"]`); if (el) f(el); };
    on("dl", el => (el.onclick = download));
    on("ul", el => (el.onchange = () => el.files[0] && loadFile(el.files[0])));
    on("google", el => (el.onclick = () => auth.signInWithPopup(new window.firebase.auth.GoogleAuthProvider()).catch(e => { note = e.message; render(); })));
    on("sync", el => (el.onclick = () => upload()));
    on("out", el => (el.onclick = () => auth.signOut()));
    on("email", form => (form.onsubmit = ev => {
      ev.preventDefault();
      if (busy) return;
      busy = true;
      const em = form.em.value.trim(), pw = form.pw.value, up = ev.submitter && ev.submitter.value === "up";
      (up ? auth.createUserWithEmailAndPassword(em, pw) : auth.signInWithEmailAndPassword(em, pw))
        .catch(e => { note = e.message.replace(/^Firebase: /, ""); render(); }).finally(() => (busy = false));
    }));
  }
  if (btn) btn.onclick = () => { panel.hidden = !panel.hidden; if (!panel.hidden) render(); };
  const pendingNote = sessionStorage.getItem("ww3-note");
  if (pendingNote) { sessionStorage.removeItem("ww3-note"); setTimeout(() => { const t = document.querySelector(".toast"); if (t) { t.textContent = pendingNote; t.hidden = false; setTimeout(() => (t.hidden = true), 4000); } }, 1500); }
  init();
})();
