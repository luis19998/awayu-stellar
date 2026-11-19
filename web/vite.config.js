import { defineConfig } from "vite";

// La división en archivos la deciden las importaciones dinámicas: el panel
// arranca liviano y three.js y el SDK de Stellar llegan cuando hacen falta.
export default defineConfig({
  build: { chunkSizeWarningLimit: 1600 },
});
