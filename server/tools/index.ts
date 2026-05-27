import { createListUserMemoTitlesTool, createReadUserMemoTool, UserMemoPayload } from './userMemos';
import { createTavilySearchTool } from './tavilySearch';
import { FunctionTool } from '@google/adk';

export interface GetToolsOptions {
  userMemos?: UserMemoPayload[];
  tavilyApiKey?: string;
}

export const getAvailableTools = (options: GetToolsOptions): FunctionTool[] => {
  const tools: FunctionTool[] = [];

  if (options.userMemos && options.userMemos.length > 0) {
    tools.push(createListUserMemoTitlesTool(options.userMemos));
    tools.push(createReadUserMemoTool(options.userMemos));
    console.log(`[Backend] Registered listUserMemoTitles and readUserMemo tools.`);
  }

  if (options.tavilyApiKey && options.tavilyApiKey.trim() !== '') {
    tools.push(createTavilySearchTool(options.tavilyApiKey));
    console.log(`[Backend] Registered Tavily search tool.`);
  }

  return tools;
};
