import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

function iconSrc() {
  const candidates = [
    join(process.cwd(), "public/alter-a.png"),
    join(process.cwd(), "apps/web/public/alter-a.png"),
  ];

  for (const path of candidates) {
    try {
      return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
    } catch {
      continue;
    }
  }

  throw new Error("alter icon is missing");
}

export function homeIcon(size: number) {
  const src = iconSrc();

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <img alt="" height={size} src={src} width={size} />
      </div>
    ),
    { width: size, height: size },
  );
}
