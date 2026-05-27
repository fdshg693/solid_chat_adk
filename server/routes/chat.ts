import { Hono } from 'hono';
import { runAgent } from '../agent';
import { streamText } from 'hono/streaming';

const chatApp = new Hono();

chatApp.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { message, apiKey, tavilyApiKey, sessionId, instruction, model } = body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return c.json({ error: 'Gemini API key is required and must be provided.' }, 400);
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return c.json({ error: 'Message content is required.' }, 400);
  }

  // Dynamically set API key in environment variable for the duration of this request
  process.env.GEMINI_API_KEY = apiKey.trim();

  try {
    const systemInstruction = instruction && typeof instruction === 'string' && instruction.trim() !== ''
      ? instruction.trim()
      : 'You are a helpful and concise AI assistant. Address the user directly and clearly.';

    const selectedModel = model && typeof model === 'string' && model.trim() !== ''
      ? model.trim()
      : 'gemini-2.5-flash';

    const activeSessionId = sessionId && typeof sessionId === 'string' && sessionId.trim() !== ''
      ? sessionId.trim()
      : 'default-session';

    const { stream, sessId } = await runAgent({
      message,
      sessionId: activeSessionId,
      model: selectedModel,
      instruction: systemInstruction,
      toolsOptions: {
        tavilyApiKey
      }
    });

    let responseText = '';
    
    for await (const event of stream) {
      console.log('[Backend] Event received:', JSON.stringify(event).substring(0, 150));
      
      // Extract text from the event
      if (event && typeof event === 'object') {
        if ('content' in event && event.content && typeof event.content === 'object') {
          const content = event.content as any;
          if (Array.isArray(content.parts)) {
            for (const part of content.parts) {
              if (part && typeof part.text === 'string') {
                responseText += part.text;
              }
            }
          }
        }
        
        if ('text' in event && typeof (event as any).text === 'string') {
          responseText += (event as any).text;
        }
        
        if ('message' in event && typeof (event as any).message === 'string') {
          responseText += (event as any).message;
        }
      } else if (typeof event === 'string') {
        responseText += event;
      }
    }

    console.log(`[Backend] Completed agent response. Length: ${responseText.length} chars.`);

    return c.json({
      response: responseText,
      sessionId: sessId,
      model: selectedModel,
      instruction: systemInstruction
    });

  } catch (error: any) {
    console.error('[Backend] Error while processing chat query:', error);
    return c.json({
      error: error.message || 'An error occurred during agent execution. Please check your API key and network connection.'
    }, 500);
  }
});

export { chatApp };
