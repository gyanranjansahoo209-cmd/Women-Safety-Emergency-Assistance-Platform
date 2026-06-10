import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Alert from '@/models/Alert';
import VolunteerProfile from '@/models/VolunteerProfile';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalUsers = await User.countDocuments({});
    const totalVictims = await User.countDocuments({ role: 'USER' });
    const totalVolunteers = await User.countDocuments({ role: 'VOLUNTEER' });

    const totalAlerts = await Alert.countDocuments({});
    const activeAlerts = await Alert.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED'] } });
    const resolvedAlerts = await Alert.countDocuments({ status: 'RESOLVED' });
    const cancelledAlerts = await Alert.countDocuments({ status: 'CANCELLED' });

    const pendingVolunteers = await VolunteerProfile.countDocuments({ isVerified: false });
    const verifiedVolunteers = await VolunteerProfile.countDocuments({ isVerified: true });

    return NextResponse.json({
      users: {
        total: totalUsers,
        victims: totalVictims,
        volunteers: totalVolunteers,
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
        resolved: resolvedAlerts,
        cancelled: cancelledAlerts,
      },
      volunteers: {
        pending: pendingVolunteers,
        verified: verifiedVolunteers,
      },
    });
  } catch (error: any) {
    console.error('Get Admin Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
