import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VolunteerProfile from '@/models/VolunteerProfile';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const targetRole = role === 'VOLUNTEER' ? 'VOLUNTEER' : 'USER';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: targetRole,
    });

    if (targetRole === 'VOLUNTEER') {
      await VolunteerProfile.create({
        userId: user._id,
        isOnline: false,
        isVerified: false,
        currentLocation: {
          type: 'Point',
          coordinates: [0, 0],
        },
      });
    }

    return NextResponse.json({ message: 'User registered successfully', userId: user._id }, { status: 201 });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
