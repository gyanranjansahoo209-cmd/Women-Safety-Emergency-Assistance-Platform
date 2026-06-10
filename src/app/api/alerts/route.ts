import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/models/Alert';
import VolunteerProfile from '@/models/VolunteerProfile';
import AlertResponder from '@/models/AlertResponder';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude } = await req.json();
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // First check if there is an active alert for this user to prevent duplicates
    const activeAlert = await Alert.findOne({
      userId: payload.userId,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (activeAlert) {
      return NextResponse.json({
        message: 'An active alert already exists.',
        alert: activeAlert,
      });
    }

    const alert = await Alert.create({
      userId: payload.userId,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      status: 'PENDING',
    });

    // Query online & verified volunteers within 5km
    const radiusInKm = 5;
    const radiusInRadians = radiusInKm / 6378.1;
    const nearbyVolunteers = await VolunteerProfile.find({
      isOnline: true,
      isVerified: true,
      currentLocation: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
    }).populate('userId', 'name phone');

    // Create notifier entries for nearby volunteers so they see the alert as "notified"
    try {
      await Promise.all(
        nearbyVolunteers.map(async (vp: any) => {
          // upsert a NOTIFIED responder record if one doesn't already exist
          await AlertResponder.findOneAndUpdate(
            { alertId: alert._id, responderId: vp.userId._id },
            { $setOnInsert: { status: 'NOTIFIED' } },
            { upsert: true, new: true }
          );
        })
      );
    } catch (e) {
      console.error('Failed to create notifier entries', e);
    }

    return NextResponse.json({
      message: 'SOS Alert triggered successfully',
      alert,
      notifiedVolunteersCount: nearbyVolunteers.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Trigger Alert Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'active', 'history'

    if (payload.role === 'ADMIN') {
      const query = filter === 'active' ? { status: { $in: ['PENDING', 'ACCEPTED'] } } : {};
      const alerts = await Alert.find(query)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });
      return NextResponse.json({ alerts });
    }

    if (payload.role === 'VOLUNTEER') {
      // 1. Get alerts the volunteer is actively responding to
      const activeResponses = await AlertResponder.find({
        responderId: payload.userId,
        status: { $in: ['NOTIFIED', 'ACCEPTED', 'DISPATCHED', 'ARRIVED'] },
      }).select('alertId');
      
      const activeAlertIds = activeResponses.map(r => r.alertId);
      
      // 2. Fetch volunteer's profile to get their location
      const profile = await VolunteerProfile.findOne({ userId: payload.userId });
      
      let nearbyAlerts: any[] = [];
      if (profile && profile.isOnline) {
        const [lng, lat] = profile.currentLocation.coordinates;
        // Search pending alerts within 15km
        const radiusInKm = 15;
        const radiusInRadians = radiusInKm / 6378.1;
        nearbyAlerts = await Alert.find({
          status: 'PENDING',
          location: {
            $geoWithin: {
              $centerSphere: [[lng, lat], radiusInRadians],
            },
          },
        }).populate('userId', 'name phone');
      }

      let assignedAlerts = [];
      if (activeAlertIds.length > 0) {
        assignedAlerts = await Alert.find({ _id: { $in: activeAlertIds } }).populate('userId', 'name phone');

        // attach responder status for this volunteer
        const responderRecords = await AlertResponder.find({ alertId: { $in: activeAlertIds }, responderId: payload.userId });
        const responderMap: Record<string, any> = {};
        responderRecords.forEach((r: any) => { responderMap[r.alertId.toString()] = r; });

        assignedAlerts = assignedAlerts.map((a: any) => {
          const r = responderMap[a._id.toString()];
          return { ...a.toObject(), responderStatus: r ? r.status : null };
        });
      }

      return NextResponse.json({
        nearbyAlerts,
        assignedAlerts,
      });
    }

    // For USER role:
    const query = filter === 'active' 
      ? { userId: payload.userId, status: { $in: ['PENDING', 'ACCEPTED'] } }
      : { userId: payload.userId };

    const alerts = await Alert.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('Get Alerts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
