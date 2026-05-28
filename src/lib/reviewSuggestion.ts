import type { SkillProgress } from '@/types/progress';
import type { SkillMeta } from '@/types/skill';

const STALE_DAYS = 7;
const REVIEW_THRESHOLD = 0.8;

export interface ReviewSuggestion {
    skillId: string;
    reason: 'stale' | 'below-threshold';
    skill: SkillMeta;
}

const dayMs = 24 * 60 * 60 * 1000;

export const findReviewSkill = (
    skills: SkillMeta[],
    progressMap: Record<string, SkillProgress>,
    now: number = Date.now(),
    excludeSkillId?: string,
): ReviewSuggestion | null => {
    let stale: ReviewSuggestion | null = null;
    let below: ReviewSuggestion | null = null;

    for (const skill of skills) {
        if (skill.id === excludeSkillId) continue;
        const p = progressMap[skill.id];
        if (!p || !p.mastered) continue;
        if (p.bestAccuracy < REVIEW_THRESHOLD) {
            below ??= { skillId: skill.id, reason: 'below-threshold', skill };
        }
        const daysAgo = (now - p.lastPlayedAt) / dayMs;
        if (daysAgo > STALE_DAYS) {
            stale ??= { skillId: skill.id, reason: 'stale', skill };
        }
    }

    // Prefer below-threshold over stale (more important to fix gaps)
    return below ?? stale;
};
