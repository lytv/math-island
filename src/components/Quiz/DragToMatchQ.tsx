import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Button } from 'animal-island-ui';
import type { DragToMatchQuestion } from '@/types/skill';
import { CountableSet } from '@/components/shared/CountableSet';
import { speak } from '@/lib/speech';
import { playSfx } from '@/lib/audio';
import { useProgress } from '@/store/progress';
import styles from './quiz.module.css';

interface Props {
    question: DragToMatchQuestion;
    locked: boolean;
    onAnswer: (correct: boolean, given: number) => void;
}

/** Mapping numberIndex → targetIndex (-1 if not yet placed) */
type Placements = Record<number, number>;

const expectedPlacement = (q: DragToMatchQuestion): Placements => {
    const out: Placements = {};
    q.pairs.forEach(([numIdx, tgtIdx]) => {
        out[numIdx] = tgtIdx;
    });
    return out;
};

export function DragToMatchQ({ question, locked, onAnswer }: Props) {
    const ttsOn = useProgress((s) => s.settings.ttsOn);
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const expected = useMemo(() => expectedPlacement(question), [question]);
    const [placements, setPlacements] = useState<Placements>({});

    useEffect(() => {
        setPlacements({});
        if (ttsOn) speak(question.prompt);
    }, [question, ttsOn]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 6 } }),
    );

    const placedNumberIndexes = new Set(Object.keys(placements).map(Number));
    const allPlaced = placedNumberIndexes.size === question.numbers.length;

    const handleDragEnd = (e: DragEndEvent) => {
        const numIdx = Number(e.active.id);
        const overId = e.over?.id;
        if (overId === undefined || overId === null) return;
        const tgtIdx = Number(overId);
        if (Number.isNaN(tgtIdx)) return;
        if (sfxOn) playSfx('click');
        setPlacements((prev) => {
            // Remove this number from any prior target first
            const next: Placements = { ...prev };
            next[numIdx] = tgtIdx;
            return next;
        });
    };

    const handleSubmit = () => {
        const correct = question.numbers.every(
            (_, i) => placements[i] === expected[i],
        );
        const givenScore = question.numbers.filter(
            (_, i) => placements[i] === expected[i],
        ).length;
        onAnswer(correct, givenScore);
    };

    return (
        <div className={styles.questionWrap}>
            <h2 className={styles.prompt}>{question.prompt}</h2>

            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToWindowEdges]}
            >
                {/* Drop targets — countable groups */}
                <div className={styles.dropTargets}>
                    {question.targets.map((target, tgtIdx) => {
                        const placedNumberIdx = Object.entries(placements).find(
                            ([, t]) => t === tgtIdx,
                        )?.[0];
                        return (
                            <DropTarget
                                key={tgtIdx}
                                id={tgtIdx}
                                target={target}
                                placedNumber={
                                    placedNumberIdx !== undefined
                                        ? (question.numbers[Number(placedNumberIdx)] ?? null)
                                        : null
                                }
                            />
                        );
                    })}
                </div>

                {/* Draggable number tiles tray */}
                <div className={styles.dragSource}>
                    {question.numbers.map((n, numIdx) => {
                        const placed = placedNumberIndexes.has(numIdx);
                        if (placed) {
                            // Show ghost spot so user knows tile is in use
                            return (
                                <div key={numIdx} className={styles.numTileGhost} aria-hidden>
                                    {n}
                                </div>
                            );
                        }
                        return (
                            <DraggableNumber
                                key={numIdx}
                                id={numIdx}
                                value={n}
                                disabled={locked}
                            />
                        );
                    })}
                </div>
            </DndContext>

            <div className={styles.doneRow}>
                <Button
                    type="primary"
                    size="large"
                    disabled={locked || !allPlaced}
                    onClick={handleSubmit}
                >
                    {allPlaced ? 'Check!' : `Match them all (${placedNumberIndexes.size}/${question.numbers.length})`}
                </Button>
            </div>
        </div>
    );
}

function DraggableNumber({
    id,
    value,
    disabled,
}: {
    id: number;
    value: number;
    disabled: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id, disabled });
    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;
    return (
        <motion.button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            type="button"
            className={`${styles.numTile} ${isDragging ? styles.numTileDragging : ''}`}
            style={style}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            aria-label={`Drag number ${value}`}
        >
            {value}
        </motion.button>
    );
}

function DropTarget({
    id,
    target,
    placedNumber,
}: {
    id: number;
    target: { count: number; item: import('@/types/skill').CountableItem };
    placedNumber: number | null;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`${styles.dropTarget} ${isOver ? styles.dropTargetOver : ''} ${placedNumber !== null ? styles.dropTargetFilled : ''}`}
        >
            <CountableSet item={target.item} count={target.count} size={36} />
            <div className={styles.dropSlot}>
                {placedNumber !== null ? placedNumber : '?'}
            </div>
        </div>
    );
}
