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