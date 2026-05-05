import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/workouts - Get all workouts
export async function GET() {
  try {
    const workouts = await db.workout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

// POST /api/workouts - Save a new workout
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exerciseId, exerciseName, totalReps, totalSets, duration, calories, setsData } = body;

    const workout = await db.workout.create({
      data: {
        exerciseId,
        exerciseName,
        totalReps: totalReps || 0,
        totalSets: totalSets || 0,
        duration: duration || 0,
        calories: calories || 0,
        setsData: setsData ? JSON.stringify(setsData) : '[]',
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Failed to save workout:', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}
