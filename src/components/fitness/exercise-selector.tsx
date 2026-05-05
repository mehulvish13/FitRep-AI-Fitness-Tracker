'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Flame, Zap, Timer, Target, Users } from 'lucide-react';
import type { ExerciseConfig } from '@/lib/exercises';
import { EXERCISES, EXERCISE_CATEGORIES, getExercisesByCategory } from '@/lib/exercises';

interface ExerciseSelectorProps {
  selectedExercise: ExerciseConfig | null;
  onSelect: (exercise: ExerciseConfig) => void;
}

const difficultyConfig = {
  beginner: { label: 'Beginner', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  advanced: { label: 'Advanced', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function ExerciseCard({
  exercise,
  isSelected,
  onSelect,
}: {
  exercise: ExerciseConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 overflow-hidden ${
          isSelected
            ? 'border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
            : 'border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 ${
              isSelected
                ? 'bg-emerald-100 dark:bg-emerald-900/50 scale-110'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              {exercise.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{exercise.name}</h3>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </motion.div>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={`${difficultyConfig[exercise.difficulty].color} text-[10px] px-2 border-0 flex-shrink-0`}
                >
                  {difficultyConfig[exercise.difficulty].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{exercise.description}</p>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Flame className="w-3 h-3 text-orange-400" />
                  {exercise.caloriesPerRep} cal/rep
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Timer className="w-3 h-3 text-sky-400" />
                  ~{exercise.estimatedDuration}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Target className="w-3 h-3 text-emerald-400" />
                  {exercise.targetMuscles[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded details when selected */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  {/* Tips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {exercise.tips.map((tip, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[11px] border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-0.5"
                      >
                        <Zap className="w-2.5 h-2.5 mr-1" />
                        {tip}
                      </Badge>
                    ))}
                  </div>
                  {/* Target muscles */}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Target: </span>
                    {exercise.targetMuscles.map((m, i) => (
                      <span key={i} className="text-[11px] font-medium text-foreground">
                        {m}{i < exercise.targetMuscles.length - 1 && <span className="text-muted-foreground mx-0.5">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ExerciseSelector({
  selectedExercise,
  onSelect,
}: ExerciseSelectorProps) {
  const [category, setCategory] = React.useState('all');

  const filteredExercises = getExercisesByCategory(category);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Choose Exercise</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filteredExercises.length} exercises available</p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {EXERCISE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              category === cat.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <ScrollArea className="h-[420px] pr-2">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExercise?.id === exercise.id}
                onSelect={() => onSelect(exercise)}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Start button */}
      <AnimatePresence>
        {selectedExercise && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:shadow-emerald-500/40"
              onClick={() => onSelect(selectedExercise)}
            >
              Start {selectedExercise.name} Workout
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
