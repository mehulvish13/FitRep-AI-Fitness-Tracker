'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
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
  const [loadingProgress, setLoadingProgress] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const initPose = useCallback(async () => {
    try {
      setLoadingProgress('Loading pose detection engine...');

      const { PoseLandmarker, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      );

      setLoadingProgress('Downloading AI model (may take a moment)...');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

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
      setLoadingProgress('');
      return poseLandmarker;
    } catch (err) {
      console.error('Failed to initialize PoseLandmarker:', err);
      setError(
        'Failed to load pose detection model. Please check your internet connection and try again.'
      );
      setLoadingProgress('');
      return null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize PoseLandmarker first
      const poseLandmarker = await initPose();
      if (!poseLandmarker) return;

      // Now request camera access
      setLoadingProgress('Requesting camera access...');
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
      setLoadingProgress('');

      // Start the detection loop
      const detectLoop = () => {
        if (!cameraOnRef.current || !videoRef.current || !poseLandmarkerRef.current) {
          return;
        }

        const video = videoRef.current;
        const poseLandmarker = poseLandmarkerRef.current;

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

                // Draw skeleton overlay
                if (result.landmarks && result.landmarks.length > 0) {
                  const mpLandmarks = result.landmarks[0];

                  // Convert MediaPipe NormalizedLandmark[] to our Landmark format
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

                  // Pass non-mirrored landmarks to parent for rep counting
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
    } catch (err) {
      console.error('Camera / detection error:', err);
      setError(
        'Camera access denied or initialization failed. Please allow camera access and reload.'
      );
    } finally {
      setLoading(false);
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
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
      {/* Hidden video element for camera feed */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />

      {/* Overlay when camera is off */}
      {!cameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 gap-5">
          {/* Decorative rings */}
          <div className="relative">
            <div className="absolute inset-0 w-28 h-28 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-2 w-24 h-24 rounded-full bg-emerald-500/5 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="w-28 h-28 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center relative">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <div className="text-center max-w-xs">
            <p className="text-gray-200 text-lg font-semibold">
              {loading ? 'Initializing...' : 'Camera Preview'}
            </p>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
              {error
                ? error
                : loading
                  ? loadingProgress || 'Please wait...'
                  : 'Position yourself in frame so AI can detect your pose and count reps'}
            </p>
          </div>
          <Button
            onClick={startCamera}
            disabled={loading}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {loadingProgress || 'Loading...'}
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error overlay (camera on but error) */}
      {error && cameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <Card className="bg-red-950/90 border-red-800 max-w-sm mx-4 rounded-2xl">
            <CardContent className="p-5 text-center">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top controls (visible when camera on) */}
      {cameraOn && !error && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <Badge className="bg-emerald-600/90 text-white border-0 backdrop-blur-sm text-xs font-medium pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse mr-1.5" />
            Live
          </Badge>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm h-8 w-8 rounded-lg"
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Exercise indicator */}
      {cameraOn && exercise && !error && (
        <div className="absolute bottom-3 left-3 z-10">
          <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm text-sm font-medium rounded-lg">
            {exercise.icon} {exercise.name}
          </Badge>
        </div>
      )}
    </div>
  );
}
