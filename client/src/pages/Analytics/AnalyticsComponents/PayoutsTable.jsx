import React from 'react';

const PayoutsTable = ({ data = [], loading = false }) => {
  // 1. Inline Styles for clean layout matching your design footprint
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
      
      // Updated mappings for explicit Payout status tags
      const cleanStatus = status ? status.toUpperCase() : '';
      if (cleanStatus === 'COMPLETED') { bg = '#d4edda'; color = '#155724'; } // Green
      if (cleanStatus === 'PENDING') { bg = '#fff3cd'; color = '#856404'; }   // Yellow
      if (cleanStatus === 'FAILED') { bg = '#f8d7da'; color = '#721c24'; }    // Red

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
            <th style={styles.th}>Payout Amount</th>
            <th style={styles.th}>Payout Date</th>
            <th style={styles.th}>Payout Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={styles.message}>Loading report data...</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan="4" style={styles.message}>No records found matching the filters.</td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={row.id || index} 
                style={styles.row}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* 1. Email */}
                <td style={styles.td}>{row.user?.email || row.email || 'N/A'}</td>
                
                {/* 2. Payout Amount */}
                <td style={{...styles.td, fontWeight: '500'}}>{formatAmount(row.amount || row.payoutAmount)}</td>
                
                {/* 3. Payout Date (supports standard fields, fallback to createdAt) */}
                <td style={styles.td}>{formatDate(row.payoutDate || row.date || row.createdAt)}</td>
                
                {/* 4. Payout Status Badge */}
                <td style={styles.td}>
                  <span style={styles.statusBadge(row.status || row.payoutStatus)}>
                    {row.status || row.payoutStatus || 'UNKNOWN'}
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

export default PayoutsTable;