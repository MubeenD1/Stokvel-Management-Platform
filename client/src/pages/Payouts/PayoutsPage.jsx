import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // <-- 1. Import useAuth (check your exact path)

export default function PayoutsPage() {
  const { id } = useParams();
  const { currentUser } = useAuth(); 
  const [eligible, setEligible] = useState([]);
  const [history, setHistory] = useState([]);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      };

      const [histRes, eligRes, groupRes] = await Promise.all([
       //fetch(`http://localhost:3000/api/groups/${id}/payouts/history`, { headers }),
        fetch(import.meta.env.VITE_API_URL + '/api/groups/${id}/payouts/history', { headers }), 
        //fetch(`http://localhost:3000/api/groups/${id}/payouts/eligible`, { headers }),
        fetch(import.meta.env.VITE_API_URL + '/api/groups/${id}/payouts/eligible', { headers }),
        //fetch(`http://localhost:3000/api/groups/${id}`, { headers })
        fetch(import.meta.env.VITE_API_URL + '/api/groups/${id}', { headers })
      ]);
      
      //Safety check to prevent the "Unexpected token <" crash
      if (!histRes.ok || !eligRes.ok || !groupRes.ok) {
        console.error("Backend returned an error. Check your Express routes!");
        return; 
      }

      setHistory(await histRes.json());
      setEligible(await eligRes.json());

      const groupData = await groupRes.json();
      setContributionAmount(groupData.contributionAmount || groupData.group?.contributionAmount || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, currentUser]);

  const handlePayout = async (memberId, amount) => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken(); 
      
      const res = await fetch(`http://localhost:3000/api/groups/${id}/payouts/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ groupId: id, memberId, amount })
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


  return (
    <div className="payouts-container">
      <h2>Group Payouts</h2>
      <section className="eligible-section" style={{ marginBottom: '2rem' }}>
        <h3>Eligible for Payout</h3>
        
        {eligible.length === 0 ? (
          <p>Everyone is paid up! No eligible members pending.</p>
        ) : (
          <div className="eligible-list" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {eligible.map(member => (
              <div key={member.id} className="member-card" style={{ padding: '1rem', background: '#2a2d34', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0' }}><strong>{member.user.email}</strong></p>
                
                <button 
                  onClick={() => handlePayout(member.id, contributionAmount)} 
                  disabled={loading}
                  style={{ background: '#00df9a', color: '#000', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {loading ? 'Processing...' : `Pay R${contributionAmount}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <h3>Payout History</h3>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map(p => (
              <tr key={p.id}>
                <td>{p.member.user.email}</td>
                <td>R{p.amount}</td>
                <td>
                  <span className={`status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
