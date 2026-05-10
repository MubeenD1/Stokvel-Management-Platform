import { useNavigate } from 'react-router-dom';

function GroupCard({ group }) {
    const navigate = useNavigate();

    return (
        <div
            style={styles.card}
            onClick={() => navigate(`/group/${group.id}`)}
        >
            <h3 style={styles.name}>{group.name}</h3>
            <p style={styles.role}>Role: {group.role}</p>
            <p style={styles.joined}>
                Joined: {new Date(group.joinedAt).toLocaleDateString()}
            </p>
            <p style={styles.viewGroup}>View Group →</p>
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    name: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: 0,
    },
    role: {
        fontSize: '14px',
        color: '#2e7d32',
        margin: 0,
        textTransform: 'capitalize',
    },
    joined: {
        fontSize: '13px',
        color: '#999',
        margin: 0,
    },
    viewGroup: {
        fontSize: '13px',
        color: '#2e7d32',
        margin: 0,
        fontWeight: 'bold',
    },
};

export default GroupCard;