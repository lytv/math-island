import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Cursor } from 'animal-island-ui';
import { TopBar } from '@/components/Layout/TopBar';
import { IslandHome } from '@/routes/IslandHome';
import { SkillSession } from '@/routes/SkillSession';
import { SessionResult } from '@/routes/SessionResult';
import { Settings } from '@/routes/Settings';
import { FishHelper } from '@/components/shared/FishHelper';
import { primeAudio, preloadAllSfx } from '@/lib/audio';

export function App() {
    const primed = useRef(false);

    useEffect(() => {
        preloadAllSfx();
        const handleFirstGesture = () => {
            if (primed.current) return;
            primed.current = true;
            primeAudio();
        };
        window.addEventListener('pointerdown', handleFirstGesture, { once: true });
        window.addEventListener('keydown', handleFirstGesture, { once: true });
        return () => {
            window.removeEventListener('pointerdown', handleFirstGesture);
            window.removeEventListener('keydown', handleFirstGesture);
        };
    }, []);

    return (
        <Cursor>
            <div className="app-root">
                <TopBar />
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<IslandHome />} />
                        <Route path="/skill/:id" element={<SkillSession />} />
                        <Route path="/result" element={<SessionResult />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <FishHelper />
            </div>
        </Cursor>
    );
}
