import { beforeEach, describe, expect, it } from 'vitest';
import { PRAISE_LINES, randomPraise, __resetPraiseRotation } from './praise';

describe('randomPraise', () => {
    beforeEach(() => {
        __resetPraiseRotation();
    });

    it('returns a line from the pool', () => {
        const line = randomPraise();
        expect(PRAISE_LINES).toContain(line);
    });

    it('never repeats the same line back-to-back', () => {
        let prev = randomPraise();
        for (let i = 0; i < 50; i++) {
            const next = randomPraise();
            expect(next).not.toBe(prev);
            prev = next;
        }
    });
});
