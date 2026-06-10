import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VolunteerProfile from '@/models/VolunteerProfile';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await VolunteerProfile.findOne({ userId: payload.userId });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Get Volunteer Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isOnline, latitude, longitude } = await req.json();

    const updateData: any = {};
    if (isOnline !== undefined) {
      updateData.isOnline = isOnline;
    }
    if (latitude !== undefined && longitude !== undefined) {
      updateData.currentLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    const profile = await VolunteerProfile.findOneAndUpdate(
      { userId: payload.userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'Volunteer status updated successfully', profile });
  } catch (error: any) {
    console.error('Update Volunteer Status Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
