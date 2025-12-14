import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Check, X, Hand, Trash2 } from "lucide-react";
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
  const [loadingProgress, setLoadingProgress] = useState({ step: 0, total: 3, currentModel: "" });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>("Waiting...");
  const [lastDetection, setLastDetection] = useState<faceapi.FaceDetection | null>(null);
  const [captureMode, setCaptureMode] = useState<"auto" | "manual">("manual");
  const [isManualCapturing, setIsManualCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const descriptorsRef = useRef<number[][]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const targetCaptures = 10;

  useEffect(() => {
    loadModels();
    fetchStudents();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      console.log("Loading face-api models...");
      
      setLoadingProgress({ step: 1, total: 3, currentModel: "Face Detector" });
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log("TinyFaceDetector loaded");
      
      setLoadingProgress({ step: 2, total: 3, currentModel: "Face Landmarks" });
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log("FaceLandmark68Net loaded");
      
      setLoadingProgress({ step: 3, total: 3, currentModel: "Face Recognition" });
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log("FaceRecognitionNet loaded");
      
      setModelsLoaded(true);
      console.log("All face recognition models loaded successfully");
    } catch (error) {
      console.error("Error loading models:", error);
      toast({
        title: "Error",
        description: "Failed to load face recognition models. Please refresh the page.",
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
          setCapturedPhotos([]);

          toast({
            title: "Camera Started",
            description: captureMode === "manual" 
              ? "Click 'Capture Photo' button to take photos" 
              : "Look at the camera. Auto-capturing faces...",
          });

          // Start continuous face detection for overlay (both modes)
          setTimeout(() => startFaceDetectionOverlay(), 500);
          
          // Only start auto-capture in auto mode
          if (captureMode === "auto") {
            setTimeout(() => captureFrames(), 500);
          }
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

  // Continuous face detection for visual overlay (doesn't capture)
  const startFaceDetectionOverlay = () => {
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 512,
      scoreThreshold: 0.15
    });

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.videoWidth === 0) return;

      try {
        const detection = await faceapi.detectSingleFace(videoRef.current, options);
        
        if (detection) {
          setDetectionStatus(`Face detected! (${(detection.score * 100).toFixed(0)}%)`);
          setLastDetection(detection);
          drawFaceOverlay(detection);
        } else {
          setDetectionStatus("No face - look at camera");
          setLastDetection(null);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      } catch (error) {
        console.error("Detection overlay error:", error);
      }
    }, 200);
  };

  // Manual capture - single photo capture
  const captureManualPhoto = useCallback(async () => {
    if (!videoRef.current || capturedCount >= targetCaptures || isManualCapturing) return;
    
    setIsManualCapturing(true);
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 512,
      scoreThreshold: 0.15
    });

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        descriptorsRef.current.push(Array.from(detection.descriptor));
        const newCount = capturedCount + 1;
        setCapturedCount(newCount);
        
        // Capture photo thumbnail
        if (videoRef.current) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 80;
          tempCanvas.height = 80;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            const box = detection.detection.box;
            ctx.drawImage(
              videoRef.current,
              box.x - 20, box.y - 20, box.width + 40, box.height + 40,
              0, 0, 80, 80
            );
            setCapturedPhotos(prev => [...prev, tempCanvas.toDataURL('image/jpeg', 0.8)]);
          }
        }
        
        toast({
          title: "Photo Captured!",
          description: `${newCount}/${targetCaptures} photos taken`,
        });

        if (newCount >= targetCaptures) {
          setDetectionStatus("Complete!");
          await saveFaceData();
          stopCapture();
        }
      } else {
        toast({
          title: "No Face Detected",
          description: "Please position your face in the camera",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Manual capture error:", error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo",
        variant: "destructive",
      });
    } finally {
      setIsManualCapturing(false);
    }
  }, [capturedCount, targetCaptures, toast]);

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
    // Optimized settings for better detection success
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 512,        // Larger input = more accurate detection
      scoreThreshold: 0.15   // Lower threshold = more lenient detection
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
          
          // Capture photo thumbnail for auto mode
          if (videoRef.current) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 80;
            tempCanvas.height = 80;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
              const box = detection.detection.box;
              ctx.drawImage(
                videoRef.current,
                box.x - 20, box.y - 20, box.width + 40, box.height + 40,
                0, 0, 80, 80
              );
              setCapturedPhotos(prev => [...prev, tempCanvas.toDataURL('image/jpeg', 0.8)]);
            }
          }
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
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
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

      {!modelsLoaded ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {loadingProgress.currentModel ? `Loading: ${loadingProgress.currentModel}` : "Initializing..."}
              </span>
              <span className="font-medium">{loadingProgress.step}/{loadingProgress.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(loadingProgress.step / loadingProgress.total) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Loading face recognition models...</p>
        </div>
      ) : (
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

        {!isCapturing && (
          <div>
            <Label>Capture Mode</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={captureMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setCaptureMode("manual")}
                className="flex-1"
              >
                <Hand className="mr-2 h-4 w-4" />
                Manual
              </Button>
              <Button
                variant={captureMode === "auto" ? "default" : "outline"}
                size="sm"
                onClick={() => setCaptureMode("auto")}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Auto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {captureMode === "manual" 
                ? "Click button to capture each photo manually" 
                : "Automatically captures photos when face is detected"}
            </p>
          </div>
        )}

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
              <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 rounded text-xs">
                {captureMode === "manual" ? "Manual Mode" : "Auto Mode"}
              </div>
            </div>
            
            {/* Manual capture button */}
            {captureMode === "manual" && (
              <Button 
                onClick={captureManualPhoto} 
                className="w-full" 
                size="lg"
                disabled={!lastDetection || isManualCapturing || capturedCount >= targetCaptures}
              >
                <Camera className="mr-2 h-5 w-5" />
                {isManualCapturing ? "Capturing..." : `Capture Photo (${capturedCount}/${targetCaptures})`}
              </Button>
            )}
            
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
            
            {/* Captured photos preview */}
            {capturedPhotos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Captured Photos</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setCapturedPhotos([]);
                      setCapturedCount(0);
                      descriptorsRef.current = [];
                    }}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-2 p-2 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                  {capturedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`Capture ${index + 1}`}
                        className="w-full aspect-square object-cover rounded border border-border"
                      />
                      <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-tl">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCapture} className="w-full" disabled={!modelsLoaded}>
              <Camera className="mr-2 h-4 w-4" />
              {modelsLoaded ? "Start Camera" : "Loading Models..."}
            </Button>
          ) : (
            <Button onClick={stopCapture} variant="destructive" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Stop & Cancel
            </Button>
          )}
        </div>
      </div>
      )}
    </Card>
  );
};
