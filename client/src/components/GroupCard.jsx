import { updateCurrentUser } from "firebase/auth";

function GroupCard({group,onViewSettings}){
    const isAdmin = currentUser.role === 'Admin';
    return(
        <div style = {styles.card}>
            <h3 style = {styles.name}>{group.name}</h3>
            <p style = {styles.role}>Role:{group.role}</p>
            <p style = {styles.joined}>
                Joined:{new Date(group.joinedAt).toLocaleDateString()}
            </p>
            <button
                style={styles.button}
                onClick = {() => onViewSettings?.(group)}
            >
                View Settings
            </button>
        </div>

    );
}
const styles ={
    card : {
        backgroundColor : '#ffffff',
        padding : '25px',
        borderRadius:'10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0,1)',
        display: 'flex',
        flexDirection : 'column',
        gap : '10px',
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