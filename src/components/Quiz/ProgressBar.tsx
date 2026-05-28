import styles from './quiz.module.css';

interface Props {
    total: number;
    current: number;
    correct: boolean[];
}

export function ProgressBar({ total, current, correct }: Props) {
    return (
        <div className={styles.progress} aria-label={`Question ${current + 1} of ${total}`}>
            {Array.from({ length: total }, (_, i) => {
                const status =
                    i < current ? (correct[i] ? 'correct' : 'wrong') :
                    i === current ? 'current' : 'pending';
                return (
                    <span
                        key={i}
                        className={`${styles.progressDot} ${styles[`dot-${status}`]}`}
                        aria-hidden
                    />
                );
            })}
        </div>
    );
}
