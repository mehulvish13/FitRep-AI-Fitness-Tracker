# Chapter 4: Implementation Overview

This chapter provides a comprehensive description of the tools, technologies, and core modules that comprise the Exercise Tracking and Form Correction System. Additionally, it details the system architecture, algorithmic approach, integration strategy, and challenges encountered during development.

## 4.1 Tools and Technologies Used

The system was built using modern web technologies selected for performance, developer experience, and community support. Table 4.1 summarizes the primary tools and their purposes.

**Table 4.1: Tools and Technologies**

| Technology | Purpose |
|------------|---------|
| Next.js 14 | Application framework and routing |
| React + TypeScript | UI components and type-safe logic |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Fluid animations and transitions |
| MediaPipe Tasks Vision | Pose estimation and landmark detection |
| Prisma + SQLite | ORM and local database storage |
| Sonner | Toast notifications |
| Lucide React | Icon library |

Next.js was chosen for its server-side rendering capabilities and optimized performance. TypeScript ensures type safety throughout the codebase, reducing runtime errors. Tailwind CSS enables rapid styling without writing custom CSS files. MediaPipe provides cross-platform pose detection with minimal computational overhead, making it suitable for real-time client-side processing.

## 4.2 Core Modules

The application consists of nine primary modules, each handling a distinct responsibility within the system workflow. Figure 4.1 illustrates the module relationships.

**Figure 4.1: Module Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Exercise        │───>│ Webcam           │───>│ Rep Counter     │
│ Selector        │    │ View             │    │ Display         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                     │                        │
          v                     v                        v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Exercises       │    │ Pose Detection   │    │ Rep Counter     │
│ (Config)        │    │                  │    │ (Logic)         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                      │
                                                      v
                                            ┌─────────────────┐
                                            │ Workout Summary│
                                            └─────────────────┘
                                                      │
                                                      v
                                            ┌─────────────────┐
                                            │ Workout History│
                                            └─────────────────┘
                                                      │
                                                      v
                                            ┌─────────────────┐
                                            │ API Route       │
                                            └─────────────────┘
```

### 4.2.1 Exercise Selector (exercise-selector.tsx)

This module presents a catalog of available exercises to the user. It loads exercise configurations from `exercises.ts` and renders them as selectable cards. Each card displays the exercise name, target muscle groups, and a thumbnail image. When a user selects an exercise, the module navigates to the workout view and passes the selected exercise configuration to the webcam component.

### 4.2.2 Webcam View (webcam-view.tsx)

The webcam view handles three critical functions: camera access, MediaPipe initialization, and the detection loop. Upon mounting, the component requests camera permission using the browser's MediaStream API. Once granted, it initializes the MediaPipe Pose detector with the appropriate model configuration.

The detection loop operates at approximately 30 frames per second. For each frame, the module:
1. Captures the video frame from the webcam stream
2. Processes the frame through MediaPipe Pose
3. Extracts the 33 body landmarks
4. Draws the skeleton overlay on the canvas
5. Passes the landmarks to the repetition counter module

The module also provides real-time feedback indicators showing detection status, camera readiness, and connection quality.

### 4.2.3 Rep Counter Display (rep-counter-display.tsx)

This module renders real-time workout statistics during the exercise session. It displays the current repetition count, set progress, estimated calorie expenditure, and timer. The display updates reactively as the rep counter logic processes each frame. Visual indicators show whether the user is in the "up" or "down" phase of the movement, providing immediate form feedback.

### 4.2.4 Repetition Counter Logic (rep-counter.ts)

The repetition counter implements a state machine that tracks exercise progress. It maintains the current phase (up/down), validates joint angles against exercise-specific thresholds, and increments the rep count when a complete movement is detected. The module exports the `calculateReps` function, which accepts landmark data and exercise configuration, returning the updated workout state.

**State Machine Definition:**

```
States: IDLE → DESCENDING → ASCENDING → COMPLETE → IDLE

