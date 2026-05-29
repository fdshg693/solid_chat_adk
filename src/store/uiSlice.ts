import { createSignal } from 'solid-js';
import { getAuthKey } from './authSlice';

export const [currentTab, setCurrentTab] = createSignal<'chat' | 'agents' | 'settings' | 'memos'>(
  localStorage.getItem(getAuthKey('gemini_api_key')) ? 'chat' : 'settings'
);

export const [loading, setLoading] = createSignal(false);
export const [errorMessage, setErrorMessage] = createSignal('');
export const [userInput, setUserInput] = createSignal('');

export let scrollerRef: HTMLDivElement | undefined;
export const setScrollerRef = (ref: HTMLDivElement | undefined) => { scrollerRef = ref; };

export const scrollToBottom = () => {
  setTimeout(() => {
    if (scrollerRef) {
      scrollerRef.scrollTop = scrollerRef.scrollHeight;
    }
  }, 50);
};
