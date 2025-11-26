import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("authorization")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get student record
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (studentError || !studentData) {
      throw new Error("Student record not found");
    }

    // Fetch attendance records for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentData.id)
      .gte("date", ninetyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (attendanceError) {
      throw new Error("Failed to fetch attendance data");
    }

    // Prepare data summary for AI analysis
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter((r) => r.status === "present").length;
    const absentCount = attendanceData.filter((r) => r.status === "absent").length;
    const lateCount = attendanceData.filter((r) => r.status === "late").length;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Group by course
    const courseStats = attendanceData.reduce((acc: any, record) => {
      if (!acc[record.course_name]) {
        acc[record.course_name] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[record.course_name][record.status]++;
      acc[record.course_name].total++;
      return acc;
    }, {});

    const dataContext = `
Attendance Summary (Last 90 Days):
- Total Records: ${totalRecords}
- Present: ${presentCount} (${attendanceRate.toFixed(1)}%)
- Absent: ${absentCount}
- Late: ${lateCount}

Course-wise Breakdown:
${Object.entries(courseStats)
  .map(([course, stats]: [string, any]) => {
    const courseRate = ((stats.present / stats.total) * 100).toFixed(1);
    return `- ${course}: ${stats.present}/${stats.total} present (${courseRate}%), ${stats.absent} absent, ${stats.late} late`;
  })
  .join("\n")}

Recent Attendance Pattern (Last 10 records):
${attendanceData
  .slice(0, 10)
  .map((r) => `${r.date}: ${r.course_name} - ${r.status}`)
  .join("\n")}
`;

    // Call Lovable AI for insights
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an academic advisor analyzing student attendance patterns. Provide concise, actionable insights and predictions. Focus on: 1) Overall attendance trends, 2) Course-specific patterns, 3) Risk assessment (if attendance is concerning), 4) Predictions for future attendance, 5) Recommendations. Keep your response structured and under 300 words.",
          },
          {
            role: "user",
            content: `Analyze this student's attendance data and provide insights:\n\n${dataContext}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", await aiResponse.text());
      throw new Error("Failed to generate insights");
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || "Unable to generate insights";

    return new Response(
      JSON.stringify({
        insights,
        stats: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate: attendanceRate.toFixed(1),
          courseStats,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
