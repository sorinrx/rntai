import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(req: Request) {
  const body = await req.formData();
  const message = body.get('Body')?.toString() || '';
  const from = body.get('From')?.toString() || '';

  console.log(`Received message: ${message} from ${from}`);

  try {
    await client.messages.create({
      body: `Am primit mesajul tău: "${message}". Voi răspunde în curând.`,
      from: 'whatsapp:+15556008949',
      to: from
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}