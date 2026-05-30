import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { skillById } from '@/content/skills';
import { buildSession } from '@/lib/questionGenerator';
import { calculateStars } from '@/lib/starsCalculator';
import { playSfx } from '@/lib/audio';
import { speak } from '@/lib/speech';
import { randomPraise } from '@/lib/praise';
import { useProgress } from '@/store/progress';
import type { Question, SkillContent } from '@/types/skill';
import type { StarCount } from '@/types/progress';
import { QuestionRenderer } from '@/components/Quiz/QuestionRenderer';
import { ProgressBar } from '@/components/Quiz/ProgressBar';
import {
    FeedbackOverlay,
    type FeedbackKind,
} from '@/components/Quiz/FeedbackOverlay';
import { ReviewModal } from '@/components/Quiz/ReviewModal';

const SESSION_SIZE = 10;
const FEEDBACK_MS = 900;
// Delay before the spoken praise plays — lets the "ding" SFX play first.
const PRAISE_DELAY_MS = 180;

/**
 * Eager-glob all skill JSON content at build time. Each entry is the
 * default export of the JSON file. Keyed by full module path.
 */
const SKILL_CONTENT_MODULES = import.meta.glob<SkillContent>(
    '@/content/skills/*.json',
    { eager: true, import: 'default' },
);

const loadSkillContent = (skillId: string): SkillContent | null => {
    const entry = Object.entries(SKILL_CONTENT_MODULES).find(([p]) =>
        p.endsWith(`/${skillId}.json`),
    );
    return entry ? entry[1] : null;
};

type LoadState =
    | { kind: 'loading' }
    | { kind: 'ready'; questions: Question[] }
    | { kind: 'error'; message: string };

type ReviewState =
    | { kind: 'closed' }
    | { kind: 'reanswer'; index: number }
    | { kind: 'show'; index: number };

