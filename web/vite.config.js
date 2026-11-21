import { defineConfig } from "vite";

// La división en archivos la deciden las importaciones dinámicas: el panel
// arranca liviano y three.js y el SDK de Stellar llegan cuando hacen falta.
// reporte.html es una segunda página: el reporte de historial para cooperativas.
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: { input: { main: "index.html", reporte: "reporte.html" } },
  },
});
