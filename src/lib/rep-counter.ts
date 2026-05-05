// Rep counter logic - state machine based exercise rep counting
import type { Landmark } from './pose-detection';
import { getAverageAngle, analyzePosture } from './pose-detection';
import type { ExerciseConfig } from './exercises';

export type RepState = 'idle' | 'down' | 'up' | 'counting';

export interface RepCounterState {
  reps: number;
  state: RepState;
  currentAngle: number | null;
  feedback: string;
  feedbackType: 'success' | 'warning' | 'info' | 'error' | 'none';
  lastRepTime: number;
  isDetecting: boolean;
  setCount: number;
  sets: number[];
  currentSetReps: number;
  calories: number;
  repHistory: Array<{
    rep: number;
    angle: number;
    timestamp: number;
  }>;
  formScore: number;       // 0-100 form quality score
  postureWarning: string;   // posture-related feedback
}

export function createInitialCounterState(): RepCounterState {
  return {
    reps: 0,
    state: 'idle',
    currentAngle: null,
    feedback: 'Position yourself in frame to begin',
    feedbackType: 'info',
    lastRepTime: 0,
    isDetecting: false,
    setCount: 3,
    sets: [],
    currentSetReps: 0,
    calories: 0,
    repHistory: [],
    formScore: 0,
    postureWarning: '',
  };
}

/**
 * Calculate a form score (0-100) based on range of motion and posture.
 */
function calculateFormScore(
  angle: number,
  exercise: ExerciseConfig,
  landmarks: Landmark[]
): number {
  const { downAngle, upAngle } = exercise;
  const range = Math.abs(downAngle - upAngle);
  const midPoint = (downAngle + upAngle) / 2;

  // Range of motion score (how close to full range)
  const deviationFromMid = Math.abs(angle - midPoint);
  const normalizedDeviation = deviationFromMid / (range / 2);
  const romScore = Math.min(normalizedDeviation * 100, 100);

  // Posture score
  const posture = analyzePosture(landmarks);
  const postureScore = posture.isUpright ? 100 : Math.max(0, 100 - (posture.shoulderLevel * 2000 + posture.hipLevel * 2000));

  // Weighted average
  return Math.round(romScore * 0.6 + postureScore * 0.4);
}

/**
 * Update rep counter based on current landmarks and exercise configuration.
 * State machine: IDLE → DOWN/UP → count on full cycle.
 */
