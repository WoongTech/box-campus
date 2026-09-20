import { ImageResponse } from "next/og";

const ink = "#f4f1ea";

export function homeIcon(size: number) {
  const mark = Math.round(size * 0.62);

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
        <svg width={mark} height={mark} viewBox="0 0 32 32">
          <path fill={ink} fillRule="evenodd" d="M13 4a11 11 0 1 0 .01 0z M13 10a5 5 0 1 1-.01 0z M13 12.1 16 15 13 17.9 10 15z" />
          <rect x="18.2" y="4" width="6" height="22" fill={ink} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
