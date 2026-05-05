'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Dumbbell, Flame, TrendingUp, Trophy, Clock, BarChart3, Target } from 'lucide-react';

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

export default function WorkoutHistory({ workouts }: WorkoutHistoryProps) {
  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalReps = workouts.reduce((sum, w) => sum + w.totalReps, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          Workout History
        </h2>
        <Badge variant="secondary" className="text-xs">
          {totalWorkouts} workouts
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalReps}</p>
              <p className="text-xs text-muted-foreground">Total Reps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{Math.round(totalCalories)}</p>
              <p className="text-xs text-muted-foreground">Calories Burned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatDuration(totalDuration)}</p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalWorkouts}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workout List */}
      <ScrollArea className="h-[300px]">
        {workouts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No workouts yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Complete your first workout to see it here!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {workouts.map((workout) => {
              const sets: number[] = JSON.parse(workout.setsData || '[]');
              return (
                <Card key={workout.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
                          {getExerciseIcon(workout.exerciseId)}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{workout.exerciseName}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(workout.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Target className="w-3 h-3" />
                            {workout.totalReps} reps
                          </span>
                          <span className="flex items-center gap-1 text-orange-600">
                            <Flame className="w-3 h-3" />
                            {Math.round(workout.calories)} cal
                          </span>
                        </div>
                        {sets.length > 0 && (
                          <div className="flex gap-1 mt-1 justify-end">
                            {sets.map((reps, i) => (
                              <Badge key={i} variant="secondary" className="text-xs h-5 px-1.5">
                                S{i + 1}: {reps}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
