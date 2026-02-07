import { supabase } from "@/integrations/supabase/client";

export interface QueueEntry {
  id: string;
  table: 'expenses' | 'income';
  data: Record<string, any>;
  created_at: string;
}

const STORAGE_KEY = 'agri_offline_queue';

function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function addToQueue(table: 'expenses' | 'income', data: Record<string, any>): QueueEntry {
  const entry: QueueEntry = {
    id: generateId(),
    table,
    data,
    created_at: new Date().toISOString(),
  };
  const queue = getQueue();
  queue.push(entry);
  saveQueue(queue);
  return entry;
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter(e => e.id !== id);
  saveQueue(queue);
}

export function getQueueCount(): number {
  return getQueue().length;
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const { error } = await (supabase.from(entry.table) as any).insert([entry.data]);
      if (error) {
        failed++;
      } else {
        removeFromQueue(entry.id);
        synced++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
