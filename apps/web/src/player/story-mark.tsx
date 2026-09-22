const PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#5b8cff", "#7c5cff", "#2a1f4d"],
  ["#ff6b9d", "#ff8f5a", "#3a1528"],
  ["#34d399", "#22d3ee", "#0f2f2a"],
  ["#fbbf24", "#f97316", "#3a2410"],
  ["#a78bfa", "#60a5fa", "#1e1b4b"],
  ["#fb7185", "#c084fc", "#2e1140"],
  ["#2dd4bf", "#38bdf8", "#0c2740"],
  ["#e879f9", "#818cf8", "#241b4d"],
];

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Letter-free story avatar: stable gradient disc from a seed string. */
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
  const [a, b, deep] = PALETTES[value % PALETTES.length]!;
  const angle = (value % 24) * 15;
  const spotX = 30 + (value % 40);
  const spotY = 25 + ((value >> 3) % 45);

  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`relative block shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: `
          radial-gradient(circle at ${spotX}% ${spotY}%, ${a} 0%, transparent 55%),
          linear-gradient(${angle}deg, ${deep} 0%, ${b} 52%, ${a} 100%)
        `,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    />
  );
}
