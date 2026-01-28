import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, XCircle, Loader2, Users, ScanFace, Hand, Play, Square } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

interface RecognizedStudent {
  studentId: string;
  studentName: string;
  distance: number;
  timestamp: Date;
}

interface FaceDataRecord {
  id: string;
  descriptors: number[][];
  student_id: string;
  students: {
    id: string;
    student_id: string;
    profiles: {
      name: string;
    } | null;
  };
}

export const FaceRecognitionAttendance = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [detectionStatus, setDetectionStatus] = useState<string>("Waiting...");
  const [currentDetection, setCurrentDetection] = useState<faceapi.FaceDetection | null>(null);
  const [markedStudents, setMarkedStudents] = useState<RecognizedStudent[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [faceDataCache, setFaceDataCache] = useState<FaceDataRecord[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const loadFaceData = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setFaceDataCache((data || []) as unknown as FaceDataRecord[]);
      console.log(`Loaded ${data?.length || 0} face records`);
    } catch (error) {
      console.error("Error loading face data:", error);
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
      // Load face data before starting
      await loadFaceData();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          setIsCapturing(true);
          setMarkedStudents([]);
          setDetectionStatus("Starting...");
          
          // Start continuous detection after a small delay
          setTimeout(() => startContinuousDetection(), 500);
        };
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

  const drawFaceOverlay = useCallback((detection: faceapi.FaceDetection | null, recognized: boolean, name?: string) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (detection) {
      const box = detection.box;
      
      // Draw bounding box
      ctx.strokeStyle = recognized ? '#22c55e' : '#eab308';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      // Draw corner accents
      const cornerLength = 20;
      ctx.lineWidth = 4;
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + cornerLength);
      ctx.lineTo(box.x, box.y);
      ctx.lineTo(box.x + cornerLength, box.y);
      ctx.stroke();
      
      // Top-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLength, box.y);
      ctx.lineTo(box.x + box.width, box.y);
      ctx.lineTo(box.x + box.width, box.y + cornerLength);
      ctx.stroke();
      
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + box.height - cornerLength);
      ctx.lineTo(box.x, box.y + box.height);
      ctx.lineTo(box.x + cornerLength, box.y + box.height);
      ctx.stroke();
      
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
      ctx.stroke();
      
      // Draw label
      if (name) {
        ctx.fillStyle = recognized ? '#22c55e' : '#eab308';
        ctx.font = 'bold 16px sans-serif';
        const textWidth = ctx.measureText(name).width;
        ctx.fillRect(box.x, box.y - 28, textWidth + 16, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(name, box.x + 8, box.y - 10);
      }
    }
  }, []);

  const startContinuousDetection = useCallback(() => {
    // Optimized settings for better detection success
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 512,        // Larger input = more accurate detection
      scoreThreshold: 0.15   // Lower threshold = more lenient detection
    });

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.videoWidth === 0) {
        return;
      }

      try {
        setDetectionStatus("Scanning...");
        
        const detection = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          setCurrentDetection(detection.detection);
          setDetectionStatus(`Face detected (${(detection.detection.score * 100).toFixed(0)}%)`);
          
          if (isAutoMode && faceDataCache.length > 0) {
            // Try to recognize
            const match = findBestMatch(detection.descriptor);
            
            if (match) {
              const alreadyMarked = markedStudents.some(s => s.studentId === match.studentId);
              
              if (!alreadyMarked) {
                drawFaceOverlay(detection.detection, true, match.studentName);
                await markAttendance(match);
              } else {
                drawFaceOverlay(detection.detection, true, `${match.studentName} ✓`);
                setDetectionStatus(`${match.studentName} - Already marked`);
              }
            } else {
              drawFaceOverlay(detection.detection, false, "Unknown");
              setDetectionStatus("Face not recognized");
            }
          } else {
            drawFaceOverlay(detection.detection, false);
          }
        } else {
          setCurrentDetection(null);
          setDetectionStatus("No face detected - look at camera");
          drawFaceOverlay(null, false);
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    }, 800);
  }, [isAutoMode, faceDataCache, markedStudents, drawFaceOverlay]);

  const findBestMatch = (descriptor: Float32Array): RecognizedStudent | null => {
    let bestMatch: RecognizedStudent | null = null;
    const threshold = 0.65; // Slightly higher = more lenient matching

    for (const record of faceDataCache) {
      if (!record.students?.profiles?.name) continue;
      
      const descriptors = record.descriptors as number[][];
      for (const descriptorArray of descriptors) {
        const storedDescriptor = new Float32Array(descriptorArray);
        const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);

        if (distance < threshold && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = {
            studentId: record.students.id,
            studentName: record.students.profiles.name,
            distance,
            timestamp: new Date(),
          };
        }
      }
    }

    return bestMatch;
  };

  const markAttendance = async (student: RecognizedStudent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("attendance").insert({
        student_id: student.studentId,
        course_name: courseName,
        status: "present",
        date: new Date().toISOString().split("T")[0],
        marked_by: user.id,
      });

      if (error) throw error;

      setMarkedStudents(prev => [...prev, student]);
      setDetectionStatus(`${student.studentName} - Marked!`);
      
      toast({
        title: "Attendance Marked",
        description: `${student.studentName} marked present`,
      });
    } catch (error: any) {
      console.error("Attendance error:", error);
      if (!error.message?.includes("duplicate")) {
        toast({
          title: "Error",
          description: error.message || "Failed to mark attendance",
          variant: "destructive",
        });
      }
    }
  };

  const stopCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setCurrentDetection(null);
    setDetectionStatus("Waiting...");
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const stopAutoDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDetectionStatus("Auto-detection paused");
  };

  const resumeAutoDetection = () => {
    if (isCapturing && isAutoMode && !intervalRef.current) {
      startContinuousDetection();
    }
  };

  const manualCapture = async () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0 || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    try {
      const options = new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 512,
        scoreThreshold: 0.15
      });

      setDetectionStatus("Capturing...");

      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setCurrentDetection(detection.detection);
        
        if (faceDataCache.length > 0) {
          const match = findBestMatch(detection.descriptor);
          
          if (match) {
            const alreadyMarked = markedStudents.some(s => s.studentId === match.studentId);
            
            if (!alreadyMarked) {
              drawFaceOverlay(detection.detection, true, match.studentName);
              await markAttendance(match);
            } else {
              drawFaceOverlay(detection.detection, true, `${match.studentName} ✓`);
              setDetectionStatus(`${match.studentName} - Already marked`);
              toast({
                title: "Already Marked",
                description: `${match.studentName} was already marked present`,
              });
            }
          } else {
            drawFaceOverlay(detection.detection, false, "Unknown");
            setDetectionStatus("Face not recognized");
            toast({
              title: "Not Recognized",
              description: "Face was detected but not recognized in the system",
              variant: "destructive",
            });
          }
        } else {
          drawFaceOverlay(detection.detection, false, "No face data");
          setDetectionStatus("No face data loaded");
          toast({
            title: "No Face Data",
            description: "Please register student faces first",
            variant: "destructive",
          });
        }
      } else {
        setCurrentDetection(null);
        setDetectionStatus("No face detected");
        drawFaceOverlay(null, false);
        toast({
          title: "No Face Detected",
          description: "Please position your face in front of the camera",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Manual capture error:", error);
      setDetectionStatus("Capture failed");
      toast({
        title: "Capture Error",
        description: "Failed to process face capture",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAutoMode = (enabled: boolean) => {
    setIsAutoMode(enabled);
    if (isCapturing) {
      if (enabled) {
        startContinuousDetection();
      } else {
        stopAutoDetection();
        setDetectionStatus("Manual mode - Click capture");
      }
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanFace className="h-6 w-6" />
          Face Recognition Attendance
        </CardTitle>
        <CardDescription>Real-time face detection and automatic attendance marking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!modelsLoaded && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading face recognition models...</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
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

          {/* Mode Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Detection Mode</label>
            <div className="flex items-center gap-3 h-10 px-3 rounded-md border bg-background">
              <Hand className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Manual</span>
              <Switch 
                checked={isAutoMode} 
                onCheckedChange={toggleAutoMode}
                disabled={!isCapturing}
              />
              <span className="text-sm text-muted-foreground">Auto</span>
              <Play className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-end gap-2">
            {!isCapturing ? (
              <Button onClick={startCapture} disabled={!modelsLoaded || !courseName} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCapture} variant="destructive" className="flex-1">
                <Square className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Video Feed */}
          <div className="md:col-span-2 space-y-2">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              
              {/* Status Badge */}
              {isCapturing && (
                <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                  currentDetection ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                }`}>
                  {currentDetection ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {detectionStatus}
                </div>
              )}
              
              {/* Face Data Status */}
              {isCapturing && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-medium bg-background/80 text-foreground">
                  {faceDataCache.length} faces loaded
                </div>
              )}

              {/* Flash effect overlay */}
              {showFlash && (
                <div className="absolute inset-0 bg-white animate-[flash_0.15s_ease-out] pointer-events-none" />
              )}

              {/* Manual Capture Button - Floating */}
              {isCapturing && !isAutoMode && (
                <button
                  onClick={manualCapture}
                  disabled={isProcessing}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8" />
                  )}
                </button>
              )}

              {/* Mode indicator badge */}
              {isCapturing && (
                <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isAutoMode ? 'bg-green-500/90 text-white' : 'bg-orange-500/90 text-white'
                }`}>
                  {isAutoMode ? '🔄 Auto Mode' : '👆 Manual Mode'}
                </div>
              )}
              
              {!isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Camera inactive</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Marked Students List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4" />
              Marked Today ({markedStudents.length})
            </div>
            <div className="h-[200px] md:h-[280px] overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-2">
              {markedStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No students marked yet
                </p>
              ) : (
                markedStudents.map((student, index) => (
                  <div 
                    key={student.studentId} 
                    className="flex items-center gap-2 p-2 bg-background rounded-md text-sm animate-in slide-in-from-right"
                  >
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isCapturing && markedStudents.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session Progress</span>
              <span className="font-medium">{markedStudents.length} students marked</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (markedStudents.length / 30) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
