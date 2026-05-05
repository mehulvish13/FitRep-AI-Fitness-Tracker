// Pose detection engine - angle calculation and pose analysis
// Ported from the original angles.py to TypeScript for browser use

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * Calculate the angle between three landmarks (in degrees).
 * This is the TypeScript port of the original Python angles.py:
 * 
 * def calculate_angle(a, b, c):
 *     a = np.array(a)
 *     b = np.array(b)
 *     c = np.array(c)
 *     radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
 *     angle = np.abs(radians * 180.0 / np.pi)
 *     if angle > 180.0:
 *         angle = 360 - angle
 *     return angle
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const aArr = { x: a.x, y: a.y };
  const bArr = { x: b.x, y: b.y };
  const cArr = { x: c.x, y: c.y };

  const radians =
    Math.atan2(cArr.y - bArr.y, cArr.x - bArr.x) -
    Math.atan2(aArr.y - bArr.y, aArr.x - bArr.x);

  let angle = Math.abs(radians * (180.0 / Math.PI));

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
}

/**
 * Calculate the distance between two landmarks
 */
export function calculateDistance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a landmark is visible enough for reliable detection
 */
export function isLandmarkVisible(landmark: Landmark, threshold: number = 0.5): boolean {
  return (landmark.visibility || 0) >= threshold;
}

/**
 * Get specific landmarks by their indices from MediaPipe pose results
 */
export function getLandmarks(
  landmarks: Landmark[],
  indices: number[]
): Landmark[] | null {
  if (!landmarks || landmarks.length < 33) return null;
  
  const result = indices.map(i => landmarks[i]);
  
  // Check visibility
  for (const lm of result) {
    if (!isLandmarkVisible(lm, 0.5)) return null;
  }
  
  return result;
}

/**
 * Calculate the average angle from both sides (for bilateral exercises)
 */
export function getAverageAngle(
  landmarks: Landmark[],
  primaryIndices: { first: number; mid: number; end: number },
  secondaryIndices?: { first: number; mid: number; end: number }
): number | null {
  const primary = getLandmarks(landmarks, [
    primaryIndices.first,
    primaryIndices.mid,
    primaryIndices.end,
  ]);

  if (!primary) return null;

  const primaryAngle = calculateAngle(primary[0], primary[1], primary[2]);

  if (secondaryIndices) {
    const secondary = getLandmarks(landmarks, [
      secondaryIndices.first,
      secondaryIndices.mid,
      secondaryIndices.end,
    ]);

    if (secondary) {
      const secondaryAngle = calculateAngle(secondary[0], secondary[1], secondary[2]);
      return (primaryAngle + secondaryAngle) / 2;
    }
  }

  return primaryAngle;
}

/**
 * Analyze body posture alignment
 */
export function analyzePosture(landmarks: Landmark[]): {
  isUpright: boolean;
  shoulderLevel: number; // 0 = level, higher = more tilted
  hipLevel: number;
} {
  if (!landmarks || landmarks.length < 33) {
    return { isUpright: false, shoulderLevel: 999, hipLevel: 999 };
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // Calculate shoulder tilt
  const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y);
  // Calculate hip tilt
  const hipLevel = Math.abs(leftHip.y - rightHip.y);

  return {
    isUpright: shoulderLevel < 0.05 && hipLevel < 0.05,
    shoulderLevel,
    hipLevel,
  };
}

/**
 * MediaPipe Pose landmark connections for drawing skeleton
 */
export const POSE_CONNECTIONS = [
  // Face
  [10, 11], // left face
  [11, 12], // right face
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], // left torso
  [12, 24], // right torso
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 29], [29, 31], // left foot
  [28, 30], [30, 32], // right foot
  [15, 17], [15, 19], [15, 21], // left hand
  [16, 18], [16, 20], [16, 22], // right hand
  [0, 1], [1, 2], [2, 3], [3, 7], // left face detail
  [0, 4], [4, 5], [5, 6], [6, 8], // right face detail
  [9, 10], // forehead
] as const;

/**
 * Key landmark indices for skeleton highlighting
 */
export const KEY_LANDMARKS = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;
