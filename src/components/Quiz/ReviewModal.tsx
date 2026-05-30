import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'animal-island-ui';
import type { Question } from '@/types/skill';
import { speak } from '@/lib/speech';
import { playSfx } from '@/lib/audio';
import { useProgress } from '@/store/progress';
import { QuestionRenderer } from './QuestionRenderer';
import { PromptTitle } from './PromptTitle';
import styles from './quiz.module.css';

interface BaseProps {
    question: Question;
    onClose: () => void;
}

interface ReanswerProps extends BaseProps {
    mode: 'reanswer';
    onSolved: (given: number) => void;
}

interface ShowProps extends BaseProps {
    mode: 'show';
    originalAnswer?: number;
}

type Props = ReanswerProps | ShowProps;

export function ReviewModal(props: Props) {
    const { question, onClose } = props;
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        // Always re-announce the prompt when the modal opens.
        speak(question.prompt);
    }, [question.prompt]);

    const handleReanswer = (correct: boolean, given: number) => {
        if (props.mode !== 'reanswer') return;
        if (correct) {
            // Parent will play praise + flip the dot; just hand off.
            props.onSolved(given);
            return;
        }
        // One retry only — short shake feedback, then close.
        if (sfxOn) playSfx('wrong');
        setShake(true);
        window.setTimeout(() => onClose(), 600);
    };

    return (
        <div
            className={styles.modalBackdrop}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <motion.div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 24, scale: 0.92 }}
                animate={
                    shake
                        ? { opacity: 1, y: 0, scale: 1, x: [0, -10, 10, -8, 8, 0] }
                        : { opacity: 1, y: 0, scale: 1 }
                }
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.25 }}
            >
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>
                        {props.mode === 'reanswer' ? 'Try again' : 'Your answer'}
                    </span>
                    <button
                        type="button"
                        className={styles.modalClose}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {props.mode === 'reanswer' ? (
                    <QuestionRenderer
                        question={question}
                        locked={shake}
                        onAnswer={handleReanswer}
                    />
                ) : (
                    <div className={styles.modalShowBody}>
                        <PromptTitle text={question.prompt} />
                        <div className={styles.modalShowAnswer}>
                            <span className={styles.modalShowLabel}>
                                You answered
                            </span>
                            <span className={styles.modalShowValue}>
                                {props.originalAnswer ?? '✓'}
                            </span>
                            <span
                                className={styles.modalShowBadge}
                                aria-label="Correct"
                            >
                                ✓ Correct
                            </span>
                        </div>
                        <div className={styles.modalShowActions}>
                            <Button type="primary" size="large" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
