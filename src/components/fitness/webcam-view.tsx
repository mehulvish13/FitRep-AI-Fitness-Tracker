'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Maximize2, Minimize2, RefreshCw, MonitorSmartphone } from 'lucide-react';
import type { Landmark } from '@/lib/pose-detection';
import { drawSkeleton } from '@/lib/pose-detection';
import type { ExerciseConfig } from '@/lib/exercises';

interface WebcamViewProps {
  exercise: ExerciseConfig | null;
  isActive: boolean;
  onPoseDetected: (landmarks: Landmark[]) => void;
  onFrame: (video: HTMLVideoElement) => void;
}

export default function WebcamView({
  exercise,
  isActive,
  onPoseDetected,
  onFrame,
}: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const poseLandmarkerRef = useRef<any>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const cameraOnRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [fps, setFps] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsCounterRef = useRef<number[]>([]);

  const loadingSteps = [
    'Initializing pose engine...',
    'Loading AI model from CDN...',
    'Configuring detection parameters...',
    'Requesting camera access...',
    'Starting real-time detection...',
  ];

  const initPose = useCallback(async () => {
    try {
      // Dynamic import to avoid Turbopack chunk issues
      setLoadingStep(1);
      setLoadingProgress(loadingSteps[0]);

      const visionModule = await import(
        '@mediapipe/tasks-vision'
      );

      setLoadingStep(2);
      setLoadingProgress(loadingSteps[1]);

      const { PoseLandmarker, FilesetResolver } = visionModule;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );

      setLoadingStep(3);
      setLoadingProgress(loadingSteps[2]);

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerRef.current = poseLandmarker;
      return poseLandmarker;
    } catch (err) {
      console.error('Failed to initialize PoseLandmarker:', err);
      setError(
        'Failed to load AI model. Please check your internet connection and try again.'
      );
      return null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      const poseLandmarker = await initPose();
      if (!poseLandmarker) return;

      setLoadingStep(4);
      setLoadingProgress(loadingSteps[3]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      streamRef.current = stream;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
      });

      setCameraOn(true);
      cameraOnRef.current = true;
      lastVideoTimeRef.current = -1;

      setLoadingStep(5);
      setLoadingProgress(loadingSteps[4]);

      // Start the detection loop
      const detectLoop = () => {
        if (!cameraOnRef.current || !videoRef.current || !poseLandmarkerRef.current) {
          return;
        }

        const video = videoRef.current;
        const poseLandmarker = poseLandmarkerRef.current;

        // FPS calculation
        const now = performance.now();
        fpsCounterRef.current.push(now);
        fpsCounterRef.current = fpsCounterRef.current.filter(t => now - t < 1000);
        if (fpsCounterRef.current.length > 1) {
          setFps(fpsCounterRef.current.length);
        }

        // Only detect when video has a new frame
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          try {
            const result = poseLandmarker.detectForVideo(video, performance.now());

            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw mirrored camera feed
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.restore();

                // Semi-transparent overlay for better skeleton visibility
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                if (result.landmarks && result.landmarks.length > 0) {
                  const mpLandmarks = result.landmarks[0];

                  const landmarks: Landmark[] = mpLandmarks.map((lm: any) => ({
                    x: lm.x,
                    y: lm.y,
                    z: lm.z || 0,
                    visibility: lm.visibility || lm.presence || 0,
                  }));

                  // Build highlight set for current exercise joints
                  let highlightIndices: Set<number> | undefined;
                  if (exercise) {
                    highlightIndices = new Set([
                      exercise.landmarks.first,
                      exercise.landmarks.mid,
                      exercise.landmarks.end,
                    ]);
                    if (exercise.bilateral && exercise.secondaryLandmarks) {
                      highlightIndices.add(exercise.secondaryLandmarks.first);
                      highlightIndices.add(exercise.secondaryLandmarks.mid);
                      highlightIndices.add(exercise.secondaryLandmarks.end);
                    }
                  }

                  drawSkeleton(ctx, landmarks, {
                    mirror: true,
                    highlightIndices,
                  });

                  onPoseDetected(landmarks);
                }
              }
            }

            onFrame(video);
          } catch {
            // Silently handle per-frame errors
          }
        }

        animFrameRef.current = requestAnimationFrame(detectLoop);
      };

      detectLoop();
    } catch (err: any) {
      console.error('Camera / detection error:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings and reload.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Camera initialization failed. Please check your permissions and reload.');
      }
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  }, [initPose, exercise, onPoseDetected, onFrame]);

  const stopCamera = useCallback(() => {
    cameraOnRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.close();
      poseLandmarkerRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    setCameraOn(false);
    setFps(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!fullscreen) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 group">
      {/* Hidden video element */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Canvas for rendering */}
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 z-20">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MonitorSmartphone className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <div className="text-center max-w-xs">
            <p className="text-gray-100 text-lg font-semibold">Initializing AI Detection</p>
            <p className="text-gray-400 text-sm mt-1.5">{loadingProgress}</p>
          </div>
          {/* Step indicators */}
          <div className="flex gap-1.5 mt-6">
            {loadingSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < loadingStep ? 'w-6 bg-emerald-500' : 'w-1.5 bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Camera off overlay */}
      {!cameraOn && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 z-10">
          {/* Decorative rings */}
          <div className="relative mb-6">
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-3 w-24 h-24 rounded-full bg-emerald-500/5 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="w-32 h-32 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center relative border border-gray-700/50">
              <Camera className="w-14 h-14 text-gray-400" />
            </div>
          </div>
          <div className="text-center max-w-xs px-4">
            <p className="text-gray-100 text-lg font-semibold">Camera Preview</p>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
              {error || 'Position yourself in the camera frame so AI can detect your pose and count reps in real-time'}
            </p>
          </div>
          <Button
            onClick={startCamera}
            size="lg"
            className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:scale-[1.02]"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        </div>
      )}

      {/* Error overlay (camera was on but error occurred) */}
      {error && cameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="bg-red-950/90 border border-red-800/50 backdrop-blur-sm max-w-sm mx-4 rounded-2xl p-5 text-center">
            <CameraOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-200 text-sm leading-relaxed">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-red-700 text-red-300 hover:bg-red-900 rounded-xl"
              onClick={() => { stopCamera(); setTimeout(startCamera, 500); }}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Top controls bar (visible when camera on) */}
      {cameraOn && !error && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <Badge className="bg-black/60 text-white border-0 backdrop-blur-md text-xs font-medium pointer-events-auto shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
            LIVE
          </Badge>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            {fps > 0 && (
              <Badge variant="secondary" className="bg-black/60 text-gray-300 border-0 backdrop-blur-md text-xs">
                {fps} FPS
              </Badge>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-md h-8 w-8 rounded-lg"
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Bottom exercise indicator */}
      {cameraOn && exercise && !error && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between pointer-events-none">
          <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-md text-sm font-medium rounded-lg shadow-lg">
            {exercise.icon} {exercise.name}
          </Badge>
          {isActive && (
            <Badge className="bg-emerald-600/80 text-white border-0 backdrop-blur-md text-xs font-medium rounded-lg shadow-lg animate-pulse">
              Detecting
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
