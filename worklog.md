# FitRep Counter — Project Worklog

## Current Project Status

**Status**: Development complete, server running, needs real-world testing with webcam
**Stack**: Next.js 16.1.3 (Turbopack) + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite)
**Pose Engine**: @mediapipe/tasks-vision (v0.10.35) via CDN — Turbopack-safe

---

## Session 1 — Full Rebuild

### Problem
Previous version used `@mediapipe/pose` (legacy API) which caused **ChunkLoadError** with Turbopack:
```
Failed to load chunk node_modules_%40mediapipe_pose_pose_75185448.js
```
The legacy `@mediapipe/pose` package loads WASM files from local `node_modules`, which Turbopack's chunk splitting cannot handle properly.

### Solution
Migrated to `@mediapipe/tasks-vision` (v0.10.35) with CDN-based WASM loading:
- WASM files loaded from `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm`
- Model file loaded from `storage.googleapis.com/mediapipe-models/...`
- Dynamic import: `await import('@mediapipe/tasks-vision')` to avoid any bundling issues
- Version pinned to 0.10.35 (not `@latest`) for stability

### Completed Modifications

1. **Database Schema** (`prisma/schema.prisma`):
   - Removed unused User/Post models
   - Workout model with: exerciseId, exerciseName, totalReps, totalSets, duration, calories, setsData, avgFormScore

2. **Core Libraries**:
   - `src/lib/pose-detection.ts` — Angle calculation (ported from Python angles.py), skeleton drawing with glow effects, posture analysis
   - `src/lib/exercises.ts` — 10 exercises (8 original + wall sit + jumping jacks) with targetMuscles, estimatedDuration, tips
   - `src/lib/rep-counter.ts` — State machine with form scoring (0-100), posture warnings, dynamic angle feedback

3. **UI Components**:
   - `src/components/fitness/webcam-view.tsx` — Step-by-step loading indicator, FPS counter, CDN-based PoseLandmarker init, fullscreen support, error handling for camera permissions
   - `src/components/fitness/exercise-selector.tsx` — Category pills filter, animated cards, expanded detail view with tips/target muscles
   - `src/components/fitness/rep-counter-display.tsx` — Gradient card, milestone celebrations (every 5 reps), form score display, progress bar with spring animation
   - `src/components/fitness/workout-history.tsx` — Stats overview with 4 cards, form score gauge (SVG circle), delete workout support, sets breakdown

4. **Main Page** (`src/app/page.tsx`):
   - Three views: select / workout / history
   - Rest timer between sets (configurable, default 30s) with full-screen overlay
   - Target reps control (+/- 5)
   - Sound toggle
   - Double beep sound on target reached
   - Workout saving with form score

5. **API Routes** (`src/app/api/workouts/route.ts`):
   - GET: List workouts (limit 100)
   - POST: Create workout
   - DELETE: Delete workout by id

### Verification Results
- ESLint: Clean (0 errors, 0 warnings)
- Server: Starts successfully, HTTP 200 on /
- All imports resolve correctly
- Prisma schema pushed and generated

### Architecture Decisions
- **CDN over local WASM**: All MediaPipe WASM/model files loaded from CDN to avoid Turbopack chunk issues
- **Pinned version**: Using @mediapipe/tasks-vision@0.10.35 (not @latest) to prevent breaking changes
- **GPU delegate**: Using GPU acceleration for pose detection
- **~15fps throttle**: Detection results throttled to prevent excessive state updates
- **Spring animations**: Framer Motion spring physics for rep count changes

---

## Unresolved Issues / Risks

1. **Camera testing**: Cannot be tested in sandbox environment. Needs real-world testing with webcam + user performing exercises.
2. **GPU delegate fallback**: If GPU is not available, should fallback to CPU. Currently only GPU delegate is configured.
3. **agent-browser compatibility**: The automated browser tool cannot access localhost in this environment. Manual QA needed.
4. **Mobile camera**: Mobile browser camera access needs testing (getUserMedia + back camera).

---

## Priority Recommendations for Next Phase

1. **Real-world testing**: Test camera + pose detection with actual exercises
2. **GPU/CPU fallback**: Add try/catch for GPU delegate, fallback to CPU
3. **Mobile optimization**: Test and optimize for mobile browsers
4. **Dark mode**: Verify all components in dark mode
5. **Performance**: Monitor memory usage during long workout sessions
6. **Additional exercises**: Add more exercise types (planks, crunches, etc.)
7. **Charts**: Add weekly/monthly workout charts to history view
8. **Export**: Allow exporting workout history as CSV/PDF
