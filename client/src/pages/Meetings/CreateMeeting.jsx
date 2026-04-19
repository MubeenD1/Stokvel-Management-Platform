import { useState } from "react";
import { auth } from "../../firebase"; 
import { useParams } from "react-router-dom";
import "./CreateMeeting.css";

export default function CreateMeeting({ onSubmit }) {

  const { id } = useParams(); 
  console.log("groupId:", id);

  const [agenda, setAgenda] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
   const[error,setError] = useState('');
    const[success, setSuccess] = useState('');
    const[loading, setLoading] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location || !date || !agenda) {
        setError("Please complete all fields");
        return;
    }

    const now = new Date();
    if (new Date(date) < now) {
        setError("Invalid Date");
        return;
    }

    if (!auth.currentUser) {
        setError("You must be logged in to create a meeting");
        return;
    }


    setLoading(true);

    try {
        const token = await auth.currentUser.getIdToken();

        const data = {
        rAgenda: agenda,
        rLocation: location,
        rDate: date,
        groupId: id,
        };

        const response = await fetch(
        `http://localhost:3000/api/groups/${id}/create-meeting`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        }
        );
        console.log(response);
        if (!response.ok) {
        throw new Error("Failed to create meeting");
        }

        const result = await response.json();
        console.log("Meeting created:", result);

        if (onSubmit) onSubmit(data);
        setSuccess("Meeting Created Successfully");
        setAgenda("");
        setLocation("");
        setDate("");
        setError("");
    } catch (error) {
        console.error("Error creating meeting:", error);
        setError("Failed to create meeting");
    } finally {
        setLoading(false);
    }
};

  return (
    <form id="meeting-form" onSubmit={handleSubmit}>
      <h2 id="form-title">Enter Meeting Details</h2>

    {success && <p className="success-msg">{success}</p>}

    {error && <p className="error-msg">{error}</p>}

      <label htmlFor="agenda">Agenda</label>
      <textarea
        id="agenda"
        value={agenda}
        onChange={(e) => setAgenda(e.target.value)}
        placeholder="Enter meeting agenda..."
        rows={4}
      />

      <label htmlFor="date-time">Date & Time</label>
      <input
        id="date-time"
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <label htmlFor="loc">Location</label>
      <input
        id="loc"
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Enter meeting location"
      />

      <button id="submit-btn" type="submit">
        {loading ? 'Creating...' : 'Create Meeting'}
      </button>
    </form>
  );
}