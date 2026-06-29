import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Validasi token rahasia dari Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

    if (!SUPABASE_URL || !API_KEY) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    // 2. Ambil data dari salah satu tabel Anda untuk membangunkan database
    // Ganti 'nama_tabel' dengan nama tabel asli di database Anda
    const res = await fetch(`${SUPABASE_URL}/rest/v1/nama_tabel?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Ping failed to Supabase' }, { status: res.status });
    }

    return NextResponse.json({ message: 'Supabase successfully awakened!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}
