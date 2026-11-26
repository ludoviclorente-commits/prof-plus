/*
 * Prof+ — interface. Rendu en chaînes HTML échappées, délégation d'événements.
 */
(function () {
  "use strict";
  const IPP = (globalThis.IPP = globalThis.IPP || {});

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const days = (d) => Math.round((d - today()) / 864e5);
  const fmtMsgDate = (d) => {
    if (!d) return "";
    const t = today();
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const diff = Math.round((t - day) / 864e5);
    if (diff === 0) return d.getHours() || d.getMinutes() ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "aujourd'hui";
    if (diff === 1) return "hier";
    return fmtDate(d);
  };
  const fmtDate = (d, withYear) =>
    d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", ...(withYear || d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) }) : "";
  const fmtLong = (d) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const plural = (n, a, b) => `${n} ${n > 1 ? b || a + "s" : a}`;

  const ICONS = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    doc: '<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h8M9 17h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    clip: '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  };
  const icon = (n, s = 18) =>
    `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  /** Vue simple : fusionne les périodes consécutives dans le même établissement. */
  const mergeAffect = (lignes) => {
    const out = [];
    for (const l of lignes) {
      const prev = out[out.length - 1];
      if (prev && prev.etab && prev.etab === l.etab) {
        if (l.du && (!prev.du || l.dDu < prev.dDu)) { prev.du = l.du; prev.dDu = l.dDu; }
        if (/titre définitif/i.test(l.nature)) prev.nature = l.nature;
        prev.fonctions = prev.fonctions.concat(l.fonctions);
        prev.sous = prev.sous.concat(l.sous);
        prev.actuelle = prev.actuelle || l.actuelle;
      } else out.push({ ...l, fonctions: l.fonctions.slice(), sous: l.sous.slice() });
    }
    // fonctions : on garde la plus récente de chaque intitulé
    out.forEach((l) => { const seen = new Set(); l.fonctions = l.fonctions.filter((f) => { const k = f.fonction + f.principale; if (seen.has(k)) return false; seen.add(k); return true; }); });
    return out;
  };

  /** Tri du courrier : plus récent d'abord ; sans date lisible, on garde l'ordre d'I-Prof (déjà du plus récent au plus ancien). */
  const byDateDesc = (a, b) => {
    const da = a[0].d ? a[0].d.getTime() : null, db = b[0].d ? b[0].d.getTime() : null;
    if (da != null && db != null && da !== db) return db - da;
    if (da == null && db != null) return -1; // date illisible = sans doute « aujourd'hui » : en haut
    if (db == null && da != null) return 1;
    return a[1] - b[1];
  };

  const VIEWS = [
    ["accueil", "Accueil", "home"],
    ["courrier", "Courrier", "mail"],
    ["parcours", "Mon parcours", "chart"],
    ["dossier", "Mon dossier", "user"],
    ["cv", "CV & formations", "doc"],
    ["services", "Services (SIAM, SIAE…)", "grid"],
  ];

  class App {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts; // { onOriginal(code), onQuit() }
      this.state = { view: "accueil", data: {}, errors: {}, loading: {}, filtre: { theme: "tous", q: "", nonLus: false, max: 60 }, msg: null, histo: false };
      root.addEventListener("click", (e) => this.onClick(e));
      root.addEventListener("input", (e) => this.onInput(e));
      root.addEventListener("keydown", (e) => { if (e.key === "Escape" && this.state.msg) this.closeMsg(); });
    }

    /* ---------- données ---------- */

    async load(key, fn) {
      if (this.state.data[key] || this.state.loading[key]) return;
      this.state.loading[key] = true;
      this.render();
      try {
        this.state.data[key] = await fn();
        delete this.state.errors[key];
      } catch (e) {
        console.warn("[Prof+]", key, e);
        this.state.errors[key] = e instanceof IPP.SessionError ? "session" : String(e.message || e);
      }
      this.state.loading[key] = false;
      this.render();
    }

    loadCore() {
      this.load("synth", async () => IPP.parseSynthese(await IPP.page("Dossier")));
      this.load("courrier", () => IPP.loadCourrier("tous"));
      this.load("promo", async () => IPP.parsePromotions(await IPP.page("Perspectives_Promotions")));
      this.load("anc", async () => IPP.parseAnciennete(await IPP.page("Dossier_Anciennete")));
      this.load("pres", async () => IPP.parsePresentation(await IPP.page("Presentation")));
    }

    loadFor(view) {
      if (view === "parcours") this.load("affect", async () => IPP.parseAffectations(await IPP.page("Dossier_AffectationDetachementJSP")));
      if (view === "cv") {
        this.load("dip", async () => IPP.parseDiplomes(await IPP.page("Cv_Diplomes")));
        this.load("form", async () => IPP.parseFormations(await IPP.page("Cv_Formations")));
      }
      if (view === "services") this.load("services", async () => IPP.parseServices(await IPP.page("Services")));
    }

    refresh() {
      this.state.data = {};
      this.state.errors = {};
      this.loadCore();
      this.loadFor(this.state.view);
    }

    go(view) {
      this.state.view = view;
      this._resetScroll = true;
      this.loadFor(view);
      this.render();
    }

    /* ---------- événements ---------- */

    onClick(e) {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const a = el.dataset.action;
      if (a === "go") { e.preventDefault(); this.go(el.dataset.view); }
      else if (a === "original") { e.preventDefault(); this.opts.onOriginal(el.dataset.code || "Presentation"); }
      else if (a === "quit") { e.preventDefault(); this.opts.onQuit(); }
      else if (a === "refresh") this.refresh();
      else if (a === "reload-courrier") { delete this.state.data.courrier; this.load("courrier", () => IPP.loadCourrier("tous")); }
      else if (a === "theme") { this.state.filtre.theme = el.dataset.theme; this.state.filtre.max = 60; this.render(); }
      else if (a === "nonlus") { this.state.filtre.nonLus = !this.state.filtre.nonLus; this.render(); }
      else if (a === "more") { this.state.filtre.max += 100; this.render(); }
      else if (a === "msg") this.openMsg(+el.dataset.idx);
      else if (a === "close") this.closeMsg();
      else if (a === "histo") { this.state.histo = !this.state.histo; this.render(); }
      else if (a === "service") this.openService(+el.dataset.idx);
    }

    onInput(e) {
      if (e.target.matches("[data-filter=q]")) {
        this.state.filtre.q = e.target.value;
        this.state.filtre.max = 60;
        this.render();
      }
    }

    async openMsg(idx) {
      const c = this.state.data.courrier;
      const m = c && c.messages[idx];
      if (!m) return;
      this.state.msg = { m, loading: true };
      this.render();
      try {
        const detail = await IPP.loadMessage(m);
        if (m.nonLu) { m.nonLu = false; const t = IPP.THEMES[m.theme]; if (t && c.nonLus[t]) c.nonLus[t]--; }
        this.state.msg = { m, detail };
      } catch (err) {
        this.state.msg = { m, error: err instanceof IPP.SessionError ? "session" : String(err.message || err) };
      }
      this.render();
      const close = this.root.querySelector(".modal [data-action=close]");
      if (close) close.focus();
    }

    closeMsg() { this.state.msg = null; this.render(); }

    openService(idx) {
      const s = (this.state.data.services || [])[idx];
      if (!s || s.kind !== "form") return;
      // Recrée le vrai formulaire I-Prof dans la page et le soumet (sur clic de l'utilisateur uniquement).
      const f = document.createElement("form");
      f.method = s.method;
      f.action = new URL(s.action || IPP.base(), location.href).toString();
      f.target = "_blank";
      f.style.display = "none";
      for (const [n, v] of s.inputs) { const i = document.createElement("input"); i.type = "hidden"; i.name = n; i.value = v; f.appendChild(i); }
      document.body.appendChild(f);
      f.submit();
      setTimeout(() => f.remove(), 1000);
    }

    /* ---------- rendu ---------- */

    render() {
      const s = this.state;
      const c = s.data.courrier;
      const unread = c ? Object.values(c.nonLus).reduce((a, b) => a + b, 0) : 0;
      const sessionLost = Object.values(s.errors).includes("session");
      // Conserver la position de défilement et le focus d'un rendu à l'autre
      // (sinon chaque chargement en arrière-plan ou changement de filtre fait sauter la page).
      const prevMain = this.root.querySelector(".main");
      const prevScroll = prevMain && !this._resetScroll ? prevMain.scrollTop : 0;
      const prevFocus = this.root.activeElement && this.root.activeElement.matches("[data-filter=q]") ? this.root.activeElement : null;
      const selStart = prevFocus ? prevFocus.selectionStart : null;
      this._resetScroll = false;
      this.root.querySelector(".ipp-app").innerHTML = `
        <nav class="side" aria-label="Navigation Prof+">
          <div class="brand"><div class="logo">P+</div><div><div class="brand-name">Prof+</div><div class="brand-sub">Outil indépendant, non officiel</div></div></div>
          <div class="nav">
            ${VIEWS.map(([v, l, i]) => `<button class="nav-item ${s.view === v ? "on" : ""}" data-action="go" data-view="${v}" ${s.view === v ? 'aria-current="page"' : ""}>${icon(i)}<span>${esc(l)}</span>${v === "courrier" && unread ? `<span class="badge">${unread}</span>` : ""}</button>`).join("")}
          </div>
          <div class="side-foot">
            <button class="link-btn" data-action="original" data-code="Presentation">${icon("ext", 14)} Interface d'origine</button>
            <button class="link-btn" data-action="quit">Quitter I-Prof</button>
            <p>Vos données restent dans votre navigateur. Rien n'est envoyé ailleurs.</p>
          </div>
        </nav>
        <main class="main" tabindex="-1">
          ${sessionLost ? `<div class="alert warn">${icon("info")}<div><strong>Votre session I-Prof semble expirée.</strong> Reconnectez-vous via ARENA puis rouvrez I-Prof.</div></div>` : ""}
          ${this["v_" + s.view]()}
        </main>
        ${s.msg ? this.modal() : ""}`;
      const main = this.root.querySelector(".main");
      if (main) main.scrollTop = prevScroll;
      if (prevFocus) {
        const inp = this.root.querySelector("[data-filter=q]");
        if (inp) { inp.focus(); if (selStart != null) inp.setSelectionRange(selStart, selStart); }
      }
    }

    box(key, inner) {
      if (this.state.errors[key]) return `<div class="muted small">Impossible de lire cette rubrique (${esc(this.state.errors[key])}). <button class="link-btn inline" data-action="refresh">Réessayer</button></div>`;
      if (!this.state.data[key]) return `<div class="skeleton" aria-label="Chargement"></div>`;
      try { return inner(this.state.data[key]); } catch (e) { console.warn("[Prof+] rendu", key, e); return `<div class="muted small">Affichage indisponible pour cette rubrique.</div>`; }
    }

    nextPromo() {
      const p = this.state.data.promo;
      if (!p || !p.echelons.length) return null;
      return p.echelons.find((e) => days(e.d) >= 0) || p.echelons[p.echelons.length - 1];
    }

    /* Accueil */
    v_accueil() {
      const d = this.state.data;
      const syn = d.synth;
      const sit = syn ? syn.situation : {};
      const ech = sit.Echelon;
      const np = this.nextPromo();
      return `
        <header class="page-head">
          <div>
            <div class="muted small">${esc(cap(fmtLong(new Date())))}</div>
            <h1>${syn && syn.prenom ? "Bonjour " + esc(syn.prenom) : "Bonjour"}</h1>
            <div class="sub">${esc([sit.Corps && cap(sit.Corps.value), syn && syn.affectation && syn.affectation.replace(/^Rattachement administratif\s*/, "")].filter(Boolean).join(" · "))}</div>
          </div>
          <button class="btn ghost" data-action="refresh">${icon("refresh", 16)} Actualiser</button>
        </header>

        ${this.box("pres", (p) => (p.lignes.length ? `
          <section class="alert info" aria-label="Informations de l'académie">${icon("info", 22)}
            <div><strong>Infos de votre académie</strong>
              <ul class="plain">${p.lignes.slice(0, 4).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
              ${p.liens.length ? `<div class="links">${p.liens.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join("")}</div>` : ""}
            </div>
          </section>` : ""))}

        <div class="cards3">
          <section class="card">
            <div class="kicker">Ma situation</div>
            ${this.box("synth", () => `
              <div class="big">${ech ? "Échelon " + esc(parseInt(ech.value, 10) || ech.value) : "—"}</div>
              <div>${esc(sit.Grade ? cap(sit.Grade.value) : "")}</div>
              ${ech && ech.depuis ? `<div class="muted">depuis le ${esc(ech.depuis)}</div>` : ""}
              <div class="muted">${esc([sit["Modalité service"] && sit["Modalité service"].value, sit.Position && sit.Position.value].filter(Boolean).join(" · "))}</div>`)}
          </section>
          <section class="card">
            <div class="kicker">Prochaine promotion</div>
            ${this.box("promo", (p) => np ? `
              <div class="big">Échelon ${np.echelon}</div>
              <div>${days(np.d) >= 0 ? `le ${esc(np.date)} · <strong>dans ${plural(days(np.d), "jour")}</strong>` : `le ${esc(np.date)}`}</div>
              ${np.motif ? `<div class="muted">${esc(np.motif)}</div>` : ""}
              ${p.echelons.filter((e) => e !== np).map((e) => `<div class="muted small">Sinon échelon ${e.echelon} le ${esc(e.date)}${e.motif ? " (" + esc(e.motif) + ")" : ""}</div>`).join("")}`
              : `<div class="muted">${esc(p.raw || "Aucune information")}</div>`)}
          </section>
          <section class="card">
            <div class="kicker">Ancienneté</div>
            ${this.box("anc", (a) => {
              const g = a.items[0];
              return g ? `<div class="big">${esc(g.value.replace(/\s*\d+ jours?$/, ""))}</div><div>${esc(g.full)} · ${esc(g.value)}</div>${a.au ? `<div class="muted">calculée au ${esc(a.au)}</div>` : ""}` : `<div class="muted">—</div>`;
            })}
          </section>
        </div>

        <div class="split">
          <section class="card grow2">
            <div class="row-between"><h2>Courrier${this.state.data.courrier ? " · " + plural(Object.values(this.state.data.courrier.nonLus).reduce((a, b) => a + b, 0), "non lu") : ""}</h2>
            <button class="link-btn inline" data-action="go" data-view="courrier">Tout voir →</button></div>
            ${this.box("courrier", (c) => this.msgList(c.messages.map((m, i) => [m, i]).sort(byDateDesc).slice(0, 7)))}
          </section>
          <div class="col">
            <section class="card">
              <h2>Raccourcis</h2>
              <div class="shortcuts">
                <button class="shortcut" data-action="go" data-view="parcours">Mon parcours et mes affectations <span aria-hidden="true">→</span></button>
                <button class="shortcut" data-action="go" data-view="services">Demander une mutation (SIAM) <span aria-hidden="true">→</span></button>
                <button class="shortcut" data-action="go" data-view="services">Rendez-vous de carrière (SIAE) <span aria-hidden="true">→</span></button>
                <button class="shortcut" data-action="original" data-code="Dossier_Perso">Mes infos personnelles (I-Prof) <span aria-hidden="true">↗</span></button>
              </div>
            </section>
          </div>
        </div>`;
    }

    msgList(pairs) {
      if (!pairs.length) return `<p class="muted">Aucun message. <button class="link-btn inline" data-action="reload-courrier">Recharger</button></p>`;
      return `<ul class="msgs">${pairs.map(([m, i]) => `
        <li><button class="msg ${m.nonLu ? "unread" : ""}" data-action="msg" data-idx="${i}">
          <span class="dot" ${m.nonLu ? 'role="img" aria-label="Non lu"' : 'aria-hidden="true"'}></span>
          <span class="obj">${esc(m.objet.replace(/^\[signal[ée]+\]\s*/i, ""))}</span>
          ${m.signale ? `<span class="tag hot">Signalé</span>` : ""}
          ${m.pj ? `<span class="pj" title="Pièce jointe">${icon("clip", 15)}<span class="sr">Pièce jointe</span></span>` : ""}
          <span class="tag">${esc(IPP.THEMES[m.theme] || "")}</span>
          <span class="date">${esc(fmtMsgDate(m.d))}</span>
        </button></li>`).join("")}</ul>`;
    }

    /* Courrier */
    v_courrier() {
      const f = this.state.filtre;
      return `
        <header class="page-head"><div><h1>Courrier</h1><div class="sub">Messages reçus dans I-Prof</div></div>
          <button class="btn ghost" data-action="refresh">${icon("refresh", 16)} Actualiser</button></header>
        ${this.box("courrier", (c) => {
          const counts = {};
          c.messages.forEach((m) => (counts[m.theme] = (counts[m.theme] || 0) + 1));
          const q = f.q.trim().toLowerCase();
          let list = c.messages.map((m, i) => [m, i]);
          if (f.theme !== "tous") list = list.filter(([m]) => m.theme === f.theme);
          if (f.nonLus) list = list.filter(([m]) => m.nonLu);
          if (q) list = list.filter(([m]) => m.objet.toLowerCase().includes(q));
          list.sort(byDateDesc);
          const shown = list.slice(0, f.max);
          return `
          <section class="card">
            <div class="toolbar">
              <label class="search">${icon("search", 16)}<span class="sr">Rechercher dans les objets</span>
                <input type="search" data-filter="q" placeholder="Rechercher dans les objets…" value="${esc(f.q)}"></label>
              <div class="chips">
                <button class="chip ${f.theme === "tous" ? "on" : ""}" data-action="theme" data-theme="tous">Tous · ${c.messages.length}</button>
                ${Object.entries(IPP.THEMES).filter(([k]) => counts[k]).map(([k, l]) => `<button class="chip ${f.theme === k ? "on" : ""}" data-action="theme" data-theme="${k}">${esc(l)} · ${counts[k]}${c.nonLus[l] ? ` <b>(${c.nonLus[l]} non lus)</b>` : ""}</button>`).join("")}
                <button class="chip ${f.nonLus ? "on" : ""}" data-action="nonlus" aria-pressed="${f.nonLus}">Non lus seulement</button>
              </div>
            </div>
            <p class="muted small">${plural(list.length, "message")}. Ouvrir un message le marque comme lu dans I-Prof.</p>
            ${this.msgList(shown)}
            ${list.length > shown.length ? `<button class="btn ghost full" data-action="more">Afficher plus (${list.length - shown.length} restants)</button>` : ""}
          </section>`;
        })}`;
    }

    modal() {
      const { m, detail, error, loading } = this.state.msg;
      const linkify = (t) => esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      return `
      <div class="backdrop" data-action="close"></div>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ipp-msg-t">
        <div class="modal-head">
          <div><div class="muted small">${esc(IPP.THEMES[m.theme] || "")} · ${esc(m.date)}</div>
          <h2 id="ipp-msg-t">${esc(m.objet)}</h2>
          ${detail && detail.head.Emetteur ? `<div class="muted small">De : ${esc(detail.head.Emetteur)}${detail.head["Récepteur(s)"] ? " · À : " + esc(detail.head["Récepteur(s)"]) : ""}</div>` : ""}</div>
          <button class="icon-btn" data-action="close" aria-label="Fermer">${icon("x")}</button>
        </div>
        <div class="modal-body">
          ${loading ? `<div class="skeleton tall"></div>` : ""}
          ${error ? `<p class="muted">Impossible d'ouvrir ce message (${esc(error)}).</p>` : ""}
          ${detail ? `<div class="body-text">${linkify(detail.corps) || '<span class="muted">(message vide)</span>'}</div>
            ${detail.pjs.length ? `<h3>Pièces jointes</h3><ul class="pjs">${detail.pjs.map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener">${icon("clip", 15)} ${esc(p.nom)}</a> <span class="muted small">${esc(p.taille)}</span></li>`).join("")}</ul>` : ""}` : ""}
        </div>
      </div>`;
    }

    /* Parcours */
    v_parcours() {
      const d = this.state.data;
      const sit = d.synth ? d.synth.situation : {};
      const grade = sit.Grade ? sit.Grade.value : "";
      const cur = sit.Echelon ? parseInt(sit.Echelon.value, 10) : null;
      const max = /exceptionnelle/i.test(grade) ? 5 : /hors classe/i.test(grade) ? 7 : 11;
      const np = this.nextPromo();
      return `
        <header class="page-head"><div><h1>Mon parcours</h1><div class="sub">Carrière, anciennetés et affectations, en un seul écran</div></div>
          <button class="btn ghost" data-action="original" data-code="Dossier_AffectationDetachementJSP">${icon("ext", 16)} Version I-Prof</button></header>

        <section class="card">
          <div class="row-between"><h2>Progression d'échelon</h2><span class="muted">${esc(cap(grade))}</span></div>
          ${cur ? `<div class="steps" style="grid-template-columns:repeat(${max},minmax(0,1fr))" role="img" aria-label="Échelon actuel ${cur} sur ${max}${np ? ", échelon " + np.echelon + " prévu le " + np.date : ""}">
            ${Array.from({ length: max }, (_, k) => k + 1).map((n) => {
              const st = n < cur ? "done" : n === cur ? "cur" : np && n === np.echelon ? "next" : "todo";
              const lab = n === cur ? `${n} · actuel` : np && n === np.echelon ? `${n} · ${np.d.getFullYear()}` : n;
              return `<div class="step ${st}"><div class="bar" style="height:${24 + (n * 100) / max}px"></div><span>${lab}</span></div>`;
            }).join("")}</div>` : this.box("synth", () => `<p class="muted">Échelon non trouvé.</p>`)}
          <div class="grid3">
            ${this.box("anc", (a) => a.items.map((it) => `<div class="stat"><span class="muted small">${esc(it.label)}</span><strong>${esc(it.value)}</strong></div>`).join(""))}
          </div>
          ${this.box("promo", (p) => (p.corps ? `<p class="small"><strong>Promotion de corps :</strong> ${esc(p.corps)}</p>` : ""))}
        </section>

        <section class="card">
          <div class="row-between"><h2>Affectations</h2>
            <div class="chips">
              <button class="chip ${!this.state.histo ? "on" : ""}" data-action="histo" aria-pressed="${!this.state.histo}">Vue simple</button>
              <button class="chip ${this.state.histo ? "on" : ""}" data-action="histo" aria-pressed="${this.state.histo}">Détails complets</button>
            </div></div>
          ${this.box("affect", (a) => `
            ${a.quotite ? `<p class="muted">${esc(a.quotite)}</p>` : ""}
            <ol class="timeline">${(this.state.histo ? a.lignes : mergeAffect(a.lignes)).map((l) => `
              <li class="${l.actuelle ? "now" : ""}">
                <div class="when">${esc(l.du ? (l.au ? `${l.du.slice(-4)} → ${l.au.slice(-4)}` : `depuis ${l.du.slice(-4)}`) : l.periode)}${l.actuelle ? `<span class="tag ok">Actuelle</span>` : ""}</div>
                <div class="what">
                  <strong>${esc(l.etab || l.nature)}</strong>
                  <div class="muted small">${esc([l.nature, l.circo].filter(Boolean).join(" · "))}</div>
                  ${l.rep ? `<span class="tag">${esc(/\+/.test(l.repLabel) ? "REP+" : "REP")}</span>` : ""}
                  ${l.fonctions.length ? `<ul class="plain small">${(this.state.histo ? l.fonctions : l.fonctions.filter((f) => f.principale !== false)).map((f) => `<li>${esc(cap(f.fonction))}${f.quotite != null ? ` · ${f.quotite} %` : ""}${f.principale === false ? " · secondaire" : ""}${this.state.histo && f.periode ? ` <span class="muted">(${esc(f.periode)})</span>` : ""}</li>`).join("")}</ul>` : ""}
                  ${this.state.histo ? `<div class="muted small">${esc(l.periode)}</div>${l.sous.length ? `<ul class="plain small">${l.sous.map((x) => `<li>${esc(x.periode)} — ${esc(x.etab)} (${esc(x.nature)})</li>`).join("")}</ul>` : ""}` : l.sous.length ? `<div class="muted small">+ ${plural(l.sous.length, "mouvement")} dans la période</div>` : ""}
                </div>
              </li>`).join("")}</ol>`)}
        </section>`;
    }

    /* Dossier */
    v_dossier() {
      return `
        <header class="page-head"><div><h1>Mon dossier</h1><div class="sub">Situation administrative</div></div>
          <button class="btn ghost" data-action="original" data-code="Dossier">${icon("ext", 16)} Version I-Prof</button></header>
        <section class="card">
          <h2>Situation administrative</h2>
          ${this.box("synth", (s) => `
            ${s.nom ? `<p><strong>${esc((s.civilite || "") + " " + s.nom)}</strong></p>` : ""}
            ${s.affectation ? `<p>${esc(s.affectation)}</p>` : ""}
            <table class="tbl"><thead><tr><th scope="col">Rubrique</th><th scope="col">Valeur</th><th scope="col">Depuis</th></tr></thead><tbody>
            ${Object.entries(s.situation).map(([k, v]) => `<tr><th scope="row">${esc(k === "Echelon" ? "Échelon" : k)}</th><td>${esc(cap(v.value))}</td><td>${esc(v.depuis)}</td></tr>`).join("")}
            </tbody></table>`)}
        </section>
        <section class="card">
          <h2>Anciennetés</h2>
          ${this.box("anc", (a) => `<div class="grid3">${a.items.map((it) => `<div class="stat"><span class="muted small">${esc(it.label)}</span><strong>${esc(it.value)}</strong></div>`).join("")}</div>${a.au ? `<p class="muted small">Au ${esc(a.au)}</p>` : ""}`)}
        </section>
        <section class="card">
          <h2>Informations personnelles</h2>
          <p class="muted">Adresse, coordonnées, famille, référence bancaire : consultables et modifiables uniquement dans I-Prof.</p>
          <div class="btns">
            <button class="btn" data-action="original" data-code="Dossier_Perso">${icon("ext", 16)} Ouvrir mes infos personnelles</button>
            <button class="btn ghost" data-action="original" data-code="Nouveaux_Droits">${icon("ext", 16)} Obligation d'emploi</button>
          </div>
        </section>`;
    }

    /* CV */
    v_cv() {
      const table = (rows) => {
        if (!rows.length) return `<p class="muted">Aucun élément.</p>`;
        const heads = Object.keys(rows[0]).filter((h) => rows.some((r) => r[h]));
        return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${heads.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      };
      return `
        <header class="page-head"><div><h1>CV & formations</h1><div class="sub">Diplômes, habilitations et formations suivies</div></div>
          <button class="btn ghost" data-action="original" data-code="Cv">${icon("ext", 16)} Modifier dans I-Prof</button></header>
        <section class="card"><h2>Diplômes</h2>${this.box("dip", (d) => table(d.diplomes))}</section>
        <section class="card"><h2>Titres et habilitations</h2>${this.box("dip", (d) => table(d.titres))}</section>
        <section class="card"><h2>Formations suivies</h2>${this.box("form", (g) => g.length ? g.map((grp) => `
          <h3>${esc(grp.titre)} <span class="muted small">· ${grp.items.length}</span></h3>
          <ul class="formations">${grp.items.map((it) => `<li><span>${esc(cap(it.titre.toLowerCase()))}</span><span class="tag">${esc(it.org)}</span></li>`).join("")}</ul>`).join("") : `<p class="muted">Aucune formation.</p>`)}</section>`;
    }

    /* Services */
    v_services() {
      return `
        <header class="page-head"><div><h1>Services</h1><div class="sub">Applications de gestion accessibles depuis I-Prof</div></div></header>
        ${this.box("services", (list) => `<div class="services">${list.map((s, i) => `
          <section class="card svc">
            <h2>${esc(s.nom)}</h2>
            <p class="muted small">${esc(s.description.length > 260 ? s.description.slice(0, 257) + "…" : s.description)}</p>
            ${s.kind === "form"
              ? `<button class="btn" data-action="service" data-idx="${i}">${icon("ext", 16)} Ouvrir</button>`
              : `<a class="btn" href="${esc(s.href)}" target="_blank" rel="noopener noreferrer">${icon("ext", 16)} Ouvrir</a>`}
          </section>`).join("")}</div>`)}`;
    }
  }

  IPP.App = App;
})();
