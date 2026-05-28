import { AnimatePresence, motion } from 'framer-motion';
import styles from './quiz.module.css';

export type FeedbackKind = 'correct' | 'wrong' | null;

interface Props {
    feedback: FeedbackKind;
    correctAnswer?: number | string;
}

export function FeedbackOverlay({ feedback, correctAnswer }: Props) {
    return (
        <AnimatePresence>
            {feedback && (
                <motion.div
                    className={`${styles.feedback} ${styles[`feedback-${feedback}`]}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: feedback === 'wrong' ? [0, -8, 8, -6, 6, 0] : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4 }}
                    role="status"
                    aria-live="polite"
                >
                    <span className={styles.feedbackIcon}>
                        {feedback === 'correct' ? '✓' : '✗'}
                    </span>
                    {feedback === 'wrong' && correctAnswer !== undefined && (
                        <span className={styles.correctAnswer}>
                            Answer: <strong>{correctAnswer}</strong>
                        </span>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
