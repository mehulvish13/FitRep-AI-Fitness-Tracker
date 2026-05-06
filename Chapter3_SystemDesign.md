# Chapter 3: System Design and Architecture

This chapter presents the system design and architecture for the Exercise Tracking and Form Correction System. The design phase translates system requirements into a structured architecture that ensures modularity, maintainability, and performance. The chapter covers the high-level architecture, database design, data flow, and component interactions.

## 3.1 System Architecture Overview

### 3.1.1 Architectural Approach

The system follows a **layered pipeline architecture** where data flows sequentially through distinct processing stages. Each layer performs a specific function and passes its output to the next layer. This approach offers several advantages:

- **Modularity**: Each layer can be developed, tested, and modified independently
- **Maintainability**: Issues in one layer do not affect others
- **Scalability**: Individual layers can be optimized or replaced without redesigning the entire system
- **Clarity**: The data flow is transparent and easy to trace

The architecture is divided into three primary layers:

1. **User Interface Layer**: Handles presentation and user interaction
2. **Real-Time Processing Layer**: Performs pose detection and repetition logic
3. **Data Persistence Layer**: Manages storage and retrieval of workout data

### 3.1.2 High-Level System Architecture

Figure 3.1 illustrates the high-level system architecture showing the three layers and their components.

**Figure 3.1: High-Level System Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                                 │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   Exercise      │  │    Workout       │  │   Workout        │         │
│  │   Selector      │  │    Interface     │  │   Summary        │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   Workout        │  │  Progress        │  │    Settings     │         │
│  │   History        │  │  Analytics       │  │    Panel        │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME PROCESSING LAYER                               │
│                                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                 │
│  │   Webcam     │  →   │  MediaPipe   │  →   │    Angle     │                 │
│  │   Capture    │      │  Pose Engine │      │  Calculation │                 │
│  └──────────────┘      └──────────────┘      └──────────────┘                 │
│                                                        ↓                       │
│                              ┌──────────────┐      ┌──────────────┐             │
│                              │   Posture    │      │     Rep      │             │
│                              │  Feedback    │      │   Counter    │             │
│                              │   Generator  │      │   (State     │             │
│                              │              │      │   Machine)   │             │
│                              └──────────────┘      └──────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DATA PERSISTENCE LAYER                                  │
│                                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐      ┌─────────────────┐     │
│  │   Prisma ORM    │  →   │     SQLite       │  →   │   Workout      │     │
│  │                │      │   Database       │      │   Records       │     │
│  └──────────────────┘      └──────────────────┘      └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1.3 Processing Pipeline

The system implements a five-stage processing pipeline that operates in real time:

**Stage 1: Input Capture**
- Captures video frames from the user's webcam
- Operates at approximately 30 frames per second (FPS)
- Streams frames to the pose estimation engine

**Stage 2: Pose Detection**
- Processes each frame through MediaPipe Pose
- Extracts 33 body landmarks with x, y, z coordinates
- Includes visibility confidence for each landmark

**Stage 3: Feature Processing**
- Computes joint angles from landmark positions
- Extracts relevant angles based on selected exercise
- Generates posture and form quality metrics

**Stage 4: Logic Processing**
- Evaluates exercise-specific angle thresholds
- Updates the repetition counter state machine
- Generates real-time feedback messages

**Stage 5: Output Generation**
- Renders the skeleton overlay on the video feed
- Updates rep counts and workout statistics
- Stores completed workouts in the database

**Table 3.1: Pipeline Stage Summary**

| Stage | Input | Processing | Output | Latency |
|-------|-------|------------|--------|---------|
| 1. Input Capture | Webcam stream | Frame extraction | Video frame | ~1ms |
| 2. Pose Detection | Video frame | MediaPipe inference | 33 landmarks | ~15ms |
| 3. Feature Processing | Landmarks | Angle calculation | Joint angles | ~2ms |
| 4. Logic Processing | Angles | State machine | Rep count, feedback | ~1ms |
| 5. Output Generation | State | UI rendering | Visual display | ~3ms |

## 3.2 Component Architecture

### 3.2.1 User Interface Components

