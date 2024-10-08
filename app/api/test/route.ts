import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '../../../zadarma/zadarma_express_handler';

export async function POST(req: NextRequest) {
  try {
    const bodyData = await req.json();
    const { event } = bodyData;
    console.log('Parsed body data:', bodyData);

    if (handlers[event] && typeof handlers[event] === 'function') {
      const result = await handlers[event](bodyData, req.headers.get('signature'));
      console.log('Zadarma notification handled successfully:', result);
      return NextResponse.json(result, { status: 200 });
    } else {
      console.error('Handler for event not found:', event);
      return NextResponse.json({ error: 'Event not supported' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}