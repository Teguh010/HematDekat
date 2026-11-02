import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HematDekat",
    short_name: "HematDekat",
    description: "Cari sembako termurah di dekatmu",
    start_url: "/",
    display: "standalone",
    theme_color: "#ffffff",
    background_color: "#f8fafc",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
