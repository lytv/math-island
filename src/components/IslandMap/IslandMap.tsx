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
                viewBox="0 0 800 1200"
                preserveAspectRatio="xMidYMid meet"
                className={styles.svg}
                role="img"
                aria-label="Math Island map"
            >
                {/* illustrated island map background */}
                <image
                    href="/assets/island-map.png"
                    x="0"
                    y="0"
                    width="800"
                    height="1200"
                    preserveAspectRatio="xMidYMid meet"
                />

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
