import { Howl } from 'howler';

export type SfxName = 'correct' | 'wrong' | 'celebrate' | 'click' | 'unlock';

const SFX_FILES: Record<SfxName, string> = {
    correct: '/audio/correct.mp3',
    wrong: '/audio/wrong.mp3',
    celebrate: '/audio/celebrate.mp3',
    click: '/audio/click.mp3',
    unlock: '/audio/unlock.mp3',
};

const cache = new Map<SfxName, Howl>();
let enabled = true;
let primed = false;

const load = (name: SfxName): Howl => {
    const existing = cache.get(name);
    if (existing) return existing;
    const howl = new Howl({
        src: [SFX_FILES[name]],
        volume: 0.6,
        preload: true,
    });
    cache.set(name, howl);
    return howl;
};

export const preloadAllSfx = (): void => {
    (Object.keys(SFX_FILES) as SfxName[]).forEach(load);
};

export const playSfx = (name: SfxName): void => {
    if (!enabled || !primed) return;
    try {
        load(name).play();
    } catch {
        /* silent — autoplay block */
    }
};

export const setSfxEnabled = (next: boolean): void => {
    enabled = next;
};

export const primeAudio = (): void => {
    primed = true;
};
