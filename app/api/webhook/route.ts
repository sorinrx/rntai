import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '../../../zadarma/zadarma_express_handler';
require('dotenv').config();

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');
    let bodyData;

    if (!req || !req.headers) {
      console.error('Request headers are missing or undefined.');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (contentType && contentType.includes('application/json')) {
      bodyData = await req.json();
    } else {
      // Handle application/x-www-form-urlencoded or other content types if necessary
      const formData = await req.formData();
      bodyData = Object.fromEntries(formData.entries());
    }

    console.log('Parsed body data:', bodyData);

    const { event, signature } = bodyData;

    if (handlers[event]) {
      const result = await handlers[event](bodyData, signature);
      console.log(`Zadarma notification handled successfully: ${JSON.stringify(result, null, 2)}`);
      return NextResponse.json(result, { status: 200 });
    } else {
      console.warn(`No handler found for event: ${event}`);
      return NextResponse.json({ error: `Handler for event not found: ${event}` }, { status: 404 });
    }
  } catch (error) {
    console.error('Error handling event:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
