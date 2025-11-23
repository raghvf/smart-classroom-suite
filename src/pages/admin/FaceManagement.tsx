import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FaceRegistration } from '@/components/FaceRegistration';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Users } from 'lucide-react';
import { getAllStoredFaces, deleteFaceData } from '@/lib/faceRecognition';
import { useToast } from '@/hooks/use-toast';
import { getStoredUser } from '@/lib/auth';
import { Navigate } from 'react-router-dom';

export default function FaceManagement() {
  const user = getStoredUser();
  const [refresh, setRefresh] = useState(0);
  const { toast } = useToast();
  const storedFaces = getAllStoredFaces();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/auth/login" replace />;
  }

  const handleDelete = (studentId: string) => {
    deleteFaceData(studentId);
    toast({
      title: 'Deleted',
      description: 'Student face data removed',
    });
    setRefresh(prev => prev + 1);
  };

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Face Recognition Management</h1>
          <p className="text-muted-foreground">Register student faces for automatic attendance</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FaceRegistration onComplete={() => setRefresh(prev => prev + 1)} />

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registered Students</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {storedFaces.length}
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {storedFaces.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No registered faces yet
                </p>
              ) : (
                storedFaces.map((face) => (
                  <div key={face.studentId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{face.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {face.studentId} • {face.descriptors.length} samples
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(face.studentId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
