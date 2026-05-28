import type { Question } from '@/types/skill';
import { MultipleChoiceQ } from './MultipleChoiceQ';
import { TapToCountQ } from './TapToCountQ';

interface Props {
    question: Question;
    locked: boolean;
    onAnswer: (correct: boolean, given: number) => void;
}

export function QuestionRenderer({ question, locked, onAnswer }: Props) {
    if (question.type === 'multiple-choice') {
        return (
            <MultipleChoiceQ
                question={question}
                locked={locked}
                onAnswer={(value) => onAnswer(value === question.answer, value)}
            />
        );
    }
    if (question.type === 'tap-to-count') {
        return (
            <TapToCountQ
                question={question}
                locked={locked}
                onAnswer={(value) => onAnswer(value === question.count, value)}
            />
        );
    }
    // Phase 2/3 types — show graceful placeholder
    return (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a7b66' }}>
            <p>This question type is coming soon!</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>type: {question.type}</p>
        </div>
    );
}
