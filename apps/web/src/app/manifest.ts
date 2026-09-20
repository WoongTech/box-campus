import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "상자",
    short_name: "상자",
    description: "어떤 주제도 한 장씩 넘겨 보는 학습",
    start_url: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    lang: "ko",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
