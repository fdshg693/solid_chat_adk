import { createReadUserMemoTool } from './readUserMemo';
import { createTavilySearchTool } from './tavilySearch';
import { FunctionTool } from '@google/adk';

export interface GetToolsOptions {
  userMemo?: string;
  tavilyApiKey?: string;
}

export const getAvailableTools = (options: GetToolsOptions): FunctionTool[] => {
  const tools: FunctionTool[] = [];

  if (options.userMemo !== undefined) {
    tools.push(createReadUserMemoTool(options.userMemo));
    console.log(`[Backend] Registered readUserMemo tool.`);
  }

  if (options.tavilyApiKey && options.tavilyApiKey.trim() !== '') {
    tools.push(createTavilySearchTool(options.tavilyApiKey));
    console.log(`[Backend] Registered Tavily search tool.`);
  }

  return tools;
};
