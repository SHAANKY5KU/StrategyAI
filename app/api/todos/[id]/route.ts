import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { completed } = await req.json();
    const todo = await prisma.todoItem.update({
      where: { id: params.id },
      data: { completed }
    });
    return NextResponse.json({ todo });
  } catch (error: any) {
    console.error("Error updating todo:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
