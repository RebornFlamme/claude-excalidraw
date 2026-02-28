import { exportToBlob } from "@excalidraw/excalidraw";

window.__renderExcalidraw = async function (data) {
  const blob = await exportToBlob({
    elements: data.elements || [],
    appState: {
      exportBackground: true,
      exportWithDarkMode: false,
      viewBackgroundColor: "#ffffff",
      exportPadding: 20,
    },
    files: data.files || null,
  });

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

window.__rendererReady = true;
