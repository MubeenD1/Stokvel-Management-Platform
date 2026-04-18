import { useParams,useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

export default function GroupPage() {
    const { id } = useParams(); // or { name }

    const [members, setMembers] = useState([]);
    const[error,setError] = useState('');
    const[loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect (()=>{
        async function getThisGroup() {
            setLoading(true);
            try{
            const token = await auth.currentUser.getIdToken();

            const response = await fetch(`http://localhost:3000/api/groups/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                    setError('Failed to this groups');
                    return;
            }
                console.log(data);
                setMembers(data.groupMembers);

            } catch (err) {
                setError('Something went wrong. Please try again.');
                console.error('fetchGroups error:', err);
            } finally {
                setLoading(false);
            }

        }
        if (id) getThisGroup();
    },[id]);

   return (
    <div className="members-container">
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="members-grid">
            {members.map((m) => (
                <div className="member-card" key={m.id}>
                    <div className="member-info">
                        {m.user.email}
                    </div>

                    <button className="member-btn">
                        Assign Role
                    </button>
                </div>
            ))}
        </div>
    </div>
);
}