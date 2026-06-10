import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VolunteerProfile from '@/models/VolunteerProfile';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const volunteers = await User.find({ role: 'VOLUNTEER' }).select('-password').lean();
    const profiles = await VolunteerProfile.find({}).lean();
    
    const volunteerList = volunteers.map((v) => {
      const profile = profiles.find((p) => p.userId.toString() === v._id.toString());
      return {
        ...v,
        profile: profile || null,
      };
    });

    return NextResponse.json({ volunteers: volunteerList });
  } catch (error: any) {
    console.error('Admin Get Volunteers Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, isVerified } = await req.json();
    if (!userId || isVerified === undefined) {
      return NextResponse.json({ error: 'User ID and isVerified status are required' }, { status: 400 });
    }

    const profile = await VolunteerProfile.findOneAndUpdate(
      { userId },
      { $set: { isVerified } },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Volunteer verification status updated successfully', profile });
  } catch (error: any) {
    console.error('Admin Verify Volunteer Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
