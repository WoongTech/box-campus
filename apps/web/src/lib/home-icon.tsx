import { ImageResponse } from "next/og";

const BACKGROUND = "#111111";
const MARK = "#f5f5f5";

export function homeIcon(size: number) {
  const stroke = Math.max(2, Math.round(size * 0.045));
  const box = Math.round(size * 0.46);
  const lid = Math.round(box * 0.28);
  const radius = Math.round(size * 0.04);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BACKGROUND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: Math.round(box * 1.12),
              height: lid,
              border: `${stroke}px solid ${MARK}`,
              borderRadius: radius,
              display: "flex",
            }}
          />
          <div
            style={{
              width: box,
              height: Math.round(box * 0.62),
              marginTop: Math.round(stroke * 0.65),
              border: `${stroke}px solid ${MARK}`,
              borderRadius: radius,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
