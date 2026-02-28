const LZString = require("lz-string");

/**
 * Extract and decompress Excalidraw data from file content.
 * Supports:
 *  - Obsidian Excalidraw plugin format (compressed-json code block)
 *  - Plain .excalidraw JSON files
 */
function decompressExcalidraw(content) {
  // Obsidian Excalidraw plugin: data is in a ```compressed-json block
  const compressedMatch = content.match(
    /```compressed-json\r?\n([\s\S]+?)\r?\n```/
  );
  if (compressedMatch) {
    const compressed = compressedMatch[1].replace(/\s+/g, "");
    const decompressed = LZString.decompressFromBase64(compressed);
    if (decompressed) {
      return JSON.parse(decompressed);
    }
  }

  // Plain JSON excalidraw file
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.elements)) {
      return parsed;
    }
  } catch (_) {}

  throw new Error(
    "Could not parse Excalidraw data. Make sure the file is a valid .excalidraw or .excalidraw.md file."
  );
}

module.exports = { decompressExcalidraw };
