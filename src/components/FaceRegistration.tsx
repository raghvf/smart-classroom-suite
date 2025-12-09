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
  const videoRef = useRef<HTMLVideoElement>(null);
  const descriptorsRef = useRef<number[][]>([]);
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
        video: { width: 640, height: 480 },
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setIsCapturing(true);
      setCapturedCount(0);
      descriptorsRef.current = [];

      toast({
        title: "Camera Started",
        description: "Look at the camera. Capturing faces...",
      });

      captureFrames();
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  const captureFrames = async () => {
    let count = 0;
    const interval = setInterval(async () => {
      if (!videoRef.current || count >= targetCaptures) {
        clearInterval(interval);
        if (count >= targetCaptures) {
          await saveFaceData();
        }
        stopCapture();
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptorsRef.current.push(Array.from(detection.descriptor));
          count++;
          setCapturedCount(count);
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    }, 500);
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
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
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
