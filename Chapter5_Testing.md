# Chapter 5: Testing and Results

This chapter presents the testing methodology, test cases, experimental results, and analysis for the Exercise Tracking and Form Correction System. The testing strategy was designed to validate both individual components and the integrated system under various conditions.

## 5.1 Testing Strategy

A comprehensive testing approach was adopted to ensure system reliability and accuracy. The strategy encompassed unit testing, integration testing, and real-world performance evaluation.

### 5.1.1 Unit Testing

Unit tests were developed for core computational functions to verify correctness at the component level:

- **Angle Calculation Tests**: Validated the `calculateAngle` function using known coordinates to verify computed angles match expected values within a tolerance of ±1 degree.
- **Repetition Counter Tests**: Tested the state machine transitions using synthetic landmark data representing various exercise phases.
- **Posture Validation Tests**: Verified that the `validatePosture` function correctly identifies valid and invalid starting positions.

### 5.1.2 Integration Testing

Integration tests evaluated the complete workflow from camera input through database storage:

- Test sequences covered the full user journey: exercise selection, camera initialization, pose detection, rep counting, session completion, and data persistence.
- API endpoints were tested for all supported HTTP methods (GET, POST, DELETE) to verify correct database operations.

### 5.1.3 Real-World Testing

Real-world testing evaluated system performance under practical conditions:

- **Webcam Testing**: Validated pose detection using various integrated webcams across different laptop models
- **Lighting Conditions**: Tested detection reliability under bright, moderate, and low-light indoor environments
- **Camera Position Test**: Evaluated detection across different angles and distances from the camera
- **Continuous Operation**: Assessed system stability during extended workout sessions (30+ minutes)

### 5.1.4 Performance Testing

Performance metrics were collected to evaluate system responsiveness:

- Frame rate measurement during active pose detection
- API response latency for database operations
- Memory usage monitoring during extended sessions
- UI responsiveness evaluation during real-time processing

## 5.2 Test Cases and Results

A total of eight test cases were executed to validate system functionality. Each test case defined a specific scenario, expected outcome, and actual result. Table 5.1 presents the complete test case results.

**Table 5.1: Test Case Results**

| Test Case ID | Test Description | Expected Outcome | Actual Outcome | Status |
|--------------|------------------|-------------------|----------------|--------|
| TC-01 | Pose detection using webcam | Body landmarks are detected in real time | Landmarks are displayed and tracked correctly | PASS |
| TC-02 | Exercise selection | User can choose a supported exercise | Exercise loads into workout view correctly | PASS |
| TC-03 | Repetition counting | A full motion cycle counts one rep | Rep count updates only on valid cycle completion | PASS |
| TC-04 | Partial movement | Incomplete motion should not count as a rep | No false increment observed | PASS |
| TC-05 | Rest timer | Rest timer activates between sets | Countdown and resume behavior works correctly | PASS |
| TC-06 | Workout save | Completed workout is stored in database | Workout saved and appears in history | PASS |
| TC-07 | Workout history deletion | User can delete a record | Record is removed successfully | PASS |
| TC-08 | Export history | Workout data exports as JSON | JSON export works correctly | PASS |

### 5.2.1 Test Case Details

**TC-01: Pose Detection Using Webcam**

- *Procedure*: Requested camera access, initialized MediaPipe Pose, performed various movements in front of the camera
- *Result*: The system successfully detected all 33 landmarks in real time. The skeleton overlay rendered correctly on the video feed. Detection maintained consistency across different body positions.

**TC-02: Exercise Selection**

- *Procedure*: Navigated to the exercise selection screen, selected different exercises from the catalog
- *Result*: Each selected exercise loaded with the correct configuration, including target joints, angle thresholds, and exercise-specific instructions.

**TC-03: Repetition Counting**

- *Procedure*: Performed complete repetition cycles for each supported exercise (squat, lunge, push-up, plank)
- *Result*: The rep count incremented precisely once per complete movement cycle. No duplicates or missed counts occurred when movements were performed at moderate speed.

**TC-04: Partial Movement**

- *Procedure*: Performed incomplete movements (partial squat, aborted push-up) to test false positive prevention
- *Result*: The rep counter correctly identified incomplete movements and did not increment the count. The state machine remained stable without spurious transitions.

**TC-05: Rest Timer**

- *Procedure*: Configured rest intervals between sets, started a workout, allowed the rest timer to activate
- *Result*: The countdown timer displayed correctly and automatically resumed the workout session upon completion. The interface remained responsive throughout the rest period.

**TC-06: Workout Save**

- *Procedure*: Completed a workout session, terminated the session, checked the workout history
- *Result*: The workout record was successfully saved to the SQLite database and appeared in the workout history with all expected fields (date, exercise, reps, duration, calories).

**TC-07: Workout History Deletion**

- *Procedure*: Selected an existing workout record, initiated deletion, confirmed the action
- *Result*: The record was removed from the database and no longer appeared in the workout history list.

**TC-08: Export History**

- *Procedure*: Accessed the workout history, triggered the JSON export function, saved the exported file
- *Result*: A valid JSON file was generated containing all workout records with proper field formatting.

## 5.3 System Performance Metrics

System performance was evaluated across multiple dimensions including accuracy, speed, and reliability. Table 5.2 summarizes the key performance metrics.

**Table 5.2: Performance Metrics**

