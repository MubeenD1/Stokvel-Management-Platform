import "./MeetingsPage.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from '../../firebase';
import MeetingCard from "../../components/MeetingCard";
export default function MeetingsPage(){
    const navigate = useNavigate();
    const { id } = useParams(); 


    const [meetings, setMeetings] = useState([]);
        const[error,setError] = useState('');
        const[loading, setLoading] = useState(false);
    
        useEffect (()=>{
            async function getThisGroupsMeetings() {
                setLoading(true);
                try{
                const token = await auth.currentUser.getIdToken();
                

                const response = await fetch(`http://localhost:3000/api/groups/${id}/meetings`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
    
               
                if (!response.ok) {
                    const errData = await response.json();

                    if (response.status === 403) {
                        setError(errData.error || "You are not authorized to view these meetings");
                    } else {
                        setError(errData.error || "Failed to fetch meetings");
                    }

                    return;
                }
                 const data = await response.json();
                    console.log(data);
                    setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
    
                } catch (err) {
                    setError('Something went wrong. Please refresh the page.');
                    console.error('fetchMeetings error:', err.error);
                } finally {
                    setLoading(false);
                }
    
            }
            if (id) getThisGroupsMeetings();
        },[id]);

   return (
    <div className="meeting">
        <button className="floating-btn" onClick={() => navigate(`/groups/${id}/meetings/create`)}>+</button>

        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
    </div>
    );
}




