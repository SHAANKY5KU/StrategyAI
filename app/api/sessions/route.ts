import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { data: sessions, error } = await supabase
      .from('ChatSession')
      .select('*')
      .order('updatedAt', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
