import { Hono } from 'hono';
import { getAllAgents, getAgentById, saveAgent, deleteAgent, type Agent } from '../db';

const agentsApp = new Hono();

agentsApp.get('/', (c) => {
  try {
    const agents = getAllAgents();
    return c.json(agents);
  } catch (error: any) {
    console.error('[Agents API] Error getting agents:', error);
    return c.json({ error: error.message }, 500);
  }
});

agentsApp.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, systemPrompt } = body;
    
    if (!id || !name || !systemPrompt) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const newAgent: Agent = { id, name, systemPrompt };
    saveAgent(newAgent);
    return c.json({ success: true, agent: newAgent });
  } catch (error: any) {
    console.error('[Agents API] Error creating agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

agentsApp.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, systemPrompt } = body;
    
    const existing = getAgentById(id);
    if (!existing) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const updatedAgent: Agent = { 
      id, 
      name: name ?? existing.name, 
      systemPrompt: systemPrompt ?? existing.systemPrompt 
    };
    
    saveAgent(updatedAgent);
    return c.json({ success: true, agent: updatedAgent });
  } catch (error: any) {
    console.error('[Agents API] Error updating agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

agentsApp.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    deleteAgent(id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Agents API] Error deleting agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { agentsApp };
