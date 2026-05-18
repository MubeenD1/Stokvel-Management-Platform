import { useParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

import AdminUpcomingView from '../../components/AdminUpcomingView';
import MemberPastPayouts from '../../components/MemberPastPayouts';

export default function PayoutsPage() {
    const { id } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [userToken, setUserToken] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setCurrentUser(firebaseUser); 
            
            if (firebaseUser && id) {
                try {
                    const token = await firebaseUser.getIdToken();
                    setUserToken(token);
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        const members = data.groupMembers || [];
                        const myMembership = members.find(m =>
                            m.user?.firebaseId === firebaseUser.uid ||
                            m.user?.email?.toLowerCase() === firebaseUser.email?.toLowerCase()
                        );
                        
                        setMyRole(myMembership?.role || 'MEMBER');
                    } else {
                        setError('Failed to fetch group data');
                    }
                } catch (err) {
                    setError('Server connection error');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });
        
        return () => unsubscribe();
    }, [id]);

    if (loading) return <p style={{ padding: '30px', color: 'white', background: '#111', minHeight: '100vh' }}>Loading Payouts...</p>;
    if (error) return <p style={{ color: "orange", padding: '30px' }}>{error}</p>;

    if (myRole === 'ADMIN' || myRole === 'TREASURER') {
        return <AdminUpcomingView groupId={id} />;
    } else {
        return <MemberPastPayouts groupId={id} userToken={userToken} />;
    }
}