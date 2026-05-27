import { createListUserMemoTitlesTool, createReadUserMemoTool, createSaveUserMemoTool } from './userMemos';
import { createTavilySearchTool } from './tavilySearch';
import { FunctionTool } from '@google/adk';

export interface GetToolsOptions {
  tavilyApiKey?: string;
}

export const getAvailableTools = (options: GetToolsOptions): FunctionTool[] => {
  const tools: FunctionTool[] = [];

  // Register SQLite-based user memos tools
  tools.push(createListUserMemoTitlesTool());
  tools.push(createReadUserMemoTool());
  tools.push(createSaveUserMemoTool());
  console.log(`[Backend] Registered SQLite user memo tools.`);

  if (options.tavilyApiKey && options.tavilyApiKey.trim() !== '') {
    tools.push(createTavilySearchTool(options.tavilyApiKey));
    console.log(`[Backend] Registered Tavily search tool.`);
  }

  return tools;
};
