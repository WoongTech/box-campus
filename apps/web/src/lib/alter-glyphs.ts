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

const LETTER_GAP = 3;

const a: AlterLetter = {
  width: 18.5,
  primitives: [
    { kind: "ring", cx: 9.5, cy: 11, r: 9, inner: 4.5 },
    { kind: "square", x: 14, y: 6, w: 4.5, h: 16 },
  ],
};

const l: AlterLetter = {
  width: 5,
  primitives: [{ kind: "square", x: 0, y: 0, w: 5, h: 22 }],
};

const t: AlterLetter = {
  width: 13,
  primitives: [
    { kind: "square", x: 4, y: 0, w: 5, h: 22 },
    { kind: "square", x: 0, y: 0, w: 13, h: 4.5 },
  ],
};

const e: AlterLetter = {
  width: 12,
  primitives: [
    { kind: "square", x: 0, y: 0, w: 4.5, h: 22 },
    { kind: "square", x: 0, y: 0, w: 12, h: 4 },
    { kind: "square", x: 0, y: 9, w: 8.5, h: 4 },
    { kind: "square", x: 0, y: 18, w: 12, h: 4 },
  ],
};

const r: AlterLetter = {
  width: 11.5,
  primitives: [
    { kind: "square", x: 0, y: 0, w: 4.5, h: 22 },
    { kind: "square", x: 0, y: 0, w: 10, h: 4 },
    { kind: "triangle", x1: 4.5, y1: 11, x2: 11.5, y2: 18, x3: 4.5, y3: 18 },
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

  const height = 22;
  return { placements, width: x, height };
}
