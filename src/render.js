const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BUNDLE_PATH = path.join(__dirname, "../dist/renderer.bundle.js");

async function renderToImage(excalidrawData) {
  if (!fs.existsSync(BUNDLE_PATH)) {
    throw new Error(
      `Renderer bundle not found at ${BUNDLE_PATH}. Run: npm run build`
    );
  }

  const bundleContent = fs.readFileSync(BUNDLE_PATH, "utf8");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(
      "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body></body></html>"
    );

    // Inject the bundled renderer (inline to avoid file:// CORS issues)
    await page.addScriptTag({ content: bundleContent });

    // Wait for renderer to be ready
    await page.waitForFunction(() => window.__rendererReady === true, {
      timeout: 15000,
    });

    // Run the export
    const result = await page.evaluate(async (data) => {
      try {
        const base64 = await window.__renderExcalidraw(data);
        return { ok: true, base64 };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }, excalidrawData);

    if (!result.ok) {
      throw new Error(`Excalidraw export failed: ${result.error}`);
    }

    return Buffer.from(result.base64, "base64");
  } finally {
    await browser.close();
  }
}

module.exports = { renderToImage };
