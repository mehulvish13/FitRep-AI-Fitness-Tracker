'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  Dumbbell, History, Play, Square, Pause, RotateCcw,
  Trophy, ChevronLeft, ChevronRight, Volume2, VolumeX,
  Info, Activity, Zap, Heart, Timer, Target, Flame, Shield, Sparkles,
  Sun, Moon, Download, Award, TrendingUp, Calendar, FlameKindling,
  Settings, Layers, ArrowRight, Home,
} from 'lucide-react';
import WebcamView from '@/components/fitness/webcam-view';
import ExerciseSelector from '@/components/fitness/exercise-selector';
import RepCounterDisplay from '@/components/fitness/rep-counter-display';
import WorkoutHistory, { type WorkoutRecord } from '@/components/fitness/workout-history';
import WorkoutSummary from '@/components/fitness/workout-summary';
import { EXERCISES, type ExerciseConfig } from '@/lib/exercises';
import type { Landmark } from '@/lib/pose-detection';
import type { RepCounterState } from '@/lib/rep-counter';
import {
  createInitialCounterState,
  updateRepCounter,
  completeSet,
  resetCounter,
} from '@/lib/rep-counter';

type AppView = 'select' | 'workout' | 'history' | 'summary';

interface WorkoutSummaryData {
  exerciseName: string;
  exerciseIcon: string;
  totalReps: number;
  totalSets: number;
  duration: number;
  calories: number;
  avgFormScore: number;
  setsData: number[];
  isPersonalBest: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function useHasMounted() {
  return useSyncExternalStore(
    (cb) => { cb(); return () => { }; },
    () => true,
    () => false,
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

// Personal records computation
function computePersonalRecords(workouts: WorkoutRecord[]) {
  if (workouts.length === 0) return null;

  const records: Record<string, { exerciseId: string; exerciseName: string; totalReps: number; calories: number; duration: number; sets: number; createdAt: string }> = {};

  for (const w of workouts) {
    const existing = records[w.exerciseId];
    if (!existing || w.totalReps > existing.totalReps) {
      records[w.exerciseId] = w;
    }
  }

  return Object.values(records).sort((a, b) => b.totalReps - a.totalReps).slice(0, 5);
}

// Weekly data for chart
function computeWeeklyData(workouts: WorkoutRecord[]) {
  const now = new Date();
  const days: { label: string; reps: number; calories: number; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayWorkouts = workouts.filter(w => w.createdAt.split('T')[0] === dayStr);
    days.push({
      label: dayLabel,
      reps: dayWorkouts.reduce((s, w) => s + w.totalReps, 0),
      calories: Math.round(dayWorkouts.reduce((s, w) => s + w.calories, 0)),
      count: dayWorkouts.length,
    });
  }

  return days;
}

// Workout streak calculation
function computeStreak(workouts: WorkoutRecord[]): { current: number; best: number } {
  if (workouts.length === 0) return { current: 0, best: 0 };

  // Get unique workout days
  const workoutDays = new Set<string>();
  for (const w of workouts) {
    workoutDays.add(w.createdAt.split('T')[0]);
  }

  const sortedDays = Array.from(workoutDays).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak: count consecutive days from today/yesterday backward
  let current = 0;
  let checkDate = new Date();

  // If no workout today, start from yesterday
  if (!workoutDays.has(today)) {
    if (!workoutDays.has(yesterday)) {
      return { current: 0, best: computeBestStreak(sortedDays) };
    }
    checkDate = new Date(Date.now() - 86400000);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (workoutDays.has(dateStr)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, best: Math.max(current, computeBestStreak(sortedDays)) };
}

function computeBestStreak(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;

  let best = 1;
  let streak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);

    if (diffDays === 1) {
      streak++;
      best = Math.max(best, streak);
    } else {
      streak = 1;
    }
  }

  return best;
}

// Check if workout is a personal best
function isPersonalBest(exerciseId: string, totalReps: number, workouts: WorkoutRecord[]): boolean {
  const exerciseWorkouts = workouts.filter(w => w.exerciseId === exerciseId && w.id !== '__new__');
  if (exerciseWorkouts.length === 0) return true; // First workout is always a PB
  const best = Math.max(...exerciseWorkouts.map(w => w.totalReps));
  return totalReps > best;
}

export default function FitnessRepCounter() {
  const { resolvedTheme } = useTheme();
  const [view, setView] = useState<AppView>('select');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);
  const [counterState, setCounterState] = useState<RepCounterState>(createInitialCounterState());
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [targetReps, setTargetReps] = useState(10);
  const [targetSets, setTargetSets] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkoutSummaryData | null>(null);
  const mounted = useHasMounted();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);
  const lastProcessedRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevRepsRef = useRef(0);

