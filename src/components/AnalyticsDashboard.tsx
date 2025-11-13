import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Complaint {
  id: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  urgency: "low" | "medium" | "high" | "urgent";
  created_at: string;
  resolved_at: string | null;
}

interface AnalyticsDashboardProps {
  complaints: Complaint[];
}

const COLORS = {
  open: "hsl(var(--status-open))",
  in_progress: "hsl(var(--status-in-progress))",
  resolved: "hsl(var(--status-resolved))",
  technical: "#8884d8",
  facilities: "#82ca9d",
  curriculum: "#ffc658",
  mentorship: "#ff8042",
  hostel: "#a28edb",
  fees: "#ff6b9d",
};

export const AnalyticsDashboard = ({ complaints }: AnalyticsDashboardProps) => {
  // Category distribution
  const categoryData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Status distribution
  const statusData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ 
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  // Urgency distribution
  const urgencyData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.urgency] = (acc[c.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value 
  }));

  // Average resolution time
  const resolvedComplaints = complaints.filter(c => c.resolved_at && c.status === 'resolved');
  const avgResolutionTime = resolvedComplaints.length > 0
    ? resolvedComplaints.reduce((sum, c) => {
        const created = new Date(c.created_at).getTime();
        const resolved = new Date(c.resolved_at!).getTime();
        return sum + (resolved - created);
      }, 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;

  // Trend over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const trendData = last7Days.map(date => {
    const count = complaints.filter(c => c.created_at.startsWith(date)).length;
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      complaints: count
    };
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Resolution Time</CardDescription>
            <CardTitle className="text-3xl">{avgResolutionTime.toFixed(1)} days</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolution Rate</CardDescription>
            <CardTitle className="text-3xl">
              {complaints.length > 0 
                ? ((resolvedComplaints.length / complaints.length) * 100).toFixed(1) 
                : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Issues</CardDescription>
            <CardTitle className="text-3xl text-status-open">
              {complaints.filter(c => c.status === 'open').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-status-inProgress">
              {complaints.filter(c => c.status === 'in_progress').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Trend</CardTitle>
            <CardDescription>Complaints submitted in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="complaints" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Complaints by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current status of all complaints</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase().replace(' ', '_') as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Urgency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Urgency Levels</CardTitle>
            <CardDescription>Distribution by urgency</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={urgencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
