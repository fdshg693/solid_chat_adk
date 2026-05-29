import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../app.db');

export const db = new DatabaseSync(dbPath);

export const jwtSecret = process.env.JWT_SECRET || 'ultraviolet-super-secure-key-2026';

// Enable foreign key support
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    avatar TEXT
  );
  CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    creator TEXT,
    updater TEXT,
    owner TEXT
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
    avatar TEXT,
    owner TEXT
  );
`);

try { db.exec("ALTER TABLE memos ADD COLUMN creator TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE memos ADD COLUMN updater TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE memos ADD COLUMN owner TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE agents ADD COLUMN avatar TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE agents ADD COLUMN owner TEXT;"); } catch (e) {}

// Check and seed default users
try {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = checkStmt.get() as { count: number };
  if (result.count === 0) {
    console.log('[Backend DB] Seeding default users (admin, user1)...');
    const insertStmt = db.prepare('INSERT INTO users (username, password, role, avatar) VALUES (?, ?, ?, ?)');
    const hashPassword = (pw: string) => crypto.createHash('sha256').update(pw).digest('hex');
    insertStmt.run('admin', hashPassword('admin'), 'admin', '👑');
    insertStmt.run('user1', hashPassword('user1'), 'user', '👤');
  }
} catch (e) {
  console.error('[Backend DB] Failed to seed users:', e);
}


export interface DBUser {
  username: string;
  password?: string;
  role: string;
  avatar?: string;
}

export const createUser = (user: DBUser): void => {
  const stmt = db.prepare('INSERT INTO users (username, password, role, avatar) VALUES (?, ?, ?, ?)');
  stmt.run(user.username, user.password || '', user.role, user.avatar || '👤');
};

export const getUserByName = (username: string): DBUser | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as unknown as DBUser | undefined;
};

export interface UserMemo {
  id: string;
  title: string;
  content: string;
  creator?: string;
  updater?: string;
  owner?: string;
  targetAudiences?: string[];
}

interface UserMemoRow {
  id: string;
  title: string;
  content: string;
  creator: string | null;
  updater: string | null;
  owner: string | null;
}

const mapRowToMemo = (row: UserMemoRow): UserMemo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  creator: row.creator || undefined,
  updater: row.updater || undefined,
  owner: row.owner || undefined,
  targetAudiences: undefined
});

const getAudiencesForMemo = (memoId: string): string[] => {
  const stmt = db.prepare('SELECT username FROM memo_audiences WHERE memo_id = ?');
  const rows = stmt.all(memoId) as { username: string }[];
  return rows.map(r => r.username);
};

export const getAllMemos = (owner: string): UserMemo[] => {
  const stmt = db.prepare('SELECT * FROM memos WHERE owner = ?');
  const rows = stmt.all(owner) as unknown as UserMemoRow[];
  return rows.map(row => {
    const memo = mapRowToMemo(row);
    memo.targetAudiences = getAudiencesForMemo(row.id);
    return memo;
  });
};

export const getMemosPaginated = (
  owner: string,
  page: number,
  limit: number,
  persona?: string
): { memos: UserMemo[]; total: number } => {
  const offset = (page - 1) * limit;

  let total = 0;
  let rows: UserMemoRow[] = [];

  if (persona) {
    // Get total matching memos filtered by persona audience
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM memos 
      WHERE owner = ? 
        AND id IN (SELECT memo_id FROM memo_audiences WHERE username = ?)
    `);
    const totalResult = countStmt.get(owner, persona) as { count: number };
    total = totalResult ? totalResult.count : 0;

    // Get paginated memos filtered by persona audience ordered from newest to oldest
    const stmt = db.prepare(`
      SELECT * FROM memos 
      WHERE owner = ? 
        AND id IN (SELECT memo_id FROM memo_audiences WHERE username = ?) 
      ORDER BY id DESC LIMIT ? OFFSET ?
    `);
    rows = stmt.all(owner, persona, limit, offset) as unknown as UserMemoRow[];
  } else {
    // Get total matching memos
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM memos WHERE owner = ?');
    const totalResult = countStmt.get(owner) as { count: number };
    total = totalResult ? totalResult.count : 0;

    // Get paginated memos ordered from newest to oldest
    const stmt = db.prepare('SELECT * FROM memos WHERE owner = ? ORDER BY id DESC LIMIT ? OFFSET ?');
    rows = stmt.all(owner, limit, offset) as unknown as UserMemoRow[];
  }

  const memos = rows.map(row => {
    const memo = mapRowToMemo(row);
    memo.targetAudiences = getAudiencesForMemo(row.id);
    return memo;
  });

  return { memos, total };
};

