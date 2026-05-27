import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const createReadUserMemoTool = (userMemo?: string) => {
  return new FunctionTool({
    name: 'readUserMemo',
    description: 'Read the contents of the user\'s personal memo pad. Use this to retrieve any notes or information the user has jotted down for you to remember or reference.',
    parameters: z.object({}),
    execute: async () => {
      console.log(`[Backend] Executing readUserMemo tool.`);
      return { memo: userMemo || 'The memo is currently empty.' };
    },
  });
};
