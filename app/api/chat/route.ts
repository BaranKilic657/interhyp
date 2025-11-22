import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, screenshot, profile, stream = true } = await request.json();

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    console.log('Screenshot received:', screenshot ? 'Yes' : 'No');
    console.log('Profile snippet:', profile ? String(profile).slice(0, 200) : 'None');

    const conversationHistory = (messages || []).map((msg: { role: string; content: string }, index: number) => {
      const parts: any[] = [{ text: msg.content }];

      if (screenshot && index === messages.length - 1 && msg.role === 'user') {
        try {
          const base64Data = screenshot.includes(',') ? screenshot.split(',')[1] : screenshot;
          parts.push({
            inline_data: { mime_type: 'image/jpeg', data: base64Data },
          });
        } catch (e) {
          console.error('Error processing screenshot', e);
        }
      }

      return { role: msg.role === 'assistant' ? 'model' : 'user', parts };
    });

    const generateFallbackAdvice = (messages: any[], profile?: string) => {
      const prof = profile || '';
      const nums: Record<string, number> = {};
      try {
        const incomeMatch = prof.match(/€\s?([0-9,.]+)/);
        if (incomeMatch) nums.monthlyIncome = Number(incomeMatch[1].replace(/[,.]/g, ''));
        const savingsMatch = prof.match(/€([0-9,.]+) saved/);
        if (savingsMatch) nums.savings = Number(savingsMatch[1].replace(/[,.]/g, ''));
        const ageMatch = prof.match(/(\d{2}) years/);
        if (ageMatch) nums.age = Number(ageMatch[1]);
      } catch (e) {
        // ignore
      }

      const parts: string[] = [];
      parts.push('Kurzfassung:\n' + (prof ? `Profile: ${prof}` : 'Kein Profil sichtbar.') + '\n');
      parts.push('Empfohlene Finanzierungsoptionen:\n');
      parts.push('• 100% Finanzierung (wenn verfügbar) — Vorteil: geringe Anfangskosten. Nachteil: höhere Zinsen, strengere Konditionen.');
      parts.push('• 90% / 80% Finanzierung — Vorteil: bessere Zinssätze, geringeres Risiko. Nachteil: benötigt Eigenkapital.');
      parts.push('• Co-Ownership / family support — Vorteil: deutlich geringere persönliche Eigenmittel. Nachteil: vertragliche Abstimmung nötig.');

      parts.push('\nKonkrete Schritte:\n');
      if (nums.savings && nums.savings > 0) {
        parts.push(`1) Nutze vorhandene Ersparnisse (€${nums.savings.toLocaleString()}) zielgerichtet für Kaufnebenkosten oder Anzahlung.`);
      } else {
        parts.push('1) Starte ein konkretes Sparziel: berechne benötigte Eigenmittel (z.B. 10-20% des Zielpreises) und lege monatliche Sparraten fest.');
      }
      parts.push('2) Prüfe 100%/90% Angebote bei spezialisierten Anbietern und frage nach Programmen für junge Käufer oder spezielle Förderungen.');
      parts.push('3) Wenn Einkommen instabil ist: optimiere Unterlagen (Arbeitsvertrag, Steuerbescheide) und prüfe Bürgen oder Familienunterstützung.');
      parts.push('4) Sammle erforderliche Dokumente: Gehaltsnachweise, Kontoauszüge, Ausweis, ggf. Bürgschaftsvereinbarungen.');

      if (nums.monthlyIncome) {
        const affordability = Math.round((nums.monthlyIncome * 12) * 3.5);
        parts.push(`\nUngefähre Kaufkraft basierend auf Einkommen: ca. €${affordability.toLocaleString()} (Annahme: Faktor 3.5 des Jahresnettoeinkommens)\n`);
      }

      parts.push('\nNächste Schritte:\n• Vereinbare ein Gespräch mit einem Berater, bring die Dokumente mit.\n• Simuliere mehrere Szenarien (Eigenkapital, Familienbeteiligung, Finanzierungsmodelle).\n\nViel Erfolg — ich helfe gern beim Durchspielen von Szenarien.');
      return parts.join('\n');
    };

    if (!GOOGLE_API_KEY) {
      const fallback = generateFallbackAdvice(messages, profile);
      return NextResponse.json({ message: fallback });
    }

    // Prepare API request body
    const requestBody = {
      system_instruction: { parts: [{ text: `You are FutureGuide, a warm, knowledgeable AI companion helping people navigate their path to homeownership.\n\nYour personality:\n- Calm, concise, warm, and reassuring\n- Expertise-backed but approachable\n- Focus on practical, actionable advice\n- Supportive and motivating\n\nYour knowledge areas:\n- Home affordability calculations\n- Mortgage financing options\n- Timeline planning for home purchase\n- Impact of life decisions (career, location, family) on homeownership\n- Equity building strategies\n- Real estate market insights\n- Budget optimization\n\nWhen a screenshot is provided, analyze the visual content to give context-aware advice about the page the user is viewing.\n\nResponse format (prefer this structure):\n1) Short summary of user's situation (1-2 sentences).\n2) Recommended financing options with pros/cons (bullet list).\n3) Step-by-step action plan with timeline and concrete numbers where possible (3-6 steps).\n4) Quick next steps (links or resources if available) and what documents to prepare.\n5) A short reassuring closing sentence.\n\nIf the user has specific constraints (low savings, unstable employment, debt), prioritize practical workarounds such as shared ownership, family support, targeted programs, or staged purchases. Always include estimated numbers when possible and clearly state assumptions.` }] },
      contents: (profile ? [{ role: 'user', parts: [{ text: `User profile: ${profile}` }] }] : []).concat(conversationHistory),
      generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
    };

    // If streaming is enabled, use streamGenerateContent
    if (stream) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GOOGLE_API_KEY}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Google API error:', error);
        return NextResponse.json({ error: 'Failed to get AI response' }, { status: response.status });
      }

      // Create a streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.close();
            return;
          }

          try {
            let accumulatedText = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    
                    if (text) {
                      // Clean up formatting
                      const cleanedText = text
                        .replace(/\*\*/g, '')
                        .replace(/\* /g, '• ')
                        .replace(/\*/g, '');
                      
                      accumulatedText += cleanedText;
                      
                      // Send chunk to client
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: cleanedText })}\n\n`)
                      );
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: `You are FutureGuide, a warm, knowledgeable AI companion helping people navigate their path to homeownership.\n\nYour personality:\n- Calm, concise, warm, and reassuring\n- Expertise-backed but approachable\n- Focus on practical, actionable advice\n- Supportive and motivating\n\nYour knowledge areas:\n- Home affordability calculations\n- Mortgage financing options\n- Timeline planning for home purchase\n- Impact of life decisions (career, location, family) on homeownership\n- Equity building strategies\n- Real estate market insights\n- Budget optimization\n\nWhen a screenshot is provided, analyze the visual content to give context-aware advice about the page the user is viewing.\n\nResponse format (prefer this structure):\n1) Short summary of user's situation (1-2 sentences).\n2) Recommended financing options with pros/cons (bullet list).\n3) Step-by-step action plan with timeline and concrete numbers where possible (3-6 steps).\n4) Quick next steps (links or resources if available) and what documents to prepare.\n5) A short reassuring closing sentence.\n\nIf the user has specific constraints (low savings, unstable employment, debt), prioritize practical workarounds such as shared ownership, family support, targeted programs, or staged purchases. Always include estimated numbers when possible and clearly state assumptions.` }] },
          contents: (profile ? [{ role: 'user', parts: [{ text: `User profile: ${profile}` }] }] : []).concat(conversationHistory),
          generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google API error:', error);
      return NextResponse.json({ error: 'Failed to get AI response' }, { status: response.status });
    }

    const data = await response.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    aiMessage = aiMessage.replace(/\*\*/g, '').replace(/\* /g, '• ').replace(/\*/g, '').replace(/\n\n+/g, '\n\n').trim();

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
