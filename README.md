# excalidraw-to-image

A CLI tool that converts [Obsidian Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin) files (`.excalidraw.md`) into PNG images — primarily designed to let **Claude Code** see your wireframes visually.

## Why?

When working with Claude Code on a project that includes Excalidraw wireframes, Claude can only read the raw text of `.excalidraw.md` files — which is compressed, unreadable data. This tool converts those files to PNG so Claude can actually **see** your diagrams and give you meaningful feedback on them.

## How it works

1. Reads the `.excalidraw.md` file (Obsidian Excalidraw plugin format)
2. Extracts and decompresses the drawing data (LZ-string base64 compression)
3. Bundles `@excalidraw/excalidraw` and renders the scene via a headless Chromium browser (Puppeteer)
4. Saves the result as a PNG

## Requirements

- Node.js >= 18
- ~300MB disk space (Puppeteer downloads a bundled Chromium on first install)

## Installation

```bash
git clone https://github.com/RebornFlamme/claude-excalidraw.git
cd claude-excalidraw
npm install   # also builds the renderer bundle and downloads Chromium
npm link      # makes `excalidraw-to-image` available globally
```

## Usage

```bash
excalidraw-to-image <file.excalidraw.md> [-o output.png]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o <path>` | Output PNG path | Same as input with `.png` extension |
| `-h, --help` | Show help | |

### Examples

```bash
# Basic usage (outputs to same folder as input)
excalidraw-to-image "My Wireframe.excalidraw.md"

# Specify output path
excalidraw-to-image "My Wireframe.excalidraw.md" -o "/tmp/preview.png"

# Works from any directory
excalidraw-to-image "/path/to/vault/designs/Login Flow.excalidraw.md" -o "./login-flow.png"
```

## Integration with Claude Code

This tool is designed to be used alongside Claude Code so that Claude can visually interpret your Excalidraw wireframes.

### Setup

Add the following to your global `~/.claude/CLAUDE.md` file (create it if it doesn't exist):

```markdown
## Excalidraw Tool

Whenever the user mentions a `.excalidraw` or `.excalidraw.md` file, or asks about a wireframe/diagram:

1. Convert it to PNG:
   `excalidraw-to-image "path/to/file.excalidraw.md" -o "/tmp/preview.png"`
2. Read the PNG with the Read tool to see it visually
3. Use what you see to inform your response

Never just read the raw text of a `.excalidraw.md` file.
```

### Workflow

Once set up, you can simply tell Claude:

> "Look at my wireframe at `designs/Login Flow.excalidraw.md` and suggest improvements"

Claude will automatically convert and view the image before responding.

## Supported file formats

| Format | Description |
|--------|-------------|
| `.excalidraw.md` | Obsidian Excalidraw plugin format (compressed JSON embedded in Markdown) |
| `.excalidraw` | Plain Excalidraw JSON format |

## Project structure

```
├── cli.js                   # CLI entry point
├── build-renderer.js        # esbuild script (runs on postinstall)
├── src/
│   ├── decompress.js        # LZ-string decompression
│   ├── render.js            # Puppeteer rendering
│   └── browser/
│       └── renderer.js      # Browser-side code (bundled by esbuild)
└── dist/
    └── renderer.bundle.js   # Generated bundle (created on install)
```

## Troubleshooting

**`excalidraw-to-image: command not found`**
Make sure you ran `npm link` after installation.

**`Renderer bundle not found`**
Run `npm run build` manually inside the project directory.

**Rendering takes a long time**
The first run after installation may be slow as Puppeteer initializes Chromium. Subsequent runs are faster.

**Text appears as boxes / wrong font**
Excalidraw embeds its fonts in the export — this should work out of the box. If you see issues, make sure you're on `@excalidraw/excalidraw >= 0.18.0`.

## License

MIT
