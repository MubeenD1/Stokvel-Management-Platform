export default function GroupSettingsModal({group,onClose}){
    if(!group){
        return null;
    }
    const handleSave = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

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
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({contributionAmount: group?.contributionAmount || '',nextMeetingDate: group?.nextMeetingDate || '',});
    return (
        <div style = {styles.overlay}>
            <div style = {styles.modal}>
                <h2>{group.name} Settings</h2>

                <p> Contribution: {group.contributionAmount}</p>
                <p> Payout Order: {group.payoutOrder}</p>
                <p> Meeting Frequency: {group.MeetingFrequency}</p>
                {isAdmin && !isEditing && (
                    <button> onClick = {() => setIsEditing(true)}
                        Edit Settings
                    </button>
                )}
                {isEditing && (
                    <div>
                        <input
                        type="number"
                        value={formData.contributionAmount}
                        onChange={(e) =>
                            setFormData({ ...formData, contributionAmount: e.target.value })
                        }
                        placeholder="Contribution Amount"
                        />
                        <h4>Payout Order</h4>
                        <input
                            type="text"
                            value={formData.payoutOrder}
                            onChange={(e) =>
                                setFormData({ ...formData, payoutOrder: e.target.value })
                            }
                            placeholder="e.g. Simphiwe,Mubeen ,Thabiso"
                        />
                        
                        <select
                        value={formData.meetingFrequency}
                        onChange={(e) =>
                            setFormData({ ...formData, meetingFrequency: e.target.value })
                        }
                        >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        </select>
                    </div>
                )}
                {isEditing && (
                    <button onClick={handleSave}>
                        Save Changes
                    </button>
                )}
                <button onClick = {onClose}>Close</button>
            </div>
        </div>
    );
}