import { useEffect, useState } from 'react';
import { auth } from '../firebase';

function SavingsProjection({ groupId }) {

    const [projection, setProjection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {

        async function fetchProjection() {

            try {

                if (!auth.currentUser) {
                    setError('User not authenticated');
                    return;
                }
                const token = await auth.currentUser.getIdToken();

                const response = await fetch(
                 //   `http://localhost:3000/api/contributions/${groupId}/projection`,
                `${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contributions`,

                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to load projection');
                    return;
                }
                setProjection(data);

            } catch (err) {
                console.error(err);
                setError('Could not load projection');

            } finally {
                setLoading(false);
            }
        }

        fetchProjection();

    }, [groupId]);

    if (loading) {
        return <p>Loading savings projection...</p>;
    }
    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    return (
        <div style={styles.container}>

            <h3 style={styles.title}>Projected Savings Growth</h3>

            <div style={styles.grid}>

                <div style={styles.card}>
                    <p style={styles.label}>Current Contributions</p>
                    <p style={styles.value}>
                        R{projection.totalContributions.toFixed(2)}
                    </p>
                </div>

                <div style={styles.card}>
                <p style={styles.label}>Projected Savings</p>
                    <p style={styles.value}>
                        R{projection.projectedSavings.toFixed(2)}
                    </p>
                </div>

            </div>

            <p style={styles.info}>
                Based on SARB repo rate of {projection.repoRate}%
            </p>

            <p style={styles.info}>
                Projection period: {projection.projectionMonths} months
            </p>

            <p style={styles.disclaimer}>
                This is an estimate only and does not guarantee returns.
            </p>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },

    title: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px',
    },

    card: {
        backgroundColor: '#f4f6f8',
        padding: '16px',
        borderRadius: '8px',
    },

    label: {
        fontSize: '13px',
        color: '#666',
        marginBottom: '8px',
    },
    value: {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: 0,
    },

    info: {
        fontSize: '13px',
        color: '#666',
        marginBottom: '4px',
    },

    disclaimer: {
        fontSize: '12px',
        color: '#999',
        marginTop: '12px',
    },
};
export default SavingsProjection;
