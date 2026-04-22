import { useState } from "react";
import "./MeetingCard.css";
import { replace, useParams } from "react-router-dom";
import { auth } from '../firebase';

export default function MeetingCard({ meeting , role}) {
  const [showEditor, setShowEditor] = useState(false);
  const [minutes, setMinutes] = useState(meeting.minutes || "");
  const [draft, setDraft] = useState(minutes);
  const [error, setError] = useState("");

  const {id } = useParams();
  const handleSave = async () => {
  try {

    if(!draft){
        setError("Cannot add empty minutes");
        return;
    }
    if (draft.length > 500){
        setError("500 character limit exceeded")
    }
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`http://localhost:3000/api/groups/${id}/meetings/${meeting.id}/minutes`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ minutes: draft }),
    });

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 403) {
        setError("You are not authorized to add minutes. Request to be a treasurer or admin for one of your admins");
      } else {
        setError(err.error || "Failed to save minutes");
      }
      return;
    }

    setMinutes(draft);
    setShowEditor(false);
    setError("");
  } catch (err) {
    console.error("handleSave error:", err);
    setError("Something went wrong, please try again");
  }
};

  return (
    <div className="meeting-card">
      {role !== "MEMBER" && (
      <button
        className="edit-btn"
        onClick={() => setShowEditor(!showEditor)}
      >
        Edit minutes
      </button>
      )}
      

      <h2 className="meeting-agenda">{meeting.agenda}</h2>

      <div className="meeting-details">
        <div className="meeting-row">
          <span className="label">Date</span>
          <span>{new Date(meeting.date).toLocaleDateString()}</span>
        </div>
        <div className="meeting-row">
          <span className="label">Time</span>
          <span>{new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="meeting-row">
          <span className="label">Location</span>
          <span>{meeting.location}</span>
        </div>
        <div className="meeting-row">
          <span className="label">Minutes</span>
          <span className={minutes ? "" : "empty"}>
            {minutes || "No minutes yet"}
          </span>
        </div>
      </div>

        {showEditor && (
            <div className="minutes-editor">
            {error && <p className="error">{error}</p>}
            <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add meeting minutes..."
            />
            <button onClick={handleSave}>Save</button>
            </div>
        )}
    </div>
  );
}