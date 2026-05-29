import { createSignal } from 'solid-js';
import { getAuthKey, authUsername, authRole, authAvatar } from './authSlice';
import type { Persona } from './types';
import { DEFAULT_PERSONAS } from './types';

export const getInitialPersonas = (): Persona[] => {
  let saved = localStorage.getItem(getAuthKey('chat_personas'));
  let usingLegacy = false;
  if (!saved) {
    saved = localStorage.getItem(getAuthKey('chat_users'));
    usingLegacy = true;
  }
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (usingLegacy) {
          localStorage.setItem(getAuthKey('chat_personas'), saved);
          localStorage.removeItem(getAuthKey('chat_users'));
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse personas', e);
    }
  }
  const defaultPersonas: Persona[] = [];
  const name = authUsername();
  if (name) {
    defaultPersonas.push({
      id: 'u-1',
      name,
      role: (authRole() as 'admin' | 'user') || 'user',
      avatar: authAvatar() || '👤'
    });
    if (authRole() === 'admin') {
      defaultPersonas.push({ id: 'u-2', name: 'assistant', role: 'user', avatar: '🤖' });
    }
  } else {
    defaultPersonas.push(...DEFAULT_PERSONAS);
  }
  localStorage.setItem(getAuthKey('chat_personas'), JSON.stringify(defaultPersonas));
  return defaultPersonas;
};

export const getInitialActivePersona = (initialP: Persona[]): Persona => {
  let savedId = localStorage.getItem(getAuthKey('active_persona_id'));
  let usingLegacy = false;
  if (!savedId) {
    savedId = localStorage.getItem(getAuthKey('active_user_id'));
    usingLegacy = true;
  }

  if (savedId) {
    const found = initialP.find(p => p.id === savedId);
    if (found) {
      if (usingLegacy) {
        localStorage.setItem(getAuthKey('active_persona_id'), savedId);
        localStorage.removeItem(getAuthKey('active_user_id'));
      }
      return found;
    }
  }
  const fallback = initialP[0] || DEFAULT_PERSONAS[0];
  localStorage.setItem(getAuthKey('active_persona_id'), fallback.id);
  return fallback;
};

const initialPersonas = getInitialPersonas();
const initialActivePersona = getInitialActivePersona(initialPersonas);

export const [personas, setPersonas] = createSignal<Persona[]>(initialPersonas);
export const [activePersona, setActivePersona] = createSignal<Persona>(initialActivePersona);
