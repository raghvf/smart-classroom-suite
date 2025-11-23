import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FaceAttendance } from '@/components/FaceAttendance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredUser } from '@/lib/auth';
import { Navigate } from 'react-router-dom';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  timestamp: string;
}

export default function FaceAttendancePage() {
  const user = getStoredUser();
  const [subject, setSubject] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  if (!user || user.role !== 'faculty') {
    return <Navigate to="/auth/login" replace />;
  }

  const handleStudentRecognized = (studentId: string, studentName: string) => {
    const record: AttendanceRecord = {
      studentId,
      studentName,
      timestamp: new Date().toISOString(),
    };
    setAttendanceRecords(prev => [...prev, record]);
  };

  const downloadCSV = () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records to download',
        variant: 'destructive',
      });
      return;
    }

    const csv = [
      ['Student ID', 'Student Name', 'Timestamp', 'Subject'],
      ...attendanceRecords.map(r => [
        r.studentId,
        r.studentName,
        new Date(r.timestamp).toLocaleString(),
        subject || 'N/A',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${subject || 'class'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Attendance CSV file downloaded',
    });
  };

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Face Recognition Attendance</h1>
          <p className="text-muted-foreground">Mark attendance automatically using face recognition</p>
        </div>

        <Card className="p-6">
          <Label htmlFor="subject">Subject / Class Name</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics 101"
            className="mb-4"
          />
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <FaceAttendance onStudentRecognized={handleStudentRecognized} />

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Attendance</h3>
              <Button size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Total Present: {attendanceRecords.length}
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {attendanceRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attendance marked yet
                  </p>
                ) : (
                  attendanceRecords.map((record, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium">{record.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.studentId} • {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
