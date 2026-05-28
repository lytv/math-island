import { Link } from 'react-router-dom';

export function SessionResult() {
    return (
        <div style={{ padding: 40, textAlign: 'center', color: '#725d42' }}>
            <h1>Great job!</h1>
            <p>Result screen coming soon.</p>
            <Link to="/">Back to island</Link>
        </div>
    );
}
