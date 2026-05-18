import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define a professional color palette mapped directly to statuses
const STATUS_COLORS = {
  CONFIRMED: '#28a745', // Green
  PENDING: '#ffc107',   // Yellow/Warning
  MISSED: '#dc3545',   //Red
};

// Custom tooltip component to style the hover data box neatly
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '10px 14px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        fontFamily: 'sans-serif'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: STATUS_COLORS[data.name] || '#333' }}>
          {data.name}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '14px' }}>
          Total: <strong>R {data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </p>
        <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
          Count: {data.count}
        </p>
      </div>
    );
  }
  return null;
};

const ContributionPieChart = ({ data = [] }) => {
  
  // Helper: Process raw tabular contributions data into chart-ready aggregated metrics
  const prepareChartData = () => {
    const aggregations = {};

    data.forEach((item) => {
      const status = item.status ? item.status.toUpperCase() : 'UNKNOWN';
      const amount = Number(item.amount) || 0;

      if (!aggregations[status]) {
        aggregations[status] = { name: status, value: 0, count: 0 };
      }
      aggregations[status].value += amount;
      aggregations[status].count += 1;
    });

    return Object.values(aggregations);
  };

   const chartData = prepareChartData(); 


  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', fontStyle: 'italic' }}>
        No chart data available.
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
      <h3 style={{ margin: '0 0 20px 0', fontFamily: 'sans-serif', color: '#333', fontSize: '16px' }}>
        Contribution Breakdown by Financial Allocation
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value" // Measures slice sizes by total dollar amount
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50} // Creates a modern donut-style pie chart
            paddingAngle={3}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            style={{ fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '500' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={STATUS_COLORS[entry.name] || '#007bff'} 
              />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ContributionPieChart;