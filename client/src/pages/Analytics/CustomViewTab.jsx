import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../../firebase';
import './CustomView.css';

const CustomView = () => {
  const { id } = useParams();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [member, setMember] = useState('all'); // Holds a single string value now
  const [type, setType] = useState('Contribution');
  const [status, setStatus] = useState('all'); // Fixed to track a single string like your useEffect setup
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Members state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Fetch group members using the same pattern
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && id) {
        setMembersLoading(true);
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const result = await response.json();
          if (response.ok) {
            setMembers(result.groupMembers || []);
          } else {
            setError('Failed to fetch members');
          }
        } catch (err) {
          setError('Server connection error');
        } finally {
          setMembersLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [id]);

  // Reset status when type changes
  useEffect(() => {
    setStatus('all');
  }, [type]);

  const handleApplyFilters = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      const endpoint = type === 'Contribution'
        ? '/api/analytics/contributions'
        : '/api/analytics/payouts';

      const params = new URLSearchParams({
        startDate,
        endDate,
        memberId: member, // Sends 'all' or the single selected member ID
        statuses: status,
        groupId: id
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="custom-view">
      <h2 className="custom-view__title">Custom Report</h2>

      <form onSubmit={handleApplyFilters} className="custom-view__form">

        {/* Date Range */}
        <div className="custom-view__group">
          <span className="custom-view__label">Date Range</span>
          <div className="custom-view__date-range">
            <input
              type="date"
              className="custom-view__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <span className="custom-view__arrow">→</span>
            <input
              type="date"
              className="custom-view__input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Member — Dropdown Checkbox list */}
        <div className="custom-view__group">
        <label className="custom-view__label">Select Members</label>
        <div style={{ 
            border: '1px solid #ced4da', 
            borderRadius: '4px', 
            maxHeight: '120px', 
            overflowY: 'auto', 
            padding: '8px',
            backgroundColor: '#fff'
        }}>
            {/* All Members Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
            <input 
                type="checkbox" 
                checked={member.includes('all')}
                onChange={() => setMember(['all'])} 
            />
            <span>All Members</span>
            </label>

            {/* Individual Checkboxes */}
            {members.map((m) => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', cursor: 'pointer' }}>
                <input 
                type="checkbox" 
                checked={member.includes(m.id) && !member.includes('all')}
                onChange={() => {
                    if (member.includes('all')) {
                    // If replacing "all", start a fresh list with just this ID
                    setMember([m.id]);
                    } else if (member.includes(m.id)) {
                    // Uncheck item
                    const updated = member.filter(id => id !== m.id);
                    setMember(updated.length === 0 ? ['all'] : updated);
                    } else {
                    // Check item
                    setMember([...member, m.id]);
                    }
                }} 
                />
                <span>{m.user?.email ?? m.id}</span>
            </label>
            ))}
        </div>
        </div>

        {/* Type */}
        <div className="custom-view__group">
          <label className="custom-view__label">Type</label>
          <select
            className="custom-view__input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="Contribution">Contribution</option>
            <option value="Payout">Payout</option>
          </select>
        </div>

        {/* Status */}
        <div className="custom-view__group">
          <label className="custom-view__label">Status</label>
          <select
            className="custom-view__input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="PENDING">Pending</option>

            {type === 'Contribution' && (
              <>
                <option value="CONFIRMED">Confirmed</option>
                <option value="MISSED">Missed</option>
              </>
            )}

            {type === 'Payout' && (
              <>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </>
            )}
          </select>
        </div>

        <button type="submit" className="custom-view__button" disabled={loading}>
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>

      </form>

      {error && <p className="custom-view__error">{error}</p>}

      {/* Results */}
      {data && (
        <div className="custom-view__results">
          {/* your table and charts here */}
        </div>
      )}
    </div>
  );
};

export default CustomView;