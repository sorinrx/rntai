import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const url = 'https://www.bnr.ro/nbrfxrates.xml';

  try {
    const response = await axios.get(url);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
  }
}
