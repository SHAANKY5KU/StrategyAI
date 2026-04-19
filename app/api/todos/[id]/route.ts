import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { completed } = await req.json();
    const { data: todo, error } = await supabase
      .from('TodoItem')
      .update({ completed })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ todo });
  } catch (error: any) {
    console.error("Error updating todo:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
