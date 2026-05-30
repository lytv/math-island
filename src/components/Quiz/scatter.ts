export interface Pos {
    x: number;
    y: number;
}

const seedRandom = (seed: number) => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

/**
 * Deterministic jittered-grid scatter — always returns exactly `count`
 * positions. Picks a cols×rows grid that fits the count, then places one
 * item per cell with a small random offset. Cells are sized in % of board
 * (4:3 aspect) so tiles never overlap regardless of count.
 */
export const scatter = (count: number, seed: number): Pos[] => {
    const rand = seedRandom(seed);
    let cols = Math.ceil(Math.sqrt(count * (4 / 3)));
    let rows = Math.ceil(count / cols);
    while (cols * rows < count) cols++;

    const insetX = count <= 5 ? 14 : count <= 10 ? 10 : 8;
    const insetY = count <= 5 ? 16 : count <= 10 ? 12 : 10;
    const cellW = (100 - 2 * insetX) / cols;
    const cellH = (100 - 2 * insetY) / rows;
    const jitterX = cellW * 0.22;
    const jitterY = cellH * 0.22;

    const cellIndices = Array.from({ length: cols * rows }, (_, i) => i);
    for (let i = cellIndices.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = cellIndices[i]!;
        cellIndices[i] = cellIndices[j]!;
        cellIndices[j] = tmp;
    }

    const positions: Pos[] = [];
    for (let n = 0; n < count; n++) {
        const idx = cellIndices[n]!;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = insetX + cellW * (col + 0.5);
        const cy = insetY + cellH * (row + 0.5);
        const x = cx + (rand() * 2 - 1) * jitterX;
        const y = cy + (rand() * 2 - 1) * jitterY;
        positions.push({ x, y });
    }
    return positions;
};
