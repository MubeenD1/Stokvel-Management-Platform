import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../../firebase';
import './CustomView.css';
import ComplianceReport from './ComplianceReport';
import ContributionsTable from './AnalyticsComponents/ContributionsTable';
import ContributionPieChart from './AnalyticsComponents/ContributionPieChart';
import ContributionBarChart from './AnalyticsComponents/ContributionBarChart';
import PayoutsBarChart from './AnalyticsComponents/PayoutsBarChart';
import PayoutsPieChart from './AnalyticsComponents/PayoutsPieChart';
import PayoutsTable from './AnalyticsComponents/PayoutsTable';

const CustomView = () => {
  const { id } = useParams();
  const resultsRef = useRef(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [member, setMember] = useState(['all']);
  const [type, setType] = useState('Contribution');
  const [status, setStatus] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

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
        memberId: member.includes('all') ? 'all' : member.join(','),
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

  // ─── CSV Export ──────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (!data?.tableData?.length) return;

    const rows = data.tableData;

    // Exclude any key that is "id" or ends with "Id" / "_id"
    const headers = Object.keys(rows[0]).filter(
      (h) => !/^id$|[_-]?id$/i.test(h)
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return /[",\n]/.test(str) ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type.toLowerCase()}_report_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── PDF Export ───────────────────────────────────────────────────────────
  const exportToPDF = async () => {
    if (!resultsRef.current) return;
    setExportingPdf(true);

    // Dynamically import html2pdf (works for both npm install and CDN)
    let html2pdf;
    try {
      html2pdf = (await import('html2pdf.js')).default;
    } catch {
      // Fallback to global from CDN
      html2pdf = window.html2pdf;
    }

    if (!html2pdf) {
      alert('PDF export library not available. Please add html2pdf.js to your project.');
      setExportingPdf(false);
      return;
    }

    const filename = `${type.toLowerCase()}_report_${startDate}_to_${endDate}.pdf`;

    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(resultsRef.current)
      .save();

    setExportingPdf(false);
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

        {/* Member */}
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={member.includes('all')}
                onChange={() => setMember(['all'])}
              />
              <span>All Members</span>
            </label>
            {members.map((m) => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={member.includes(m.id) && !member.includes('all')}
                  onChange={() => {
                    if (member.includes('all')) {
                      setMember([m.id]);
                    } else if (member.includes(m.id)) {
                      const updated = member.filter(id => id !== m.id);
                      setMember(updated.length === 0 ? ['all'] : updated);
                    } else {
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
        <>
          {/* Export Buttons */}
          <div className="custom-view__export-bar">
            <button
              className="custom-view__export-btn custom-view__export-btn--csv"
              onClick={exportToCSV}
              title="Download table data as CSV"
            >
              ⬇ Export CSV
            </button>
            <button
              className="custom-view__export-btn custom-view__export-btn--pdf"
              onClick={exportToPDF}
              disabled={exportingPdf}
              title="Download full report as PDF"
            >
              {exportingPdf ? 'Generating PDF...' : '⬇ Export PDF'}
            </button>
          </div>

          <div className="custom-view__results" ref={resultsRef}>
            {/* Report header printed into PDF */}
            <div className="custom-view__pdf-header">
              <h3>{type} Report</h3>
              <p>{startDate} → {endDate}</p>
            </div>

            {type === 'Contribution' && (
              <>
                <ContributionBarChart data={data.tableData} startDate={startDate} endDate={endDate} />
                <ContributionPieChart data={data.tableData} />
                <ContributionsTable data={data.tableData} />
              </>
            )}

            {type === 'Payout' && (
              <>
                <PayoutsBarChart data={data.tableData} startDate={startDate} endDate={endDate} />
                <PayoutsPieChart data={data.tableData} />
                <PayoutsTable data={data.tableData} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomView;