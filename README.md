# excalidraw-to-image

A CLI toolkit that lets **Claude Code** both **read and create** Excalidraw wireframes.

- `excalidraw-to-image` — converts `.excalidraw.md` / `.excalidraw` files to PNG so Claude can see them
- `excalidraw-draw` — generates `.excalidraw` files from a simple JSON spec so Claude can draw

---

## Why?

When working with Claude Code on a project that includes Excalidraw wireframes, Claude cannot make sense of the raw `.excalidraw.md` format (compressed binary data). This toolkit gives Claude two superpowers:

1. **See** your existing Excalidraw diagrams by converting them to PNG
2. **Draw** new wireframes by generating valid Excalidraw files from structured JSON

---

## Requirements

- Node.js >= 18
- ~300MB disk space (Puppeteer downloads a bundled Chromium on first install)

---

## Installation

```bash
git clone https://github.com/RebornFlamme/claude-excalidraw.git
cd claude-excalidraw
npm install   # builds renderer bundle + downloads Chromium (~2 min)
npm link      # exposes both commands globally
```

---

## `excalidraw-to-image` — Read wireframes

Converts an Excalidraw file to PNG.

```bash
excalidraw-to-image <file.excalidraw.md> [-o output.png]
```

| Flag | Description | Default |
|------|-------------|---------|
| `-o <path>` | Output PNG path | Same name as input with `.png` |
| `-h, --help` | Show help | |

**Supported input formats:**

| Format | Description |
|--------|-------------|
| `.excalidraw.md` | Obsidian Excalidraw plugin (compressed JSON in Markdown) |
| `.excalidraw` | Plain Excalidraw JSON |

**Examples:**

```bash
excalidraw-to-image "Login Flow.excalidraw.md"
excalidraw-to-image "Login Flow.excalidraw.md" -o "/tmp/preview.png"
```

---

## `excalidraw-draw` — Create wireframes

Generates a `.excalidraw` file from a JSON spec. The output can be opened in Obsidian/Excalidraw or converted to PNG with `excalidraw-to-image`.

```bash
excalidraw-draw <spec.json> [-o output.excalidraw]
excalidraw-draw --inline '<json>' [-o output.excalidraw]
```

| Flag | Description | Default |
|------|-------------|---------|
| `-o <path>` | Output `.excalidraw` path | Same name as input with `.excalidraw` |
| `--inline <json>` | Pass spec as a JSON string instead of a file | |
| `-h, --help` | Show help | |

### Spec format

```json
{
  "background": "#ffffff",
  "elements": [
    { "type": "rectangle", "x": 0,   "y": 0,   "width": 300, "height": 60,  "label": "Header" },
    { "type": "ellipse",   "x": 0,   "y": 80,  "width": 60,  "height": 60  },
    { "type": "diamond",   "x": 100, "y": 80,  "width": 100, "height": 60,  "label": "Decision?" },
    { "type": "text",      "x": 0,   "y": 160, "text": "A note", "fontSize": 14 },
    { "type": "arrow",     "x": 50,  "y": 60,  "points": [[0,0],[0,80]] },
    { "type": "line",      "x": 0,   "y": 200, "points": [[0,0],[300,0]] },
    { "type": "frame",     "x": 0,   "y": 0,   "width": 400, "height": 300, "label": "Screen A" }
  ]
}
```

### Supported element types

| Type | Required fields | Notes |
|------|----------------|-------|
| `rectangle` | `x`, `y`, `width`, `height` | Add `label` for text inside |
| `ellipse` | `x`, `y`, `width`, `height` | Add `label` for text inside |
| `diamond` | `x`, `y`, `width`, `height` | Add `label` for text inside |
| `text` | `x`, `y`, `text` | Standalone text, use `fontSize` to size |
| `arrow` | `x`, `y`, `points` | `points` are relative to `x,y` — e.g. `[[0,0],[100,50]]` |
| `line` | `x`, `y`, `points` | Same as arrow but no arrowhead |
| `frame` | `x`, `y`, `width`, `height` | Named container, use `label` for the frame title |

### Style properties (all optional)

| Property | Values | Default |
|----------|--------|---------|
| `strokeColor` | Any hex color | `#1e1e1e` |
| `backgroundColor` | Any hex color or `transparent` | `transparent` |
| `fillStyle` | `solid`, `hachure`, `cross-hatch`, `dots` | `solid` |
| `strokeWidth` | `1`, `2`, `4` | `2` |
| `strokeStyle` | `solid`, `dashed`, `dotted` | `solid` |
| `roughness` | `0` (clean), `1` (sketch), `2` (very rough) | `1` |
| `opacity` | `0`–`100` | `100` |
| `fontSize` | Number in px | `16` |
| `fontFamily` | `1` (Virgil/handwritten), `2` (Helvetica), `3` (Cascadia/mono) | `1` |

### Coordinate system

Origin `(0, 0)` is top-left. `x` goes right, `y` goes down. Typical canvas sizes:
- Mobile: 375 × 812
- Desktop: 1280 × 800
- Tablet: 768 × 1024

