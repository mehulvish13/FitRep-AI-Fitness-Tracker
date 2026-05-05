// Exercise definitions with pose detection configurations
// Based on the original angles.py concept - calculating joint angles for rep counting

export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'arms' | 'legs' | 'chest' | 'back' | 'core' | 'shoulders';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  primaryJoints: string[];
  landmarks: {
    first: number;
    mid: number;
    end: number;
  };
  downAngle: number;
  upAngle: number;
  bilateral: boolean;
  secondaryLandmarks?: {
    first: number;
    mid: number;
    end: number;
  };
  tips: string[];
  caloriesPerRep: number;
  estimatedDuration: string; // estimated time per set
  targetMuscles: string[];
}

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    description: 'Keep elbows close to your torso, curl the weight up to shoulder level.',
    icon: '💪',
    category: 'arms',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 12, mid: 14, end: 16 },
    secondaryLandmarks: { first: 11, mid: 13, end: 15 },
    downAngle: 160,
    upAngle: 40,
    bilateral: true,
    tips: ['Keep elbows close to torso', "Don't swing your body", 'Control the movement', 'Squeeze at the top'],
    caloriesPerRep: 0.5,
    estimatedDuration: '30s',
    targetMuscles: ['Biceps', 'Forearms'],
  },
  {
    id: 'squat',
    name: 'Squat',
    description: 'Stand with feet shoulder-width apart, lower your hips until thighs are parallel.',
    icon: '🦵',
    category: 'legs',
    difficulty: 'beginner',
    primaryJoints: ['Right Knee', 'Left Knee'],
    landmarks: { first: 24, mid: 26, end: 28 },
    secondaryLandmarks: { first: 23, mid: 25, end: 27 },
    downAngle: 90,
    upAngle: 170,
    bilateral: true,
    tips: ['Keep chest up', 'Knees behind toes', 'Weight in heels', 'Drive through midfoot'],
    caloriesPerRep: 0.8,
    estimatedDuration: '45s',
    targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    description: 'Press weights overhead from shoulder height, fully extend arms.',
    icon: '🏋️',
    category: 'shoulders',
    difficulty: 'intermediate',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 12, mid: 14, end: 16 },
    secondaryLandmarks: { first: 11, mid: 13, end: 15 },
    downAngle: 90,
    upAngle: 160,
    bilateral: true,
    tips: ['Keep core engaged', "Don't lock elbows", 'Press directly overhead', 'Breathe out on press'],
    caloriesPerRep: 0.7,
    estimatedDuration: '40s',
    targetMuscles: ['Deltoids', 'Triceps', 'Upper Chest'],
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    description: 'Raise arms to the sides until parallel with the ground.',
    icon: '🤸',
    category: 'shoulders',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 12, mid: 14, end: 16 },
    secondaryLandmarks: { first: 11, mid: 13, end: 15 },
    downAngle: 10,
    upAngle: 90,
    bilateral: true,
    tips: ['Slight bend in elbows', 'Lead with pinkies', 'Control the descent', 'Raise to shoulder height'],
    caloriesPerRep: 0.4,
    estimatedDuration: '35s',
    targetMuscles: ['Lateral Deltoids', 'Traps'],
  },
  {
    id: 'tricep-extension',
    name: 'Tricep Extension',
    description: 'Extend arms overhead, keeping elbows stationary.',
    icon: '🦾',
    category: 'arms',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 12, mid: 14, end: 16 },
    secondaryLandmarks: { first: 11, mid: 13, end: 15 },
    downAngle: 40,
    upAngle: 160,
    bilateral: true,
    tips: ['Keep elbows pointing forward', 'Squeeze at the top', "Don't flare elbows", 'Full extension'],
    caloriesPerRep: 0.5,
    estimatedDuration: '30s',
    targetMuscles: ['Triceps', 'Shoulders'],
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    description: 'Raise arms straight in front to shoulder height.',
    icon: '🙌',
    category: 'shoulders',
    difficulty: 'intermediate',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 24, mid: 14, end: 12 },
    secondaryLandmarks: { first: 23, mid: 13, end: 11 },
    downAngle: 10,
    upAngle: 170,
    bilateral: true,
    tips: ['Keep arms straight', "Don't swing", 'Slow controlled movement', 'Palms facing down'],
    caloriesPerRep: 0.4,
    estimatedDuration: '35s',
    targetMuscles: ['Front Deltoids', 'Upper Chest'],
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Step forward and lower your back knee towards the ground.',
    icon: '🚶',
    category: 'legs',
    difficulty: 'intermediate',
    primaryJoints: ['Right Knee', 'Left Knee'],
    landmarks: { first: 24, mid: 26, end: 28 },
    secondaryLandmarks: { first: 23, mid: 25, end: 27 },
    downAngle: 100,
    upAngle: 170,
    bilateral: true,
    tips: ['Keep torso upright', 'Front knee at 90 degrees', 'Step far enough', 'Push back to start'],
    caloriesPerRep: 0.7,
    estimatedDuration: '50s',
    targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    description: 'Lower your body by bending arms, then push back up.',
    icon: '🫸',
    category: 'chest',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 12, mid: 14, end: 16 },
    secondaryLandmarks: { first: 11, mid: 13, end: 15 },
    downAngle: 90,
    upAngle: 160,
    bilateral: true,
    tips: ['Keep body straight', 'Core engaged', 'Full range of motion', 'Elbows at 45 degrees'],
    caloriesPerRep: 1.0,
    estimatedDuration: '40s',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
  },
  {
    id: 'wall-sit',
    name: 'Wall Sit',
    description: 'Lean against a wall with knees at 90 degrees and hold the position.',
    icon: '🧱',
    category: 'legs',
    difficulty: 'beginner',
    primaryJoints: ['Right Knee', 'Left Knee'],
    landmarks: { first: 24, mid: 26, end: 28 },
    secondaryLandmarks: { first: 23, mid: 25, end: 27 },
    downAngle: 85,
    upAngle: 100,
    bilateral: true,
    tips: ['Back flat against wall', 'Thighs parallel to floor', 'Keep core tight', 'Breathe steadily'],
    caloriesPerRep: 1.2,
    estimatedDuration: '60s',
    targetMuscles: ['Quads', 'Glutes', 'Calves'],
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'Jump while spreading legs and raising arms overhead simultaneously.',
    icon: '⭐',
    category: 'core',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: { first: 12, mid: 14, end: 16 },
    secondaryLandmarks: { first: 11, mid: 13, end: 15 },
    downAngle: 10,
    upAngle: 160,
    bilateral: true,
    tips: ['Land softly on toes', 'Full arm extension', 'Keep rhythm', 'Engage core'],
    caloriesPerRep: 0.6,
    estimatedDuration: '30s',
    targetMuscles: ['Full Body', 'Cardio', 'Shoulders'],
  },
];

export const EXERCISE_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎯' },
  { id: 'arms', name: 'Arms', icon: '💪' },
  { id: 'legs', name: 'Legs', icon: '🦵' },
  { id: 'chest', name: 'Chest', icon: '🏋️' },
  { id: 'shoulders', name: 'Shoulders', icon: '🤸' },
  { id: 'core', name: 'Core', icon: '🧘' },
] as const;

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find(e => e.id === id);
}

export function getExercisesByCategory(category: string): ExerciseConfig[] {
  if (category === 'all') return EXERCISES;
  return EXERCISES.filter(e => e.category === category);
}
