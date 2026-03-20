import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, TrendingUp, MessageSquare, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const user = getStoredUser();
  const navigate = useNavigate();

  if (!user || user.role !== "student") {
    window.location.href = "/auth/login";
    return null;
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
            <p className="text-muted-foreground">Track your academic progress</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/student/attendance-insights")} variant="outline" className="gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </Button>
            <Button onClick={() => navigate("/student/chat")} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Ask Assistant
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <Progress value={87} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:00 AM", subject: "Mathematics", room: "Room 101" },
                { time: "11:00 AM", subject: "Physics", room: "Lab 204" },
                { time: "02:00 PM", subject: "Computer Science", room: "Room 305" },
              ].map((class_, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{class_.subject}</p>
                    <p className="text-sm text-muted-foreground">{class_.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{class_.time}</p>
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
