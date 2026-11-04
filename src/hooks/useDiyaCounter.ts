'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ReadState = 'loading' | 'ready' | 'offline';
type WriteState = 'idle' | 'syncing' | 'pending' | 'saved';

async function readCount(response: Response): Promise<number> {
  if (!response.ok) throw new Error('Counter unavailable');
  const { count } = await response.json();
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid counter response');
  return count;
}

export function useDiyaCounter(active: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const [readState, setReadState] = useState<ReadState>('loading');
  const [writeState, setWriteState] = useState<WriteState>('idle');
  const eventId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const saved = useRef(false);
  const attempts = useRef(0);
  const refreshCount = useRef<() => Promise<void>>(async () => {});

  // An older GET must not overwrite the total returned by a completed increment.
  const acceptCount = useCallback((next: number) => {
    setCount(previous => previous === null ? next : Math.max(previous, next));
    setReadState('ready');
  }, []);

  const recordLight = useCallback(async (id?: string) => {
    if (id && !eventId.current) eventId.current = id;
    if (saved.current) { await refreshCount.current(); return; }
    if (!eventId.current || inFlight.current) return;
    inFlight.current = true;
    attempts.current += 1;
    setWriteState('syncing');
    try {
      const response = await fetch('/api/diyas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: eventId.current }),
        signal: AbortSignal.timeout(10000),
      });
      acceptCount(await readCount(response));
      saved.current = true;
      setWriteState('saved');
    } catch {
      setWriteState('pending');
    } finally {
      inFlight.current = false;
    }
  }, [acceptCount]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      if (document.hidden || controller) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        const response = await fetch('/api/diyas', { cache: 'no-store', signal: controller.signal });
        const next = await readCount(response);
        if (!disposed) acceptCount(next);
      } catch {
        if (!disposed) setReadState('offline');
      } finally {
        clearTimeout(timeout);
        controller = undefined;
      }
    };
    refreshCount.current = refresh;
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', visible);
    return () => {
      disposed = true;
      refreshCount.current = async () => {};
      controller?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', visible);
    };
  }, [active, acceptCount]);

  useEffect(() => {
    if (writeState !== 'pending') return;
    const retry = () => { if (!document.hidden && navigator.onLine) void recordLight(); };
    // Bounded automatic retries reuse the same UUID, including after a lost response.
    const timer = attempts.current < 3 ? setTimeout(retry, attempts.current * 2000) : undefined;
    window.addEventListener('online', retry);
    return () => { clearTimeout(timer); window.removeEventListener('online', retry); };
  }, [writeState, recordLight]);

  const counterState = writeState === 'pending' ? 'pending'
    : writeState === 'syncing' ? 'syncing' : readState;
  return { count, counterState, recordLight };
}
