import type { Block } from "@box-campus/engine";

type ReadableBlock = Extract<Block, { text: string }>;

export type SplitBlocks = {
  hero: ReadableBlock | null;
  verdict: Extract<Block, { kind: "verdict" }> | null;
  images: Extract<Block, { kind: "image" }>[];
  /** Extra lines kept in the reading pane (e.g. reveal, thesis footnotes). */
  reading: ReadableBlock[];
  /** Small metadata for the account strip (eyebrow, source, badge). */
  meta: ReadableBlock[];
};

export function splitBlocks(blocks: Block[]): SplitBlocks {
  const meta: ReadableBlock[] = [];
  const bodies: ReadableBlock[] = [];
  const images: Extract<Block, { kind: "image" }>[] = [];
  let verdict: Extract<Block, { kind: "verdict" }> | null = null;

  for (const block of blocks) {
    if (block.kind === "verdict") verdict = block;
    else if (block.kind === "image") images.push(block);
    else if (block.kind === "body" || block.kind === "title") bodies.push(block);
    else meta.push(block);
  }

  const title = bodies.find((block) => block.kind === "title") ?? null;
  let hero: ReadableBlock | null = null;
  const reading: ReadableBlock[] = [];

  if (title) {
    hero = title;
    for (const body of bodies) {
      if (body !== title) reading.push(body);
    }
  } else if (bodies.length > 1 && bodies[0]?.text && bodies[0].text.length < 24) {
    meta.unshift(bodies[0]);
    hero = bodies[1] ?? null;
    for (const body of bodies.slice(2)) reading.push(body);
  } else if (bodies[0]) {
    hero = bodies[0];
    for (const body of bodies.slice(1)) reading.push(body);
  }

  return { hero, verdict, images, reading, meta };
}
