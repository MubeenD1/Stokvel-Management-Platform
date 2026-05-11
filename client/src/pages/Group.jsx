import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import SarbRates from '../components/SarbRates';

function Group() {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { groupId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchGroup() {
            try {
                const token = await auth.currentUser.getIdToken();

                const response = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    setError('Failed to load group');
                    return;
                }

                setGroup(data.group);

            } catch (err) {
                setError('Something went wrong. Please try again.');
                console.error('fetchGroup error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchGroup();
    }, [groupId]);

    return (
        <div style={styles.container}>
            <button
                style={styles.backButton}
                onClick={() => navigate('/dashboard')}
            >
                ← Back to Dashboard
            </button>

            {/* loading state */}
            {loading && <p style={styles.message}>Loading group...</p>}

            {/* error state */}
            {error && <p style={styles.error}>{error}</p>}

            {/* group details */}
            {group && (
                <div>
                    <div style={styles.header}>
                        <h1 style={styles.title}>{group.name}</h1>
                        <p style={styles.role}>Your role: {group.role}</p>
                    </div>

                    {/* SARB interest rates section */}
                    <SarbRates />
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '32px',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    backButton: {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        color: '#2e7d32',
        border: '2px solid #2e7d32',
        borderRadius: '8px',
        fontSize: '14px',
        cursor: 'pointer',
        marginBottom: '24px',
    },
    header: {
        marginBottom: '24px',
    },
    title: {
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: '0 0 8px 0',
    },
    role: {
        fontSize: '14px',
        color: '#666',
        margin: 0,
        textTransform: 'capitalize',
    },
    message: {
        color: '#666',
        fontSize: '16px',
    },
    error: {
        color: '#c62828',
        fontSize: '16px',
    },
};

export default Group;