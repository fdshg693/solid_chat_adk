import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { tavily } from '@tavily/core';

export const createTavilySearchTool = (tavilyApiKey: string) => {
  const tvly = tavily({ apiKey: tavilyApiKey.trim() });
  return new FunctionTool({
    name: 'tavilySearch',
    description: 'Search the web for up to date information using Tavily API. Use this tool when you need current events, recent data, or external knowledge not in your training data.',
    parameters: z.object({
      query: z.string().describe('The search query string'),
    }),
    execute: async (args: { query: string }) => {
      try {
        console.log(`[Backend] Executing web search for: "${args.query}"`);
        const searchResult = await tvly.search(args.query, {
          searchDepth: 'basic',
          maxResults: 5,
        });
        return searchResult;
      } catch (e: any) {
        console.error('[Backend] Tavily search error:', e);
        return { error: `Search failed: ${e.message}` };
      }
    },
  });
};
