import type { AlterPrimitive, AlterWord } from "./alter-glyphs";
import { alterPlacements } from "./alter-glyphs";

function Primitive({ primitive, fill }: { primitive: AlterPrimitive; fill: string }) {
  if (primitive.kind === "square") {
    return <rect x={primitive.x} y={primitive.y} width={primitive.w} height={primitive.h} fill={fill} />;
  }
  if (primitive.kind === "ring") {
    return (
      <path
        fill={fill}
        fillRule="evenodd"
        d={`M ${primitive.cx} ${primitive.cy - primitive.r} a ${primitive.r} ${primitive.r} 0 1 0 0.01 0 z M ${primitive.cx} ${primitive.cy - primitive.inner} a ${primitive.inner} ${primitive.inner} 0 1 1 -0.01 0 z`}
      />
    );
  }
  return (
    <polygon
      points={`${primitive.x1},${primitive.y1} ${primitive.x2},${primitive.y2} ${primitive.x3},${primitive.y3}`}
      fill={fill}
    />
  );
}

export function AlterMarkSvg({
  word,
  fill = "currentColor",
  className,
  height = 22,
}: {
  word: AlterWord;
  fill?: string;
  className?: string;
  height?: number;
}) {
  const { placements, width, height: viewHeight } = alterPlacements(word);
  const scale = height / viewHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${viewHeight}`}
      width={width * scale}
      height={height}
      className={className}
      aria-hidden="true"
    >
      {placements.map((placement, index) => (
        <g key={index} transform={`translate(${placement.x} 0)`}>
          <Primitive primitive={placement.primitive} fill={fill} />
        </g>
      ))}
    </svg>
  );
}
