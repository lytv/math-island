import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { playSfx } from '@/lib/audio';
import { setSpeechEnabled } from '@/lib/speech';
import { useProgress } from '@/store/progress';
import { helpVideoForPath } from '@/content/helpVideos';
import styles from './fish.module.css';

export function FishHelper() {
    const { pathname } = useLocation();
    const ttsOn = useProgress((s) => s.settings.ttsOn);
    const [open, setOpen] = useState(false);
    const video = helpVideoForPath(pathname);

    // Pause app speech while the video is open; restore the user's setting on close.
    useEffect(() => {
        if (open) {
            setSpeechEnabled(false);
            return () => {
                setSpeechEnabled(ttsOn);
            };
        }
        return undefined;
    }, [open, ttsOn]);

    // Hide the fish entirely if there's no video for the current route.
    if (!video) return null;

    const handleOpen = () => {
        playSfx('click');
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    return (
        <>
            <button
                type="button"
                className={styles.fishButton}
                aria-label="Ask the fish for help"
                onClick={handleOpen}
            >
                🐟
            </button>

            <AnimatePresence>
                {open && (
                    <div
                        className={styles.modalBackdrop}
                        onClick={handleClose}
                        role="dialog"
                        aria-modal="true"
                    >
                        <motion.div
                            className={styles.modalCard}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, y: 24, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className={styles.modalHeader}>
                                <span className={styles.modalTitle}>{video.title}</span>
                                <button
                                    type="button"
                                    className={styles.modalClose}
                                    onClick={handleClose}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.videoWrap}>
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                                        title={video.title}
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                <p className={styles.blurb}>{video.blurb}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
