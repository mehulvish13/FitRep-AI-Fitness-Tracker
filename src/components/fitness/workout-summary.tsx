'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Trophy, Flame, Clock, Target, Shield, TrendingUp,
  Medal, Award, ChevronRight, RotateCcw, Home, Star,
  Zap, Dumbbell, Calendar,
} from 'lucide-react';

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

interface WorkoutSummaryProps {
  data: WorkoutSummaryData;
  onClose: () => void;
  onNewWorkout: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutSummary({ data, onClose, onNewWorkout }: WorkoutSummaryProps) {
  const [showConfetti, setShowConfetti] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const scoreColor = data.avgFormScore >= 80
    ? 'text-emerald-400'
    : data.avgFormScore >= 60
    ? 'text-amber-400'
    : 'text-orange-400';

  const scoreLabel = data.avgFormScore >= 80
    ? 'Excellent'
    : data.avgFormScore >= 60
    ? 'Good'
    : 'Needs Work';

  const scoreRingColor = data.avgFormScore >= 80 ? '#10b981' : data.avgFormScore >= 60 ? '#f59e0b' : '#f97316';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Confetti particles */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                  backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'][i % 6],
                }}
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{
                  y: [0, window.innerHeight * 0.8],
                  opacity: [1, 1, 0],
                  rotate: [0, Math.random() * 720 - 360],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  delay: Math.random() * 0.5,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>
        )}

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-6 text-white text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }} />
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg"
              >
                <span className="text-4xl">{data.exerciseIcon}</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold"
              >
                Workout Complete!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-emerald-100 text-sm mt-1"
              >
                {data.exerciseName}
              </motion.p>

              {data.isPersonalBest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="mt-3 inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-amber-400/30"
                >
                  <Award className="w-3.5 h-3.5" />
                  Personal Best!
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Target className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">{data.totalReps}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Reps</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Card className="border-0 bg-gradient-to-br from-orange-50 to-amber-100/50 dark:from-orange-950/30 dark:to-amber-900/20 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-2xl font-black tabular-nums text-orange-700 dark:text-orange-400">{Math.round(data.calories)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Calories</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-0 bg-gradient-to-br from-sky-50 to-blue-100/50 dark:from-sky-950/30 dark:to-blue-900/20 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Clock className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                    <p className="text-2xl font-black tabular-nums text-sky-700 dark:text-sky-400">{formatTime(data.duration)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Duration</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-100/50 dark:from-violet-950/30 dark:to-purple-900/20 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Medal className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                    <p className="text-2xl font-black tabular-nums text-violet-700 dark:text-violet-400">{data.totalSets}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sets</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Form Score Ring */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 mb-4"
            >
              <div className="w-16 h-16 relative flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-800" />
                  <motion.circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={scoreRingColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 88' }}
                    animate={{ strokeDasharray: `${(data.avgFormScore / 100) * 88} 88` }}
                    transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-black ${scoreColor}`}>{data.avgFormScore}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4" style={{ color: scoreRingColor }} />
                  <span className="text-sm font-semibold">Form Score</span>
                  <Badge variant="secondary" className={`text-[10px] ${
                    data.avgFormScore >= 80
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : data.avgFormScore >= 60
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  } border-0`}>
                    {scoreLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.avgFormScore >= 80
                    ? 'Outstanding form throughout the workout!'
                    : data.avgFormScore >= 60
                    ? 'Good form with room for improvement.'
                    : 'Focus on maintaining proper form next time.'}
                </p>
              </div>
            </motion.div>

            {/* Sets Breakdown */}
            {data.setsData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-4"
              >
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Sets Breakdown</p>
                <div className="flex gap-1.5">
                  {data.setsData.map((reps, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.9 + i * 0.1, type: 'spring', stiffness: 300 }}
                      className="flex-1"
                    >
                      <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl p-2 text-center shadow-sm">
                        <p className="text-xs text-emerald-200 font-medium">S{i + 1}</p>
                        <p className="text-lg font-black">{reps}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex gap-2"
            >
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl font-medium"
                onClick={onClose}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25"
                onClick={onNewWorkout}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Workout
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
