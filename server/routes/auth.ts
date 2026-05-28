import { Hono } from 'hono';
import crypto from 'node:crypto';
import { createUser, getUserByName, type DBUser } from '../db';

const authApp = new Hono();

// Helper to hash password
const hashPassword = (pw: string): string => {
  return crypto.createHash('sha256').update(pw).digest('hex');
};

// Register endpoint
authApp.post('/register', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { username, password, role, avatar } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return c.json({ error: 'Username is required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return c.json({ error: 'Password is required' }, 400);
    }

    const trimmedUsername = username.trim();
    
    // Check uniqueness
    const existing = getUserByName(trimmedUsername);
    if (existing) {
      return c.json({ error: 'すでに同一のユーザー名が存在します。' }, 400);
    }

    const newUser: DBUser = {
      username: trimmedUsername,
      password: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'user',
      avatar: avatar || '👤'
    };

    createUser(newUser);

    return c.json({
      success: true,
      user: {
        username: newUser.username,
        role: newUser.role,
        avatar: newUser.avatar
      }
    }, 201);
  } catch (error: any) {
    console.error('[Auth API] Error in registration:', error);
    return c.json({ error: 'Failed to register user' }, 500);
  }
});

// Login endpoint
authApp.post('/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    const trimmedUsername = username.trim();
    const user = getUserByName(trimmedUsername);
    if (!user) {
      return c.json({ error: 'ユーザー名またはパスワードが正しくありません。' }, 401);
    }

    const hashed = hashPassword(password);
    if (user.password !== hashed) {
      return c.json({ error: 'ユーザー名またはパスワードが正しくありません。' }, 401);
    }

    return c.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    console.error('[Auth API] Error in login:', error);
    return c.json({ error: 'Failed to authenticate user' }, 500);
  }
});

export { authApp };
