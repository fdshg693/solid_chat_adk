import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { getMemosPaginated, saveMemo, deleteMemo, getMemoById, jwtSecret } from '../db';
import { sessionContextMiddleware, SessionContext } from '../context';
import crypto from 'node:crypto';

const memosApp = new Hono();

memosApp.use('*', jwt({ secret: jwtSecret, alg: 'HS256' }));
memosApp.use('*', sessionContextMiddleware);

memosApp.get('/', (c) => {
  try {
    const { owner, allowedAudiences, capabilities } = c.get('sessionContext') as SessionContext;
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    
    let audiencesToFetch = allowedAudiences;

    // Clean rule: Use capability to determine if audience filtering can be overridden
    if (capabilities.canSpecifyMemoAudience) {
      const requestedAudiences = c.req.query('audiences');
      if (requestedAudiences === '*') {
        audiencesToFetch = []; // Empty array means "all" in our DB logic
      } else if (requestedAudiences) {
        audiencesToFetch = requestedAudiences.split(',').map(s => s.trim());
      }
    }

    const result = getMemosPaginated(owner, page, limit, audiencesToFetch);
    return c.json(result);
  } catch (error: any) {
    console.error('[Backend] Error fetching memos:', error);
    return c.json({ error: 'Failed to fetch memos' }, 500);
  }
});

memosApp.post('/', async (c) => {
  try {
    const { owner, allowedAudiences, activePersonaName, agentName } = c.get('sessionContext') as SessionContext;
    const body = await c.req.json();
    if (!body.title) {
      return c.json({ error: 'Title is required' }, 400);
    }
    
    const id = body.id || `memo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Auto-populate target audiences if not provided
    let targetAudiences = body.targetAudiences;
    if (!targetAudiences || targetAudiences.length === 0) {
      targetAudiences = allowedAudiences;
    }

    const newMemo = {
      id,
      title: body.title,
      content: body.content || '',
      creator: body.creator || activePersonaName || 'admin',
      updater: body.updater || activePersonaName || 'admin',
      owner,
      targetAudiences
    };
    
    saveMemo(newMemo, owner);
    return c.json(newMemo, 201);
  } catch (error: any) {
    console.error('[Backend] Error creating memo:', error);
    return c.json({ error: 'Failed to create memo' }, 500);
  }
});

memosApp.put('/:id', async (c) => {
  try {
    const { owner, allowedAudiences, activePersonaName } = c.get('sessionContext') as SessionContext;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = getMemoById(id, owner);
    if (!existing) {
      return c.json({ error: 'Memo not found' }, 404);
    }
    
    const updatedMemo = {
      id,
      title: body.title !== undefined ? body.title : existing.title,
      content: body.content !== undefined ? body.content : existing.content,
      creator: body.creator !== undefined ? body.creator : existing.creator,
      updater: body.updater !== undefined ? body.updater : (activePersonaName || 'admin'),
      owner,
      targetAudiences: body.targetAudiences !== undefined ? body.targetAudiences : existing.targetAudiences
    };
    
    saveMemo(updatedMemo, owner);
    return c.json(updatedMemo);
  } catch (error: any) {
    console.error('[Backend] Error updating memo:', error);
    return c.json({ error: 'Failed to update memo' }, 500);
  }
});

memosApp.delete('/:id', (c) => {
  try {
    const { owner } = c.get('sessionContext') as SessionContext;
    const id = c.req.param('id');
    const existing = getMemoById(id, owner);
    if (!existing) {
      return c.json({ error: 'Memo not found' }, 404);
    }
    
    deleteMemo(id, owner);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Backend] Error deleting memo:', error);
    return c.json({ error: 'Failed to delete memo' }, 500);
  }
});

export { memosApp };
