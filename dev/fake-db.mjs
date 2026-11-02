// LOCAL TEST FAKE DATABASE. Hech qachon functions/ katalogiga kirmaydi va hech
// qanday hisob ma'lumotini saqlamaydi: Supabase client'ining bir qismini
// xotirada taqlid qiladi, shunda routes.mjs haqiqiy marshrutlari tekshiriladi.

const UNIQUE = {
  admins: [['login']],
  doctors: [['phone_key']],
  patients: [['phone_key']],
  diets: [['number', 'doctor_id']],
  push_subs: [['endpoint']],
  push_fires: [['fire_key']],
  task_logs: [['task_id', 'done_date']],
  auth_limiter: [['key']],
  sessions: [['token_digest']],
};

const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

class Query {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.filters = [];
    this.projection = null;
    this.orderColumn = null;
    this.ascending = true;
    this.rowLimit = null;
    this.operation = 'select';
    this.payload = null;
    this.onConflict = null;
  }

  select(columns) {
    this.projection = typeof columns === 'string'
      ? columns.split(',').map((name) => name.trim()).filter(Boolean)
      : null;
    return this;
  }

  eq(column, value) { this.filters.push(({ row }) => row[column] === value); return this; }
  in(column, values) { const set = new Set(values); this.filters.push(({ row }) => set.has(row[column])); return this; }
  order(column, options) { this.orderColumn = column; this.ascending = options?.ascending !== false; return this; }
  limit(value) { this.rowLimit = value; return this; }
  maybeSingle() { return this.limit(1); }

  insert(row) { this.operation = 'insert'; this.payload = row; return this; }
  insertIfAbsent(row, options) {
    this.operation = 'insert';
    this.payload = row;
    this.onConflict = String(options?.onConflict ?? '').split(',').map((name) => name.trim());
    return this;
  }

  update(patch) { this.operation = 'update'; this.payload = patch; return this; }
  delete() { this.operation = 'delete'; return this; }

  matches(row) { return this.filters.every((test) => test({ row })); }

  project(row) {
    if (!this.projection) return clone(row);
    const out = {};
    for (const column of this.projection) if (column in row) out[column] = clone(row[column]);
    return out;
  }

  finish(rows) {
    let list = rows;
    if (this.orderColumn) {
      const key = this.orderColumn;
      list = [...list].sort((a, b) => {
        const left = a[key] ?? '', right = b[key] ?? '';
        if (left === right) return 0;
        return (left < right ? -1 : 1) * (this.ascending ? 1 : -1);
      });
    }
    if (this.rowLimit != null) list = list.slice(0, this.rowLimit);
    return { data: list.map((row) => this.project(row)), error: null, count: list.length };
  }

  async runOnce() {
    const table = this.db.tables[this.table] ?? (this.db.tables[this.table] = []);
    if (this.operation === 'select') return this.finish(table.filter((row) => this.matches(row)));

    if (this.operation === 'insert') {
      const row = clone(this.payload);
      const conflicts = table.filter((existing) => this.conflictsWith(existing, row));
      if (conflicts.length > 0) {
        if (this.onConflict) return { data: [], error: null, count: 0 };
        return { data: null, error: { code: '23505', message: 'duplicate key' }, count: 0 };
      }
      if (this.onConflict && this.onConflict.length > 0) {
        for (const columns of UNIQUE[this.table] ?? []) {
          const clash = table.find((existing) => columns.every((column) => existing[column] === row[column]));
          if (clash) {
            return this.onConflict.join(',') === columns.join(',')
              ? { data: [], error: null, count: 0 }
              : { data: null, error: { code: '23505', message: 'duplicate key' }, count: 0 };
          }
        }
      }
      table.push(row);
      return { data: [this.project(row)], error: null, count: 1 };
    }

    if (this.operation === 'update') {
      const changed = [];
      for (const row of table) {
        if (!this.matches(row)) continue;
        Object.assign(row, clone(this.payload));
        changed.push(row);
      }
      return this.finish(changed);
    }

    const kept = [];
    const removed = [];
    for (const row of table) (this.matches(row) ? removed : kept).push(row);
    this.db.tables[this.table] = kept;
    return this.finish(removed);
  }

  conflictsWith(existing, row) {
    for (const columns of UNIQUE[this.table] ?? []) {
      if (columns.every((column) => existing[column] === row[column])) return true;
    }
    return false;
  }

  then(resolve, reject) {
    this.attempts += 1;
    if (this.attempts > 50) return Promise.reject(new Error('fake db loop')).then(resolve, reject);
    return this.runOnce().then(resolve, reject);
  }

  attempts = 0;
}

export function createFakeDb() {
  const db = { tables: {}, log: [] };
  db.from = (table) => {
    db.log.push(table);
    return new Query(db, table);
  };
  return db;
}
