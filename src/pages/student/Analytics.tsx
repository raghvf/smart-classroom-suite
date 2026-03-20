import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { TrendingUp, TrendingDown, Target, Award } from "lucide-react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function Analytics() {
  const { user } = useAuth();

  if (!user) return null;

  const attendanceData = [
    { week: "Week 1", rate: 85 },
    { week: "Week 2", rate: 90 },
    { week: "Week 3", rate: 87 },
    { week: "Week 4", rate: 92 },
    { week: "Week 5", rate: 88 },
  ];

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your academic performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Overall Rate"
            value="88.7%"
            icon={TrendingUp}
            variant="success"
            trend={{ value: 3.5, isPositive: true }}
          />
          <StatCard
            title="This Week"
            value="92%"
            icon={Award}
            variant="primary"
          />
          <StatCard
            title="Goal"
            value="90%"
            icon={Target}
            variant="default"
          />
          <StatCard
            title="Ranking"
            value="Top 15%"
            icon={TrendingUp}
            variant="success"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Your attendance rate over the last 5 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                rate: {
                  label: "Attendance Rate",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-rate)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-rate)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}