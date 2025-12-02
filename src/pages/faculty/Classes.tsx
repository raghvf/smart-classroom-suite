import { MainLayout } from "@/components/layout/MainLayout";
import { getStoredUser } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, BookOpen } from "lucide-react";

export default function Classes() {
  const user = getStoredUser();

  if (!user || user.role !== "faculty") {
    return <Navigate to="/auth/login" replace />;
  }

  const classes = [
    { id: 1, name: "Computer Science 101", students: 45, schedule: "Mon, Wed 09:00 AM", room: "Lab 305" },
    { id: 2, name: "Data Structures", students: 38, schedule: "Tue, Thu 11:00 AM", room: "Room 201" },
    { id: 3, name: "Algorithms", students: 32, schedule: "Wed, Fri 02:00 PM", room: "Lab 302" },
  ];

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground">View and manage your assigned classes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                <CardDescription>{cls.room}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{cls.students} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{cls.schedule}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <BookOpen className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" className="flex-1">Attendance</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}