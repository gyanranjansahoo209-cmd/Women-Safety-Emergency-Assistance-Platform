import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VolunteerProfile from '@/models/VolunteerProfile';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenCookie = cookieHeader.split(';').find((c) => c.trim().startsWith('token='));
    const token = tokenCookie ? tokenCookie.trim().slice('token='.length) : null;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let volunteerProfile = null;
    if (user.role === 'VOLUNTEER') {
      volunteerProfile = await VolunteerProfile.findOne({ userId: user._id });
    }

    return NextResponse.json({
      user,
      volunteerProfile,
    });
  } catch (error: any) {
    console.error('Auth Me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
