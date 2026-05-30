/**
 * Spoken encouragement lines played after a correct answer.
 * Pool is small to keep audio assets light and lines memorable.
 */
export const PRAISE_LINES = [
    'Great job!',
    'Way to go!',
    'Awesome!',
    "You're a star!",
    'Fantastic!',
    'Nicely done!',
] as const;

let lastIndex = -1;

/**
 * Pick a random praise line, never the same one twice in a row.
 */
export const randomPraise = (): string => {
    if (PRAISE_LINES.length <= 1) return PRAISE_LINES[0]!;
    let idx = Math.floor(Math.random() * PRAISE_LINES.length);
    if (idx === lastIndex) idx = (idx + 1) % PRAISE_LINES.length;
    lastIndex = idx;
    return PRAISE_LINES[idx]!;
};

/** Test seam — reset rotation state. */
export const __resetPraiseRotation = (): void => {
    lastIndex = -1;
};
