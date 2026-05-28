import { useEffect, useMemo, useState } from 'react';
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

/**
 * Scatter `count` items into a grid-snapped layout so each gets a generous,
 * non-overlapping hitbox. Cell minimum 22% of board width/height ensures
 * tiles never crowd each other and the entire cell is a click target.
 */
const scatter = (count: number, seed: number): Pos[] => {
    const rand = seedRandom(seed);
    const positions: Pos[] = [];
    const minDistance = count <= 5 ? 32 : count <= 10 ? 24 : 18;
    let attempts = 0;
    const inset = count <= 5 ? 18 : count <= 10 ? 14 : 10;
    while (positions.length < count && attempts < 400) {
        const x = inset + rand() * (100 - 2 * inset);
        const y = inset + rand() * (100 - 2 * inset);
        const tooClose = positions.some(
            (p) => Math.hypot(p.x - x, p.y - y) < minDistance,
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
    const [pressedIdx, setPressedIdx] = useState<number | null>(null);

    const positions = useMemo(
        () => scatter(question.count, question.count * 31 + question.item.length),
        [question.count, question.item],
    );

    useEffect(() => {
        setCounted(new Set());
        setPressedIdx(null);
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

    // Size hitbox by item count — fewer items = bigger tiles
    const tileSize = question.count <= 5 ? 110 : question.count <= 10 ? 88 : 72;

    return (
        <div className={styles.questionWrap}>
            <h2 className={styles.prompt}>{question.prompt}</h2>

            <div className={styles.tapToCountBoard} aria-label="Tap each item">
                <div className={styles.counter}>
                    {counted.size} / {question.count}
                </div>
                {positions.map((p, i) => {
                    const isCounted = counted.has(i);
                    const isPressed = pressedIdx === i;
                    return (
                        <button
                            key={i}
                            type="button"
                            className={`${styles.tapItem} ${isCounted ? styles.tapItemCounted : ''} ${isPressed ? styles.tapItemPressed : ''}`}
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: tileSize,
                                height: tileSize,
                            }}
                            onPointerDown={() => !isCounted && setPressedIdx(i)}
                            onPointerUp={() => setPressedIdx(null)}
                            onPointerLeave={() => setPressedIdx(null)}
                            onPointerCancel={() => setPressedIdx(null)}
                            onClick={() => handleTap(i)}
                            disabled={locked}
                            aria-label={`${question.item} ${i + 1}${isCounted ? ' (counted)' : ''}`}
                            aria-pressed={isCounted}
                        >
                            <span
                                className={styles.tapItemEmoji}
                                aria-hidden
                                style={{ fontSize: Math.round(tileSize * 0.55) }}
                            >
                                {emoji}
                            </span>
                            {isCounted && (
                                <span className={styles.checkmark} aria-hidden>
                                    ✓
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className={styles.doneRow}>
                <Button
                    type="primary"
                    size="large"
                    disabled={locked || !allTapped}
                    onClick={() => onAnswer(counted.size)}
                >
                    {allTapped
                        ? `That was ${counted.size}!`
                        : `Tap them all (${counted.size}/${question.count})`}
                </Button>
            </div>
        </div>
    );
}
