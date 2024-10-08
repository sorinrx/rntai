import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.formData();
  const messageSid = body.get('MessageSid');
  const messageStatus = body.get('MessageStatus');

  console.log(`Message ${messageSid} status: ${messageStatus}`);

  // Aici poți adăuga logica pentru gestionarea actualizărilor de status

  return NextResponse.json({ success: true });
}