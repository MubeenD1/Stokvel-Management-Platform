import React from 'react';

const ContributionsTable = ({ data = [], loading = false }) => {
  // 1. Inline Styles for clean layout
  const styles = {
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      marginTop: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
    },
    th: {
      backgroundColor: '#f8f9fa',
      color: '#495057',
      fontWeight: '600',
      padding: '12px 16px',
      borderBottom: '2px solid #dee2e6',
      textTransform: 'uppercase',
      fontSize: '12px',
      letterSpacing: '0.5px',
    },
    td: {
      padding: '14px 16px',
      borderBottom: '1px solid #dee2e6',
      color: '#212529',
    },
    row: {
      transition: 'background-color 0.2s',
    },
    statusBadge: (status) => {
      let bg = '#e2e3e5';
      let color = '#383d41';
      
      if (status === 'CONFIRMED') { bg = '#d4edda'; color = '#155724'; }
      if (status === 'PENDING') { bg = '#fff3cd'; color = '#856404'; }
      if (status === 'LATE' || status === 'MISSED') { bg = '#f8d7da'; color = '#721c24'; }

      return {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        backgroundColor: bg,
        color: color,
      };
    },
    message: {
      padding: '24px',
      textAlign: 'center',
      color: '#6c757d',
      fontStyle: 'italic',
    }
  };

  // Helper to format date string cleanly
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // Helper to format currency/amount
  const formatAmount = (amount) => {
    return typeof amount === 'number' 
      ? `R ${amount.toFixed(2)}` 
      : amount || 'R 0.00';
  };

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Contribution Date</th>
            <th style={styles.th}>Confirmed By</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" style={styles.message}>Loading report data...</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan="5" style={styles.message}>No records found matching the filters.</td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={row.id || index} 
                style={styles.row}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Email (with fallback if user nested object exists) */}
                <td style={styles.td}>{row.user?.email || row.email || 'N/A'}</td>
                
                {/* Amount */}
                <td style={styles.td} style={{...styles.td, fontWeight: '500'}}>{formatAmount(row.amount)}</td>
                
                {/* Contribution Date */}
                <td style={styles.td}>{formatDate(row.contributionDate || row.createdAt)}</td>
                
                {/* Confirmed By */}
                <td style={styles.td}>{row.confirmedBy || '—'}</td>
                
                {/* Status Badge */}
                <td style={styles.td}>
                  <span style={styles.statusBadge(row.status)}>
                    {row.status || 'UNKNOWN'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ContributionsTable;