The user interface is built using React components organized by functionality:

**ExerciseSelector**
- Purpose: Display available exercises and handle selection
- Inputs: Exercise configuration data
- Outputs: Selected exercise object

**WebcamView**
- Purpose: Manage camera access and render video feed
- Inputs: Camera permissions, MediaPipe model
- Outputs: Video canvas with skeleton overlay

**RepCounterDisplay**
- Purpose: Show real-time workout statistics
- Inputs: Rep count, set progress, timer state
- Outputs: Visual statistics display

**WorkoutHistory**
- Purpose: Display and manage past workout records
- Inputs: Database records via API
- Outputs: Rendered history list with actions

**WorkoutSummary**
- Purpose: Present session results after completion
- Inputs: Completed workout data
- Outputs: Summary statistics and save/Discard options

### 3.2.2 Processing Components

**MediaPipePose**
- Purpose: Real-time pose landmark detection
- Inputs: Video frames from webcam
- Outputs: 33-body landmark coordinates

**AngleCalculator**
- Purpose: Compute joint angles from landmarks
- Inputs: Three landmark positions
- Outputs: Angle in degrees

**RepCounter**
- Purpose: Track repetition completion using state machine
- Inputs: Current angle, exercise configuration
- Outputs: Updated rep count, phase state

**FeedbackGenerator**
- Purpose: Generate posture and form guidance
- Inputs: Current angle, form score, exercise thresholds
- Outputs: Feedback text messages

### 3.2.3 Data Components

**PrismaClient**
- Purpose: Database ORM interface
- Inputs: Type-safe queries
- Outputs: Workout records

**WorkoutAPI**
- Purpose: Handle HTTP requests for CRUD operations
- Inputs: REST API calls
- Outputs: JSON responses

**SQLiteDatabase**
- Purpose: Local data storage
- Inputs: Workout record data
- Outputs: Persisted records

## 3.3 Database Design

### 3.3.1 Database Schema

The system uses SQLite for local data persistence managed through Prisma ORM. The database schema defines a single entity for workout records.

**Entity Definition: Workout**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | String (CUID) | Unique identifier |
| exerciseId | String | Exercise type identifier |
| exerciseName | String | Exercise display name |
| totalReps | Integer | Total repetitions completed |
| totalSets | Integer | Number of sets performed |
| duration | Integer | Session duration in seconds |
| calories | Float | Estimated calories burned |
| setsData | String | JSON array of set details |
| avgFormScore | Float | Average form score (0-100) |
| createdAt | DateTime | Timestamp of workout creation |

### 3.3.2 Prisma Schema

```typescript
model Workout {
  id           String   @id @default(cuid())
  exerciseId   String
  exerciseName String
  totalReps    Int      @default(0)
  totalSets    Int      @default(0)
  duration     Int      @default(0)
  calories     Float    @default(0)
  setsData     String   @default("[]")
  avgFormScore Float    @default(0)
  createdAt    DateTime @default(now())
}
```

### 3.3.3 Entity Relationship Diagram (ERD)

Figure 3.2 shows the single-entity database design with proper notation.

**Figure 3.2: Entity Relationship Diagram (ERD)**

```
┌────────────────────────────────────────────────────────────────┐
│                        WORKOUT                                 │
│                       (Entity)                                 │
├────────────────────────────────────────────────────────────────┤
│ PK  id : String (CUID)                                          │
├────────────────────────────────────────────────────────────────┤
│    exerciseId : String                                         │
│    exerciseName : String                                       │
│    totalReps : Integer                                        │
│    totalSets : Integer                                         │
│    duration : Integer                                          │
│    calories : Float                                           │
│    setsData : String (JSON)                                    │
│    avgFormScore : Float                                        │
│    createdAt : DateTime                                       │
└────────────────────────────────────────────────────────────────┘
```

**Figure 3.2b: Physical Schema Diagram**

