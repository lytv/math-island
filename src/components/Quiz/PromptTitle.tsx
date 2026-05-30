import { motion } from 'framer-motion';
import { speak } from '@/lib/speech';
import styles from './quiz.module.css';

interface Props {
    text: string;
    animate?: boolean;
}

/**
 * Tappable question prompt. Clicking re-plays the prompt audio
 * regardless of the ttsOn setting (explicit user action).
 */
export function PromptTitle({ text, animate = false }: Props) {
    const handleClick = () => speak(text);

    const inner = (
        <>
            <span className={styles.promptText}>{text}</span>
            <span className={styles.promptReplayIcon} aria-hidden>
                🔊
            </span>
        </>
    );

    if (animate) {
        return (
            <motion.button
                type="button"
                className={styles.prompt}
                onClick={handleClick}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                aria-label={`Tap to replay: ${text}`}
            >
                {inner}
            </motion.button>
        );
    }

    return (
        <button
            type="button"
            className={styles.prompt}
            onClick={handleClick}
            aria-label={`Tap to replay: ${text}`}
        >
            {inner}
        </button>
    );
}
