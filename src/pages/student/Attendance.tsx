import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar } from "lucide-react";

export default function Attendance() {
  const { user } = useAuth();

  if (!user) return null;

  const courses = [
    { name: "Mathematics", present: 28, total: 32, percentage: 87.5 },
    { name: "Physics", present: 30, total: 32, percentage: 93.8 },
    { name: "Computer Science", present: 26, total: 30, percentage: 86.7 },
    { name: "Chemistry", present: 25, total: 28, percentage: 89.3 },
  ];

  const recentAttendance = [
    { date: "2024-01-15", course: "Mathematics", status: "present" },
    { date: "2024-01-15", course: "Physics", status: "present" },
    { date: "2024-01-14", course: "Computer Science", status: "absent" },
    { date: "2024-01-14", course: "Chemistry", status: "present" },
  ];

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">Track your attendance across all courses</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.name}>
              <CardHeader>
                <CardTitle className="text-lg">{course.name}</CardTitle>
                <CardDescription>
                  {course.present} / {course.total} classes attended
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Attendance Rate</span>
                    <span className="font-medium">{course.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={course.percentage} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance.map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {record.status === "present" ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{record.course}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {record.date}
                      </div>
                    </div>
                  </div>
                  <Badge variant={record.status === "present" ? "default" : "destructive"}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}