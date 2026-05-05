// Pose detection engine - angle calculation and pose analysis
// Ported from the original angles.py to TypeScript for browser use
// Updated for @mediapipe/tasks-vision PoseLandmarker API

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
 * Get specific landmarks by their indices from pose results
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
  shoulderLevel: number;
  hipLevel: number;
} {
  if (!landmarks || landmarks.length < 33) {
    return { isUpright: false, shoulderLevel: 999, hipLevel: 999 };
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y);
  const hipLevel = Math.abs(leftHip.y - rightHip.y);

  return {
    isUpright: shoulderLevel < 0.05 && hipLevel < 0.05,
    shoulderLevel,
    hipLevel,
  };
}

/**
 * Pose landmark connections for drawing skeleton on canvas.
 * Each pair is [startLandmarkIndex, endLandmarkIndex].
 * Compatible with MediaPipe Pose Landmarker 33-landmark model.
 */
export const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Left foot
  [27, 29], [29, 31],
  // Right foot
  [28, 30], [30, 32],
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  // Hands
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22],
];

/**
 * Draw the skeleton on a canvas context.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  options?: {
    connections?: [number, number][];
    connectionColor?: string;
    connectionWidth?: number;
    landmarkColor?: string;
    landmarkRadius?: number;
    highlightIndices?: Set<number>;
    highlightColor?: string;
    highlightRadius?: number;
    mirror?: boolean;
  }
) {
  const {
    connections = POSE_CONNECTIONS,
    connectionColor = '#22c55e',
    connectionWidth = 3,
    landmarkColor = '#22c55e',
    landmarkRadius = 3,
    highlightIndices,
    highlightColor = '#ef4444',
    highlightRadius = 7,
    mirror = true,
  } = options || {};

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const toCanvas = (lm: Landmark) => ({
    x: mirror ? (1 - lm.x) * w : lm.x * w,
    y: lm.y * h,
    v: lm.visibility || 0,
  });

  // Draw connections
  ctx.strokeStyle = connectionColor;
  ctx.lineWidth = connectionWidth;
  ctx.lineCap = 'round';

  for (const [a, b] of connections) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    if (!lmA || !lmB) continue;
    if ((lmA.visibility || 0) < 0.4 || (lmB.visibility || 0) < 0.4) continue;

    const pA = toCanvas(lmA);
    const pB = toCanvas(lmB);

    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
  }

  // Draw landmarks
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility || 0) < 0.4) continue;

    const p = toCanvas(lm);
    const isHighlight = highlightIndices?.has(i);

    if (isHighlight) {
      // Glow effect for highlighted landmarks
      ctx.beginPath();
      ctx.arc(p.x, p.y, highlightRadius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = highlightColor + '33'; // semi-transparent
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, highlightRadius, 0, 2 * Math.PI);
      ctx.fillStyle = highlightColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, landmarkRadius, 0, 2 * Math.PI);
      ctx.fillStyle = landmarkColor;
      ctx.fill();
    }
  }
}

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
