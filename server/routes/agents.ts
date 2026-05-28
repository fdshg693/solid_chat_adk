import { Hono } from 'hono';
import { getAllAgents, getAgentById, saveAgent, deleteAgent, type Agent } from '../db';

const agentsApp = new Hono();

agentsApp.get('/', (c) => {
  try {
    const owner = c.req.header('X-User-Identity') || 'admin';
    const agents = getAllAgents(owner);
    return c.json(agents);
  } catch (error: any) {
    console.error('[Agents API] Error getting agents:', error);
    return c.json({ error: error.message }, 500);
  }
});

agentsApp.post('/', async (c) => {
  try {
    const owner = c.req.header('X-User-Identity') || 'admin';
    const body = await c.req.json();
    const { id, name, systemPrompt, avatar } = body;
    
    if (!id || !name || !systemPrompt) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const newAgent: Agent = { id, name, systemPrompt, avatar: avatar || '🤖', owner };
    saveAgent(newAgent, owner);
    return c.json({ success: true, agent: newAgent });
  } catch (error: any) {
    console.error('[Agents API] Error creating agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

agentsApp.put('/:id', async (c) => {
  try {
    const owner = c.req.header('X-User-Identity') || 'admin';
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, systemPrompt, avatar } = body;
    
    const existing = getAgentById(id, owner);
    if (!existing) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    const updatedAgent: Agent = { 
      id, 
      name: name ?? existing.name, 
      systemPrompt: systemPrompt ?? existing.systemPrompt,
      avatar: avatar ?? existing.avatar,
      owner
    };
    
    saveAgent(updatedAgent, owner);
    return c.json({ success: true, agent: updatedAgent });
  } catch (error: any) {
    console.error('[Agents API] Error updating agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

agentsApp.delete('/:id', (c) => {
  try {
    const owner = c.req.header('X-User-Identity') || 'admin';
    const id = c.req.param('id');
    deleteAgent(id, owner);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Agents API] Error deleting agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { agentsApp };
