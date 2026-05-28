import { beforeEach, describe, expect, it } from 'vitest';
import { useProgress } from './progress';

describe('progress store', () => {
    beforeEach(() => {
        useProgress.getState().resetAll();
    });

    it('starts with first skill unlocked and others locked', () => {
        const { isUnlocked } = useProgress.getState();
        expect(isUnlocked('count-to-10')).toBe(true);
        expect(isUnlocked('count-to-20')).toBe(false);
    });

    it('unlocks next skill after mastering prereq', () => {
        useProgress.getState().recordSession('count-to-10', 0.9, 3, 9);
        expect(useProgress.getState().isUnlocked('count-to-20')).toBe(true);
    });

    it('does NOT unlock if accuracy below threshold', () => {
        useProgress.getState().recordSession('count-to-10', 0.7, 2, 7);
        expect(useProgress.getState().isUnlocked('count-to-20')).toBe(false);
    });

    it('accumulates XP correctly', () => {
        useProgress.getState().recordSession('count-to-10', 1.0, 3, 10);
        // 10 correct * 10 + 3 stars * 25 = 175
        expect(useProgress.getState().xp).toBe(175);
    });

    it('records best accuracy across attempts', () => {
        useProgress.getState().recordSession('count-to-10', 0.6, 1, 6);
        useProgress.getState().recordSession('count-to-10', 0.9, 3, 9);
        useProgress.getState().recordSession('count-to-10', 0.5, 1, 5);
        const skill = useProgress.getState().skills['count-to-10'];
        expect(skill?.bestAccuracy).toBe(0.9);
        expect(skill?.starsEarned).toBe(3);
        expect(skill?.attempts).toBe(3);
    });

    it('streak starts at 1 after first session', () => {
        useProgress.getState().recordSession('count-to-10', 0.9, 3, 9);
        expect(useProgress.getState().streak).toBe(1);
    });

    it('does not double-count streak on same-day sessions', () => {
        useProgress.getState().recordSession('count-to-10', 0.9, 3, 9);
        useProgress.getState().recordSession('count-to-10', 0.9, 3, 9);
        expect(useProgress.getState().streak).toBe(1);
    });

    it('resetAll clears state', () => {
        useProgress.getState().recordSession('count-to-10', 0.9, 3, 9);
        useProgress.getState().resetAll();
        const state = useProgress.getState();
        expect(state.xp).toBe(0);
        expect(state.skills).toEqual({});
        expect(state.streak).toBe(0);
    });
});
