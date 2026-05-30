import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/progress';
import { SKILLS } from '@/content/skills';
import { SkillNode, type NodeState } from './SkillNode';
import { ConnectionPath } from './ConnectionPath';
import styles from './island.module.css';

export function IslandMap() {
    const navigate = useNavigate();
    const skills = useProgress((s) => s.skills);
    const isUnlocked = useProgress((s) => s.isUnlocked);
    const activeSessions = useProgress((s) => s.activeSessions);

    const firstUnlockedNotMastered = SKILLS.find(
        (s) => isUnlocked(s.id) && !skills[s.id]?.mastered,
    );

    const stateFor = (skillId: string): NodeState => {
        const progress = skills[skillId];
        if (progress?.mastered) return 'mastered';
        if (!isUnlocked(skillId)) return 'locked';
        return firstUnlockedNotMastered?.id === skillId ? 'current' : 'unlocked';
    };

    return (
        <div className={styles.canvas}>
            <svg
                viewBox="0 0 800 1100"
                preserveAspectRatio="xMidYMid meet"
                className={styles.svg}
                role="img"
                aria-label="Math Island map"
            >
                <defs>
                    <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor="#a8e0f0" />
                        <stop offset="100%" stopColor="#6fb8d9" />
                    </radialGradient>
                    <radialGradient id="island" cx="50%" cy="55%" r="60%">
                        <stop offset="0%" stopColor="#bce29a" />
                        <stop offset="70%" stopColor="#7dc395" />
                        <stop offset="100%" stopColor="#5fa377" />
                    </radialGradient>
                    <pattern id="sand" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <rect width="20" height="20" fill="#f0d9a0" />
                        <circle cx="5" cy="5" r="1" fill="#e0c890" />
                        <circle cx="15" cy="15" r="1" fill="#e0c890" />
                    </pattern>
                </defs>

                {/* ocean */}
                <rect width="800" height="1100" fill="url(#ocean)" />

                {/* wavy ocean ripples */}
                <g opacity="0.4" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M 50 200 Q 100 190, 150 200 T 250 200" />
                    <path d="M 580 380 Q 620 370, 660 380 T 740 380" />
                    <path d="M 100 900 Q 140 890, 180 900 T 260 900" />
                    <path d="M 540 980 Q 580 970, 620 980 T 700 980" />
                </g>

                {/* island sand outline (slightly bigger blob) */}
                <path
                    d="
                    M 130 880
                    C 60 800, 60 600, 90 480
                    C 110 360, 170 220, 280 150
                    C 380 90, 500 80, 600 130
                    C 700 170, 740 280, 730 400
                    C 740 530, 720 680, 660 800
                    C 600 900, 480 970, 360 960
                    C 250 950, 170 940, 130 880
                    Z
                    "
                    fill="url(#sand)"
                    stroke="#d4b97a"
                    strokeWidth="3"
                />

                {/* island grass */}
                <path
                    d="
                    M 180 850
                    C 130 770, 130 620, 160 510
                    C 180 400, 230 270, 320 210
                    C 410 160, 510 150, 590 200
                    C 670 240, 700 340, 690 440
                    C 700 550, 680 680, 630 770
                    C 580 850, 470 910, 370 900
                    C 270 890, 210 880, 180 850
                    Z
                    "
                    fill="url(#island)"
                />

                {/* decorative trees */}
                <text x="120" y="600" fontSize="36" aria-hidden>🌴</text>
                <text x="700" y="650" fontSize="36" aria-hidden>🌴</text>
                <text x="180" y="380" fontSize="32" aria-hidden>🌳</text>
                <text x="650" y="240" fontSize="32" aria-hidden>🌳</text>
                <text x="380" y="180" fontSize="28" aria-hidden>🌲</text>

                {/* connection paths between sequential skills */}
                {SKILLS.flatMap((s) =>
                    s.prereq.map((p) => {
                        const from = SKILLS.find((x) => x.id === p);
                        if (!from) return null;
                        return (
                            <ConnectionPath
                                key={`${p}-${s.id}`}
                                from={from.position}
                                to={s.position}
                                unlocked={isUnlocked(s.id)}
                            />
                        );
                    }),
                )}

                {/* skill nodes */}
                {SKILLS.map((skill) => {
                    const saved = activeSessions[skill.id];
                    const inProgress =
                        !!saved &&
                        saved.questions.length > 0 &&
                        saved.currentIdx < saved.questions.length;
                    return (
                        <SkillNode
                            key={skill.id}
                            skill={skill}
                            state={stateFor(skill.id)}
                            stars={skills[skill.id]?.starsEarned ?? 0}
                            inProgress={inProgress}
                            onTap={() => navigate(`/skill/${skill.id}`)}
                        />
                    );
                })}
            </svg>
        </div>
    );
}
