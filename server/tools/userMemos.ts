import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export interface UserMemoPayload {
  title: string;
  content: string;
}

export const createListUserMemoTitlesTool = (userMemos: UserMemoPayload[]) => {
  return new FunctionTool({
    name: 'listUserMemoTitles',
    description: 'Get a list of all available user memo titles. Use this first to see what memos are available for you to read.',
    parameters: z.object({}),
    execute: async () => {
      console.log(`[Backend] Executing listUserMemoTitles tool.`);
      if (!userMemos || userMemos.length === 0) {
        return { titles: [], message: 'No memos available.' };
      }
      return { titles: userMemos.map(m => m.title) };
    },
  });
};

export const createReadUserMemoTool = (userMemos: UserMemoPayload[]) => {
  return new FunctionTool({
    name: 'readUserMemo',
    description: 'Read the contents of a specific user memo by its title. Use listUserMemoTitles first to get valid titles.',
    parameters: z.object({
      title: z.string().describe('The title of the memo to read.')
    }),
    execute: async ({ title }) => {
      console.log(`[Backend] Executing readUserMemo tool for title: ${title}`);
      if (!userMemos || userMemos.length === 0) {
        return { error: 'No memos available.' };
      }
      const memo = userMemos.find(m => m.title === title);
      if (memo) {
        return { content: memo.content };
      }
      return { error: `Memo with title '${title}' not found.` };
    },
  });
};
