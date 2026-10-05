import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ApprovalItem, MorningBriefing, SourceEventEnvelope, TaskRun } from "../contracts/index.ts";

// Durable single-owner store. One JSON document, written atomically (tmp + rename) and serialised
// through a promise queue. Holds no customer personal data: orders keep IDs, amounts and statuses only.

export interface OrderRecord {
  id: string;
  name: string;
  processedAt: string;
  updatedAt: string;
  currency: string;
  totalMinor: number;
  shippingMinor: number | null;
  financialStatus: string;
  fulfillmentStatus: string;
  cancelled: boolean;
}

export interface SyncState {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  /** updatedAt high-water mark for incremental sync. */
  cursor: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  type: string;
  actor: "owner" | "system" | "shopify";
  correlationId: string;
  detail: string;
}

export interface StoreData {
  version: 1;
  orders: Record<string, OrderRecord>;
  events: SourceEventEnvelope[];
  deliveries: string[];
  sync: Record<string, SyncState>;
  reviews: { current: ApprovalItem[]; originals: ApprovalItem[] };
  audit: AuditEntry[];
  run: TaskRun | null;
  briefing: MorningBriefing | null;
}

const LIMITS = { events: 200, deliveries: 2000, audit: 2000 };

export const emptyStore = (): StoreData => ({
  version: 1, orders: {}, events: [], deliveries: [], sync: {}, reviews: { current: [], originals: [] }, audit: [], run: null, briefing: null,
});

export const emptySync = (): SyncState => ({ lastAttemptAt: null, lastSuccessAt: null, lastError: null, consecutiveFailures: 0, cursor: null });

export interface Store {
  read(): Promise<StoreData>;
  update<T>(fn: (data: StoreData) => T): Promise<T>;
}

function trim(data: StoreData) {
  data.events = data.events.slice(0, LIMITS.events);
  data.deliveries = data.deliveries.slice(-LIMITS.deliveries);
  data.audit = data.audit.slice(-LIMITS.audit);
}

export function createMemoryStore(initial = emptyStore()): Store {
  let data = structuredClone(initial);
  let queue = Promise.resolve();
  return {
    async read() { await queue; return structuredClone(data); },
    update(fn) {
      const next = queue.then(() => { const draft = structuredClone(data); const out = fn(draft); trim(draft); data = draft; return out; });
      queue = next.then(() => undefined, () => undefined);
      return next;
    },
  };
}

export function createFileStore(dir: string): Store {
  const file = path.join(dir, "jarvis-store.json");
  let cache: StoreData | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  const load = async () => {
    if (cache) return cache;
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as StoreData;
      cache = parsed.version === 1 ? { ...emptyStore(), ...parsed } : emptyStore();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; // never silently replace a corrupt store
      cache = emptyStore();
    }
    return cache;
  };
  return {
    async read() { await queue; return structuredClone(await load()); },
    update(fn) {
      const next = queue.then(async () => {
        const draft = structuredClone(await load());
        const out = fn(draft);
        trim(draft);
        await mkdir(dir, { recursive: true });
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(draft), { mode: 0o600 });
        await rename(tmp, file);
        cache = draft;
        return out;
      });
      queue = next.catch(() => undefined);
      return next;
    },
  };
}

export function appendAudit(data: StoreData, entry: Omit<AuditEntry, "id" | "at">, now = new Date()) {
  data.audit.push({ id: crypto.randomUUID(), at: now.toISOString(), ...entry });
}
