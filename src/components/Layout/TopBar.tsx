import { Link, useLocation } from 'react-router-dom';
import { useProgress } from '@/store/progress';
import styles from './layout.module.css';

export function TopBar() {
    const xp = useProgress((s) => s.xp);
    const streak = useProgress((s) => s.streak);
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const setSetting = useProgress((s) => s.setSetting);
    const location = useLocation();

    const showBack = location.pathname !== '/';

    return (
        <header className={styles.topBar}>
            <div className={styles.left}>
                {showBack ? (
                    <Link to="/" className={styles.backBtn} aria-label="Back to island">
                        ←
                    </Link>
                ) : (
                    <span className={styles.logo} aria-hidden>
                        🏝️
                    </span>
                )}
                <span className={styles.title}>Math Island</span>
            </div>
            <div className={styles.stats}>
                <span className={styles.stat} aria-label={`Streak ${streak} days`}>
                    🔥 {streak}
                </span>
                <span className={styles.stat} aria-label={`Experience ${xp}`}>
                    ⭐ {xp}
                </span>
                <button
                    type="button"
                    className={styles.muteBtn}
                    onClick={() => setSetting('sfxOn', !sfxOn)}
                    aria-label={sfxOn ? 'Mute sounds' : 'Unmute sounds'}
                    aria-pressed={!sfxOn}
                >
                    {sfxOn ? '🔊' : '🔇'}
                </button>
                <Link to="/settings" className={styles.settingsBtn} aria-label="Settings">
                    ⚙️
                </Link>
            </div>
        </header>
    );
}
