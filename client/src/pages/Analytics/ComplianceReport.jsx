import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ComplianceReport() {
    const { id: groupId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchCompliance() {
            try {
                const token = await auth.currentUser.getIdToken();
                const response = await fetch(
                    import.meta.env.VITE_API_URL + `/api/analytics/compliance/${groupId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const result = await response.json();
                if (!response.ok) {
                    console.log(response)
                    setError('Failed to load compliance data');
                    return;
                }
                setData(result);
            } catch (err) {
                setError('Something went wrong. Please try again.');
                console.error('fetchCompliance error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchCompliance();
    }, [groupId]);

    // export as CSV
    function exportCSV() {
        if (!data) return;

        const headers = ['Member', ...data.months, 'Compliance Rate', 'Total Contributed'];
        const rows = data.complianceData.map(member => [
            member.email,
            ...member.monthlyStatus.map(m => m.status),
            `${member.complianceRate}%`,
            `R${member.totalContributed}`,
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contribution_compliance.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // export as PDF
    function exportPDF() {
        if (!data) return;

        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text('Contribution Compliance Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA')}`, 14, 22);

        const headers = ['Member', ...data.months, 'Rate', 'Total'];
        const rows = data.complianceData.map(member => [
            member.email,
            ...member.monthlyStatus.map(m => {
                if (m.status === 'CONFIRMED') return 'PAID';
                if (m.status === 'MISSED') return 'MISSED';
                return 'PENDING';
            }),
            `${member.complianceRate}%`,
            `R${member.totalContributed}`,
        ]);

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [46, 125, 50] },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.column.index > 0) {
                    const val = hookData.cell.raw;
                    if (val === 'PAID') hookData.cell.styles.textColor = [46, 125, 50];
                    if (val === 'MISSED') hookData.cell.styles.textColor = [198, 40, 40];
                    if (val === 'PENDING') hookData.cell.styles.textColor = [230, 126, 34];
                }
            },
        });

        doc.save('contribution_compliance.pdf');
    }

    function getStatusColor(status) {
        if (status === 'CONFIRMED') return '#2e7d32';
        if (status === 'MISSED') return '#c62828';
        return '#e67e22';
    }

    function getStatusLabel(status) {
        if (status === 'CONFIRMED') return 'PAID';
        if (status === 'MISSED') return 'MISSED';
        return 'PENDING';
    }

    if (loading) return <p style={styles.message}>Loading compliance report...</p>;
    if (error) return <p style={styles.error}>{error}</p>;
    if (!data) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Contribution Compliance Report</h1>
                <div style={styles.exportButtons}>
                    <button style={styles.csvButton} onClick={exportCSV}>
                        Export CSV
                    </button>
                    <button style={styles.pdfButton} onClick={exportPDF}>
                        Export PDF
                    </button>
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Member</th>
                            {data.months.map(month => (
                                <th key={month} style={styles.th}>{month}</th>
                            ))}
                            <th style={styles.th}>Compliance Rate</th>
                            <th style={styles.th}>Total Contributed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.complianceData.map(member => (
                            <tr key={member.memberId}>
                                <td style={styles.td}>
                                    <div style={styles.memberEmail}>{member.email}</div>
                                    <div style={styles.memberRole}>{member.role}</div>
                                </td>
                                {member.monthlyStatus.map((m, i) => (
                                    <td key={i} style={styles.td}>
                                        <span style={{
                                            ...styles.statusBadge,
                                            backgroundColor: getStatusColor(m.status),
                                        }}>
                                            {getStatusLabel(m.status)}
                                        </span>
                                    </td>
                                ))}
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.rateText,
                                        color: member.complianceRate >= 75 ? '#2e7d32' : '#c62828',
                                    }}>
                                        {member.complianceRate}%
                                    </span>
                                </td>
                                <td style={styles.td}>R{member.totalContributed}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        margin: 0,
    },
    exportButtons: {
        display: 'flex',
        gap: '12px',
    },
    csvButton: {
        padding: '10px 20px',
        backgroundColor: '#1565c0',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
    },
    pdfButton: {
        padding: '10px 20px',
        backgroundColor: '#c62828',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
    },
    tableWrapper: {
        overflowX: 'auto',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#ffffff',
    },
    th: {
        padding: '12px 16px',
        backgroundColor: '#2e7d32',
        color: '#ffffff',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
    td: {
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '13px',
        whiteSpace: 'nowrap',
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 'bold',
    },
    memberEmail: {
        fontSize: '13px',
        color: '#1a1a1a',
        fontWeight: 'bold',
    },
    memberRole: {
        fontSize: '11px',
        color: '#999',
    },
    rateText: {
        fontWeight: 'bold',
        fontSize: '14px',
    },
    message: {
        color: '#666',
        fontSize: '16px',
        padding: '32px',
    },
    error: {
        color: '#c62828',
        fontSize: '16px',
        padding: '32px',
    },
};