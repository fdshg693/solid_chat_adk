import { createSignal } from 'solid-js';
import { getAuthKey } from './authSlice';

export const getInitialApiKey = () => localStorage.getItem(getAuthKey('gemini_api_key')) || '';
export const getInitialTavilyApiKey = () => localStorage.getItem(getAuthKey('tavily_api_key')) || '';
export const getInitialModel = () => localStorage.getItem(getAuthKey('gemini_model')) || 'gemini-2.5-flash';
export const getInitialInstruction = () => localStorage.getItem(getAuthKey('gemini_system_instruction')) || 'You are a helpful and concise AI assistant. Address the user directly.';

export const [apiKey, setApiKey] = createSignal(getInitialApiKey());
export const [tempKey, setTempKey] = createSignal(getInitialApiKey());

export const [tavilyApiKey, setTavilyApiKey] = createSignal(getInitialTavilyApiKey());
export const [tempTavilyKey, setTempTavilyKey] = createSignal(getInitialTavilyApiKey());

export const [model, setModel] = createSignal(getInitialModel());

export const [instruction, setInstruction] = createSignal(getInitialInstruction());
