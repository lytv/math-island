import { describe, expect, it } from 'vitest';
import { calculateStars, accuracyFromCounts } from './starsCalculator';
import { buildSession } from './questionGenerator';
import type { Question } from '@/types/skill';

describe('starsCalculator', () => {
    it('3 stars for ≥90% accuracy under 60s', () => {
        expect(calculateStars({ correct: 9, total: 10, durationMs: 30_000 })).toBe(3);
    });
    it('2 stars when fast but lower accuracy', () => {
        expect(calculateStars({ correct: 8, total: 10, durationMs: 30_000 })).toBe(2);
    });
    it('2 stars when accurate but slow', () => {
        expect(calculateStars({ correct: 10, total: 10, durationMs: 70_000 })).toBe(2);
    });
    it('1 star for 50-74%', () => {
        expect(calculateStars({ correct: 6, total: 10, durationMs: 30_000 })).toBe(1);
    });
    it('0 stars below 50%', () => {
        expect(calculateStars({ correct: 4, total: 10, durationMs: 30_000 })).toBe(0);
    });
    it('0 stars when total is 0', () => {
        expect(calculateStars({ correct: 0, total: 0, durationMs: 0 })).toBe(0);
    });
    it('accuracyFromCounts is safe with zero total', () => {
        expect(accuracyFromCounts(0, 0)).toBe(0);
    });
});

describe('questionGenerator.buildSession', () => {
    const sample: Question[] = Array.from({ length: 30 }, (_, i) => ({
        type: 'multiple-choice',
        prompt: `Q${i}`,
        options: [1, 2, 3, 4],
        answer: 1,
    }));

    it('returns exactly `size` questions when pool is larger', () => {
        expect(buildSession(sample, 10)).toHaveLength(10);
    });
    it('returns all questions when pool is smaller than size', () => {
        const small = sample.slice(0, 5);
        expect(buildSession(small, 10)).toHaveLength(5);
    });
    it('returns empty when pool is empty', () => {
        expect(buildSession([], 10)).toEqual([]);
    });
    it('shuffles (extremely unlikely to be identical order on 30 items)', () => {
        const a = buildSession(sample, 30).map((q) => q.prompt);
        const b = buildSession(sample, 30).map((q) => q.prompt);
        expect(a).not.toEqual(b);
    });
});
