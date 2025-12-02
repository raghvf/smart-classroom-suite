import { MainLayout } from "@/components/layout/MainLayout";
import { getStoredUser } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin } from "lucide-react";

export default function Timetable() {
  const user = getStoredUser();

  if (!user || user.role !== "student") {
    return <Navigate to="/auth/login" replace />;
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  const schedule = {
    Monday: [
      { time: "09:00 AM", subject: "Mathematics", room: "Room 101", duration: "2h" },
      { time: "11:00 AM", subject: "Physics", room: "Lab 204", duration: "2h" },
    ],
    Tuesday: [
      { time: "09:00 AM", subject: "Computer Science", room: "Lab 305", duration: "2h" },
      { time: "02:00 PM", subject: "Chemistry", room: "Lab 102", duration: "2h" },
    ],
    Wednesday: [
      { time: "09:00 AM", subject: "Mathematics", room: "Room 101", duration: "2h" },
      { time: "02:00 PM", subject: "English", room: "Room 203", duration: "1h" },
    ],
    Thursday: [
      { time: "11:00 AM", subject: "Physics", room: "Lab 204", duration: "2h" },
      { time: "02:00 PM", subject: "Computer Science", room: "Lab 305", duration: "2h" },
    ],
    Friday: [
      { time: "09:00 AM", subject: "Chemistry", room: "Lab 102", duration: "2h" },
      { time: "11:00 AM", subject: "English", room: "Room 203", duration: "2h" },
    ],
  };

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">Your weekly class schedule</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {days.map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-base">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedule[day as keyof typeof schedule]?.map((cls, idx) => (
                  <div key={idx} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-primary" />
                      {cls.time}
                    </div>
                    <p className="font-semibold">{cls.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {cls.room}
                    </div>
                    <p className="text-xs text-muted-foreground">{cls.duration}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}