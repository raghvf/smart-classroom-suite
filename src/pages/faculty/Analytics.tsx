import { MainLayout } from "@/components/layout/MainLayout";
import { getStoredUser } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { TrendingUp, Users, BookOpen, Award } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function Analytics() {
  const user = getStoredUser();

  if (!user || user.role !== "faculty") {
    return <Navigate to="/auth/login" replace />;
  }

  const performanceData = [
    { class: "CS 101", avgAttendance: 85, avgGrade: 78 },
    { class: "Data Struct", avgAttendance: 92, avgGrade: 82 },
    { class: "Algorithms", avgAttendance: 88, avgGrade: 80 },
  ];

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">View performance metrics and insights</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Avg Attendance"
            value="88.3%"
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Total Students"
            value="142"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Classes Taught"
            value="5"
            icon={BookOpen}
            variant="default"
          />
          <StatCard
            title="Avg Performance"
            value="80%"
            icon={Award}
            variant="success"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Attendance vs Grade comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                avgAttendance: {
                  label: "Avg Attendance",
                  color: "hsl(var(--chart-1))",
                },
                avgGrade: {
                  label: "Avg Grade",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="avgAttendance" fill="var(--color-avgAttendance)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="avgGrade" fill="var(--color-avgGrade)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}