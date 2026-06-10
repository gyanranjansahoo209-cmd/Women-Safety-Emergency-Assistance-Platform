import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EmergencyContact from '@/models/EmergencyContact';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contacts = await EmergencyContact.find({ userId: payload.userId });
    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error('Get Contacts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, relationship, email } = await req.json();
    if (!name || !phone || !relationship) {
      return NextResponse.json({ error: 'Name, phone, and relationship are required' }, { status: 400 });
    }

    const contact = await EmergencyContact.create({
      userId: payload.userId,
      name,
      phone,
      relationship,
      email: email || '',
    });

    return NextResponse.json({ message: 'Emergency contact added successfully', contact }, { status: 201 });
  } catch (error: any) {
    console.error('Create Contact Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const contact = await EmergencyContact.findOneAndDelete({ _id: id, userId: payload.userId });
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Emergency contact deleted successfully' });
  } catch (error: any) {
    console.error('Delete Contact Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
