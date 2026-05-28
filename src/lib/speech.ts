let enabled = true;
let voiceName: string | null = null;

const synth = (): SpeechSynthesis | null =>
    typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis
        : null;

export const isSpeechSupported = (): boolean => synth() !== null;

export const listVoices = (): SpeechSynthesisVoice[] => {
    const s = synth();
    if (!s) return [];
    return s.getVoices().filter((v) => v.lang.startsWith('en'));
};

export const setSpeechEnabled = (next: boolean): void => {
    enabled = next;
    if (!next) synth()?.cancel();
};

export const setVoice = (name: string | null): void => {
    voiceName = name;
};

export const speak = (text: string): void => {
    const s = synth();
    if (!s || !enabled) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = listVoices();
    const picked =
        voices.find((v) => v.name === voiceName) ??
        voices.find((v) => /samantha|aria|google us english/i.test(v.name)) ??
        voices[0];
    if (picked) u.voice = picked;
    u.rate = 0.95;
    u.pitch = 1.1;
    s.speak(u);
};
