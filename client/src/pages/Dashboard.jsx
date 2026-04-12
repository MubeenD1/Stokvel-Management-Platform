import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import GroupCard from '../components/GroupCard';
import GroupSettingsModal from '../components/GroupSettingsModal';

function Dashboard() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [selectedGroup, setSelectedGroup] = useState(null);
    useEffect(() => {
        async function fetchGroups() {
            try {
                const token = await auth.currentUser.getIdToken();

                const response = await fetch('http://localhost:3000/api/groups', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    setError('Failed to load groups');
                    return;
                }

                setGroups(data.groups);

            } catch (err) {
                setError('Something went wrong. Please try again.');
                console.error('fetchGroups error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchGroups();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>My Dashboard</h1>
                <div style={styles.headerButtons}>
                    <p style={styles.welcome}>Welcome, {currentUser?.email}</p>
                    <button
                        style={styles.createButton}
                        onClick={() => navigate('/create')}
                    >
                        Create Group
                    </button>
                    <button
                        style={styles.joinButton}
                        onClick={() => navigate('/join')}
                    >
                        + Join Group
                    </button>
                    <button
                        style={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* loading state */}
            {loading && <p style={styles.message}>Loading your groups...</p>}

            {/* error state */}
            {error && <p style={styles.error}>{error}</p>}

            {/* empty state */}
            {!loading && !error && groups.length === 0 && (
                <div style={styles.emptyState}>
                    <p style={styles.emptyText}>You are not part of any groups yet.</p>
                    <button
                        style={styles.joinButton}
                        onClick={() => navigate('/join')}
                    >
                        Join a Group
                    </button>
                </div>
            )}

            {/* groups list */}
            <div style={styles.groupsGrid}>
                {groups.map((group) => (
                    <GroupCard key={group.id} group={group} onViewSettings={(group)=> setSelectedGroup(group)}/>
                ))}
            </div>
            <GroupSettingsModal
                    group = {selectedGroup}
                    onClose = {() => setSelectedGroup(null)}
            />
        </div>
    );
}

const styles = {
    container: {
        padding: '32px',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    headerButtons: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: 0,
    },
    welcome: {
        fontSize: '14px',
        color: '#666',
        margin: 0,
    },
    joinButton: {
        padding: '12px 24px',
        backgroundColor: '#2e7d32',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    createButton:{
        padding: '12px 24px',
        backgroundColor: '#206663',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    logoutButton: {
        padding: '12px 24px',
        backgroundColor: 'transparent',
        color: '#c62828',
        border: '2px solid #c62828',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    groupsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
    },
    message: {
        color: '#666',
        fontSize: '16px',
    },
    error: {
        color: '#c62828',
        fontSize: '16px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        marginTop: '65px',
    },
    emptyText: {
        color: '#666',
        fontSize: '20px',
    },
};

export default Dashboard;









