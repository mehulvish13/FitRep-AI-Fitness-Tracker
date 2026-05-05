'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Flame, Clock, Trophy, RotateCcw } from 'lucide-react';
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

  const feedbackColors: Record<string, string> = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    info: 'text-sky-500',
    error: 'text-red-500',
    none: 'text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Main Rep Counter */}
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="text-emerald-100 text-sm font-medium">{exerciseName}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-100">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={counterState.currentSetReps}
                  initial={{ scale: 1.5, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-7xl font-black leading-none tabular-nums">
                    {counterState.currentSetReps}
                  </span>
                  <span className="text-emerald-200 text-xl font-medium">
                    / {targetReps}
                  </span>
                </motion.div>
              </AnimatePresence>
              <p className="text-emerald-200 text-sm mt-1">reps this set</p>
            </div>

            <div className="text-right space-y-1">
              <div className="flex items-center gap-1 text-emerald-100">
                <Trophy className="w-4 h-4" />
                <span className="text-2xl font-bold">{counterState.sets.length + 1}</span>
                <span className="text-sm">set</span>
              </div>
              {counterState.sets.length > 0 && (
                <div className="flex gap-1">
                  {counterState.sets.map((reps, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold"
                    >
                      {reps}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress
              value={progress}
              className="h-2 bg-white/20 [&>div]:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalReps}</p>
            <p className="text-xs text-muted-foreground">Total Reps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{counterState.calories.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="w-5 h-5 text-sky-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{counterState.currentAngle ? `${Math.round(counterState.currentAngle)}°` : '--'}</p>
            <p className="text-xs text-muted-foreground">Joint Angle</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              counterState.feedbackType === 'success' ? 'bg-emerald-500' :
              counterState.feedbackType === 'warning' ? 'bg-amber-500' :
              counterState.feedbackType === 'error' ? 'bg-red-500' :
              'bg-sky-500'
            }`} />
            <p className={`text-sm font-medium ${feedbackColors[counterState.feedbackType] || 'text-muted-foreground'}`}>
              {counterState.feedback}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
          onClick={onCompleteSet}
        >
          <Trophy className="w-4 h-4 mr-1" />
          Complete Set
        </Button>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
