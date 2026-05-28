import { useParams, Link } from 'react-router-dom';
import { skillById } from '@/content/skills';

export function SkillSession() {
    const { id } = useParams<{ id: string }>();
    const skill = id ? skillById(id) : undefined;

    if (!skill) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2>Skill not found</h2>
                <Link to="/">Back to island</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: 40, textAlign: 'center', color: '#725d42' }}>
            <h1>{skill.name}</h1>
            <p>{skill.description}</p>
            <p style={{ marginTop: 32, opacity: 0.6 }}>
                Quiz engine coming in next sprint…
            </p>
            <Link
                to="/"
                style={{
                    display: 'inline-block',
                    marginTop: 24,
                    padding: '12px 24px',
                    background: '#ffcc00',
                    color: '#725d42',
                    borderRadius: 50,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 0 0 #e0b800',
                }}
            >
                ← Back to island
            </Link>
        </div>
    );
}