Transitions:
- IDLE → DESCENDING: Angle enters target range
- DESCENDING → ASCENDING: Angle exits target range
- ASCENDING → COMPLETE: Full cycle detected
- COMPLETE → IDLE: Rep count incremented
```

### 4.2.5 Pose Detection Helpers (pose-detection.ts)

This module provides utility functions for computing joint angles and posture analysis. Key functions include:

- `calculateAngle(a, b, c)`: Computes the angle formed by three points (joint angle)
- `getLandmarkPosition(landmarks, joint)`: Extracts 3D coordinates for a specific joint
- `validatePosture(landmarks, exercise)`: Checks if the user is in the correct starting position

MediaPipe returns 33 landmarks, each containing x, y, z coordinates and visibility confidence. The module uses only the relevant joints for each exercise type, reducing computational overhead.

### 4.2.6 Exercise Configuration (exercises.ts)

This file stores the definitions for all supported exercises. Each exercise configuration includes:

- Unique identifier and display name
- Target muscle groups
- Required joint angles and their thresholds (minimum/maximum)
- Description and instructions
- Difficulty level and estimated calories per rep

Currently, the system supports squat, lunge, push-up, and plank exercises. Each exercise has unique angle thresholds calibrated for accurate repetition detection.

### 4.2.7 Workout History (workout-history.tsx)

The workout history module displays past sessions in a scrollable list format. Each entry shows the date, exercise performed, repetitions completed, duration, and a performance indicator. The module fetches data from the API route and renders it using a timeline layout.

### 4.2.8 Workout Summary (workout-summary.tsx)

After completing a workout session, this module presents a summary screen showing total reps, duration, calories burned, and form consistency score. The user can save the workout to history or discard it. The summary provides visual charts comparing the current session to previous performances.

### 4.2.9 API Route (api/workouts/route.ts)

This API route handles HTTP requests for workout persistence. It supports:
- **GET**: Retrieve all workout records
- **POST**: Create a new workout record
- **DELETE**: Remove a specific record

The route interfaces with Prisma ORM, which manages SQLite database operations. Workout data is stored with timestamps, exercise type, rep count, and metadata.

## 4.3 System Implementation

### 4.3.1 Application Workflow

The system follows a linear workflow from exercise selection through session completion:

1. **Initialization**: User launches the application and sees the exercise selection screen
2. **Exercise Selection**: User browses available exercises and selects one
3. **Camera Setup**: Application requests camera permission and initializes MediaPipe
4. **Detection Loop**: System processes video frames at ~30 FPS
5. **Rep Tracking**: Landmark data is analyzed for repetition counting
6. **Session End**: User completes the set or manually ends the session
7. **Persistence**: Workout data is saved to the database
8. **Summary**: Results are displayed and stored in history

### 4.3.2 Component Lifecycle

Each major component follows a specific lifecycle:

**WebcamView Lifecycle:**
```
Mount → Request Permission → Initialize MediaPipe → 
Start Detection Loop → Render Frame → Process Landmarks →
Update State → Cleanup on Unmount
```

**RepCounter Lifecycle:**
```
Initialize State (repCount: 0, phase: IDLE) → 
Receive Landmarks → Calculate Angle → 
Evaluate Thresholds → Update State → Emit Changes
```

### 4.3.3 Data Flow

The real-time data flow moves from the webcam stream through processing modules:

1. Raw video frame captured from `navigator.mediaDevices.getUserMedia()`
2. Frame passed to MediaPipe Pose for landmark extraction
3. Landmarks forwarded to `rep-counter.ts` for angle calculation
4. Angle compared against exercise thresholds
5. State updated and rendered in `rep-counter-display.tsx`
6. Final workout saved via `api/workouts/route.ts`

## 4.4 Algorithm and Model Description

### 4.4.1 Approach Overview

Rather than employing a machine learning classifier, the system uses a deterministic threshold-based algorithm with a finite state machine. This approach offers several advantages:

- **Lightweight**: No model loading or inference overhead
- **Interpretable**: Logic is transparent and debuggable
- **Fast**: Angle calculations are O(1) per frame
- **Customizable**: Thresholds are easily adjustable

### 4.4.2 Repetition Detection Algorithm

The core algorithm operates in five steps:

**Algorithm 1: Repetition Detection**

```
Input: landmark[], exerciseConfig
Output: updatedRepCount, feedback

