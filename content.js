// Injects a <style> element that overrides Netflix's inline subtitle styles.
// Netflix re-renders subtitle nodes constantly, so a stylesheet with
// !important is more reliable than mutating the nodes themselves.

(() => {
  const STYLE_ID = "nss-subtitle-style";
  const CONTAINER = ".player-timedtext .player-timedtext-text-container";

  function getStyleEl() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  }

  function buildCss(s) {
    if (!s.enabled) return "";

    const decl = nssTextDeclarations(s);
    if (Number(s.fontSize) > 0) {
      decl["font-size"] = `${Number(s.fontSize)}vh`;
      decl["line-height"] = "normal";
    }
    const body = Object.entries(decl)
      .map(([k, v]) => `  ${k}: ${v} !important;`)
      .join("\n");

    let css = `${CONTAINER} span {\n${body}\n}\n`;

    if (s.reposition) {
      css += `${CONTAINER} {
  left: 50% !important;
  right: auto !important;
  top: auto !important;
  bottom: ${Number(s.bottomOffset)}% !important;
  transform: translateX(-50%) !important;
  width: max-content !important;
  max-width: 90% !important;
  text-align: center !important;
}\n`;
    }
    return css;
  }

  function apply(settings) {
    getStyleEl().textContent = buildCss({ ...NSS_DEFAULTS, ...settings });
  }

  chrome.storage.local.get(NSS_STORAGE_KEY, (res) => {
    if (chrome.runtime.lastError) {
      console.warn("[Subtitle Styler] Failed to load settings:", chrome.runtime.lastError);
      return;
    }
    apply(res[NSS_STORAGE_KEY] || {});
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[NSS_STORAGE_KEY]) {
      apply(changes[NSS_STORAGE_KEY].newValue || {});
    }
  });
})();