```
┌────────────────────────────────────────────────────────────────┐
│                     WORKOUT TABLE                             │
├──────────────────────────────────────────────────────────────┤
│ Column         │ Type         │ Constraints │ Default         │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ id            │ VARCHAR(18) │ PK          │ cuido()         │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ exerciseId    │ VARCHAR(50) │ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ exerciseName  │ VARCHAR(100)│ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ totalReps     │ INTEGER     │ NOT NULL    │ 0               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ totalSets     │ INTEGER     │ NOT NULL    │ 0               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ duration     │ INTEGER     │ NOT NULL    │ 0               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ calories     │ REAL        │ NOT NULL    │ 0.0             │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ setsData      │ TEXT        │ NOT NULL    │ "[]"            │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ avgFormScore  │ REAL        │ NOT NULL    │ 0.0             │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ createdAt     │ DATETIME    │ NOT NULL    │ NOW()            │
└───────────────┴──────────────┴─────────────┴─────────────────┘

Indexes:
  • PRIMARY KEY: id
  • INDEX idx_createdAt ON WORKOUT (createdAt DESC)
  • INDEX idx_exerciseId ON WORKOUT (exerciseId)
```

**Figure 3.2c: Exercise Configuration Table**

```
┌────────────────────────────────────────────────────────────────┐
│                    EXERCISE CONFIG                             │
│                   (Reference Data)                            │
├────────────────────────────────────────────────────────────────┤
│ Column         │ Type         │ Constraints │ Default         │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ id            │ VARCHAR(50) │ PK          │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ name          │ VARCHAR(100)│ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ muscleGroups  │ TEXT (JSON) │ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ targetJoint   │ INTEGER     │ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ upperJoint    │ INTEGER     │ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ lowerJoint    │ INTEGER     │ NOT NULL    │ -               │
├───────────────┼─────���────────┼─────────────┼─────────────────┤
│ thresholds    │ TEXT (JSON) │ NOT NULL    │ -               │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ difficulty    │ VARCHAR(20) │ NOT NULL    │ beginner        │
├───────────────┼──────────────┼─────────────┼─────────────────┤
│ caloriesPerRep │ REAL        │ NOT NULL    │ 0.0             │
└───────────────┴──────────────┴─────────────┴─────────────────┘

Relationship:
  WORKOUT.exerciseId ──FK──► EXERCISE.id
```

## 3.4 Data Flow Design

### 3.4.1 Level 0 Data Flow (Context Diagram)

The context diagram shows the system as a single entity interacting with external actors.

**Figure 3.3: Context Diagram (Level 0 DFD)**

```
                         ┌─────────────────────────────────────────────────────┐
                         │                                                     │
                         │              FITREP AI TRACKER                       │
                         │                   ( System )                     │
                         │                                                     │
┌─────────────┐          │                                                     │          ┌─────────────────┐
│    USER     │◄────────►│                                                     │◄────────►│    DATABASE    │
│             │          │                                                     │          │   (SQLite)      │
└─────────────┘          │     ┌─────────────────────────────────────────┐     │          └─────────────────┘
        │               │     │                                          │     │                    │
        │               │     │   • Display exercises                   │     │          ┌─────────────────┐
        │               │     │   • Capture webcam video                │     │◄────────►│  EXERCISE       │
        ▼               │     │   • Detect pose landmarks                │     │          │  CONFIGURATION │
  Exercise               │     │   • Count repetitions                  │     │          │  (Built-in)    │
  Selection             │     │   • Store workout records              │     │          └─────────────────┘
                         │     │   • Generate form feedback           │     │
                         │     │                                          │     │
                         │     └─────────────────────────────────────────┘     │
                         │                                                     │
                         └─────────────────────────────────────────────────────┘

              Video Input                    Workout Data                       Data Store
              Selection                    Records                            Records
```

### 3.4.2 Level 1 Data Flow (Process Decomposition)

The Level 1 DFD decomposes the system into major processes.

