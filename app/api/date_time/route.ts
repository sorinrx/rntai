import { NextResponse } from 'next/server';
import { getCurrentDateTime } from '../../utils/dateTime';

export async function GET() {
  try {
    const dateTime = getCurrentDateTime();
    return NextResponse.json(dateTime);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch current date and time' }, { status: 500 });
  }
} 