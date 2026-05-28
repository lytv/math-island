import { describe, expect, it } from 'vitest';
import { findReviewSkill } from './reviewSuggestion';
import { SKILLS } from '@/content/skills';
import type { SkillProgress } from '@/types/progress';

const sp = (overrides: Partial<SkillProgress> = {}): SkillProgress => ({
    attempts: 1,
    bestAccuracy: 1,
    mastered: true,
    starsEarned: 3,
    lastPlayedAt: Date.now(),
    ...overrides,
});

describe('findReviewSkill', () => {
    it('returns null when no skills mastered', () => {
        expect(findReviewSkill(SKILLS, {})).toBeNull();
    });

    it('suggests skill stale > 7 days', () => {
        const now = Date.now();
        const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
        const map = { 'count-to-10': sp({ lastPlayedAt: eightDaysAgo }) };
        const result = findReviewSkill(SKILLS, map, now);
        expect(result?.skillId).toBe('count-to-10');
        expect(result?.reason).toBe('stale');
    });

    it('prefers below-threshold over stale', () => {
        const now = Date.now();
        const map = {
            'count-to-10': sp({ lastPlayedAt: now - 10 * 24 * 60 * 60 * 1000 }),
            'count-to-20': sp({ bestAccuracy: 0.75, lastPlayedAt: now }),
        };
        const result = findReviewSkill(SKILLS, map, now);
        expect(result?.skillId).toBe('count-to-20');
        expect(result?.reason).toBe('below-threshold');
    });

    it('excludes specified skill', () => {
        const now = Date.now();
        const map = {
            'count-to-10': sp({ bestAccuracy: 0.7, lastPlayedAt: now }),
        };
        expect(findReviewSkill(SKILLS, map, now, 'count-to-10')).toBeNull();
    });

    it('ignores non-mastered skills', () => {
        const now = Date.now();
        const map = {
            'count-to-10': sp({
                mastered: false,
                bestAccuracy: 0.5,
                lastPlayedAt: now - 30 * 24 * 60 * 60 * 1000,
            }),
        };
        expect(findReviewSkill(SKILLS, map, now)).toBeNull();
    });

    it('returns null when all mastered + recent + above threshold', () => {
        const now = Date.now();
        const map = {
            'count-to-10': sp({ bestAccuracy: 0.9, lastPlayedAt: now }),
        };
        expect(findReviewSkill(SKILLS, map, now)).toBeNull();
    });
});
