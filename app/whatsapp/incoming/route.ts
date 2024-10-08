import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req: Request) {
  const body = await req.formData();
  const messageSid = body.get('MessageSid');
  const from = body.get('From');
  const to = body.get('To');
  const messageBody = body.get('Body');

  console.log(`Received message from ${from} to ${to}: ${messageBody}`);

  // Aici poți adăuga logica pentru procesarea mesajului primit

  return NextResponse.json({ success: true });
}