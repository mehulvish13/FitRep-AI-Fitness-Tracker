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
  // Landmark indices from MediaPipe Pose (33 landmarks)
  landmarks: {
    first: number;   // First joint landmark
    mid: number;     // Middle joint landmark (the joint being measured)
    end: number;     // End joint landmark
  };
  // Angle thresholds for rep counting
  downAngle: number;  // Angle when exercise is in "down" position
  upAngle: number;    // Angle when exercise is in "up" position
  // Whether to check both sides (left and right)
  bilateral: boolean;
  // Secondary landmarks for the other side (if bilateral)
  secondaryLandmarks?: {
    first: number;
    mid: number;
    end: number;
  };
  tips: string[];
  caloriesPerRep: number;
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
    landmarks: {
      first: 12, // right shoulder
      mid: 14,   // right elbow
      end: 16,   // right wrist
    },
    secondaryLandmarks: {
      first: 11, // left shoulder
      mid: 13,   // left elbow
      end: 15,   // left wrist
    },
    downAngle: 160, // arm straight
    upAngle: 40,    // arm fully curled
    bilateral: true,
    tips: ['Keep elbows close to your torso', 'Don\'t swing your body', 'Control the movement'],
    caloriesPerRep: 0.5,
  },
  {
    id: 'squat',
    name: 'Squat',
    description: 'Stand with feet shoulder-width apart, lower your hips until thighs are parallel.',
    icon: '🦵',
    category: 'legs',
    difficulty: 'beginner',
    primaryJoints: ['Right Knee', 'Left Knee'],
    landmarks: {
      first: 24, // right hip
      mid: 26,   // right knee
      end: 28,   // right ankle
    },
    secondaryLandmarks: {
      first: 23, // left hip
      mid: 25,   // left knee
      end: 27,   // left ankle
    },
    downAngle: 90,  // knees bent
    upAngle: 170,   // legs straight
    bilateral: true,
    tips: ['Keep chest up', 'Knees behind toes', 'Weight in heels'],
    caloriesPerRep: 0.8,
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    description: 'Press weights overhead from shoulder height, fully extend arms.',
    icon: '🏋️',
    category: 'shoulders',
    difficulty: 'intermediate',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: {
      first: 12, // right shoulder
      mid: 14,   // right elbow
      end: 16,   // right wrist
    },
    secondaryLandmarks: {
      first: 11, // left shoulder
      mid: 13,   // left elbow
      end: 15,   // left wrist
    },
    downAngle: 90,   // arms at 90 degrees
    upAngle: 160,    // arms extended overhead
    bilateral: true,
    tips: ['Keep core engaged', 'Don\'t lock elbows', 'Press directly overhead'],
    caloriesPerRep: 0.7,
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    description: 'Raise arms to the sides until parallel with the ground.',
    icon: '🤸',
    category: 'shoulders',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: {
      first: 12, // right shoulder
      mid: 14,   // right elbow
      end: 16,   // right wrist
    },
    secondaryLandmarks: {
      first: 11, // left shoulder
      mid: 13,   // left elbow
      end: 15,   // left wrist
    },
    downAngle: 10,   // arms at sides
    upAngle: 90,     // arms parallel to ground
    bilateral: true,
    tips: ['Slight bend in elbows', 'Lead with pinkies', 'Control the descent'],
    caloriesPerRep: 0.4,
  },
  {
    id: 'tricep-extension',
    name: 'Tricep Extension',
    description: 'Extend arms overhead, keeping elbows stationary.',
    icon: '🦾',
    category: 'arms',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: {
      first: 12, // right shoulder
      mid: 14,   // right elbow
      end: 16,   // right wrist
    },
    secondaryLandmarks: {
      first: 11, // left shoulder
      mid: 13,   // left elbow
      end: 15,   // left wrist
    },
    downAngle: 40,   // arms curled
    upAngle: 160,    // arms extended
    bilateral: true,
    tips: ['Keep elbows pointing forward', 'Squeeze at the top', 'Don\'t flare elbows'],
    caloriesPerRep: 0.5,
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    description: 'Raise arms straight in front to shoulder height.',
    icon: '🙌',
    category: 'shoulders',
    difficulty: 'intermediate',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: {
      first: 24, // right hip
      mid: 14,   // right elbow
      end: 12,   // right shoulder
    },
    secondaryLandmarks: {
      first: 23, // left hip
      mid: 13,   // left elbow
      end: 11,   // left shoulder
    },
    downAngle: 10,   // arms at sides
    upAngle: 170,    // arms raised to front
    bilateral: true,
    tips: ['Keep arms straight', 'Don\'t swing', 'Slow controlled movement'],
    caloriesPerRep: 0.4,
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Step forward and lower your back knee towards the ground.',
    icon: '🚶',
    category: 'legs',
    difficulty: 'intermediate',
    primaryJoints: ['Right Knee', 'Left Knee'],
    landmarks: {
      first: 24, // right hip
      mid: 26,   // right knee
      end: 28,   // right ankle
    },
    secondaryLandmarks: {
      first: 23, // left hip
      mid: 25,   // left knee
      end: 27,   // left ankle
    },
    downAngle: 100, // knee bent in lunge
    upAngle: 170,   // leg straight
    bilateral: true,
    tips: ['Keep torso upright', 'Front knee at 90 degrees', 'Step far enough'],
    caloriesPerRep: 0.7,
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    description: 'Lower your body by bending arms, then push back up.',
    icon: '🫸',
    category: 'chest',
    difficulty: 'beginner',
    primaryJoints: ['Right Elbow', 'Left Elbow'],
    landmarks: {
      first: 12, // right shoulder
      mid: 14,   // right elbow
      end: 16,   // right wrist
    },
    secondaryLandmarks: {
      first: 11, // left shoulder
      mid: 13,   // left elbow
      end: 15,   // left wrist
    },
    downAngle: 90,   // arms bent
    upAngle: 160,    // arms straight
    bilateral: true,
    tips: ['Keep body straight', 'Core engaged', 'Full range of motion'],
    caloriesPerRep: 1.0,
  },
];

export const EXERCISE_CATEGORIES = [
  { id: 'all', name: 'All Exercises', icon: '🎯' },
  { id: 'arms', name: 'Arms', icon: '💪' },
  { id: 'legs', name: 'Legs', icon: '🦵' },
  { id: 'chest', name: 'Chest', icon: '🏋️' },
  { id: 'shoulders', name: 'Shoulders', icon: '🤸' },
  { id: 'back', name: 'Back', icon: '🔙' },
  { id: 'core', name: 'Core', icon: '🧘' },
] as const;

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find(e => e.id === id);
}

export function getExercisesByCategory(category: string): ExerciseConfig[] {
  if (category === 'all') return EXERCISES;
  return EXERCISES.filter(e => e.category === category);
}
