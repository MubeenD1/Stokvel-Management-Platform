<<<<<<< Updated upstream
import "./Group.css";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";

function GroupCard({ group , onClick }) {
  return (
    <div className="group-card" onClick={onClick}>
      <h3>{group.name}</h3>
    </div>
  );
}

export default function Groups() {
  const [myGroups, setMyGroups] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);

      try {
        const user = auth.currentUser;

        if (!user) {
          setError("You must be logged in");
          return;
        }

        const token = await user.getIdToken();

        const res = await fetch("http://localhost:3000/api/groups/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setMyGroups(data.groups || []);
        console.log(data);
      } catch (err) {
        setError("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <div className="feed">
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {myGroups.length === 0 && !loading && !error && (
        <p>You are not in any groups</p>
      )}

      {myGroups.map((group) => (
        <GroupCard
         key={group.id} 
        group={group}
        onClick={() => console.log("Clicked group:", group.id ,"\ngroup name :", group.name)}
        />
      ))}
    </div>
  );
}
=======
import "./Group.css"
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';
import GroupCard from '../../components/GroupCard';
import GroupSettingsModal from '../../components/GroupSettingsModal';
export default function Groups(){
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
     return (
        <div style={styles.container}>
                <h1 style={styles.title}>Groups</h1>
                {/* loading state */}
            {loading && <p style={styles.message}>Loading your groups...</p>}

            {/* error state */}
            {error && <p style={styles.error}>{error}</p>}

            {/* empty state */}
            {!loading && !error && groups.length === 0 && (
                    <p style={styles.emptyText}>You are not part of any groups yet.</p>
            )};
            

           

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

>>>>>>> Stashed changes
