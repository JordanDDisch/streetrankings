import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const streetrankings = await db('streetrankings').select('*');
    return NextResponse.json({ streetrankings });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch streetrankings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [user] = await db('users').insert(body).returning('*');
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 