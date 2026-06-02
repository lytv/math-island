import { describe, expect, it } from 'vitest';
import { HELP_VIDEOS, helpVideoForPath } from './helpVideos';
import { SKILLS } from '@/content/skills';

describe('help videos', () => {
    it('resolves add-within-20 from its skill path', () => {
        const video = helpVideoForPath('/skill/add-within-20');
        expect(video).toBeDefined();
        expect(video?.title).toBe('Make 10 first!');
    });

    it('resolves place-value to the tens-and-ones video', () => {
        const video = helpVideoForPath('/skill/place-value');
        expect(video?.title).toBe('Tens and Ones!');
        expect(video?.youtubeId).toBe('J5HHjufJ-M0');
    });

    it('returns undefined for a skill with no help video', () => {
        expect(helpVideoForPath('/skill/count-to-10')).toBeUndefined();
    });

    it('returns undefined for the home path (no home video mapped)', () => {
        expect(helpVideoForPath('/')).toBeUndefined();
    });

    it('every key is "home" or a real skill id', () => {
        const ids = new Set(SKILLS.map((s) => s.id));
        Object.keys(HELP_VIDEOS).forEach((key) => {
            expect(key === 'home' || ids.has(key), `unknown key ${key}`).toBe(true);
        });
    });
});
