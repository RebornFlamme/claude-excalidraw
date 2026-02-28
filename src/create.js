const crypto = require("crypto");
const LZString = require("lz-string");

function uid() {
  return crypto.randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
}

function rnd() {
  return Math.floor(Math.random() * 2147483647);
}

// Rough approximation of text dimensions given font size
function estimateTextSize(text, fontSize) {
  const lines = text.split("\n");
  const width = Math.max(...lines.map((l) => l.length)) * fontSize * 0.6;
  const height = lines.length * fontSize * 1.25;
  return { width, height };
}

const STYLE_DEFAULTS = {
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
};

function baseFields(spec, id) {
  return {
    id: id || uid(),
    seed: rnd(),
    version: 1,
    versionNonce: rnd(),
    angle: 0,
    x: spec.x ?? 0,
    y: spec.y ?? 0,
    width: spec.width ?? 100,
    height: spec.height ?? 50,
    groupIds: spec.groupIds ?? [],
    frameId: spec.frameId ?? null,
    roundness: spec.roundness ?? null,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    ...STYLE_DEFAULTS,
    // Allow per-element style overrides
    ...(spec.strokeColor !== undefined && { strokeColor: spec.strokeColor }),
    ...(spec.backgroundColor !== undefined && { backgroundColor: spec.backgroundColor }),
    ...(spec.fillStyle !== undefined && { fillStyle: spec.fillStyle }),
    ...(spec.strokeWidth !== undefined && { strokeWidth: spec.strokeWidth }),
    ...(spec.strokeStyle !== undefined && { strokeStyle: spec.strokeStyle }),
    ...(spec.roughness !== undefined && { roughness: spec.roughness }),
    ...(spec.opacity !== undefined && { opacity: spec.opacity }),
  };
}

function makeText(text, x, y, opts = {}) {
  const fontSize = opts.fontSize ?? 16;
  const { width, height } = estimateTextSize(text, fontSize);
  return {
    ...baseFields(opts),
    id: opts.id || uid(),
    type: "text",
    x,
    y,
    width: opts.width ?? width,
    height: opts.height ?? height,
    fontSize,
    fontFamily: opts.fontFamily ?? 1, // 1=Virgil (handwritten), 2=Helvetica, 3=Cascadia
    text,
    originalText: text,
    textAlign: opts.textAlign ?? "left",
    verticalAlign: opts.verticalAlign ?? "top",
    containerId: opts.containerId ?? null,
    autoResize: opts.containerId ? false : true,
    lineHeight: 1.25,
  };
}

function makeArrowOrLine(spec) {
  const points = spec.points ?? [[0, 0], [spec.width ?? 100, 0]];
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    ...baseFields(spec),
    type: spec.type,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    points,
    lastCommittedPoint: null,
    startBinding: spec.startBinding ?? null,
    endBinding: spec.endBinding ?? null,
    startArrowhead: spec.startArrowhead ?? null,
    endArrowhead: spec.type === "arrow" ? (spec.endArrowhead ?? "arrow") : null,
    roundness: spec.roundness ?? { type: 2 },
  };
}

function makeFrame(spec) {
  return {
    ...baseFields(spec),
    type: "frame",
    name: spec.name ?? spec.label ?? "",
    isCollapsed: false,
    roundness: null,
  };
}

function makeShape(spec) {
  const id = uid();
  const w = spec.width ?? 100;
  const h = spec.height ?? 50;
  const shape = { ...baseFields(spec, id), type: spec.type };
  const elements = [];

  if (spec.label) {
    const textId = uid();
    const fontSize = spec.fontSize ?? 16;
    const { width: tw, height: th } = estimateTextSize(spec.label, fontSize);
    const textEl = makeText(spec.label, spec.x + (w - tw) / 2, spec.y + (h - th) / 2, {
      id: textId,
      containerId: id,
      textAlign: "center",
      verticalAlign: "middle",
      width: tw,
      height: th,
      fontSize,
    });
    shape.boundElements = [{ id: textId, type: "text" }];
    elements.push(shape, textEl);
  } else {
    elements.push(shape);
  }

  return elements;
}

/**
 * Build a complete Excalidraw document from a simplified spec.
 *
 * Spec format:
 * {
 *   "background": "#ffffff",   // optional canvas background
 *   "elements": [
 *     { "type": "rectangle", "x": 0, "y": 0, "width": 200, "height": 80, "label": "Header" },
 *     { "type": "ellipse",   "x": 0, "y": 0, "width": 60,  "height": 60  },
 *     { "type": "diamond",   "x": 0, "y": 0, "width": 100, "height": 60, "label": "Decision" },
 *     { "type": "text",      "x": 0, "y": 0, "text": "Hello", "fontSize": 20 },
 *     { "type": "arrow",     "x": 0, "y": 0, "points": [[0,0],[100,0]] },
 *     { "type": "line",      "x": 0, "y": 0, "points": [[0,0],[100,0]] },
 *     { "type": "frame",     "x": 0, "y": 0, "width": 300, "height": 200, "label": "Section" }
 *   ]
 * }
 *
 * All style properties are optional and fall back to Excalidraw defaults:
 *   strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity
 */
function buildDocument(spec) {
  const elements = [];

  for (const el of spec.elements ?? []) {
    if (el.type === "text") {
      elements.push(makeText(el.text ?? "", el.x ?? 0, el.y ?? 0, el));
    } else if (el.type === "arrow" || el.type === "line") {
      elements.push(makeArrowOrLine(el));
    } else if (el.type === "frame") {
      elements.push(makeFrame(el));
    } else if (["rectangle", "ellipse", "diamond"].includes(el.type)) {
      elements.push(...makeShape(el));
    } else {
      console.warn(`Unknown element type: ${el.type} — skipped`);
    }
  }

  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: spec.background ?? "#ffffff",
    },
    files: {},
  };
}

/**
 * Build an Obsidian-compatible `.excalidraw.md` string from a spec.
 * The output can be saved directly as a `.excalidraw.md` file and opened
 * in Obsidian with the Excalidraw plugin.
 */
function buildObsidianMarkdown(spec) {
  const doc = buildDocument(spec);

  // Collect all text content for the ## Text Elements section
  const textElements = doc.elements.filter((el) => el.type === "text");
  const textSection = textElements
    .map((el) => `${el.text} ^${el.id}`)
    .join("\n\n");

  // Compress the JSON document with LZ-string (same algorithm Obsidian uses)
  const compressed = LZString.compressToBase64(JSON.stringify(doc));

  // Split into lines of 100 chars to match Obsidian's formatting
  const lines = compressed.match(/.{1,100}/g) ?? [];
  const compressedBlock = lines.join("\n");

  return [
    "---",
    "",
    "excalidraw-plugin: parsed",
    "tags: [excalidraw]",
    "",
    "---",
    "==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'",
    "",
    "",
    "# Excalidraw Data",
    "",
    "## Text Elements",
    textSection,
    "",
    "%%",
    "## Drawing",
    "```compressed-json",
    compressedBlock,
    "```",
    "%%",
    "",
  ].join("\n");
}

module.exports = { buildDocument, buildObsidianMarkdown };
