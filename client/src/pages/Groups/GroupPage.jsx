import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import ContributionsSection from '../../components/ContributionsSection';

export default function GroupPage() {
    const { id } = useParams();
    const [members, setMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null); // Safely tracks you
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setCurrentUser(firebaseUser); // Save to state immediately
            if (firebaseUser && id) {
                setLoading(true);
                try {
                    const token = await firebaseUser.getIdToken();
                    //const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${id}`, {
                                const response = await fetch(`http://localhost:3000/api/groups/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setMembers(data.groupMembers || []);
                    } else {
                        setError('Failed to fetch members');
                    }
                } catch (err) {
                    setError('Server connection error');
                } finally {
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, [id]);

    const handleRoleChange = async (mId, newRole) => {
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`http://localhost:3000/api/groups/${id}/members/${mId}/role`, {
            //const res = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${id}/members/${mId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setMembers(prev => prev.map(m => m.id === mId ? { ...m, role: newRole } : m));
                setEditingMemberId(null);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="members-container" style={{ padding: '30px', background: '#111', minHeight: '100vh', color: 'white' }}>
            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Stokvel Members</h2>
            
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "orange" }}>{error}</p>}

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {members.map((m) => {
                    // The safe "Is Me" check using our state
                    const isMe = currentUser && (
                        m.user?.firebaseId === currentUser.uid || 
                        m.user?.email?.toLowerCase() === currentUser.email?.toLowerCase()
                    );
                    return (
                        <div key={m.id} style={{ 
                            background: isMe ? '#1e3a8a' : '#222', // Blue for you, dark for others
                            border: isMe ? '2px solid #3b82f6' : '1px solid #333',
                            padding: '15px', 
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <strong style={{ fontSize: '1.1em' }}>{m.user?.email || "No Email"}</strong>
                                {isMe && <span style={{ marginLeft: '10px', color: '#60a5fa', fontSize: '0.8em' }}>(YOU)</span>}
                                <div style={{ opacity: 0.7, marginTop: '4px' }}>Current Role: {m.role}</div>
                            </div>

                            <div>
                                {isMe ? (
                                    <span style={{ fontSize: '0.8em', fontStyle: 'italic', color: '#9ca3af' }}>
                                        Admin (Protected)
                                    </span>
                                ) : editingMemberId === m.id ? (
                                    <select 
                                        defaultValue={m.role} 
                                        onChange={e => handleRoleChange(m.id, e.target.value)}
                                        style={{ background: '#444', color: 'white', padding: '5px', borderRadius: '4px' }}
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="TREASURER">Treasurer</option>
                                        <option value="MEMBER">Member</option>
                                    </select>
                                ) : (
                                    <button 
                                        onClick={() => setEditingMemberId(m.id)}
                                        style={{ padding: '6px 12px', cursor: 'pointer' }}
                                    >
                                        Change Role
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <ContributionsSection groupId={id} members={members} />
        </div>
        
    );
}