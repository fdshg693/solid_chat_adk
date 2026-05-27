import { LlmAgent, Runner, InMemorySessionService, InMemoryArtifactService, InMemoryMemoryService } from '@google/adk';
import { getAvailableTools, type GetToolsOptions } from '../tools';

// Global services for ADK state
const globalSessionService = new InMemorySessionService();
const globalArtifactService = new InMemoryArtifactService();
const globalMemoryService = new InMemoryMemoryService();

export interface AgentRunOptions {
  message: string;
  sessionId: string;
  model: string;
  instruction: string;
  toolsOptions: GetToolsOptions;
}

export const runAgent = async (options: AgentRunOptions) => {
  const { message, sessionId, model, instruction, toolsOptions } = options;

  console.log(`[Backend] Initializing LlmAgent with model: ${model}`);
  
  const tools = getAvailableTools(toolsOptions);

  const agent = new LlmAgent({
    name: 'SolidChatAgent',
    model,
    instruction,
    tools: tools.length > 0 ? tools : undefined,
  });

  const runner = new Runner({
    appName: 'SolidChatApp',
    agent,
    sessionService: globalSessionService,
    artifactService: globalArtifactService,
    memoryService: globalMemoryService
  });

  // Create session if it doesn't exist
  let session = await runner.sessionService.getSession({
    appName: 'SolidChatApp',
    userId: 'solid-user',
    sessionId: sessionId
  });

  if (!session) {
    session = await runner.sessionService.createSession({
      appName: 'SolidChatApp',
      userId: 'solid-user',
      sessionId: sessionId
    });
    console.log(`[Backend] Created new session: ${session.id}`);
  } else {
    console.log(`[Backend] Found existing session: ${session.id}`);
  }

  const sessId = session ? session.id : sessionId;
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

  return { stream, sessId };
};
