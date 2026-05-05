'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Dumbbell, Flame, TrendingUp, Trophy, Clock, BarChart3, Target, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export interface WorkoutRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  totalReps: number;
  totalSets: number;
  duration: number;
  calories: number;
  setsData: string;
  createdAt: string;
}

interface WorkoutHistoryProps {
  workouts: WorkoutRecord[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0 && s === 0) return '0 min';
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

function getExerciseIcon(exerciseId: string): string {
  const icons: Record<string, string> = {
    'bicep-curl': '💪',
    'squat': '🦵',
    'shoulder-press': '🏋️',
    'lateral-raise': '🤸',
    'tricep-extension': '🦾',
    'front-raise': '🙌',
    'lunges': '🚶',
    'push-ups': '🫸',
  };
  return icons[exerciseId] || '🎯';
}

function getExerciseColor(exerciseId: string): string {
  const colors: Record<string, string> = {
    'bicep-curl': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
    'squat': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    'shoulder-press': 'bg-sky-100 dark:bg-sky-900/30 text-sky-600',
    'lateral-raise': 'bg-violet-100 dark:bg-violet-900/30 text-violet-600',
    'tricep-extension': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    'front-raise': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    'lunges': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
    'push-ups': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
  };
  return colors[exerciseId] || 'bg-gray-100 dark:bg-gray-800 text-gray-600';
}

export default function WorkoutHistory({ workouts }: WorkoutHistoryProps) {
  const totalWorkouts = workouts.length;
  const totalReps = workouts.reduce((sum, w) => sum + w.totalReps, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums">{totalReps.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground truncate">Total Reps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums">{Math.round(totalCalories).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground truncate">Calories Burned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold">{formatDuration(totalDuration)}</p>
                  <p className="text-xs text-muted-foreground truncate">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums">{totalWorkouts}</p>
                  <p className="text-xs text-muted-foreground truncate">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Separator />

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Recent Activity
        </h3>
        <ScrollArea className="h-[350px]">
          {workouts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No workouts yet</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Start your first workout session and your history will appear here!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2 pr-2">
              {workouts.map((workout, index) => {
                const sets: number[] = JSON.parse(workout.setsData || '[]');
                return (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${getExerciseColor(workout.exerciseId)}`}>
                            {getExerciseIcon(workout.exerciseId)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm truncate">{workout.exerciseName}</h4>
                              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatDate(workout.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-500" />
                                {workout.totalReps} reps
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {Math.round(workout.calories)} cal
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-500" />
                                {formatDuration(workout.duration)}
                              </span>
                            </div>
                            {sets.length > 0 && (
                              <div className="flex gap-1.5 mt-2">
                                {sets.map((reps, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs h-5 px-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium"
                                  >
                                    S{i + 1}: {reps}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
