export interface HelpVideo {
    /** YouTube video id (the part after watch?v= or youtu.be/) */
    youtubeId: string;
    /** Kid-friendly modal title */
    title: string;
    /** One short encouraging line */
    blurb: string;
}

// Keyed by location: a skill id (see src/content/skills.ts) or 'home'.
export const HELP_VIDEOS: Record<string, HelpVideo> = {
    'add-within-20': {
        // TODO(user): paste the YouTube id from the "Make 10 first" video.
        // e.g. from https://youtu.be/82kvJ9Im8qY  ->  youtubeId: '82kvJ9Im8qY'
        youtubeId: '82kvJ9Im8qY',
        title: 'Make 10 first!',
        blurb: 'Stuck on 8 + 5? Let me show you a trick!',
    },
    'place-value': {
        // "Explain 10 and 1" — https://youtu.be/J5HHjufJ-M0
        youtubeId: 'J5HHjufJ-M0',
        title: 'Tens and Ones!',
        blurb: 'What are tens and ones? Let me show you!',
    },
};

export const helpVideoForSkill = (skillId: string): HelpVideo | undefined =>
    HELP_VIDEOS[skillId];

/** Resolve a help video from a router pathname (e.g. "/skill/add-within-20"). */
export const helpVideoForPath = (pathname: string): HelpVideo | undefined => {
    const skillMatch = pathname.match(/^\/skill\/([^/]+)/);
    if (skillMatch?.[1]) return HELP_VIDEOS[skillMatch[1]];
    if (pathname === '/') return HELP_VIDEOS['home'];
    return undefined;
};
