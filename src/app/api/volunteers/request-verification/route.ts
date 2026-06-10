import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VolunteerProfile from '@/models/VolunteerProfile';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await VolunteerProfile.findOne({ userId: payload.userId });
    if (!profile) {
      return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 404 });
    }

    if (profile.isVerified) {
      return NextResponse.json({ message: 'Already verified' });
    }

    profile.verificationRequested = true;
    await profile.save();

    return NextResponse.json({ message: 'Verification request submitted', profile });
  } catch (error: any) {
    console.error('Request Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
