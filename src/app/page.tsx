'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dumbbell, History, Play, Square, Pause, RotateCcw,
  Trophy, ChevronLeft, ChevronRight, Volume2, VolumeX,
  Info, Activity, Zap, Heart, Timer, Target, Flame, Shield, Sparkles,
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

type AppView = 'select' | 'workout' | 'history';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

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
  // Rest timer
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(30);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);
  const lastProcessedRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevRepsRef = useRef(0);

  // Fetch workout history
  useEffect(() => {
    fetch('/api/workouts')
      .then(res => res.json())
      .then(data => setWorkouts(data || []))
      .catch(() => {});
  }, []);

  // Main workout timer
  useEffect(() => {
    if (isWorkoutActive && !isResting) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isWorkoutActive, isResting]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            setIsWorkoutActive(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [isResting, restTimer]);

  // Play beep sound
  const playSound = useCallback((freq: number = 880, duration: number = 0.12) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
  }, [soundEnabled]);

  // Handle pose detection results
  const handlePoseDetected = useCallback((landmarks: Landmark[]) => {
    landmarksRef.current = landmarks;
    if (!selectedExercise || !isWorkoutActive) return;

    const now = Date.now();
    if (now - lastProcessedRef.current < 66) return; // ~15fps throttle
    lastProcessedRef.current = now;

    const newState = updateRepCounter(counterState, landmarks, selectedExercise);
    setCounterState(newState);

    // Play sound on rep count
    if (newState.reps > prevRepsRef.current) {
      playSound(880, 0.12);
      // Play double beep on target reached
      if (newState.currentSetReps === targetReps) {
        setTimeout(() => playSound(1100, 0.2), 150);
      }
    }
    prevRepsRef.current = newState.reps;
  }, [selectedExercise, isWorkoutActive, counterState, playSound, targetReps]);

  const handleFrame = useCallback((_video: HTMLVideoElement) => {}, []);

  // Start workout
  const startWorkout = useCallback((exercise: ExerciseConfig) => {
    setSelectedExercise(exercise);
    setCounterState(createInitialCounterState());
    prevRepsRef.current = 0;
    setElapsedTime(0);
    setIsWorkoutActive(true);
    setIsResting(false);
    setRestTimer(0);
    setView('workout');
  }, []);

  // Stop workout
  const stopWorkout = useCallback(() => {
    setIsWorkoutActive(false);
    setIsResting(false);
    setView('select');
  }, []);

  // Complete set → trigger rest timer
  const handleCompleteSet = useCallback(() => {
    if (counterState.currentSetReps === 0) return;
    const newState = completeSet(counterState);
    setCounterState(newState);
    prevRepsRef.current = 0;

    // Start rest timer
    setIsWorkoutActive(false);
    setIsResting(true);
    setRestTimer(restDuration);
    playSound(660, 0.15);
  }, [counterState, restDuration, playSound]);

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
          avgFormScore: counterState.formScore,
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
      setIsResting(false);
      setSelectedExercise(null);
      setCounterState(createInitialCounterState());
      prevRepsRef.current = 0;
      setElapsedTime(0);
      setView('select');
    }
  }, [selectedExercise, counterState, elapsedTime]);

  // Delete workout
  const handleDeleteWorkout = useCallback(async (id: string) => {
    try {
      await fetch(`/api/workouts?id=${id}`, { method: 'DELETE' });
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch { /* ignore */ }
  }, []);

  const handleReset = useCallback(() => {
    setCounterState(resetCounter());
    prevRepsRef.current = 0;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">FitRep Counter</h1>
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium">
              AI Powered
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Button
              variant={view === 'history' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg ${
                view === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : ''
              }`}
              onClick={() => setView(view === 'history' ? 'select' : 'history')}
            >
              <History className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <AnimatePresence mode="wait">
          {/* Exercise Selection View */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Hero */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Track Your <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">Reps</span> with AI
                  </h2>
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg">
                  Select an exercise, position yourself in the camera, and let AI count your reps in real-time with form feedback.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Exercise Selector */}
                <div className="lg:col-span-2">
                  <Card className="shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                      <ExerciseSelector
                        selectedExercise={selectedExercise}
                        onSelect={startWorkout}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2.5">
                      {[
                        { label: 'Total Workouts', value: workouts.length, icon: Trophy, color: 'text-emerald-500' },
                        { label: 'Total Reps', value: workouts.reduce((s, w) => s + w.totalReps, 0), icon: Target, color: 'text-sky-500' },
                        { label: 'Calories Burned', value: Math.round(workouts.reduce((s, w) => s + w.calories, 0)), icon: Flame, color: 'text-orange-500' },
                      ].map((stat, i) => (
                        <React.Fragment key={stat.label}>
                          {i > 0 && <Separator />}
                          <div className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-2">
                              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                              <span className="text-sm text-muted-foreground">{stat.label}</span>
                            </div>
                            <span className="font-semibold text-sm tabular-nums">{stat.value.toLocaleString()}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </CardContent>
                  </Card>

                  {/* How It Works */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-500" />
                        How It Works
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2.5">
                      {[
                        { step: 1, text: 'Choose your exercise' },
                        { step: 2, text: 'Allow camera access' },
                        { step: 3, text: 'AI detects your pose' },
                        { step: 4, text: 'Reps counted automatically' },
                      ].map(item => (
                        <div key={item.step} className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {item.step}
                          </span>
                          <span className="text-sm text-muted-foreground">{item.text}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Features */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {[
                        'Real-time pose detection',
                        'Form quality scoring',
                        'Rest timer between sets',
                        'Set & rep tracking',
                        'Calorie estimation',
                        'Workout history',
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="w-3 h-3 text-emerald-500 flex-shrink-0" />
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
              transition={{ duration: 0.25 }}
            >
              {/* Workout Header */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopWorkout}
                  className="text-muted-foreground -ml-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {selectedExercise.icon} {selectedExercise.name}
                  </Badge>
                  {!isWorkoutActive && !isResting && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                      onClick={() => setIsWorkoutActive(true)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  )}
                  {isWorkoutActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg"
                      onClick={() => setIsWorkoutActive(false)}
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                  )}
                </div>
              </div>

              {/* Rest Timer Overlay */}
              <AnimatePresence>
                {isResting && restTimer > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                  >
                    <Card className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center border-0">
                      <div className="mb-4">
                        <Timer className="w-12 h-12 text-emerald-500 mx-auto" />
                      </div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">Rest Time</p>
                      <p className="text-6xl font-black text-foreground tabular-nums tracking-tight">{restTimer}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Next set: Set {counterState.sets.length + 2}
                      </p>
                      <div className="flex gap-2 mt-6 justify-center">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            setIsResting(false);
                            setIsWorkoutActive(true);
                            setRestTimer(0);
                          }}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Skip Rest
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setRestTimer(prev => prev + 15)}
                        >
                          +15s
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
                {/* Camera View */}
                <div className="lg:col-span-3">
                  <WebcamView
                    exercise={selectedExercise}
                    isActive={isWorkoutActive}
                    onPoseDetected={handlePoseDetected}
                    onFrame={handleFrame}
                  />

                  {/* Target Reps & Rest Duration Controls */}
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Target reps:</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => setTargetReps(Math.max(1, targetReps - 5))}
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={targetReps}
                          onChange={(e) => setTargetReps(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center text-sm rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => setTargetReps(targetReps + 5)}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Rest:</span>
                      <Input
                        type="number"
                        value={restDuration}
                        onChange={(e) => setRestDuration(Math.max(5, parseInt(e.target.value) || 30))}
                        className="w-14 h-7 text-center text-sm rounded-lg"
                      />
                      <span className="text-xs text-muted-foreground">sec</span>
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
                    className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:shadow-emerald-500/40"
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
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('select')}
                  className="text-muted-foreground -ml-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Workout History</h2>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card className="shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <WorkoutHistory workouts={workouts} onDelete={handleDeleteWorkout} />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3 h-3" />
              <span className="font-medium">FitRep Counter</span>
              <span>— AI-Powered Exercise Rep Counter</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                MediaPipe Pose Detection
              </span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span>Built with Next.js</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
