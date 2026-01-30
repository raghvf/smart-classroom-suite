import { MainLayout } from "@/components/layout/MainLayout";
import { getStoredUser } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Camera, User, GraduationCap, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Settings() {
  const user = getStoredUser();

  // Fetch student details
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch attendance data grouped by course
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance-summary', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('course_name, status')
        .eq('student_id', studentData.id);
      
      if (error) throw error;
      
      // Group by course and calculate percentages
      const courseMap = new Map<string, { present: number; total: number }>();
      
      data?.forEach((record) => {
        const current = courseMap.get(record.course_name) || { present: 0, total: 0 };
        current.total += 1;
        if (record.status === 'present') {
          current.present += 1;
        }
        courseMap.set(record.course_name, current);
      });
      
      return Array.from(courseMap.entries()).map(([course, stats]) => ({
        course,
        present: stats.present,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      }));
    },
    enabled: !!studentData?.id,
  });

  if (!user || user.role !== "student") {
    return <Navigate to="/auth/login" replace />;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600 bg-green-100";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground">View your profile and manage preferences</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Profile
            </CardTitle>
            <CardDescription>Your personal and academic information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {studentData?.status || 'Active'}
                </Badge>
              </div>

              {/* Profile Details */}
              <div className="flex-1 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                  {studentLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <p className="font-semibold text-lg">{user.name}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Roll Number</Label>
                  {studentLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <p className="font-semibold text-lg font-mono">{studentData?.student_id || 'N/A'}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Department</Label>
                  {studentLoading ? (
                    <Skeleton className="h-6 w-36" />
                  ) : (
                    <p className="font-medium">{studentData?.department || 'N/A'}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Semester</Label>
                  {studentLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <p className="font-medium">{studentData?.semester || 'N/A'}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Batch</Label>
                  {studentLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <p className="font-medium">{studentData?.batch || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CGPA Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Academic Performance
            </CardTitle>
            <CardDescription>Your cumulative grade point average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-primary bg-primary/5">
                {studentLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <>
                    <span className="text-4xl font-bold text-primary">
                      {studentData?.cgpa?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">CGPA</span>
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{studentData?.semester || '-'}</p>
                    <p className="text-xs text-muted-foreground">Current Sem</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{attendanceData?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Subjects</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">
                      {attendanceData && attendanceData.length > 0
                        ? Math.round(attendanceData.reduce((sum, a) => sum + a.percentage, 0) / attendanceData.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Attendance</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{studentData?.batch || '-'}</p>
                    <p className="text-xs text-muted-foreground">Batch</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject-wise Attendance
            </CardTitle>
            <CardDescription>Your attendance breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attendanceData && attendanceData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="w-[200px]">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((subject) => (
                    <TableRow key={subject.course}>
                      <TableCell className="font-medium">{subject.course}</TableCell>
                      <TableCell className="text-center">{subject.present}</TableCell>
                      <TableCell className="text-center">{subject.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getAttendanceColor(subject.percentage)}>
                          {subject.percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={subject.percentage} 
                            className="h-2"
                            style={{
                              ['--progress-background' as string]: getProgressColor(subject.percentage).replace('bg-', '')
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  defaultValue={studentData?.phone || ''} 
                  placeholder="Enter phone number"
                />
              </div>
              <Button className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="attendance-notif">Attendance Reminders</Label>
                <Switch id="attendance-notif" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="assignment-notif">Assignment Alerts</Label>
                <Switch id="assignment-notif" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="grade-notif">Grade Updates</Label>
                <Switch id="grade-notif" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="low-attendance">Low Attendance Warnings</Label>
                <Switch id="low-attendance" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
