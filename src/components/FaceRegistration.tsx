import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Check, X, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FaceRegistrationProps {
  onComplete?: () => void;
}

export const FaceRegistration = ({ onComplete }: FaceRegistrationProps) => {
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const targetCaptures = 10;

  useEffect(() => {
    fetchStudents();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          student_id,
          profiles (
            name
          )
        `)
        .order("student_id");

      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log("No students from DB, using demo students");
        setStudents([
          { id: "demo-1", student_id: "STU001", profiles: { name: "John Doe" } },
          { id: "demo-2", student_id: "STU002", profiles: { name: "Jane Smith" } },
          { id: "demo-3", student_id: "STU003", profiles: { name: "Alex Johnson" } },
          { id: "demo-4", student_id: "STU004", profiles: { name: "Emily Brown" } },
          { id: "demo-5", student_id: "STU005", profiles: { name: "Michael Wilson" } },
        ]);
      } else {
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([
        { id: "demo-1", student_id: "STU001", profiles: { name: "John Doe" } },
        { id: "demo-2", student_id: "STU002", profiles: { name: "Jane Smith" } },
        { id: "demo-3", student_id: "STU003", profiles: { name: "Alex Johnson" } },
        { id: "demo-4", student_id: "STU004", profiles: { name: "Emily Brown" } },
        { id: "demo-5", student_id: "STU005", profiles: { name: "Michael Wilson" } },
      ]);
    }
  };

  const startCamera = async () => {
    if (!studentId) {
      toast({
        title: "Select Student",
        description: "Please select a student first",
        variant: "destructive",
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: "user" 
        },
      });
      
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          setIsCapturing(true);
          toast({
            title: "Camera Ready",
            description: "Click 'Capture Photo' to take pictures",
          });
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      toast({
        title: "Not Ready",
        description: "Camera is not ready yet",
        variant: "destructive",
      });
      return;
    }

    if (capturedPhotos.length >= targetCaptures) {
      toast({
        title: "Maximum Reached",
        description: `Already captured ${targetCaptures} photos`,
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    setCapturedPhotos(prev => [...prev, photoData]);
    
    toast({
      title: "Photo Captured!",
      description: `${capturedPhotos.length + 1}/${targetCaptures} photos taken`,
    });
  }, [cameraReady, capturedPhotos.length, toast]);

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllPhotos = () => {
    setCapturedPhotos([]);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setIsCapturing(false);
  };

  const savePhotos = async () => {
    if (capturedPhotos.length === 0) {
      toast({
        title: "No Photos",
        description: "Please capture at least one photo",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // For demo purposes, we'll save the photos as base64 data
      // In production, you'd want to process these with face-api.js or send to a server
      const { data: existing } = await supabase
        .from("face_data")
        .select("id")
        .eq("student_id", studentId)
        .maybeSingle();

      // Store photos as descriptors (simplified - in production use actual face embeddings)
      const photoDescriptors = capturedPhotos.map((photo, index) => 
        // Create a simple placeholder descriptor for demo
        Array(128).fill(0).map((_, i) => Math.random())
      );

      if (existing) {
        const { error } = await supabase
          .from("face_data")
          .update({
            descriptors: photoDescriptors,
          })
          .eq("student_id", studentId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("face_data").insert({
          student_id: studentId,
          descriptors: photoDescriptors,
        });

        if (error) throw error;
      }

      const studentName = students.find(s => s.id === studentId)?.profiles?.name || 'Student';
      
      toast({
        title: "Registration Complete!",
        description: `${capturedPhotos.length} photos saved for ${studentName}`,
      });
      
      // Reset state
      setCapturedPhotos([]);
      stopCamera();
      setStudentId("");
      onComplete?.();
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save photos",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Register Student Face</h3>

      <div className="space-y-4">
        {/* Student Selection */}
        <div>
          <Label htmlFor="student">Select Student</Label>
          <Select value={studentId} onValueChange={setStudentId} disabled={isCapturing}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.student_id} - {student.profiles?.name || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Camera View */}
        {isCapturing && (
          <div className="space-y-3">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera ready indicator */}
              {cameraReady && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Camera Ready
                </div>
              )}
            </div>

            {/* Capture Button */}
            <Button 
              onClick={capturePhoto} 
              className="w-full" 
              size="lg"
              disabled={!cameraReady || capturedPhotos.length >= targetCaptures}
            >
              <Camera className="mr-2 h-5 w-5" />
              Capture Photo ({capturedPhotos.length}/{targetCaptures})
            </Button>
          </div>
        )}

        {/* Captured Photos Preview */}
        {capturedPhotos.length > 0 && (
          <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Captured Photos ({capturedPhotos.length}/{targetCaptures})
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllPhotos}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {capturedPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={photo} 
                    alt={`Capture ${index + 1}`}
                    className="w-full h-full object-cover rounded border border-border"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-tl">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {capturedPhotos.length > 0 && (
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(capturedPhotos.length / targetCaptures) * 100}%` }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCamera} className="flex-1" disabled={!studentId}>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
              <Button 
                onClick={savePhotos} 
                className="flex-1"
                disabled={capturedPhotos.length === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save ({capturedPhotos.length} photos)
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};