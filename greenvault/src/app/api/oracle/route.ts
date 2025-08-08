// src/app/api/oracle/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Call Oasis API
  const oasisRes = await fetch('https://oasis-api.example.com/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await oasisRes.json();
  return NextResponse.json(data);
}