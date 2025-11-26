import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CourseStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface InsightsData {
  insights: string;
  stats: {
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: string;
    courseStats: Record<string, CourseStats>;
  };
}

export const AttendanceInsights = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: response, error: invokeError } = await supabase.functions.invoke(
        "attendance-insights",
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (invokeError) throw invokeError;
      if (response.error) throw new Error(response.error);

      setData(response);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to load insights";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Attendance Insights
          </CardTitle>
          <CardDescription>Analyzing your attendance patterns...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Attendance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "No data available"}</AlertDescription>
          </Alert>
          <Button onClick={fetchInsights} className="mt-4" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { stats, insights } = data;
  const attendanceRate = parseFloat(stats.attendanceRate);

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{stats.attendanceRate}%</span>
              {attendanceRate >= 75 ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
            </div>
            <Progress value={attendanceRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.presentCount} present of {stats.totalRecords} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Absences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.absentCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Last 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lateCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Last 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Analysis & Predictions
              </CardTitle>
              <CardDescription>Based on your last 90 days of attendance</CardDescription>
            </div>
            <Button onClick={fetchInsights} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{insights}</p>
          </div>
        </CardContent>
      </Card>

      {/* Course-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Course-wise Attendance</CardTitle>
          <CardDescription>Your attendance rate in each course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.courseStats).map(([course, courseStats]) => {
              const courseRate = ((courseStats.present / courseStats.total) * 100).toFixed(1);
              return (
                <div key={course} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{course}</span>
                    <span className="text-sm text-muted-foreground">
                      {courseStats.present}/{courseStats.total} ({courseRate}%)
                    </span>
                  </div>
                  <Progress value={parseFloat(courseRate)} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
