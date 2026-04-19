import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data: session, error } = await supabase
      .from('ChatSession')
      .select('*, messages:ChatMessage(*), todos:TodoItem(*)')
      .eq('id', params.id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Sort related messages and todos ascending by createdAt to match Prisma behavior
    if (session.messages) {
      session.messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (session.todos) {
      session.todos.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
