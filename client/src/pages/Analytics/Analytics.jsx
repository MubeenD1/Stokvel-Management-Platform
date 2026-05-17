import React, { useState } from 'react';
import CustomView from './CustomView';
import ComplianceReport from './ComplianceReport';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('compliance');

  const styles = {
    container: { fontFamily: 'Arial, sans-serif', padding: '20px' },
    tabList: { display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '15px' },
    tabButton: (isActive) => ({
      padding: '10px 20px',
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      borderBottom: isActive ? '3px solid #109910' : '3px solid transparent',
      color: isActive ? '#086e11' : '#666',
      fontWeight: isActive ? 'bold' : 'normal',
      outline: 'none',
    }),
    contentArea: { padding: '20px' }
  };

  return (
    <div style={styles.container}>

      {/* Tab Navigation Headers */}
      <div style={styles.tabList}>
        <button
          style={styles.tabButton(activeTab === 'compliance')}
          onClick={() => setActiveTab('compliance')}
        >
          Contribution Compliance
        </button>
        <button
          style={styles.tabButton(activeTab === 'custom')}
          onClick={() => setActiveTab('custom')}
        >
          Custom View
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.contentArea}>
        {activeTab === 'compliance' && <ComplianceReport />}
        {activeTab === 'custom' && <CustomView />}
      </div>

    </div>
  );
};

export default Analytics;