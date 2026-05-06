'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar, Dumbbell, Flame, TrendingUp, Trophy, Clock,
  BarChart3, Target, Sparkles, Trash2, Shield, Zap, FlameKindling,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WorkoutRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  totalReps: number;
  totalSets: number;
  duration: number;
  calories: number;
  setsData: string;
  avgFormScore: number;
  createdAt: string;
}

interface WorkoutHistoryProps {
  workouts: WorkoutRecord[];
  onDelete?: (id: string) => void;
  streak?: { current: number; best: number };
}

function parseSetsData(setsData: string): number[] {
  try {
    const parsed = JSON.parse(setsData || '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0 && s === 0) return '0s';
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const exerciseConfig: Record<string, { icon: string; color: string }> = {
  'bicep-curl': { icon: '💪', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
  'squat': { icon: '🦵', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  'shoulder-press': { icon: '🏋️', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
  'lateral-raise': { icon: '🤸', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
  'tricep-extension': { icon: '🦾', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  'front-raise': { icon: '🙌', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  'lunges': { icon: '🚶', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
  'push-ups': { icon: '🫸', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
  'wall-sit': { icon: '🧱', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  'jumping-jacks': { icon: '⭐', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
};

function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
  delay,
}: {
  icon: any;
  iconColor: string;
  value: string | number;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
              <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function WorkoutHistory({ workouts, onDelete, streak }: WorkoutHistoryProps) {
  const totalWorkouts = workouts.length;
  const totalReps = workouts.reduce((sum, w) => sum + w.totalReps, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
  const avgFormScore = totalWorkouts > 0
    ? Math.round(workouts.reduce((sum, w) => sum + (w.avgFormScore || 0), 0) / totalWorkouts)
    : 0;

  return (
    <div className="space-y-5">
      {/* Streak banner */}
      {streak && streak.current > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }} />
            <CardContent className="p-4 relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FlameKindling className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{streak.current} Day Streak!</p>
                <p className="text-orange-100 text-xs">Keep going! Best: {streak.best} days</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard icon={Trophy} iconColor="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" value={totalReps.toLocaleString()} label="Total Reps" delay={0} />
        <StatCard icon={Flame} iconColor="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" value={Math.round(totalCalories).toLocaleString()} label="Calories Burned" delay={0.05} />
        <StatCard icon={Clock} iconColor="bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400" value={formatDuration(totalDuration)} label="Total Time" delay={0.1} />
        <StatCard icon={BarChart3} iconColor="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" value={totalWorkouts} label="Sessions" delay={0.15} />
      </div>

      {avgFormScore > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Average Form Score</p>
                <p className="text-lg font-bold">{avgFormScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
              </div>
              <div className="w-16 h-16 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={avgFormScore >= 80 ? '#10b981' : avgFormScore >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${avgFormScore * 0.88} 88`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Separator />

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Recent Activity
        </h3>
        <ScrollArea className="h-[400px]">
          {workouts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Dumbbell className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No workouts yet</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Start your first workout session and your history will appear here!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2 pr-2">
              <AnimatePresence mode="popLayout">
                {workouts.map((workout, index) => {
                  const config = exerciseConfig[workout.exerciseId] || { icon: '🎯', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600' };
                  const sets = parseSetsData(workout.setsData);
                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                      transition={{ delay: index * 0.03 }}
                      layout
                    >
                      <Card className="hover:shadow-md transition-all duration-200 border-0 shadow-sm group">
                        <CardContent className="p-3.5">
                          <div className="flex items-center gap-3">
                            {/* Exercise icon */}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${config.color}`}>
                              {config.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-sm truncate">{workout.exerciseName}</h4>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-[11px] text-muted-foreground">{formatDate(workout.createdAt)}</span>
                                  <span className="text-[11px] text-muted-foreground">{formatTime(workout.createdAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Target className="w-3 h-3 text-emerald-500" />
                                  {workout.totalReps} reps
                                </span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" />
                                  {Math.round(workout.calories)} cal
                                </span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-500" />
                                  {formatDuration(workout.duration)}
                                </span>
                                {workout.totalSets > 0 && (
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-violet-500" />
                                    {workout.totalSets} sets
                                  </span>
                                )}
                              </div>
                              {/* Sets breakdown */}
                              {sets.length > 0 && (
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {sets.map((reps, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-[10px] h-5 px-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium"
                                    >
                                      S{i + 1}:{reps}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Delete button */}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                                aria-label={`Delete ${workout.exerciseName} workout`}
                                onClick={() => onDelete(workout.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
