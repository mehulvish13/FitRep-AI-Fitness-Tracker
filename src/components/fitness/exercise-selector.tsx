'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Timer, Flame, Zap } from 'lucide-react';
import type { ExerciseConfig } from '@/lib/exercises';
import { EXERCISES, EXERCISE_CATEGORIES, getExercisesByCategory } from '@/lib/exercises';

interface ExerciseSelectorProps {
  selectedExercise: ExerciseConfig | null;
  onSelect: (exercise: ExerciseConfig) => void;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <Badge variant="secondary" className={`${colors[difficulty as keyof typeof colors]} text-xs border-0`}>
      {difficulty}
    </Badge>
  );
}

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
            : 'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isSelected
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {exercise.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{exercise.name}</h3>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {exercise.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <DifficultyBadge difficulty={exercise.difficulty} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="w-3 h-3" />
                {exercise.caloriesPerRep} cal/rep
              </div>
            </div>
          </div>

          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800"
            >
              <div className="flex flex-wrap gap-1.5">
                {exercise.tips.map((tip, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
                    <Zap className="w-2.5 h-2.5 mr-1" />
                    {tip}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Down: {exercise.downAngle}°
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Up: {exercise.upAngle}°
                </span>
              </div>
            </motion.div>
          )}
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Choose Exercise</h2>
        <Badge variant="secondary" className="text-xs">
          {filteredExercises.length} exercises
        </Badge>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-0">
          {EXERCISE_CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                category === cat.id
                  ? 'bg-emerald-600 text-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-700'
              }`}
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ScrollArea className="h-[400px] pr-2">
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

      {selectedExercise && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={() => onSelect(selectedExercise)}
          >
            Start {selectedExercise.name} Workout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