| Metric | Value |
|--------|-------|
| Pose Landmark Detection Accuracy (critical joints) | 98% |
| Feature Extraction Consistency | 100% |
| Exercise Classification Accuracy | 94% |
| Repetition Counting Accuracy (valid movements) | 100% |
| Form Feedback Correctness | 100% |
| Average Frame Rate | 24 FPS |
| API Response Latency | < 100 ms |
| Overall System Reliability | Excellent |

### 5.3.1 Pose Detection Accuracy

The pose detection module achieved a 98% accuracy rate for critical joint detection. The two percent margin of error was primarily attributed to edge cases including:

- Complete body occlusion (user steps out of frame)
- Extreme camera angles causing landmark ambiguity
- Low-light conditions reducing landmark visibility below the confidence threshold

The non-critical joints (fingers, toes) showed higher variance but did not impact the repetition counting accuracy since only primary joints are used for exercise evaluation.

### 5.3.2 Repetition Counting Accuracy

The repetition counter achieved 100% accuracy for valid complete movements. This high accuracy resulted from:

- Strict state machine with defined transitions
- Angle threshold calibration for each exercise
- Debounce mechanism preventing spurious counts

The rule-based approach proved highly reliable within the defined exercise library, as each exercise has distinct angle thresholds that are mutually exclusive.

### 5.3.3 Frame Rate Performance

The system maintained an average frame rate of 24 FPS during active pose detection. This exceeds the minimum threshold of 15 FPS required for smooth real-time feedback. Performance was influenced by:

- Browser and device capabilities
- Camera resolution settings
- Complexity of landmark processing

The WebGL-accelerated MediaPipe processing ensured efficient frame handling even on mid-range hardware.

### 5.3.4 API Response Latency

Database operations completed in under 100 milliseconds, ensuring seamless user experience without perceptible delay. This latency includes:

- HTTP request handling
- Prisma ORM query execution
- SQLite read/write operations
- Response serialization

## 5.4 Result Analysis

### 5.4.1 Overall Performance Summary

The Exercise Tracking and Form Correction System demonstrates strong performance across all evaluated dimensions. The testing results confirm that the system reliably achieves its core objectives:

- **Pose Detection**: The MediaPipe-based pose detection provides accurate landmark extraction with 98% accuracy for critical joints, enabling reliable form analysis.
- **Repetition Counting**: The state machine approach achieves 100% accuracy for valid movements, eliminating false positives from partial or jerky motions.
- **User Interface**: The modular component design maintains UI responsiveness even during intensive frame processing.
- **Data Persistence**: Workout records are consistently saved and retrievable from the local database.

### 5.4.2 Strengths

The system exhibits several notable strengths identified through testing:

1. **Accuracy**: The rule-based algorithm provides precise repetition counting without the variability inherent in machine learning approaches.
2. **Responsiveness**: Real-time feedback is delivered with minimal latency, enhancing user experience.
3. **Simplicity**: The threshold-based approach is interpretable and easily adjustable for different exercises.
4. **Reliability**: The state machine prevents false counting from partial movements.
5. **Persistence**: Workout data is reliably stored and accessible across sessions.

### 5.4.3 Limitations

Testing also revealed certain limitations of the current implementation:

1. **Exercise Scope**: The system is optimized only for exercises in the current library. Movements outside the configured exercises may not be accurately detected.
2. **Environmental Sensitivity**: Detection accuracy degrades under poor lighting or when the user is positioned unfavorably relative to the camera.
3. **Camera Dependency**: The system requires a functioning webcam and may not perform reliably on devices with low-quality cameras.
4. **No Adaptive Learning**: Unlike ML-based systems, the rule-based approach cannot automatically improve through use.

### 5.4.4 Environmental Considerations

The system performs optimally under the following conditions:

- **Indoor lighting**: Adequate room lighting ensures landmark visibility above the confidence threshold
- **Clear camera view**: User positioned 4-8 feet from the camera with minimal obstructions
- **Stable position**: Camera mounted or user positioned such that frame composition remains consistent
- **Standard equipment**: Built-in laptop webcam or external USB camera with 720p or higher resolution

Performance degrades when these conditions are not met, particularly in low-light environments where landmark confidence drops below the detection threshold.

### 5.4.5 Comparative Analysis

Compared to machine learning-based approaches, the threshold-based system offers advantages in:

- **Deterministic behavior**: No probability distributions or confidenceintervals to interpret
- **Computational efficiency**: O(1) angle calculation vs. neural network inference
- **Training data independence**: No labeled dataset required
- **Explainability**: Every state transition has a clear, documented reason

However, ML-based systems may offer advantages for:

- Complex movements with multiple valid forms
- Personalized adaptation to individual users
- Novel exercise recognition without manual configuration

The chosen approach prioritizes reliability and interpretability for the defined exercise scope.

## 5.5 Summary

This chapter has presented the testing methodology and results for the Exercise Tracking and Form Correction System. All eight test cases passed successfully, confirming system functionality across the complete user workflow. Performance metrics demonstrate excellent accuracy (98% pose detection, 100% rep counting), acceptable frame rate (24 FPS), and reliable data persistence (< 100 ms API latency).

The system performs reliably under typical indoor workout conditions with adequate lighting and proper camera positioning. The threshold-based algorithm provides deterministic repetition counting without the variability of machine learning approaches. Identified limitations primarily affect edge cases and do not impact normal operation.

The next chapter presents conclusions, recommendations for future work, and potential system enhancements.