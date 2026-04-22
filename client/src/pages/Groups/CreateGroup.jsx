import { auth } from "../../firebase"; // adjust path if needed
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateGroup() {
    const [name, setName] = useState("");
    const[error,setError] = useState('');
    const[success, setSuccess] = useState('');
    const[loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

   if (!name.trim() || name.trim().length < 2 || name.trim().length > 20) {
            setError('Please enter a name of 2 up to 20 characters');
            return;

        }
    setLoading(true);

    try {
      
      if (!auth.currentUser) {
        setError("You must be logged in to create a group");
        setLoading(false);
        return;
        }

        const token = await auth.currentUser.getIdToken();

      //const response = await fetch(import.meta.env.VITE_API_URL + "/api/groups/create", {
            const response = await fetch("http://localhost:3000/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
    });

    const data = await response.json();
      if (response.ok) {
    setSuccess("Group created successfully! Redirecting ...");
    setName("");

    console.log("data=", data);

    await delay(1000);

    navigate(`/groups/${data.group.id}/settings`, {
        state: { message: "Configure the group settings" }
    });

    return; 
    }else {
        setError(data.message || "Failed to create group");
    }

      console.log( data);
    } catch (error) {
      console.error("Error creating group:", error);
    }finally{
        setLoading(false);
    }
  };

  return (
    <div style = {styles.container}>
        <div style ={styles.card}>
       <h2 style ={styles.title}>Create a Stokvel Group</h2>
        <p style ={styles.subtitle}>Enter an Appropriate Group Name</p>
        
    <input 
        style ={styles.input}
        type = "text"
        placeholder='Enter Your Group Name'
        value = {name}
        onChange = {(e) => setName(e.target.value)}
        minLength={2}
        maxLength={20}
        />

        {/*error message*/}
        {error && <p style ={styles.error}>{error}</p>}

        {/*sucess message*/}
        {success && <p style ={styles.success}>{success}</p>}

        <button
            style = {styles.button}
            onClick = {handleCreate}
            disabled = {loading}
            >
        {loading ? 'Creating...' : 'Create Group'}
        </button>

        <button
            style = {styles.backButton}
            onClick = {() => navigate('/home')}
            >
                Back to Home
            </button>
            </div>
            </div>
        
  );
}
const styles = {
    container: {
        display : 'flex',
        justifyContent: 'center',
        alignItems : 'center',
        minHeight : '100vh',
        backgroundColor : '#f4f6f8',
    },

    card : {
        backgroundColor : '#ffffff',
        padding : '40px',
        borderRadius : '12px',
        boxShadow : '0 4px 12px rgba(0,0,0,0,1)',
        width : '100%',
        maxWidth : '400px',
        display : 'flex',
        flexDirection : 'column',
        gap : '16px',

    },
    title : {
        fontSize : '24px',
        fontWeight : 'bold',
        color : '#1a1a1a',
        margin : 0,
    },
    subtitle: {
        fontSize : '14px',
        color : '#666',
        margin : 0,

    },
    input : {
        padding : '12px',
        fontSize : '18px',
        letterSpacing : '4px',
        border : '2px solid #ddd',
        borderRadius : '8px',
        textAlign : 'center',
        outline : 'none',
    },
    button : {
        padding : '12px',
        backgroundColor : '#2e7d32',
        color : '#ffffff',
        border : 'none',
        borderRadius : '8px',
        fontSize : '16px',
        fontWeight : 'bold',
        cursor : 'pointer',
    },

    backButton : {
        padding : '12px',
        backgroundColor : 'transparent',
        color : '2e7d32',
        border : '2px solid #2e7d32',
        borderRadius : '8px',
        fontSize : '16px',
        cursor : 'pointer',
    },
    error: {
        color : '#c62828',
        fontSize : '14px',
        margin : 0,
    },
    success : {
        color : '#2e7d32',
        fontSize : '14px',
        margin : 0,
    },
};


