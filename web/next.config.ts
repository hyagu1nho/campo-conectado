import type { NextConfig } from "next";

// Sem cacheComponents: o curso usa o modelo de cache do fetch
// (next.revalidate, tags e updateTag), não a diretiva "use cache".
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
