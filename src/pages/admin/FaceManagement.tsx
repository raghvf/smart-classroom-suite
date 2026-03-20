import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FaceRegistration } from "@/components/FaceRegistration";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FaceRecord {
  id: string;
  student_id: string;
  descriptors: number[][];
  students: {
    student_id: string;
    profiles: {
      name: string;
    };
  };
}

export default function FaceManagement() {
  const { user } = useAuth();
  const [faceData, setFaceData] = useState<FaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFaceData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("face_data")
        .select(`
          id,
          student_id,
          descriptors,
          students (
            student_id,
            profiles (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFaceData((data || []) as FaceRecord[]);
    } catch (error) {
      console.error("Error fetching face data:", error);
      toast({
        title: "Error",
        description: "Failed to load face data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaceData();
  }, []);

  const handleDelete = async (id: string, studentName: string) => {
    try {
      const { error } = await supabase.from("face_data").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `Face data removed for ${studentName}`,
      });
      fetchFaceData();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete face data",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Face Recognition Management</h1>
          <p className="text-muted-foreground">Register student faces for automatic attendance</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FaceRegistration onComplete={fetchFaceData} />

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registered Students</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {faceData.length}
                </div>
                <Button size="sm" variant="ghost" onClick={fetchFaceData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : faceData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No registered faces yet
                </p>
              ) : (
                faceData.map((face) => {
                  const studentName = face.students?.profiles?.name || 'Unknown Student';
                  const studentId = face.students?.student_id || 'N/A';
                  return (
                    <div
                      key={face.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {studentId} • {face.descriptors.length} samples
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(face.id, studentName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
