import { Hono } from 'hono';
import { getAllMemos, saveMemo, deleteMemo, getMemoById } from '../db';
import crypto from 'node:crypto';

const memosApp = new Hono();

memosApp.get('/', (c) => {
  try {
    const memos = getAllMemos();
    return c.json(memos);
  } catch (error: any) {
    console.error('[Backend] Error fetching memos:', error);
    return c.json({ error: 'Failed to fetch memos' }, 500);
  }
});

memosApp.post('/', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.title) {
      return c.json({ error: 'Title is required' }, 400);
    }
    
    const id = body.id || `memo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newMemo = {
      id,
      title: body.title,
      content: body.content || '',
      creator: body.creator,
      updater: body.updater,
      targetAudiences: body.targetAudiences
    };
    
    saveMemo(newMemo);
    return c.json(newMemo, 201);
  } catch (error: any) {
    console.error('[Backend] Error creating memo:', error);
    return c.json({ error: 'Failed to create memo' }, 500);
  }
});

memosApp.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = getMemoById(id);
    if (!existing) {
      return c.json({ error: 'Memo not found' }, 404);
    }
    
    const updatedMemo = {
      id,
      title: body.title !== undefined ? body.title : existing.title,
      content: body.content !== undefined ? body.content : existing.content,
      creator: body.creator !== undefined ? body.creator : existing.creator,
      updater: body.updater !== undefined ? body.updater : existing.updater,
      targetAudiences: body.targetAudiences !== undefined ? body.targetAudiences : existing.targetAudiences
    };
    
    saveMemo(updatedMemo);
    return c.json(updatedMemo);
  } catch (error: any) {
    console.error('[Backend] Error updating memo:', error);
    return c.json({ error: 'Failed to update memo' }, 500);
  }
});

memosApp.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const existing = getMemoById(id);
    if (!existing) {
      return c.json({ error: 'Memo not found' }, 404);
    }
    
    deleteMemo(id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Backend] Error deleting memo:', error);
    return c.json({ error: 'Failed to delete memo' }, 500);
  }
});

export { memosApp };