**Figure 3.4: Level 1 DFD**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              LEVEL 1 DFD                                                    │
├───────────────────────��─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│   ┌───────────┐      ┌───────────────┐      ┌─────────────────┐      ┌──────────────┐      ┌─────────────┐  │
│   │  WEBCAM   │─────►│    POSE       │─────►│     ANGLE       │─────►│     REP      │─────►│     UI      │  │
│   │  INPUT    │      │   DETECTION   │      │   CALCULATION  │      │   COUNTER    │      │   DISPLAY  │  │
│   └───────────┘      │   (MediaPipe) │      │                │      │              │      └─────────────┘  │
│        │            └───────────────┘      └─────────────────┘      └──────────────┘            │         │
│        │                       │                        │                      │                   │         │
│        │                       │                        │                      │                   │         │
│        ▼                       ▼                        ▼                      ▼                   ▼         │
│   ┌───────────┐      ┌───────────────┐      ┌─────────────────┐      ┌──────────────┐      ┌─────────────┐  │
│   │  Video    │      │    33 Body    │      │   Joint Angle   │      │    Rep       │      │   Skeleton  │  │
│   │  Frames   │      │   Landmarks   │      │   Values (°)    │      │   Count +    │      │   Overlay   │  │
│   │  @30fps   │      │   (x,y,z)     │      │                │      │   Phase      │      │   Stats     │  │
│   └───────────┘      └───────────────┘      └─────────────────┘      └──────────────┘      └─────────────┘  │
│                                                                                                             │
│                                              │                                                              │
│                                              ▼                                                              │
│                              ┌───────────────────────────┐                                                 │
│                              │   FEEDBACK GENERATOR   │                                                 │
│                              │                       │                                                 │
│                              │   • Form validation   │                                                 │
│                              │   • Message display  │                                                 │
│                              │   • Posture guide    │                                                 │
│                              └───────────────────────────┘                                                 │
│                                              │                                                              │
│                                              ▼                                                              │
│                              ┌───────────────────────────┐      ┌──────────────┐                           │
│                              │   POSTURE VALIDATION   │◄─────│   Exercise   │                           │
│                              │                       │      │  Config      │                           │
│                              │   • Start position    │      │  (thresholds)│                          │
│                              │   • Form quality     │      └──────────────┘                           │
│                              └───────────────────────────┘                                                 │
│                                              │                                                              │
│                                              ▼                                                              │
│                              ┌───────────────────────────┐      ┌──────────────┐                           │
│                              │     WORKOUT HISTORY      │◄─────│     API      │                           │
│                              │                         │      │   ROUTE      │                           │
│                              │   • Past records        │      └──────────────┘                           │
│                              │   • Statistics         │            │                                          │
│                              └───────────────────────────┘            │                                          │
│                                              │                         │                                  │
│                                              ▼                         ▼                                  │
│                              ┌───────────────────────────┐      ┌──────────────┐                                 │
│                              │    WORKOUT SUMMARY   │◄─────│    SQLite   │                                 │
│                              │                     │      │  DATABASE  │                                 │
│                              │   • Session stats    │      └──────────────┘                                 │
│                              │   • Save/Discard    │           │                                             │
│                              └───────────────────────────┘           │                                             │
│                                              │                       ▼                                             │
│                                              │              ┌──────────────┐                                 │
│                                              └─────────────►│ Workout     │                                 │
│                                                         │  Records    │                                 │
│                                                         └──────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
                                        ┌─────────────────┐
                                        │     SYSTEM      │
            ┌──────────────┐             │                 │             ┌──────────────┐
            │    USER     │─────────────→│  FITREP AI      │←────────────│   DATABASE  │
            │             │             │   TRACKER      │             │              │
            └──────────────┘             │                 │             └──────────────┘
                         Exercise      │                 │             Workout
                         Selection     └─────────────────┘             Records
                                        Video Input
                                        Camera
```

### 3.4.2 Level 1 Data Flow (Process Decomposition)

The Level 1 DFD decomposes the system into major processes.

**Figure 3.4: Level 1 DFD**

```
┌─────────┐     ┌───────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Webcam  │────→│   Pose       │────→│    Angle         │────→│    Rep      │
│ Input   │     │   Detection  │     │    Calculation  │     │    Counter  │
└─────────┘     └───────────────┘     └──────────────────┘     └─────────────┘
                                                                    │
                                                                    ↓
                    ┌───────────────┐     ┌──────────────────┐     ┌────────��─��──┐
                    │   Feedback  │←────│    Posture      │←────│            │
                    │   Generator │     │    Validation  │     │   UI       │
                    └───────────────┘     └──────────────────┘     └─────────────┘
                                            │
                                            ↓
                    ┌───────────────┐     ┌──────────────────┐
                    │   Workout   │←────│    API          │
                    │   History  │     │    Route        │
                    └───────────────┘     └──────────────────┘
                                            │
                                            ↓
                                    ┌───────────────┐
                                    │    SQLite    │
                                    │   Database  │
                                    └───────────────┘
