import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cui = searchParams.get('cui');
    const tip = searchParams.get('tip') || '0'; // Default la '0' dacă nu este specificat

    console.log('Received request to /api/termene');
    console.log('CUI received:', cui);

    const username = process.env.TERMENE_USERNAME;
    const password = process.env.TERMENE_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing environment variables');
    }

    const apiUrl = `https://termene.ro/api/dateFirmaSumar.php?cui=${cui}&tip=${tip}`;

    console.log('Making request to Termene API');
    const response = await axios.get(apiUrl, {
      auth: {
        username: username,
        password: password
      }
    });

    console.log('Received response from Termene API');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Verifică limitele de rată din headers
    const rateLimit = response.headers['x-ratelimit-limit'];
    const rateRemaining = response.headers['x-ratelimit-remaining'];
    const rateReset = response.headers['x-ratelimit-reset'];

    console.log('Rate limit:', rateLimit);
    console.log('Rate remaining:', rateRemaining);
    console.log('Rate reset:', rateReset);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in Termene API route:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);

      // Gestionarea codurilor de eroare specifice
      if (error.response.status === 400) {
        return NextResponse.json({ error: 'Date greșite' }, { status: 400 });
      } else if (error.response.status === 401) {
        return NextResponse.json({ error: 'Acces neautorizat' }, { status: 401 });
      } else if (error.response.status === 429) {
        return NextResponse.json({ error: 'Prea multe interogări' }, { status: 429 });
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return NextResponse.json({ error: 'Eroare la obținerea datelor', details: error.message }, { status: 500 });
  }
}