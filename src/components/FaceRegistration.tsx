import { useState, useRef, useEffect } from "react";
import { Camera, Check, X } from "lucide-react";
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
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

interface FaceRegistrationProps {
  onComplete?: () => void;
}

export const FaceRegistration = ({ onComplete }: FaceRegistrationProps) => {
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>("Waiting...");
  const [lastDetection, setLastDetection] = useState<faceapi.FaceDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const descriptorsRef = useRef<number[][]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const targetCaptures = 10;

  useEffect(() => {
    loadModels();
    fetchStudents();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      console.log("Face recognition models loaded");
    } catch (error) {
      console.error("Error loading models:", error);
      toast({
        title: "Error",
        description: "Failed to load face recognition models",
        variant: "destructive",
      });
    }
  };

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
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const startCapture = async () => {
    if (!studentId) {
      toast({
        title: "Missing Information",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    if (!modelsLoaded) {
      toast({
        title: "Models Loading",
        description: "Please wait for models to load",
        variant: "destructive",
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be fully loaded before starting capture
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          console.log("Video ready, dimensions:", videoRef.current?.videoWidth, videoRef.current?.videoHeight);
          
          setIsCapturing(true);
          setCapturedCount(0);
          descriptorsRef.current = [];

          toast({
            title: "Camera Started",
            description: "Look at the camera. Capturing faces...",
          });

          // Small delay to ensure video is rendering
          setTimeout(() => captureFrames(), 500);
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  const drawFaceOverlay = (detection: faceapi.FaceDetection) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const box = detection.box;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    ctx.fillStyle = '#22c55e';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${(detection.score * 100).toFixed(0)}%`, box.x, box.y - 10);
  };

  const captureFrames = async () => {
    let count = 0;
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 416, 
      scoreThreshold: 0.2
    });
    
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || count >= targetCaptures) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (count >= targetCaptures) {
          setDetectionStatus("Complete!");
          await saveFaceData();
        }
        stopCapture();
        return;
      }

      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        setDetectionStatus("Video loading...");
        return;
      }

      try {
        setDetectionStatus("Scanning...");
        
        const detection = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          setDetectionStatus(`Face detected! (${(detection.detection.score * 100).toFixed(0)}%)`);
          setLastDetection(detection.detection);
          drawFaceOverlay(detection.detection);
          
          descriptorsRef.current.push(Array.from(detection.descriptor));
          count++;
          setCapturedCount(count);
          console.log(`Captured ${count}/${targetCaptures}`);
        } else {
          setDetectionStatus("No face - look at camera");
          setLastDetection(null);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      } catch (error) {
        console.error("Detection error:", error);
        setDetectionStatus("Detection error");
      }
    }, 600);
  };

  const saveFaceData = async () => {
    try {
      const { data: existing } = await supabase
        .from("face_data")
        .select("id")
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("face_data")
          .update({
            descriptors: descriptorsRef.current,
          })
          .eq("student_id", studentId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("face_data").insert({
          student_id: studentId,
          descriptors: descriptorsRef.current,
        });

        if (error) throw error;
      }

      const studentName = students.find((s) => s.id === studentId)?.profiles?.name || 'Student';
      toast({
        title: "Registration Complete",
        description: `Successfully registered ${studentName}`,
      });
      onComplete?.();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save face data",
        variant: "destructive",
      });
    }
  };

  const stopCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setDetectionStatus("Waiting...");
    setLastDetection(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Register Student Face</h3>

      <div className="space-y-4">
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

        {isCapturing && (
          <div className="space-y-3">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg border"
                autoPlay
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-sm font-medium ${
                lastDetection ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
              }`}>
                {detectionStatus}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{capturedCount} / {targetCaptures} captures</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(capturedCount / targetCaptures) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCapture} className="w-full" disabled={!modelsLoaded}>
              <Camera className="mr-2 h-4 w-4" />
              {modelsLoaded ? "Start Face Capture" : "Loading Models..."}
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
