import { defineConfig } from "vite";

// Separa las librerías grandes en archivos propios: el navegador las guarda en
// caché aunque cambie el código de Awayu, y la primera carga se reparte.
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/three/")) return "three";
          if (id.includes("@stellar") || id.includes("stellar-base") || id.includes("buffer")) return "stellar";
          if (id.includes("@pollar")) return "pollar";
          return "vendor";
        },
      },
    },
  },
});
