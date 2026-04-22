import React, { useState } from 'react';
import './InviteManager.css';
import { useParams } from 'react-router-dom';
import { auth } from '../../firebase';

const InviteManager = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const {id} = useParams();

  const generateCode = async () => {
    setLoading(true);
    
    try {
      //const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/invite`, {
      
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`http://localhost:3000/api/groups/${id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
      const data = await response.json();
      if (data.inviteCode) setInviteCode(data.inviteCode);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
    
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset "Copied" text after 2s
  };

  return (
    <div className="invite-card">
      <h3>Invite New Members</h3>
      <p className="invite-desc">Generate a unique code to share with people you want to join this Stokvel.</p>
      
      {!inviteCode ? (
        <button className="gen-btn" onClick={generateCode} disabled={loading}>
          {loading ? 'Generating...' : 'Create Invite Code'}
        </button>
      ) : (
        <div className="code-container">
          <div className="code-box">
            <span className="label">YOUR CODE:</span>
            <span className="code-text">{inviteCode}</span>
          </div>
          <button className="copy-btn" onClick={copyToClipboard}>
            {isCopied ? '✅ Copied!' : 'Copy Code'}
          </button>
          <button className="reset-link" onClick={() => setInviteCode('')}>
            Generate a different code
          </button>
        </div>
      )}
    </div>
  );
};

export default InviteManager;