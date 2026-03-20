import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserCog, Calendar, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const attendanceData = [
  { name: "Mon", present: 285, absent: 35 },
  { name: "Tue", present: 298, absent: 22 },
  { name: "Wed", present: 275, absent: 45 },
  { name: "Thu", present: 310, absent: 10 },
  { name: "Fri", present: 295, absent: 25 },
];

const enrollmentData = [
  { month: "Jan", students: 280 },
  { month: "Feb", students: 290 },
  { month: "Mar", students: 305 },
  { month: "Apr", students: 315 },
  { month: "May", students: 320 },
];

const recentAlerts = [
  { id: 1, student: "John Doe", class: "Mathematics", issue: "Attendance below 75%", severity: "warning" },
  { id: 2, student: "Jane Smith", class: "Physics", issue: "3 consecutive absences", severity: "critical" },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">Monitor your institution's key metrics and activities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value="320"
            icon={Users}
            trend={{ value: 5, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Total Faculty"
            value="21"
            icon={UserCog}
            trend={{ value: 2, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Classes Today"
            value="34"
            icon={Calendar}
            variant="default"
          />
          <StatCard
            title="Alerts"
            value="2"
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>Student attendance for the current week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  present: {
                    label: "Present",
                    color: "hsl(var(--chart-3))",
                  },
                  absent: {
                    label: "Absent",
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="present" fill="var(--color-present)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="absent" fill="var(--color-absent)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment Trend</CardTitle>
              <CardDescription>Monthly enrollment growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  students: {
                    label: "Students",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke="var(--color-students)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-students)", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Students requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.severity === "critical" ? "bg-destructive" : "bg-warning"
                    }`} />
                    <div>
                      <p className="font-medium">{alert.student}</p>
                      <p className="text-sm text-muted-foreground">{alert.class}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{alert.issue}</p>
                    <p className={`text-xs mt-1 ${
                      alert.severity === "critical" ? "text-destructive" : "text-warning"
                    }`}>
                      {alert.severity === "critical" ? (
                        <TrendingDown className="inline h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="inline h-3 w-3 mr-1" />
                      )}
                      {alert.severity.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
