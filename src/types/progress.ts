import type { Question } from '@/types/skill';

export type StarCount = 0 | 1 | 2 | 3;

export interface SkillProgress {
    attempts: number;
    bestAccuracy: number;
    mastered: boolean;
    starsEarned: StarCount;
    lastPlayedAt: number;
}

export interface Settings {
    sfxOn: boolean;
    ttsOn: boolean;
    ttsVoice: string | null;
}

export interface SessionRecord {
    skillId: string;
    accuracy: number;
    stars: StarCount;
    durationMs: number;
    timestamp: number;
}

/**
 * In-flight session checkpoint — persisted so the player can resume mid-quiz
 * after a refresh or navigating away. Cleared on completion or restart.
 */
export interface ActiveSession {
    skillId: string;
    questions: Question[];
    currentIdx: number;
    correctFlags: boolean[];
    /**
     * What the user answered for each completed question (aligned with
     * correctFlags by index). `undefined` when the question type doesn't
     * have a single-number answer (e.g. drag-to-match) or for older
     * persisted sessions migrated from schema v2.
     */
    userAnswers: (number | undefined)[];
    startedAt: number;
    elapsedMs: number;
}
