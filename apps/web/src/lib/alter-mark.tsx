import { ALTER_STROKE, alterGlyphs, type AlterWord } from "./alter-glyphs";

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
  const { glyphs, width, height: viewHeight } = alterGlyphs(word);
  const scale = height / viewHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${viewHeight}`}
      width={width * scale}
      height={height}
      className={className}
      aria-hidden="true"
    >
      {glyphs.map(({ x, glyph }, index) => (
        <g key={index} transform={`translate(${x} 0)`}>
          <path
            d={glyph.d}
            fill="none"
            stroke={fill}
            strokeWidth={ALTER_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {glyph.dots?.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={ALTER_STROKE / 2} fill={fill} />
          ))}
        </g>
      ))}
    </svg>
  );
}
