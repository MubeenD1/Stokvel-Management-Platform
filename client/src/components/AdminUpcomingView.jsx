import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

//import MemberPastPayouts from '../components/MemberPastPayouts';

export default function AdminUpcomingView({groupId}) {
  const { currentUser } = useAuth(); 
  const [eligible, setEligible] = useState([]);
  const [history, setHistory] = useState([]);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [userToken, setUserToken] = useState(null);

  const [upcomingData, setUpcomingData] = useState({ upcomingTotal: 0, schedule: [] });

  const fetchData = async () => {
    if (!currentUser || !groupId) return;

    try {
      const token = await currentUser.getIdToken();
      setUserToken(token);
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      };

      const [histRes, eligRes, groupRes, upcomingRes] = await Promise.all([
       //fetch(`http://localhost:3000/api/groups/${id}/payouts/history`, { headers }),
        fetch(import.meta.env.VITE_API_URL + `/api/groups/${groupId}/payouts/history`, { headers }), 
        //fetch(`http://localhost:3000/api/groups/${id}/payouts/eligible`, { headers }),
        fetch(import.meta.env.VITE_API_URL + `/api/groups/${groupId}/payouts/eligible`, { headers }),
        //fetch(`http://localhost:3000/api/groups/${id}`, { headers })
        fetch(import.meta.env.VITE_API_URL + `/api/groups/${groupId}`, { headers }),

        fetch(import.meta.env.VITE_API_URL + `/api/groups/${groupId}/payouts/upcoming`, { headers })
      ]);
      
      //Safety check to prevent the "Unexpected token <" crash
      if (!histRes.ok || !eligRes.ok || !groupRes.ok || !upcomingRes.ok) {
        console.error("Backend returned an error. Check Express routes");
        return; 
      }

      setHistory(await histRes.json());
      setEligible(await eligRes.json());

      const upData = await upcomingRes.json();
      setUpcomingData(upData.data || { upcomingTotal: 0, schedule: [] });

      const groupData = await groupRes.json();
      setContributionAmount(groupData.contributionAmount || groupData.group?.contributionAmount || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, currentUser]);

  const handlePayout = async (memberId, amount) => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken(); 
      
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/groups/${groupId}/payouts/initiate`, { 
        //fetch(`http://localhost:3000/api/groups/${id}/payouts/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ groupId, memberId, amount })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert("Payout Successful!");
        fetchData(); 
      } else {
        alert(result.error || "Something went wrong");
      }
    } catch (error) {
       console.error("Payout initiation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userToken) return <p style={styles.message}>Loading group financials...</p>;


  return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            
            {/* Header Section */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 8px 0' }}>
                    Group Payouts Dashboard
                </h2>
                <p style={styles.subtitle}>Manage group financials and issue pending payments</p>
            </div>

            {/* ACTION SECTION: Eligible for Payout */}
            <div style={{ ...styles.container, marginTop: 0 }}>
                <h3 style={styles.title}>💸 Action Required: Eligible for Payout</h3>
                <p style={{ ...styles.subtitle, marginBottom: '20px' }}>
                    Members who have not yet received their rotation.
                </p>
                
                {eligible.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.message}>Everyone is paid up! No eligible members pending.</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {eligible.map(member => (
                            <div key={member.id} style={styles.card}>
                                <p style={styles.cardEmail}>{member.user.email}</p>
                                <p style={styles.cardAmount}>Payout: R {contributionAmount.toFixed(2)}</p>
                                <button 
                                    onClick={() => handlePayout(member.id, contributionAmount)} 
                                    disabled={loading}
                                    style={loading ? styles.buttonDisabled : styles.buttonPrimary}
                                >
                                    {loading ? 'Processing...' : `Issue Payout`}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* INLINE TIMELINE LAYOUT SECTION */}
            <div style={styles.container}>
                <h3 style={styles.title}>📅 Upcoming Payout Projections</h3>
                <p style={{ ...styles.subtitle, marginBottom: '20px' }}>Estimated schedule liabilities for future rotations</p>
                
                <div style={styles.timelineSummaryCard}>
                    <p style={styles.rateLabel}>Total Group Pending Liability</p>
                    <p style={styles.rateValuePending}>R {upcomingData.upcomingTotal.toFixed(2)}</p>
                </div>

                {upcomingData.schedule.length === 0 ? (
                    <p style={styles.message}>There are no pending payouts scheduled.</p>
                ) : (
                    <div style={styles.listContainer}>
                        {upcomingData.schedule.map((item) => (
                            <div key={item.id} style={styles.timelineItem}>
                                <div>
                                    <p style={styles.itemTitle}>{item.member?.user?.email || 'Unknown User'}</p>
                                    <p style={styles.updated}>
                                        Queued: {new Date(item.createdAt).toLocaleDateString('en-ZA', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div style={styles.itemRight}>
                                    <p style={styles.itemAmountPending}>R {item.amount.toFixed(2)}</p>
                                    <span style={styles.statusBadgePending}>{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MASTER HISTORY SECTION */}
            <div style={styles.container}>
                <h3 style={styles.title}>📖 Master Payout History</h3>
                <p style={styles.subtitle}>Complete ledger of all successful and failed group payouts.</p>

                {history.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.message}>No payouts have been processed yet.</p>
                    </div>
                ) : (
                    <div style={styles.listContainer}>
                        {history.map(p => (
                            <div key={p.id} style={styles.listItem}>
                                <div>
                                    <p style={styles.itemTitle}>{p.member.user.email}</p>
                                    <p style={styles.updated}>
                                        {new Date(p.createdAt).toLocaleDateString('en-ZA', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div style={styles.itemRight}>
                                    <p style={styles.itemAmount}>R {p.amount.toFixed(2)}</p>
                                    {/* Dynamic badge color based on status */}
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: p.status === 'SUCCESS' ? '#e8f5e9' : p.status === 'FAILED' ? '#ffebee' : '#fff8e1',
                                        color: p.status === 'SUCCESS' ? '#2e7d32' : p.status === 'FAILED' ? '#c62828' : '#f57c00'
                                    }}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

// Styling Object mapping exactly to the aesthetic of your SarbRates component
const styles = {
    container: {
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '24px',
        marginBottom: '24px'
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
        margin: '0',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '16px',
    },
    card: {
        backgroundColor: '#f4f6f8',
        padding: '20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    cardEmail: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: 0,
        wordBreak: 'break-all',
    },
    cardAmount: {
        fontSize: '13px',
        color: '#666',
        margin: 0,
    },
    buttonPrimary: {
        backgroundColor: '#2e7d32', // Matches your SARB rates green highlight
        color: '#ffffff',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'background-color 0.2s',
    },
    buttonDisabled: {
        backgroundColor: '#a5d6a7',
        color: '#ffffff',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'not-allowed',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    emptyState: {
        padding: '30px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px dashed #e5e7eb'
    },
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '16px'
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#f4f6f8', 
        borderRadius: '8px',
    },
    itemTitle: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: '0 0 4px 0',
    },
    itemRight: {
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px'
    },
    itemAmount: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: 0,
    },
    statusBadge: {
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '12px',
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
        margin: 0
    },
};