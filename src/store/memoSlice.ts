import { createSignal } from 'solid-js';
import type { UserMemo } from './types';

export const [userMemos, setUserMemos] = createSignal<UserMemo[]>([]);
export const [memoTotalCount, setMemoTotalCount] = createSignal<number>(0);
export const [memoCurrentPage, setMemoCurrentPage] = createSignal<number>(1);
export const [memoFilterAudiences, setMemoFilterAudiences] = createSignal<string>('');
export const memoPageSize = 10;

