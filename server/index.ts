import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chatApp } from './routes/chat';
import { memosApp } from './routes/memos';

const app = new Hono();

app.use('*', cors());

// Expose a simple health check or base endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// Primary endpoints
app.route('/api/chat', chatApp);
app.route('/api/memos', memosApp);

const port = Number(process.env.PORT) || 3001;
console.log(`[Backend] Hono server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