### Example: full login screen

```bash
excalidraw-draw --inline '{
  "elements": [
    { "type": "text",      "x": 130, "y": 40,  "text": "Sign In", "fontSize": 28 },
    { "type": "text",      "x": 40,  "y": 110, "text": "Email",   "fontSize": 14 },
    { "type": "rectangle", "x": 40,  "y": 130, "width": 300, "height": 44, "roughness": 0, "backgroundColor": "#f8f8f8", "fillStyle": "solid" },
    { "type": "text",      "x": 40,  "y": 200, "text": "Password","fontSize": 14 },
    { "type": "rectangle", "x": 40,  "y": 220, "width": 300, "height": 44, "roughness": 0, "backgroundColor": "#f8f8f8", "fillStyle": "solid" },
    { "type": "rectangle", "x": 40,  "y": 290, "width": 300, "height": 48, "roughness": 0, "backgroundColor": "#4361ee", "strokeColor": "#4361ee", "fillStyle": "solid", "label": "Log In" },
    { "type": "text",      "x": 130, "y": 360, "text": "Forgot password?", "fontSize": 13, "strokeColor": "#4361ee" }
  ]
}' -o login.excalidraw

excalidraw-to-image login.excalidraw -o login.png
```

---

## Integration with Claude Code

Add this to your global `~/.claude/CLAUDE.md` (create if it doesn't exist):

````markdown
## Excalidraw tools

Two commands are available globally: `excalidraw-to-image` and `excalidraw-draw`.

---

### Reading an existing file

When the user mentions a `.excalidraw` or `.excalidraw.md` file, always:
1. Run: `excalidraw-to-image "path/to/file.excalidraw.md" -o "/tmp/preview.png"`
2. Read the PNG with the Read tool to see it visually
3. Never read the raw text of an Excalidraw file without rendering it first

To zoom into a specific area of a large image, use Puppeteer to crop it:
```javascript
// run via Bash: node /tmp/crop.js
const puppeteer = require('C:/path/to/excalidraw-to-image/node_modules/puppeteer');
const fs = require('fs');
const [cropX, cropY, cropW, cropH] = [0, 200, 800, 600]; // adjust to the region
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: cropW, height: cropH });
  const b64 = fs.readFileSync('/tmp/preview.png').toString('base64');
  await page.setContent(`<html><body style="margin:0;overflow:hidden">
    <img src="data:image/png;base64,${b64}"
         style="position:absolute;top:-${cropY}px;left:-${cropX}px">
  </body></html>`);
  await new Promise(r => setTimeout(r, 400));
  fs.writeFileSync('/tmp/crop.png', await page.screenshot());
  await browser.close();
})();
```

---

### Drawing a new wireframe

**When to proactively offer to draw** (without waiting to be asked):
- The user describes an interface, a flow, or an architecture
- A diagram would communicate the answer more clearly than text
- The user shows an existing wireframe and asks for changes or improvements

**Workflow — always follow this order:**
1. **Declare** in plain text what you are going to draw: screens, components, flow, annotations
2. **Generate** the file:
   ```bash
   # Plain file (for rendering only)
   excalidraw-draw --inline '<spec JSON>' -o "/tmp/drawing.excalidraw"
   # Obsidian-compatible (openable in the vault)
   excalidraw-draw --inline '<spec JSON>' -o "/path/to/vault/drawing.excalidraw.md"
   ```
3. **Render** to PNG:
   ```bash
   excalidraw-to-image "/tmp/drawing.excalidraw" -o "/tmp/drawing.png"
   ```
4. **Compare** visually using the Read tool:
   - If the render matches the declaration → confirm ✅
   - If something is mispositioned or unreadable → fix the spec and regenerate, do not leave a bad result without correcting it

---

### Spec format

```json
{
  "background": "#ffffff",
  "elements": [
    { "type": "rectangle", "x": 0,   "y": 0,   "width": 300, "height": 60,  "label": "Header" },
    { "type": "ellipse",   "x": 0,   "y": 80,  "width": 60,  "height": 60  },
    { "type": "diamond",   "x": 100, "y": 80,  "width": 100, "height": 60,  "label": "Decision?" },
    { "type": "text",      "x": 0,   "y": 160, "text": "A note", "fontSize": 14 },
    { "type": "arrow",     "x": 50,  "y": 60,  "points": [[0,0],[0,80]] },
    { "type": "line",      "x": 0,   "y": 200, "points": [[0,0],[300,0]] },
    { "type": "frame",     "x": 0,   "y": 0,   "width": 400, "height": 300, "label": "Screen A" }
  ]
}
```

Supported types: `rectangle`, `ellipse`, `diamond`, `text`, `arrow`, `line`, `frame`

Style properties (all optional):

| Property | Values | Default |
|----------|--------|---------|
| `strokeColor` | hex | `#1e1e1e` |
| `backgroundColor` | hex or `transparent` | `transparent` |
| `fillStyle` | `solid`, `hachure`, `cross-hatch`, `dots` | `solid` |
| `strokeWidth` | `1`, `2`, `4` | `2` |
| `strokeStyle` | `solid`, `dashed`, `dotted` | `solid` |
| `roughness` | `0` clean, `1` sketch, `2` very rough | `1` |
| `fontSize` | number in px | `16` |
| `fontFamily` | `1` Virgil (handwritten), `2` Helvetica, `3` Cascadia (mono) | `1` |

---

### Layout strategy

**Coordinate system:** origin (0,0) is top-left, x goes right, y goes down.

**Typical canvas sizes:**
- Mobile: 375 × 812 px
- Desktop: 1280 × 800 px
- Tablet: 768 × 1024 px

**Standard spacing:**
- Screen padding: 20–40 px from the edge
- Gap between elements: 12–16 px (compact), 24–32 px (airy)
- Navbar height: 56 px
- Button height: 44–48 px
- Form field height: 44 px

**Typography scale:**
- H1 / page title: `fontSize: 28`
- H2 / section title: `fontSize: 20`
- Label / subtitle: `fontSize: 16`
- Body text: `fontSize: 14`
- Caption / hint: `fontSize: 12`

**Always calculate positions explicitly before writing the spec.** Example — centering a 300px button on a 375px mobile screen: `x = (375 - 300) / 2 = 37`.

**Multiple screens side by side:** space frames 80–120 px apart horizontally so arrows can fit between them.

---

### Visual conventions

**Lo-fi wireframe (default):**
- `roughness: 1`, `fontFamily: 1` (Virgil)
- Palette: `strokeColor: "#1e1e1e"`, fills `"#f5f5f5"` or `transparent`
- Use color only for primary CTAs

**Hi-fi wireframe (when asked):**
- `roughness: 0`, `fontFamily: 2` (Helvetica)
- Real colors for buttons, icons, states

**Primary button:** `backgroundColor: "#4361ee"`, `strokeColor: "#4361ee"`, `fillStyle: "solid"`, `roughness: 0`

**Form field:** `backgroundColor: "#f8f8f8"`, `strokeColor: "#cccccc"`, `roughness: 0`

**Disabled / placeholder area:** `backgroundColor: "#ebebeb"`, `opacity: 60`

**Annotation / design comment:** `text` in red (`strokeColor: "#e03131"`) with an `arrow` pointing to the relevant element

---

### Common UI patterns

**Mobile navbar:**
```json
{ "type": "rectangle", "x": 0, "y": 0, "width": 375, "height": 56,
  "backgroundColor": "#ffffff", "strokeColor": "#e0e0e0", "roughness": 0 },
{ "type": "text", "x": 16, "y": 18, "text": "← Back", "fontSize": 16 },
{ "type": "text", "x": 155, "y": 18, "text": "Title", "fontSize": 18 }
```

**Content card:**
```json
{ "type": "rectangle", "x": 20, "y": 80, "width": 335, "height": 100,
  "backgroundColor": "#ffffff", "strokeColor": "#e0e0e0", "roughness": 0 },
{ "type": "rectangle", "x": 32, "y": 92, "width": 76, "height": 76,
  "backgroundColor": "#ebebeb", "roughness": 0 },
{ "type": "text", "x": 120, "y": 96, "text": "Card title", "fontSize": 16 },
{ "type": "text", "x": 120, "y": 120, "text": "Subtitle or description", "fontSize": 13 }
```

**Horizontal divider:**
```json
{ "type": "line", "x": 20, "y": 200, "points": [[0,0],[335,0]],
  "strokeColor": "#e0e0e0", "roughness": 0 }
```

**Modal overlay:**
```json
{ "type": "rectangle", "x": 0, "y": 0, "width": 375, "height": 812,
  "backgroundColor": "#000000", "fillStyle": "solid", "opacity": 40, "roughness": 0 },
{ "type": "rectangle", "x": 20, "y": 220, "width": 335, "height": 280,
  "backgroundColor": "#ffffff", "roughness": 0 }
```

**Navigation arrow between screens:**
```json
{ "type": "arrow", "x": 415, "y": 300, "points": [[0,0],[70,0]],
  "strokeColor": "#868e96", "roughness": 0 }
```
````

---

## Project structure

```
├── cli.js                   # excalidraw-to-image entry point
├── draw-cli.js              # excalidraw-draw entry point
├── build-renderer.js        # esbuild script (runs on postinstall)
├── src/
│   ├── decompress.js        # LZ-string decompression (read)
│   ├── render.js            # Puppeteer PNG rendering (read)
│   ├── create.js            # Excalidraw element factory (draw)
│   └── browser/
│       └── renderer.js      # Browser-side export code (bundled)
└── dist/
    └── renderer.bundle.js   # Generated on install, do not commit
```

---

## Troubleshooting

**`command not found`** — run `npm link` inside the project directory.

**`Renderer bundle not found`** — run `npm run build` manually.

**Slow first render** — Puppeteer initialises Chromium on the first call; subsequent runs are faster.

**Text renders as boxes** — make sure `@excalidraw/excalidraw >= 0.18.0` is installed (`npm install` inside the project).

---

## License

MIT
