import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    ActiveSession,
    SkillProgress,
    Settings,
    StarCount,
} from '@/types/progress';
import { SKILLS } from '@/content/skills';

const SCHEMA_VERSION = 3;
const MASTERY_THRESHOLD = 0.8;
const XP_PER_CORRECT = 10;
const XP_PER_STAR = 25;

interface ProgressState {
    schemaVersion: number;
    xp: number;
    streak: number;
    lastStreakDate: string | null;
    skills: Record<string, SkillProgress>;
    activeSessions: Record<string, ActiveSession>;
    settings: Settings;

    recordSession: (
        skillId: string,
        accuracy: number,
        stars: StarCount,
        correctCount: number,
    ) => { streakIncremented: boolean; newStreak: number };
    isUnlocked: (skillId: string) => boolean;
    saveActiveSession: (session: ActiveSession) => void;
    clearActiveSession: (skillId: string) => void;
    setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    resetAll: () => void;
}

const todayIso = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const isYesterday = (iso: string | null): boolean => {
    if (!iso) return false;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return (
        iso ===
        `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(
            y.getDate(),
        ).padStart(2, '0')}`
    );
};

const defaultSettings: Settings = {
    sfxOn: true,
    ttsOn: true,
    ttsVoice: null,
};

const blankSkill = (): SkillProgress => ({
    attempts: 0,
    bestAccuracy: 0,
    mastered: false,
    starsEarned: 0,
    lastPlayedAt: 0,
});

export const useProgress = create<ProgressState>()(
    persist(
        (set, get) => ({
            schemaVersion: SCHEMA_VERSION,
            xp: 0,
            streak: 0,
            lastStreakDate: null,
            skills: {},
            activeSessions: {},
            settings: defaultSettings,

            recordSession: (skillId, accuracy, stars, correctCount) => {
                const state = get();
                const prev = state.skills[skillId] ?? blankSkill();
                const next: SkillProgress = {
                    attempts: prev.attempts + 1,
                    bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
                    mastered: prev.mastered || accuracy >= MASTERY_THRESHOLD,
                    starsEarned: Math.max(prev.starsEarned, stars) as StarCount,
                    lastPlayedAt: Date.now(),
                };

                const today = todayIso();
                let streak = state.streak;
                let streakIncremented = false;
                if (state.lastStreakDate !== today) {
                    streak = isYesterday(state.lastStreakDate) ? streak + 1 : 1;
                    streakIncremented = true;
                }

                const xpDelta =
                    correctCount * XP_PER_CORRECT + stars * XP_PER_STAR;

                const { [skillId]: _drop, ...remainingSessions } =
                    state.activeSessions;
                void _drop;

                set({
                    skills: { ...state.skills, [skillId]: next },
                    xp: state.xp + xpDelta,
                    streak,
                    lastStreakDate: today,
                    activeSessions: remainingSessions,
                });

                return { streakIncremented, newStreak: streak };
            },

            saveActiveSession: (session) => {
                set((state) => ({
                    activeSessions: {
                        ...state.activeSessions,
                        [session.skillId]: session,
                    },
                }));
            },

            clearActiveSession: (skillId) => {
                set((state) => {
                    const { [skillId]: _drop, ...rest } = state.activeSessions;
                    void _drop;
                    return { activeSessions: rest };
                });
            },

            isUnlocked: (skillId) => {
                const skill = SKILLS.find((s) => s.id === skillId);
                if (!skill) return false;
                if (skill.prereq.length === 0) return true;
                const skills = get().skills;
                return skill.prereq.every((p) => skills[p]?.mastered === true);
            },

            setSetting: (key, value) => {
                set((state) => ({
                    settings: { ...state.settings, [key]: value },
                }));
            },

            resetAll: () => {
                set({
                    xp: 0,
                    streak: 0,
                    lastStreakDate: null,
                    skills: {},
                    activeSessions: {},
                    settings: defaultSettings,
                });
            },
        }),
        {
            name: 'math-island-progress',
            version: SCHEMA_VERSION,
            migrate: (persisted, _version) => {
                const p = (persisted ?? {}) as Partial<ProgressState>;
                if (!p.activeSessions) p.activeSessions = {};
                // v2 → v3: backfill userAnswers on any saved sessions
                for (const key of Object.keys(p.activeSessions)) {
                    const s = p.activeSessions[key];
                    if (s && !Array.isArray(s.userAnswers)) {
                        s.userAnswers = s.correctFlags.map(() => undefined);
                    }
                }
                return p as ProgressState;
            },
        },
    ),
);
