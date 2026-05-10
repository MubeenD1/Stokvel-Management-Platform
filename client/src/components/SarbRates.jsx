import { useState, useEffect } from 'react';
import { auth } from '../firebase';

function SarbRates() {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchRates() {
            try {
                const token = await auth.currentUser.getIdToken();

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sarb/rates`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    setError('Failed to load interest rates');
                    return;
                }

                setRates(data);

            } catch (err) {
                setError('Could not load interest rates');
                console.error('fetchRates error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchRates();
    }, []);

    if (loading) {
        return <p style={styles.message}>Loading interest rates...</p>;
    }

    if (error) {
        return <p style={styles.error}>{error}</p>;
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>🇿🇦 SA Interest Rates</h3>
            <p style={styles.subtitle}>Source: {rates.source}</p>

            <div style={styles.ratesGrid}>
                <div style={styles.rateCard}>
                    <p style={styles.rateLabel}>Repo Rate</p>
                    <p style={styles.rateValue}>{rates.repoRate}%</p>
                </div>
                <div style={styles.rateCard}>
                    <p style={styles.rateLabel}>Prime Lending Rate</p>
                    <p style={styles.rateValue}>{rates.primeRate}%</p>
                </div>
            </div>

            <p style={styles.updated}>
                Last updated: {new Date(rates.fetchedAt).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })}
            </p>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '24px',
    },
    title: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: '0 0 4px 0',
    },
    subtitle: {
        fontSize: '12px',
        color: '#999',
        margin: '0 0 16px 0',
    },
    ratesGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '12px',
    },
    rateCard: {
        backgroundColor: '#f4f6f8',
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'center',
    },
    rateLabel: {
        fontSize: '13px',
        color: '#666',
        margin: '0 0 8px 0',
    },
    rateValue: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2e7d32',
        margin: 0,
    },
    updated: {
        fontSize: '12px',
        color: '#999',
        margin: 0,
    },
    message: {
        color: '#666',
        fontSize: '14px',
    },
    error: {
        color: '#c62828',
        fontSize: '14px',
    },
};

export default SarbRates;