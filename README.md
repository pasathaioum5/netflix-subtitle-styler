# Netflix Subtitle Styler

A lightweight Chrome extension (Manifest V3) for customizing Netflix subtitles: font family, size, style, color, outline and background. You can use **any font installed on your PC**.

> Not affiliated with or endorsed by Netflix. "Netflix" is a trademark of Netflix, Inc.

## Features

- **Installed fonts:** pick from every font on your system, with a searchable list that previews each font in its own typeface. Use ↻ to refresh the list.
- **Size:** set relative to the window height, so it scales between windowed and fullscreen playback.
- **Style:** bold and italic.
- **Text color:** any color, with adjustable opacity.
- **Edge effects:** none, outline, drop shadow, raised or depressed, with custom color and width.
- **Background box:** optional, with color and opacity.
- **Bottom-center positioning:** optional, with an adjustable distance from the bottom.
- **Live preview:** the popup shows a preview, and changes apply instantly to the playing video.
- **Reset to defaults:** one click.

## Installation

The extension isn't on the Chrome Web Store, so load it unpacked:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/pasathaioum5/netflix-subtitle-styler.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. Optionally, pin the extension from the puzzle-piece menu in the toolbar.

It should also work in other Chromium browsers, such as Microsoft Edge and Brave, but they haven't been tested.

## Usage

1. Start playing any title on [netflix.com](https://www.netflix.com) with subtitles turned on.
2. Click the **Subtitle Styler** icon in the toolbar.
3. Adjust the settings. Subtitles update immediately.

| Setting | Notes |
|---|---|
| Font | `(Netflix default)` keeps Netflix's own font |
| Size | `0` / **Default** keeps Netflix's size; otherwise % of window height |
| Edge width | `0` disables the edge effect |
| Background | Opacity `0` = no background box |
| Bottom-center | Overrides Netflix's placement; use it if large text runs off screen |

Settings are saved locally in your browser and persist across sessions.

## Project structure

```
├── manifest.json   # Extension manifest (MV3)
├── shared.js       # Defaults and CSS helpers shared by popup and content script
├── content.js      # Runs on netflix.com; injects the subtitle stylesheet
├── popup.html      # Settings UI
├── popup.css       # Popup styles
└── popup.js        # Popup logic, font list, settings persistence
```

## How it works

- **Font list:** `chrome.fontSettings.getFontList()` returns the fonts installed on the system. No permission prompt is needed.
- **Storage:** settings are saved to `chrome.storage.local`.
- **Styling:** the content script injects a `<style>` element that overrides Netflix's inline subtitle styles (`.player-timedtext-text-container span`) using `!important`. A stylesheet holds up better than editing nodes, because Netflix re-renders subtitle elements constantly.
- **Live updates:** `chrome.storage.onChanged` pushes changes to the open Netflix tab instantly.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save your subtitle settings |
| `fontSettings` | Read the list of installed fonts |
| `https://www.netflix.com/*` (content script) | Apply styles on Netflix only |

The extension makes no network requests and collects no data.

## Known limitations

- **Newly installed fonts:** after installing a font, click ↻ in the popup. Chrome may need a full restart before it can render the new font.
- **Image-based subtitles:** some languages and titles (e.g. certain Japanese and Chinese tracks) use image subtitles, which can't be restyled.
- **Netflix updates:** the extension depends on Netflix's `player-timedtext` class names. If Netflix changes its player markup, update the `CONTAINER` selector in `content.js`.
- **Bottom-center mode:** this ignores Netflix's own positioning, including when Netflix moves subtitles to the top to avoid on-screen text.

## Contributing

Issues and pull requests are welcome. Please include your Chrome version and, if possible, the Netflix title and subtitle language when you report a styling problem.

## License

[MIT](LICENSE): free to use, modify and distribute.
