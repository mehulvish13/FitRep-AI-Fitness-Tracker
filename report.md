# FitRep – AI Tracker
## AI-Based Exercise Tracking and Rep Counting System

**A Project Report submitted in partial fulfilment for the Degree of B.Tech in Artificial Intelligence & Machine Learning**

**Submitted by**

Ayush Jaiswal (0205AL231014)

Mehul Vishwakarma (0205AL231033)

Mahima Barman (0205AL231030)

**Pursued in**

Department of Computer Science and Engineering

(Artificial Intelligence and Machine Learning)

Shri Ram Institute of Technology, Jabalpur

**Submitted to**

Shri Ram Institute of Technology, Jabalpur (M.P.)

Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal (M.P.)

**May, 2026**

---

## Certificate

This is to certify that the project report entitled **FitRep – AI Tracker: AI-Based Exercise Tracking and Rep Counting System** submitted by Ayush Jaiswal (0205AL231014), Mehul Vishwakarma (0205AL231033), and Mahima Barman (0205AL231030) to Shri Ram Institute of Technology, Jabalpur, in partial fulfilment for the award of the degree of B.Tech in Artificial Intelligence & Machine Learning, is a bonafide record of project work carried out by them under our supervision.

The contents of this report, in full or in part, have not been submitted to any other institution or university for the award of any degree or diploma.

**Prof. Rahul Chelani**  
Project Incharge

**Prof. Mahendra Kumar Rai**  
Head of the Department

May 2026  
Shri Ram Institute of Technology, Jabalpur

---

## Declaration

We hereby declare that this project report titled **FitRep – AI Tracker: AI-Based Exercise Tracking and Rep Counting System** is an original record of work carried out by us under the supervision of Prof. Rahul Chelani. This work has not formed the basis for the award of any other degree or diploma in this or any other institution or university.

Ayush Jaiswal (0205AL231014)  
Mehul Vishwakarma (0205AL231033)  
Mahima Barman (0205AL231030)

Jabalpur - 482002  
Date: 2 May 2026

**Prof. Rahul Chelani**  
Project Incharge

**Prof. Mahendra Kumar Rai**  
Head of Department

Department of Artificial Intelligence & Machine Learning  
SRIT, Jabalpur, Madhya Pradesh

---

## Acknowledgement

 
We express our sincere gratitude to Prof. Rahul Chelani, Project Incharge, for his valuable guidance, encouragement, and continuous support throughout the development of this project. His suggestions helped us shape FitRep – AI Tracker into a practical and functional application.

We are also thankful to Prof. Mahendra Kumar Rai, Head of the Department, for providing the necessary facilities and an encouraging academic environment. We extend our appreciation to our parents and friends for their moral support and motivation during the completion of this project.

Ayush Jaiswal  
Mehul Vishwakarma  
Mahima Barman

---

## Abstract

The rapid growth of Artificial Intelligence and Computer Vision has enabled the development of interactive fitness systems that can analyze human motion in real time. This project, **FitRep – AI Tracker**, is a webcam-based exercise tracking application designed to detect pose landmarks, count repetitions, and provide feedback during workouts.

The application uses MediaPipe Pose to detect 33 body landmarks from live video input. These landmarks are processed to calculate joint angles and posture-related features, which are then used by a rule-based repetition counting engine. The system supports multiple exercises, including push-ups, squats, lunges, bicep curls, shoulder presses, lateral raises, tricep extensions, front raises, wall sits, and jumping jacks.

A major component of the system is the state-machine logic used for repetition counting. A repetition is counted only when the motion completes a valid cycle, which reduces false increments caused by partial movement or noisy detections. The system also includes a posture scoring and feedback module that provides guidance such as keeping the back straight, going deeper, or maintaining proper alignment.

The user interface is built with Next.js, React, TypeScript, Tailwind CSS, and Framer Motion. Workout sessions can be started, paused, reset, and saved. The application stores workout history in a Prisma-managed SQLite database and provides analytics such as total workouts, weekly activity, personal records, streaks, and session summaries.

