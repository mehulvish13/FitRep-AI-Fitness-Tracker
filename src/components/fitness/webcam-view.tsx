'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import type { Landmark } from '@/lib/pose-detection';
import { POSE_CONNECTIONS, KEY_LANDMARKS } from '@/lib/pose-detection';
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
  const animationRef = useRef<number>(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize MediaPipe Pose
  const poseRef = useRef<any>(null);

  const initPose = useCallback(async () => {
    try {
      // @ts-expect-error - MediaPipe types
      const { Pose } = await import('@mediapipe/pose');
      // @ts-expect-error - MediaPipe types
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas size to video display size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw camera feed (mirrored)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (results.poseLandmarks) {
          // Mirror landmarks for display
          const mirroredLandmarks = results.poseLandmarks.map((lm: any) => ({
            ...lm,
            x: 1 - lm.x,
          }));

          // Draw skeleton connections
          drawConnectors(ctx, mirroredLandmarks, POSE_CONNECTIONS as any, {
            color: '#22c55e',
            lineWidth: 3,
          });

          // Highlight key landmarks for current exercise
          if (exercise) {
            const highlightIndices = new Set([
              exercise.landmarks.first,
              exercise.landmarks.mid,
              exercise.landmarks.end,
            ]);
            if (exercise.bilateral && exercise.secondaryLandmarks) {
              highlightIndices.add(exercise.secondaryLandmarks.first);
              highlightIndices.add(exercise.secondaryLandmarks.mid);
              highlightIndices.add(exercise.secondaryLandmarks.end);
            }

            const highlightLandmarks = mirroredLandmarks.filter(
              (_: any, i: number) => highlightIndices.has(i)
            );
            
            drawLandmarks(ctx, highlightLandmarks, {
              color: '#ef4444',
              lineWidth: 2,
              radius: 6,
            });
          }

          // Draw all landmarks
          drawLandmarks(ctx, mirroredLandmarks, {
            color: '#ffffff',
            lineWidth: 1,
            radius: 3,
            fillColor: '#22c55e',
          });

          // Pass original (non-mirrored) landmarks to parent
          onPoseDetected(results.poseLandmarks);
        }

        // Pass video frame
        onFrame(video);
      });

      poseRef.current = pose;
      return pose;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Pose:', err);
      setError('Failed to load pose detection model. Please check your internet connection.');
      return null;
    }
  }, [exercise, onPoseDetected, onFrame]);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraOn(true);

        // Initialize pose detection
        const pose = await initPose();
        if (pose && videoRef.current) {
          // Start sending frames to MediaPipe
          const sendFrame = async () => {
            if (videoRef.current && poseRef.current && cameraOn) {
              try {
                await poseRef.current.send({ image: videoRef.current });
              } catch (e) {
                // Silently handle frame send errors
              }
              animationRef.current = requestAnimationFrame(sendFrame);
            }
          };
          
          videoRef.current.onloadedmetadata = () => {
            sendFrame();
          };
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera access to use the pose detector.');
    } finally {
      setLoading(false);
    }
  }, [cameraOn, initPose]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
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
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group">
      {/* Video element (hidden, used for camera feed) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />

      {/* Overlay when camera is off */}
      {!cameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-lg font-medium">Camera Preview</p>
            <p className="text-gray-500 text-sm mt-1">
              {error || 'Start camera to begin exercise tracking'}
            </p>
          </div>
          <Button
            onClick={startCamera}
            disabled={loading}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Loading Model...' : 'Start Camera'}
          </Button>
        </div>
      )}

      {/* Error overlay */}
      {error && cameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <Card className="bg-red-950/90 border-red-800 max-w-sm mx-4">
            <CardContent className="p-4 text-center">
              <CameraOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-200 text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-700 text-red-300 hover:bg-red-900"
                onClick={startCamera}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top controls */}
      {cameraOn && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <Badge variant="secondary" className="bg-emerald-600/80 text-white border-0 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse mr-1.5" />
            Live
          </Badge>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm h-8 w-8"
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Exercise indicator */}
      {cameraOn && exercise && (
        <div className="absolute bottom-3 left-3 z-10">
          <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm text-sm">
            {exercise.icon} {exercise.name}
          </Badge>
        </div>
      )}
    </div>
  );
}
