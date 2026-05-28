import type { StarCount } from '@/types/progress';

export interface StarInputs {
    correct: number;
    total: number;
    durationMs: number;
}

const FAST_THRESHOLD_MS = 60_000;

export const calculateStars = ({
    correct,
    total,
    durationMs,
}: StarInputs): StarCount => {
    if (total <= 0) return 0;
    const accuracy = correct / total;
    if (accuracy >= 0.9 && durationMs < FAST_THRESHOLD_MS) return 3;
    if (accuracy >= 0.75) return 2;
    if (accuracy >= 0.5) return 1;
    return 0;
};

export const accuracyFromCounts = (correct: number, total: number): number =>
    total > 0 ? correct / total : 0;
