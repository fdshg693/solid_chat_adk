import { createSignal } from 'solid-js';
import type { Agent } from './types';
import { getAuthKey } from './authSlice';

export const [agents, setAgents] = createSignal<Agent[]>([]);
export const [selectedAgentId, setSelectedAgentId] = createSignal(localStorage.getItem(getAuthKey('active_agent_id')) || '');
