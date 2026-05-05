'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Flame, Clock, Trophy, RotateCcw, Medal, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { RepCounterState } from '@/lib/rep-counter';

interface RepCounterDisplayProps {
  counterState: RepCounterState;
  exerciseName: string;
  elapsedTime: number;
  targetReps: number;
  onCompleteSet: () => void;
  onReset: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getFormColor(score: number): { text: string; bg: string; label: string } {
  if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Excellent' };
  if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500', label: 'Good' };
  if (score >= 40) return { text: 'text-orange-400', bg: 'bg-orange-500', label: 'Fair' };
  return { text: 'text-gray-400', bg: 'bg-gray-500', label: '--' };
}

export default function RepCounterDisplay({
  counterState,
  exerciseName,
  elapsedTime,
  targetReps,
  onCompleteSet,
  onReset,
}: RepCounterDisplayProps) {
  const progress = targetReps > 0 ? Math.min((counterState.currentSetReps / targetReps) * 100, 100) : 0;
  const totalReps = counterState.sets.reduce((sum, s) => sum + s, 0) + counterState.currentSetReps;
  const formInfo = getFormColor(counterState.formScore);
  const isRepMilestone = counterState.currentSetReps > 0 && counterState.currentSetReps % 5 === 0;

  const feedbackColors: Record<string, string> = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    info: 'text-sky-400',
    error: 'text-red-400',
    none: 'text-muted-foreground',
  };

  return (
    <div className="space-y-3">
      {/* Main Rep Counter Card */}
      <Card className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white border-0 overflow-hidden relative shadow-xl shadow-emerald-600/20">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <CardContent className="p-5 relative z-10">
          {/* Top row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-200" />
              <span className="text-emerald-100 text-sm font-medium">{exerciseName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-100 bg-black/20 rounded-lg px-2 py-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-sm tabular-nums">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Main rep count */}
          <div className="flex items-end justify-between mt-2">
            <div>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={counterState.currentSetReps}
                  initial={{ scale: 1.4, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-7xl font-black leading-none tabular-nums tracking-tight">
                    {counterState.currentSetReps}
                  </span>
                  <span className="text-emerald-300 text-2xl font-medium">
                    / {targetReps}
                  </span>
                </motion.div>
              </AnimatePresence>
              <p className="text-emerald-200/80 text-xs font-medium mt-1 uppercase tracking-wider">
                reps this set
              </p>
            </div>

            {/* Set indicator */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-emerald-100">
                <Medal className="w-4 h-4" />
                <span className="text-2xl font-bold">{counterState.sets.length + 1}</span>
              </div>
              <p className="text-emerald-200/80 text-[10px] font-medium uppercase tracking-wider">
                current set
              </p>
              {counterState.sets.length > 0 && (
                <div className="flex gap-1 mt-2 justify-end">
                  {counterState.sets.map((reps, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm text-xs font-bold border border-white/10"
                    >
                      {reps}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-emerald-200/60 uppercase tracking-wider font-medium">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-white/90 to-emerald-200 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone celebration */}
      <AnimatePresence>
        {isRepMilestone && counterState.lastRepTime > Date.now() - 1500 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/50 border">
              <CardContent className="p-3 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Trophy className="w-5 h-5 text-amber-500" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {counterState.currentSetReps} Reps!
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500">
                    {counterState.currentSetReps >= targetReps ? 'Target reached!' : 'Keep it up!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="shadow-sm border-0 bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold tabular-nums">{totalReps}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-3 text-center">
            <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold tabular-nums">{counterState.calories.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Calories</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-3 text-center">
            <Shield className="w-4 h-4 mx-auto mb-1" style={{ color: counterState.formScore >= 60 ? '#10b981' : '#f59e0b' }} />
            <p className="text-xl font-bold tabular-nums">{counterState.formScore || '--'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Form</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback */}
      <Card className="shadow-sm border-0 bg-gray-50 dark:bg-gray-900/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              counterState.feedbackType === 'success' ? 'bg-emerald-500' :
              counterState.feedbackType === 'warning' ? 'bg-amber-500' :
              counterState.feedbackType === 'error' ? 'bg-red-500' :
              'bg-sky-500'
            } ${counterState.feedbackType === 'success' ? 'animate-pulse' : ''}`} />
            <div className="min-w-0">
              <p className={`text-sm font-medium leading-snug ${
                feedbackColors[counterState.feedbackType] || 'text-muted-foreground'
              }`}>
                {counterState.feedback}
              </p>
              {counterState.postureWarning && (
                <p className="text-[11px] text-amber-500 mt-0.5">
                  <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                  {counterState.postureWarning}
                </p>
              )}
              {counterState.currentAngle !== null && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Current angle: {Math.round(counterState.currentAngle)}°
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-10 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl font-medium text-sm"
          onClick={onCompleteSet}
          disabled={counterState.currentSetReps === 0}
        >
          <Trophy className="w-4 h-4 mr-1.5" />
          Complete Set
        </Button>
        <Button
          variant="outline"
          className="h-10 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium text-sm"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