export function SkillSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const ttsOn = useProgress((s) => s.settings.ttsOn);
    const recordSession = useProgress((s) => s.recordSession);
    const isUnlocked = useProgress((s) => s.isUnlocked);
    const saveActiveSession = useProgress((s) => s.saveActiveSession);
    const clearActiveSession = useProgress((s) => s.clearActiveSession);
    const activeSessions = useProgress((s) => s.activeSessions);

    const skill = id ? skillById(id) : undefined;
    const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
    const [currentIdx, setCurrentIdx] = useState(0);
    const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
    const [userAnswers, setUserAnswers] = useState<(number | undefined)[]>([]);
    const [feedback, setFeedback] = useState<FeedbackKind>(null);
    const [lastCorrectAnswer, setLastCorrectAnswer] = useState<number | undefined>();
    const [review, setReview] = useState<ReviewState>({ kind: 'closed' });
    const carriedElapsedMs = useRef<number>(0);
    const mountedAt = useRef<number>(Date.now());

    const persist = useCallback(
        (override: {
            currentIdx?: number;
            correctFlags?: boolean[];
            userAnswers?: (number | undefined)[];
            questions?: Question[];
        }) => {
            if (!skill || load.kind !== 'ready') return;
            saveActiveSession({
                skillId: skill.id,
                questions: override.questions ?? load.questions,
                currentIdx: override.currentIdx ?? currentIdx,
                correctFlags: override.correctFlags ?? correctFlags,
                userAnswers: override.userAnswers ?? userAnswers,
                startedAt: mountedAt.current,
                elapsedMs:
                    carriedElapsedMs.current +
                    (Date.now() - mountedAt.current),
            });
        },
        [
            skill,
            load,
            currentIdx,
            correctFlags,
            userAnswers,
            saveActiveSession,
        ],
    );

    const startFresh = useCallback(
        (content: SkillContent) => {
            const session = buildSession(content.questions, SESSION_SIZE);
            setLoad({ kind: 'ready', questions: session });
            setCurrentIdx(0);
            setCorrectFlags([]);
            setUserAnswers([]);
            carriedElapsedMs.current = 0;
            mountedAt.current = Date.now();
            if (skill) {
                saveActiveSession({
                    skillId: skill.id,
                    questions: session,
                    currentIdx: 0,
                    correctFlags: [],
                    userAnswers: [],
                    startedAt: Date.now(),
                    elapsedMs: 0,
                });
            }
        },
        [skill, saveActiveSession],
    );

    useEffect(() => {
        if (!skill) return;
        if (!isUnlocked(skill.id)) {
            setLoad({ kind: 'error', message: 'This skill is locked.' });
            return;
        }
        const content = loadSkillContent(skill.id);
        if (!content) {
            setLoad({
                kind: 'error',
                message: `No content yet for "${skill.name}". Try another skill!`,
            });
            return;
        }
        const saved = activeSessions[skill.id];
        if (
            saved &&
            saved.questions.length > 0 &&
            saved.currentIdx < saved.questions.length
        ) {
            setLoad({ kind: 'ready', questions: saved.questions });
            setCurrentIdx(saved.currentIdx);
            setCorrectFlags(saved.correctFlags);
            setUserAnswers(saved.userAnswers ?? saved.correctFlags.map(() => undefined));
            carriedElapsedMs.current = saved.elapsedMs;
            mountedAt.current = Date.now();
        } else {
            startFresh(content);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skill, isUnlocked]);

    const finishSession = useCallback(
        (finalFlags: boolean[]) => {
            if (!skill) return;
            const correctCount = finalFlags.filter(Boolean).length;
            const total = finalFlags.length;
            const accuracy = total > 0 ? correctCount / total : 0;
            const durationMs =
                carriedElapsedMs.current + (Date.now() - mountedAt.current);
            const stars: StarCount = calculateStars({
                correct: correctCount,
                total,
                durationMs,
            });
            const { streakIncremented, newStreak } = recordSession(
                skill.id,
                accuracy,
                stars,
                correctCount,
            );
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
                    streakIncremented,
                    newStreak,
                },
            });
        },
        [skill, recordSession, sfxOn, navigate],
    );

    const handleAnswer = useCallback(
        (correct: boolean, given: number) => {
            if (load.kind !== 'ready') return;
            if (feedback) return; // ignore double-tap during animation
            if (sfxOn) playSfx(correct ? 'correct' : 'wrong');
            // Kick off praise audio after the SFX "ding" lands. The returned
            // promise resolves when the praise audio finishes — we use it to
            // hold off advancing to the next question so they don't overlap.
            const praiseDone =
                correct && ttsOn
                    ? new Promise<void>((resolve) => {
                          window.setTimeout(() => {
                              speak(randomPraise()).then(resolve);
                          }, PRAISE_DELAY_MS);
                      })
                    : Promise.resolve();
            const question = load.questions[currentIdx];
            const expected =
                question?.type === 'multiple-choice'
                    ? question.answer
                    : question?.type === 'tap-to-count'
                      ? question.count
                      : question?.type === 'number-line'
                        ? question.answer
                        : undefined;
            setLastCorrectAnswer(expected);
            setFeedback(correct ? 'correct' : 'wrong');
            const nextFlags = [...correctFlags, correct];
            const nextAnswers = [
                ...userAnswers,
                // drag-to-match passes a partial-count number; we store
                // undefined for non-single-answer types to avoid confusion.
                question?.type === 'drag-to-match' ? undefined : given,
            ];
            const nextIdx = currentIdx + 1;
            const feedbackDone = new Promise<void>((resolve) =>
                window.setTimeout(resolve, FEEDBACK_MS),
            );
            // Wait for BOTH the feedback animation and praise audio to finish
            // before advancing — whichever takes longer.
            Promise.all([feedbackDone, praiseDone]).then(() => {
                setFeedback(null);
                setCorrectFlags(nextFlags);
                setUserAnswers(nextAnswers);
                if (nextIdx >= load.questions.length) {
                    finishSession(nextFlags);
                } else {
                    setCurrentIdx(nextIdx);
                    persist({
                        currentIdx: nextIdx,
                        correctFlags: nextFlags,
                        userAnswers: nextAnswers,
                    });
                }
            });
        },
        [
            load,
            currentIdx,
            correctFlags,
            userAnswers,
            feedback,
            sfxOn,
            ttsOn,
            finishSession,
            persist,
        ],
    );

    const currentQuestion = useMemo(() => {
        if (load.kind !== 'ready') return null;
        return load.questions[currentIdx] ?? null;
    }, [load, currentIdx]);

    const handleRestart = useCallback(() => {
        if (!skill) return;
        const content = loadSkillContent(skill.id);
        if (!content) return;
        clearActiveSession(skill.id);
        startFresh(content);
    }, [skill, clearActiveSession, startFresh]);

    const handleDotTap = useCallback(
        (index: number) => {
            if (feedback !== null) return;
            if (index >= correctFlags.length) return; // not yet answered
            setReview(
                correctFlags[index]
                    ? { kind: 'show', index }
                    : { kind: 'reanswer', index },
            );
        },
        [feedback, correctFlags],
    );

    const handleReviewSolved = useCallback(
        (index: number, given: number) => {
            if (!correctFlags[index]) {
                const nextFlags = correctFlags.slice();
                nextFlags[index] = true;
                const nextAnswers = userAnswers.slice();
                nextAnswers[index] = given;
                setCorrectFlags(nextFlags);
                setUserAnswers(nextAnswers);
                if (sfxOn) playSfx('correct');
                if (ttsOn) {
                    window.setTimeout(
                        () => speak(randomPraise()),
                        PRAISE_DELAY_MS,
                    );
                }
                persist({
                    correctFlags: nextFlags,
                    userAnswers: nextAnswers,
                });
            }
            setReview({ kind: 'closed' });
        },
        [correctFlags, userAnswers, sfxOn, ttsOn, persist],
    );

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

    const reviewedQuestion =
        review.kind !== 'closed' ? load.questions[review.index] : null;

    return (
        <div>
            <ProgressBar
                total={load.questions.length}
                current={currentIdx}
                correct={correctFlags}
                onRestart={handleRestart}
                canRestart={feedback === null}
                onDotTap={handleDotTap}
                dotTapDisabled={feedback !== null}
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
            {reviewedQuestion && review.kind === 'reanswer' && (
                <ReviewModal
                    mode="reanswer"
                    question={reviewedQuestion}
                    onClose={() => setReview({ kind: 'closed' })}
                    onSolved={(given) =>
                        handleReviewSolved(review.index, given)
                    }
                />
            )}
            {reviewedQuestion && review.kind === 'show' && (
                <ReviewModal
                    mode="show"
                    question={reviewedQuestion}
                    originalAnswer={userAnswers[review.index]}
                    onClose={() => setReview({ kind: 'closed' })}
                />
            )}
        </div>
    );
}
