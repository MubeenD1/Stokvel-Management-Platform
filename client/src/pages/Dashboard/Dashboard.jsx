import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
  <div style={styles.container}>
    <h1 style={styles.title}>My Dashboard</h1>

    <p style={styles.welcome}>
      Welcome, {currentUser?.email}
    </p>

    <button
      style={styles.logoutButton}
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
);
}

const styles = {
  container: {
    padding: '32px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  title: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 auto',
  },

  welcome: {
    fontSize: '14px',
    color: '#666',
    margin: '0 auto',
  },

  logoutButton: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#c62828',
    border: '2px solid #c62828',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: 'fit-content',
    margin: '0 auto',
    display: 'block'
  },
};

export default Dashboard;