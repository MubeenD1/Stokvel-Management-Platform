import React, { useState } from 'react';
import './InviteManager.css';

const InviteManager = ({ groupId = "test-group-123", adminId = "admin-456" }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3000/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminId }), 
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