  const personalRecords = useMemo(() => computePersonalRecords(workouts), [workouts]);
  const weeklyData = useMemo(() => computeWeeklyData(workouts), [workouts]);
  const streak = useMemo(() => computeStreak(workouts), [workouts]);

  // Fetch workout history
  useEffect(() => {
    fetch('/api/workouts')
      .then(res => res.json())
      .then((data) => setWorkouts(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, []);

  // Main workout timer
  useEffect(() => {
    if (isWorkoutActive && !isResting) {
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
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
            playSound(1100, 0.25);
            toast.success('Rest complete! Ready for next set.');
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
    if (now - lastProcessedRef.current < 66) return;
    lastProcessedRef.current = now;

    const newState = updateRepCounter(counterState, landmarks, selectedExercise);
    setCounterState(newState);

    if (newState.reps > prevRepsRef.current) {
      playSound(880, 0.12);
      if (newState.currentSetReps === targetReps) {
        setTimeout(() => playSound(1100, 0.2), 150);
        toast.success(`Target of ${targetReps} reps reached!`);
      }
    }
    prevRepsRef.current = newState.reps;
  }, [selectedExercise, isWorkoutActive, counterState, playSound, targetReps]);

  const handleFrame = useCallback((_video: HTMLVideoElement) => { }, []);

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
    toast.info(`Starting ${exercise.name} workout!`);
  }, []);

  // Stop workout (go back without saving)
  const stopWorkout = useCallback(() => {
    setIsWorkoutActive(false);
    setIsResting(false);
    setView('select');
  }, []);

  // Complete set -> trigger rest timer
  const handleCompleteSet = useCallback(() => {
    if (counterState.currentSetReps === 0) return;

    const isLastSet = counterState.sets.length + 1 >= targetSets;

    if (isLastSet) {
      // Last set complete — auto-finish
      finishWorkoutWithSets();
      return;
    }

    const newState = completeSet(counterState);
    setCounterState(newState);
    prevRepsRef.current = 0;

    setIsWorkoutActive(false);
    setIsResting(true);
    setRestTimer(restDuration);
    playSound(660, 0.15);
    toast.success(`Set ${newState.sets.length}/${targetSets} complete! ${newState.sets[newState.sets.length - 1]} reps. Rest ${restDuration}s.`);
  }, [counterState, restDuration, playSound, targetSets]);

  // Finish workout with current sets
  const finishWorkoutWithSets = useCallback(async () => {
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
        const updatedWorkouts = [saved, ...workouts];
        setWorkouts(updatedWorkouts);
        toast.success(`Workout saved! ${totalReps} reps, ${totalSets} sets, ${Math.round(counterState.calories)} cal.`);

        // Prepare summary
        const pb = isPersonalBest(selectedExercise.id, totalReps, updatedWorkouts);
        setSummaryData({
          exerciseName: selectedExercise.name,
          exerciseIcon: selectedExercise.icon,
          totalReps,
          totalSets,
          duration: elapsedTime,
          calories: counterState.calories,
          avgFormScore: counterState.formScore,
          setsData,
          isPersonalBest: pb,
        });
        setView('summary');
      }
    } catch (err) {
      console.error('Failed to save workout:', err);
      toast.error('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
      setIsWorkoutActive(false);
      setIsResting(false);
      setSelectedExercise(null);
      setCounterState(createInitialCounterState());
      prevRepsRef.current = 0;
      setElapsedTime(0);
    }
  }, [selectedExercise, counterState, elapsedTime, workouts]);

  // Finish workout button handler
  const finishWorkout = useCallback(async () => {
    if (counterState.currentSetReps === 0 && counterState.sets.length === 0) {
      toast.error('No reps recorded yet. Complete some reps first!');
      return;
    }
    await finishWorkoutWithSets();
  }, [counterState, finishWorkoutWithSets]);

  // Delete workout
  const handleDeleteWorkout = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workouts?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Delete request failed');
      }
      setWorkouts(prev => prev.filter(w => w.id !== id));
      toast.success('Workout deleted.');
    } catch {
      toast.error('Failed to delete workout.');
    }
  }, []);

  // Export workouts as JSON
  const handleExport = useCallback(() => {
    const data = JSON.stringify(workouts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitrep-workouts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Workout history exported!');
  }, [workouts]);

  const handleReset = useCallback(() => {
    setCounterState(resetCounter());
    prevRepsRef.current = 0;
    toast.info('Counter reset.');
  }, []);

  // Close summary and go home
  const closeSummary = useCallback(() => {
    setSummaryData(null);
    setView('select');
  }, []);

  // New workout from summary
  const newWorkoutFromSummary = useCallback(() => {
    setSummaryData(null);
    setView('select');
  }, []);

  // Max weekly reps for chart normalization
  const maxWeeklyReps = Math.max(...weeklyData.map(d => d.reps), 1);

  // Completed sets progress for workout view
  const completedSets = counterState.sets.length;
  const setsProgress = targetSets > 0 ? (completedSets / targetSets) * 100 : 0;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">FitRep – AI Tracker</h1>
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium hidden sm:inline-flex">
              AI Powered
            </Badge>
            {streak.current > 0 && (
              <Badge className="text-[10px] bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800 font-medium">
                <FlameKindling className="w-2.5 h-2.5 mr-0.5" />
                {streak.current}d streak
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Mute workout sounds' : 'Enable workout sounds'}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Button
              variant={view === 'history' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg ${view === 'history' ? 'bg-emerald-600 text-white shadow-sm' : ''}`}
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
          {/* =================== EXERCISE SELECTION VIEW =================== */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Hero with animated bg */}
              <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 sm:p-8 text-white shadow-xl shadow-emerald-600/20">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-[0.06]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Track Your Reps with AI
                    </h2>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                  </div>
                  <p className="text-emerald-100 text-sm sm:text-base max-w-lg leading-relaxed">
                    Select an exercise, position yourself in the camera, and let AI count your reps in real-time with form feedback.
                  </p>
                  {workouts.length > 0 && (
                    <div className="flex items-center gap-4 mt-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm text-emerald-100">
                        <Trophy className="w-4 h-4" />
                        <span className="font-bold">{workouts.length}</span> workouts
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-emerald-100">
                        <Target className="w-4 h-4" />
                        <span className="font-bold">{workouts.reduce((s, w) => s + w.totalReps, 0).toLocaleString()}</span> total reps
                      </div>
                      {streak.current > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-amber-200">
                          <FlameKindling className="w-4 h-4" />
                          <span className="font-bold">{streak.current}</span> day streak
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Exercise Selector */}
                <div className="lg:col-span-2">
                  <Card className="shadow-sm border-gray-200/80 dark:border-gray-800/80">
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
                  {/* Streak Card */}
                  {streak.current > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="shadow-sm border-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white overflow-hidden relative">
                        <div className="absolute inset-0 opacity-[0.1]" style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                          backgroundSize: '16px 16px',
                        }} />
                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <FlameKindling className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-2xl font-black">{streak.current} Days</p>
                                <p className="text-xs text-orange-100 font-medium">Current Streak</p>
                              </div>
                            </div>
                            {streak.best > 1 && (
                              <div className="text-right">
                                <p className="text-lg font-bold">{streak.best}</p>
                                <p className="text-[10px] text-orange-100 uppercase tracking-wider font-medium">Best</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Weekly Activity Chart */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="flex items-end gap-1.5 h-20">
                        {weeklyData.map((day, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col items-center justify-end h-14 gap-px">
                              {day.reps > 0 && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${Math.max((day.reps / maxWeeklyReps) * 48, 4)}px` }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.05 }}
                                  className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[4px]"
                                />
                              )}
                              {day.reps === 0 && (
                                <div className="w-full h-[2px] rounded bg-gray-200 dark:bg-gray-800" />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">{day.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Records */}
                  {personalRecords && personalRecords.length > 0 && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          Personal Records
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2">
                        {personalRecords.slice(0, 3).map((record, i) => (
                          <div key={record.exerciseId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  i === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                                    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                {i === 0 ? '1' : i === 1 ? '2' : '3'}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">{record.exerciseName}</span>
                            </div>
                            <span className="text-xs font-bold tabular-nums">{record.totalReps} reps</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

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
                        'Personal records tracking',
                        'Calorie estimation',
                        'Workout streak counter',
                        'Session summary & stats',
                        'Dark mode support',
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

          {/* =================== WORKOUT VIEW =================== */}
          {view === 'workout' && selectedExercise && (
            <motion.div
              key="workout"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={stopWorkout} className="text-muted-foreground -ml-2">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {selectedExercise.icon} {selectedExercise.name}
                  </Badge>
                  {!isWorkoutActive && !isResting && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                      onClick={() => setIsWorkoutActive(true)}>
                      <Play className="w-3 h-3 mr-1" /> Start
                    </Button>
                  )}
                  {isWorkoutActive && (
                    <Button size="sm" variant="outline"
                      className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg"
                      onClick={() => setIsWorkoutActive(false)}>
                      <Pause className="w-3 h-3 mr-1" /> Pause
                    </Button>
                  )}
                </div>
              </div>

              {/* Sets progress bar */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
                    <span>Set {completedSets + 1} of {targetSets}</span>
                    <span>{completedSets}/{targetSets} complete</span>
                  </div>
                  <div className="h-1.5 bg-gray-200/80 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${setsProgress}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    />
                  </div>
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
                      <div className="mb-4 relative inline-block">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                          <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor"
                            strokeWidth="4" className="text-gray-200 dark:text-gray-800" />
                          <motion.circle
                            cx="36" cy="36" r="30" fill="none" stroke="#10b981" strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0 188.5' }}
                            animate={{ strokeDasharray: `${(restTimer / restDuration) * 188.5} 188.5` }}
                            transition={{ duration: 0.5 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Timer className="w-7 h-7 text-emerald-500" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Rest Time</p>
                      <p className="text-6xl font-black text-foreground tabular-nums tracking-tight">{restTimer}</p>
                      <p className="text-sm text-muted-foreground mt-2">Next: Set {completedSets + 2} of {targetSets}</p>
                      <div className="flex gap-2 mt-6 justify-center">
                        <Button variant="outline" className="rounded-xl" onClick={() => {
                          setIsResting(false); setIsWorkoutActive(true); setRestTimer(0);
                        }}>
                          <Play className="w-3.5 h-3.5 mr-1" /> Skip Rest
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl"
                          onClick={() => setRestTimer(prev => prev + 15)}>
                          +15s
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
                <div className="lg:col-span-3">
                  <WebcamView exercise={selectedExercise} isActive={isWorkoutActive}
                    onPoseDetected={handlePoseDetected} onFrame={handleFrame} />

                  <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Target reps:</span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                          aria-label="Decrease target reps"
                          onClick={() => setTargetReps(Math.max(1, targetReps - 5))}>
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Input type="number" value={targetReps}
                          onChange={(e) => setTargetReps(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center text-sm rounded-lg" />
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                          aria-label="Increase target reps"
                          onClick={() => setTargetReps(targetReps + 5)}>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Sets:</span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                          aria-label="Decrease target sets"
                          onClick={() => setTargetSets(Math.max(1, targetSets - 1))}>
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Input type="number" value={targetSets}
                          onChange={(e) => setTargetSets(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 h-7 text-center text-sm rounded-lg" />
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                          aria-label="Increase target sets"
                          onClick={() => setTargetSets(targetSets + 1)}>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Rest:</span>
                      <Input type="number" value={restDuration}
                        onChange={(e) => setRestDuration(Math.max(5, parseInt(e.target.value) || 30))}
                        className="w-14 h-7 text-center text-sm rounded-lg" />
                      <span className="text-xs text-muted-foreground">sec</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <RepCounterDisplay counterState={counterState} exerciseName={selectedExercise.name}
                    elapsedTime={elapsedTime} targetReps={targetReps}
                    onCompleteSet={handleCompleteSet} onReset={handleReset} />

                  <Button
                    className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:scale-[1.01]"
                    onClick={finishWorkout} disabled={isSaving}>
                    {isSaving ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                    {isSaving ? 'Saving...' : `Finish & Save Workout`}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =================== HISTORY VIEW =================== */}
          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setView('select')}
                    className="text-muted-foreground -ml-2">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <h2 className="text-2xl font-bold tracking-tight">Workout History</h2>
                </div>
                {workouts.length > 0 && (
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExport}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                  </Button>
                )}
              </div>

              <div className="max-w-2xl mx-auto">
                <Card className="shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <WorkoutHistory workouts={workouts} onDelete={handleDeleteWorkout} streak={streak} />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* =================== SUMMARY VIEW =================== */}
          {view === 'summary' && summaryData && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <WorkoutSummary
                data={summaryData}
                onClose={closeSummary}
                onNewWorkout={newWorkoutFromSummary}
              />
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
              <span className="font-medium">FitRep – AI Tracker</span>
              <span className="hidden sm:inline">— AI-Powered Exercise Rep Counter</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> MediaPipe Pose Detection
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
