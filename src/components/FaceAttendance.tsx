import { useState, useRef, useEffect } from 'react';
import { Camera, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { loadModels, recognizeFace } from '@/lib/faceRecognition';

interface RecognizedStudent {
  studentId: string;
  studentName: string;
  timestamp: string;
}

interface FaceAttendanceProps {
  onStudentRecognized?: (studentId: string, studentName: string) => void;
}

export const FaceAttendance = ({ onStudentRecognized }: FaceAttendanceProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState<RecognizedStudent[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const recognitionInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadModels().catch(err => {
      toast({
        title: 'Error',
        description: 'Failed to load face recognition models',
        variant: 'destructive',
      });
    });

    return () => {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsScanning(true);
      
      toast({
        title: 'Face Recognition Started',
        description: 'Students can now mark attendance by showing their face',
      });
      
      recognitionInterval.current = setInterval(async () => {
        if (!videoRef.current) return;
        
        const match = await recognizeFace(videoRef.current);
        
        if (match) {
          const alreadyRecognized = recognizedStudents.some(
            s => s.studentId === match.studentId
          );
          
          if (!alreadyRecognized) {
            const newStudent: RecognizedStudent = {
              studentId: match.studentId,
              studentName: match.studentName,
              timestamp: new Date().toISOString(),
            };
            
            setRecognizedStudents(prev => [...prev, newStudent]);
            onStudentRecognized?.(match.studentId, match.studentName);
            
            toast({
              title: 'Student Recognized',
              description: `${match.studentName} (${match.studentId})`,
            });
          }
        }
      }, 2000);
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera',
        variant: 'destructive',
      });
    }
  };

  const stopScanning = () => {
    if (recognitionInterval.current) {
      clearInterval(recognitionInterval.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsScanning(false);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Face Recognition Attendance</h3>
        <Badge variant={isScanning ? 'default' : 'secondary'}>
          {isScanning ? 'Scanning...' : 'Stopped'}
        </Badge>
      </div>
      
      <div className="space-y-4">
        {isScanning && (
          <video
            ref={videoRef}
            className="w-full rounded-lg border"
            autoPlay
            muted
            playsInline
          />
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Face Recognition
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          )}
        </div>

        {recognizedStudents.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recognized Students ({recognizedStudents.length})</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {recognizedStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-sm">{student.studentName}</div>
                      <div className="text-xs text-muted-foreground">{student.studentId}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(student.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
