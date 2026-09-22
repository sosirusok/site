-- 이차(二次) 스키마. 앱이 최초 기동 시 자동으로 같은 SQL 을 실행하므로 보통 손으로 돌릴 필요는 없다.
-- Supabase SQL Editor 에서 미리 만들고 싶을 때 이 파일을 실행한다. (생성: npx tsx scripts/export-schema.ts)
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

alter table members add column if not exists adult_verified_at timestamptz;
alter table members add column if not exists identity_key text;
create index if not exists members_identity_key_idx on members(identity_key);

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
