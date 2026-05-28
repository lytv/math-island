interface Props {
    from: { x: number; y: number };
    to: { x: number; y: number };
    unlocked: boolean;
}

export function ConnectionPath({ from, to, unlocked }: Props) {
    const stroke = unlocked ? '#19c8b9' : '#c4b89e';
    const opacity = unlocked ? 0.7 : 0.35;
    return (
        <line
            x1={from.x * 8}
            y1={from.y * 11}
            x2={to.x * 8}
            y2={to.y * 11}
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray="2 14"
            opacity={opacity}
        />
    );
}
