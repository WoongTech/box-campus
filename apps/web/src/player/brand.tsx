import { AlterMarkSvg } from "@/lib/alter-mark";

export function Wordmark() {
  return (
    <span className="inline-flex text-foreground" role="img" aria-label="alter">
      <AlterMarkSvg word={["a", "l", "t", "e", "r"]} height={22} className="block w-auto" />
    </span>
  );
}
