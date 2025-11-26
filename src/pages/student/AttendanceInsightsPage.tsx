import { AttendanceInsights } from "@/components/AttendanceInsights";

const AttendanceInsightsPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Attendance Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of your attendance patterns and predictions
        </p>
      </div>
      <AttendanceInsights />
    </div>
  );
};

export default AttendanceInsightsPage;
