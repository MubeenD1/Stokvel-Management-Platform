import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useParams,useNavigate } from "react-router-dom";


export default function GroupSettingsModal(){
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [group, setGroup] = useState(null);   
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const[loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchGroup() {
            setLoading(true);
            try {
                const token = await currentUser.getIdToken();
                const response = await fetch(`http://localhost:3000/api/groups/${id}`, {
                    headers: {'Authorization': `Bearer ${token}`},
                });
                const data = await response.json();
                console.log('Fetched group data:', data);
                setGroup({ ...data.group, role: data.role });
                setFormData({
                    contributionAmount: data.contributionAmount,
                    meetingFrequency: data.meetingFrequency,
                });
            } catch (err) {
                console.error('Error fetching group:', err);
            }
            finally {
                setLoading(false);
            }
        }fetchGroup();

    }, [id]);
    if(!group){
        return null;
    }
   const isAdmin = group?.role === 'ADMIN';
    const handleSave = async () => {
  try {
    const token = await currentUser.getIdToken();

    const response = await fetch(`http://localhost:3000/api/groups/${group.id}/settings`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      }
    );

    if (!response.ok) throw new Error('Failed to update settings');

    const data = await response.json();

    alert('Settings updated successfully');

    setIsEditing(false);

  } catch (err) {
    console.error(err);
    alert('Error saving settings');
  }
};

    return (
   
            <div style = {styles.container}>
                <h2 style={styles.heading}>{group.name} Settings</h2>
                <div styles= {styles.card}>
                    <p style = {styles.info}><strong>Contribution: R</strong> {group.contributionAmount}</p>
                    <p style = {styles.info}><strong>Payout Order:</strong> {group.payoutOrder}</p>
                    <p style = {styles.info}><strong>Meeting Frequency:</strong> {group.meetingFrequency}</p>
                </div>

                {isAdmin && !isEditing && (
                    <button style = {styles.editButton} onClick = {() => setIsEditing(true)}>
                        Edit Settings
                    </button>
                )}
                {isEditing && (
                    <div style = {styles.card}>
                        <label style = {styles.label}>Contribution</label>
                        <input
                        style = {styles.input}
                        type="number"
                        value={formData.contributionAmount}
                        onChange={(e) =>
                            setFormData({ ...formData, contributionAmount: e.target.value })
                        }
                        placeholder="Contribution Amount (R)"
                        />
                        <label style = {styles.label}>Payout Order</label>
                        <input
                        style = {styles.input}
                            type="text"
                            value={formData.payoutOrder}
                            onChange={(e) =>
                                setFormData({ ...formData, payoutOrder: e.target.value })
                            }
                            placeholder="e.g. Simphiwe,Mubeen ,Thabiso"
                        />
                        <label style = {styles.label}>Meeting Frequency</label>
                        <select
                        style = {styles.select}
                        value={formData.meetingFrequency}
                        onChange={(e) =>
                            setFormData({ ...formData, meetingFrequency: e.target.value })
                        }
                        >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        </select>
                        <button style = {styles.saveButton} onClick={handleSave}>Save Changes</button>
                        <button style = {styles.cancelButton} onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                )}
               
            </div>
    
    );
}
// const styles = {
//     label: {
//     fontSize: '14px',
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//   },
//   input: {
//     padding: '12px',
//     borderRadius: '8px',
//     border: '1px solid #ddd',
//     fontSize: '14px',
//     outline: 'none',
//     width: '100%',
//     boxSizing: 'border-box',
//   },
//   Button: {
//     padding: '12px 24px',
//     backgroundColor: '#206663',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '8px',
//     fontWeight: 'bold',
//     cursor: 'pointer',
//     fontSize: '14px',
//     marginTop: '8px',
//   },
//      container: {
//     padding: '32px',
//     maxWidth: '1000px',
//     margin: '0 auto',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: '100vh',
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: '12px',
//     padding: '40px',
//     width: '100%',
//     maxWidth: '420px',
//     boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
//   },
//     modal: {
//         backgroundColor: '#fff',
//         borderRadius: '12px',
//         padding: '2rem',
//         maxWidth: '500px',
//         width: '100%',
//         boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//     },
//     heading: {
//         marginBottom: '1rem',
//         fontSize: '1.5rem',
//         color: '#1a1a1a',
//     },
//     info: {
//         fontSize: '0.95rem',
//         color: '#555',
//         marginBottom: '0.5rem',
//     },
//     input: {
//         display: 'block',
//         width: '100%',
//         padding: '0.5rem 0.75rem',
//         marginBottom: '1rem',
//         borderRadius: '8px',
//         border: '1px solid #ddd',
//         fontSize: '0.95rem',
//     },
//     select: {
//         display: 'block',
//         width: '100%',
//         padding: '0.5rem 0.75rem',
//         marginBottom: '1rem',
//         borderRadius: '8px',
//         border: '1px solid #ddd',
//         fontSize: '0.95rem',
//     },
//     editButton: {
//         backgroundColor: '#4f46e5',
//         color: '#fff',
//         border: 'none',
//         padding: '0.6rem 1.2rem',
//         borderRadius: '8px',
//         cursor: 'pointer',
//         marginTop: '1rem',
//     },
//     saveButton: {
//         backgroundColor: '#16a34a',
//         color: '#fff',
//         border: 'none',
//         padding: '0.6rem 1.2rem',
//         borderRadius: '8px',
//         cursor: 'pointer',
//         marginTop: '0.5rem',
//     },
// };
const styles = {
  container: {
    padding: "2.5rem",
    maxWidth: "640px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.5rem",
  },
  breadcrumb: {
    fontSize: "0.8rem",
    color: "#888",
    marginBottom: "0.25rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },
  successBanner: {
    backgroundColor: "#dcfce7",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    color: "#166534",
    fontSize: "0.9rem",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    marginBottom: "1.25rem",
  },
  cardTitle: {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888",
    marginBottom: "1rem",
    marginTop: 0,
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.6rem 0",
  },
  fieldLabel: {
    fontSize: "0.9rem",
    color: "#555",
  },
  fieldValue: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#1a1a1a",
    textTransform: "capitalize",
  },
  divider: {
    height: "1px",
    backgroundColor: "#f0f0f0",
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#333",
    marginBottom: "0.35rem",
    marginTop: "0.75rem",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "0.55rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    backgroundColor: "#fafafa",
  },
  select: {
    display: "block",
    width: "100%",
    padding: "0.55rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    backgroundColor: "#fafafa",
  },
  buttonRow: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1.25rem",
  },
  editButton: {
    backgroundColor: "#1a3a2a",
    color: "#fff",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  saveButton: {
    backgroundColor: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    color: "#333",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};