```

### 3.4.3 Data Flow Description

**Process 1: Capture Video Input**
- Description: Captures video frames from the user's webcam
- Input: Camera stream request
- Output: Video frames at ~30 FPS

**Process 2: Pose Detection**
- Description: Detects body landmarks using MediaPipe
- Input: Video frames
- Output: 33 body landmarks with coordinates and visibility

**Process 3: Angle Calculation**
- Description: Computes joint angles from landmarks
- Input: Landmark positions
- Output: Angle values for relevant joints

**Process 4: Repetition Counter**
- Description: State machine for rep counting
- Input: Current angle, exercise configuration
- Output: Rep count, current phase

**Process 5: Feedback Generator**
- Description: Generates posture guidance messages
- Input: Form metrics, exercise thresholds
- Output: Feedback text

**Process 6: Posture Validation**
- Description: Validates starting position
- Input: Landmark positions
- Output: Valid/invalid status

**Process 7: API Route**
- Description: Handles CRUD operations
- Input: HTTP requests
- Output: JSON responses

**Process 8: Database Storage**
- Description: Persists workout records
- Input: Workout data
- Output: Stored records

## 3.5 State Machine Design

### 3.5.1 Repetition Counter State Machine

The repetition counter uses a finite state machine to track exercise progress. This approach prevents false counts from partial movements.

**State Definitions:**

| State | Description | Entry Condition |
|-------|-------------|----------------|
| IDLE | Waiting for movement start | Initial state or after rep completion |
| DESCENDING | Moving to down/start position | Angle enters target range |
| ASCENDING | Moving to up/end position | Angle exits target range |
| COMPLETE | Full cycle detected | Cycle completion criteria met |

**State Transitions:**

```
IDLE ──(angle < threshold.down)──→ DESCENDING
DESCENDING ──(angle > threshold.up)──→ ASCENDING
ASCENDING ──(angle < threshold.complete)──→ COMPLETE
COMPLETE ──(rep incremented)──→ IDLE
```

**Figure 3.5: State Machine Diagram**

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │            ┌──────────┐               │
                    │            │   IDLE   │               │
                    │            └──────────┘               │
                    │                │                     │
                    │                │ angle < threshold   │
                    │                ↓                     │
                    │        ┌──────────────┐               │
                    │        │DESCENDING  │               │
                    │        └──────────────┘               │
                    │                │                     │
                    │                │ angle > threshold   │
                    │                ↓                     │
                    │        ┌──────────────┐    angle <     │
                    │        │ ASCENDING   │───────┘         │
                    │        └──────────────┘               │
                    │                │                     │
                    │                │ cycle complete    │
                    │                ↓                     │
                    │        ┌──────────────┐              │
                    │        │ COMPLETE   │              │
                    │        └──────────────┘              │
                    │                │                     │
                    │                │ rep incremented    │
                    └────────────────┘                     │
                                                         │
                                     Complete            │
                                     Cycle               │
```

### 3.5.2 State Transition Logic

**Algorithm: State Machine Transition**

```
FUNCTION updateState(currentAngle, config, currentState):
  
  SWITCH currentState:
    
    CASE IDLE:
      IF currentAngle < config.threshold.down:
        RETURN DESCENDING
      
    CASE DESCENDING:
      IF currentAngle > config.threshold.up:
        RETURN ASCENDING
      
    CASE ASCENDING:
      IF currentAngle < config.threshold.complete:
        INCREMENT repCount
        RETURN COMPLETE
      
    CASE COMPLETE:
      RETURN IDLE
      
  RETURN currentState
```

