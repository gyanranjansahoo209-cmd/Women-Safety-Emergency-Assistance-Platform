import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import VolunteerProfile from '@/models/VolunteerProfile';
import EmergencyContact from '@/models/EmergencyContact';
import SafeZone from '@/models/SafeZone';
import Alert from '@/models/Alert';
import AlertResponder from '@/models/AlertResponder';

export async function GET() {
  try {
    await dbConnect();

    // 1. Clear database
    await User.deleteMany({});
    await VolunteerProfile.deleteMany({});
    await EmergencyContact.deleteMany({});
    await SafeZone.deleteMany({});
    await Alert.deleteMany({});
    await AlertResponder.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 2. Create Users
    const adminUser = await User.create({
      name: 'Aura System Admin',
      email: 'admin@aura.org',
      password: hashedPassword,
      phone: '9999911111',
      role: 'ADMIN',
    });

    const normalUser = await User.create({
      name: 'Priya Sharma',
      email: 'user@aura.org',
      password: hashedPassword,
      phone: '9876543210',
      role: 'USER',
    });

    const verifiedVol = await User.create({
      name: 'Amit Patel (Verified Volunteer)',
      email: 'volunteer@aura.org',
      password: hashedPassword,
      phone: '8888877777',
      role: 'VOLUNTEER',
    });

    const pendingVol = await User.create({
      name: 'Neha Roy (Pending Volunteer)',
      email: 'volunteer2@aura.org',
      password: hashedPassword,
      phone: '7777766666',
      role: 'VOLUNTEER',
    });

    // 3. Create Volunteer Profiles
    // Amit is verified and is online near Delhi
    await VolunteerProfile.create({
      userId: verifiedVol._id,
      isOnline: true,
      isVerified: true,
      currentLocation: {
        type: 'Point',
        coordinates: [77.215, 28.618], // near Delhi center [lng, lat]
      },
    });

    // Neha is unverified and offline
    await VolunteerProfile.create({
      userId: pendingVol._id,
      isOnline: false,
      isVerified: false,
      currentLocation: {
        type: 'Point',
        coordinates: [77.200, 28.600],
      },
    });

    // 4. Create Emergency Contacts for Priya
    await EmergencyContact.create([
      {
        userId: normalUser._id,
        name: 'Rajesh Sharma',
        phone: '9811122233',
        relationship: 'Father',
        email: 'rajesh@example.com',
      },
      {
        userId: normalUser._id,
        name: 'Kiran Sharma',
        phone: '9811122244',
        relationship: 'Mother',
      },
    ]);

    // 5. Create Safe Zones
    await SafeZone.create([
      {
        name: 'Connaught Place Police HQ',
        address: 'Sansad Marg, Connaught Place, New Delhi',
        location: {
          type: 'Point',
          coordinates: [77.209, 28.614], // [lng, lat]
        },
        type: 'POLICE',
        contactNumber: '011-23340050',
      },
      {
        name: 'Ram Manohar Lohia Hospital',
        address: 'Baba Kharak Singh Marg, New Delhi',
        location: {
          type: 'Point',
          coordinates: [77.201, 28.624],
        },
        type: 'HOSPITAL',
        contactNumber: '011-23365550',
      },
      {
        name: 'Downtown Safe Sanctuary',
        address: 'Chanakyapuri, New Delhi',
        location: {
          type: 'Point',
          coordinates: [77.185, 28.595],
        },
        type: 'SAFE_HOUSE',
        contactNumber: '181',
      },
    ]);

    return NextResponse.json({
      message: 'Database cleared and successfully seeded with test data.',
      testAccounts: {
        admin: { email: 'admin@aura.org', password: 'password123', role: 'ADMIN' },
        victim: { email: 'user@aura.org', password: 'password123', role: 'USER' },
        verifiedVolunteer: { email: 'volunteer@aura.org', password: 'password123', role: 'VOLUNTEER' },
        pendingVolunteer: { email: 'volunteer2@aura.org', password: 'password123', role: 'VOLUNTEER' },
      },
    });
  } catch (error: any) {
    console.error('Seeding Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during database seed.' }, { status: 500 });
  }
}
