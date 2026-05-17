import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Global color syncing matrix adjusted for PayFast Payout statuses
const STATUS_COLORS = {
  SUCCESS: '#28a745', // Green
  PENDING: '#ffc107', // Yellow
  FAILED: '#dc3545',  // Red
};

const PayoutsBarChart = ({ data = [], startDate, endDate }) => {
  console.log('Payout Bar chart received:', data); 

  const prepareChartData = () => {
    if (!data || data.length === 0) return [];

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    
    if (!startDate) {
      start.setMonth(end.getMonth() - 5);
    }

    const activeMonths = [];
    let currentIterNode = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCompareNode = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (currentIterNode <= endCompareNode && activeMonths.length < 6) {
      const monthLabel = currentIterNode.toLocaleString('default', { month: 'short', year: '2-digit' });
      activeMonths.push({
        monthKey: `${currentIterNode.getFullYear()}-${String(currentIterNode.getMonth() + 1).padStart(2, '0')}`,
        label: monthLabel,
        SUCCESS: 0,   // Fixed here: Changed from COMPLETED to SUCCESS
        PENDING: 0,
        FAILED: 0,
      });
      currentIterNode.setMonth(currentIterNode.getMonth() + 1);
    }

    data.forEach((item) => {
      if (!item.createdAt) return;
      const itemDate = new Date(item.createdAt);
      const itemKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
      const status = item.status ? item.status.toUpperCase() : 'UNKNOWN';
      const amount = Number(item.amount) || 0;

      const targetBucket = activeMonths.find(m => m.monthKey === itemKey);
      if (targetBucket && targetBucket.hasOwnProperty(status)) {
        targetBucket[status] += amount;
      }
    });

    return activeMonths;
  };

  const chartData = prepareChartData();

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', fontStyle: 'italic' }}>
        No visual data found for the designated date window.
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: 350, 
      backgroundColor: '#ffffff', 
      padding: '20px', 
      borderRadius: '8px', 
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontFamily: 'sans-serif', color: '#333', fontSize: '16px' }}>
          Monthly Payout Volume Tracking (Max 6 Months)
        </h3>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="label" 
            tick={{ fill: '#6c757d', fontSize: 12, fontFamily: 'sans-serif' }}
            axisLine={{ stroke: '#dee2e6' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(val) => `R${val}`}
            tick={{ fill: '#6c757d', fontSize: 12, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value) => [`R ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`]}
            contentStyle={{ fontFamily: 'sans-serif', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <Legend 
            iconType="circle"
            wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px', paddingTop: '10px' }}
          />
          
          {/* Fixed dataKey pointers down here */}
          <Bar
            dataKey="SUCCESS"
            name="Success"
            fill={STATUS_COLORS.SUCCESS}
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="PENDING"
            name="Pending"
            fill={STATUS_COLORS.PENDING}
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="FAILED"
            name="Failed"
            fill={STATUS_COLORS.FAILED}
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PayoutsBarChart;