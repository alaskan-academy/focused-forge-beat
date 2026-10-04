/**
 * In-memory stand-in for the Supabase client, enough for page and component tests:
 * reads return table rows (filtered by eq), writes are recorded in `calls`.
 */
type Row = Record<string, unknown>;

export interface FakeCall {
  op: 'insert' | 'update' | 'delete' | 'upsert';
  table: string;
  payload?: unknown;
  filters: [string, unknown][];
}

/**
 * `mirror` lists tables whose writes are also applied to another table (e.g. tasks → tasks_with_time),
 * so reads after a write see the change.
 */
export function createFakeSupabase(tables: Record<string, Row[]>, mirror: Record<string, string> = { tasks: 'tasks_with_time' }) {
  const calls: FakeCall[] = [];

  const applyWrite = (call: FakeCall) => {
    for (const name of [call.table, mirror[call.table]].filter(Boolean) as string[]) {
      const list = tables[name] || (tables[name] = []);
      const matches = (r: Row) => call.filters.every(([k, v]) => (r[k] ?? null) === v);
      if (call.op === 'insert') list.unshift({ id: `new-${calls.length}`, created_at: new Date().toISOString(), ...(call.payload as Row) });
      if (call.op === 'update' || call.op === 'upsert') list.forEach((r, i) => { if (matches(r)) list[i] = { ...r, ...(call.payload as Row) }; });
      if (call.op === 'delete') tables[name] = list.filter((r) => !matches(r));
    }
  };

  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    const notNull: string[] = [];
    let op: FakeCall['op'] | 'select' = 'select';
    let payload: unknown;

    const rows = () => (tables[table] || []).filter((r) =>
      filters.every(([k, v]) => (r[k] ?? null) === v) && notNull.every((k) => r[k] != null));
    const result = () => {
      if (op !== 'select') {
        const call: FakeCall = { op, table, payload, filters: [...filters] };
        calls.push(call);
        applyWrite(call);
        return { data: op === 'insert' ? tables[table][0] : null, error: null };
      }
      return { data: rows(), error: null };
    };

    const api = {
      select: () => api,
      eq: (k: string, v: unknown) => { filters.push([k, v]); return api; },
      is: (k: string, v: unknown) => { filters.push([k, v]); return api; },
      // Only `.not(column, 'is', null)` is used by the app
      not: (k: string) => { notNull.push(k); return api; },
      gte: () => api,
      order: () => api,
      limit: () => api,
      insert: (p: unknown) => { op = 'insert'; payload = p; return api; },
      update: (p: unknown) => { op = 'update'; payload = p; return api; },
      upsert: (p: unknown) => { op = 'upsert'; payload = p; return api; },
      delete: () => { op = 'delete'; return api; },
      single: async () => {
        const r = result();
        return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null };
      },
      maybeSingle: async () => {
        const r = result();
        return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null };
      },
      then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
        try {
          resolve(result());
        } catch (e) {
          reject?.(e);
        }
      },
    };
    return api;
  };

  const session = { user: { id: 'user-1', email: 'teste@example.com' } };
  const client = {
    from,
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({}),
      signInWithOtp: async () => ({ error: null }),
    },
  };

  return { client, calls };
}