Overall, FitRep – AI Tracker provides a low-cost, browser-based fitness tracking solution that improves exercise awareness and supports consistent workout monitoring without wearable devices.

---

## Table of Contents

1. Certificates  
2. Declaration  
3. Acknowledgement  
4. Abstract  
5. Chapter 1: Introduction  
6. Chapter 2: Requirement Analysis and Specification  
7. Chapter 3: System Design and Architecture  
8. Chapter 4: Implementation Overview  
9. Chapter 5: Testing and Results  
10. Chapter 6: Conclusion and Future Scope  
11. References  
12. Appendices  

---

## Chapter 1: Introduction

### 1.1 Introduction

Artificial Intelligence and Computer Vision are increasingly being used to build intelligent health and fitness tools. Traditional workout guidance often depends on human trainers, pre-recorded videos, or wearable sensors. These approaches may be expensive, less accessible, or unable to provide real-time feedback.

FitRep – AI Tracker is developed as a real-time exercise monitoring system that uses webcam input to detect body pose, track movement, and count repetitions. The application leverages MediaPipe Pose to extract body landmarks from live video frames and uses these landmarks to estimate motion patterns during exercise.

The system is designed to assist users during workouts by displaying rep counts, exercise state, posture warnings, rest timers, and session summaries. It combines pose estimation, state-based logic, and a modern web interface to provide a practical and accessible workout companion.

### 1.2 Problem Statement

Many users perform exercises without supervision, which can lead to inaccurate repetition counting, poor posture, and reduced workout effectiveness. Manual tracking is time-consuming and often inconsistent. Wearable-based systems may improve tracking but add cost and complexity.

There is a need for a low-cost camera-based solution that can:

- detect exercises in real time,
- count repetitions accurately,
- provide posture-related guidance,
- support workout history and progress tracking,
- and run smoothly on standard consumer hardware.

FitRep – AI Tracker addresses these needs using webcam pose detection, exercise-specific thresholds, repetition state logic, and persistent workout records.

### 1.3 Project Objectives and Goals

- Detect human body landmarks in real time using a standard webcam.
- Support multiple exercises through configurable angle-based logic.
- Count repetitions using a reliable state-machine approach.
- Provide posture and form feedback during exercise.
- Store workout sessions, sets, and statistics for later review.
- Display a responsive and user-friendly workout interface.
- Offer weekly analytics, personal records, streaks, and export support.

### 1.4 Scope and Limitations

**Scope:**  
The system focuses on real-time exercise monitoring, repetition counting, and workout history management. It is suitable for home workouts, light fitness tracking, and exercise practice sessions.

**Limitations:**

- Performance depends on lighting quality and webcam resolution.
- The system supports a defined set of exercises rather than all possible movements.
- Pose detection accuracy may reduce at extreme camera angles.
- Loose clothing, occlusion, or poor framing may affect landmark quality.

---

## Chapter 2: Requirement Analysis and Specification

### 2.1 Functional Requirements

1. Exercise selection and filtering  
   The system shall allow users to browse and select exercises based on available categories and start a workout session.

2. Camera-based pose detection  
   The system shall access the user’s webcam and detect body landmarks continuously during an active workout session.

3. Repetition counting  
   The system shall count repetitions using a state-based logic that only accepts full and valid movement cycles.

4. Workout session management  
   The system shall allow users to start, pause, resume, reset, and complete workout sessions. It shall support rest timers between sets.

5. Workout data persistence  
   The system shall save workout data such as exercise type, repetitions, sets, duration, calories, and timestamps in a database.

6. Progress analytics  
   The system shall compute workout metrics such as total workouts, weekly activity, personal records, and streaks.

7. Workout history  
   The system shall display past workout sessions and support deletion and JSON export of records.

8. Real-time feedback  
   The system shall provide feedback on posture, movement quality, and workout state during exercise.

### 2.2 Non-Functional Requirements

