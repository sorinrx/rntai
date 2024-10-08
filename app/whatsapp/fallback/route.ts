import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.formData();
  console.log('Fallback triggered:', body);

  // Aici poți adăuga logica pentru gestionarea fallback-ului

  return NextResponse.json({ success: true });
}   