import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Mail, Phone, Camera, CheckCircle, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

interface FacultyMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: string;
}

export default function Faculty() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFaceDialogOpen, setIsFaceDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ step: 0, total: 3, currentModel: "" });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>("Waiting...");
  const [lastDetection, setLastDetection] = useState<faceapi.FaceDetection | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const descriptorsRef = useRef<number[][]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetCaptures = 10;

  // Mock faculty data - in real app, fetch from database
  const facultyMembers: FacultyMember[] = [
    { id: "1", user_id: "uuid-1", name: "Dr. Sarah Johnson", email: "sarah.j@university.edu", phone: "+1234567890", department: "Computer Science", status: "active" },
    { id: "2", user_id: "uuid-2", name: "Prof. Michael Chen", email: "m.chen@university.edu", phone: "+1234567891", department: "Mathematics", status: "active" },
    { id: "3", user_id: "uuid-3", name: "Dr. Emily Brown", email: "e.brown@university.edu", phone: "+1234567892", department: "Physics", status: "active" },
  ];

  useEffect(() => {
    // Load models immediately when component mounts
    loadModels();
    return () => stopCapture();
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

  const startCapture = async () => {
    if (!selectedFaculty) {
      toast({
        title: "Missing Information",
        description: "Please select a faculty member",
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
        
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current?.play();
          setIsCapturing(true);
          setCapturedCount(0);
          descriptorsRef.current = [];
          
          toast({
            title: "Camera Started",
            description: "Look at the camera. Capturing faces...",
          });

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
    const faculty = facultyMembers.find(f => f.id === selectedFaculty);
    if (!faculty) return;

    try {
      // For faculty, we use user_id instead of student_id
      const { data: existing } = await supabase
        .from("face_data")
        .select("id")
        .eq("user_id", faculty.user_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("face_data")
          .update({
            descriptors: descriptorsRef.current,
            user_type: 'faculty'
          })
          .eq("user_id", faculty.user_id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("face_data").insert({
          user_id: faculty.user_id,
          student_id: null,
          descriptors: descriptorsRef.current,
          user_type: 'faculty'
        });

        if (error) throw error;
      }

      toast({
        title: "Registration Complete",
        description: `Successfully registered ${faculty.name}`,
      });
      setIsFaceDialogOpen(false);
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

  if (!user) return null;

  const filteredFaculty = facultyMembers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Faculty Management</h1>
            <p className="text-muted-foreground">Manage faculty members and their details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFaceDialogOpen(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Faculty
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Faculty Members</CardTitle>
                <CardDescription>View and manage all faculty</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell>{faculty.department}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {faculty.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {faculty.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={faculty.status === "active" ? "default" : "secondary"}>
                        {faculty.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Face Registration Dialog */}
        <Dialog open={isFaceDialogOpen} onOpenChange={(open) => {
          if (!open) stopCapture();
          setIsFaceDialogOpen(open);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Face Photos - Faculty</DialogTitle>
              <DialogDescription>
                Register faculty faces for automatic attendance marking
              </DialogDescription>
            </DialogHeader>
            
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
                <Label htmlFor="faculty">Select Faculty Member</Label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty} disabled={isCapturing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyMembers.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name} - {faculty.department}
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
                  <Button onClick={startCapture} className="w-full" disabled={!modelsLoaded || !selectedFaculty}>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}