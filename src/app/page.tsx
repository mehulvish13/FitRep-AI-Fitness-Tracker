'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dumbbell,
  History,
  Play,
  Square,
  RotateCcw,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Info,
  Activity,
  Zap,
  Heart,
} from 'lucide-react';

import WebcamView from '@/components/fitness/webcam-view';
import ExerciseSelector from '@/components/fitness/exercise-selector';
import RepCounterDisplay from '@/components/fitness/rep-counter-display';
import WorkoutHistory, { type WorkoutRecord } from '@/components/fitness/workout-history';

import { EXERCISES, type ExerciseConfig } from '@/lib/exercises';
import type { Landmark } from '@/lib/pose-detection';
import type { RepCounterState } from '@/lib/rep-counter';
import {
  createInitialCounterState,
  updateRepCounter,
  completeSet,
  resetCounter,
} from '@/lib/rep-counter';

type AppView = 'select' | 'workout' | 'history' | 'settings';

export default function FitnessRepCounter() {
  const [view, setView] = useState<AppView>('select');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);
  const [counterState, setCounterState] = useState<RepCounterState>(createInitialCounterState());
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [targetReps, setTargetReps] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);
  const lastProcessedRef = useRef<number>(0);

  // Audio context for rep sounds
  const audioContextRef = useRef<AudioContext | null>(null);

  // Fetch workout history
  useEffect(() => {
    fetch('/api/workouts')
      .then(res => res.json())
      .then(data => setWorkouts(data || []))
      .catch(() => {});
  }, []);

  // Timer for active workout
  useEffect(() => {
    if (isWorkoutActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkoutActive]);

  // Play rep count sound
  const playRepSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled]);

  // Handle pose detection results
  const handlePoseDetected = useCallback((landmarks: Landmark[]) => {
    landmarksRef.current = landmarks;

    if (!selectedExercise || !isWorkoutActive) return;

    // Throttle to ~15fps for smoother rep counting
    const now = Date.now();
    if (now - lastProcessedRef.current < 66) return;
    lastProcessedRef.current = now;

    const prevState = counterState;
    const newState = updateRepCounter(prevState, landmarks, selectedExercise);
    setCounterState(newState);

    // Play sound on rep count
    if (newState.reps > prevState.reps) {
      playRepSound();
    }
  }, [selectedExercise, isWorkoutActive, counterState, playRepSound]);

  // Handle video frame (not used currently but required by WebcamView)
  const handleFrame = useCallback((_video: HTMLVideoElement) => {
    // Can be used for additional video processing
  }, []);

  // Start workout
  const startWorkout = useCallback((exercise: ExerciseConfig) => {
    setSelectedExercise(exercise);
    setCounterState(createInitialCounterState());
    setElapsedTime(0);
    setIsWorkoutActive(true);
    setView('workout');
  }, []);

  // Stop workout
  const stopWorkout = useCallback(() => {
    setIsWorkoutActive(false);
    setView('select');
  }, []);

  // Complete set
  const handleCompleteSet = useCallback(async () => {
    if (counterState.currentSetReps === 0) return;
    
    const newState = completeSet(counterState);
    setCounterState(newState);
  }, [counterState]);

  // Finish workout and save
  const finishWorkout = useCallback(async () => {
    if (!selectedExercise) return;

    setIsSaving(true);
    try {
      const totalReps = counterState.sets.reduce((sum, s) => sum + s, 0) + counterState.currentSetReps;
      const totalSets = counterState.sets.length + (counterState.currentSetReps > 0 ? 1 : 0);
      const setsData = counterState.currentSetReps > 0 
        ? [...counterState.sets, counterState.currentSetReps]
        : counterState.sets;

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          totalReps,
          totalSets,
          duration: elapsedTime,
          calories: counterState.calories,
          setsData,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setWorkouts(prev => [saved, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save workout:', err);
    } finally {
      setIsSaving(false);
      setIsWorkoutActive(false);
      setSelectedExercise(null);
      setCounterState(createInitialCounterState());
      setElapsedTime(0);
      setView('select');
    }
  }, [selectedExercise, counterState, elapsedTime]);

  // Reset counter
  const handleReset = useCallback(() => {
    setCounterState(resetCounter());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg">FitRep Counter</h1>
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
              AI Powered
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant={view === 'history' ? 'default' : 'ghost'}
              size="sm"
              className={view === 'history' ? 'bg-emerald-600 text-white' : ''}
              onClick={() => { setView(view === 'history' ? 'select' : 'history'); }}
            >
              <History className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {/* Exercise Selection View */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero Section */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Track Your <span className="text-emerald-600">Reps</span> with AI
                </h2>
                <p className="text-muted-foreground">
                  Select an exercise, position yourself in the camera, and let AI count your reps in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exercise Selector */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <ExerciseSelector
                        selectedExercise={selectedExercise}
                        onSelect={startWorkout}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Workouts</span>
                        <span className="font-bold">{workouts.length}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Reps</span>
                        <span className="font-bold">{workouts.reduce((s, w) => s + w.totalReps, 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Calories Burned</span>
                        <span className="font-bold">{Math.round(workouts.reduce((s, w) => s + w.calories, 0))}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-500" />
                        How It Works
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span className="text-muted-foreground">Choose your exercise</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span className="text-muted-foreground">Allow camera access</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span className="text-muted-foreground">AI detects your pose</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <span className="text-muted-foreground">Reps counted automatically</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {['Real-time pose detection', 'Multi-exercise support', 'Set & rep tracking', 'Calorie estimation', 'Workout history'].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          {f}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* Workout View */}
          {view === 'workout' && selectedExercise && (
            <motion.div
              key="workout"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* Workout Header */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopWorkout}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {selectedExercise.icon} {selectedExercise.name}
                  </Badge>
                  {!isWorkoutActive && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setIsWorkoutActive(true)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start Counting
                    </Button>
                  )}
                  {isWorkoutActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600"
                      onClick={() => setIsWorkoutActive(false)}
                    >
                      <Square className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                {/* Camera View */}
                <div className="lg:col-span-3">
                  <WebcamView
                    exercise={selectedExercise}
                    isActive={isWorkoutActive}
                    onPoseDetected={handlePoseDetected}
                    onFrame={handleFrame}
                  />

                  {/* Target Reps Control */}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Target reps:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setTargetReps(Math.max(1, targetReps - 5))}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={targetReps}
                        onChange={(e) => setTargetReps(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 h-7 text-center text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setTargetReps(targetReps + 5)}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Counter Display */}
                <div className="lg:col-span-2">
                  <RepCounterDisplay
                    counterState={counterState}
                    exerciseName={selectedExercise.name}
                    elapsedTime={elapsedTime}
                    targetReps={targetReps}
                    onCompleteSet={handleCompleteSet}
                    onReset={handleReset}
                  />

                  {/* Finish Workout Button */}
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold"
                    onClick={finishWorkout}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trophy className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Finish & Save Workout'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* History View */}
          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('select')}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h2 className="text-2xl font-bold">Workout History</h2>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <WorkoutHistory workouts={workouts} />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>FitRep Counter — AI-Powered Exercise Rep Counter</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                MediaPipe Pose Detection
              </span>
              <span>|</span>
              <span>Built with Next.js</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