1. FUNCTION detectRep(landmarks, config):
2.   relevantJoint ← config.targetJoint
3.   angle ← calculateAngle(
4.     landmarks[relevantJoint],
5.     landmarks[config.upperJoint],
6.     landmarks[config.lowerJoint]
7.   )
8.   
9.   currentPhase ← getCurrentPhase()
10.  threshold ← config.angleThreshold
11.  
12.  IF currentPhase == IDLE AND angle < threshold.down:
13.     SET currentPhase = DESCENDING
14.     
15.  ELSE IF currentPhase == DESCENDING AND angle > threshold.up:
16.     SET currentPhase = ASCENDING
17.     
18.  ELSE IF currentPhase == ASCENDING AND angle < threshold.complete:
19.     INCREMENT repCount
20.     SET currentPhase = IDLE
21.     
22.  feedback ← generateFeedback(angle, currentPhase)
23.  RETURN repCount, feedback
```

### 4.4.3 Angle Calculation

Joint angles are computed using the arctangent function. Given three points (shoulder, elbow, wrist for arm angle), the angle is calculated as:

```
angle = atan2(dy, dx) * (180 / π)
```

MediaPipe provides normalized coordinates (0-1 range), which are mapped to pixel coordinates for drawing the skeleton overlay.

### 4.4.4 Posture Validation

Before counting repetitions, the system validates that the user is in the correct starting position. This is accomplished by checking:

- Required landmarks are visible (visibility > 0.5)
- User is centered in the frame
- Joint angles are within a valid range for the exercise

If posture validation fails, the system displays a guidance message rather than counting reps.

## 4.5 Integration of Components

### 4.5.1 Frontend Integration

The frontend is built as a single-page application using Next.js App Router. Components are organized by feature and communicate through React props and state management. The main page orchestrates the workflow by conditionally rendering components based on the current application state.

### 4.5.2 Pose Estimation Integration

MediaPipe Pose runs entirely in the browser using WebGL for GPU acceleration. The model processes each video frame and returns 33 3D landmarks. These landmarks are converted to 2D coordinates for skeleton rendering and 3D coordinates for angle calculation.

### 4.5.3 Database Integration

Prisma ORM provides type-safe database access. The schema defines a `Workout` model with fields for id, exercise type, rep count, duration, calories, and timestamp. The API route acts as a bridge between the frontend and database, handling CRUD operations.

### 4.5.4 Integration Challenges

The primary integration challenges involved:

- Synchronizing the detection loop with React state updates
- Ensuring smooth frame processing without blocking the UI thread
- Handling camera permission denials gracefully
- Maintaining consistent data persistence across browser sessions

## 4.6 Challenges Faced and Solutions

### 4.6.1 Reliable Pose Detection

**Challenge**: Pose detection accuracy varied significantly depending on camera position, lighting conditions, and user body position within the frame.

**Solution**: 
- Implemented a confidence threshold (visibility > 0.5) to filter unreliable detections
- Added visual indicators showing detected landmark positions so users can adjust their positioning
- Included calibration instructions before starting each exercise

### 4.6.2 False Repetition Counts

**Challenge**: Partial or jerky movements sometimes triggered false repetition counts, especially during transition phases.

**Solution**:
- Implemented a debounce mechanism requiring the user to hold each position briefly
- Added a state machine with clear phase transitions to prevent rapid state changes
- Introduced hysteresis in threshold values to create a buffer zone between states

### 4.6.3 Interface Responsiveness

**Challenge**: Processing video frames while updating the React interface caused noticeable lag and dropped frames.

**Solution**:
- Moved pose detection to a Web Worker to prevent blocking the main thread
- Used `requestAnimationFrame` for optimal frame timing
- Minimized React re-renders by batching state updates

### 4.6.4 Camera Permissions

**Challenge**: Browser camera permissions are complex to handle across different browsers and require user interaction to grant.

**Solution**:
- Implemented comprehensive permission request logic with clear user prompts
- Added error handling for permission denial scenarios
- Provided fallback UI when camera access is unavailable

### 4.6.5 Data Persistence

**Challenge**: Ensuring workout data is consistently saved across sessions, especially during unexpected browser closures or network issues.

**Solution**:
- Used SQLite for local storage, eliminating network dependencies
- Implemented automatic save triggers at the end of each session
- Added error handling in the API route to prevent data loss

## 4.7 Summary

This chapter has documented the implementation of the Exercise Tracking and Form Correction System, covering the tools and technologies, core modules, system workflow, algorithmic approach, component integration, and challenges encountered. The threshold-based approach with a state machine provides a lightweight and interpretable solution for real-time repetition detection. The challenges addressed during development resulted in a more robust and user-friendly application. The next chapter presents the testing methodology and results.