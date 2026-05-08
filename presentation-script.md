# FitRep – AI Tracker: Presentation Script

---

## Slide 1: Title Slide

"Good morning/afternoon everyone. I am [Name] from B.Tech AI & ML, and today I will be presenting our project **FitRep – AI Tracker**, an AI-based exercise tracking and rep counting system."

---

## Slide 2: Introduction

"Artificial Intelligence and Computer Vision have transformed many industries, and fitness is no exception. Traditional workout monitoring often requires human trainers or expensive wearable devices. Our project addresses this by providing a low-cost, webcam-based solution that can detect exercises, count repetitions, and provide real-time posture feedback — all running directly in a web browser."

---

## Slide 3: Problem Statement

"Let's consider the problems we aimed to solve:

- Users often perform exercises without proper supervision
- Manual rep counting is time-consuming and inconsistent
- Wearable devices add cost and complexity
- Many existing solutions require expensive equipment

Our goal was to create an accessible, camera-based system that could track workouts accurately and provide feedback without any additional hardware beyond a standard webcam."

---

## Slide 4: Project Objectives

"Our project objectives were:

1. Detect human body landmarks in real time using a standard webcam
2. Support multiple exercises through configurable angle-based logic
3. Count repetitions using a reliable state-machine approach
4. Provide posture and form feedback during exercise
5. Store workout sessions and provide progress analytics
6. Offer a responsive and user-friendly interface"

---

## Slide 5: System Architecture

"Here's how our system works:

**The User Interface Layer** includes exercise selection, workout interface, workout summary, and progress analytics.

**The Real-Time Processing Layer** takes webcam frames, passes them through MediaPipe Pose to detect 33 body landmarks, computes joint angles, and uses a state-machine to count repetitions and generate posture feedback.

**The Data Persistence Layer** uses Prisma ORM with SQLite to store workout records, history, and analytics.

The entire pipeline runs at approximately 24 FPS on standard hardware."

---

## Slide 6: Technologies Used

"Our tech stack includes:

- **Next.js** — Application framework
- **React + TypeScript** — Component logic
- **Tailwind CSS + Framer Motion** — Styling and animations
- **MediaPipe Pose** — Computer vision for landmark detection
- **Prisma + SQLite** — Database for workout storage
- **Lucide React + Sonner** — Icons and notifications"

---

## Slide 7: Key Features

"Our application offers:

- **10 Supported Exercises** — Push-ups, squats, lunges, bicep curls, shoulder presses, lateral raises, tricep extensions, front raises, wall sits, and jumping jacks

- **Real-time Pose Detection** — 33 body landmarks detected at 24+ FPS

- **State-based Rep Counting** — Repetitions counted only on valid movement cycles to avoid false increments

- **Posture Feedback** — Real-time guidance like 'keep back straight' or 'go deeper'

- **Workout History** — Save, view, delete, and export workout records

- **Progress Analytics** — Weekly activity, personal records, streaks, and session summaries"

---

## Slide 8: Demo / Working

"If I may demonstrate the application:

1. **Exercise Selection** — User browses and selects an exercise
2. **Webcam Initialization** — Camera activates and loads pose detection model
3. **Live Tracking** — Body landmarks appear as a skeleton overlay on screen
4. **Rep Counting** — As the user exercises, reps are counted automatically
5. **Posture Feedback** — Warnings appear if form needs correction
6. **Set Management** — Users can pause, rest, and complete sets
7. **Workout Summary** — After saving, users see total reps, duration, calories, and form score
8. **History & Analytics** — Past workouts can be reviewed or exported as JSON"

---

## Slide 9: Results & Accuracy

"Our testing results showed:

- Pose Landmark Detection Accuracy: **98%**
- Repetition Counting Accuracy: **100%** (no false increments)
- Form Feedback Correctness: **100%**
- Average Frame Rate: **24 FPS**
- API Response Latency: **<100 ms**

The system performs best under proper indoor lighting and clear camera framing."

---

## Slide 10: Challenges Faced

"Some challenges we encountered during development:

- Ensuring reliable pose detection under varying lighting conditions
- Reducing false rep counts from partial or incomplete movements
- Keeping the UI responsive while processing video frames in real time
- Handling browser permissions and model loading states
- Maintaining consistent workout data in the local database"

---

## Slide 11: Future Scope

"Looking ahead, we plan to:

- Add more exercises and advanced motion templates
- Improve posture analysis with richer biomechanical feedback
- Introduce user accounts and personalized workout goals
- Add cloud sync for workout history across devices
- Build a mobile-friendly PWA version
- Include voice feedback and accessibility features"

---

## Slide 12: Conclusion

"To conclude, FitRep – AI Tracker demonstrates how computer vision can be applied to fitness monitoring. By combining webcam-based pose detection with rule-based rep counting, we've created an accessible workout companion that provides accurate tracking, real-time feedback, and persistent workout history — all without any expensive equipment.

Thank you. I welcome any questions."

---

## Tips for Delivery

- **Timing**: This script is designed for approximately 8-10 minutes
- **Pacing**: Pause at key moments to let the audience absorb diagrams
- **Confidence**: Practice the demo flow beforehand so you can speak naturally while showing the app
- **Engagement**: Ask rhetorical questions like "Have you ever lost track of your reps during a workout?" to connect with the audience