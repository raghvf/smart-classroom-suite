import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getStoredUser } from "@/lib/auth";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFaceManagement from "./pages/admin/FaceManagement";
import AdminStudents from "./pages/admin/Students";
import AdminFaculty from "./pages/admin/Faculty";
import AdminTimetable from "./pages/admin/Timetable";
import AdminAttendance from "./pages/admin/Attendance";
import AdminResources from "./pages/admin/Resources";
import AdminNotifications from "./pages/admin/Notifications";
import AdminSettings from "./pages/admin/Settings";
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyFaceAttendance from "./pages/faculty/FaceAttendancePage";
import FacultyClasses from "./pages/faculty/Classes";
import FacultyAttendance from "./pages/faculty/Attendance";
import FacultyAnalytics from "./pages/faculty/Analytics";
import FacultyNotifications from "./pages/faculty/Notifications";
import FacultySettings from "./pages/faculty/Settings";
import StudentDashboard from "./pages/student/Dashboard";
import StudentAttendance from "./pages/student/Attendance";
import StudentTimetable from "./pages/student/Timetable";
import StudentAnalytics from "./pages/student/Analytics";
import StudentChatPage from "./pages/student/ChatPage";
import StudentAttendanceInsightsPage from "./pages/student/AttendanceInsightsPage";
import StudentSettings from "./pages/student/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const user = getStoredUser();
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  
  return <>{children}</>;
}

const App = () => {
  const user = getStoredUser();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={`/${user.role}/dashboard`} replace />
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              }
            />
            <Route path="/auth/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/face-management"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminFaceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faculty"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminResources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Faculty Routes */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/face-attendance"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultyFaceAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/classes"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultyClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/attendance"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/analytics"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultyAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notifications"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultyNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/settings"
              element={
                <ProtectedRoute allowedRole="faculty">
                  <FacultySettings />
                </ProtectedRoute>
              }
            />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/chat"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance-insights"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentAttendanceInsightsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/timetable"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/analytics"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
