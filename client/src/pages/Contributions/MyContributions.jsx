import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MakeContributionButton from '../../components/MakeContributtionButton';
import PaymentModal from '../../components/paymentModals/PaymentModal';
import './MyContributions.css'

export default function MyContributions() {
  const { id } = useParams();                    // groupId
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const { currentUser } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupMemberId, setGroupMemberId] = useState(null);
  const [amount, setAmount] = useState(null);

  // load PayFast script once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sandbox.payfast.co.za/onsite/engine.js';
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(import.meta.env.VITE_API_URL + `/api/contributions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch contributions');
        const data = await response.json();
        console.log(data)
        setContributions(data.contributions);
        setGroupMemberId(data.groupMemberId);  // return this from your API
        setAmount(data.contributionAmount);    // return this from your API (group settings)
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, [id, currentUser]);

  if (loading) return <p style={styles.message}>Loading contributions...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.container}>

      <MakeContributionButton
        groupId={id}
        groupMemberId={groupMemberId}
        role={role}
        amount={amount}
        user={{
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ')[1] || '',
          email: currentUser.email,
        }}
      />

      <PaymentModal amount={amount} reference={null} />

      <h1 style={styles.title}>My Contributions</h1>
      {contributions.length === 0 ? (
        <p style={styles.message}>No contributions found.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Confirmed By</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c) => (
              <tr key={c.id} style={styles.tr}>
                <td style={styles.td}>{new Date(c.date).toLocaleDateString()}</td>
                <td style={styles.td}>R{c.amount.toFixed(2)}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor:
                      c.status === 'CONFIRMED' ? '#e8f5e9' :
                      c.status === 'MISSED' ? '#ffebee' : '#fff8e1',
                    color:
                      c.status === 'CONFIRMED' ? '#2e7d32' :
                      c.status === 'MISSED' ? '#c62828' : '#f57f17',
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={styles.td}>{c.confirmedBy ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );


}

const styles = {
  container: { padding: '32px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { fontSize: '30px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '16px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0', fontSize: '14px', color: '#666', fontWeight: 'bold' },
  td: { padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#1a1a1a' },
  tr: { transition: 'background-color 0.2s' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  message: { fontSize: '14px', color: '#666', padding: '32px' },
  error: { fontSize: '14px', color: '#c62828', padding: '32px' },
};

