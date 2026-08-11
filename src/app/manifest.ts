import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FindBack",
    short_name: "FindBack",
    description: "Report lost and found items and reunite them with their owners.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5faf8",
    theme_color: "#00685f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
