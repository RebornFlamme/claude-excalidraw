const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "dist");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

console.log("Building Excalidraw renderer bundle...");

esbuild
  .build({
    entryPoints: [path.join(__dirname, "src/browser/renderer.js")],
    bundle: true,
    platform: "browser",
    outfile: path.join(__dirname, "dist/renderer.bundle.js"),
    format: "iife",
    loader: {
      ".css": "empty",
      ".woff2": "empty",
      ".woff": "empty",
      ".ttf": "empty",
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
  })
  .then(() => {
    console.log("Renderer bundle built successfully.");
  })
  .catch((err) => {
    console.error("Build failed:", err.message);
    process.exit(1);
  });
