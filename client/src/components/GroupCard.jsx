import { updateCurrentUser } from "firebase/auth";
import { useAuth } from '../context/AuthContext';

function GroupCard({ group, onViewSettings, onCardClick}){
    const { currentUser } = useAuth();
    const isAdmin = group.role === 'ADMIN';
    return(
        <div style = {styles.card}
             onClick ={() => onCardClick?.(group)}    
        >
            <h3 style = {styles.name}>{group.name}</h3>
            <p style = {styles.role}>Role:{group.role}</p>
            <p style = {styles.joined}>
                Joined:{new Date(group.joinedAt).toLocaleDateString()}
            </p>
        </div>

    );
}
const styles ={
    card : {
        backgroundColor : '#ffffff',
        padding : '25px',
        borderRadius:'10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection : 'column',
        gap : '10px',
    },
    button: {
    padding: '12px 24px',
    backgroundColor: '#206663',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '8px',
  },
    name : {
        fontSize : '15px',
        fontWeight: 'bold',
        color : '#1a1a1a',
        margin : 0,
    },
    role: {
        fontSize : '15px',
        color : '#2e7d32',
        margin : 0,
        textTransform : 'capitalize',
    },
    joined : {
        fontSize : '12px',
        color:'#999',
        margin: '0',
    },

};

export default GroupCard;