// Rep counter logic - state machine based exercise rep counting
import type { Landmark } from './pose-detection';
import { getAverageAngle } from './pose-detection';
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
  };
}

/**
 * Update rep counter based on current landmarks and exercise configuration.
 * Uses a state machine approach:
 * 
 * IDLE -> Detects pose -> DOWN/UP based on initial position
 * DOWN -> Angle exceeds upThreshold -> UP
 * UP -> Angle drops below downThreshold -> DOWN + count rep
 */
export function updateRepCounter(
  state: RepCounterState,
  landmarks: Landmark[] | null,
  exercise: ExerciseConfig
): RepCounterState {
  if (!landmarks || landmarks.length < 33) {
    return {
      ...state,
      feedback: 'No pose detected - position yourself in frame',
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
      feedback: 'Ensure full body is visible in camera',
      feedbackType: 'warning',
      isDetecting: true,
      currentAngle: null,
    };
  }

  const newState = { ...state, currentAngle: angle, isDetecting: true };
  const { downAngle, upAngle } = exercise;

  // Determine if we're in "down" or "up" position
  // For some exercises, "down" means bent (lower angle) and for others it means extended
  // We use proximity to determine state
  const isUp = angle > ((downAngle + upAngle) / 2 + (downAngle - upAngle) / 2 * 0.3);
  const isDown = angle < ((downAngle + upAngle) / 2 - (downAngle - upAngle) / 2 * 0.3);

  switch (state.state) {
    case 'idle': {
      // Determine initial position
      if (angle >= upAngle - 10) {
        return {
          ...newState,
          state: 'up',
          feedback: 'Good starting position! Now lower down to begin counting',
          feedbackType: 'info',
        };
      } else if (angle <= downAngle + 10) {
        return {
          ...newState,
          state: 'down',
          feedback: 'Lower position detected. Raise up to count a rep!',
          feedbackType: 'info',
        };
      }
      return {
        ...newState,
        feedback: 'Move to starting position',
        feedbackType: 'info',
      };
    }

    case 'up': {
      // Currently in "up" position - wait for "down"
      if (angle <= downAngle + 15) {
        return {
          ...newState,
          state: 'down',
          feedback: 'Now raise up!',
          feedbackType: 'info',
        };
      }
      return {
        ...newState,
        feedback: `Angle: ${Math.round(angle)}° - Hold position...`,
        feedbackType: 'info',
      };
    }

    case 'down': {
      // Currently in "down" position - wait for "up"
      if (angle >= upAngle - 15) {
        // Count a rep!
        const newReps = state.reps + 1;
        const newSetReps = state.currentSetReps + 1;
        const newCalories = state.calories + exercise.caloriesPerRep;
        const now = Date.now();
        
        return {
          ...newState,
          state: 'up',
          reps: newReps,
          currentSetReps: newSetReps,
          calories: parseFloat(newCalories.toFixed(1)),
          lastRepTime: now,
          feedback: `Rep ${newReps}! Great form!`,
          feedbackType: 'success',
          repHistory: [
            ...state.repHistory,
            { rep: newReps, angle: Math.round(angle), timestamp: now },
          ],
        };
      }
      return {
        ...newState,
        feedback: `Angle: ${Math.round(angle)}° - Push through!`,
        feedbackType: 'info',
      };
    }

    case 'counting': {
      // Same as down state
      if (angle >= upAngle - 15) {
        const newReps = state.reps + 1;
        const newCalories = state.calories + exercise.caloriesPerRep;
        const now = Date.now();

        return {
          ...newState,
          state: 'up',
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
      return newState;
    }

    default:
      return newState;
  }
}

/**
 * Complete current set and start a new one
 */
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

/**
 * Reset the counter for a new exercise
 */
export function resetCounter(state?: RepCounterState): RepCounterState {
  return createInitialCounterState();
}

/**
 * Get angle-based feedback messages
 */
export function getAngleFeedback(
  angle: number,
  exercise: ExerciseConfig
): { message: string; type: RepCounterState['feedbackType'] } {
  const { downAngle, upAngle } = exercise;
  const range = Math.abs(downAngle - upAngle);
  const midPoint = (downAngle + upAngle) / 2;

  if (angle > upAngle + range * 0.3) {
    return { message: 'Over-extended! Be careful with your joints.', type: 'warning' };
  }

  if (angle < downAngle - range * 0.3) {
    return { message: 'Going too deep! Reduce range of motion.', type: 'warning' };
  }

  const progress = Math.abs(angle - midPoint) / (range / 2);
  if (progress > 0.8) {
    return { message: 'Excellent range! Full extension.', type: 'success' };
  }

  return { message: 'Try to get a fuller range of motion.', type: 'info' };
}
