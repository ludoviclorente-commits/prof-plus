/*
 * Prof+ — point d'entrée. Monte l'interface par-dessus la page I-Prof,
 * dans un Shadow DOM pour isoler les styles. L'interface d'origine reste intacte dessous.
 */
(function () {
  "use strict";
  const IPP = globalThis.IPP;
  if (!IPP || window.top !== window.self) return;
  if (!/IProf/i.test(document.title) && !/Code page/.test(document.body ? document.body.textContent : "")) return;
  if (/codeTraitement=Quitter/.test(location.search)) return;
  // On ne se superpose qu'aux écrans « normaux » d'I-Prof (avec le menu principal), pas à SIAM, aux impressions, etc.
  if (!document.querySelector('a[href*="codeTraitement=Dossier"], a[href*="codeTraitement=CourrierE"], a[href*="codeTraitement=Perspectives"]')) return;

  const OFF_KEY = "ipp-off"; // sessionStorage : l'utilisateur a choisi l'interface d'origine pour cet onglet
  const cssUrl = (globalThis.chrome && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL("src/styles.css") : null;

  let host = null;
  let fab = null;

  function mount() {
    if (host) return;
    sessionStorage.removeItem(OFF_KEY);
    if (fab) { fab.remove(); fab = null; }
    host = document.createElement("div");
    host.id = "iprof-plus-root";
    host.style.cssText = "position:fixed;inset:0;z-index:2147483646;";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `${cssUrl ? `<link rel="stylesheet" href="${cssUrl}">` : `<style>${IPP.INLINE_CSS || ""}</style>`}<div class="ipp-app"></div>`;
    document.documentElement.appendChild(host);
    document.documentElement.style.overflow = "hidden";
    const app = new IPP.App(shadow, {
      onOriginal: (code) => {
        sessionStorage.setItem(OFF_KEY, "1");
        const target = IPP.url({ codeTraitement: code });
        if (location.href === target) unmount(); else location.href = target;
      },
      onQuit: () => { location.href = IPP.url({ codeTraitement: "Quitter" }); },
    });
    app.render();
    app.loadCore();
    IPP.app = app;
  }

  function unmount() {
    if (host) { host.remove(); host = null; }
    document.documentElement.style.overflow = "";
    showFab();
  }

  function showFab() {
    if (fab) return;
    fab = document.createElement("button");
    fab.type = "button";
    fab.textContent = "Ouvrir Prof+";
    fab.setAttribute("aria-label", "Ouvrir l'interface Prof+");
    fab.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:12px 18px;border:0;border-radius:999px;background:#2B5BD7;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer;min-height:44px";
    fab.addEventListener("click", mount);
    document.body.appendChild(fab);
  }

  if (sessionStorage.getItem(OFF_KEY)) showFab(); else mount();
})();
