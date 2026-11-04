import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // El indicador de desarrollo tapaba el botón "Reiniciar demo" del menú lateral.
  devIndicators: { position: "bottom-right" },
  experimental: {
    // Las pantallas se dibujan solo en el navegador (los datos de la demo están
    // en localStorage), así que la primera carga espera a propósito. Sin esto,
    // `next dev` marca cada página como una navegación que no es instantánea.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    // Fija la raíz al proyecto: hay un pnpm-workspace.yaml en la carpeta de
    // usuario que Next.js detectaría como raíz.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
