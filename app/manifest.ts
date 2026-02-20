import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ICTI手順 テトリス＋プロトコル",
    short_name: "ICTI Tetris",
    description: "短い思い出し・回転課題・テトリスを順番に進めるガイドアプリ",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4efe5",
    theme_color: "#2f6f5e",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
