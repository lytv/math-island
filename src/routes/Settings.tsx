import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Switch, Modal } from 'animal-island-ui';
import { useProgress } from '@/store/progress';
import { listVoices, isSpeechSupported } from '@/lib/speech';

export function Settings() {
    const navigate = useNavigate();
    const sfxOn = useProgress((s) => s.settings.sfxOn);
    const ttsOn = useProgress((s) => s.settings.ttsOn);
    const ttsVoice = useProgress((s) => s.settings.ttsVoice);
    const setSetting = useProgress((s) => s.setSetting);
    const resetAll = useProgress((s) => s.resetAll);

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (!isSpeechSupported()) return;
        const update = () => setVoices(listVoices());
        update();
        window.speechSynthesis.addEventListener('voiceschanged', update);
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', update);
        };
    }, []);

    return (
        <div
            style={{
                maxWidth: 540,
                margin: '0 auto',
                padding: '32px 24px',
                color: '#725d42',
            }}
        >
            <h1 style={{ fontWeight: 700, marginBottom: 24 }}>Settings</h1>

            <section style={{ marginBottom: 24 }}>
                <Row label="Sound effects">
                    <Switch
                        checked={sfxOn}
                        onChange={(v) => setSetting('sfxOn', v)}
                    />
                </Row>
                <Row label="Read questions aloud">
                    <Switch
                        checked={ttsOn}
                        onChange={(v) => setSetting('ttsOn', v)}
                    />
                </Row>
                {ttsOn && voices.length > 0 && (
                    <Row label="Voice">
                        <select
                            value={ttsVoice ?? ''}
                            onChange={(e) =>
                                setSetting(
                                    'ttsVoice',
                                    e.target.value || null,
                                )
                            }
                            style={{
                                padding: '8px 14px',
                                borderRadius: 50,
                                border: '2.5px solid #c4b89e',
                                background: 'rgb(247, 243, 223)',
                                color: '#725d42',
                                fontSize: 14,
                                fontWeight: 500,
                                fontFamily: 'inherit',
                            }}
                        >
                            <option value="">Auto</option>
                            {voices.map((v) => (
                                <option key={v.name} value={v.name}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </Row>
                )}
            </section>

            <section style={{ marginTop: 40, paddingTop: 24, borderTop: '2px dashed #c4b89e' }}>
                <h3 style={{ marginBottom: 12 }}>Danger zone</h3>
                <Button type="primary" danger onClick={() => setConfirmOpen(true)}>
                    Reset all progress
                </Button>
            </section>

            <div style={{ marginTop: 40 }}>
                <Button onClick={() => navigate('/')}>← Back to island</Button>
            </div>

            <Modal
                open={confirmOpen}
                title="Reset everything?"
                onClose={() => setConfirmOpen(false)}
                onOk={() => {
                    resetAll();
                    setConfirmOpen(false);
                }}
                typewriter={false}
            >
                This clears all skills, stars, and XP. This cannot be undone.
            </Modal>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #e8e2d6',
                gap: 16,
            }}
        >
            <span style={{ fontWeight: 600, fontSize: 16 }}>{label}</span>
            {children}
        </div>
    );
}
