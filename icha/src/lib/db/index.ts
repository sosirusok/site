/**
 * DB 접근 계층.
 *  - DATABASE_URL 이 있으면 Postgres(pg Pool) — 운영(Supabase 등)
 *  - 없으면 PGlite(파일 DB, ./.data/pg) — 로컬 개발/테스트
 * 두 경우 모두 같은 SQL($1, $2 자리표시자)을 쓴다.
 */
import { ensureSchema } from "./schema";

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

export type Driver = Queryable & {
  /** 여러 문장을 한 번에 실행 (스키마 생성용) */
  exec(text: string): Promise<void>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
};

type GlobalWithDb = typeof globalThis & { __ichaDb?: Promise<Driver> };

async function createPgDriver(url: string): Promise<Driver> {
  const { Pool } = await import("pg");
  // DATABASE_CA 에 Supabase 가 제공하는 CA 인증서(PEM)를 넣으면 서버 인증서를 검증한다. 없으면 암호화만 하고 검증은 건너뛴다.
  const ca = process.env.DATABASE_CA?.trim();
  const pool = new Pool({
    connectionString: url,
    max: 4,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : ca ? { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true } : { rejectUnauthorized: false },
  });
  const q = async <T extends Row>(text: string, params?: unknown[]) => {
    const r = await pool.query(text, params as never[]);
    return r.rows as T[];
  };
  return {
    query: q,
    async exec(text) {
      await pool.query(text);
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn({
          async query<T extends Row>(text: string, params?: unknown[]) {
            const r = await client.query(text, params as never[]);
            return r.rows as T[];
          },
        });
        await client.query("COMMIT");
        return out;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function createPgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const path = await import("node:path");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pg");
  const db = process.env.PGLITE_MEMORY === "1" ? new PGlite() : new PGlite(dir);
  await db.waitReady;
  const wrap = (exec: { query: (t: string, p?: unknown[]) => Promise<{ rows: unknown[] }> }): Queryable => ({
    async query<T extends Row>(text: string, params?: unknown[]) {
      const r = await exec.query(text, params);
      return r.rows as T[];
    },
  });
  const base = wrap(db);
  return {
    query: base.query,
    async exec(text) {
      await db.exec(text);
    },
    tx(fn) {
      return db.transaction((t) => fn(wrap(t)));
    },
  };
}

async function boot(): Promise<Driver> {
  const url = process.env.DATABASE_URL?.trim();
  const driver = url ? await createPgDriver(url) : await createPgliteDriver();
  await ensureSchema(driver);
  return driver;
}

export function getDb(): Promise<Driver> {
  const g = globalThis as GlobalWithDb;
  if (!g.__ichaDb) {
    g.__ichaDb = boot().catch((e) => {
      g.__ichaDb = undefined;
      throw e;
    });
  }
  return g.__ichaDb;
}

export async function query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]> {
  const db = await getDb();
  return db.query<T>(text, params);
}

export async function one<T extends Row = Row>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.tx(fn);
}

/** 드라이버별 bytea / timestamptz 표현 차이를 흡수한다. */
export function toBuffer(v: unknown): Buffer | null {
  if (v == null) return null;
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) return Buffer.from(v);
  if (typeof v === "string" && v.startsWith("\\x")) return Buffer.from(v.slice(2), "hex");
  return null;
}

export function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
