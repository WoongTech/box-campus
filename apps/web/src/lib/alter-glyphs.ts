export type AlterSquare = { kind: "square"; x: number; y: number; w: number; h: number };
export type AlterRing = { kind: "ring"; cx: number; cy: number; r: number; inner: number };
export type AlterTriangle = {
  kind: "triangle";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
};

export type AlterPrimitive = AlterSquare | AlterRing | AlterTriangle;

export type AlterLetter = {
  width: number;
  primitives: AlterPrimitive[];
};

const LETTER_GAP = 1.8;
const TOP = 4.2;
const BASE = 15.2;
const W = 1.65;

const a: AlterLetter = {
  width: 10.6,
  primitives: [
    { kind: "ring", cx: 5.3, cy: 9.7, r: 5.3, inner: 3.65 },
    { kind: "square", x: 8.95, y: TOP, w: W, h: BASE - TOP },
  ],
};

const l: AlterLetter = {
  width: W,
  primitives: [{ kind: "square", x: 0, y: 0, w: W, h: BASE }],
};

const t: AlterLetter = {
  width: 8.2,
  primitives: [
    { kind: "square", x: 3.25, y: 0, w: W, h: BASE },
    { kind: "square", x: 0, y: TOP, w: 8.2, h: W },
  ],
};

const e: AlterLetter = {
  width: 8.2,
  primitives: [
    { kind: "square", x: 0, y: TOP, w: W, h: BASE - TOP },
    { kind: "square", x: 0, y: TOP, w: 8.2, h: W },
    { kind: "square", x: 0, y: 8.88, w: 5.6, h: W },
    { kind: "square", x: 0, y: BASE - W, w: 8.2, h: W },
  ],
};

const r: AlterLetter = {
  width: 5.2,
  primitives: [
    { kind: "square", x: 0, y: TOP, w: W, h: BASE - TOP },
    { kind: "square", x: 0, y: TOP, w: 5.2, h: W },
    { kind: "triangle", x1: W, y1: TOP + W, x2: W, y2: TOP + W + 3.4, x3: W + 3.4, y3: TOP + W + 3.4 },
  ],
};

const letters: Record<"a" | "l" | "t" | "e" | "r", AlterLetter> = { a, l, t, e, r };

export type AlterWord = readonly ("a" | "l" | "t" | "e" | "r")[];

export function alterPlacements(word: AlterWord) {
  const placements: { x: number; primitive: AlterPrimitive }[] = [];
  let x = 0;

  for (let index = 0; index < word.length; index += 1) {
    const letter = letters[word[index]];
    for (const primitive of letter.primitives) {
      placements.push({ x, primitive });
    }
    x += letter.width + (index < word.length - 1 ? LETTER_GAP : 0);
  }

  return { placements, width: x, height: BASE };
}
