import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Revalidar cache da página principal
    revalidatePath('/');
    revalidatePath('/api/sheets');
    
    return NextResponse.json({ 
      revalidated: true, 
      time: new Date().toISOString() 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao revalidar cache' },
      { status: 500 }
    );
  }
}