## 3.6 Use Case Design

### 3.6.1 Use Case Diagram

Figure 3.6 presents the use case diagram showing system actor and use cases.

**Figure 3.6: Use Case Diagram**

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              USE CASE DIAGRAM                                                  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                │
│                        ┌─────────────────────────────────────────────────────────────────────┐               │
│                        │                              ACTOR                                │               │
│                        │                                                                       │               │
│                        │   ┌───────────────────────────────────────────────────────────┐     │               │
│                        │   │                        USER                             │     │               │
│                        │   │                  (End User / Athlete)                   │     │               │
│                        │   └───────────────────────────────────────────────────────────┘     │               │
│                        │                             │                                   │               │
│                        │                             │                                   │               │
│                        └─────────────────────────────┼───────────────────────────────────┘               │
│                                                  │ │                                                             │
│        ┌─────────────┬─────────────┬─────────────┼┼┼─────────────┬─────────────┬─────────────┐         │
│        │             │             │             │ │             │             │             │         │
│        ▼             ▼             ▼             ▼ ▼             ▼             ▼             ▼         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  ��   UC-001   │ │   UC-002   │ │   UC-003   │ │   UC-004   │ │   UC-005   │ │   UC-006   │ │   UC-007   ││
│  │  Select    │ │   Start    │ │   Pause    │ │   Resume   │ │    End     │ │   View     │ │   Delete   ││
│  │ Exercise   │ │  Workout   │ │  Workout   │ │  Workout   │ │  Workout   │ │  History   │ │  Record    ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│        │            │            │            │            │            │            │            │                │
│        │            │            │            │            │            │            │            │                │
│        └────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘        │
│                                                  │                                                             │
│                                                  ▼                                                             │
│                 ┌──────────────────────────────────────────────────────────────────────────────────┐        │
│                 │                              SYSTEM                                     │        │
│                 ├───────────────────────────────────────────────────────────────────────────┤        │
│                 │                                                                          │        │
│                 │   ┌────────────────────────────────────────────────────────────────────┐ │        │
│                 │   │               FUNCTIONAL REQUIREMENTS                          │ │        │
│                 │   ├────────────────────────────────────────────────────────────────────┤ │        │
│                 │   │   1. Display available exercises                                 │ │        │
│                 │   │   2. Initialize webcam and pose detection                       │ │        │
│                 │   │   3. Real-time pose landmark tracking                          │ │        │
│                 │   │   4. Calculate joint angles                                     │ │        │
│                 │   │   5. Count repetitions (state machine)                         │ │        │
│                 │   │   6. Generate form feedback                                     │ │        │
│                 │   │   7. Display real-time statistics                              │ │        │
│                 │   │   8. Store workout records (SQLite/Prisma)                      │ │        │
│                 │   │   9. Generate workout summary                                  │ │        │
│                 │   │  10. Export workout history (JSON)                             �� │        │
│                 │   └────────────────────────────────────────────────────────────────────┘ │        │
│                 │                                                                          │        │
│                 └──────────────────────────────────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

USE CASE DESCRIPTIONS:
═════════════════════

┌────────────┬─────────────────────────────────────────────────────────────────────────────────────────┐
│  USE CASE  │  DESCRIPTION                                                                              │
├────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
│ UC-001     │  Browse and select an exercise from the available exercise list                         │
│ UC-002     │  Initialize camera, load exercise config, and begin pose detection                     │
│ UC-003     │  Temporarily pause the workout session (halt counting, keep state)                    │
│ UC-004     │  Resume a paused workout session from where it left off                                 │
│ UC-005     │  Complete workout, view summary, and save/discard workout data                        │
│ UC-006     │  View past workout records from the database                                            │
│ UC-007     │  Delete a specific workout record from the history                                    │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                    ACTOR                                    │
│                                     USER                                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────┬───────────┬───────────┬───────────┬───────────┬────────────┐
          │           │           │           │           │           │            │
          ▼           ▼           ▼           ▼           ▼           ▼            │
   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
   │  Select   │ │   Start   │ │   Pause   │ │  Complete │ │   Save    │ │  Export   │
   │Exercise  │ │ Workout  │ │ Workout  │ │ Workout  │ │ Workout  │ │ History   │
   └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
          │           │           │           │           │           │
          │           │           │           │           │           │
          ▼           ▼           ▼           ▼           ▼           ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                         SYSTEM                                             │
   │  1. Display exercises     5. Display real-time statistics                 │
   │  2. Initialize webcam   6. Store workout data                           │
   │  3. Detect pose       7. Generate summary                            │
   │  4. Count reps        8. Export records                             │
   └──────────────────────────────────────────────────────────────────────────┘
