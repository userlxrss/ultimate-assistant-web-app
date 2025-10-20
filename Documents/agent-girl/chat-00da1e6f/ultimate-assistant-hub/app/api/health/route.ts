import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      integrations: {
        gmail: !!process.env.GMAIL_CLIENT_ID,
        googleCalendar: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
        googleContacts: !!process.env.GOOGLE_CONTACTS_API_KEY,
        motion: !!process.env.MOTION_API_KEY,
        openai: !!process.env.OPENAI_API_KEY
      },
      uptime: process.uptime()
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        database: 'disconnected'
      },
      { status: 503 }
    );
  }
}