import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";

export default function Timetable() {
  const { user } = useAuth();

  if (!user) return null;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = ["09:00", "11:00", "14:00", "16:00"];

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timetable Management</h1>
            <p className="text-muted-foreground">Create and manage class schedules</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Class
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Institution-wide class schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-3 bg-muted text-left">Time</th>
                    {days.map((day) => (
                      <th key={day} className="border p-3 bg-muted text-left">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="border p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {time}
                        </div>
                      </td>
                      {days.map((day) => (
                        <td key={`${day}-${time}`} className="border p-3">
                          <div className="min-h-[80px] hover:bg-muted/50 rounded cursor-pointer transition-colors">
                            {/* Schedule items would go here */}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}