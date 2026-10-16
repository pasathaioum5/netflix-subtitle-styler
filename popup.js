const $ = (id) => document.getElementById(id);

const FIELDS = [
  "enabled", "fontSize", "bold", "italic", "textColor", "textOpacity",
  "edgeStyle", "edgeColor", "edgeWidth", "bgColor", "bgOpacity",
  "reposition", "bottomOffset"
];

let settings = { ...NSS_DEFAULTS };
let fonts = [];        // [{ fontId, displayName }]
let saveTimer = null;

// ---------- persistence ----------

function save() {
  // Debounced so dragging a slider doesn't hammer storage.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ [NSS_STORAGE_KEY]: settings }, () => {
      if (chrome.runtime.lastError) console.error("Save failed:", chrome.runtime.lastError);
    });
  }, 80);
}

function load() {
  return new Promise((resolve) => {
    chrome.storage.local.get(NSS_STORAGE_KEY, (res) => {
      settings = { ...NSS_DEFAULTS, ...(res && res[NSS_STORAGE_KEY]) };
      resolve();
    });
  });
}

// ---------- installed fonts ----------

function loadFonts() {
  return new Promise((resolve) => {
    // chrome.fontSettings reads the fonts installed on this PC — no prompt needed.
    chrome.fontSettings.getFontList((list) => {
      if (chrome.runtime.lastError || !Array.isArray(list)) {
        console.error("getFontList failed:", chrome.runtime.lastError);
        fonts = [];
      } else {
        fonts = list.slice().sort((a, b) => a.displayName.localeCompare(b.displayName));
      }
      resolve();
    });
  });
}

function renderFontList() {
  const sel = $("fontFamily");
  const q = $("fontSearch").value.trim().toLowerCase();
  sel.textContent = "";

  const addOption = (value, label, family) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (family) opt.style.fontFamily = nssCssFontFamily(family);
    sel.appendChild(opt);
    return opt;
  };

  if (!q) addOption("", "(Netflix default)");

  const matches = fonts.filter((f) => !q || f.displayName.toLowerCase().includes(q));
  for (const f of matches) addOption(f.fontId, f.displayName, f.fontId);

  // Keep the saved font visible even if it was uninstalled or filtered out.
  if (settings.fontFamily && !fonts.some((f) => f.fontId === settings.fontFamily)) {
    addOption(settings.fontFamily, `${settings.fontFamily} (not found)`, settings.fontFamily);
  }

  sel.value = settings.fontFamily;
  $("fontCount").textContent = `${matches.length} of ${fonts.length} installed fonts`;
}

// ---------- UI ----------

function updateOutputs() {
  $("fontSizeOut").textContent = settings.fontSize > 0 ? `${settings.fontSize}` : "Default";
  $("textOpacityOut").textContent = `${settings.textOpacity}%`;
  $("edgeWidthOut").textContent = `${settings.edgeWidth}px`;
  $("bgOpacityOut").textContent = settings.bgOpacity > 0 ? `${settings.bgOpacity}%` : "Off";
  $("bottomOffsetOut").textContent = `${settings.bottomOffset}%`;
  $("bottomOffset").disabled = !settings.reposition;
}

function updatePreview() {
  const p = $("preview");
  p.removeAttribute("style");
  for (const [k, v] of Object.entries(nssTextDeclarations(settings))) p.style.setProperty(k, v);
  // Approximate the size on a ~540px tall player.
  const px = settings.fontSize > 0 ? settings.fontSize * 5.4 : 22;
  p.style.fontSize = `${Math.min(px, 48)}px`;
  if (!settings.fontFamily) p.style.fontFamily = "Netflix Sans, Helvetica Neue, Arial, sans-serif";
  p.style.opacity = settings.enabled ? "1" : "0.35";
}

function fillForm() {
  for (const key of FIELDS) {
    const el = $(key);
    if (el.type === "checkbox") el.checked = !!settings[key];
    else el.value = settings[key];
  }
  renderFontList();
  updateOutputs();
  updatePreview();
}

function onFieldInput(e) {
  const el = e.target;
  const key = el.id;
  if (el.type === "checkbox") settings[key] = el.checked;
  else if (el.type === "range") settings[key] = Number(el.value);
  else settings[key] = el.value;
  updateOutputs();
  updatePreview();
  save();
}

async function init() {
  await Promise.all([load(), loadFonts()]);
  fillForm();

  for (const key of FIELDS) {
    $(key).addEventListener("input", onFieldInput);
    $(key).addEventListener("change", onFieldInput);
  }

  $("fontFamily").addEventListener("change", (e) => {
    settings.fontFamily = e.target.value;
    updatePreview();
    save();
  });

  $("fontSearch").addEventListener("input", renderFontList);

  $("refreshFonts").addEventListener("click", async () => {
    await loadFonts();
    renderFontList();
  });

  $("reset").addEventListener("click", () => {
    settings = { ...NSS_DEFAULTS };
    $("fontSearch").value = "";
    fillForm();
    save();
  });
}

init();
