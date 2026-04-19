import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
// Initialize the Google Generative AI with API Key from environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_if_not_set');

export async function POST(req: Request) {
  try {
    const { message, history, sessionId, fileContext, workflowTitle } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let chatSessionId = sessionId;
    if (!chatSessionId) {
      const { data: newSession, error: createError } = await supabase
        .from('ChatSession')
        .insert({
          id: crypto.randomUUID(),
          title: workflowTitle || 'General Strategy Session',
          category: workflowTitle ? 'Workflow' : 'General'
        })
        .select()
        .single();
        
      if (createError) throw createError;
      chatSessionId = newSession.id;
    } else if (workflowTitle) {
      const { error: updateError } = await supabase
        .from('ChatSession')
        .update({ title: workflowTitle })
        .eq('id', chatSessionId);
        
      if (updateError) throw updateError;
    }

    const compiledUserMessage = fileContext 
      ? `=== ATTACHED CONTEXT FILE ===\n${fileContext}\n=============================\n\nMy Query:\n${message}` 
      : message;

    // Persist user's message
    const { error: msgErr1 } = await supabase
      .from('ChatMessage')
      .insert({
        id: crypto.randomUUID(),
        sessionId: chatSessionId,
        role: 'user',
        content: compiledUserMessage
      });
      
    if (msgErr1) throw msgErr1;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        reply: "GEMINI_API_KEY is missing. Mock response.",
        sessionId: chatSessionId
      });
    }

    // Select the model
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    let systemBase = "SYSTEM PROMPT: You are a senior business strategy consultant. IMPORTANT: Provide concise, resourceful answers broken into readable blocks.";
    if (workflowTitle) {
      systemBase += ` The user has selected the specific workflow template: "${workflowTitle}". Please focus your strategy entirely around this discipline.`;
    }

    const systemPromptMessage = {
      role: 'user',
      parts: [{ text: systemBase }]
    };
    
    // Map existing history to Gemini structured format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Generate response using a chat session to keep context
    const aiChatSession = model.startChat({
        history: [systemPromptMessage, ...formattedHistory]
    });

    const result = await aiChatSession.sendMessage(compiledUserMessage);
    const response = await result.response;
    const text = response.text();

    const { error: msgErr2 } = await supabase
      .from('ChatMessage')
      .insert({
        id: crypto.randomUUID(),
        sessionId: chatSessionId,
        role: 'assistant',
        content: text
      });
      
    if (msgErr2) throw msgErr2;

    return NextResponse.json({ reply: text, sessionId: chatSessionId, newTodos: [] });

  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: 'An error occurred while communicating with the AI service.', details: error.message }, 
      { status: 500 }
    );
  }
}