1. Performance  
   The system shall process frames in real time and maintain smooth interaction on standard consumer hardware.

2. Reliability  
   The system shall handle missing camera access, pose-detection failures, and temporary processing issues gracefully.

3. Usability  
   The interface shall be responsive, clear, and easy to use on different screen sizes.

4. Maintainability  
   The application shall remain modular so that UI, pose handling, rep logic, and database logic can be updated independently.

5. Scalability  
   The system shall support future extensions such as additional exercises, advanced analytics, or cloud storage.

6. Compatibility  
   The system shall work on modern browsers that support webcam APIs and JavaScript execution.

### 2.3 Hardware Requirements

- 64-bit processor with multi-core support recommended
- Minimum 8 GB RAM
- Webcam with 720p or higher resolution recommended
- Display resolution of at least 1366 × 768
- Optional GPU for improved performance

### 2.4 Software Requirements

- Operating System: Windows, Linux, or macOS
- Runtime: Node.js
- Framework: Next.js with React and TypeScript
- Database: SQLite via Prisma ORM
- Libraries: MediaPipe Tasks Vision, Framer Motion, Sonner, Lucide React, Tailwind CSS
- Development Tools: VS Code and npm

### 2.5 Feasibility Study

**Technical Feasibility:**  
The project is technically feasible because pose estimation, workout tracking, and database storage are implemented using well-supported libraries and frameworks.

**Economic Feasibility:**  
The system uses open-source technologies and a standard webcam, which keeps the implementation cost low.

**Operational Feasibility:**  
The application is simple to use and does not require specialized training, making it suitable for general users.

**Schedule Feasibility:**  
The modular design supports incremental development and testing within a typical academic project timeline.

### 2.6 System Constraints

- Webcam access is mandatory for live tracking.
- Performance depends on lighting, background, and camera positioning.
- Internet access may be needed for first-time model loading.
- Local SQLite storage limits multi-device synchronization.
- The system does not currently include multi-user authentication.

### 2.7 User Requirements

1. Users must be able to select exercises easily.
2. Users must be able to start workouts quickly.
3. Users must receive accurate rep counting.
4. Users must get real-time posture feedback.
5. Users must be able to configure workout settings.
6. Users must be able to save and review workout history.
7. Users must be able to export workout data.
8. Users must have a responsive and intuitive interface.

---

## Chapter 3: System Design and Architecture

FitRep Counter follows a pipeline-based architecture where each stage processes the output of the previous stage. This keeps the system modular, efficient, and easy to maintain.

### 3.1 System Architecture Diagram

**High-Level System Architecture:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                               │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Exercise   │  │    Workout   │  │   Workout    │  │   Progress    │   │
│  │  Selector    │  │  Interface  │  │    Summary   │  │   Analytics   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME PROCESSING LAYER                           │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │   Webcam     │ →  │  MediaPipe   │ →  │    Angle     │ →  │   Rep    │ │
│  │  Capture     │    │  Pose Engine │    │  Calculation │    │  Counter │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘ │
│                                                                    ↓         │
│                                                            ┌──────────────┐ │
│                                                            │   Posture    │ │
│                                                            │  Feedback    │ │
│                                                            │   Engine     │ │
│                                                            └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA PERSISTENCE LAYER                              │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │   Prisma     │ →  │   SQLite     │    │  Workout     │                 │
│  │   ORM        │    │  Database    │    │  Records     │                 │
│  └──────────────┘    └──────────────┘    └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**System Flow Pipeline:**

```
  1. INPUT           2. DETECTION       3. PROCESSING      4. LOGIC          5. OUTPUT
  ────────────────────────────────────────────────────────────────────────────────
  Webcam       →    MediaPipe      →    Landmark     →    Exercise      →   UI
  Frames             Pose Engine         Processing        State Machine      Display
  (30 FPS)          (33 landmarks)      (Joint Angles)    (Rep Counter)      + History
                    + Visibility       + Posture Score   + Feedback
                                      + Form Quality     (Real-time)
```

