import express from 'express';
import cors from 'cors';
import { LlmAgent, Runner, InMemorySessionService, InMemoryArtifactService, InMemoryMemoryService } from '@google/adk';

const globalSessionService = new InMemorySessionService();
const globalArtifactService = new InMemoryArtifactService();
const globalMemoryService = new InMemoryMemoryService();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Expose a simple health check or base endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Primary chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, apiKey, sessionId, instruction, model } = req.body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API key is required and must be provided.' });
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required.' });
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

    console.log(`[Backend] Initializing LlmAgent with model: ${selectedModel}`);
    
    // Instantiate LlmAgent
    const agent = new LlmAgent({
      name: 'SolidChatAgent',
      model: selectedModel,
      instruction: systemInstruction,
    });

    // Create Runner
    const runner = new Runner({
      appName: 'SolidChatApp',
      agent,
      sessionService: globalSessionService,
      artifactService: globalArtifactService,
      memoryService: globalMemoryService
    });

    const activeSessionId = sessionId && typeof sessionId === 'string' && sessionId.trim() !== ''
      ? sessionId.trim()
      : 'default-session';

    // Create session if it doesn't exist
    let session = await runner.sessionService.getSession({
      appName: 'SolidChatApp',
      userId: 'solid-user',
      sessionId: activeSessionId
    });

    if (!session) {
      session = await runner.sessionService.createSession({
        appName: 'SolidChatApp',
        userId: 'solid-user',
        sessionId: activeSessionId
      });
      console.log(`[Backend] Created new session: ${session.id}`);
    } else {
      console.log(`[Backend] Found existing session: ${session.id}`);
    }

    const sessId = session ? session.id : activeSessionId;

    console.log(`[Backend] Prompting agent: "${message.substring(0, 30)}..." in session: ${sessId}`);

    // Call runner.runAsync
    const stream = runner.runAsync({
      userId: 'solid-user',
      sessionId: sessId,
      newMessage: {
        role: 'user',
        parts: [{ text: message }]
      }
    });

    let responseText = '';
    
    for await (const event of stream) {
      console.log('[Backend] Event received:', JSON.stringify(event).substring(0, 150));
      
      // Extract text from the event
      if (event && typeof event === 'object') {
        // Handle content part array
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
        
        // Alternative field check
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

    // Return the response details
    res.json({
      response: responseText,
      sessionId: sessId,
      model: selectedModel,
      instruction: systemInstruction
    });

  } catch (error: any) {
    console.error('[Backend] Error while processing chat query:', error);
    res.status(500).json({
      error: error.message || 'An error occurred during agent execution. Please check your API key and network connection.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Backend] Express server listening on http://localhost:${PORT}`);
});
