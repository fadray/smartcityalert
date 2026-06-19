'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Grid, Select, SelectItem, Button, Badge, Table, Metric, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { Download, Calendar, TrendingUp, CheckCircle, Clock, AlertTriangle, FileText, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export function ReportsDashboard() {
  const [dateRange, setDateRange] = useState('30');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topResponders, setTopResponders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
    fetchReports();
  }, [dateRange, departmentId]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDepartments(data);
      if (data.length > 0) setDepartmentId(data[0].id);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch department performance
      const perfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/department/${departmentId}/performance?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const perfData = await perfRes.json();
      setPerformanceData(perfData);
      
      // Fetch incident trends
      const trendsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/trends?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trends = await trendsRes.json();
      setTrendData(trends);
      
      // Fetch top responders
      const respondersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/top-responders?days=${dateRange}&department=${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responders = await respondersRes.json();
      setTopResponders(responders);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/export?format=${format}&department=${departmentId}&days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident_report_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  if (loading) return <div className="text-center py-8">Loading reports...</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange} className="w-32">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </Select>
          <Select value={departmentId} onValueChange={setDepartmentId} className="w-48">
            {departments.map((dept: any) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button icon={FileText} variant="secondary" onClick={() => exportReport('xlsx')}>
            Export Excel
          </Button>
          <Button icon={FileText} variant="secondary" onClick={() => exportReport('pdf')}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Grid numItems={4} className="gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <Text>Success Rate</Text>
              <Metric>{performanceData?.success_rate || 0}%</Metric>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Clock className="text-blue-500" size={24} />
            <div>
              <Text>Avg Response Time</Text>
              <Metric>{performanceData?.avg_response_minutes || 0} min</Metric>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <div>
              <Text>Escalation Rate</Text>
              <Metric>{performanceData?.escalation_rate || 0}%</Metric>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="text-purple-500" size={24} />
            <div>
              <Text>SLA Achievement</Text>
              <Metric>{performanceData?.sla_achievement || 0}%</Metric>
            </div>
          </div>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid numItems={2} className="gap-4">
        <Card>
          <Title>Incident Trends</Title>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <Title>Incidents by Severity</Title>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData?.by_severity || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(performanceData?.by_severity || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Grid>

      {/* Top Responders Table */}
      <Card>
        <Title>Top Performing Responders</Title>
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Responder</TableHeaderCell>
              <TableHeaderCell>Department</TableHeaderCell>
              <TableHeaderCell>Incidents Resolved</TableHeaderCell>
              <TableHeaderCell>Avg Response Time</TableHeaderCell>
              <TableHeaderCell>Success Rate</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topResponders.map((responder: any) => (
              <TableRow key={responder.id}>
                <TableCell>{responder.name}</TableCell>
                <TableCell>{responder.department}</TableCell>
                <TableCell>{responder.resolved_count}</TableCell>
                <TableCell>{responder.avg_response} min</TableCell>
                <TableCell>
                  <Badge color={responder.success_rate >= 90 ? 'green' : responder.success_rate >= 70 ? 'yellow' : 'red'}>
                    {responder.success_rate}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge color={responder.is_available ? 'green' : 'gray'}>
                    {responder.is_available ? 'Available' : 'Busy'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pending Incidents */}
      <Card>
        <Title>Pending Incidents by Department</Title>
        <div className="mt-4 space-y-3">
          {performanceData?.pending_by_department?.map((dept: any) => (
            <div key={dept.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                <span className="font-medium">{dept.name}</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(dept.pending / performanceData.total_pending) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold">{dept.pending}</span>
              {dept.pending > 5 && <Badge color="red">High</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
