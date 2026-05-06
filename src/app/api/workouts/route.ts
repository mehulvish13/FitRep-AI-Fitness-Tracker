import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

// GET /api/workouts - Get all workouts for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const workouts = await db.workout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { exerciseId, exerciseName, totalReps, totalSets, duration, calories, setsData, avgFormScore } = body;

    const workout = await db.workout.create({
      data: {
        userId,
        exerciseId,
        exerciseName,
        totalReps: totalReps || 0,
        totalSets: totalSets || 0,
        duration: duration || 0,
        calories: calories || 0,
        setsData: setsData ? JSON.stringify(setsData) : '[]',
        avgFormScore: avgFormScore || 0,
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Failed to save workout:', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}

// DELETE /api/workouts - Delete a workout by id
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing workout id' }, { status: 400 });
    }

    await db.workout.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workout:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
}
