import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'animal-island-ui';
import type { NumberLineQuestion } from '@/types/skill';
import { speak } from '@/lib/speech';
import { useProgress } from '@/store/progress';
import { PromptTitle } from './PromptTitle';
import styles from './quiz.module.css';

interface Props {
    question: NumberLineQuestion;
    locked: boolean;
    onAnswer: (correct: boolean, given: number) => void;
}

const TRACK_HEIGHT = 96;
const THUMB_SIZE = 56;
const LINE_PADDING = 24; // px padding inside the SVG so ticks at min/max fit

export function NumberLineQ({ question, locked, onAnswer }: Props) {
    const ttsOn = useProgress((s) => s.settings.ttsOn);
    const { min, max, step, answer } = question;
    const ticks = Math.round((max - min) / step) + 1;
    const startValue = Math.round((min + max) / 2 / step) * step;
    const [value, setValue] = useState<number>(startValue);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);

    useEffect(() => {
        setValue(startValue);
        if (ttsOn) speak(question.prompt);
    }, [question, startValue, ttsOn]);

    const valueToPercent = (v: number): number =>
        ((v - min) / (max - min)) * 100;

    const pointToValue = (clientX: number): number => {
        const track = trackRef.current;
        if (!track) return value;
        const rect = track.getBoundingClientRect();
        const usableWidth = rect.width - LINE_PADDING * 2;
        const x = Math.max(0, Math.min(clientX - rect.left - LINE_PADDING, usableWidth));
        const ratio = usableWidth === 0 ? 0 : x / usableWidth;
        const raw = min + ratio * (max - min);
        const snapped = Math.round((raw - min) / step) * step + min;
        return Math.max(min, Math.min(max, snapped));
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (locked) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        draggingRef.current = true;
        setValue(pointToValue(e.clientX));
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingRef.current || locked) return;
        setValue(pointToValue(e.clientX));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        try {
            (e.target as Element).releasePointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
    };

    const handleTickTap = (v: number) => {
        if (locked) return;
        setValue(v);
    };

    return (
        <div className={styles.questionWrap}>
            <PromptTitle text={question.prompt} />

            <div className={styles.numberLineWrap}>
                <div
                    ref={trackRef}
                    className={styles.numberLineTrack}
                    style={{ height: TRACK_HEIGHT, touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    role="slider"
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    aria-label="Number line slider"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (locked) return;
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                            setValue((v) => Math.max(min, v - step));
                            e.preventDefault();
                        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                            setValue((v) => Math.min(max, v + step));
                            e.preventDefault();
                        }
                    }}
                >
                    {/* the rail */}
                    <div
                        className={styles.numberLineRail}
                        style={{ left: LINE_PADDING, right: LINE_PADDING }}
                    />
                    {/* ticks + labels */}
                    {Array.from({ length: ticks }, (_, i) => {
                        const tickValue = min + i * step;
                        const left = `calc(${LINE_PADDING}px + (100% - ${LINE_PADDING * 2}px) * ${valueToPercent(tickValue) / 100})`;
                        const isMajor = tickValue % (step * 5) === 0 || i === 0 || i === ticks - 1;
                        return (
                            <button
                                key={tickValue}
                                type="button"
                                onClick={() => handleTickTap(tickValue)}
                                className={`${styles.numberLineTick} ${isMajor ? styles.tickMajor : ''}`}
                                style={{ left }}
                                aria-label={`Set value to ${tickValue}`}
                                tabIndex={-1}
                            >
                                <span className={styles.tickMark} aria-hidden />
                                {isMajor && (
                                    <span className={styles.tickLabel} aria-hidden>
                                        {tickValue}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    {/* thumb */}
                    <motion.div
                        className={styles.numberLineThumb}
                        animate={{
                            left: `calc(${LINE_PADDING}px + (100% - ${LINE_PADDING * 2}px) * ${valueToPercent(value) / 100} - ${THUMB_SIZE / 2}px)`,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                        aria-hidden
                    >
                        <span className={styles.thumbValue}>{value}</span>
                    </motion.div>
                </div>
            </div>

            <div className={styles.doneRow}>
                <Button
                    type="primary"
                    size="large"
                    disabled={locked}
                    onClick={() => onAnswer(value === answer, value)}
                >
                    Check {value}!
                </Button>
            </div>
        </div>
    );
}
