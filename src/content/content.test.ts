import { describe, expect, it } from 'vitest';
import { SKILLS } from './skills';
import countTo10 from './skills/count-to-10.json';
import countTo20 from './skills/count-to-20.json';
import recognize from './skills/recognize-0-20.json';
import compare from './skills/compare-numbers.json';
import addWithin5 from './skills/add-within-5.json';
import addWithin10 from './skills/add-within-10.json';
import subWithin5 from './skills/subtract-within-5.json';
import subWithin10 from './skills/subtract-within-10.json';
import type { SkillContent, Question } from '@/types/skill';

const PHASE_1_2_SKILLS: SkillContent[] = [
    countTo10 as SkillContent,
    countTo20 as SkillContent,
    recognize as SkillContent,
    compare as SkillContent,
    addWithin5 as SkillContent,
    addWithin10 as SkillContent,
    subWithin5 as SkillContent,
    subWithin10 as SkillContent,
];

const validateQuestion = (q: Question, label: string): void => {
    if (q.type === 'multiple-choice') {
        expect(q.options.length, `${label}: options length`).toBeGreaterThanOrEqual(2);
        expect(q.options.length, `${label}: options length`).toBeLessThanOrEqual(4);
        expect(q.options, `${label}: answer in options`).toContain(q.answer);
    } else if (q.type === 'tap-to-count') {
        expect(q.count, `${label}: count positive`).toBeGreaterThan(0);
        expect(q.count, `${label}: count ≤ 20`).toBeLessThanOrEqual(20);
    } else if (q.type === 'drag-to-match') {
        expect(q.numbers.length, `${label}: numbers non-empty`).toBeGreaterThan(0);
        expect(q.targets.length, `${label}: targets non-empty`).toBeGreaterThan(0);
        expect(q.pairs.length, `${label}: pairs == numbers`).toBe(q.numbers.length);
        // Every numberIndex appears in exactly one pair
        const numIdxsUsed = q.pairs.map(([n]) => n).sort((a, b) => a - b);
        const expectedIdxs = Array.from({ length: q.numbers.length }, (_, i) => i);
        expect(numIdxsUsed, `${label}: all numbers paired`).toEqual(expectedIdxs);
        // Every target index used at most once
        const tgtIdxs = q.pairs.map(([, t]) => t);
        expect(new Set(tgtIdxs).size, `${label}: targets unique`).toBe(tgtIdxs.length);
        // Numbers and target counts must agree at each pair
        q.pairs.forEach(([n, t]) => {
            expect(n, `${label}: number index in range`).toBeGreaterThanOrEqual(0);
            expect(n, `${label}: number index in range`).toBeLessThan(q.numbers.length);
            expect(t, `${label}: target index in range`).toBeGreaterThanOrEqual(0);
            expect(t, `${label}: target index in range`).toBeLessThan(q.targets.length);
            const num = q.numbers[n];
            const tgt = q.targets[t];
            expect(num, `${label}: number matches target count`).toBe(tgt?.count);
        });
    } else if (q.type === 'number-line') {
        expect(q.answer, `${label}: answer ≥ min`).toBeGreaterThanOrEqual(q.min);
        expect(q.answer, `${label}: answer ≤ max`).toBeLessThanOrEqual(q.max);
    }
};

describe('skill registry', () => {
    it('has 12 skills', () => {
        expect(SKILLS).toHaveLength(12);
    });

    it('every prereq references a real skill', () => {
        const ids = new Set(SKILLS.map((s) => s.id));
        SKILLS.forEach((s) => {
            s.prereq.forEach((p) => {
                expect(ids.has(p), `${s.id} → unknown prereq ${p}`).toBe(true);
            });
        });
    });

    it('order is unique and 1..12', () => {
        const orders = SKILLS.map((s) => s.order).sort((a, b) => a - b);
        expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('positions are within 0-100 viewport bounds', () => {
        SKILLS.forEach((s) => {
            expect(s.position.x).toBeGreaterThanOrEqual(0);
            expect(s.position.x).toBeLessThanOrEqual(100);
            expect(s.position.y).toBeGreaterThanOrEqual(0);
            expect(s.position.y).toBeLessThanOrEqual(100);
        });
    });
});

describe('Phase 1+2 skill content', () => {
    PHASE_1_2_SKILLS.forEach((skill) => {
        describe(skill.id, () => {
            it('has ≥30 questions', () => {
                expect(skill.questions.length).toBeGreaterThanOrEqual(30);
            });
            it('all questions valid', () => {
                skill.questions.forEach((q, i) => {
                    validateQuestion(q, `${skill.id}#${i}`);
                });
            });
            it('id matches registry', () => {
                expect(SKILLS.find((s) => s.id === skill.id)).toBeDefined();
            });
        });
    });
});
