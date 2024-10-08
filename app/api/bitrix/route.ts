import { NextResponse } from 'next/server';
import { addLead, checkAndAddMeeting } from '../../utils/bitrix';

export async function POST(request: Request) {
  const { action, data } = await request.json();
  console.log('Incoming request:', action, data);

  try {
    let response;
    if (action === 'bitrix_add_lead') {
      response = await addLead(data);
    } else if (action === 'bitrix_add_meeting') {
      response = await checkAndAddMeeting(data);
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    console.log('Response:', response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}