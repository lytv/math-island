import { useEffect } from 'react';
import { Button } from 'animal-island-ui';
import type { MultipleChoiceQuestion } from '@/types/skill';
import { CountableSet } from '@/components/shared/CountableSet';
import { speak } from '@/lib/speech';
import { useProgress } from '@/store/progress';
import { PromptTitle } from './PromptTitle';
import styles from './quiz.module.css';

interface Props {
    question: MultipleChoiceQuestion;
    locked: boolean;
    onAnswer: (value: number) => void;
}

export function MultipleChoiceQ({ question, locked, onAnswer }: Props) {
    const ttsOn = useProgress((s) => s.settings.ttsOn);

    useEffect(() => {
        if (ttsOn) speak(question.prompt);
    }, [question.prompt, ttsOn]);

    return (
        <div className={styles.questionWrap}>
            <PromptTitle text={question.prompt} animate />

            {question.visual?.kind === 'countable' && (
                <CountableSet
                    item={question.visual.item}
                    count={question.visual.count}
                />
            )}

            {question.visual?.kind === 'expression' && (
                <div className={styles.expression}>
                    <span>{question.visual.left}</span>
                    <span className={styles.op}>{question.visual.operator}</span>
                    <span>{question.visual.right}</span>
                    <span className={styles.op}>=</span>
                    <span className={styles.unknown}>?</span>
                </div>
            )}

            <div className={styles.optionsGrid}>
                {question.options.map((opt) => (
                    <Button
                        key={opt}
                        type="primary"
                        size="large"
                        disabled={locked}
                        onClick={() => onAnswer(opt)}
                        className={styles.optionBtn}
                    >
                        {opt}
                    </Button>
                ))}
            </div>
        </div>
    );
}
