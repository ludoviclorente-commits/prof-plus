/*
 * Prof+ — couche données : récupération des pages I-Prof et parseurs.
 *
 * Règles :
 *  - uniquement des requêtes GET de consultation, sur le même domaine que la page I-Prof ;
 *  - aucune donnée n'est envoyée ailleurs ni stockée de façon persistante ;
 *  - le détail d'un message n'est chargé que sur clic (cela le marque comme lu côté I-Prof).
 */
(function () {
  "use strict";
  const IPP = (globalThis.IPP = globalThis.IPP || {});

  /* ---------- utilitaires ---------- */

  // Certaines pages I-Prof contiennent de l'UTF-8 mal décodé (« carriÃ¨re ») : on répare les cas courants.
  const MOJIBAKE = { "\u00c3\u00a9": "é", "\u00c3\u00a8": "è", "\u00c3\u00aa": "ê", "\u00c3\u00ab": "ë", "\u00c3\u00a0": "à", "\u00c3\u00a2": "â", "\u00c3\u00a7": "ç", "\u00c3\u00b4": "ô", "\u00c3\u00ae": "î", "\u00c3\u00af": "ï", "\u00c3\u00b9": "ù", "\u00c3\u00bb": "û", "\u00c3\u2030": "É", "\u00e2\u20ac\u2122": "\u2019" };
  const fixText = (s) => s.replace(/\u00c3[\u00a0-\u00bf\u2030]|\u00e2\u20ac\u2122/g, (m) => MOJIBAKE[m] || m);
  const txt = (s) => fixText(s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  IPP.txt = txt;

  IPP.base = () => location.origin + location.pathname; // …/iprof/servletiprofe

  IPP.url = (params) => {
    const u = new URL(IPP.base());
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u.toString();
  };

  class SessionError extends Error {}
  IPP.SessionError = SessionError;

  // I-Prof est une vieille application « à état » : plusieurs requêtes simultanées dans la même
  // session peuvent se mélanger (ex. le courrier revient vide juste après la connexion).
  // On envoie donc les requêtes une par une.
  let queue = Promise.resolve();
  IPP.fetchDoc = (params) => {
    const run = queue.then(() => fetchDocNow(params));
    queue = run.catch(() => {});
    return run;
  };

  const fetchDocNow = async (params) => {
    const r = await fetch(IPP.url(params), { credentials: "include", cache: "no-store" });
    if (r.redirected && !/\/iprof\//.test(r.url)) throw new SessionError("Session expirée");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const buf = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "";
    const cs = (ct.match(/charset=([^;]+)/i) || [])[1] || "iso-8859-1";
    let html;
    try { html = new TextDecoder(cs.trim()).decode(buf); } catch (e) { html = new TextDecoder("iso-8859-1").decode(buf); }
    if (!/Code page|IProf/i.test(html)) throw new SessionError("Page inattendue (session expirée ?)");
    const doc = new DOMParser().parseFromString(html, "text/html");
    Object.defineProperty(doc, "ippHtml", { value: html }); // HTML brut (I-Prof imbrique des <form> dans des <tr>)
    return doc;
  };

  IPP.page = (code, extra = {}) => IPP.fetchDoc({ codeTraitement: code, ...extra });

  /** Lignes « feuilles » (tr sans tr imbriqué) → tableaux de cellules texte. */
  IPP.rows = (doc, keepEmpty = false) =>
    [...doc.querySelectorAll("tr")]
      .filter((tr) => !tr.querySelector("tr"))
      .map((tr) => [...tr.children].map((c) => txt(c.textContent)))
      .map((cells) => (keepEmpty ? cells : cells.filter(Boolean)))
      .filter((cells) => cells.some(Boolean));

  const DATE = /(\d{2})\/(\d{2})\/(\d{4})/;
  /**
   * Date + heure d'un message I-Prof. Gère « JJ/MM/AAAA HH:MM », « JJ/MM/AA », « JJ/MM » (année en cours),
   * « HH:MM » seul (aujourd'hui), « Aujourd'hui » et « Hier ».
   */
  IPP.parseDateTime = (s) => {
    s = (s || "").trim();
    const time = s.match(/(\d{1,2})[:h](\d{2})/);
    const h = time ? +time[1] : 0, mi = time ? +time[2] : 0;
    let m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) { let y = +m[3]; if (y < 100) y += 2000; return new Date(y, +m[2] - 1, +m[1], h, mi); }
    const now = new Date();
    m = s.match(/(\d{1,2})\/(\d{1,2})(?!\/)/);
    if (m) { const d = new Date(now.getFullYear(), +m[2] - 1, +m[1], h, mi); if (d - now > 864e5) d.setFullYear(d.getFullYear() - 1); return d; }
    if (/hier/i.test(s)) { const d = new Date(now); d.setDate(d.getDate() - 1); d.setHours(h, mi, 0, 0); return d; }
    if (time || /aujourd/i.test(s)) { const d = new Date(now); d.setHours(h, mi, 0, 0); return d; }
    return null;
  };

  IPP.parseDate = (s) => {
    const m = (s || "").match(DATE);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  };

  const titleCase = (s) =>
    (s || "").toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  IPP.titleCase = titleCase;

  /* ---------- Dossier (synthèse) ---------- */

  const SITUATION = ["Statut", "Corps", "Grade", "Echelon", "Échelon", "Position", "Modalité service"];

  IPP.parseSynthese = (doc) => {
    const rows = IPP.rows(doc);
    const out = { situation: {}, affectation: null, civilite: null, nom: null, prenom: null };
    rows.forEach((cells, i) => {
      const first = cells[0];
      const id = first.match(/^(Mme|M\.|Mlle|M)\s+(.+?),\s*N[ée]/);
      if (id && !out.nom) {
        out.civilite = id[1];
        out.nom = titleCase(id[2]);
        out.prenom = titleCase(id[2].split(/\s+/)[0]);
      }
      if (SITUATION.includes(first) && cells.length >= 2) {
        const key = first === "Échelon" ? "Echelon" : first;
        out.situation[key] = { value: cells[1], depuis: cells[2] || "" };
      }
      if (/^Vos affectations/.test(first) && rows[i + 1]) out.affectation = rows[i + 1].join(" ");
    });
    return out;
  };

  /* ---------- Anciennetés ---------- */

  IPP.parseAnciennete = (doc) => {
    const out = { au: null, items: [] };
    for (const cells of IPP.rows(doc)) {
      if (/^Anciennetés$/.test(cells[0]) && cells[1]) out.au = cells[1].replace(/^au\s+/, "");
      else if (/^Ancienneté/.test(cells[0]) && cells[1]) {
        const lab = cells[0]
          .replace(/^Ancienneté générale de services/, "Générale de services")
          .replace(/^Ancienneté dans le corps/, "Dans le corps")
          .replace(/^Ancienneté dans le grade/, "Dans le grade");
        out.items.push({ label: lab, full: cells[0], value: cells[1] });
      }
    }
    return out;
  };

  /* ---------- Perspectives / promotions ---------- */

  IPP.parsePromotions = (doc) => {
    const out = { echelons: [], corps: null, raw: null };
    for (const cells of IPP.rows(doc)) {
      if (/^Promotion d'échelon/.test(cells[0])) {
        out.raw = cells.slice(1).join(" ");
        const re = /(\d+)\s*(?:er|e|ème|eme)\s*échelon\s+le\s+(\d{2}\/\d{2}\/\d{4})\s*(?:\(([^)]*)\))?/gi;
        let m;
        while ((m = re.exec(out.raw))) {
          out.echelons.push({ echelon: +m[1], date: m[2], motif: m[3] || "", d: IPP.parseDate(m[2]) });
        }
        out.echelons.sort((a, b) => a.d - b.d);
      } else if (/^Promotion de corps/.test(cells[0])) {
        out.corps = cells.slice(1).join(" ");
      }
    }
    return out;
  };

  /* ---------- Accueil I-Prof : informations académiques ---------- */

  IPP.parsePresentation = (doc) => {
    const box = [...doc.querySelectorAll('table[width="90%"]')].find((t) => /\S/.test(t.textContent));
    if (!box) return { lignes: [], liens: [] };
    const html = box.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(div|p|tr)>/gi, "\n");
    const tmp = doc.createElement("div");
    tmp.innerHTML = html;
    const lignes = tmp.textContent
      .split("\n")
      .map(txt)
      .filter((l) => l && l.length > 3);
    const liens = [...box.querySelectorAll("a[href^='http']")].map((a) => ({
      label: txt(a.textContent),
      href: a.getAttribute("href"),
    }));
    return { lignes: [...new Set(lignes)], liens };
  };

  /* ---------- Courrier ---------- */

  IPP.THEMES = { 1: "Carrière", 2: "Affectation", 3: "Autres thèmes", 4: "Gestion collective" };

  const param = (onclick, k) => (onclick.match(new RegExp(k + "\\.value='([^']*)'")) || [])[1];

  IPP.parseCourrier = (doc) => {
    const nonLus = {};
    doc.querySelectorAll("td.infoMessages").forEach((td) => {
      const t = txt(td.textContent);
      const re = /([A-Za-zÀ-ÿ' ]+?)\s*:\s*(\d+)\s*messages?\s+non\s+lus/g;
      let m;
      while ((m = re.exec(t))) nonLus[txt(m[1]).replace(/^Informations boite aux lettres\s*/i, "")] = +m[2];
    });
    const messages = [...doc.querySelectorAll('a[onclick*="messageID"]')].map((a) => {
      const on = a.getAttribute("onclick");
      const tr = a.closest("tr");
      const objet = txt(a.textContent);
      // La date est dans une cellule à part ; sa classe varie (texte, texteBold pour les non-lus…) : on la cherche par son contenu.
      const dateCell = tr ? [...tr.querySelectorAll("td")].reverse().find((td) => !td.contains(a) && /\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}|hier|aujourd/i.test(td.textContent)) : null;
      const date = txt(dateCell ? dateCell.textContent : "");
      return {
        id: param(on, "messageID"),
        dossier: param(on, "dossier"),
        theme: param(on, "codeTheme"),
        objet,
        date,
        d: IPP.parseDateTime(date),
        nonLu: !!a.querySelector(".texteBoldSouligne"),
        pj: !!(tr && tr.querySelector('img[alt*="pi"]')),
        signale: /^\[signal/i.test(objet),
      };
    });
    return { nonLus, messages };
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  IPP.loadCourrier = async (theme = "tous") => {
    // Juste après la connexion, I-Prof renvoie parfois une boîte vide : on réessaie avant de conclure.
    let res;
    for (let essai = 0; essai < 3; essai++) {
      const doc = await IPP.page("CourrierE", { typeDossier: "recu", codeThemeEnCours: theme });
      res = IPP.parseCourrier(doc);
      const nonLus = Object.values(res.nonLus).reduce((a, b) => a + b, 0);
      const vraimentVide = /Aucun message/i.test(doc.body ? doc.body.textContent : "") && !nonLus;
      if (res.messages.length || vraimentVide) return res;
      await sleep(800 * (essai + 1));
    }
    return res;
  };

  /** ATTENTION : marque le message comme lu dans I-Prof. Appeler uniquement sur clic. */
  IPP.loadMessage = async (msg) => {
    const p = {
      codeTraitement: "CourrierE_DetailMessage",
      messageID: msg.id,
      dossier: msg.dossier,
      codeTheme: msg.theme,
      typeDossier: "recu",
    };
    const doc = await IPP.fetchDoc(p);
    const head = {};
    doc.querySelectorAll("td.infoMessages").forEach((td) => {
      const m = txt(td.textContent).match(/^(Date|Objet|Theme|Thème|Emetteur|Émetteur|Récepteur\(s\))\s*:\s*(.*)$/);
      if (m) head[m[1].replace("Thème", "Theme").replace("Émetteur", "Emetteur")] = m[2];
    });
    let corps = "";
    const pre = doc.querySelector("pre");
    if (pre) corps = pre.textContent;
    else {
      const td = [...doc.querySelectorAll("td")].find(
        (t) => !t.className && !t.querySelector("td") && txt(t.textContent).length > 40 && !/Code page/.test(t.textContent)
      );
      corps = td ? td.innerText || td.textContent : "";
    }
    corps = corps.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const pjs = [...doc.querySelectorAll("a[onclick*='LecturePieceJointe']")]
      .filter((a) => txt(a.textContent))
      .map((a) => {
        const part = (a.getAttribute("onclick").match(/partID\.value='([^']*)'/) || [])[1];
        const row = a.closest("tr");
        const size = row ? txt([...row.querySelectorAll("td")].pop().textContent) : "";
        return {
          nom: txt(a.textContent),
          taille: size,
          url: IPP.url({
            codeTraitement: "CourrierE_LecturePieceJointe",
            messageID: msg.id,
            dossier: msg.dossier,
            dossierEnCours: msg.dossier,
            codeTheme: msg.theme,
            codeThemeEnCours: msg.theme,
            typeDossier: "recu",
            partID: part,
          }),
        };
      });
    return { head, corps, pjs };
  };

  /* ---------- Affectations ---------- */

  IPP.parseAffectations = (doc) => {
    const quot = doc.querySelector(".serviceHebdoTitre");
    const lignes = [...doc.querySelectorAll('div[id^="ligne-"]')].map((div, idx) => {
      const td = div.querySelector("table td:nth-child(2)") || div;
      const periode = txt((td.querySelector("b") || {}).textContent);
      const [du, au] = (periode.match(/\d{2}\/\d{2}\/\d{4}/g) || []);
      // établissement principal : hors tableau détaillé
      const etabs = [...td.querySelectorAll(".sstitreAff1")].filter((s) => !s.closest(".affectation-Pro"));
      const etab = txt((etabs[0] || {}).textContent);

      // détails textuels : on retire les sous-tableaux pour lire les lignes restantes
      const clone = td.cloneNode(true);
      clone.querySelectorAll('div[id^="pro-"], div[id^="occ-"], b, .sstitreAff1, a').forEach((e) => e.remove());
      const tmp = doc.createElement("div");
      tmp.innerHTML = clone.innerHTML.replace(/<br\s*\/?>/gi, "\n");
      const details = tmp.textContent.split("\n").map(txt).filter(Boolean);
      const rep = details.find((l) => /prioritaire/i.test(l)) || "";
      const circo = details.find((l) => /^Circonscription/i.test(l)) || "";
      const nature = details.filter((l) => l !== rep && l !== circo).pop() || "";

      // fonctions occupées (quotité, principale/secondaire)
      const fonctions = [];
      [...div.querySelectorAll('div[id^="occ-"] tr')]
        .filter((tr) => !tr.querySelector("tr"))
        .forEach((tr) => {
          const cells = [...tr.children].map((c) => txt(c.textContent)).filter(Boolean);
          const all = cells.join(" | ");
          const q = all.match(/(\d+)\s*%/);
          const ps = all.match(/\[(P|S)\]/);
          if (!q && !ps) return;
          const fct = cells.find((c) => / - /.test(c) && !/^Du /.test(c)) || cells[1] || "";
          fonctions.push({
            periode: (cells.find((c) => /^Du /.test(c)) || "").replace(/\s*\|.*/, ""),
            fonction: fct.replace(/\s*\d+\s*%.*$/, "").replace(/\s*\[(P|S)\].*$/, ""),
            quotite: q ? +q[1] : null,
            principale: ps ? ps[1] === "P" : null,
          });
        });
      // sous-affectations (suppléances…) du bloc "pro-"
      const sous = [...div.querySelectorAll("table.affectation-Pro tr")].map((tr) => {
        const c = [...tr.children].map((x) => txt(x.textContent));
        return { periode: c[0] || "", etab: (c[2] || "").replace(/\s*Circonscription.*$/, ""), nature: c[3] || "" };
      });
      return {
        actuelle: idx === 0,
        du, au, periode, etab, rep: !!rep, repLabel: rep, circo, nature,
        fonctions, sous,
        dDu: IPP.parseDate(du), dAu: IPP.parseDate(au),
      };
    });
    return { quotite: quot ? txt(quot.textContent) : "", lignes };
  };

  /* ---------- CV ---------- */

  IPP.parseDiplomes = (doc) => {
    const out = { diplomes: [], titres: [] };
    let mode = null, heads = [];
    for (const cells of IPP.rows(doc, true)) {
      const t = cells.filter(Boolean);
      const j = t.join(" | ");
      if (/^Type \| Spécialité/.test(j)) { mode = "dip"; heads = t; continue; }
      if (/^Libellé \| Date de D/i.test(j)) { mode = "tit"; heads = t; continue; }
      if (/^(Pour supprimer|Titres et Habilitations|Diplômes|Code page)/.test(t[0] || "")) continue;
      if (!mode || t.length < 2) continue;
      // aligne les cellules sur les en-têtes en partant de la première cellule non vide
      const start = cells.findIndex(Boolean);
      const vals = cells.slice(start);
      const o = {};
      heads.forEach((h, k) => (o[h] = vals[k] || ""));
      (mode === "dip" ? out.diplomes : out.titres).push(o);
    }
    return out;
  };

  IPP.parseFormations = (doc) => {
    const lines = IPP.rows(doc).map((c) => c.join(" "));
    const items = [];
    for (const l of lines) {
      if (/^Code page|^Les formations de couleur/.test(l)) continue;
      const org = l.match(/^\((.+)\)$/);
      if (org && items.length) items[items.length - 1].org = org[1];
      else items.push({ titre: l, org: null });
    }
    // une ligne sans organisme suivie d'éléments = intertitre
    const groupes = [];
    let cur = null;
    for (const it of items) {
      if (!it.org) { cur = { titre: it.titre, items: [] }; groupes.push(cur); }
      else { if (!cur) { cur = { titre: "Formations", items: [] }; groupes.push(cur); } cur.items.push(it); }
    }
    return groupes.filter((g) => g.items.length);
  };

  /* ---------- Services ---------- */

  const SERVICE_NAMES = /\b(SIAM|SIAE|SIAP|SIAD|GAIA|COLIBRIS|Devenir[_ ]enseignant)\b/i;

  /** Les formulaires I-Prof sont mal imbriqués : on lit leurs champs dans le HTML brut. */
  const rawForms = (html) => {
    const out = {};
    const re = /<form\b([^>]*)>([\s\S]*?)(?=<\/form>|<form\b)/gi;
    let m;
    while ((m = re.exec(html || ""))) {
      const attr = (n) => ((m[1].match(new RegExp(n + '\\s*=\\s*"([^"]*)"', "i")) || [])[1] || "");
      const name = attr("name");
      if (!name) continue;
      const inputs = [];
      const ri = /<input\b[^>]*>/gi;
      let i;
      while ((i = ri.exec(m[2]))) {
        const a = (n) => ((i[0].match(new RegExp(n + '\\s*=\\s*"([^"]*)"', "i")) || [])[1]);
        if (a("name")) inputs.push([a("name"), a("value") || ""]);
      }
      out[name] = { action: attr("action"), method: attr("method") || "post", inputs };
    }
    return out;
  };

  IPP.parseServices = (doc) => {
    const forms = rawForms(doc.ippHtml);
    const out = [];
    const seen = new Set();
    const nameOf = (label, ctx) => {
      const m = (label + " " + ctx).match(SERVICE_NAMES);
      return m ? m[1].replace("_", " ") : label.slice(0, 50);
    };
    doc.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const m = href.match(/document\.(\w+)\.submit\(\)/);
      const row = a.closest("tr");
      const ctx = txt(row ? row.textContent : a.textContent);
      const label = txt(a.textContent);
      if (m && /^lien/.test(m[1])) {
        const f = forms[m[1]];
        if (!f || seen.has(m[1])) return;
        seen.add(m[1]);
        out.push({ kind: "form", nom: nameOf(label, ctx), description: ctx, action: f.action, method: f.method, inputs: f.inputs });
      } else if (/^https?:/.test(href) && !seen.has(href) && !/education\.gouv\.fr\/cid57972/.test(href)) {
        seen.add(href);
        out.push({ kind: "link", nom: /guide|notice/i.test(label) ? "Guide des rendez-vous de carrière" : nameOf(label, ctx), description: ctx, href });
      }
    });
    return out;
  };
})();
