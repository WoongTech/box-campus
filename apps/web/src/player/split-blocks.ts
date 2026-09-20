import type { Block } from "@box-campus/engine";

export function splitBlocks(blocks: Block[]) {
  const caption: Block[] = [];
  const bodies: Block[] = [];
  let verdict: Extract<Block, { kind: "verdict" }> | null = null;

  for (const block of blocks) {
    if (block.kind === "verdict") verdict = block;
    else if (block.kind === "body" || block.kind === "title") bodies.push(block);
    else caption.push(block);
  }

  const title = bodies.find((block) => block.kind === "title") ?? null;
  let hero: Block | null = null;

  if (title) {
    hero = title;
    for (const body of bodies) {
      if (body !== title) caption.push(body);
    }
  } else if (bodies.length > 1 && bodies[0]?.text && bodies[0].text.length < 24) {
    caption.unshift(bodies[0]);
    hero = bodies[1] ?? null;
    for (const body of bodies.slice(2)) caption.push(body);
  } else if (bodies[0]) {
    hero = bodies[0];
    for (const body of bodies.slice(1)) caption.push(body);
  }

  return { hero, verdict, caption };
}
