import { useState, useRef, useEffect } from 'react';
import { Camera, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loadModels, captureFaceDescriptor, saveFaceDescriptor } from '@/lib/faceRecognition';

interface FaceRegistrationProps {
  onComplete?: () => void;
}

export const FaceRegistration = ({ onComplete }: FaceRegistrationProps) => {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const targetCaptures = 10;

  useEffect(() => {
    loadModels().catch(err => {
      toast({
        title: 'Error',
        description: 'Failed to load face recognition models',
        variant: 'destructive',
      });
    });
  }, []);

  const startCapture = async () => {
    if (!studentId || !studentName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter student ID and name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsCapturing(true);
      setCapturedCount(0);
      
      toast({
        title: 'Camera Started',
        description: 'Look at the camera. Capturing faces...',
      });
      
      captureFrames(mediaStream);
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera',
        variant: 'destructive',
      });
    }
  };

  const captureFrames = async (mediaStream: MediaStream) => {
    let count = 0;
    const interval = setInterval(async () => {
      if (!videoRef.current || count >= targetCaptures) {
        clearInterval(interval);
        stopCapture();
        return;
      }

      const descriptor = await captureFaceDescriptor(videoRef.current);
      
      if (descriptor) {
        saveFaceDescriptor(studentId, studentName, descriptor);
        count++;
        setCapturedCount(count);
        
        if (count >= targetCaptures) {
          clearInterval(interval);
          toast({
            title: 'Registration Complete',
            description: `Successfully registered ${studentName}`,
          });
          stopCapture();
          onComplete?.();
        }
      }
    }, 500);
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Register Student Face</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter student ID"
            disabled={isCapturing}
          />
        </div>
        
        <div>
          <Label htmlFor="studentName">Student Name</Label>
          <Input
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student name"
            disabled={isCapturing}
          />
        </div>

        {isCapturing && (
          <div className="space-y-2">
            <video
              ref={videoRef}
              className="w-full rounded-lg border"
              autoPlay
              muted
              playsInline
            />
            <div className="text-sm text-center">
              Captured: {capturedCount} / {targetCaptures}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCapture} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Face Capture
            </Button>
          ) : (
            <Button onClick={stopCapture} variant="destructive" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Stop Capture
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
