const PALETTES: ReadonlyArray<readonly [string, string]> = [
  ["#6d8cff", "#3b3f8f"],
  ["#ff7aa2", "#7a2f55"],
  ["#4adeb0", "#1a5c55"],
  ["#f0b429", "#7a4a12"],
  ["#a78bfa", "#3f2b7a"],
  ["#38bdf8", "#1e4a70"],
  ["#fb923c", "#7a3b16"],
  ["#c084fc", "#4c1d75"],
];

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Letter-free story avatar: quiet two-stop disc from a stable seed. */
export function StoryMark({
  seed,
  size = 36,
  className,
  title,
}: {
  seed: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const value = hashSeed(seed || "alter");
  const [a, b] = PALETTES[value % PALETTES.length]!;
  const angle = 135 + (value % 6) * 15;

  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`block shrink-0 rounded-full ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(${angle}deg, ${a}, ${b})`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
      }}
    />
  );
}