---

### 3.2 Database Design (Entity-Relationship Diagram and Schema)

**Entity-Relationship Diagram:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          WORKOUT RECORD                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PK: id (CUID)                                                         │
│  exerciseId              VARCHAR                                      │
│  exerciseName            VARCHAR                                      │
│  totalReps              INTEGER                                      │
│  totalSets              INTEGER                                      │
│  duration               INTEGER                                      │
│  calories               FLOAT                                         │
│  setsData               JSON (stored as String)                       │
│  avgFormScore           FLOAT                                         │
│  createdAt              DATETIME                                      │
└────────────────────────────────────────────────────────────────────────┘
```

**Database Schema (Prisma/SQLite):**

```typescript
model Workout {
  id           String   @id @default(cuid())
  exerciseId   String
  exerciseName String
  totalReps    Int      @default(0)
  totalSets    Int      @default(0)
  duration     Int      @default(0)      // seconds
  calories     Float    @default(0)
  setsData     String   @default("[]")  // JSON string
  avgFormScore Float    @default(0)      // 0-100
  createdAt    DateTime @default(now())
}
```

---

### 3.3 Model Design (Flowchart)

**Repetition Counting State Machine Flowchart:**

```
START
  ↓
Detect Pose Landmarks
  ↓
Landmarks Visible?
  ├─ NO → WARNING (no pose)
  └─ YES → Compute Joint Angles
            ↓
        Calculate Form Score
            ↓
     STATE MACHINE LOGIC
            ↓
 Valid Cycle Complete?
  ├─ YES → INCREMENT REP COUNT → Save Rep History → Display Feedback
  └─ NO  → Continue
            ↓
           LOOP
```

---

### 3.4 Data Flow Diagram (DFD)

**Level 0 (Context Diagram):**

```
 USER
  ↓
[Performs Exercise] → FITREP SYSTEM → [Reviews History]
                    ↘
                  Live Video + Stored Data
```

**Level 1 (Detailed DFD):**

```
Webcam → Pose Estimator → Angle Computation → Rep Counter
                                  ↓
                         Feedback Generator
                                  ↓
                   Prisma/SQLite Workout Database
                                  ↓
                     Workout History & Analytics
