import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../memos.db');

export const db = new DatabaseSync(dbPath);

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    systemPrompt TEXT NOT NULL
  );
`);

export interface UserMemo {
  id: string;
  title: string;
  content: string;
}

export const getAllMemos = (): UserMemo[] => {
  const stmt = db.prepare('SELECT * FROM memos');
  return stmt.all() as unknown as UserMemo[];
};

export const getMemoById = (id: string): UserMemo | undefined => {
  const stmt = db.prepare('SELECT * FROM memos WHERE id = ?');
  return stmt.get(id) as unknown as UserMemo | undefined;
};

export const getMemoByTitle = (title: string): UserMemo | undefined => {
  const stmt = db.prepare('SELECT * FROM memos WHERE title = ?');
  return stmt.get(title) as unknown as UserMemo | undefined;
};

export const saveMemo = (memo: UserMemo): void => {
  const existing = getMemoById(memo.id);
  if (existing) {
    const stmt = db.prepare('UPDATE memos SET title = ?, content = ? WHERE id = ?');
    stmt.run(memo.title, memo.content, memo.id);
  } else {
    const stmt = db.prepare('INSERT INTO memos (id, title, content) VALUES (?, ?, ?)');
    stmt.run(memo.id, memo.title, memo.content);
  }
};

export const deleteMemo = (id: string): void => {
  const stmt = db.prepare('DELETE FROM memos WHERE id = ?');
  stmt.run(id);
};

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
}

export const getAllAgents = (): Agent[] => {
  const stmt = db.prepare('SELECT * FROM agents');
  return stmt.all() as unknown as Agent[];
};

export const getAgentById = (id: string): Agent | undefined => {
  const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
  return stmt.get(id) as unknown as Agent | undefined;
};

export const saveAgent = (agent: Agent): void => {
  const existing = getAgentById(agent.id);
  if (existing) {
    const stmt = db.prepare('UPDATE agents SET name = ?, systemPrompt = ? WHERE id = ?');
    stmt.run(agent.name, agent.systemPrompt, agent.id);
  } else {
    const stmt = db.prepare('INSERT INTO agents (id, name, systemPrompt) VALUES (?, ?, ?)');
    stmt.run(agent.id, agent.name, agent.systemPrompt);
  }
};

export const deleteAgent = (id: string): void => {
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  stmt.run(id);
};
