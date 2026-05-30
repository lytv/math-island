import styles from './quiz.module.css';

interface Props {
    total: number;
    current: number;
    correct: boolean[];
    onRestart?: () => void;
    canRestart?: boolean;
    /** Called when a previously-answered (correct or wrong) dot is tapped. */
    onDotTap?: (index: number) => void;
    /** When true, all dot taps are ignored (e.g. during feedback animation). */
    dotTapDisabled?: boolean;
}

type DotStatus = 'correct' | 'wrong' | 'current' | 'pending';

export function ProgressBar({
    total,
    current,
    correct,
    onRestart,
    canRestart = true,
    onDotTap,
    dotTapDisabled = false,
}: Props) {
    const showRestart = onRestart !== undefined && current >= 1;
    return (
        <div
            className={styles.progress}
            aria-label={`Question ${current + 1} of ${total}`}
        >
            {Array.from({ length: total }, (_, i) => {
                const status: DotStatus =
                    i < current
                        ? correct[i]
                            ? 'correct'
                            : 'wrong'
                        : i === current
                          ? 'current'
                          : 'pending';
                const tappable =
                    !!onDotTap &&
                    !dotTapDisabled &&
                    (status === 'correct' || status === 'wrong');
                if (tappable) {
                    return (
                        <button
                            key={i}
                            type="button"
                            className={`${styles.progressDot} ${styles[`dot-${status}`]} ${styles.progressDotTappable}`}
                            onClick={() => onDotTap?.(i)}
                            aria-label={
                                status === 'correct'
                                    ? `Question ${i + 1}: see your answer`
                                    : `Question ${i + 1}: try again`
                            }
                            title={
                                status === 'correct'
                                    ? 'See your answer'
                                    : 'Try again'
                            }
                        />
                    );
                }
                return (
                    <span
                        key={i}
                        className={`${styles.progressDot} ${styles[`dot-${status}`]}`}
                        aria-hidden
                    />
                );
            })}
            {showRestart && (
                <button
                    type="button"
                    className={styles.progressRestartBtn}
                    onClick={onRestart}
                    disabled={!canRestart}
                    aria-label="Restart this skill from the beginning"
                    title="Restart from the beginning"
                >
                    🔄
                </button>
            )}
        </div>
    );
}
