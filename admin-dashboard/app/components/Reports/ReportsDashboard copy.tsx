'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { apiClient } from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ReportsDashboard({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, selectedYear, selectedMonth]);

  const fetchReportData = async () => {
    setLoading(true);
    const api = apiClient(token);
    try {
      let data: any = {};
      
      if (reportType === 'daily') {
        const dailyRes = await api.get(`/api/reports/daily?date=${dateRange.startDate}`);
        data.daily = dailyRes.data;
      } else if (reportType === 'weekly') {
        const weeklyRes = await api.get(`/api/reports/weekly?startDate=${dateRange.startDate}`);
        data.weekly = weeklyRes.data;
      } else if (reportType === 'monthly') {
        const monthlyRes = await api.get(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
        data.monthly = monthlyRes.data;
      }
      
      const [byTypeRes, byDeptRes, byResponderRes, successRateRes, trendsRes] = await Promise.all([
        api.get(`/api/reports/by-type?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/api/reports/by-department?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/api/reports/by-responder?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/api/reports/success-rate?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/api/reports/trends?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ]);
      
      data.byType = byTypeRes.data;
      data.byDepartment = byDeptRes.data;
      data.byResponder = byResponderRes.data;
      data.successRate = successRateRes.data;
      data.trends = trendsRes.data;
      
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      if (reportData?.monthly) {
        const monthlyData = [{
          'Month': reportData.monthly.month_name,
          'Year': reportData.monthly.year,
          'Total Incidents': reportData.monthly.total_incidents,
          'Resolved': reportData.monthly.resolved_incidents,
          'Success Rate': `${reportData.monthly.success_rate}%`,
          'Avg Response Time': `${reportData.monthly.avg_resolution_time_minutes} min`,
        }];
        const ws = XLSX.utils.json_to_sheet(monthlyData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Monthly Report');
      }
      
      if (reportData?.byType?.incident_types) {
        const typeData = Object.entries(reportData.byType.incident_types).map(([type, stats]: [string, any]) => ({
          'Incident Type': type,
          'Total': stats.total,
          'Resolved': stats.resolved,
          'Success Rate': `${stats.success_rate}%`,
        }));
        const ws = XLSX.utils.json_to_sheet(typeData);
        XLSX.utils.book_append_sheet(workbook, ws, 'By Incident Type');
      }
      
      if (reportData?.byDepartment?.departments) {
        const deptData = reportData.byDepartment.departments.map((dept: any) => ({
          'Department': dept.department_name,
          'Total Incidents': dept.total_incidents,
          'Resolved': dept.resolved_incidents,
          'Success Rate': `${dept.success_rate}%`,
        }));
        const ws = XLSX.utils.json_to_sheet(deptData);
        XLSX.utils.book_append_sheet(workbook, ws, 'By Department');
      }
      
      const fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success('Excel report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export Excel');
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('landscape');
      doc.setFontSize(18);
      doc.text(`SmartCityAlert Report - ${reportType.toUpperCase()}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      let yOffset = 40;
      
      if (reportData?.monthly) {
        doc.setFontSize(14);
        doc.text('Monthly Summary', 14, yOffset);
        yOffset += 10;
        
        autoTable(doc, {
          startY: yOffset,
          head: [['Metric', 'Value']],
          body: [
            ['Total Incidents', reportData.monthly.total_incidents],
            ['Resolved Incidents', reportData.monthly.resolved_incidents],
            ['Success Rate', `${reportData.monthly.success_rate}%`],
            ['Avg Resolution Time', `${reportData.monthly.avg_resolution_time_minutes} min`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
        yOffset = (doc as any).lastAutoTable.finalY + 15;
      }
      
      if (reportData?.byDepartment?.departments) {
        if (yOffset > 180) {
          doc.addPage();
          yOffset = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Department Performance', 14, yOffset);
        yOffset += 10;
        
        const deptData = reportData.byDepartment.departments.map((dept: any) => [
          dept.department_name,
          dept.total_incidents,
          dept.resolved_incidents,
          `${dept.success_rate}%`,
        ]);
        
        autoTable(doc, {
          startY: yOffset,
          head: [['Department', 'Total', 'Resolved', 'Success Rate']],
          body: deptData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }
      
      doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive incident reports and insights</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <DocumentChartBarIcon className="h-5 w-5" />
            Export Excel
          </button>
          <button onClick={exportToPDF} disabled={exporting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            <DocumentArrowDownIcon className="h-5 w-5" />
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((type) => (
              <button key={type} onClick={() => setReportType(type)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Report
              </button>
            ))}
          </div>
          
          {reportType === 'daily' && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}
          
          {reportType === 'weekly' && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}
          
          {reportType === 'monthly' && (
            <div className="flex items-center gap-2">
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
          )}
          
          <button onClick={fetchReportData} className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Incidents</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.monthly?.total_incidents || reportData?.daily?.total_incidents || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{reportData?.successRate?.overall?.success_rate?.toFixed(1) || 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Avg Response Time</p>
          <p className="text-2xl font-bold text-blue-600">{reportData?.monthly?.avg_resolution_time_minutes || 0} min</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">SLA Compliance</p>
          <p className="text-2xl font-bold text-purple-600">{reportData?.successRate?.overall?.sla_compliance_rate?.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={2} name="Incidents" />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidents by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(reportData?.byType?.incident_types || {}).map(([name, stats]: [string, any]) => ({ name, value: stats.total }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(reportData?.byType?.incident_types || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.byDepartment?.departments || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success_rate" fill="#10B981" name="Success Rate (%)" />
                <Bar dataKey="total_incidents" fill="#3B82F6" name="Total Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
