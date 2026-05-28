import { createListUserMemoTitlesTool, createReadUserMemoTool, createSaveUserMemoTool } from './userMemos';
import { createTavilySearchTool } from './tavilySearch';
import { FunctionTool } from '@google/adk';

export interface GetToolsOptions {
  tavilyApiKey?: string;
  owner?: string;
}

export const getAvailableTools = (options: GetToolsOptions): FunctionTool[] => {
  const tools: FunctionTool[] = [];
  const owner = options.owner || 'admin';

  // Register SQLite-based user memos tools
  tools.push(createListUserMemoTitlesTool(owner));
  tools.push(createReadUserMemoTool(owner));
  tools.push(createSaveUserMemoTool(owner));
  console.log(`[Backend] Registered SQLite user memo tools for owner: ${owner}`);

  if (options.tavilyApiKey && options.tavilyApiKey.trim() !== '') {
    tools.push(createTavilySearchTool(options.tavilyApiKey));
    console.log(`[Backend] Registered Tavily search tool.`);
  }

  return tools;
};
