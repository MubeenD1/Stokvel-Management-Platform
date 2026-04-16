import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {auth} from '../firebase';

function JoinGroup(){
    const[inviteCode, setInviteCode] = useState('');
    const[error,setError] = useState('');
    const[success, setSuccess] = useState('');
    const[loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleJoinGroup(){
        //this will clear the previous messages 
        setError('');
        setSuccess('');

        //this will check that the user has entered a code 
        if(!inviteCode.trim()){
            setError('Please enter an invite code');
            return;

        }
        setLoading(true);

        //this will get the firebase token for the user and send the invite code to the backend
        try{
            const token = await auth.currentUser.getIdToken();

            const response = await fetch('http://localhost:3000/api/groups/join',{
                method : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body : JSON.stringify({inviteCode}),
            });

            const data = await response.json();

            //this will display the error message that has been received from the backend 
            if(!response.ok){
                setError(data.error || 'Failed to join group');
                return;
            }

            //this will show that the attempt was successful and then be redirected to the dashboard
            setSuccess(`Successfully joined ${data.group.name}!`);
            setTimeout(() => {
                navigate('/home');
            },1500);

        }catch(err){
            setError('Something went wrong. Please try again.');
            console.error('joinGroup error:', err);
        }finally{
            setLoading(false);
        }
    }
return(
    <div style = {styles.container}>
        <div style ={styles.card}>
       <h2 style ={styles.title}>Join a stokvel Group</h2>
        <p style ={styles.subtitle}>Enter the invite code which has been sent to you by your group admin</p>
        
    <input 
        style ={styles.input}
        type = "text"
        placeholder='Enter the invite code'
        value = {inviteCode}
        onChange = {(e) => setInviteCode(e.target.value.toUpperCase())}
        maxLength={8}
        />

        {/*error message*/}
        {error && <p style ={styles.error}>{error}</p>}

        {/*sucess message*/}
        {success && <p style ={styles.success}>{success}</p>}

        <button
            style = {styles.button}
            onClick = {handleJoinGroup}
            disabled = {loading}
            >
        {loading ? 'Joining...' : 'Join Group'}
        </button>

        <button
            style = {styles.backButton}
            onClick = {() => navigate('/home')}
            >
                Back to Home
            </button>
            </div>
            </div>
        
);
}

const styles = {
    container: {
        display : 'flex',
        justifyContent: 'center',
        alignItems : 'center',
        minHeight : '100vh',
        backgroundColor : '#f4f6f8',
    },

    card : {
        backgroundColor : '#ffffff',
        padding : '40px',
        borderRadius : '12px',
        boxShadow : '0 4px 12px rgba(0,0,0,0,1)',
        width : '100%',
        maxWidth : '400px',
        display : 'flex',
        flexDirection : 'column',
        gap : '16px',

    },
    title : {
        fontSize : '24px',
        fontWeight : 'bold',
        color : '#1a1a1a',
        margin : 0,
    },
    subtitle: {
        fontSize : '14px',
        color : '#666',
        margin : 0,

    },
    input : {
        padding : '12px',
        fontSize : '18px',
        letterSpacing : '4px',
        border : '2px solid #ddd',
        borderRadius : '8px',
        textAlign : 'center',
        textTransform : 'uppercase',
        outline : 'none',
    },
    button : {
        padding : '12px',
        backgroundColor : '#2e7d32',
        color : '#ffffff',
        border : 'none',
        borderRadius : '8px',
        fontSize : '16px',
        fontWeight : 'bold',
        cursor : 'pointer',
    },

    backButton : {
        padding : '12px',
        backgroundColor : 'transparent',
        color : '2e7d32',
        border : '2px solid #2e7d32',
        borderRadius : '8px',
        fontSize : '16px',
        cursor : 'pointer',
    },
    error: {
        color : '#c62828',
        fontSize : '14px',
        margin : 0,
    },
    success : {
        color : '2e7d32',
        fontSize : '14px',
        margin : 0,
    },
};

export default JoinGroup;

