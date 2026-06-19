'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// export default function ReportsDashboard({ token }) {
  type Props = {
    token: string;
  };

  export default function ReportsDashboard({ token }: Props) {
  const [activeReport, setActiveReport] = useState('daily');
  // const [reportData, setReportData] = useState(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateRange, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      switch (activeReport) {
        case 'daily':
          url = `${API_URL}/api/reports/daily`;
          break;
        case 'weekly':
          url = `${API_URL}/api/reports/weekly`;
          break;
        case 'monthly':
          url = `${API_URL}/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`;
          break;
        case 'by-type':
          url = `${API_URL}/api/reports/by-type?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'by-responder':
          url = `${API_URL}/api/reports/by-responder?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'by-department':
          url = `${API_URL}/api/reports/by-department?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'success-rate':
          url = `${API_URL}/api/reports/success-rate?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'combined':
          url = `${API_URL}/api/reports/combined?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
      }
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setReportData(res.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    }
    setLoading(false);
  };

  //const exportCSV = async (type) => {
  const exportCSV = async (type: string) => {
    try {
      window.open(`${API_URL}/api/reports/export?type=${type}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
    
  // const reportTypes = [
  //   { id: 'daily', name: 'Daily Report', icon: '📅' },
  //   { id: 'weekly', name: 'Weekly Report', icon: '📊' },
  //   { id: 'monthly', name: 'Monthly Report', icon: '📆' },
  //   { id: 'by-type', name: 'By Incident Type', icon: '🏷️' },
  //   { id: 'by-responder', name: 'Per Responder', icon: '👤' },
  //   { id: 'by-department', name: 'Per Department', icon: '🏢' },
  //   { id: 'success-rate', name: 'Success/Failure Rate', icon: '📈' },
  //   { id: 'combined', name: 'Executive Summary', icon: '📋' },
  // ];

  type ReportType = {
    id: string;
    name: string;
    icon: string;
  };

  const reportTypes: ReportType[] = [
    { id: 'daily', name: 'Daily Report', icon: '📅' },
    { id: 'weekly', name: 'Weekly Report', icon: '📊' },
    { id: 'monthly', name: 'Monthly Report', icon: '📆' },
    { id: 'by-type', name: 'By Incident Type', icon: '🏷️' },
    { id: 'by-responder', name: 'Per Responder', icon: '👤' },
    { id: 'by-department', name: 'Per Department', icon: '🏢' },
    { id: 'success-rate', name: 'Success/Failure Rate', icon: '📈' },
    { id: 'combined', name: 'Executive Summary', icon: '📋' },
  ];

  return (
    <div>
      {/* Report Type Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* {reportTypes.map(type => ( */}
        {reportTypes.map((type: ReportType) => (
          <button
            key={type.id}
            onClick={() => setActiveReport(type.id)}
            style={{
              padding: '10px 20px',
              background: activeReport === type.id ? '#1e3a8a' : 'white',
              color: activeReport === type.id ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: activeReport === type.id ? 'bold' : 'normal',
            }}
          >
            {type.icon} {type.name}
          </button>
        ))}
      </div>

      {/* Date Range Picker */}
      {['by-type', 'by-responder', 'by-department', 'success-rate', 'combined'].includes(activeReport) && (
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Start Date</label>
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>End Date</label>
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <button onClick={() => fetchReport()} style={{ marginTop: '20px', background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Apply</button>
          <button onClick={() => exportCSV(activeReport)} style={{ marginTop: '20px', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>📥 Export CSV</button>
        </div>
      )}

      {/* Monthly selector */}
      {activeReport === 'monthly' && (
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchReport} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Load</button>
        </div>
      )}

      {/* Loading State */}
      {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Loading report...</div>}

      {/* Report Display */}
      {!loading && reportData && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
          {activeReport === 'daily' && renderDailyReport(reportData)}
          {activeReport === 'weekly' && renderWeeklyReport(reportData)}
          {activeReport === 'monthly' && renderMonthlyReport(reportData)}
          {activeReport === 'by-type' && renderIncidentTypeReport(reportData)}
          {activeReport === 'by-responder' && renderResponderReport(reportData)}
          {activeReport === 'by-department' && renderDepartmentReport(reportData)}
          {activeReport === 'success-rate' && renderSuccessRateReport(reportData)}
          {activeReport === 'combined' && renderCombinedReport(reportData)}
        </div>
      )}
    </div>
  );
}

// Report Renderers
function renderDailyReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Daily Report - {new Date(data.date).toLocaleDateString()}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#6b7280' }}>Total Incidents</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.total_incidents}</p></div>
        <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#065f46' }}>Resolved</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.resolved_incidents}</p></div>
        <div style={{ background: '#fed7aa', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#92400e' }}>Pending</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.pending_incidents}</p></div>
        <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#3730a3' }}>Success Rate</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.success_rate.toFixed(1)}%</p></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div><h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>By Type</h3>
        {/* {Object.entries(data.by_type).map(([k, v]) => <div key={k}>{k}: {v}</div>)} */}
        {Object.entries(data.by_type).map(([k, v]) => (<div key={k}>{k}: {String(v)}</div>))}
        </div>
        <div><h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>By Department</h3>
        {/* {Object.entries(data.by_department).map(([k, v]) => <div key={k}>{k}: {v}</div>)} */}
        {Object.entries(data.by_department).map(([k, v]) => (<div key={k}>{k}: {String(v)}</div>))}
        </div>
      </div>
    </div>
  );
}

function renderWeeklyReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Weekly Report</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Total</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.total_incidents}</p></div>
        <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Resolved</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.resolved_incidents}</p></div>
        <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Success Rate</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.success_rate.toFixed(1)}%</p></div>
      </div>
    </div>
  );
}

function renderMonthlyReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Monthly Report - {data.month_name} {data.year}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Total</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.total_incidents}</p></div>
        <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Resolved</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.resolved_incidents}</p></div>
        <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Success Rate</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.success_rate.toFixed(1)}%</p></div>
        <div style={{ background: '#fed7aa', padding: '16px', borderRadius: '8px', textAlign: 'center' }}><p style={{ fontSize: '12px' }}>Escalation Rate</p><p style={{ fontSize: '28px', fontWeight: 'bold' }}>{data.escalation_rate.toFixed(1)}%</p></div>
      </div>
    </div>
  );
}

function renderIncidentTypeReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Incident Type Report</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {Object.entries(data.incident_types).map(([type, stats]: [string, any]) => (
          <div key={type} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '12px' }}>{type}</h3>
            <div>Total: <strong>{stats.total}</strong></div>
            <div>Resolved: {stats.resolved}</div>
            <div>Success Rate: <span style={{ color: stats.success_rate >= 80 ? '#10b981' : '#f59e0b' }}>{stats.success_rate.toFixed(1)}%</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderResponderReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Responder Performance</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Responder</th>
              <th>Department</th>
              <th>Assigned</th>
              <th>Resolved</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.responders.map((r: any) => (
              <tr key={r.responder_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>{r.name}</td>
                <td style={{ padding: '12px' }}>{r.department}</td>
                <td style={{ padding: '12px' }}>{r.total_assigned}</td>
                <td style={{ padding: '12px' }}>{r.resolved_count}</td>
                <td style={{ padding: '12px' }}><span style={{ color: r.success_rate >= 80 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{r.success_rate.toFixed(1)}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderDepartmentReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Department Performance</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        {data.departments.map((dept: any) => (
          <div key={dept.department_id} style={{ border: `2px solid ${dept.color}`, padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{dept.department_name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }}>
              <div>Total: <strong>{dept.total_incidents}</strong></div>
              <div>Resolved: {dept.resolved_incidents}</div>
              <div>Success Rate: <span style={{ color: dept.success_rate >= 80 ? '#10b981' : '#f59e0b' }}>{dept.success_rate.toFixed(1)}%</span></div>
              <div>Avg Time: {dept.avg_resolution_time_minutes} min</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSuccessRateReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Success & Failure Rate Analysis</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#d1fae5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#065f46' }}>Success Rate</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#065f46' }}>{data.overall.success_rate.toFixed(1)}%</p>
        </div>
        <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#991b1b' }}>Failure Rate</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#991b1b' }}>{data.overall.failure_rate.toFixed(1)}%</p>
        </div>
        <div style={{ background: '#e0e7ff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#3730a3' }}>SLA Compliance</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#3730a3' }}>{data.overall.sla_compliance_rate.toFixed(1)}%</p>
        </div>
      </div>
      {data.recommendations && data.recommendations.length > 0 && (
        <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Recommendations</h3>
          {data.recommendations.map((rec: string, i: number) => <p key={i}>• {rec}</p>)}
        </div>
      )}
    </div>
  );
}

function renderCombinedReport(data: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Executive Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          Total<br/><strong style={{ fontSize: '24px' }}>{data.executive_summary.total_incidents}</strong>
        </div>
        <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          Resolved<br/><strong style={{ fontSize: '24px' }}>{data.executive_summary.resolved_incidents}</strong>
        </div>
        <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          Success Rate<br/><strong style={{ fontSize: '24px' }}>{data.executive_summary.overall_success_rate.toFixed(1)}%</strong>
        </div>
        <div style={{ background: '#fed7aa', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          Avg Response<br/><strong style={{ fontSize: '24px' }}>{data.executive_summary.avg_response_time_minutes} min</strong>
        </div>
      </div>
    </div>
  );
}
