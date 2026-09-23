"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type QueueItem = { id: string; table: string; payload: Record<string, unknown>; timestamp: string; status: "pending" | "synced" };
const key = "fd_pending_sync";

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(key) ?? "[]") as QueueItem[];
}

function writeQueue(items: QueueItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function useOfflineQueue() {
  const [pending, setPending] = useState(0);
  const [message, setMessage] = useState("");
  const sync = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const items = readQueue().filter((item) => item.status === "pending");
    if (!navigator.onLine || !items.length) {
      setPending(items.length);
      return;
    }
    let synced = 0;
    for (const item of items) {
      const { error } = await supabase.from(item.table).upsert(item.payload);
      if (!error) synced += 1;
      else break;
    }
    const remaining = readQueue().slice(synced);
    writeQueue(remaining);
    setPending(remaining.length);
    if (synced) setMessage(`Synced ${synced} records`);
  }, []);

  const enqueue = useCallback(async (table: "student_attendance" | "teacher_attendance" | "employee_attendance", payload: Record<string, unknown>) => {
    const item: QueueItem = { id: crypto.randomUUID(), table, payload, timestamp: new Date().toISOString(), status: "pending" };
    writeQueue([...readQueue(), item]);
    setPending((value) => value + 1);
    if (navigator.onLine) await sync();
  }, [sync]);

  useEffect(() => {
    void sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [sync]);

  return { enqueue, pending, message };
}
