import { NextResponse } from 'next/server';

export async function POST() {
  const res = await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
  }

  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
}
