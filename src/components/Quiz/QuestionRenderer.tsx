import type { Question } from '@/types/skill';
import { MultipleChoiceQ } from './MultipleChoiceQ';
import { TapToCountQ } from './TapToCountQ';
import { DragToMatchQ } from './DragToMatchQ';
import { NumberLineQ } from './NumberLineQ';

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
    if (question.type === 'drag-to-match') {
        return (
            <DragToMatchQ
                question={question}
                locked={locked}
                onAnswer={onAnswer}
            />
        );
    }
    if (question.type === 'number-line') {
        return (
            <NumberLineQ
                question={question}
                locked={locked}
                onAnswer={onAnswer}
            />
        );
    }
    return null;
}