```

### 3.6.2 Use Case Descriptions

**Table 3.2: Use Case Summary**

| Use Case ID | Use Case Name | Description | Primary Actor |
|------------|--------------|--------------|---------------|
| UC-001 | Select Exercise | Browse and choose an exercise | User |
| UC-002 | Start Workout | Initialize camera and begin pose detection | User |
| UC-003 | Pause Workout | Temporarily halt the session | User |
| UC-004 | Resume Workout | Continue paused session | User |
| UC-005 | End Workout | Complete and save the session | User |
| UC-006 | View History | Browse past workout records | User |
| UC-007 | Delete Record | Remove a workout from history | User |
| UC-008 | Export History | Download workout data as JSON | User |

### 3.6.3 Detailed Use Case: Count Repetitions

**Use Case: UC-009 - Count Repetitions**

| Attribute | Description |
|-----------|-------------|
| ID | UC-009 |
| Name | Count Repetitions |
| Actor | System |
| Preconditions | Webcam active, pose detected, exercise selected |
| Postconditions | Rep count updated if valid cycle detected |
| Flow | 1. Receive current landmark positions |
|      | 2. Calculate relevant joint angle |
|      | 3. Evaluate against exercise thresholds |
|      | 4. Update state machine |
|      | 5. Increment rep if cycle complete |
|      | 6. Provide feedback |

## 3.7 Interface Design

### 3.7.1 Component Interfaces

**ExerciseSelector Interface**

```typescript
interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  targetJoint: number;
  upperJoint: number;
  lowerJoint: number;
  thresholds: {
    down: number;
    up: number;
    complete: number;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  caloriesPerRep: number;
}
```

**RepCounterState Interface**

```typescript
interface RepCounterState {
  repCount: number;
  setCount: number;
  phase: 'IDLE' | 'DESCENDING' | 'ASCENDING' | 'COMPLETE';
  currentAngle: number;
  formScore: number;
  feedback: string;
}
```

**WorkoutRecord Interface**

```typescript
interface WorkoutRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  totalReps: number;
  totalSets: number;
  duration: number;
  calories: number;
  setsData: SetData[];
  avgFormScore: number;
  createdAt: Date;
}
```

## 3.8 Security and Performance Considerations

### 3.8.1 Security Design

- **Camera Access**: Uses browser permission model; no credential storage required
- **Data Storage**: Local SQLite database; no sensitive data transmitted
- **API Security**: Local API routes only; no external access

### 3.8.2 Performance Design

- **Frame Processing**: Runs in separate execution context to prevent UI blocking
- **Angle Calculation**: O(1) complexity per frame
- **Database Operations**: Indexed by createdAt for fast history queries
- **Memory Management**: Landmark arrays are reused to prevent allocation overhead

## 3.9 Summary

This chapter has presented the system design and architecture for the Exercise Tracking and Form Correction System. The system follows a layered pipeline architecture consisting of three layers: User Interface, Real-Time Processing, and Data Persistence. The processing pipeline operates in five stages from input capture through output generation.

Key design elements include:

1. **Architecture**: Layered pipeline design ensures modularity and maintainability
2. **Database**: Single-entity SQLite schema managed through Prisma ORM
3. **State Machine**: Four-state finite state machine prevents false repetition counts
4. **Data Flow**: Clear processing pipeline from webcam through UI display
5. **Use Cases**: Eight primary use cases cover the complete user workflow

The design provides a foundation for reliable real-time pose detection and repetition counting while maintaining a responsive user interface. The next chapter describes the implementation details of the designed system.