export const getMemoById = (id: string, owner: string): UserMemo | undefined => {
  const stmt = db.prepare('SELECT * FROM memos WHERE id = ? AND owner = ?');
  const row = stmt.get(id, owner) as unknown as UserMemoRow | undefined;
  if (!row) return undefined;
  const memo = mapRowToMemo(row);
  memo.targetAudiences = getAudiencesForMemo(row.id);
  return memo;
};

export const getMemoByTitle = (title: string, owner: string): UserMemo | undefined => {
  const stmt = db.prepare('SELECT * FROM memos WHERE title = ? AND owner = ?');
  const row = stmt.get(title, owner) as unknown as UserMemoRow | undefined;
  if (!row) return undefined;
  const memo = mapRowToMemo(row);
  memo.targetAudiences = getAudiencesForMemo(row.id);
  return memo;
};

export const saveMemo = (memo: UserMemo, owner: string): void => {
  const existing = getMemoById(memo.id, owner);
  
  if (existing) {
    const stmt = db.prepare('UPDATE memos SET title = ?, content = ?, creator = ?, updater = ?, owner = ? WHERE id = ?');
    stmt.run(memo.title, memo.content, memo.creator || null, memo.updater || null, owner, memo.id);
  } else {
    const stmt = db.prepare('INSERT INTO memos (id, title, content, creator, updater, owner) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(memo.id, memo.title, memo.content, memo.creator || null, memo.updater || null, owner);
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

export const deleteMemo = (id: string, owner: string): void => {
  const stmt = db.prepare('DELETE FROM memos WHERE id = ? AND owner = ?');
  stmt.run(id, owner);
};

export const getMemosForAudiences = (owner: string, audiences: string[]): UserMemo[] => {
  if (audiences.length === 0) return [];
  const placeholders = audiences.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT * FROM memos 
    WHERE owner = ? 
      AND id IN (SELECT memo_id FROM memo_audiences WHERE username IN (${placeholders}))
  `);
  const rows = stmt.all(owner, ...audiences) as unknown as UserMemoRow[];
  return rows.map(row => {
    const memo = mapRowToMemo(row);
    memo.targetAudiences = getAudiencesForMemo(row.id);
    return memo;
  });
};

export const getMemoByTitleForAudiences = (
  title: string,
  owner: string,
  audiences: string[]
): UserMemo | undefined => {
  if (audiences.length === 0) return undefined;
  const placeholders = audiences.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT * FROM memos 
    WHERE title = ? AND owner = ? 
      AND id IN (SELECT memo_id FROM memo_audiences WHERE username IN (${placeholders}))
  `);
  const row = stmt.get(title, owner, ...audiences) as unknown as UserMemoRow | undefined;
  if (!row) return undefined;
  const memo = mapRowToMemo(row);
  memo.targetAudiences = getAudiencesForMemo(row.id);
  return memo;
};

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  avatar?: string;
  owner?: string;
}

export const getAllAgents = (owner: string): Agent[] => {
  const stmt = db.prepare('SELECT * FROM agents WHERE owner IS NULL OR owner = ?');
  return stmt.all(owner) as unknown as Agent[];
};

export const getAgentById = (id: string, owner: string): Agent | undefined => {
  const stmt = db.prepare('SELECT * FROM agents WHERE id = ? AND (owner IS NULL OR owner = ?)');
  return stmt.get(id, owner) as unknown as Agent | undefined;
};

export const saveAgent = (agent: Agent, owner: string): void => {
  const existing = getAgentById(agent.id, owner);
  if (existing) {
    const stmt = db.prepare('UPDATE agents SET name = ?, systemPrompt = ?, avatar = ?, owner = ? WHERE id = ?');
    stmt.run(agent.name, agent.systemPrompt, agent.avatar || '🤖', owner, agent.id);
  } else {
    const stmt = db.prepare('INSERT INTO agents (id, name, systemPrompt, avatar, owner) VALUES (?, ?, ?, ?, ?)');
    stmt.run(agent.id, agent.name, agent.systemPrompt, agent.avatar || '🤖', owner);
  }
};

export const deleteAgent = (id: string, owner: string): void => {
  const stmt = db.prepare('DELETE FROM agents WHERE id = ? AND (owner IS NULL OR owner = ?)');
  stmt.run(id, owner);
};
