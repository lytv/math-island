import { motion } from 'framer-motion';
import type { CountableItem } from '@/types/skill';
import styles from './countable.module.css';

export const ITEM_EMOJI: Record<CountableItem, string> = {
    apple: '🍎',
    fish: '🐟',
    leaf: '🍃',
    flower: '🌸',
    star: '⭐',
    acorn: '🌰',
    butterfly: '🦋',
    cloud: '☁️',
};

interface Props {
    item: CountableItem;
    count: number;
    size?: number;
    /** When true, render in flat row; otherwise grid wrap */
    inline?: boolean;
}

export function CountableSet({ item, count, size = 56, inline = false }: Props) {
    const emoji = ITEM_EMOJI[item];
    const items = Array.from({ length: count });

    return (
        <div
            className={inline ? styles.inline : styles.grid}
            role="img"
            aria-label={`${count} ${item}${count === 1 ? '' : 's'}`}
        >
            {items.map((_, i) => (
                <motion.span
                    key={i}
                    className={styles.item}
                    style={{ fontSize: size, width: size, height: size }}
                    initial={{ opacity: 0, scale: 0.4, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        delay: i * 0.06,
                        duration: 0.3,
                        type: 'spring',
                        stiffness: 250,
                        damping: 16,
                    }}
                    aria-hidden
                >
                    {emoji}
                </motion.span>
            ))}
        </div>
    );
}
