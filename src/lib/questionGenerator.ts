import type { Question } from '@/types/skill';

const SESSION_SIZE = 10;

const shuffle = <T>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const ai = a[i] as T;
        const aj = a[j] as T;
        a[i] = aj;
        a[j] = ai;
    }
    return a;
};

export const buildSession = (
    pool: readonly Question[],
    size: number = SESSION_SIZE,
): Question[] => {
    if (pool.length === 0) return [];
    if (pool.length <= size) return shuffle(pool);
    return shuffle(pool).slice(0, size);
};