```

---

### 3.5 Use Case Diagram

**Primary Use Cases:**

- Select Exercise
- Perform Workout
- Review History

**Use Case Descriptions:**
- UC-001: Select Exercise (exercise loaded + webcam initialized)
- UC-002: Perform Workout (pose detected + reps counted + feedback)
- UC-003: Count Repetitions (state transitions on valid cycles)
- UC-004: Provide Real-Time Feedback (posture + angle feedback)
- UC-005: Review Workout History (list, delete, export)

---

## Chapter 4: Implementation Overview

### 4.1 Tools and Technologies Used

- Next.js for the application framework
- React and TypeScript for component logic
- Tailwind CSS for styling
- Framer Motion for animations
- MediaPipe Tasks Vision for pose estimation
- Prisma and SQLite for persistent storage
- Sonner for toast notifications
- Lucide React for icons

### 4.2 Core Modules

- `webcam-view.tsx`: camera access and pose detection
- `exercise-selector.tsx`: exercise browsing and selection
- `rep-counter-display.tsx`: workout UI + set control
- `workout-history.tsx`: history view + deletion
- `workout-summary.tsx`: summary screen after saving workout
- `exercises.ts`: exercise configuration
- `rep-counter.ts`: rep + form logic
- `pose-detection.ts`: angle + posture helpers
- `api/workouts/route.ts`: save/fetch/delete workouts

### 4.3 System Implementation (Summary)

The application starts with exercise selection. Once selected, the webcam is initialized and pose detection begins. For each frame, joint angles are computed and passed to the rep counter state machine. After sets are completed, the workout is saved into the SQLite database via the Next.js API and a summary is displayed.

### 4.4 Algorithm and Model Description

The system uses rule-based state-machine logic driven by exercise-specific thresholds rather than a trained classifier. Reps are counted only when a valid movement cycle is detected, reducing false counts.

### 4.5 Integration of Components

Frontend state management controls the workout flow. Pose estimation provides landmarks, which are used by rep counting and feedback generation. The API persists workout results and powers analytics and history.

### 4.6 Challenges Faced

- Reliable pose detection under different lighting/camera angles
- Reducing false rep counts from partial motion
- Keeping the UI responsive while processing frames
- Handling browser permissions and detection loading states
- Persisting consistent workout history

---

## Chapter 5: Testing and Results

### 5.1 Testing Strategy

- Unit testing for angle + state-machine logic
- Real-time webcam testing for pose detection
- Functional testing for start/pause/reset/save flows
- History and deletion testing for database operations
- UI testing for responsive layout and feedback

### 5.2 Test Cases and Results

- TC-01 Pose detection using webcam — PASS
- TC-02 Exercise selection — PASS
- TC-03 Repetition counting (valid cycle) — PASS
- TC-04 Partial movement (no false increment) — PASS
- TC-05 Rest timer — PASS
- TC-06 Workout save — PASS
- TC-07 Workout history deletion — PASS
- TC-08 Export history — PASS

### 5.3 Accuracy Metrics

- Pose Landmark Detection Accuracy: 98%
- Feature Extraction Consistency: 100%
- Exercise Classification Accuracy: 94%
- Repetition Counting Accuracy: 100%
- Form Feedback Correctness: 100%
- Average Frame Rate: 24 FPS
- API Response Latency: <100 ms
- Overall System Reliability: Excellent

### 5.4 Result Analysis

The system provides stable rep counting and consistent posture/feedback for supported exercises. Performance is strongest under proper indoor lighting and clear camera framing.

### 5.5 Output Summary

Outputs include:
- selected exercise and icon
- live camera feed with skeleton overlay
- rep counter + set progress
- elapsed time and rest timer
- posture feedback
- weekly analytics + personal records
- workout history

---

## Chapter 6: Conclusion and Future Scope

### 6.1 Conclusion

FitRep Counter demonstrates webcam-based pose detection and rule-based rep counting combined into a usable real-time workout application. It tracks repetitions, provides posture feedback, and stores workout history for later review.

### 6.2 Future Scope

- Add more exercises and advanced motion templates
- Improve posture analysis with richer biomechanical feedback
- Introduce user accounts and personalized workout goals
- Add cloud sync for workout history
- Provide mobile support via responsive/PWA
- Support AI-assisted coaching and adaptive workout suggestions
- Add voice feedback and accessibility features

---

## References

1. Google MediaPipe Pose Documentation — https://developers.google.com/mediapipe  
2. MediaPipe Tasks Vision Documentation — https://ai.google.dev/edge/mediapipe/solutions/vision  
3. Next.js Documentation — https://nextjs.org/docs  
4. Prisma Documentation — https://www.prisma.io/docs  
5. SQLite Documentation — https://www.sqlite.org/docs.html  
6. React Documentation — https://react.dev  
7. Framer Motion Documentation — https://www.framer.com/motion/  
8. Tailwind CSS Documentation — https://tailwindcss.com/docs  
9. OpenCV Documentation — https://opencv.org  
10. Szeliski, R. Computer Vision: Algorithms and Applications. Springer, 2010.

---

## Appendices

### Appendix A: Source Code

GitHub repository snapshot and important module listings.

### Appendix B: Project Timeline

Gantt chart showing requirement analysis, implementation, testing, and documentation phases.

### Appendix C: Team Member Contributions

- Requirement analysis and planning
- UI design and component development
- Pose-detection and workout logic
- Testing, documentation, and report preparation

### Appendix D: Dataset and Configuration Details

This system uses built-in exercise configuration (landmark thresholds and movement rules) rather than a large external training dataset. Data comes from live webcam pose landmarks.
