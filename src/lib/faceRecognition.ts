import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face recognition models loaded');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw error;
  }
};

export const detectFace = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection;
};

export const captureFaceDescriptor = async (videoElement: HTMLVideoElement): Promise<Float32Array | null> => {
  const detection = await detectFace(videoElement);
  return detection ? detection.descriptor : null;
};

export interface StoredFace {
  studentId: string;
  studentName: string;
  descriptors: number[][];
  createdAt: string;
}

export const saveFaceDescriptor = (studentId: string, studentName: string, descriptor: Float32Array) => {
  const stored = localStorage.getItem('faceDescriptors');
  const data: StoredFace[] = stored ? JSON.parse(stored) : [];
  
  const existingIndex = data.findIndex(item => item.studentId === studentId);
  const descriptorArray = Array.from(descriptor);
  
  if (existingIndex >= 0) {
    data[existingIndex].descriptors.push(descriptorArray);
  } else {
    data.push({
      studentId,
      studentName,
      descriptors: [descriptorArray],
      createdAt: new Date().toISOString(),
    });
  }
  
  localStorage.setItem('faceDescriptors', JSON.stringify(data));
};

export const getAllStoredFaces = (): StoredFace[] => {
  const stored = localStorage.getItem('faceDescriptors');
  return stored ? JSON.parse(stored) : [];
};

export const recognizeFace = async (
  videoElement: HTMLVideoElement,
  threshold: number = 0.6
): Promise<{ studentId: string; studentName: string; distance: number } | null> => {
  const detection = await detectFace(videoElement);
  if (!detection) return null;
  
  const storedFaces = getAllStoredFaces();
  if (storedFaces.length === 0) return null;
  
  let bestMatch: { studentId: string; studentName: string; distance: number } | null = null;
  
  for (const storedFace of storedFaces) {
    for (const descriptorArray of storedFace.descriptors) {
      const storedDescriptor = new Float32Array(descriptorArray);
      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
      
      if (distance < threshold && (!bestMatch || distance < bestMatch.distance)) {
        bestMatch = {
          studentId: storedFace.studentId,
          studentName: storedFace.studentName,
          distance,
        };
      }
    }
  }
  
  return bestMatch;
};

export const deleteFaceData = (studentId: string) => {
  const stored = localStorage.getItem('faceDescriptors');
  if (!stored) return;
  
  const data: StoredFace[] = JSON.parse(stored);
  const filtered = data.filter(item => item.studentId !== studentId);
  localStorage.setItem('faceDescriptors', JSON.stringify(filtered));
};
