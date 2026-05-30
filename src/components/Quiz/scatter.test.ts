import { describe, expect, it } from 'vitest';
import { scatter } from './scatter';

describe('scatter', () => {
    it('returns exactly `count` positions for every count 1..20', () => {
        for (let c = 1; c <= 20; c++) {
            const out = scatter(c, c * 31 + 5);
            expect(out).toHaveLength(c);
        }
    });

    it('keeps every position inside the board (0..100 on both axes)', () => {
        for (let c = 1; c <= 20; c++) {
            for (const { x, y } of scatter(c, c * 17)) {
                expect(x).toBeGreaterThanOrEqual(0);
                expect(x).toBeLessThanOrEqual(100);
                expect(y).toBeGreaterThanOrEqual(0);
                expect(y).toBeLessThanOrEqual(100);
            }
        }
    });

    it('is deterministic for the same seed', () => {
        const a = scatter(10, 123);
        const b = scatter(10, 123);
        expect(a).toEqual(b);
    });

    it('produces non-overlapping positions for count=10 (the cloud bug)', () => {
        const out = scatter(10, 10 * 31 + 5);
        // Minimum pairwise distance should clearly exceed the 22% cell jitter
        let minDist = Infinity;
        for (let i = 0; i < out.length; i++) {
            for (let j = i + 1; j < out.length; j++) {
                const dx = out[i]!.x - out[j]!.x;
                const dy = out[i]!.y - out[j]!.y;
                minDist = Math.min(minDist, Math.hypot(dx, dy));
            }
        }
        // 4x3 grid → cell ~20% × ~25%; min center distance must be > 10
        expect(minDist).toBeGreaterThan(10);
    });
});
