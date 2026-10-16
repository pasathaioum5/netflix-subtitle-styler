// Shared between the content script and the popup.

const NSS_DEFAULTS = Object.freeze({
  enabled: true,
  fontFamily: "",          // "" = keep Netflix's font
  fontSize: 0,             // % of player height (vh); 0 = keep Netflix's size
  bold: false,
  italic: false,
  textColor: "#ffffff",
  textOpacity: 100,        // 0-100
  edgeStyle: "outline",    // none | outline | shadow | raised | depressed
  edgeColor: "#000000",
  edgeWidth: 2,            // px
  bgColor: "#000000",
  bgOpacity: 0,            // 0-100, 0 = no background box
  reposition: false,       // force subtitles to bottom-center
  bottomOffset: 10         // % from bottom when reposition is on
});

const NSS_STORAGE_KEY = "nssSettings";

function nssHexToRgba(hex, opacityPct) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  const n = m ? parseInt(m[1], 16) : 0xffffff;
  const a = Math.max(0, Math.min(100, Number(opacityPct))) / 100;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Quote a font family name for safe use in CSS.
function nssCssFontFamily(name) {
  if (!name) return "";
  const escaped = String(name).replace(/[\\"]/g, "\\$&").replace(/[\r\n]/g, "");
  return `"${escaped}", sans-serif`;
}

function nssTextShadow(s) {
  const w = Math.max(0, Number(s.edgeWidth) || 0);
  const c = s.edgeColor;
  if (w === 0 || s.edgeStyle === "none") return "none";

  switch (s.edgeStyle) {
    case "outline": {
      // Ring of hard shadows; looks cleaner than -webkit-text-stroke,
      // which eats into the glyph fill.
      const steps = 16;
      const parts = [];
      for (let i = 0; i < steps; i++) {
        const a = (2 * Math.PI * i) / steps;
        parts.push(`${(Math.cos(a) * w).toFixed(2)}px ${(Math.sin(a) * w).toFixed(2)}px 0 ${c}`);
      }
      return parts.join(", ");
    }
    case "shadow":
      return `${w}px ${w}px ${(w * 1.5).toFixed(1)}px ${c}`;
    case "raised":
    case "depressed": {
      const dir = s.edgeStyle === "raised" ? 1 : -1;
      const parts = [];
      for (let i = 1; i <= w; i++) parts.push(`${dir * i}px ${dir * i}px 0 ${c}`);
      return parts.join(", ");
    }
    default:
      return "none";
  }
}

// Inline-style-ish declarations for a subtitle text span (no !important).
function nssTextDeclarations(s) {
  const d = {
    color: nssHexToRgba(s.textColor, s.textOpacity),
    "text-shadow": nssTextShadow(s),
    "font-weight": s.bold ? "bold" : "normal",
    "font-style": s.italic ? "italic" : "normal"
  };
  if (s.fontFamily) d["font-family"] = nssCssFontFamily(s.fontFamily);
  if (Number(s.bgOpacity) > 0) {
    d["background-color"] = nssHexToRgba(s.bgColor, s.bgOpacity);
    d["padding"] = "0 0.25em";
    d["-webkit-box-decoration-break"] = "clone";
    d["box-decoration-break"] = "clone";
  } else {
    d["background-color"] = "transparent";
  }
  return d;
}
