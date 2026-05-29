import { createListUserMemoTitlesTool, createReadUserMemoTool, createSaveUserMemoTool } from './userMemos';
import { createTavilySearchTool } from './tavilySearch';
import { FunctionTool } from '@google/adk';

export interface GetToolsOptions {
  tavilyApiKey?: string;
  owner?: string;
  allowedAudiences?: string[];
  activePersonaName?: string;
  agentName?: string;
}

export const getAvailableTools = (options: GetToolsOptions): FunctionTool[] => {
  const tools: FunctionTool[] = [];
  const owner = options.owner || 'admin';
  const allowedAudiences = options.allowedAudiences || [];
  const activePersonaName = options.activePersonaName;
  const agentName = options.agentName;

  // Register SQLite-based user memos tools
  tools.push(createListUserMemoTitlesTool(owner, allowedAudiences, activePersonaName, agentName));
  tools.push(createReadUserMemoTool(owner, allowedAudiences, activePersonaName, agentName));
  tools.push(createSaveUserMemoTool(owner, allowedAudiences, activePersonaName, agentName));
  console.log(`[Backend] Registered SQLite user memo tools for owner: ${owner}, activePersonaName: ${activePersonaName}, agentName: ${agentName}`);

  if (options.tavilyApiKey && options.tavilyApiKey.trim() !== '') {
    tools.push(createTavilySearchTool(options.tavilyApiKey));
    console.log(`[Backend] Registered Tavily search tool.`);
  }

  return tools;
};
