import { motion } from 'framer-motion';
import type { SkillMeta } from '@/types/skill';
import styles from './island.module.css';

export type NodeState = 'locked' | 'unlocked' | 'mastered' | 'current';

interface Props {
    skill: SkillMeta;
    state: NodeState;
    stars: 0 | 1 | 2 | 3;
    inProgress?: boolean;
    onTap: () => void;
}

const BUILDING_EMOJI: Record<SkillMeta['building'], string> = {
    tent: '⛺',
    shop: '🏪',
    museum: '🏛️',
    bridge: '🌉',
    lighthouse: '🗼',
    campfire: '🔥',
    farm: '🌾',
    workshop: '🔨',
    observatory: '🔭',
    cafe: '☕',
    library: '📚',
    fountain: '⛲',
};

const COLORS: Record<NodeState, { fill: string; border: string; shadow: string }> = {
    locked: { fill: '#d4c9b4', border: '#9f927d', shadow: '#8a7b66' },
    unlocked: { fill: '#fdfdf5', border: '#19c8b9', shadow: '#11a89b' },
    current: { fill: '#fdfdf5', border: '#19c8b9', shadow: '#11a89b' },
    mastered: { fill: '#fff4c2', border: '#f5c31c', shadow: '#dba90e' },
};

const RADIUS = 38;

export function SkillNode({ skill, state, stars, inProgress, onTap }: Props) {
    const cx = skill.position.x * 8;
    const cy = skill.position.y * 11;
    const c = COLORS[state];
    const interactive = state !== 'locked';

    return (
        <motion.g
            style={{ cursor: interactive ? 'pointer' : 'not-allowed' }}
            onClick={interactive ? onTap : undefined}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
                opacity: 1,
                scale: state === 'current' ? [1, 1.06, 1] : 1,
            }}
            transition={{
                opacity: { duration: 0.4 },
                scale:
                    state === 'current'
                        ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.4 },
            }}
        >
            {/* shadow */}
            <ellipse
                cx={cx}
                cy={cy + RADIUS + 6}
                rx={RADIUS * 0.8}
                ry={6}
                fill="rgba(0,0,0,0.18)"
            />
            {/* base disc */}
            <circle
                cx={cx}
                cy={cy + 4}
                r={RADIUS}
                fill={c.shadow}
            />
            <circle
                cx={cx}
                cy={cy}
                r={RADIUS}
                fill={c.fill}
                stroke={c.border}
                strokeWidth={4}
            />
            {/* building emoji */}
            <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                fontSize={38}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
                aria-hidden
            >
                {state === 'locked' ? '🔒' : BUILDING_EMOJI[skill.building]}
            </text>
            {/* skill name */}
            <text
                x={cx}
                y={cy + RADIUS + 26}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill={state === 'locked' ? '#8a7b66' : '#725d42'}
                className={styles.nodeLabel}
                style={{ pointerEvents: 'none' }}
            >
                {skill.name}
            </text>
            {/* stars row (mastered only) */}
            {state === 'mastered' && stars > 0 && (
                <text
                    x={cx}
                    y={cy - RADIUS - 8}
                    textAnchor="middle"
                    fontSize={16}
                    style={{ pointerEvents: 'none' }}
                    aria-label={`${stars} stars`}
                >
                    {'⭐'.repeat(stars)}
                </text>
            )}
            {/* in-progress badge — pinned to top-right of the disc */}
            {interactive && inProgress && (
                <g
                    style={{ pointerEvents: 'none' }}
                    aria-label="In progress — tap to resume"
                >
                    <circle
                        cx={cx + RADIUS - 6}
                        cy={cy - RADIUS + 6}
                        r={13}
                        fill="#ff8c42"
                        stroke="#fff"
                        strokeWidth={2.5}
                    />
                    <text
                        x={cx + RADIUS - 6}
                        y={cy - RADIUS + 11}
                        textAnchor="middle"
                        fontSize={14}
                        fontWeight={900}
                        fill="#fff"
                        aria-hidden
                    >
                        ▶
                    </text>
                </g>
            )}
        </motion.g>
    );
}
