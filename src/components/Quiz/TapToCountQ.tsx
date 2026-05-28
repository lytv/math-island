import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'animal-island-ui';
import type { TapToCountQuestion } from '@/types/skill';
import { ITEM_EMOJI } from '@/components/shared/CountableSet';
import { speak } from '@/lib/speech';
import { useProgress } from '@/store/progress';
import { playSfx } from '@/lib/audio';
import styles from './quiz.module.css';

interface Props {
    question: TapToCountQuestion;
    locked: boolean;
    onAnswer: (count: number) => void;
}

interface Pos {
    x: number;
    y: number;
}

const seedRandom = (seed: number) => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

const scatter = (count: number, seed: number): Pos[] => {
    const rand = seedRandom(seed);
    const positions: Pos[] = [];
    let attempts = 0;
    while (positions.length < count && attempts < 200) {
        const x = 10 + rand() * 80;
        const y = 10 + rand() * 80;
        const tooClose = positions.some(
            (p) => Math.hypot(p.x - x, p.y - y) < 18,
        );
        if (!tooClose) positions.push({ x, y });
        attempts++;
    }
    return positions;
};

export function TapToCountQ({ question, locked, onAnswer }: Props) {
    const ttsOn = useProgress((s) => s.settings.ttsOn);
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const [counted, setCounted] = useState<Set<number>>(new Set());

    const positions = useMemo(
        () => scatter(question.count, question.count * 31 + question.item.length),
        [question.count, question.item],
    );

    useEffect(() => {
        setCounted(new Set());
        if (ttsOn) speak(question.prompt);
    }, [question.prompt, question.count, question.item, ttsOn]);

    const handleTap = (idx: number) => {
        if (locked) return;
        if (counted.has(idx)) return;
        if (sfxOn) playSfx('click');
        setCounted((prev) => new Set(prev).add(idx));
    };

    const allTapped = counted.size === question.count;
    const emoji = ITEM_EMOJI[question.item];

    return (
        <div className={styles.questionWrap}>
            <h2 className={styles.prompt}>{question.prompt}</h2>

            <div className={styles.tapToCountBoard} aria-label="Tap each item">
                <div className={styles.counter}>
                    {counted.size} / {question.count}
                </div>
                {positions.map((p, i) => (
                    <motion.button
                        key={i}
                        type="button"
                        className={styles.tapItem}
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            opacity: counted.has(i) ? 0.4 : 1,
                        }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleTap(i)}
                        disabled={locked || counted.has(i)}
                        aria-label={`${question.item} ${i + 1}${counted.has(i) ? ' (counted)' : ''}`}
                    >
                        <span aria-hidden style={{ fontSize: 44 }}>
                            {emoji}
                        </span>
                        {counted.has(i) && (
                            <span className={styles.checkmark} aria-hidden>
                                ✓
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            <div className={styles.doneRow}>
                <Button
                    type="primary"
                    size="large"
                    disabled={locked || !allTapped}
                    onClick={() => onAnswer(counted.size)}
                >
                    {allTapped ? `That was ${counted.size}!` : `Tap them all (${counted.size}/${question.count})`}
                </Button>
            </div>
        </div>
    );
}
