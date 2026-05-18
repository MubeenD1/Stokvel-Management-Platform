import { useState, useEffect } from 'react';
import { auth } from '../firebase'; 

function MemberPastPayouts({ groupId, userToken }) {
    const [data, setData] = useState({ totalReceived: 0, payouts: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchHistory() {
            try {
                const response = await fetch(import.meta.env.VITE_API_URL + `/api/groups/${groupId}/payouts/pastpayouts`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                });
                
                const result = await response.json();

                if (!response.ok) {
                    setError('Failed to load payout history');
                    return;
                }

                setData(result.data);
            } catch (err) {
                setError('Could not load payout history');
                console.error('fetchHistory error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (groupId && userToken) fetchHistory();
    }, [groupId, userToken]);

    if (loading) return <p style={styles.message}>Loading your payouts...</p>;
    if (error) return <p style={styles.error}>{error}</p>;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>💰 My Payouts</h3>
            <p style={styles.subtitle}>Your personal stokvel earnings</p>

            {/* Matching your SarbRates Grid Card */}
            <div style={styles.ratesGrid}>
                <div style={styles.rateCard}>
                    <p style={styles.rateLabel}>Total Received</p>
                    <p style={styles.rateValue}>R {data.totalReceived.toFixed(2)}</p>
                </div>
            </div>

            <h4 style={styles.sectionTitle}>History</h4>
            {data.payouts.length === 0 ? (
                <p style={styles.message}>You haven't received any payouts yet.</p>
            ) : (
                <div style={styles.listContainer}>
                    {data.payouts.map((payout) => (
                        <div key={payout.id} style={styles.listItem}>
                            <div>
                                <p style={styles.itemTitle}>Payout Received</p>
                                <p style={styles.updated}>
                                    {new Date(payout.updatedAt).toLocaleDateString('en-ZA', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div style={styles.itemRight}>
                                <p style={styles.itemAmount}>R {payout.amount.toFixed(2)}</p>
                                <p style={styles.itemReference}>{payout.reference || 'No Ref'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
        gridTemplateColumns: '1fr', // Single column for the total, or 1fr 1fr if you add a second metric later
        gap: '16px',
        marginBottom: '24px',
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
        color: '#2e7d32', // Your green highlight
        margin: 0,
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: '0 0 12px 0',
    },
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#f4f6f8', // Matching your secondary background
        borderRadius: '8px',
    },
    itemTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: '0 0 4px 0',
    },
    itemRight: {
        textAlign: 'right',
    },
    itemAmount: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2e7d32',
        margin: '0 0 4px 0',
    },
    itemReference: {
        fontSize: '11px',
        color: '#999',
        margin: 0,
        textTransform: 'uppercase'
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

export default MemberPastPayouts;