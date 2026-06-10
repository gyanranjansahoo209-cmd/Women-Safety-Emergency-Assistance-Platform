import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/models/Alert';
import AlertResponder from '@/models/AlertResponder';
import VolunteerProfile from '@/models/VolunteerProfile';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Unauthorized. Only volunteers can accept alerts.' }, { status: 401 });
    }

    const { id } = await params;

    const profile = await VolunteerProfile.findOne({ userId: payload.userId });
    if (!profile || !profile.isVerified) {
      return NextResponse.json({ error: 'Your volunteer profile must be verified by an admin before you can respond.' }, { status: 403 });
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (alert.status === 'RESOLVED' || alert.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Alert is already resolved or cancelled.' }, { status: 400 });
    }

    const existingResponder = await AlertResponder.findOne({ alertId: id, responderId: payload.userId });
    if (existingResponder) {
      if (existingResponder.status === 'NOTIFIED') {
        existingResponder.status = 'ACCEPTED';
        await existingResponder.save();

        if (alert.status === 'PENDING') {
          alert.status = 'ACCEPTED';
          await alert.save();
        }

        return NextResponse.json({ message: 'Alert accepted successfully', responder: existingResponder });
      }

      return NextResponse.json({ message: 'You have already accepted this alert', responder: existingResponder });
    }

    const responder = await AlertResponder.create({
      alertId: id,
      responderId: payload.userId,
      status: 'ACCEPTED',
    });

    if (alert.status === 'PENDING') {
      alert.status = 'ACCEPTED';
      await alert.save();
    }

    return NextResponse.json({
      message: 'Alert accepted successfully',
      responder,
    });
  } catch (error: any) {
    console.error('Accept Alert Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status || !['DISPATCHED', 'ARRIVED', 'RESOLVED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 });
    }

    const responder = await AlertResponder.findOne({ alertId: id, responderId: payload.userId });
    if (!responder) {
      return NextResponse.json({ error: 'No response log found for this volunteer.' }, { status: 404 });
    }

    responder.status = status;
    await responder.save();

    if (status === 'RESOLVED' || status === 'CANCELLED') {
      const alert = await Alert.findById(id);
      if (alert) {
        alert.status = status;
        await alert.save();
      }
    }

    return NextResponse.json({
      message: 'Response status updated successfully',
      responder,
    });
  } catch (error: any) {
    console.error('Update Response Status Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
