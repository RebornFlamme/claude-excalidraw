#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: excalidraw-draw <spec.json> [-o output.excalidraw]");
  console.log("       excalidraw-draw --inline '<json>' [-o output.excalidraw]");
  console.log("");
  console.log("Options:");
  console.log("  -o <path>       Output .excalidraw file path");
  console.log("  --inline <json> Pass spec JSON directly instead of a file");
  console.log("  -h, --help      Show this help");
  process.exit(0);
}

const { buildDocument, buildObsidianMarkdown } = require("./src/create");

const outputIndex = args.indexOf("-o");
const inlineIndex = args.indexOf("--inline");

let spec;
let outputFile;

if (inlineIndex !== -1) {
  // --inline mode: spec is passed as a JSON string
  const jsonStr = args[inlineIndex + 1];
  if (!jsonStr) {
    console.error("--inline requires a JSON string argument");
    process.exit(1);
  }
  try {
    spec = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Invalid JSON for --inline:", e.message);
    process.exit(1);
  }
  outputFile =
    outputIndex !== -1
      ? path.resolve(args[outputIndex + 1])
      : path.join(process.cwd(), `drawing-${Date.now()}.excalidraw`);
} else {
  // File mode
  const inputFile = path.resolve(args[0]);
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }
  try {
    spec = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  } catch (e) {
    console.error("Invalid JSON in spec file:", e.message);
    process.exit(1);
  }
  outputFile =
    outputIndex !== -1
      ? path.resolve(args[outputIndex + 1])
      : inputFile.replace(/\.json$/, ".excalidraw");
}

const isObsidian = outputFile.endsWith(".excalidraw.md");

let content;
let elementCount;

if (isObsidian) {
  content = buildObsidianMarkdown(spec);
  // Count elements by building the doc (buildObsidianMarkdown does it internally)
  elementCount = buildDocument(spec).elements.length;
} else {
  const doc = buildDocument(spec);
  content = JSON.stringify(doc, null, 2);
  elementCount = doc.elements.length;
}

fs.writeFileSync(outputFile, content, "utf8");
console.log(`Created ${elementCount} element(s) → ${outputFile}`);
