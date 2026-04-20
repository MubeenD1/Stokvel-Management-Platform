import { useState, useEffect } from 'react';
import { auth } from '../firebase';

export default function ContributionsSection({ groupId, members }) {
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Find out who the current user is in this group to check their role
    const currentUser = auth.currentUser;
    const myMemberProfile = members.find(m => 
        m.user?.firebaseId === currentUser?.uid || 
        m.user?.email?.toLowerCase() === currentUser?.email?.toLowerCase()
    );
    const myRole = myMemberProfile?.role || 'MEMBER';
    const isTreasurerOrAdmin = myRole === 'TREASURER' || myRole === 'ADMIN';

    // 2. Fetch the contributions when the component loads
    useEffect(() => {
        const fetchContributions = async () => {
            if (!currentUser || !groupId) return;
            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contributions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setContributions(data);
                } else {
                    setError('Failed to load contributions.');
                }
            } catch (err) {
                setError('Network error loading contributions.');
            } finally {
                setLoading(false);
            }
        };
        fetchContributions();
    }, [groupId, currentUser]);

    // 3. The function to handle the Treasurer's button clicks
    const handleVerify = async (contributionId, newStatus) => {
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contributions/${contributionId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                const updatedContribution = await res.json();
                // Update the UI immediately
                setContributions(prev => prev.map(c => 
                    c.id === contributionId ? updatedContribution : c
                ));
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Verification error:", error);
            alert("An error occurred while updating the contribution.");
        }
    };

    if (loading) return <p style={{ color: '#fbbf24' }}>Loading contributions...</p>;
    if (error) return <p style={{ color: '#ef4444' }}>{error}</p>;

    return (
        <div style={{ marginTop: '40px', background: '#111', padding: '20px', borderRadius: '8px', color: 'white' }}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                Group Contributions
            </h3>

            {contributions.length === 0 ? (
                <p style={{ color: 'gray', fontStyle: 'italic' }}>No contributions found for this group.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                    {contributions.map(c => (
                        <div key={c.id} style={{ 
                            background: '#222', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            borderLeft: c.status === 'CONFIRMED' ? '4px solid #10b981' : 
                                        c.status === 'MISSED' ? '4px solid #ef4444' : '4px solid #f59e0b',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            {/* Left Side: Contribution Details */}
                            <div>
                                <strong style={{ fontSize: '1.1em' }}>{c.member?.user?.email || 'Unknown Member'}</strong>
                                <div style={{ marginTop: '5px' }}>Amount: <span style={{ color: '#10b981' }}>R{c.amount}</span></div>
                                <div style={{ fontSize: '0.9em', color: 'gray' }}>Due: {new Date(c.date).toLocaleDateString()}</div>
                                
                                {/* ACCEPTANCE TEST 2: The Audit Trail */}
                                {c.status !== 'PENDING' && c.treasurer && (
                                    <div style={{ marginTop: '8px', fontSize: '0.8em', color: '#9ca3af', fontStyle: 'italic' }}>
                                        {c.status === 'CONFIRMED' ? 'Verified' : 'Marked Missed'} by: {c.treasurer.user?.email} <br/>
                                        On: {new Date(c.updatedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Status and Treasurer Actions */}
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ 
                                    marginBottom: '10px', 
                                    fontWeight: 'bold',
                                    color: c.status === 'CONFIRMED' ? '#10b981' : c.status === 'MISSED' ? '#ef4444' : '#f59e0b'
                                }}>
                                    {c.status}
                                </div>

                                {/* ACCEPTANCE TEST 3: Only show buttons to Treasurers/Admins */}
                                {isTreasurerOrAdmin && c.status === 'PENDING' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleVerify(c.id, 'CONFIRMED')}
                                            style={{ background: '#059669', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Confirm
                                        </button>
                                        <button 
                                            onClick={() => handleVerify(c.id, 'MISSED')}
                                            style={{ background: '#dc2626', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Missed
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}