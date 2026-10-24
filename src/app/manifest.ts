import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avalie Bolados",
    short_name: "Bolados",
    description: "Checklist, notas e ranking para avaliar bolados de tabaco, beck, mesclado, cumbaibeck e mais.",
    start_url: "/inicio",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    lang: "pt-BR",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
