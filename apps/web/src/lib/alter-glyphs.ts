export const ALTER_STROKE = 6;

export type AlterGlyph = {
  width: number;
  d: string;
  dots?: ReadonlyArray<readonly [number, number]>;
};

const a: AlterGlyph = {
  width: 27,
  d: "M15 16 A10 10 0 1 0 15 36 M24 14 V38",
};

const l: AlterGlyph = {
  width: 6,
  d: "M3 3 V38",
};

const t: AlterGlyph = {
  width: 26,
  d: "M12 3 V38 M2 14 H5 M19 14 H24",
};

const e: AlterGlyph = {
  width: 20,
  d: "M15 16.5 A10 10 0 1 0 15 35.5",
  dots: [[9, 26]],
};

const r: AlterGlyph = {
  width: 20,
  d: "M3 16 V38 M10 17.5 A7 7 0 0 1 16.5 25",
};

const letters = { a, l, t, e, r } as const;

export type AlterWord = readonly (keyof typeof letters)[];

const TRACK = 4;
export const ALTER_HEIGHT = 42;

export function alterGlyphs(word: AlterWord) {
  const glyphs: { x: number; glyph: AlterGlyph }[] = [];
  let x = 0;

  for (let index = 0; index < word.length; index += 1) {
    const glyph = letters[word[index]];
    glyphs.push({ x, glyph });
    x += glyph.width + (index < word.length - 1 ? TRACK : 0);
  }

  return { glyphs, width: x, height: ALTER_HEIGHT };
}
