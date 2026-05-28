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
