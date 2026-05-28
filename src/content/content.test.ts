import { describe, expect, it } from 'vitest';
import { SKILLS } from './skills';
import countTo10 from './skills/count-to-10.json';
import countTo20 from './skills/count-to-20.json';
import recognize from './skills/recognize-0-20.json';
import compare from './skills/compare-numbers.json';
import addWithin5 from './skills/add-within-5.json';
import type { SkillContent, Question } from '@/types/skill';

const PHASE_1_SKILLS: SkillContent[] = [
    countTo10 as SkillContent,
    countTo20 as SkillContent,
    recognize as SkillContent,
    compare as SkillContent,
    addWithin5 as SkillContent,
];

const validateQuestion = (q: Question, label: string): void => {
    if (q.type === 'multiple-choice') {
        expect(q.options.length, `${label}: options length`).toBeGreaterThanOrEqual(2);
        expect(q.options.length, `${label}: options length`).toBeLessThanOrEqual(4);
        expect(q.options, `${label}: answer in options`).toContain(q.answer);
    } else if (q.type === 'tap-to-count') {
        expect(q.count, `${label}: count positive`).toBeGreaterThan(0);
        expect(q.count, `${label}: count ≤ 20`).toBeLessThanOrEqual(20);
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

describe('Phase 1 skill content', () => {
    PHASE_1_SKILLS.forEach((skill) => {
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
