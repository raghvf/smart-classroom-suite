import { MainLayout } from "@/components/layout/MainLayout";
import { FaceRecognitionAttendance } from "@/components/FaceRecognitionAttendance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/lib/auth";
import { Navigate } from "react-router-dom";

export default function FaceAttendancePage() {
  const user = getStoredUser();

  if (!user || user.role !== "faculty") {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Face Recognition Attendance</h1>
          <p className="text-muted-foreground">
            Mark student attendance using face recognition technology
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Follow these steps to mark attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Select the course for which you want to mark attendance</li>
                <li>Click "Start Camera" to begin face recognition</li>
                <li>Students should position themselves in front of the camera</li>
                <li>Click "Recognize Face" to identify and mark attendance</li>
                <li>The system will automatically save the attendance record</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Best Results</CardTitle>
              <CardDescription>Ensure accurate face recognition</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Ensure good lighting in the room</li>
                <li>Face should be clearly visible to the camera</li>
                <li>Remove glasses or masks if possible</li>
                <li>Look directly at the camera</li>
                <li>Maintain a neutral expression</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <FaceRecognitionAttendance />
      </div>
    </MainLayout>
  );
}
