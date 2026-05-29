import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { getMemosForAudiences, getMemoByTitleForAudiences, getMemoByTitle, saveMemo } from '../db';
import crypto from 'node:crypto';

const getAllowedTargets = (activePersonaName?: string, agentName?: string): string[] => {
  const allowed = new Set<string>();
  if (activePersonaName) allowed.add(activePersonaName);
  if (agentName) allowed.add(agentName);
  
  // Standard fallback names for the agent
  allowed.add('assistant');
  allowed.add('SolidChatAgent');
  allowed.add('Global Default');
  
  return Array.from(allowed);
};

export const createListUserMemoTitlesTool = (
  owner: string = 'admin',
  activePersonaName?: string,
  agentName?: string
) => {
  return new FunctionTool({
    name: 'listUserMemoTitles',
    description: 'Get a list of all available user memo titles. Use this first to see what memos are available for you to read.',
    parameters: z.object({}),
    execute: async () => {
      console.log(`[Backend] Executing listUserMemoTitles tool for owner: ${owner}, activePersona: ${activePersonaName}, agent: ${agentName}.`);
      
      const allowedTargets = getAllowedTargets(activePersonaName, agentName);
      const memos = getMemosForAudiences(owner, allowedTargets);
      
      if (!memos || memos.length === 0) {
        return { titles: [], message: 'No memos available for your audience.' };
      }

      return { titles: memos.map(m => m.title) };
    },
  });
};

export const createReadUserMemoTool = (
  owner: string = 'admin',
  activePersonaName?: string,
  agentName?: string
) => {
  return new FunctionTool({
    name: 'readUserMemo',
    description: 'Read the contents of a specific user memo by its title. Use listUserMemoTitles first to get valid titles.',
    parameters: z.object({
      title: z.string().describe('The title of the memo to read.')
    }),
    execute: async ({ title }) => {
      console.log(`[Backend] Executing readUserMemo tool for title: ${title}, owner: ${owner}, activePersona: ${activePersonaName}, agent: ${agentName}`);
      
      const allowedTargets = getAllowedTargets(activePersonaName, agentName);
      const memo = getMemoByTitleForAudiences(title, owner, allowedTargets);
      
      if (memo) {
        return { content: memo.content };
      }
      return { error: `Memo with title '${title}' not found or you do not have permission to read it.` };
    },
  });
};

export const createSaveUserMemoTool = (
  owner: string = 'admin',
  activePersonaName?: string,
  agentName?: string
) => {
  return new FunctionTool({
    name: 'saveUserMemo',
    description: 'Create a new memo or update an existing memo. If a memo with the title already exists, it will be updated with the new content.',
    parameters: z.object({
      title: z.string().describe('The title of the memo.'),
      content: z.string().describe('The content of the memo.')
    }),
    execute: async ({ title, content }) => {
      console.log(`[Backend] Executing saveUserMemo tool for title: ${title}, owner: ${owner}, activePersona: ${activePersonaName}, agent: ${agentName}`);
      
      // Get the existing memo by title without restrictions to see if we are updating
      const existing = getMemoByTitle(title, owner);
      
      const targetAudiences = new Set<string>();
      if (activePersonaName) targetAudiences.add(activePersonaName);
      if (agentName) targetAudiences.add(agentName);
      targetAudiences.add('assistant');

      if (existing) {
        // Keep existing audiences and add activePersona / agent if not present
        const updatedAudiences = existing.targetAudiences ? [...existing.targetAudiences] : [];
        if (activePersonaName && !updatedAudiences.includes(activePersonaName)) {
          updatedAudiences.push(activePersonaName);
        }
        if (agentName && !updatedAudiences.includes(agentName)) {
          updatedAudiences.push(agentName);
        }

        saveMemo({ 
          ...existing, 
          content,
          updater: agentName || 'assistant',
          targetAudiences: updatedAudiences
        }, owner);
        return { success: true, message: `Memo '${title}' updated.` };
      } else {
        const newMemo = {
          id: `memo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          title,
          content,
          creator: agentName || 'assistant',
          updater: agentName || 'assistant',
          targetAudiences: Array.from(targetAudiences)
        };
        saveMemo(newMemo, owner);
        return { success: true, message: `Memo '${title}' created.` };
      }
    },
  });
};
