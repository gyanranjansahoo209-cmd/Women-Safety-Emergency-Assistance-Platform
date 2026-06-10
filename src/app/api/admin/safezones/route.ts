import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SafeZone from '@/models/SafeZone';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const safeZones = await SafeZone.find({});
    return NextResponse.json({ safeZones });
  } catch (error: any) {
    console.error('Get SafeZones Error:', error);
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

    const { name, address, latitude, longitude, type, contactNumber } = await req.json();
    if (!name || latitude === undefined || longitude === undefined || !type) {
      return NextResponse.json({ error: 'Name, coordinates, and type are required' }, { status: 400 });
    }

    const safeZone = await SafeZone.create({
      name,
      address: address || '',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      type,
      contactNumber: contactNumber || '',
    });

    return NextResponse.json({ message: 'Safe Zone created successfully', safeZone }, { status: 201 });
  } catch (error: any) {
    console.error('Create SafeZone Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Safe Zone ID is required' }, { status: 400 });
    }

    const safeZone = await SafeZone.findByIdAndDelete(id);
    if (!safeZone) {
      return NextResponse.json({ error: 'Safe Zone not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Safe Zone deleted successfully' });
  } catch (error: any) {
    console.error('Delete SafeZone Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
