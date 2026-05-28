import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from 'animal-island-ui';
import { skillById, SKILLS } from '@/content/skills';
import { useProgress } from '@/store/progress';
import { playSfx } from '@/lib/audio';
import { findReviewSkill } from '@/lib/reviewSuggestion';
import type { StarCount } from '@/types/progress';

interface ResultState {
    skillId: string;
    skillName: string;
    accuracy: number;
    correctCount: number;
    total: number;
    stars: StarCount;
    durationMs: number;
    streakIncremented: boolean;
    newStreak: number;
}

const isResultState = (s: unknown): s is ResultState =>
    !!s &&
    typeof s === 'object' &&
    'skillId' in s &&
    'stars' in s &&
    'correctCount' in s;

export function SessionResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state;
    const isUnlocked = useProgress((s) => s.isUnlocked);
    const skills = useProgress((s) => s.skills);
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const [streakToastShown, setStreakToastShown] = useState(true);

    const result = isResultState(state) ? state : null;
    const skill = result ? skillById(result.skillId) : undefined;

    const newlyUnlocked = useMemo(() => {
        if (!result) return [];
        const masteredJustNow = skills[result.skillId]?.mastered;
        if (!masteredJustNow) return [];
        return SKILLS.filter(
            (s) =>
                s.prereq.includes(result.skillId) &&
                isUnlocked(s.id) &&
                !skills[s.id]?.mastered,
        );
    }, [result, skills, isUnlocked]);

    const review = useMemo(
        () =>
            result
                ? findReviewSkill(SKILLS, skills, Date.now(), result.skillId)
                : null,
        [result, skills],
    );

    useEffect(() => {
        if (!result) return;
        if (result.stars === 3 || newlyUnlocked.length > 0) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.4 },
                colors: ['#19c8b9', '#ffcc00', '#86d67a', '#f8a6b2', '#b77dee'],
            });
            if (sfxOn && newlyUnlocked.length > 0) playSfx('unlock');
        }
        if (result.streakIncremented && result.newStreak > 1) {
            // Hide toast after 3.5s
            const t = setTimeout(() => setStreakToastShown(false), 3500);
            return () => clearTimeout(t);
        }
        setStreakToastShown(false);
        return undefined;
    }, [result, newlyUnlocked, sfxOn]);

    if (!result || !skill) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#725d42' }}>
                <h2>No result to show</h2>
                <Link to="/">Back to island</Link>
            </div>
        );
    }

    const seconds = Math.round(result.durationMs / 1000);
    const accuracyPct = Math.round(result.accuracy * 100);
    const xpDelta = result.correctCount * 10 + result.stars * 25;

    const headline =
        result.stars === 3
            ? 'Amazing! 🎉'
            : result.stars === 2
              ? 'Great job!'
              : result.stars === 1
                ? 'Nice try!'
                : 'Let’s try again!';

    return (
        <div
            style={{
                maxWidth: 560,
                margin: '0 auto',
                padding: '32px 20px',
                textAlign: 'center',
                color: '#725d42',
                position: 'relative',
            }}
        >
            {/* Streak toast (top-of-page) */}
            <AnimatePresence>
                {streakToastShown && result.streakIncremented && result.newStreak > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                        style={{
                            position: 'fixed',
                            top: 72,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 80,
                            background: 'linear-gradient(135deg, #ff8a00, #e05a5a)',
                            color: '#fff',
                            padding: '12px 22px',
                            borderRadius: 32,
                            fontWeight: 800,
                            fontSize: 16,
                            boxShadow: '0 6px 18px rgba(224, 90, 90, 0.4)',
                            letterSpacing: 0.5,
                        }}
                        role="status"
                    >
                        🔥 {result.newStreak}-day streak! Keep going!
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.h1
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                style={{ fontSize: 36, marginBottom: 8 }}
            >
                {headline}
            </motion.h1>
            <p style={{ fontSize: 18, opacity: 0.8 }}>{skill.name}</p>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 12,
                    margin: '32px 0',
                }}
            >
                {[1, 2, 3].map((n) => (
                    <motion.span
                        key={n}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{
                            scale: n <= result.stars ? 1 : 0.5,
                            rotate: 0,
                            opacity: n <= result.stars ? 1 : 0.25,
                        }}
                        transition={{
                            delay: 0.2 + n * 0.18,
                            type: 'spring',
                            stiffness: 250,
                            damping: 12,
                        }}
                        style={{
                            fontSize: 80,
                            filter:
                                n <= result.stars
                                    ? 'drop-shadow(0 6px 0 rgba(218,169,14,0.6))'
                                    : 'grayscale(1)',
                        }}
                        aria-label={
                            n <= result.stars ? `star ${n} earned` : `star ${n} not earned`
                        }
                    >
                        ⭐
                    </motion.span>
                ))}
            </div>

            <div
                style={{
                    background: 'rgb(247, 243, 223)',
                    border: '2.5px solid #c4b89e',
                    borderRadius: 24,
                    padding: 20,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    boxShadow: '0 4px 0 0 #d4c9b4',
                }}
            >
                <Stat label="Correct" value={`${result.correctCount}/${result.total}`} />
                <Stat label="Accuracy" value={`${accuracyPct}%`} />
                <Stat label="Time" value={`${seconds}s`} />
            </div>

            <div
                style={{
                    marginTop: 20,
                    background: '#fff4c2',
                    border: '2px solid #f5c31c',
                    borderRadius: 18,
                    padding: '12px 16px',
                    fontWeight: 700,
                    color: '#7c5734',
                }}
            >
                +{xpDelta} XP earned ⚡
            </div>

            {newlyUnlocked.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        marginTop: 24,
                        background: 'linear-gradient(135deg, #19c8b9, #11a89b)',
                        color: '#fff',
                        borderRadius: 24,
                        padding: 20,
                        boxShadow: '0 6px 0 0 #0d8b80',
                    }}
                >
                    <div style={{ fontWeight: 800, fontSize: 20 }}>
                        🎉 New skill unlocked!
                    </div>
                    <div style={{ marginTop: 6, fontSize: 16 }}>
                        {newlyUnlocked.map((s) => s.name).join(', ')}
                    </div>
                </motion.div>
            )}

            {review && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    style={{
                        marginTop: 16,
                        background: '#f0e8d8',
                        border: '2px dashed #c4b89e',
                        borderRadius: 18,
                        padding: '14px 16px',
                        fontSize: 14,
                        color: '#725d42',
                        textAlign: 'left',
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        💡 Time for a review?
                    </div>
                    <div style={{ opacity: 0.85, marginBottom: 10 }}>
                        {review.reason === 'stale'
                            ? `You haven't practiced "${review.skill.name}" in a while.`
                            : `"${review.skill.name}" could use another go.`}
                    </div>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => navigate(`/skill/${review.skillId}`)}
                    >
                        Review {review.skill.name}
                    </Button>
                </motion.div>
            )}

            <div
                style={{
                    marginTop: 36,
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <Button
                    type="default"
                    size="large"
                    onClick={() => navigate(`/skill/${skill.id}`)}
                >
                    Play again
                </Button>
                <Button type="primary" size="large" onClick={() => navigate('/')}>
                    Back to island
                </Button>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#725d42' }}>
                {value}
            </div>
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9f927d',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}
            >
                {label}
            </div>
        </div>
    );
}
