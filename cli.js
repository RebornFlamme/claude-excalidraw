#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: excalidraw-to-image <file.excalidraw.md> [-o output.png]");
  console.log("");
  console.log("Options:");
  console.log("  -o <path>   Output PNG path (default: same name as input with .png)");
  console.log("  -h, --help  Show this help");
  process.exit(0);
}

const inputFile = path.resolve(args[0]);

const outputIndex = args.indexOf("-o");
const outputFile =
  outputIndex !== -1
    ? path.resolve(args[outputIndex + 1])
    : inputFile.replace(/\.excalidraw\.md$/, ".png").replace(/\.excalidraw$/, ".png");

const { decompressExcalidraw } = require("./src/decompress");
const { renderToImage } = require("./src/render");

async function main() {
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Reading ${path.basename(inputFile)}...`);
  const content = fs.readFileSync(inputFile, "utf8");

  console.log("Decompressing Excalidraw data...");
  const data = decompressExcalidraw(content);
  console.log(`Found ${data.elements?.length ?? 0} elements`);

  console.log("Rendering to PNG (this may take a few seconds)...");
  const png = await renderToImage(data);

  fs.writeFileSync(outputFile, png);
  console.log(`Done! Saved to: ${outputFile}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
