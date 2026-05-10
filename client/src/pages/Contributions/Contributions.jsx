import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase';
import MyContributions from './MyContributions';
import ContributionsSection from './ContributionsSection';

function Contributions() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role');
    const isTreasurerOrAdmin = role === 'TREASURER' || role === 'ADMIN';

    const [members, setMembers] = useState([]);
    const [groupMemberId, setGroupMemberId] = useState(null);
    const [amount, setAmount] = useState(null);

    useEffect(() => {
        const fetchGroup = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser || !id) return;
            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(import.meta.env.VITE_API_URL + `/api/groups/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setMembers(data.groupMembers || []);
                    setAmount(data.group?.contributionAmount || null);

                    const me = data.groupMembers?.find(m =>
                        m.user?.firebaseId === currentUser.uid ||
                        m.user?.email?.toLowerCase() === currentUser.email?.toLowerCase()
                    );
                    setGroupMemberId(me?.id || null);
                }
            } catch (err) {
                console.error('Failed to fetch group:', err);
            }
        };
        fetchGroup();
    }, [id]);

    return isTreasurerOrAdmin
        ? <ContributionsSection
                groupId={id}
                myRole={role}
                members={members}
                groupMemberId={groupMemberId}
                amount={amount}
            />
        : <MyContributions />;
}

export default Contributions;
