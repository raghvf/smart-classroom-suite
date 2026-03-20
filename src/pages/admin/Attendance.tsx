import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Attendance() {
  const user = getStoredUser();

  if (!user || user.role !== "admin") {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Overview</h1>
          <p className="text-muted-foreground">Monitor attendance across all classes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Present"
            value="1,245"
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Total Absent"
            value="87"
            icon={XCircle}
            variant="destructive"
          />
          <StatCard
            title="Overall Rate"
            value="93.5%"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="At Risk"
            value="12"
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Records</CardTitle>
            <CardDescription>Latest attendance entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              Attendance records will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}