import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

interface RecognizedStudent {
  studentId: string;
  studentName: string;
  distance: number;
}

export const FaceRecognitionAttendance = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [recognizedStudent, setRecognizedStudent] = useState<RecognizedStudent | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadModels();
    return () => stopCapture();
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

  const startCapture = async () => {
    if (!courseName) {
      toast({
        title: "Course Required",
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera",
        variant: "destructive",
      });
    }
  };

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setRecognizedStudent(null);
  };

  const recognizeFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    setProcessing(true);
    try {
      // Detect face
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast({
          title: "No Face Detected",
          description: "Please position your face clearly in front of the camera",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Get all stored face data from database
      const { data: faceData, error: faceError } = await supabase
        .from("face_data")
        .select(`
          id,
          descriptors,
          student_id,
          students (
            id,
            student_id,
            profiles (
              name
            )
          )
        `);

      if (faceError) throw faceError;
      if (!faceData || faceData.length === 0) {
        toast({
          title: "No Registered Faces",
          description: "No students have registered their faces yet",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Find best match
      let bestMatch: RecognizedStudent | null = null;
      const threshold = 0.6;

      for (const record of faceData) {
        const descriptors = record.descriptors as number[][];
        for (const descriptorArray of descriptors) {
          const storedDescriptor = new Float32Array(descriptorArray);
          const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);

          if (distance < threshold && (!bestMatch || distance < bestMatch.distance)) {
            bestMatch = {
              studentId: record.students.id,
              studentName: record.students.profiles.name,
              distance,
            };
          }
        }
      }

      if (bestMatch) {
        setRecognizedStudent(bestMatch);
        // Mark attendance
        await markAttendance(bestMatch.studentId);
      } else {
        toast({
          title: "Face Not Recognized",
          description: "No matching student found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Recognition error:", error);
      toast({
        title: "Recognition Error",
        description: "Failed to recognize face",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const markAttendance = async (studentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("attendance").insert({
        student_id: studentId,
        course_name: courseName,
        status: "present",
        date: new Date().toISOString().split("T")[0],
        marked_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Attendance Marked",
        description: `Attendance marked successfully for ${recognizedStudent?.studentName}`,
      });

      setTimeout(() => {
        setRecognizedStudent(null);
      }, 3000);
    } catch (error: any) {
      console.error("Attendance error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Face Recognition Attendance</CardTitle>
        <CardDescription>Mark attendance using face recognition</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!modelsLoaded && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading face recognition models...</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Course Name</label>
          <Select value={courseName} onValueChange={setCourseName} disabled={isCapturing}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="Chemistry">Chemistry</SelectItem>
              <SelectItem value="English">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {recognizedStudent && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg p-6 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <h3 className="text-xl font-bold">{recognizedStudent.studentName}</h3>
                <p className="text-sm text-muted-foreground">
                  Confidence: {((1 - recognizedStudent.distance) * 100).toFixed(1)}%
                </p>
                <p className="text-success font-medium">Attendance Marked!</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCapture} disabled={!modelsLoaded || !courseName} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={recognizeFace} disabled={processing} className="flex-1">
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Recognize Face
              </Button>
              <Button onClick={stopCapture} variant="outline">
                Stop
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
