import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { skillById } from '@/content/skills';
import { buildSession } from '@/lib/questionGenerator';
import { calculateStars } from '@/lib/starsCalculator';
import { playSfx } from '@/lib/audio';
import { useProgress } from '@/store/progress';
import type { Question, SkillContent } from '@/types/skill';
import type { StarCount } from '@/types/progress';
import { QuestionRenderer } from '@/components/Quiz/QuestionRenderer';
import { ProgressBar } from '@/components/Quiz/ProgressBar';
import {
    FeedbackOverlay,
    type FeedbackKind,
} from '@/components/Quiz/FeedbackOverlay';

const SESSION_SIZE = 10;
const FEEDBACK_MS = 900;

type LoadState =
    | { kind: 'loading' }
    | { kind: 'ready'; questions: Question[] }
    | { kind: 'error'; message: string };

export function SkillSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const recordSession = useProgress((s) => s.recordSession);
    const isUnlocked = useProgress((s) => s.isUnlocked);

    const skill = id ? skillById(id) : undefined;
    const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
    const [feedback, setFeedback] = useState<FeedbackKind>(null);
    const [lastCorrectAnswer, setLastCorrectAnswer] = useState<number | undefined>();
    const startedAt = useRef<number>(Date.now());

    useEffect(() => {
        if (!skill) return;
        if (!isUnlocked(skill.id)) {
            setLoad({ kind: 'error', message: 'This skill is locked.' });
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const mod = (await import(
                    /* @vite-ignore */ `@/content/skills/${skill.id}.json`
                )) as { default: SkillContent };
                if (cancelled) return;
                const pool = mod.default.questions;
                const session = buildSession(pool, SESSION_SIZE);
                setLoad({ kind: 'ready', questions: session });
                setCurrentIdx(0);
                setCorrectFlags([]);
                startedAt.current = Date.now();
            } catch (err) {
                if (cancelled) return;
                setLoad({
                    kind: 'error',
                    message: `No content yet for "${skill.name}". Try another skill!`,
                });
                console.error('Skill content load failed:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [skill, isUnlocked]);

    const finishSession = useCallback(
        (finalFlags: boolean[]) => {
            if (!skill) return;
            const correctCount = finalFlags.filter(Boolean).length;
            const total = finalFlags.length;
            const accuracy = total > 0 ? correctCount / total : 0;
            const durationMs = Date.now() - startedAt.current;
            const stars: StarCount = calculateStars({
                correct: correctCount,
                total,
                durationMs,
            });
            const wasUnlockedBefore = (id: string) => isUnlocked(id);
            recordSession(skill.id, accuracy, stars, correctCount);
            if (sfxOn && stars >= 2) playSfx('celebrate');
            navigate('/result', {
                state: {
                    skillId: skill.id,
                    skillName: skill.name,
                    accuracy,
                    correctCount,
                    total,
                    stars,
                    durationMs,
                    /* Snapshot of unlocks BEFORE this session — Result computes new unlocks */
                    prevUnlocks: ['__sentinel__'].concat(
                        // Will be overwritten in result page; we just persist skillId here
                        wasUnlockedBefore(skill.id) ? [] : [],
                    ),
                },
            });
        },
        [skill, recordSession, sfxOn, navigate, isUnlocked],
    );

    const handleAnswer = useCallback(
        (correct: boolean) => {
            if (load.kind !== 'ready') return;
            if (feedback) return; // ignore double-tap during animation
            if (sfxOn) playSfx(correct ? 'correct' : 'wrong');
            const question = load.questions[currentIdx];
            const expected =
                question?.type === 'multiple-choice'
                    ? question.answer
                    : question?.type === 'tap-to-count'
                      ? question.count
                      : undefined;
            setLastCorrectAnswer(expected);
            setFeedback(correct ? 'correct' : 'wrong');
            const nextFlags = [...correctFlags, correct];
            setTimeout(() => {
                setFeedback(null);
                setCorrectFlags(nextFlags);
                if (currentIdx + 1 >= load.questions.length) {
                    finishSession(nextFlags);
                } else {
                    setCurrentIdx((i) => i + 1);
                }
            }, FEEDBACK_MS);
        },
        [load, currentIdx, correctFlags, feedback, sfxOn, finishSession],
    );

    const currentQuestion = useMemo(() => {
        if (load.kind !== 'ready') return null;
        return load.questions[currentIdx] ?? null;
    }, [load, currentIdx]);

    if (!skill) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2>Skill not found</h2>
                <Link to="/">Back to island</Link>
            </div>
        );
    }

    if (load.kind === 'loading') {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#725d42' }}>
                <p>Loading {skill.name}…</p>
            </div>
        );
    }

    if (load.kind === 'error') {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#725d42' }}>
                <h2>{skill.name}</h2>
                <p>{load.message}</p>
                <p style={{ marginTop: 24 }}>
                    <Link to="/">← Back to island</Link>
                </p>
            </div>
        );
    }

    if (!currentQuestion) {
        return null;
    }

    return (
        <div>
            <ProgressBar
                total={load.questions.length}
                current={currentIdx}
                correct={correctFlags}
            />
            <QuestionRenderer
                question={currentQuestion}
                locked={feedback !== null}
                onAnswer={handleAnswer}
            />
            <FeedbackOverlay
                feedback={feedback}
                correctAnswer={lastCorrectAnswer}
            />
        </div>
    );
}
