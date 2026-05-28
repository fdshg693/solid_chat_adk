import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../app.db');

export const db = new DatabaseSync(dbPath);

// Enable foreign key support
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    creator TEXT,
    updater TEXT
  );
  CREATE TABLE IF NOT EXISTS memo_audiences (
    memo_id TEXT NOT NULL,
    username TEXT NOT NULL,
    PRIMARY KEY (memo_id, username),
    FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    systemPrompt TEXT NOT NULL,
    avatar TEXT
  );
`);

try { db.exec("ALTER TABLE memos ADD COLUMN creator TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE memos ADD COLUMN updater TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE agents ADD COLUMN avatar TEXT;"); } catch (e) {}


export interface UserMemo {
  id: string;
  title: string;
  content: string;
  creator?: string;
  updater?: string;
  targetAudiences?: string[];
}

interface UserMemoRow {
  id: string;
  title: string;
  content: string;
  creator: string | null;
  updater: string | null;
}

const mapRowToMemo = (row: UserMemoRow): UserMemo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  creator: row.creator || undefined,
  updater: row.updater || undefined,
  targetAudiences: undefined
});

const getAudiencesForMemo = (memoId: string): string[] => {
  const stmt = db.prepare('SELECT username FROM memo_audiences WHERE memo_id = ?');
  const rows = stmt.all(memoId) as { username: string }[];
  return rows.map(r => r.username);
};

export const getAllMemos = (): UserMemo[] => {
  const stmt = db.prepare('SELECT * FROM memos');
  const rows = stmt.all() as unknown as UserMemoRow[];
  return rows.map(row => {
    const memo = mapRowToMemo(row);
    memo.targetAudiences = getAudiencesForMemo(row.id);
    return memo;
  });
};

export const getMemoById = (id: string): UserMemo | undefined => {
  const stmt = db.prepare('SELECT * FROM memos WHERE id = ?');
  const row = stmt.get(id) as unknown as UserMemoRow | undefined;
  if (!row) return undefined;
  const memo = mapRowToMemo(row);
  memo.targetAudiences = getAudiencesForMemo(row.id);
  return memo;
};

export const getMemoByTitle = (title: string): UserMemo | undefined => {
  const stmt = db.prepare('SELECT * FROM memos WHERE title = ?');
  const row = stmt.get(title) as unknown as UserMemoRow | undefined;
  if (!row) return undefined;
  const memo = mapRowToMemo(row);
  memo.targetAudiences = getAudiencesForMemo(row.id);
  return memo;
};

export const saveMemo = (memo: UserMemo): void => {
  const existing = getMemoById(memo.id);
  
  if (existing) {
    const stmt = db.prepare('UPDATE memos SET title = ?, content = ?, creator = ?, updater = ? WHERE id = ?');
    stmt.run(memo.title, memo.content, memo.creator || null, memo.updater || null, memo.id);
  } else {
    const stmt = db.prepare('INSERT INTO memos (id, title, content, creator, updater) VALUES (?, ?, ?, ?, ?)');
    stmt.run(memo.id, memo.title, memo.content, memo.creator || null, memo.updater || null);
  }

  // Save audiences
  const deleteStmt = db.prepare('DELETE FROM memo_audiences WHERE memo_id = ?');
  deleteStmt.run(memo.id);

  if (memo.targetAudiences && memo.targetAudiences.length > 0) {
    const insertStmt = db.prepare('INSERT INTO memo_audiences (memo_id, username) VALUES (?, ?)');
    for (const username of memo.targetAudiences) {
      insertStmt.run(memo.id, username);
    }
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
  avatar?: string;
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
    const stmt = db.prepare('UPDATE agents SET name = ?, systemPrompt = ?, avatar = ? WHERE id = ?');
    stmt.run(agent.name, agent.systemPrompt, agent.avatar || '🤖', agent.id);
  } else {
    const stmt = db.prepare('INSERT INTO agents (id, name, systemPrompt, avatar) VALUES (?, ?, ?, ?)');
    stmt.run(agent.id, agent.name, agent.systemPrompt, agent.avatar || '🤖');
  }
};

export const deleteAgent = (id: string): void => {
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  stmt.run(id);
};
