import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { getAllMemos, getMemoByTitle, saveMemo } from '../db';
import crypto from 'node:crypto';

export const createListUserMemoTitlesTool = () => {
  return new FunctionTool({
    name: 'listUserMemoTitles',
    description: 'Get a list of all available user memo titles. Use this first to see what memos are available for you to read.',
    parameters: z.object({}),
    execute: async () => {
      console.log(`[Backend] Executing listUserMemoTitles tool.`);
      const memos = getAllMemos();
      if (!memos || memos.length === 0) {
        return { titles: [], message: 'No memos available.' };
      }
      return { titles: memos.map(m => m.title) };
    },
  });
};

export const createReadUserMemoTool = () => {
  return new FunctionTool({
    name: 'readUserMemo',
    description: 'Read the contents of a specific user memo by its title. Use listUserMemoTitles first to get valid titles.',
    parameters: z.object({
      title: z.string().describe('The title of the memo to read.')
    }),
    execute: async ({ title }) => {
      console.log(`[Backend] Executing readUserMemo tool for title: ${title}`);
      const memo = getMemoByTitle(title);
      if (memo) {
        return { content: memo.content };
      }
      return { error: `Memo with title '${title}' not found.` };
    },
  });
};

export const createSaveUserMemoTool = () => {
  return new FunctionTool({
    name: 'saveUserMemo',
    description: 'Create a new memo or update an existing memo. If a memo with the title already exists, it will be updated with the new content.',
    parameters: z.object({
      title: z.string().describe('The title of the memo.'),
      content: z.string().describe('The content of the memo.')
    }),
    execute: async ({ title, content }) => {
      console.log(`[Backend] Executing saveUserMemo tool for title: ${title}`);
      const existing = getMemoByTitle(title);
      if (existing) {
        saveMemo({ ...existing, content });
        return { success: true, message: `Memo '${title}' updated.` };
      } else {
        const newMemo = {
          id: `memo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          title,
          content
        };
        saveMemo(newMemo);
        return { success: true, message: `Memo '${title}' created.` };
      }
    },
  });
};
