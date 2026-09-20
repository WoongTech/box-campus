import { ImageResponse } from "next/og";
import { AlterMarkSvg } from "./alter-mark";

const ink = "#f4f1ea";

export function homeIcon(size: number) {
  const mark = Math.round(size * 0.56);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0c0c0c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlterMarkSvg word={["a"]} fill={ink} height={mark} />
      </div>
    ),
    { width: size, height: size },
  );
}
