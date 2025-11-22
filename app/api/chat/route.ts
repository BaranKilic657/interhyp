import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Build conversation history for Gemini
    const conversationHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `You are FutureGuide, a warm, knowledgeable AI companion helping people navigate their path to homeownership. 
            
Your personality:
- Calm, concise, warm, and reassuring
- Expertise-backed but approachable
- Focus on practical, actionable advice
- Supportive and motivating

Your knowledge areas:
- Home affordability calculations
- Mortgage financing options
- Timeline planning for home purchase
- Impact of life decisions (career, location, family) on homeownership
- Equity building strategies
- Real estate market insights
- Budget optimization

Keep responses conversational, helpful, and encouraging. Use emojis sparingly and naturally.`
            }]
          },
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google API error:', error);
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: response.status }
      );
    }

    const data = await response.json();
    let aiMessage = data.candidates[0].content.parts[0].text;

    // Clean up formatting: remove markdown asterisks and format bullets properly
    aiMessage = aiMessage
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\* /g, '• ') // Replace * bullets with •
      .replace(/\*/g, '') // Remove any remaining asterisks
      .replace(/• /g, '\n• ') // Add line break before each bullet
      .replace(/\n\n+/g, '\n\n') // Clean up multiple line breaks
      .trim();

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
