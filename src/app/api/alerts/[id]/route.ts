import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Alert from '@/models/Alert';
import AlertResponder from '@/models/AlertResponder';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const alert = await Alert.findById(id).populate('userId', 'name email phone');
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const responders = await AlertResponder.find({ alertId: id })
      .populate('responderId', 'name email phone')
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      alert,
      responders,
    });
  } catch (error: any) {
    console.error('Get Alert Details Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status || !['PENDING', 'ACCEPTED', 'RESOLVED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 });
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Authorization checks
    if (payload.role !== 'ADMIN' && alert.userId.toString() !== payload.userId) {
      if (status === 'RESOLVED' && payload.role === 'VOLUNTEER') {
        const assignment = await AlertResponder.findOne({ alertId: id, responderId: payload.userId });
        if (!assignment) {
          return NextResponse.json({ error: 'Forbidden. You are not assigned to this alert.' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    alert.status = status;
    await alert.save();

    if (status === 'RESOLVED' || status === 'CANCELLED') {
      await AlertResponder.updateMany(
        { alertId: id, status: { $in: ['ACCEPTED', 'DISPATCHED', 'ARRIVED'] } },
        { status: status === 'RESOLVED' ? 'RESOLVED' : 'CANCELLED' }
      );
    }

    return NextResponse.json({ message: 'Alert status updated successfully', alert });
  } catch (error: any) {
    console.error('Update Alert Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