export function updateRepCounter(
  state: RepCounterState,
  landmarks: Landmark[] | null,
  exercise: ExerciseConfig
): RepCounterState {
  if (!landmarks || landmarks.length < 33) {
    return {
      ...state,
      feedback: 'No pose detected — step into the camera frame',
      feedbackType: 'warning',
      isDetecting: false,
      currentAngle: null,
    };
  }

  const angle = getAverageAngle(
    landmarks,
    exercise.landmarks,
    exercise.bilateral ? exercise.secondaryLandmarks : undefined
  );

  if (angle === null) {
    return {
      ...state,
      feedback: 'Ensure your full body is visible in the camera',
      feedbackType: 'warning',
      isDetecting: true,
      currentAngle: null,
    };
  }

  const newState = { ...state, currentAngle: angle, isDetecting: true };
  const { downAngle, upAngle } = exercise;

  // Calculate form score
  const formScore = calculateFormScore(angle, exercise, landmarks);

  // Posture check
  const posture = analyzePosture(landmarks);
  let postureWarning = '';
  if (!posture.isUpright) {
    if (posture.shoulderLevel > 0.05) postureWarning = 'Try to keep your shoulders level';
    else if (posture.hipLevel > 0.05) postureWarning = 'Keep your hips aligned';
  }

  // Angle-based dynamic feedback
  const range = Math.abs(downAngle - upAngle);
  let angleFeedback = '';
  let angleFeedbackType: RepCounterState['feedbackType'] = 'info';

  if (angle > upAngle + range * 0.2) {
    angleFeedback = 'Over-extended! Be careful with your joints';
    angleFeedbackType = 'warning';
  } else if (angle < downAngle - range * 0.2) {
    angleFeedback = 'Going too deep! Reduce range of motion';
    angleFeedbackType = 'warning';
  }

  switch (state.state) {
    case 'idle': {
      if (angleFeedback) {
        return { ...newState, formScore, postureWarning, feedback: angleFeedback, feedbackType: angleFeedbackType };
      }
      if (angle >= upAngle - 10) {
        return {
          ...newState, state: 'up', formScore, postureWarning,
          feedback: 'Good starting position! Now lower down to begin counting',
          feedbackType: 'info',
        };
      } else if (angle <= downAngle + 10) {
        return {
          ...newState, state: 'down', formScore, postureWarning,
          feedback: 'Lower position detected. Raise up to count a rep!',
          feedbackType: 'info',
        };
      }
      return {
        ...newState, formScore, postureWarning,
        feedback: 'Move to starting position to begin',
        feedbackType: 'info',
      };
    }

    case 'up': {
      if (angle <= downAngle + 15) {
        return {
          ...newState, state: 'down', formScore, postureWarning,
          feedback: 'Good depth! Now push up to complete the rep',
          feedbackType: 'info',
        };
      }
      if (postureWarning) {
        return { ...newState, formScore, postureWarning, feedback: postureWarning, feedbackType: 'warning' };
      }
      return {
        ...newState, formScore, postureWarning,
        feedback: `Angle: ${Math.round(angle)}° — Hold steady...`,
        feedbackType: 'info',
      };
    }

    case 'down': {
      if (angle >= upAngle - 15) {
        const newReps = state.reps + 1;
        const newSetReps = state.currentSetReps + 1;
        const newCalories = state.calories + exercise.caloriesPerRep;
        const now = Date.now();

        const scoreMessage = formScore >= 80 ? 'Excellent form!' :
          formScore >= 60 ? 'Good form!' : 'Check your form';

        return {
          ...newState, state: 'up', formScore, postureWarning,
          reps: newReps,
          currentSetReps: newSetReps,
          calories: parseFloat(newCalories.toFixed(1)),
          lastRepTime: now,
          feedback: `Rep ${newReps} counted! ${scoreMessage}`,
          feedbackType: 'success',
          repHistory: [
            ...state.repHistory,
            { rep: newReps, angle: Math.round(angle), timestamp: now },
          ],
        };
      }
      if (postureWarning) {
        return { ...newState, formScore, postureWarning, feedback: postureWarning, feedbackType: 'warning' };
      }
      return {
        ...newState, formScore, postureWarning,
        feedback: `Angle: ${Math.round(angle)}° — Push through!`,
        feedbackType: 'info',
      };
    }

    case 'counting': {
      if (angle >= upAngle - 15) {
        const newReps = state.reps + 1;
        const newCalories = state.calories + exercise.caloriesPerRep;
        const now = Date.now();

        return {
          ...newState, state: 'up', formScore, postureWarning,
          reps: newReps,
          currentSetReps: state.currentSetReps + 1,
          calories: parseFloat(newCalories.toFixed(1)),
          lastRepTime: now,
          feedback: `Rep ${newReps}! Keep going!`,
          feedbackType: 'success',
          repHistory: [
            ...state.repHistory,
            { rep: newReps, angle: Math.round(angle), timestamp: now },
          ],
        };
      }
      return { ...newState, formScore, postureWarning };
    }

    default:
      return newState;
  }
}

/** Complete current set and start a new one */
export function completeSet(state: RepCounterState): RepCounterState {
  const sets = [...state.sets, state.currentSetReps || state.reps];
  return {
    ...state,
    sets,
    currentSetReps: 0,
    reps: 0,
    state: 'idle',
    feedback: `Set ${sets.length} complete! ${sets[sets.length - 1]} reps. Rest and start next set.`,
    feedbackType: 'success',
    repHistory: [],
  };
}

/** Reset the counter for a new exercise */
export function resetCounter(): RepCounterState {
  return createInitialCounterState();
}

/** Get angle-based form feedback */
export function getAngleFeedback(
  angle: number,
  exercise: ExerciseConfig
): { message: string; type: RepCounterState['feedbackType'] } {
  const { downAngle, upAngle } = exercise;
  const range = Math.abs(downAngle - upAngle);

  if (angle > upAngle + range * 0.3) {
    return { message: 'Over-extended! Be careful with your joints.', type: 'warning' };
  }
  if (angle < downAngle - range * 0.3) {
    return { message: 'Going too deep! Reduce range of motion.', type: 'warning' };
  }

  const midPoint = (downAngle + upAngle) / 2;
  const progress = Math.abs(angle - midPoint) / (range / 2);
  if (progress > 0.8) {
    return { message: 'Excellent range! Full extension.', type: 'success' };
  }

  return { message: 'Try to get a fuller range of motion.', type: 'info' };
}
