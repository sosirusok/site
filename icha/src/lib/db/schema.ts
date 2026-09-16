/**
 * 스키마 정의 + 최초 1회 초기화(멱등).
 * supabase/schema.sql 은 이 파일의 SQL과 동일하게 유지한다 (수동 실행용).
 */
import type { Driver, Queryable } from "./index";
import { hashPassword } from "../auth/password";

export const SCHEMA_SQL = `
create table if not exists stores (
  id            text primary key,
  name          text not null,
  short_name    text not null,
  drink         text not null,
  naver_place_id text,
  address       text,
  phone         text,
  biz_no        text,
  sort          int  not null default 0
);

create table if not exists menu_items (
  id          serial primary key,
  store_id    text not null references stores(id),
  name        text not null,
  price       int,
  description text,
  image_path  text,
  image_data  bytea,
  image_mime  text,
  is_gift     boolean not null default false,
  active      boolean not null default true,
  sort        int not null default 0
);
alter table menu_items add column if not exists image_updated_at timestamptz;
create index if not exists menu_items_store_idx on menu_items(store_id, sort);

create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz,
  total_spend   int not null default 0,
  visit_count   int not null default 0,
  tier          text not null default 'none',
  memo          text
);

create table if not exists receipts (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id),
  store_id     text references stores(id),
  status       text not null check (status in ('approved','review','rejected')),
  reasons      text[] not null default '{}',
  image        bytea,
  image_mime   text,
  sha256       text not null,
  dhash        text,
  ocr          jsonb,
  receipt_at   timestamptz,
  amount       int,
  approval_no  text,
  card_last4   text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  text,
  review_note  text,
  coupon_id    uuid
);
create index if not exists receipts_sha_idx on receipts(sha256);
create unique index if not exists receipts_sha_live_uq on receipts(sha256) where status <> 'rejected';
-- 승인번호 유니크는 매장 단위. 카드 승인번호는 단말·카드사별 일련번호라 다른 매장끼리는 같은 8자리가 나올 수 있다. 매장 미확정 건은 제외.
drop index if exists receipts_approval_live_uq;
create unique index if not exists receipts_approval_store_live_uq on receipts(store_id, approval_no) where approval_no is not null and store_id is not null and status <> 'rejected';
create index if not exists receipts_member_idx on receipts(member_id, created_at desc);
create index if not exists receipts_status_idx on receipts(status, created_at desc);
create index if not exists receipts_approval_idx on receipts(approval_no) where approval_no is not null;

create table if not exists coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  member_id     uuid not null references members(id),
  receipt_id    uuid references receipts(id),
  use_store_id  text not null references stores(id),
  menu_item_id  int references menu_items(id),
  menu_name     text not null,
  kind          text not null check (kind in ('side','vip','manual')),
  status        text not null check (status in ('active','used','expired','void')),
  issued_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  used_at       timestamptz,
  used_via      text,
  note          text
);
create index if not exists coupons_member_idx on coupons(member_id, issued_at desc);
create unique index if not exists coupons_receipt_uq on coupons(receipt_id) where receipt_id is not null;

create table if not exists spend_ledger (
  id         serial primary key,
  member_id  uuid not null references members(id),
  store_id   text references stores(id),
  receipt_id uuid references receipts(id),
  amount     int not null,
  at         timestamptz not null default now()
);
create index if not exists spend_ledger_member_idx on spend_ledger(member_id);

create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists admins (
  id         text primary key,
  name       text not null,
  store_id   text references stores(id),
  pw_hash    text not null,
  role       text not null check (role in ('owner','staff')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id     serial primary key,
  at     timestamptz not null default now(),
  actor  text not null,
  action text not null,
  target text,
  meta   jsonb
);

create table if not exists rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);
`;

let ensured: Promise<void> | null = null;

export function ensureSchema(db: Driver): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await db.exec(SCHEMA_SQL);
      await seedStores(db);
      await seedInitialAdmin(db);
      // 기동 때마다 오래된 속도 제한 행을 정리한다 (실패해도 기동은 계속)
      await db.query(`delete from rate_limits where window_start < now() - interval '1 day'`).catch(() => {});
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}

async function seedStores(db: Queryable) {
  const { STORES } = await import("../stores");
  for (const s of STORES) {
    await db.query(
      `insert into stores (id, name, short_name, drink, naver_place_id, address, phone, biz_no, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do update set name=excluded.name, short_name=excluded.short_name, drink=excluded.drink,
         naver_place_id=excluded.naver_place_id, address=excluded.address, phone=excluded.phone, biz_no=excluded.biz_no, sort=excluded.sort`,
      [s.id, s.name, s.shortName, s.drink, s.naverPlaceId, s.address, s.phone, s.bizNo ?? null, s.sort],
    );
    const existing = await db.query<{ n: number }>(`select count(*)::int as n from menu_items where store_id=$1`, [s.id]);
    if ((existing[0]?.n ?? 0) === 0) {
      let i = 0;
      for (const m of s.menu) {
        await db.query(
          `insert into menu_items (store_id, name, price, description, image_path, is_gift, active, sort)
           values ($1,$2,$3,$4,$5,$6,true,$7)`,
          [s.id, m.name, m.price ?? null, m.description ?? null, m.image ?? null, m.gift ?? false, i++],
        );
      }
    } else {
      // 이미 시드된 DB 라도 코드에 사진 경로가 새로 붙은 메뉴는 채워 준다 (관리자가 올린 사진이 있으면 건드리지 않음)
      for (const m of s.menu) {
        if (!m.image) continue;
        await db.query(`update menu_items set image_path=$3 where store_id=$1 and name=$2 and image_path is null and image_data is null`, [s.id, m.name, m.image]);
      }
    }
  }
}

const WEAK_INITIAL_PASSWORDS = new Set(["change-me", "changeme", "admin", "admin1234", "password", "12345678"]);

/**
 * 초기 관리자 계정을 만들지 못한 이유. 약한 ADMIN_INITIAL_PASSWORD 는 계정을 만들지 않을 뿐,
 * 손님 화면(홈·매장·이용 안내)까지 막지 않는다. 이유는 /admin/login 에서만 보여 준다.
 */
let initialAdminNote: string | null = null;

/** /admin 화면에서만 읽는다. 스키마 준비가 끝난 뒤에 호출해야 값이 있다. */
export function initialAdminIssue(): string | null {
  return initialAdminNote;
}

async function seedInitialAdmin(db: Queryable) {
  const rows = await db.query<{ n: number }>(`select count(*)::int as n from admins`);
  if ((rows[0]?.n ?? 0) > 0) {
    initialAdminNote = null;
    return;
  }
  const id = process.env.ADMIN_INITIAL_ID?.trim() || "owner";
  const pw = process.env.ADMIN_INITIAL_PASSWORD?.trim() || "change-me";
  if (process.env.NODE_ENV === "production" && (pw.length < 10 || WEAK_INITIAL_PASSWORDS.has(pw.toLowerCase()))) {
    initialAdminNote =
      "ADMIN_INITIAL_PASSWORD 가 너무 약해 총괄 계정을 만들지 않았습니다. 10자 이상이면서 admin1234·password 같은 흔한 값이 아닌 비밀번호로 다시 띄워 주십시오.";
    console.error(`[icha] ${initialAdminNote}`);
    return;
  }
  const hash = await hashPassword(pw);
  await db.query(
    `insert into admins (id, name, store_id, pw_hash, role) values ($1,$2,null,$3,'owner') on conflict (id) do nothing`,
    [id, "총괄 관리자", hash],
  );
  initialAdminNote = null;
}
